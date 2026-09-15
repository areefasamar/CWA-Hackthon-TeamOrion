"""
Karachi Transit AI — data-driven transit engine (Phase 1 & 2 contract).

Loads BOTH canonical route datasets (backend/data/*.json), builds an alias
index with sub-landmarks and per-route dictionaries, and answers queries with:
  • exact journey cards (fares straight from the dataset fare tables)
  • clarify prompts (tap chips) for unknown/misspelled stops
  • same-origin/destination detection
  • cross-route detection with name-collision alternates
  • stop lists, timings, fare policies, route info, greetings/help
  • English + Roman-Urdu responses (Urdu-script queries detected too)
No fabricated stops: anything unrecognized comes back as a clarify prompt.
"""

import os
import re
import json
from typing import Dict, Any, Optional, List, Tuple

from services.telemetry import (
    get_telemetry,
    get_disruptions,
    nearest_stop_from_gps,
)

# ---------------------------------------------------------------------------
# Dataset loading
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

ROUTES: List[Dict[str, Any]] = []

def _load_json(name: str) -> Optional[Dict[str, Any]]:
    p = os.path.join(DATA_DIR, name)
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: could not parse {name}: {e}")
    return None

def _load_routes():
    global ROUTES
    ROUTES = []
    for fname in ("sheraz.json", "route1.json"):
        raw = _load_json(fname)
        if not raw:
            continue
        # Normalize both shapes into the canonical RouteRecord
        policy = raw.get("fare_policy") or {}
        fp: Dict[str, Any] = {
            "type": policy.get("type") or ("STAGE_BASED" if raw.get("fare_type") == "STAGE" else "ZONE_BASED"),
            "minimum_fare": policy.get("minimum_fare") or raw.get("short_distance_fare_pkr") or raw.get("flat_fare_pkr"),
            "maximum_fare": policy.get("maximum_fare") or raw.get("long_distance_fare_pkr") or raw.get("flat_fare_pkr"),
            "short_distance_fare": policy.get("short_distance_fare") or raw.get("short_distance_fare_pkr"),
            "long_distance_fare": policy.get("long_distance_fare") or raw.get("long_distance_fare_pkr"),
            "fare_threshold_landmark": policy.get("fare_threshold_landmark") or raw.get("fare_threshold_landmark"),
            "payment_methods": policy.get("payment_methods") or (
                ["CASH_ONLY"] if raw.get("fare_type") == "STAGE" else ["CASH", "SMART_CARD"]
            ),
        }
        hours = raw.get("operating_hours") or {"start": "06:00", "end": "22:00"}
        ROUTES.append({
            "route_id": raw.get("route_id"),
            "route_name": raw.get("route_name"),
            "operator": raw.get("operator"),
            "bus_type": raw.get("bus_type") or raw.get("fleet_type") or "Bus",
            "ac_available": bool(raw.get("ac_available", "AC" in str(raw.get("fleet_type", "")).upper())),
            "operating_hours": hours,
            "fare_policy": fp,
            "route_aliases": raw.get("route_aliases") or [],
            "canonical_stops": raw.get("canonical_stops", []),
            "stage_fares": raw.get("stage_fares", []),
            "karachi_alias_dictionary": raw.get("karachi_alias_dictionary", {}),
        })

_load_routes()

SHERAZ = next((r for r in ROUTES if str(r["route_id"]).startswith("SHERAZ")), ROUTES[0] if ROUTES else None)
EV1 = next((r for r in ROUTES if str(r["route_id"]).startswith("EV")), ROUTES[1] if len(ROUTES) > 1 else None)

# ---------------------------------------------------------------------------
# Alias index
# ---------------------------------------------------------------------------

ALIASES: Dict[str, Tuple[str, str]] = {}  # alias -> (canonical stop, route_id)
ROUTE_ALIASES: Dict[str, str] = {}        # alias -> route_id

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).lower().strip())

for _r in ROUTES:
    for _a in _r["route_aliases"]:
        ROUTE_ALIASES[_norm(_a)] = _r["route_id"]
    ROUTE_ALIASES[_norm(_r["route_name"])] = _r["route_id"]
    ROUTE_ALIASES[_r["route_id"].lower()] = _r["route_id"]

for _r in ROUTES:
    _rid = _r["route_id"]
    for _s in _r["canonical_stops"]:
        ALIASES[_norm(_s["official_name"])] = (_s["official_name"], _rid)
        for _lm in _s.get("sub_landmarks", []):
            ALIASES.setdefault(_norm(_lm), (_s["official_name"], _rid))
    for _alias, _target in _r["karachi_alias_dictionary"].items():
        _stop = next((s["official_name"] for s in _r["canonical_stops"] if s["official_name"] == _target), None)
        if _stop:
            ALIASES.setdefault(_norm(_alias), (_stop, _rid))

ALL_STOP_NAMES = [(s["official_name"], r["route_id"]) for r in ROUTES for s in r["canonical_stops"]]

# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------

ROMAN_URDU_WORDS = {
    "jana", "hai", "kitna", "kitne", "kiraya", "kiraye", "kahan", "kab", "se",
    "tak", "kaise", "kesai", "paise", "batao", "bata", "chalegi", "rukegi",
    "konsi", "konsa", "bus", "milegi", "aayegi", "mera", "mujhe", "mujhay",
    "chahiye", "safar", "sawari", "ka", "ki", "ke", "wala", "wali",
}

def detect_language(text: str) -> str:
    if re.search(r"[\u0600-\u06FF]", text):
        return "urdu_script"
    words = set(re.split(r"[^a-z]+", text.lower()))
    hits = len(words & ROMAN_URDU_WORDS)
    return "roman_urdu" if hits >= 2 else "english"

def _is_roman(lang: str) -> bool:
    return lang in ("roman_urdu", "urdu_script", "urdu", "mixed")

# ---------------------------------------------------------------------------
# Stop resolution
# ---------------------------------------------------------------------------

def _levenshtein(a: str, b: str) -> int:
    m, n = len(a), len(b)
    if m == 0:
        return n
    if n == 0:
        return m
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        curr = [i] + [0] * n
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev = curr
    return prev[n]

def resolve_stop(phrase: str) -> Optional[Tuple[str, str]]:
    """Resolve free text to (canonical_stop, route_id): exact → n-gram → fuzzy."""
    if not phrase or not str(phrase).strip():
        return None
    key = _norm(phrase)
    if not key:
        return None
    # 1. exact
    if key in ALIASES:
        return ALIASES[key]
    # 2. n-gram containment (handles conversational tails: "ned jana hai ...")
    words = key.split()
    for size in range(len(words), 0, -1):
        for start in range(0, len(words) - size + 1):
            gram = " ".join(words[start:start + size])
            if gram in ALIASES:
                return ALIASES[gram]
    # 3. containment of alias in phrase
    best = None
    best_len = 0
    for alias, entry in ALIASES.items():
        if len(alias) >= 4 and alias in key and len(alias) > best_len:
            best, best_len = entry, len(alias)
    if best:
        return best
    # 4. typo tolerance (alias + official names)
    typo_best = None
    typo_dist = 99
    for alias, entry in ALIASES.items():
        if len(alias) < 4:
            continue
        d = _levenshtein(key, alias)
        max_d = 3 if len(alias) > 12 else 2 if len(alias) >= 6 else 1
        if 0 < d <= max_d and d < typo_dist:
            typo_best, typo_dist = entry, d
    if typo_best:
        return typo_best
    return None

def suggest_stops(phrase: str, limit: int = 4) -> List[str]:
    key = _norm(phrase)
    if not key:
        return []
    scored = []
    for name, _rid in ALL_STOP_NAMES:
        n = _norm(name)
        d = _levenshtein(key, n)
        contains = key in n or n in key
        scored.append((0 if contains else 1, d, name))
    scored.sort()
    return [s[2] for s in scored[:limit]]

def find_route_in_message(text: str) -> Optional[Dict[str, Any]]:
    t = _norm(text)
    hits = []
    for alias, rid in ROUTE_ALIASES.items():
        if alias and alias in t:
            r = next((x for x in ROUTES if x["route_id"] == rid), None)
            if r and r not in hits:
                hits.append(r)
    if len(hits) > 1:
        hits.sort(key=lambda r: -max((len(a) for a in r["route_aliases"] + [r["route_name"]]), default=0))
        return hits[0]
    return hits[0] if hits else None

def find_name_alternates(stop_name: str, limit: int = 1) -> List[str]:
    """Similarly-named stops on other routes (CP 06 vs CMH Malir Cantt).
    Ignores generic tokens (gate, mall, park, station...) to avoid noise."""
    generic = {"gate", "mall", "park", "station", "market", "road", "chowrangi", "chowk", "campus"}
    tokens = [t for t in _norm(stop_name).split() if len(t) >= 4 and t not in generic]
    own = route_for_stop(stop_name)
    out = []
    for name, rid in ALL_STOP_NAMES:
        if own and rid == own["route_id"]:
            continue
        other_tokens = _norm(name).split()
        if any(t in other_tokens for t in tokens) and name not in out:
            out.append(name)
    return out[:limit]

def route_for_stop(stop_name: str) -> Optional[Dict[str, Any]]:
    return next((r for r in ROUTES if any(s["official_name"] == stop_name for s in r["canonical_stops"])), None)

def stop_seq(route: Dict[str, Any], name: str) -> Optional[int]:
    return next((s["sequence"] for s in route["canonical_stops"] if s["official_name"] == name), None)

def stops_between(route: Dict[str, Any], a: str, b: str) -> List[str]:
    sa, sb = stop_seq(route, a), stop_seq(route, b)
    if sa is None or sb is None:
        return []
    lo, hi = min(sa, sb), max(sa, sb)
    return [s["official_name"] for s in route["canonical_stops"] if lo <= s["sequence"] <= hi]

def fare_value(route: Dict[str, Any], a: str, b: str) -> Optional[int]:
    """Fare in PKR from the dataset tables. Sheraz: bracketed stage table from CP-06.
    EV-1: zone fare against the Malir Halt cutoff."""
    fp = route["fare_policy"]
    if fp["type"] == "STAGE_BASED":
        table = sorted(
            [f for f in route["stage_fares"] if f.get("to_stop_id")],
            key=lambda f: stop_seq(route, next(
                (s["official_name"] for s in route["canonical_stops"] if s["stop_id"] == f["to_stop_id"]), "")) or 0,
        )
        seq_a, seq_b = stop_seq(route, a), stop_seq(route, b)
        if seq_a is None or seq_b is None:
            return None
        dist = abs(seq_b - seq_a)
        # entries are anchored at CP-06 (seq 1): fare for distance (seq-1)
        for row in table:
            row_seq = stop_seq(route, next(
                (s["official_name"] for s in route["canonical_stops"] if s["stop_id"] == row["to_stop_id"]), "")) or 0
            if dist <= row_seq - 1:
                return row["fare_pkr"]
        return fp.get("maximum_fare")
    else:
        cutoff_seq = stop_seq(route, fp.get("fare_threshold_landmark") or "Malir Halt") or 5
        seq_a, seq_b = stop_seq(route, a), stop_seq(route, b)
        if seq_a is None or seq_b is None:
            return None
        hi = max(seq_a, seq_b)
        return fp.get("short_distance_fare") if hi <= cutoff_seq else fp.get("long_distance_fare")

def fare_str_for(route: Dict[str, Any], a: str, b: str) -> str:
    v = fare_value(route, a, b)
    return f"Rs. {v}" if v is not None else "—"

def corridor(route: Dict[str, Any]) -> str:
    s = route["canonical_stops"]
    return f"{s[0]['official_name']} ⇄ {s[-1]['official_name']}"

def route_summary_line(r: Dict[str, Any]) -> str:
    ac = "AC" if r["ac_available"] else "Non-AC"
    return f"{r['route_name']}: {corridor(r)} · {len(r['canonical_stops'])} stops · {ac} · {r['operating_hours']['start']}–{r['operating_hours']['end']}"

def fare_policy_text(route: Dict[str, Any]) -> str:
    fp = route["fare_policy"]
    pay = "/".join(fp.get("payment_methods") or []).replace("_", " ").lower()
    if fp["type"] == "STAGE_BASED":
        return f"Rs. {fp.get('minimum_fare')}–{fp.get('maximum_fare')} (stage-based, {pay})"
    return (f"Rs. {fp.get('short_distance_fare')} up to {fp.get('fare_threshold_landmark')}, "
            f"Rs. {fp.get('long_distance_fare')} beyond ({pay})")

def tips_for(route: Dict[str, Any], roman: bool) -> List[str]:
    pay = "/".join(route["fare_policy"].get("payment_methods") or []).replace("_", " ").lower()
    tips = [
        (f"{'AC' if route['ac_available'] else 'Non-AC'} bus hai — "
         f"{route['operating_hours']['start']} se {route['operating_hours']['end']} tak chalti hai.")
        if roman else
        (f"{'Air-conditioned' if route['ac_available'] else 'Non-AC'} bus, operating "
         f"{route['operating_hours']['start']}–{route['operating_hours']['end']}."),
        (f"Kiraya {pay} dein." if roman else f"Fare is payable via {pay}."),
    ]
    if route["fare_policy"].get("fare_threshold_landmark"):
        lm = route["fare_policy"]["fare_threshold_landmark"]
        tips.append(
            (f"Fare zones: {lm} tak short-distance, us ke baad long-distance.")
            if roman else
            (f"Zoned fare: short-distance up to {lm}, long-distance beyond.")
        )
    return tips

# ---------------------------------------------------------------------------
# Intent helpers
# ---------------------------------------------------------------------------

def _has(t: str, *words: str) -> bool:
    return any(w in t for w in words)

def is_greeting(t: str) -> bool:
    words = re.sub(r"[^a-z\s]", "", t).split()
    return len(words) <= 3 and any(g in words for g in ("hi", "hello", "hey", "salaam", "salam", "aoa"))

def is_thanks(t: str) -> bool:
    return bool(re.search(r"\b(thanks|thank you|shukriya)\b", t))

def is_help(t: str) -> bool:
    return _has(t, "help", "what can you do", "kya kar sakte", "madad")

def is_stop_list(t: str) -> bool:
    stop_word = _has(t, "stop", "stations", "route map")
    list_word = _has(t, "list", "all", "sab", "konsi", "konsa", "kitne", "kitni", "show", "batao", "bata", "kya hain", "kaun") or bool(re.search(r"\bstops?\b", t))
    return stop_word and list_word

def is_timings(t: str) -> bool:
    return _has(t, "timing", "timings", "hours", "kab chalti", "kab se", "kab tak", "last bus", "first bus",
                "pehli bus", "aakhri bus", "band hoti", "operating")

def is_fare_word(t: str) -> bool:
    return _has(t, "fare", "kiraya", "kiraye", "kitna", "kitne paise", "price", "ticket", "pass")

CONNECTORS = [
    re.compile(r"(?:^|\s)from\s+(.+?)\s*(?:,\s*)?(?:to|till|until|towards)\s+(.+)", re.I),
    re.compile(r"(.+?)\s*(?:→|->)\s*(.+)"),
    re.compile(r"(.+?)\s+(?:to|till|until)\s+(.+)", re.I),
    re.compile(r"(.+?)\s+\bse\b\s+(.+?)\s*(?:\s+\btak\b|\s+\btake\b|\s+\btk\b)?\s*$", re.I),
    re.compile(r"(.+?)\s+\bsay\b\s+(.+?)\s*(?:\s+\btak\b)?\s*$", re.I),
]

def extract_endpoints(text: str) -> Tuple[Optional[str], Optional[str]]:
    text = text.strip()
    for rx in CONNECTORS:
        m = rx.search(text)
        if m:
            o, d = m.group(1).strip(" ?!."), m.group(2).strip(" ?!.")
            if o and d:
                return o, d
    fm = re.search(r"^(?:from\s+)(.+)$", text, re.I) or re.search(r"^(.+?)\s+se$", text, re.I)
    if fm:
        return fm.group(1).strip(" ?!."), None
    tak = re.search(r"(.+?)\s+\btak\b", text, re.I)
    if tak:
        d = re.sub(r"^(?:kaise|kaese|how|kis tarah|main)\s+", "", tak.group(1), flags=re.I).strip(" ?!.")
        if d:
            return None, d
    # no connector: pick up known stop mentions
    t = _norm(text)
    found: List[str] = []
    for alias, (canonical, _rid) in sorted(ALIASES.items(), key=lambda kv: -len(kv[0])):
        if len(alias) >= 4 and alias in t and canonical not in found:
            found.append(canonical)
    if len(found) >= 2:
        return found[0], found[1]
    if len(found) == 1:
        return None, found[0]
    return None, None

# ---------------------------------------------------------------------------
# Response builders
# ---------------------------------------------------------------------------

def _base(reasoning_type: str, lang: str, origin=None, destination=None, route_id=None, fare=None) -> Dict[str, Any]:
    return {
        "reasoning_trace": {
            "detected_language": lang,
            "extracted_intent": {"origin": origin, "destination": destination, "query_type": reasoning_type},
            "matched_route": route_id,
            "fare_evaluated": fare,
        }
    }

def _card(status="CONFIRMED", name="", operator="", fleet="", fare="—", origin="", dest="",
          steps=None, tips=None, summary="") -> Dict[str, Any]:
    return {
        "status": status,
        "primary_route_name": name,
        "operator": operator,
        "fleet_type": fleet,
        "estimated_fare": fare,
        "origin": origin,
        "destination": dest,
        "steps": steps or [],
        "commuter_tips": tips or [],
        "summary_text": summary,
    }

def _popular(limit: int = 6) -> List[str]:
    prefs = ["CP 06 Malir Cantt", "Safoora Chowrangi", "Tower", "Malir Halt", "NED University", "Dolmen Mall Clifton"]
    known = {n for n, _ in ALL_STOP_NAMES}
    return [p for p in prefs if p in known][:limit] or [n for n, _ in ALL_STOP_NAMES[:limit]]

def build_journey(origin, destination, route, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    o_seq, d_seq = stop_seq(route, origin), stop_seq(route, destination)
    between = stops_between(route, origin, destination)
    intermediate = max(0, len(between) - 2)
    fare_val = fare_value(route, origin, destination)
    fare_s = f"Rs. {fare_val}" if fare_val is not None else "—"
    duration = max(12, intermediate * 4 + 10)
    wait = 5 + ((o_seq or 1) + (d_seq or 1)) % 5
    forward = (d_seq or 0) >= (o_seq or 0)
    bound = route["canonical_stops"][-1]["official_name"] if forward else route["canonical_stops"][0]["official_name"]

    if roman:
        summary = (f"{origin} se {destination} ke liye {route['route_name']} lein. "
                   f"Kiraya {fare_s}, safar mein taqreeban {duration} minute lagenge, "
                   f"aur bus taqreeban {wait} minute mein aayegi.")
    else:
        summary = (f"Take the {route['route_name']} from {origin} to {destination}. "
                   f"Fare {fare_s}, ride ~{duration} min, expected wait ~{wait} min.")

    steps = [
        {"step_number": 1, "action": "BOARD", "route_id": route["route_id"], "stop_name": origin,
         "instructions": f"{origin} par {route['route_name']} ({bound} bound) mein sawaar hon." if roman
         else f"Board the {route['route_name']} ({bound} bound) at {origin}."},
        {"step_number": 2, "action": "TRANSIT", "route_id": route["route_id"],
         "stop_name": f"{intermediate} intermediate stop{'s' if intermediate != 1 else ''}",
         "instructions": f"Takreeban {duration} minute ka safar — {intermediate} beech ke stops." if roman
         else f"Ride ~{duration} minutes past {intermediate} intermediate stop{'s' if intermediate != 1 else ''}."},
        {"step_number": 3, "action": "ALIGHT", "route_id": route["route_id"], "stop_name": destination,
         "instructions": f"{destination} par utar jayen." if roman else f"Get off at {destination}."},
    ]

    card = _card("CONFIRMED", route["route_name"], route["operator"], route["bus_type"],
                 fare_s, origin, destination, steps, tips_for(route, roman), summary)
    card["estimated_wait_time_mins"] = wait
    card["intermediate_stops"] = intermediate

    resp = _base("journey", lang, origin, destination, route["route_id"], fare_val)
    resp.update({
        "journey_card": card,
        "response": summary,
        "clarify": None,
        "follow_ups": [
            f"Fare from {origin} to {destination}?" if not roman else f"{origin} se {destination} kiraya?",
            f"List all {route['route_name']} stops",
            f"{route['route_name']} timings",
        ],
    })
    return resp

def build_same_place(place, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    r = route_for_stop(place)
    summary = (
        f"Aap ka origin aur destination dono \"{place}\" hai — aap pehle hi wahin par hain! "
        f"Koi safar ki zaroorat nahi."
        if roman else
        f"Your origin and destination are both \"{place}\" — you're already there! No journey needed."
    )
    resp = _base("same_place", lang, place, place, r["route_id"] if r else None)
    resp.update({
        "journey_card": _card("NO_ROUTE_FOUND", r["route_name"] if r else "", "", "", "—", place, place, [], [], summary),
        "response": summary,
        "clarify": None,
        "follow_ups": ["How do I reach Tower?", "Safoora Chowrangi to Hawksbay fare", "List all EV-1 stops"],
    })
    return resp

def build_cross_route(origin, destination, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    o_r, d_r = route_for_stop(origin), route_for_stop(destination)

    o_alts = find_name_alternates(origin)
    d_alts = find_name_alternates(destination)
    alt_options = []
    if d_alts and o_r:
        alt_options.append(f"{origin} to {d_alts[0]}")
    if o_alts and d_r:
        alt_options.append(f"{o_alts[0]} to {destination}")

    if roman:
        summary = (f"{origin} sirf {o_r['route_name']} ({corridor(o_r)}) par hai, jabke {destination} sirf "
                   f"{d_r['route_name']} ({corridor(d_r)}) par hai. Dono alag corridors hain — koi direct "
                   f"ya transfer route dataset mein nahi."
                   + (" Neeche milte-julte options hain — shayad yeh matlab tha:" if alt_options else ""))
    else:
        summary = (f"{origin} is only served by the {o_r['route_name']} ({corridor(o_r)}), while "
                   f"{destination} is only on the {d_r['route_name']} ({corridor(d_r)}). They run on "
                   f"different corridors — no direct connection exists."
                   + (" Try one of these similar trips below:" if alt_options else ""))

    resp = _base("no_route", lang, origin, destination)
    resp.update({
        "journey_card": _card("NO_ROUTE_FOUND", "", "", "", "—", origin, destination, [],
                              [route_summary_line(SHERAZ), route_summary_line(EV1)], summary),
        "response": summary,
        "clarify": {"field": "origin", "message": "Similar trips — tap one:", "options": alt_options,
                    "withOther": False} if alt_options else None,
        "follow_ups": [
            f"Fare from {origin} to {o_r['canonical_stops'][-1]['official_name']}?" if o_r else "List all Sheraz Coach stops",
            f"Fare from {d_r['canonical_stops'][0]['official_name']} to {destination}?" if d_r else "List all EV-1 stops",
            "List all routes",
        ],
    })
    return resp

def build_clarify(field, raw, other, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    options = suggest_stops(raw, 4) or _popular(4)
    display = raw if len(raw) <= 40 else raw[:40] + "…"
    message = (f"Main \"{display}\" ko kisi bus stop se match nahi kar saka. Kya aap in mein se kisi ka matlab rakhte hain?"
               if roman else
               f"I couldn't match \"{display}\" to any bus stop. Did you mean one of these?")
    resp = _base("clarify", lang)
    resp.update({
        "response": message,
        "clarify": {"field": field, "message": message, "options": options, "other": other, "withOther": bool(other)},
        "follow_ups": ["List all Sheraz Coach stops", "List all EV-1 stops", "Help"],
    })
    return resp

def build_both_unknown(a, b, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    summary = ("Mujhe sirf do local routes ke stops pata hain — Sheraz Coach aur EV-1. "
               "Apna origin aur destination in ke stops mein se chunein."
               if roman else
               "I only have stop data for two local routes — Sheraz Coach and EV-1. "
               "Pick your origin and destination from their stops.")
    resp = _base("unknown_places", lang, a, b)
    resp.update({
        "journey_card": _card("NO_ROUTE_FOUND", "All Routes", "Safar (mock data)", "2 local routes", "—",
                              a or "", b or "", [], [route_summary_line(SHERAZ), route_summary_line(EV1)], summary),
        "response": summary,
        "clarify": {"field": "origin", "message": "Tap your origin:" if not roman else "Apna origin chunein:",
                    "options": _popular(), "withOther": False},
        "follow_ups": ["List all Sheraz Coach stops", "List all EV-1 stops", "Help"],
    })
    return resp

def build_missing_origin(dest, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    message = (f"\"{dest}\" ke liye origin bhi batayein — kis stop se sawar hona hai?"
               if roman else
               f"Where would you like to board for \"{dest}\"? Tell me your origin stop.")
    resp = _base("missing_origin", lang, None, dest)
    resp.update({
        "response": message,
        "clarify": {"field": "origin", "message": message, "options": _popular(), "other": dest, "withOther": True},
        "follow_ups": [f"CP 06 Malir Cantt to {dest}"],
    })
    return resp

def build_missing_destination(origin, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    message = (f"\"{origin}\" se kahan tak jana hai? Destination batayein."
               if roman else
               f"Where to from \"{origin}\"? Tell me your destination stop.")
    resp = _base("missing_destination", lang, origin, None)
    resp.update({
        "response": message,
        "clarify": {"field": "destination", "message": message, "options": _popular(), "other": origin, "withOther": True},
        "follow_ups": [f"{origin} to Tower fare"],
    })
    return resp

def build_route_info(route, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    summary = (f"{route_summary_line(route)}. Operator: {route['operator']}. Fares: {fare_policy_text(route)}.")
    if roman:
        summary = (f"{route_summary_line(route)}. Operator: {route['operator']}. Kiraya: {fare_policy_text(route)}.")
    resp = _base("route_info", lang, route_id=route["route_id"])
    resp.update({
        "journey_card": _card("CONFIRMED", route["route_name"], route["operator"], route["bus_type"],
                              fare_policy_text(route),
                              route["canonical_stops"][0]["official_name"],
                              route["canonical_stops"][-1]["official_name"],
                              [], tips_for(route, roman), summary),
        "response": summary,
        "clarify": None,
        "follow_ups": [
            f"List all {route['route_name']} stops",
            f"{route['route_name']} timings",
            f"{route['canonical_stops'][0]['official_name']} to {route['canonical_stops'][-1]['official_name']} fare",
        ],
    })
    return resp

def build_timings(route, lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    routes = [route] if route else ROUTES
    lines = " · ".join(f"{r['route_name']}: {r['operating_hours']['start']}–{r['operating_hours']['end']} (daily)" for r in routes)
    summary = f"Service hours — {lines}. Last departure is at the closing time." if not roman else \
              f"Service timings — {lines}. Aakhri bus closing time par chalti hai."
    resp = _base("timings", lang, route_id=route["route_id"] if route else None)
    resp.update({
        "journey_card": _card("CONFIRMED", route["route_name"] if route else "All Routes",
                              route["operator"] if route else "—", route["bus_type"] if route else "—",
                              fare_policy_text(route) if route else "—",
                              route["canonical_stops"][0]["official_name"] if route else "",
                              route["canonical_stops"][-1]["official_name"] if route else "",
                              [], [t for r in routes for t in tips_for(r, roman)], summary),
        "response": summary,
        "clarify": None,
        "follow_ups": [f"List all {r['route_name']} stops" for r in routes],
    })
    return resp

def build_stops_list(route, lang) -> Dict[str, Any]:
    routes = [route] if route else ROUTES
    blocks = []
    for r in routes:
        listing = "\n".join(f"{s['sequence']}. {s['official_name']}" + (" (terminal)" if s.get("is_terminal") else "")
                            for s in r["canonical_stops"])
        blocks.append(f"**{r['route_name']}** ({corridor(r)}):\n{listing}")
    summary = "\n\n".join(blocks)
    resp = _base("stop_list", lang, route_id=route["route_id"] if route else None)
    resp.update({
        "journey_card": _card("CONFIRMED", route["route_name"] if route else "All Routes",
                              route["operator"] if route else "—", route["bus_type"] if route else "—",
                              fare_policy_text(route) if route else "—",
                              routes[0]["canonical_stops"][0]["official_name"],
                              routes[-1]["canonical_stops"][-1]["official_name"],
                              [], [t for r in routes for t in tips_for(r, _is_roman(lang))], summary),
        "response": summary,
        "clarify": None,
        "follow_ups": [f"{r['route_name']} timings" for r in routes],
    })
    return resp

def build_help(lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    summary = ("Main Karachi ki do local bus routes ke bare mein batata hoon:\n• "
               + "\n• ".join(route_summary_line(r) for r in ROUTES)
               + "\n\nPoochein: \"Safoora se Tower kiraya\", \"EV-1 ki stops\", \"Sheraz timings\"."
               if roman else
               "I know two Karachi local bus routes end-to-end:\n• "
               + "\n• ".join(route_summary_line(r) for r in ROUTES)
               + "\n\nTry: \"Fare from Safoora to Tower\", \"EV-1 stops\", \"Sheraz timings\".")
    resp = _base("help", lang)
    resp.update({
        "journey_card": _card("CONFIRMED", "All Routes", "Safar (mock data)", "2 local routes", "—", "", "", [],
                              [route_summary_line(r) for r in ROUTES], summary),
        "response": summary,
        "clarify": None,
        "follow_ups": ["Safoora Chowrangi to Tower", "List all Sheraz Coach stops", "EV-1 timings"],
    })
    return resp

def build_greeting(lang) -> Dict[str, Any]:
    roman = _is_roman(lang)
    summary = ("Assalam-o-alaikum! Main Safar Transit Copilot hoon — "
               + " aur ".join(f"{r['route_name']} ({corridor(r)})" for r in ROUTES)
               + " ke stops, kiraya aur timings batata hoon. Kahan jana hai?"
               if roman else
               "Hello! I'm Safar Transit Copilot — I know "
               + " and ".join(f"{r['route_name']} ({corridor(r)})" for r in ROUTES)
               + ". Ask me stops, fares and timings. Where are you heading?")
    resp = _base("greeting", lang)
    resp.update({
        "journey_card": None,
        "response": summary,
        "clarify": None,
        "follow_ups": ["Safoora Chowrangi to Tower", "Malir Halt to Dolmen Mall Clifton", "List all Sheraz Coach stops"],
    })
    return resp

# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def process_transit_query(
    message: str,
    live_telemetry: Optional[Dict[str, Any]] = None,
    disruptions: Optional[list] = None,
    intent: Optional[Dict[str, Any]] = None,
    current_stop: Optional[str] = None,
    skip_default_stops: bool = False,
) -> Dict[str, Any]:
    text = (message or "").strip()
    lang = detect_language(text)
    lower = text.lower()

    if not text:
        return build_help(lang)

    # Small talk
    if is_greeting(lower):
        return build_greeting(lang)
    if is_thanks(lower):
        roman = _is_roman(lang)
        return {
            **_base("thanks", lang),
            "journey_card": None,
            "response": "Koi baat nahi — safar aasan rahe! 🚌" if roman else "You're welcome — have a great ride! 🚌",
            "clarify": None,
            "follow_ups": ["List all EV-1 stops", "Sheraz Coach timings"],
        }
    if is_help(lower):
        return build_help(lang)

    # Info queries first (they may mention stops, e.g. "stops on Tower route")
    if is_stop_list(lower):
        return build_stops_list(find_route_in_message(lower), lang)
    if is_timings(lower):
        return build_timings(find_route_in_message(lower), lang)

    named_route = find_route_in_message(lower)
    o_raw, d_raw = extract_endpoints(text)

    # Grok intent overrides (structured extraction) — only trusted if resolvable
    if intent:
        lang = intent.get("language") or lang
        io = resolve_stop(intent.get("origin") or "") if intent.get("origin") else None
        idest = resolve_stop(intent.get("destination") or "") if intent.get("destination") else None
        if io:
            o_raw = io[0]
        if idest:
            d_raw = idest[0]

    if o_raw or d_raw:
        o_hit = resolve_stop(o_raw) if o_raw else None
        d_hit = resolve_stop(d_raw) if d_raw else None

        # Unknown endpoints → clarify (with opposite endpoint kept when known)
        if o_raw and d_raw and not o_hit and not d_hit:
            return build_both_unknown(o_raw, d_raw, lang)
        if o_raw and not o_hit:
            return build_clarify("origin", o_raw, d_hit[0] if d_hit else None, lang)
        if d_raw and not d_hit:
            return build_clarify("destination", d_raw, o_hit[0] if o_hit else None, lang)

        # Only one endpoint → ask for the missing one
        if o_hit and not d_raw:
            return build_missing_destination(o_hit[0], lang)
        if d_hit and not o_raw:
            return build_missing_origin(d_hit[0], lang)

        origin, destination = o_hit[0], d_hit[0]

        if origin == destination:
            return build_same_place(origin, lang)

        o_r, d_r = route_for_stop(origin), route_for_stop(destination)
        if o_r and d_r and o_r["route_id"] == d_r["route_id"]:
            return build_journey(origin, destination, o_r, lang)
        if o_r and d_r:
            return build_cross_route(origin, destination, lang)

        # Defensive: a resolved stop with no route
        if not o_r:
            return build_clarify("origin", origin, destination, lang)
        return build_clarify("destination", destination, origin, lang)

    # Route-level queries without endpoints
    if named_route and is_fare_word(lower):
        return build_route_info(named_route, lang)
    if named_route:
        return build_route_info(named_route, lang)

    # A single known stop mentioned → ask for the destination
    t = _norm(text)
    for alias, (canonical, _rid) in sorted(ALIASES.items(), key=lambda kv: -len(kv[0])):
        if len(alias) >= 4 and alias in t:
            return build_missing_destination(canonical, lang)

    return {
        **_base("fallback", lang),
        "journey_card": None,
        "response": ("Samajh nahi aaya. Main bus routes, stops, kiraya aur timings ke bare mein batata hoon — "
                     "misal: \"Safoora se Tower kiraya\" ya \"EV-1 ki stops\"."
                     if _is_roman(lang) else
                     "I didn't quite catch that. I can help with bus routes, stops, fares and timings — "
                     "try \"Fare from Safoora to Tower\" or \"EV-1 stops\"."),
        "clarify": None,
        "follow_ups": ["Help", "List all Sheraz Coach stops", "Malir Halt to Dolmen Mall Clifton"],
    }

