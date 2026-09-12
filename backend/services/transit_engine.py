import os
import json
import re
from typing import Dict, Any, Tuple, Optional, List

# Base Route 1 Aliases
KARACHI_ALIASES: Dict[str, str] = {
    # Route 1 (Peoples Bus Service EV-1)
    "airport": "Star Gate",
    "jinnah": "Star Gate",
    "star gate": "Star Gate",
    "stargate": "Star Gate",
    "drigh road": "Drigh Road Station",
    "drig road": "Drigh Road Station",
    "lal kothi": "Drigh Road Station",
    "karsaz": "Karsaz",
    "karsaz chowrangi": "Karsaz",
    "stadium": "Karsaz",
    "baloch colony": "Baloch Colony",
    "nursery": "Nursery",
    "pechs": "Nursery",
    "ftc": "FTC",
    "ftc building": "FTC",
    "metropole": "Metropole Hotel",
    "metropol": "Metropole Hotel",
    "avari": "Metropole Hotel",
    "saddar": "Metropole Hotel",
    "arts council": "Arts Council",
    "sindh assembly": "Arts Council",
    "tower": "Tower",
    "kharadar": "Tower",
    "merewether": "Tower",
    "model colony": "Model Colony",
    "malir halt": "Malir Halt",
}

# Load Sheraz Coach Dataset
SHERAZ_DATA: Dict[str, Any] = {}
SHERAZ_STOPS: List[Dict[str, Any]] = []
SHERAZ_STOP_NAMES: List[str] = []
SHERAZ_STAGE_FARES: List[Dict[str, Any]] = []

def _load_sheraz_data():
    global SHERAZ_DATA, SHERAZ_STOPS, SHERAZ_STOP_NAMES, SHERAZ_STAGE_FARES
    paths_to_try = [
        os.path.join(os.path.dirname(__file__), "..", "data", "sheraz.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "sheraz.json"),
        "sheraz.json"
    ]
    for p in paths_to_try:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    SHERAZ_DATA = json.load(f)
                    SHERAZ_STOPS = SHERAZ_DATA.get("canonical_stops", [])
                    SHERAZ_STOP_NAMES = [s["official_name"] for s in SHERAZ_STOPS]
                    SHERAZ_STAGE_FARES = SHERAZ_DATA.get("stage_fares", [])

                    # Map sub-landmarks
                    for s in SHERAZ_STOPS:
                        official = s["official_name"]
                        KARACHI_ALIASES[official.lower()] = official
                        for sub in s.get("sub_landmarks", []):
                            KARACHI_ALIASES[sub.lower()] = official

                    # Map Karachi alias dictionary from sheraz.json
                    for alias, target in SHERAZ_DATA.get("karachi_alias_dictionary", {}).items():
                        KARACHI_ALIASES[alias.lower()] = target

                    break
            except Exception as e:
                print(f"Warning: could not parse sheraz.json: {e}")

_load_sheraz_data()

def detect_language(text: str) -> str:
    """Detects whether user prompt is Roman Urdu, Urdu script, or English."""
    if re.search(r"[\u0600-\u06FF]", text):
        return "urdu_script"
    
    normalized = text.lower()
    roman_urdu_words = [
        "jana", "hai", "kitna", "kiraya", "kahan", "se", "tak", "kaise", 
        "paise", "batao", "chalegi", "stop", "rukegi", "kitne", "pohnchna", 
        "konsi", "bus", "milegi", "aayegi"
    ]
    if any(w in normalized for w in roman_urdu_words):
        return "roman_urdu"
    return "english"

def extract_origin_destination(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extracts origin and destination from user message using alias lookup."""
    normalized = text.lower()
    origin = None
    destination = None

    # Search for aliases sorted by length descending to match multi-word phrases first
    sorted_aliases = sorted(KARACHI_ALIASES.items(), key=lambda x: len(x[0]), reverse=True)

    for alias, canonical in sorted_aliases:
        if alias in normalized:
            if not origin:
                origin = canonical
            elif canonical != origin and not destination:
                destination = canonical

    return origin, destination

def calculate_sheraz_fare(origin: str, destination: str) -> Tuple[int, str]:
    """Calculates stage-based fare for Sheraz Coach."""
    origin_seq = 1
    dest_seq = 20

    for s in SHERAZ_STOPS:
        if s["official_name"].lower() == origin.lower():
            origin_seq = s["sequence"]
        if s["official_name"].lower() == destination.lower():
            dest_seq = s["sequence"]

    stops_traveled = abs(dest_seq - origin_seq)

    # Stage fare tiers based on sheraz.json policy
    if stops_traveled <= 2:
        fare = 20
    elif stops_traveled <= 4:
        fare = 40
    elif stops_traveled <= 8:
        fare = 60
    elif stops_traveled <= 14:
        fare = 80
    else:
        fare = 100

    return fare, f"Rs. {fare}"

def process_transit_query(
    message: str, 
    live_telemetry: Optional[Dict[str, Any]] = None,
    disruptions: Optional[list] = None
) -> Dict[str, Any]:
    """
    Transit reasoning pipeline generating the verified Phase 1 & 2 JSON contract.
    """
    lang = detect_language(message)
    origin, destination = extract_origin_destination(message)

    normalized = message.lower()
    
    # Determine if query targets Sheraz Coach
    is_sheraz = False
    if "sheraz" in normalized or "shiraz" in normalized or "cp6" in normalized or "cp 6" in normalized or "hawksbay" in normalized:
        is_sheraz = True
    elif origin in SHERAZ_STOP_NAMES or destination in SHERAZ_STOP_NAMES:
        # If stop belongs specifically to Sheraz Coach (e.g. Safoora, Dow, KU, NED, Safari, Hassan Square)
        pbs_specific = ["model colony", "malir halt", "star gate", "karsaz", "baloch colony", "nursery", "ftc", "metropole hotel", "arts council"]
        if not any(pbs in normalized for pbs in pbs_specific):
            is_sheraz = True

    if is_sheraz:
        route_id = "SHERAZ-01"
        route_name = "Sheraz Coach"
        operator = "Sheraz Transport Co."
        fleet_type = "Local Mini Bus / Non-AC"
        origin = origin or "Safoora Chowrangi"
        destination = destination or "Tower"
        fare_pkr, fare_str = calculate_sheraz_fare(origin, destination)
        corridor = "University Road Corridor"
    else:
        route_id = "PBS-01"
        route_name = "Peoples Bus Service - Route 1 (EV-1)"
        operator = "Peoples Bus Service"
        fleet_type = "Electric AC"
        fare_pkr = 50
        fare_str = "Rs. 50"
        origin = origin or "Model Colony"
        destination = destination or ("Model Colony" if origin == "Tower" else "Tower")
        corridor = "Sharea Faisal Corridor"

    is_roman = lang in ["roman_urdu", "urdu_script"]

    # Telemetry calculation
    eta_mins = 6
    if live_telemetry and "estimated_next_stop_arrival_mins" in live_telemetry:
        eta_mins = live_telemetry["estimated_next_stop_arrival_mins"]

    # Disruption checking
    has_disruption = False
    disruption_warning = None
    status = "CONFIRMED"

    if disruptions:
        for incident in disruptions:
            if incident.get("active", False):
                has_disruption = True
                status = "WARNING_REROUTED"
                disruption_warning = incident.get("description", "Disruption reported along route.")
                break

    # Build summary
    if is_roman:
        summary_text = (
            f"Aap {origin} se {route_name} le sakte hain jo {destination} tak jaati hai. "
            f"Kiraya {fare_str} hai. Bus takreeban {eta_mins} minute mein pohnch rahi hai."
        )
        if has_disruption and disruption_warning:
            summary_text += f" Khabardaar: {disruption_warning}"
    else:
        summary_text = (
            f"You can take {route_name} from {origin} towards {destination} via {corridor}. "
            f"Official fare is {fare_str}. Expected wait time is ~{eta_mins} minutes."
        )
        if has_disruption and disruption_warning:
            summary_text += f" Warning: {disruption_warning}"

    steps = [
        {
            "step_number": 1,
            "action": "BOARD",
            "route_id": route_id,
            "stop_name": origin,
            "instructions": (
                f"{origin} stop par {route_name} mein sawaar hon."
                if is_roman
                else f"Board {route_name} at {origin} stop."
            )
        },
        {
            "step_number": 2,
            "action": "TRANSIT",
            "route_id": route_id,
            "stop_name": corridor,
            "instructions": (
                f"Bus {corridor} se guzar kar agle stops cover karegi."
                if is_roman
                else f"Travel along {corridor}."
            )
        },
        {
            "step_number": 3,
            "action": "ALIGHT",
            "route_id": route_id,
            "stop_name": destination,
            "instructions": (
                f"{destination} stop pohnch kar utrein."
                if is_roman
                else f"Alight at {destination} terminal."
            )
        }
    ]

    commuter_tips = (
        [
            "Local coach hai (Non-AC); rush ke auqaat mein bheer zyada hoti hai." if is_roman else "Non-AC local coach; peak hours can be crowded.",
            "Kiraya conductor ko cash mein ada karein." if is_roman else "Payment is cash only to conductor."
        ]
        if is_sheraz
        else [
            "Electric AC bus hai, safar pur-sukoon rehta hai." if is_roman else "Modern air-conditioned electric bus.",
            "Kiraya flat Rs. 50 hai, conductor se ticket lena na bhoolein." if is_roman else "Flat Rs. 50 fare; collect ticket from conductor."
        ]
    )

    journey_card = {
        "status": status,
        "primary_route_name": route_name,
        "operator": operator,
        "fleet_type": fleet_type,
        "estimated_fare": fare_str,
        "origin": origin,
        "destination": destination,
        "estimated_wait_time_mins": eta_mins,
        "has_disruption": has_disruption,
        "disruption_warning": disruption_warning,
        "steps": steps,
        "commuter_tips": commuter_tips,
        "summary_text": summary_text
    }

    reasoning_trace = {
        "detected_language": lang,
        "extracted_intent": {
            "origin": origin,
            "destination": destination,
            "query_type": "route_and_fare"
        },
        "matched_route": route_id,
        "fare_evaluated": fare_pkr,
        "telemetry_evaluated": {
            "bus_id": "PB-101" if not is_sheraz else "SHZ-01",
            "eta_mins": eta_mins
        },
        "disruption_flagged": has_disruption
    }

    return {
        "reasoning_trace": reasoning_trace,
        "journey_card": journey_card
    }
