// =============================================================================
// Safar Transit Engine — chatbot brain (fully mocked/offline)
// Answers bus-route questions for the two local routes in dataset.json:
//   • Sheraz Coach  (SHERAZ-01): CP 06 Malir Cantt ⇄ Hawksbay
//   • EV-1 Electric (EV-01):     CMH Malir Cantt ⇄ Dolmen Mall Clifton
// Handles: greetings, route info, stop lists, timings, fares, journeys,
// unknown/misspelled stops (with tappable clarifications), same origin &
// destination, and cross-route trips.
// =============================================================================

import type { ApiResponse, ClarifySuggestions, JourneyCardData, RouteStep } from "@/types/transit";
import {
  ROUTES,
  SHERAZ,
  EV1,
  resolveStop,
  resolveStopInPhrase,
  suggestStops,
  routeForStop,
  stopsBetween,
  stopSequence,
  fareFor,
  fareValue,
  findNameAlternates,
  findRouteByMessage,
  routeSummaryLine,
  type RouteRecord,
} from "./transitData";

// ---------------------------------------------------------------------------
// Language detection (English / Roman Urdu / Urdu script)
// ---------------------------------------------------------------------------

const ROMAN_URDU_WORDS = [
  "se", "tak", "hai", "kitna", "kitne", "kiraya", "kiraye", "kahan", "kab",
  "jana", "jana hai", "chalegi", "milegi", "rukegi", "batao", "bata", "ka",
  "ki", "ke", "mera", "mujhe", "chahiye", "wala", "wali", "bus", "konsa",
  "konsi", "safar", "sawari",
];

export function detectLanguage(text: string): "english" | "roman_urdu" | "urdu_script" {
  if (/[\u0600-\u06FF]/.test(text)) return "urdu_script";
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const hits = words.filter((w) => ROMAN_URDU_WORDS.includes(w)).length;
  return hits >= 2 ? "roman_urdu" : "english";
}

const isRoman = (lang: string) => lang !== "english";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export const POPULAR_STOPS = [
  "CP 06 Malir Cantt",
  "Safoora Chowrangi",
  "KU Main Gate",
  "NIPA Chowrangi",
  "Hassan Square",
  "Tower",
  "Malir Halt",
  "Dolmen Mall Clifton",
];

function tipsForRoute(route: RouteRecord, roman: boolean): string[] {
  const pay = route.fare_policy.payment_methods.join(", ").toLowerCase().replace(/_/g, " ");
  const tips = [
    roman
      ? `${route.ac_available ? "AC" : "Non-AC"} bus hai — ${route.operating_hours.start} se ${route.operating_hours.end} tak chalti hai.`
      : `${route.ac_available ? "Air-conditioned" : "Non-AC"} bus, operating ${route.operating_hours.start}–${route.operating_hours.end}.`,
    roman ? `Kiraya ${pay} dein.` : `Fare is payable via ${pay}.`,
  ];
  if (route.fare_policy.fare_threshold_landmark) {
    tips.push(
      roman
        ? `Fare zones: ${route.fare_policy.fare_threshold_landmark} tak short-distance, us ke baad long-distance.`
        : `Zoned fare: short-distance up to ${route.fare_policy.fare_threshold_landmark}, long-distance beyond.`
    );
  }
  return tips;
}

function stopsListText(route: RouteRecord): string {
  return route.canonical_stops
    .map((s) => `${s.sequence}. ${s.official_name}${s.is_terminal ? " (terminal)" : ""}`)
    .join("\n");
}

function routeCorridor(route: RouteRecord): string {
  const first = route.canonical_stops[0]?.official_name ?? "?";
  const last = route.canonical_stops[route.canonical_stops.length - 1]?.official_name ?? "?";
  return `${first} ⇄ ${last}`;
}

function fmtStopsForChips(names: string[]): string[] {
  return names.map((n) => `${n}`);
}

// ---------------------------------------------------------------------------
// Intent detectors
// ---------------------------------------------------------------------------

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

function isGreeting(t: string): boolean {
  const words = t.replace(/[^a-z\s]/g, "").trim().split(/\s+/);
  return (
    words.length <= 3 &&
    ["hi", "hello", "hey", "salaam", "salam", "assalam", "asalam", "aoa", "good morning", "good evening"].some((g) =>
      words.includes(g) || t.includes(g)
    )
  );
}

function isThanks(t: string): boolean {
  return /\b(thanks|thank you|shukriya|meherbani)\b/.test(t);
}

function isHelpRequest(t: string): boolean {
  return has(t, "help", "what can you do", "kya kar sakte", "madad", "how do you work", "options");
}

function isStopListQuery(t: string): boolean {
  const stopWord = has(t, "stop", "stations", "stops", "route map", "sare stop", "all stop");
  const listWord =
    has(t, "list", "all", "sab", "konsi", "konsa", "kitne", "kitni", "show", "batao", "bata", "kya hain", "kaun") ||
    /\bstops?\b/.test(t);
  return stopWord && listWord;
}

function isTimingsQuery(t: string): boolean {
  return has(
    t,
    "timing", "timings", "hours", "kab chalti", "kab se", "kab tak", "last bus", "first bus",
    "pehli bus", "aakhri bus", "shut", "band hoti", "service ends", "operating"
  );
}

function isFarePolicyQuery(t: string): boolean {
  return has(t, "fare", "kiraya", "kiraye", "kitna", "kitne paise", "price", "ticket", "pass");
}

function isRouteInfoQuery(t: string): boolean {
  return findRouteByMessage(t) !== undefined && !isStopListQuery(t);
}

// ---------------------------------------------------------------------------
// Origin / destination extraction
// ---------------------------------------------------------------------------

interface Extracted {
  originRaw: string | null;
  destinationRaw: string | null;
}

const CONNECTORS = [
  /(?:^|\s)from\s+(.+?)\s*(?:,\s*)?(?:to|till|until|towards)\s+(.+)/i,
  /(.+?)\s*(?:→|->)\s*(.+)/i,
  /(.+?)\s+(?:to|till|until)\s+(.+)/i,
  /(.+?)\s+\bse\b\s+(.+?)(?:\s+\btak\b|\s+\btake\b|\s+\btk\b)?\s*$/i,
  /(.+?)\s+\bsay\b\s+(.+?)(?:\s+\btak\b)?\s*$/i,
];

function extractEndpoints(message: string): Extracted {
  const text = message.trim();

  for (const rx of CONNECTORS) {
    const m = text.match(rx);
    if (m) {
      const o = m[1].trim().replace(/[?!.]+$/, "");
      const d = m[2].trim().replace(/[?!.]+$/, "");
      if (o && d) return { originRaw: o, destinationRaw: d };
    }
  }

  // Lone "from X" → origin only ("from Safoora", "Safoora se")
  const fromM = text.match(/^(?:from\s+)(.+)$/i) || text.match(/^(.+?)\s+se$/i);
  if (fromM) {
    const o = fromM[1].trim().replace(/[?!.]+$/, "");
    if (o) return { originRaw: o, destinationRaw: null };
  }

  // Roman-Urdu "X tak" → destination only ("Tower tak kaise jaun?")
  const takM = text.match(/(.+?)\s+\btak\b/i);
  if (takM) {
    const d = takM[1].trim().replace(/^(?:kaise|kaese|how|kis tarah|main)\s+/i, "").replace(/[?!.]+$/, "");
    if (d) return { originRaw: null, destinationRaw: d };
  }

  // No connector: find every known stop alias mentioned
  const found: string[] = [];
  const lower = text.toLowerCase();
  const aliasNames = [
    ...new Set(
      ROUTES.flatMap((r) => [
        ...r.canonical_stops.map((s) => s.official_name),
        ...r.canonical_stops.flatMap((s) => s.sub_landmarks || []),
      ])
    ),
  ].sort((a, b) => b.length - a.length);

  for (const name of aliasNames) {
    if (lower.includes(name.toLowerCase()) && !found.some((f) => f === name)) {
      // map back to canonical via resolveStop
      const resolved = resolveStop(name);
      if (resolved && !found.includes(resolved.canonical)) found.push(resolved.canonical);
    }
  }

  if (found.length >= 2) return { originRaw: found[0], destinationRaw: found[1] };
  if (found.length === 1) return { originRaw: null, destinationRaw: found[0] };
  return { originRaw: null, destinationRaw: null };
}

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

function buildClarify(
  field: "origin" | "destination",
  rawInput: string,
  other: string | undefined,
  roman: boolean
): ApiResponse {
  const options = suggestStops(rawInput, 4);
  const chips = options.length > 0 ? fmtStopsForChips(options) : fmtStopsForChips(POPULAR_STOPS.slice(0, 4));
  const display = rawInput.length > 40 ? rawInput.slice(0, 40) + "…" : rawInput;

  const message = roman
    ? `Main "${display}" ko kisi bus stop se match nahi kar saka. Kya aap in mein se kisi ka matlab rahte hain?`
    : `I couldn't match "${display}" to any bus stop. Did you mean one of these?`;

  const clarify: ClarifySuggestions = {
    field,
    message,
    options: chips,
    other,
    withOther: Boolean(other),
  };

  return {
    response: message,
    clarify,
    follow_ups: [
      "List all Sheraz Coach stops",
      "List all EV-1 stops",
      "Safoora Chowrangi to Tower",
    ],
  };
}

function buildJourney(
  origin: string,
  destination: string,
  route: RouteRecord,
  lang: string
): ApiResponse {  const roman = isRoman(lang);
  const oSeq = stopSequence(route, origin) ?? 0;
  const dSeq = stopSequence(route, destination) ?? 0;
  const between = stopsBetween(route, origin, destination);
  const intermediate = Math.max(0, between.length - 2);
  const fare = fareFor(route, origin, destination);

  // Deterministic pseudo-wait (5–9 min) so UI has a stable number
  const waitMins = 5 + ((oSeq + dSeq) % 5);
  const durationMins = Math.max(12, intermediate * 4 + 10);

  const forward = dSeq >= oSeq;
  const heading = forward
    ? `${route.canonical_stops[route.canonical_stops.length - 1].official_name} bound`
    : `${route.canonical_stops[0].official_name} bound`;

  const steps: RouteStep[] = [
    {
      step_number: 1,
      action: "BOARD",
      route_id: route.route_id,
      stop_name: origin,
      instructions: roman
        ? `${origin} par ${route.route_name} (${heading}) mein sawaar hon.`
        : `Board the ${route.route_name} (${heading}) at ${origin}.`,
    },
    {
      step_number: 2,
      action: "TRANSIT",
      route_id: route.route_id,
      stop_name: `${intermediate} intermediate stop${intermediate === 1 ? "" : "s"}`,
      instructions: roman
        ? `Takreeban ${durationMins} minute ka safar — ${intermediate} beech ke stops.`
        : `Ride ~${durationMins} minutes past ${intermediate} intermediate stop${intermediate === 1 ? "" : "s"}.`,
    },
    {
      step_number: 3,
      action: "ALIGHT",
      route_id: route.route_id,
      stop_name: destination,
      instructions: roman ? `${destination} par utar jayen.` : `Get off at ${destination}.`,
    },
  ];

  const summary = roman
    ? `${origin} se ${destination} ke liye ${route.route_name} lein. Kiraya ${fare} hai, safar mein taqreeban ${durationMins} minute lagenge aur bus taqreeban ${waitMins} minute mein aayegi.`
    : `Take the ${route.route_name} from ${origin} to ${destination}. Fare: ${fare}, ride ~${durationMins} min, bus every ~${waitMins} min.`;

  const card: JourneyCardData = {
    status: "CONFIRMED",
    primary_route_name: route.route_name,
    operator: route.operator,
    fleet_type: route.bus_type,
    estimated_fare: fare,
    origin,
    destination,
    steps,
    commuter_tips: tipsForRoute(route, roman),
    summary_text: summary,
    estimated_wait_time_mins: waitMins,
    intermediate_stops: intermediate,
  };

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin, destination, query_type: "journey" },
      matched_route: route.route_id,
      fare_evaluated: fareValue(route, origin, destination),
    },
    journey_card: card,
    response: summary,
    clarify: null,
    follow_ups: [
      `Fare from ${origin} to ${destination}?`,
      `List all ${route.route_name} stops`,
      "EV-1 timings",
    ],
  };
}

function buildSamePlace(origin: string, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const summary = roman
    ? `Aap ka origin aur destination dono "${origin}" hai — aap pehle hi wahin par hain! Koi safar ki zaroorat nahi. Agar aas paas koi aur stop chahiye to poochein.`
    : `Your origin and destination are both "${origin}" — you're already there! No journey needed. Ask me for a different destination nearby.`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin, destination: origin, query_type: "same_place" },
      matched_route: routeForStop(origin)?.route_id ?? null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "NO_ROUTE_FOUND",
      primary_route_name: routeForStop(origin)?.route_name ?? "",
      operator: "",
      fleet_type: "",
      estimated_fare: "—",
      origin,
      destination: origin,
      steps: [],
      commuter_tips: [],
      summary_text: summary,
    },
    response: summary,
    clarify: null,
    follow_ups: [
      "How do I reach Tower?",
      "Safoora Chowrangi to Hawksbay fare",
      "List all EV-1 stops",
    ],
  };
}

function buildCrossRoute(origin: string, destination: string, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const oRoute = routeForStop(origin);
  const dRoute = routeForStop(destination);

  // If a similarly-named stop exists on the other route (e.g. user says
  // "malir cantt" → CMH Malir Cantt on EV-1, but CP 06 Malir Cantt is on
  // Sheraz), offer the alternate as a tappable correction.
  const originAlts = findNameAlternates(origin);
  const destAlts = findNameAlternates(destination);
  const altOptions: string[] = [];
  if (destAlts.length > 0 && oRoute) {
    // Keep origin, swap destination to the other route
    altOptions.push(`${origin} to ${destAlts[0]}`);
  }
  if (originAlts.length > 0 && dRoute) {
    // Keep destination, swap origin to the other route
    altOptions.push(`${originAlts[0]} to ${destination}`);
  }
  const summary = roman    ? `${origin} sirf ${oRoute?.route_name} (${routeCorridor(oRoute!)}) par hai, jabke ${destination} sirf ${dRoute?.route_name} (${routeCorridor(dRoute!)}) par hai. Dono routes alag corridors hain — koi direct ya transfer route dataset mein available nahi.${altOptions.length > 0 ? " Neeche milte-julte stops diye hain — shayad aap yeh matlab rakhte hain:" : ""}`
    : `${origin} is only served by the ${oRoute?.route_name} (${routeCorridor(oRoute!)}), while ${destination} is only on the ${dRoute?.route_name} (${routeCorridor(dRoute!)}). They run on different corridors — no direct or transfer connection exists in the dataset.${altOptions.length > 0 ? " Try one of these similar stops below — did you mean:" : ""}`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin, destination, query_type: "no_route" },
      matched_route: null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "NO_ROUTE_FOUND",
      primary_route_name: "",
      operator: "",
      fleet_type: "",
      estimated_fare: "—",
      origin,
      destination,
      steps: [],
      commuter_tips: [routeSummaryLine(SHERAZ), routeSummaryLine(EV1)],
      summary_text: summary,
    },
    response: summary,
    clarify:
      altOptions.length > 0
        ? {
            field: "origin",
            message: roman ? "Milte-julte options — tap karein:" : "Similar trips — tap one:",
            options: altOptions,
            withOther: false,
          }
        : null,
    follow_ups: [
      `Fare from ${origin} to ${oRoute?.canonical_stops[oRoute.canonical_stops.length - 1].official_name}?`,
      `Fare from ${dRoute?.canonical_stops[0].official_name} to ${destination}?`,
      "List all routes",
    ],
  };
}

function buildBothUnknown(rawA: string | null, rawB: string | null, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const summary = roman
    ? `Mujhe sirf do local routes ke stops pata hain — Sheraz Coach aur EV-1. Neeche stops ki list hai; apna origin aur destination un mein se chunein.`
    : `I only have stop data for two local routes — Sheraz Coach and EV-1. Pick your origin and destination from the stops below.`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: rawA, destination: rawB, query_type: "unknown_places" },
      matched_route: null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "NO_ROUTE_FOUND",
      primary_route_name: "All Routes",
      operator: "Safar (mock data)",
      fleet_type: "2 local routes",
      estimated_fare: "—",
      origin: rawA ?? "",
      destination: rawB ?? "",
      steps: [],
      commuter_tips: [routeSummaryLine(SHERAZ), routeSummaryLine(EV1)],
      summary_text: summary,
    },
    response: summary,
    clarify: {
      field: "origin",
      message: roman ? "Apna origin chunein (tap karein):" : "Tap your origin:",
      options: fmtStopsForChips(POPULAR_STOPS),
      withOther: false,
    },
    follow_ups: ["List all Sheraz Coach stops", "List all EV-1 stops", "Help"],
  };
}

function buildMissingOrigin(destination: string, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const message = roman
    ? `"${destination}" ke liye origin bhi batayein — kis stop se sawar hona hai?`
    : `Where would you like to board for "${destination}"? Tell me your origin stop.`;
  return {
    response: message,
    clarify: {
      field: "origin",
      message,
      options: fmtStopsForChips(POPULAR_STOPS),
      other: destination,
      withOther: true,
    },
    follow_ups: [`CP 06 Malir Cantt to ${destination}`, `List all Sheraz Coach stops`],
  };
}

function buildMissingDestination(origin: string, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const message = roman
    ? `"${origin}" se kahan tak jana hai? Destination batayein.`
    : `Where to from "${origin}"? Tell me your destination stop.`;
  return {
    response: message,
    clarify: {
      field: "destination",
      message,
      options: fmtStopsForChips(POPULAR_STOPS),
      other: origin,
      withOther: true,
    },
    follow_ups: [`${origin} to Tower fare`, `${origin} to Dolmen Mall Clifton`],
  };
}

function buildRouteInfo(route: RouteRecord, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const summary = roman
    ? `${routeSummaryLine(route)}. Operator: ${route.operator}. Kiraya: ${farePolicyText(route)}.`
    : `${routeSummaryLine(route)}. Operator: ${route.operator}. Fares: ${farePolicyText(route)}.`;

  const preview = route.canonical_stops
    .slice(0, 6)
    .map((s) => `${s.sequence}. ${s.official_name}`)
    .join("  ·  ");

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: null, destination: null, query_type: "route_info" },
      matched_route: route.route_id,
      fare_evaluated: null,
    },
    journey_card: {
      status: "CONFIRMED",
      primary_route_name: route.route_name,
      operator: route.operator,
      fleet_type: route.bus_type,
      estimated_fare: farePolicyText(route),
      origin: route.canonical_stops[0].official_name,
      destination: route.canonical_stops[route.canonical_stops.length - 1].official_name,
      steps: [],
      commuter_tips: tipsForRoute(route, roman),
      summary_text: `${summary}\n\nFirst stops: ${preview} …`,
    },
    response: summary,
    clarify: null,
    follow_ups: [
      `List all ${route.route_name} stops`,
      `${route.route_name} timings`,
      `${route.canonical_stops[0].official_name} to ${route.canonical_stops[route.canonical_stops.length - 1].official_name} fare`,
    ],
  };
}

function farePolicyText(route: RouteRecord): string {
  if (route.fare_policy.type === "STAGE_BASED") {
    return `Rs. ${route.fare_policy.minimum_fare}–${route.fare_policy.maximum_fare} (stage-based, ${route.fare_policy.payment_methods.join("/").toLowerCase().replace(/_/g, " ")})`;
  }
  return `Rs. ${route.fare_policy.short_distance_fare} up to ${route.fare_policy.fare_threshold_landmark}, Rs. ${route.fare_policy.long_distance_fare} beyond (${route.fare_policy.payment_methods.join("/").toLowerCase().replace(/_/g, " ")})`;
}

function buildTimings(route: RouteRecord | null, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const routes = route ? [route] : ROUTES;
  const lines = routes.map((r) => `${r.route_name}: ${r.operating_hours.start}–${r.operating_hours.end} (daily)`);
  const summary = roman
    ? `Service timings — ${lines.join(" · ")}. Last bus terminal se ${routes.map((r) => r.operating_hours.end).join("/")} par chalti hai.`
    : `Service hours — ${lines.join(" · ")}. Last departure is at the closing time.`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: null, destination: null, query_type: "timings" },
      matched_route: route?.route_id ?? null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "CONFIRMED",
      primary_route_name: route?.route_name ?? "All Routes",
      operator: route?.operator ?? "—",
      fleet_type: route?.bus_type ?? "—",
      estimated_fare: route ? farePolicyText(route) : "—",
      origin: route?.canonical_stops[0].official_name ?? "",
      destination: "",
      steps: [],
      commuter_tips: routes.flatMap((r) => tipsForRoute(r, roman)),
      summary_text: summary,
    },
    response: summary,
    clarify: null,
    follow_ups: [
      route ? `List all ${route.route_name} stops` : "List all EV-1 stops",
      route ? `${route.route_name} fares` : "Sheraz Coach fares",
    ],
  };
}

function buildStopsList(route: RouteRecord | null, lang: string): ApiResponse {
  const roman = isRoman(lang);
  const routes = route ? [route] : ROUTES;
  const summary = routes
    .map((r) => `**${r.route_name}** (${routeCorridor(r)}):\n${stopsListText(r)}`)
    .join("\n\n");

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: null, destination: null, query_type: "stop_list" },
      matched_route: route?.route_id ?? null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "CONFIRMED",
      primary_route_name: route?.route_name ?? "All Routes",
      operator: route?.operator ?? "—",
      fleet_type: route?.bus_type ?? "—",
      estimated_fare: route ? farePolicyText(route) : "—",
      origin: route?.canonical_stops[0].official_name ?? "",
      destination: route?.canonical_stops[route.canonical_stops.length - 1].official_name ?? "",
      steps: [],
      commuter_tips: routes.flatMap((r) => tipsForRoute(r, roman)),
      summary_text: summary,
    },
    response: summary,
    clarify: null,
    follow_ups: routes.map((r) => `${r.route_name} timings`),
  };
}

function buildHelp(lang: string): ApiResponse {
  const roman = isRoman(lang);
  const summary = roman
    ? `Main Karachi ki do local bus routes ke bare mein batata hoon:\n• ${routeSummaryLine(SHERAZ)}\n• ${routeSummaryLine(EV1)}\n\nAap mujh se pooch sakte hain: "Safoora se Tower kiraya", "EV-1 ki stops", "Sheraz timings", ya "Malir Halt se Dolmen Mall".`
    : `I know two Karachi local bus routes end-to-end:\n• ${routeSummaryLine(SHERAZ)}\n• ${routeSummaryLine(EV1)}\n\nTry: "Fare from Safoora to Tower", "EV-1 stops", "Sheraz timings", or "Malir Halt to Dolmen Mall".`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: null, destination: null, query_type: "help" },
      matched_route: null,
      fare_evaluated: null,
    },
    journey_card: {
      status: "CONFIRMED",
      primary_route_name: "All Routes",
      operator: "Safar (mock data)",
      fleet_type: "2 local routes",
      estimated_fare: "—",
      origin: "",
      destination: "",
      steps: [],
      commuter_tips: [routeSummaryLine(SHERAZ), routeSummaryLine(EV1)],
      summary_text: summary,
    },
    response: summary,
    clarify: null,
    follow_ups: [
      "CP 6 Malir Cantt to Dolmen Mall Clifton",
      "List all Sheraz Coach stops",
      "EV-1 timings",
    ],
  };
}

function buildGreeting(lang: string): ApiResponse {
  const roman = isRoman(lang);
  const summary = roman
    ? `Assalam-o-alaikum! Main Safar Transit Copilot hoon. Sheraz Coach (CP 06 Malir Cantt ⇄ Hawksbay) aur EV-1 (CMH Malir Cantt ⇄ Dolmen Mall Clifton) ke stops, kiraya aur timings batata hoon. Kahan jana hai?`
    : `Hello! I'm Safar Transit Copilot. I can tell you stops, fares and timings for Sheraz Coach (CP 06 Malir Cantt ⇄ Hawksbay) and EV-1 (CMH Malir Cantt ⇄ Dolmen Mall Clifton). Where are you heading?`;

  return {
    reasoning_trace: {
      detected_language: lang,
      extracted_intent: { origin: null, destination: null, query_type: "greeting" },
      matched_route: null,
      fare_evaluated: null,
    },
    journey_card: undefined,
    response: summary,
    clarify: null,
    follow_ups: [
      "Safoora Chowrangi to Tower",
      "Malir Halt to Dolmen Mall Clifton",
      "List all Sheraz Coach stops",
    ],
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function processTransitQuery(message: string): ApiResponse {
  const text = message.trim();
  const lang = detectLanguage(text);
  const roman = isRoman(lang);
  const lower = text.toLowerCase();

  if (!text) return buildHelp(lang);

  // 1. Small talk ------------------------------------------------------------
  if (isGreeting(lower)) return buildGreeting(lang);
  if (isThanks(lower)) {
    return {
      response: roman ? "Koi baat nahi — safar aasan rahe! 🚌" : "You're welcome — have a great ride! 🚌",
      clarify: null,
      follow_ups: ["List all EV-1 stops", "Sheraz Coach timings"],
    };
  }
  if (isHelpRequest(lower)) return buildHelp(lang);

  // 2. Stop list --------------------------------------------------------------
  if (isStopListQuery(lower)) {
    const route = findRouteByMessage(lower);
    return buildStopsList(route ?? null, lang);
  }

  // 3. Timings ----------------------------------------------------------------
  if (isTimingsQuery(lower)) {
    const route = findRouteByMessage(lower);
    return buildTimings(route ?? null, lang);
  }

  // 4. Route info (route named, no A→B) ---------------------------------------
  const namedRoute = findRouteByMessage(lower);

  // 5. Journey planning ---------------------------------------------------------
  const { originRaw, destinationRaw } = extractEndpoints(text);

  if (originRaw || destinationRaw) {
    const originEntry = originRaw ? resolveStopInPhrase(originRaw) : undefined;
    const destEntry = destinationRaw ? resolveStopInPhrase(destinationRaw) : undefined;

    // Unknown endpoint(s): clarify with suggestions
    if (originRaw && !originEntry && !destinationRaw) {
      return buildClarify("origin", originRaw, undefined, roman);
    }
    if (destinationRaw && !destEntry && !originRaw) {
      return buildClarify("destination", destinationRaw, undefined, roman);
    }
    if (originRaw && originEntry && destinationRaw && !destEntry) {
      return buildClarify("destination", destinationRaw, originEntry.canonical, roman);
    }
    if (destinationRaw && destEntry && originRaw && !originEntry) {
      return buildClarify("origin", originRaw, destEntry.canonical, roman);
    }
    if (originRaw && !originEntry && destinationRaw && !destEntry) {
      return buildBothUnknown(originRaw, destinationRaw, lang);
    }

    // Only one endpoint resolved → ask for the missing one
    if (originEntry && !destinationRaw) return buildMissingDestination(originEntry.canonical, lang);
    if (destEntry && !originRaw) return buildMissingOrigin(destEntry.canonical, lang);

    const origin = originEntry!.canonical;
    const destination = destEntry!.canonical;

    // Edge case: same origin & destination
    if (origin === destination) return buildSamePlace(origin, lang);

    // Route matching
    const oRoute = routeForStop(origin);
    const dRoute = routeForStop(destination);

    if (oRoute && dRoute && oRoute.route_id === dRoute.route_id) {
      return buildJourney(origin, destination, oRoute, lang);
    }

    if (oRoute && dRoute) return buildCrossRoute(origin, destination, lang);

    // One endpoint resolves but has no route (defensive — shouldn't happen)
    if (!oRoute) return buildClarify("origin", origin, destination, roman);
    return buildClarify("destination", destination, origin, roman);
  }

  // 6. Fare policy for a named route ------------------------------------------
  if (namedRoute && isFarePolicyQuery(lower)) {
    return buildRouteInfo(namedRoute, lang);
  }

  // 7. Single stop mentioned (no connector) ------------------------------------
  const singleStop = POPULAR_STOPS.concat(
    ROUTES.flatMap((r) => r.canonical_stops.map((s) => s.official_name))
  ).find((s) => lower.includes(s.toLowerCase()));

  if (singleStop) {
    return buildMissingDestination(singleStop, lang);
  }

  // 8. Route info ---------------------------------------------------------------
  if (namedRoute) return buildRouteInfo(namedRoute, lang);

  // 9. Fallback help --------------------------------------------------------------
  return {
    response: roman
      ? `Samajh nahi aaya. Main bus routes, stops, kiraya aur timings ke bare mein batata hoon — misal: "Safoora se Tower kiraya" ya "EV-1 ki stops".`
      : `I didn't quite catch that. I can help with bus routes, stops, fares and timings — try "Fare from Safoora to Tower" or "EV-1 stops".`,
    clarify: null,
    follow_ups: ["Help", "List all Sheraz Coach stops", "Malir Halt to Dolmen Mall Clifton"],
  };
}

export { SHERAZ, EV1, ROUTES };
