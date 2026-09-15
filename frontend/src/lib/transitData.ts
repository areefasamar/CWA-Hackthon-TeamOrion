// =============================================================================
// Safar — Static route data layer (mocked data source)
// Loads dataset.json, builds a fast alias -> stop index, and exposes typed
// route records + helpers. Single source of truth for the chatbot engine,
// UI panels, and the route visualizer.
// =============================================================================

import rawDataset from "@/data/dataset.json";

export interface CanonicalStop {
  sequence: number;
  stop_id: string;
  official_name: string;
  is_terminal?: boolean;
  coordinates?: { lat: number; lng: number };
  sub_landmarks?: string[];
}

export interface StageFareEntry {
  from_stop_id?: string;
  to_stop_id?: string;
  up_to_landmark?: string;
  beyond_landmark?: string;
  fare_pkr: number;
}

export interface FarePolicy {
  type: "STAGE_BASED" | "ZONE_BASED";
  currency: string;
  minimum_fare?: number;
  maximum_fare?: number;
  payment_methods: string[];
  short_distance_fare?: number;
  long_distance_fare?: number;
  fare_threshold_landmark?: string;
}

export interface RouteRecord {
  route_id: string;
  route_name: string;
  bus_type: string;
  operator: string;
  ac_available: boolean;
  status: string;
  operating_hours: { start: string; end: string };
  route_distance_km?: number;
  fare_policy: FarePolicy;
  route_aliases: string[];
  canonical_stops: CanonicalStop[];
  stage_fares: StageFareEntry[];
  karachi_alias_dictionary: Record<string, string>;
}

export const ROUTES: RouteRecord[] = rawDataset as unknown as RouteRecord[];

export const SHERAZ: RouteRecord = ROUTES.find((r) => r.route_id === "SHERAZ-01") ?? ROUTES[0];
export const EV1: RouteRecord =
  ROUTES.find((r) => r.route_aliases.some((a) => a.toLowerCase().includes("ev"))) ?? ROUTES[1] ?? ROUTES[0];

// ---------------------------------------------------------------------------
// Alias index: normalized alias -> { canonical stop name, route_id }
// ---------------------------------------------------------------------------

export interface AliasEntry {
  canonical: string;
  route_id: string;
}

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const ALIAS_INDEX = new Map<string, AliasEntry>();

for (const route of ROUTES) {
  for (const stop of route.canonical_stops) {
    // official name
    ALIAS_INDEX.set(norm(stop.official_name), {
      canonical: stop.official_name,
      route_id: route.route_id,
    });
    // sub landmarks
    for (const lm of stop.sub_landmarks || []) {
      const key = norm(lm);
      if (key && !ALIAS_INDEX.has(key)) {
        ALIAS_INDEX.set(key, { canonical: stop.official_name, route_id: route.route_id });
      }
    }
  }
  // per-route alias dictionaries
  for (const [alias, target] of Object.entries(route.karachi_alias_dictionary || {})) {
    const key = norm(alias);
    if (key && !ALIAS_INDEX.has(key)) {
      const stop = route.canonical_stops.find((s) => s.official_name === target);
      if (stop) {
        ALIAS_INDEX.set(key, { canonical: stop.official_name, route_id: route.route_id });
      }
    }
  }
}

export function lookupAlias(key: string): AliasEntry | undefined {
  return ALIAS_INDEX.get(norm(key));
}

// ---------------------------------------------------------------------------
// Fuzzy matching (Levenshtein) for typo tolerance
// ---------------------------------------------------------------------------

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

const ALL_STOPS: { name: string; route_id: string }[] = ROUTES.flatMap((r) =>
  r.canonical_stops.map((s) => ({ name: s.official_name, route_id: r.route_id }))
);

/**
 * Resolve free text to a canonical stop name.
 * 1) exact alias hit  2) longest alias contained in the text  3) typo tolerance
 */
export function resolveStop(input: string): AliasEntry | undefined {
  const key = norm(input);
  if (!key) return undefined;

  const direct = ALIAS_INDEX.get(key);
  if (direct) return direct;

  // longest alias contained within the phrase (skip 1–2 char aliases)
  let best: AliasEntry | undefined;
  let bestLen = 0;
  for (const [alias, entry] of ALIAS_INDEX) {
    if (alias.length >= 4 && key.includes(alias) && alias.length > bestLen) {
      best = entry;
      bestLen = alias.length;
    }
  }
  if (best) return best;

  // typo tolerance against official stop names AND aliases (small edit distance)
  let typoBest: { entry: AliasEntry; dist: number } | null = null;
  for (const s of ALL_STOPS) {
    const dist = levenshtein(key, norm(s.name));
    const maxDist = s.name.length > 12 ? 3 : 2;
    if (dist <= maxDist && (!typoBest || dist < typoBest.dist)) {
      typoBest = { entry: { canonical: s.name, route_id: s.route_id }, dist };
    }
  }
  for (const [alias, entry] of ALIAS_INDEX) {
    const maxDist = alias.length > 12 ? 3 : alias.length >= 6 ? 2 : 1;
    const dist = levenshtein(key, alias);
    if (dist <= maxDist && dist > 0 && (!typoBest || dist < typoBest.dist)) {
      typoBest = { entry, dist };
    }
  }
  return typoBest?.entry;
}

function stripPunct(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve a possibly noisy phrase ("ned jana hai mai kesai ja skti") by trying
 * every n-gram of the phrase against the alias index, longest first, then
 * falling back to fuzzy resolveStop.
 */
export function resolveStopInPhrase(phrase: string): AliasEntry | undefined {
  const clean = stripPunct(phrase);
  if (!clean) return undefined;
  const words = clean.split(" ");
  for (let size = words.length; size >= 1; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      const gram = words.slice(start, start + size).join(" ");
      const hit = ALIAS_INDEX.get(gram);
      if (hit) return hit;
    }
  }
  return resolveStop(phrase);
}

/**
 * Stops on OTHER routes whose names share a meaningful token with the given
 * stop (e.g. "CMH Malir Cantt" → "CP 06 Malir Cantt"). Used to offer a
 * likely-intended alternate when a journey turns out cross-route.
 */
export function findNameAlternates(stopName: string, limit = 2): string[] {
  const tokens = stripPunct(stopName)
    .split(" ")
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return [];
  const ownRoute = routeForStop(stopName);
  const out: string[] = [];
  for (const s of ALL_STOPS) {
    if (ownRoute && s.route_id === ownRoute.route_id) continue;
    const other = stripPunct(s.name).split(" ");
    const shared = tokens.filter((t) => other.includes(t));
    if (shared.length > 0 && !out.includes(s.name)) out.push(s.name);
  }
  return out.slice(0, limit);
}

/** Top N canonical stop suggestions for an unmatched input (for clarify chips). */
export function suggestStops(input: string, limit = 4): string[] {
  const key = norm(input);
  if (!key) return [];
  const scored = ALL_STOPS.map((s) => ({
    name: s.name,
    dist: levenshtein(key, norm(s.name)),
    contains: norm(s.name).includes(key) || key.includes(norm(s.name)),
  }));
  scored.sort((a, b) => {
    if (a.contains !== b.contains) return a.contains ? -1 : 1;
    return a.dist - b.dist;
  });
  return scored.slice(0, limit).map((s) => s.name);
}

/** All known stop names, optionally for one route. */
export function allStopNames(routeId?: string): string[] {
  return ROUTES.filter((r) => !routeId || r.route_id === routeId).flatMap((r) =>
    r.canonical_stops.map((s) => s.official_name)
  );
}

/**
 * Other stops whose names share a meaningful token with the given stop
 * (e.g. "CMH Malir Cantt" ↔ "CP 06 Malir Cantt"). Used to disambiguate
 * cross-route journeys.
 */
export function findStopAlternates(stopName: string, excludeRouteId?: string): string[] {
  const tokens = stripPunct(stopName)
    .split(" ")
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return [];
  const alts: string[] = [];
  for (const r of ROUTES) {
    for (const s of r.canonical_stops) {
      if (s.official_name === stopName) continue;
      const otherTokens = stripPunct(s.official_name).split(" ");
      const shares = tokens.some((t) => otherTokens.includes(t));
      if (shares) alts.push(s.official_name);
    }
  }
  return alts;
}

/** Does a stop belong to the given route? */
export function routeForStop(stopName: string): RouteRecord | undefined {
  return ROUTES.find((r) => r.canonical_stops.some((s) => s.official_name === stopName));
}

export function stopSequence(route: RouteRecord, stopName: string): number | undefined {
  return route.canonical_stops.find((s) => s.official_name === stopName)?.sequence;
}

/** Stops between two stops inclusive, ordered along travel direction. */
export function stopsBetween(
  route: RouteRecord,
  from: string,
  to: string
): CanonicalStop[] {
  const a = stopSequence(route, from);
  const b = stopSequence(route, to);
  if (a === undefined || b === undefined) return [];
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return route.canonical_stops.filter((s) => s.sequence >= lo && s.sequence <= hi);
}

// ---------------------------------------------------------------------------
// Fare calculation (from dataset fare tables — not invented)
// ---------------------------------------------------------------------------

/** Sheraz Coach stage fare: closest listed from_stop_id entry for the pair. */
export function sherazFare(fromStop: string, toStop: string): number | null {
  const fromId = SHERAZ.canonical_stops.find((s) => s.official_name === fromStop)?.stop_id;
  const toId = SHERAZ.canonical_stops.find((s) => s.official_name === toStop)?.stop_id;
  if (!fromId || !toId) return null;

  // exact from->to entry
  const exact = SHERAZ.stage_fares.find(
    (f) => f.from_stop_id === fromId && f.to_stop_id === toId
  );
  if (exact) return exact.fare_pkr;

  // table is written from CP-06: reuse symmetric logic via nearest listed from-stop
  const seqFrom = stopSequence(SHERAZ, fromStop) ?? 0;
  const seqTo = stopSequence(SHERAZ, toStop) ?? 0;
  const anchor = SHERAZ.stage_fares
    .filter((f) => f.to_stop_id)
    .map((f) => ({
      seq: stopSequence(SHERAZ, SHERAZ.canonical_stops.find((s) => s.stop_id === f.to_stop_id)?.official_name ?? "") ?? 0,
      fare: f.fare_pkr,
      delta: f.from_stop_id === fromId ? Math.abs(seqTo - seqFrom) : null,
    }))
    .filter((x) => x.delta !== null)
    .sort((a, b) => (a.delta ?? 99) - (b.delta ?? 99));
  if (anchor.length > 0) return anchor[0].fare;

  // fallback: bracket by distance between listed anchor fares from CP-06
  const table = SHERAZ.stage_fares
    .filter((f) => f.from_stop_id === "SHZ-STP-01" && f.to_stop_id)
    .map((f) => ({
      seq: stopSequence(SHERAZ, SHERAZ.canonical_stops.find((s) => s.stop_id === f.to_stop_id)?.official_name ?? "") ?? 0,
      fare: f.fare_pkr,
    }))
    .sort((a, b) => a.seq - b.seq);
  const dist = Math.abs(seqTo - seqFrom);
  for (const row of table) {
    if (dist <= row.seq - 1) return row.fare;
  }
  return SHERAZ.fare_policy.maximum_fare ?? 100;
}

/** EV-1 zone fare: 80 up to Malir Halt cutoff, 120 beyond. */
export function ev1Fare(fromStop: string, toStop: string): number {
  const cutoff = EV1.fare_policy.fare_threshold_landmark ?? "Malir Halt";
  const cutoffSeq = stopSequence(EV1, cutoff) ?? 5;
  const a = stopSequence(EV1, fromStop) ?? 0;
  const b = stopSequence(EV1, toStop) ?? 0;
  const hi = Math.max(a, b);
  return hi <= cutoffSeq
    ? EV1.fare_policy.short_distance_fare ?? 80
    : EV1.fare_policy.long_distance_fare ?? 120;
}

/** Numeric fare (PKR) for a journey on a route. */
export function fareValue(route: RouteRecord, from: string, to: string): number | null {
  return route.fare_policy.type === "STAGE_BASED"
    ? sherazFare(from, to)
    : ev1Fare(from, to);
}

/** Human-readable fare string for a journey on a route. */
export function fareFor(route: RouteRecord, from: string, to: string): string {
  const pkr =
    route.fare_policy.type === "STAGE_BASED"
      ? sherazFare(from, to)
      : ev1Fare(from, to);
  return pkr === null
    ? `Rs. ${route.fare_policy.minimum_fare ?? 20}–${route.fare_policy.maximum_fare ?? 100}`
    : `Rs. ${pkr}`;
}

// ---------------------------------------------------------------------------
// Route helpers used by UI + chatbot
// ---------------------------------------------------------------------------

export function routeByName(query: string): RouteRecord | undefined {
  const q = norm(query);
  return ROUTES.find(
    (r) =>
      r.route_aliases.some((a) => q.includes(norm(a)) || norm(a).includes(q)) ||
      q.includes(norm(r.route_name))
  );
}

export function findRouteByMessage(text: string): RouteRecord | undefined {
  const t = norm(text);
  const hits = ROUTES.filter(
    (r) =>
      r.route_aliases.some((a) => t.includes(norm(a))) ||
      t.includes(norm(r.route_name))
  );
  // prefer the more specific match (longer alias)
  if (hits.length > 1) {
    return hits.sort(
      (a, b) =>
        Math.max(...b.route_aliases.map((x) => x.length)) -
        Math.max(...a.route_aliases.map((x) => x.length))
    )[0];
  }
  return hits[0];
}

export function routeSummaryLine(r: RouteRecord): string {
  const first = r.canonical_stops[0]?.official_name ?? "?";
  const last = r.canonical_stops[r.canonical_stops.length - 1]?.official_name ?? "?";
  const ac = r.ac_available ? "AC" : "Non-AC";
  return `${r.route_name}: ${first} ⇄ ${last} · ${r.canonical_stops.length} stops · ${ac} · ${r.operating_hours.start}–${r.operating_hours.end}`;
}
