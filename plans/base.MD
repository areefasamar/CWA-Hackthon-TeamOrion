# Karachi Transit AI — Technical Architecture Document

## 1. System Overview

Karachi Transit AI is a conversational journey-planning engine that converts messy, multilingual commuter queries (English, Roman Urdu, Urdu voice/script) into structured, real-time transit recommendations for Karachi's bus network. The system fuses static route knowledge, live GPS telemetry, crowdsourced disruption reports, and historical commuter reviews into a single LLM-driven reasoning pipeline that outputs a strict JSON journey card.

**Core design principle:** The LLM is a *reasoning and synthesis layer* sitting on top of four independently maintained data stores. It does not own data — it queries, cross-references, and narrates it.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│   Mobile App (Android/iOS)  |  Voice Assistant Front-End | WhatsApp  │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────────┐
│                        INPUT NORMALIZATION LAYER                       │
│  - Audio capture (mic)                                                 │
│  - Speech-to-Text: ur-PK / Whisper API (Urdu voice)                    │
│  - Standard ASR (English voice)                                        │
│  - Raw text ingestion (Roman Urdu / English / Urdu script)             │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  (normalized text prompt)
┌───────────────────────────────▼───────────────────────────────────────┐
│                     ORCHESTRATION / API GATEWAY                        │
│  - Auth, rate limiting, request logging                                │
│  - Session/context management (multi-turn convo state)                 │
│  - Routes request to Reasoning Engine with injected data context       │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────────┐
│                  DATA RETRIEVAL / CONTEXT BUILDER                      │
│   Pulls & pre-filters relevant slices from 4 data streams before       │
│   injecting into LLM context window (to control token cost/latency)    │
│                                                                          │
│   ┌───────────────┐ ┌────────────────┐ ┌──────────────┐ ┌───────────┐ │
│   │ Stream 1       │ │ Stream 2        │ │ Stream 3     │ │ Stream 4  │ │
│   │ routes.json    │ │ bus_telemetry   │ │ active_      │ │ route_    │ │
│   │ (static)       │ │ .json (live)    │ │ disruptions  │ │ reviews   │ │
│   │                │ │                 │ │ .json (live) │ │ .json     │ │
│   └───────────────┘ └────────────────┘ └──────────────┘ └───────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  (LLM prompt: system prompt + 4 streams + user query)
┌───────────────────────────────▼───────────────────────────────────────┐
│                       LLM REASONING ENGINE                             │
│   6-stage pipeline (NLU → Matching → Telemetry Filter →                │
│   Disruption Reroute → Tip Enrichment → Response Synthesis)            │
│   Outputs strict JSON journey card                                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────────┐
│                    RESPONSE VALIDATION LAYER                           │
│  - JSON schema validation                                               │
│  - Fallback handling if malformed / NO_ROUTE_FOUND                     │
│  - Language-match verification (output matches input language)         │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────────┐
│                        CLIENT RENDERING LAYER                          │
│  - Journey card UI, map overlay, step-by-step directions               │
│  - Text-to-Speech for voice-first users                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Layer — Detailed Structure

### 3.1 Stream 1: Static Route Catalog (`routes.json`)
- **Type:** Cold/static data, versioned and manually curated or bulk-imported.
- **Responsibility:** Structural transit knowledge — the "map" of the system.
- **Contents:**
  - Route definitions (route_id, route_name, operator — e.g., Peoples Bus EV, Pink Bus, W-11 mini bus).
  - Ordered stop sequences per route with coordinates.
  - Fare tables (official fare per route/segment).
  - **Alias mapping table**: informal landmark/slang → canonical stop ID (e.g., "Numaish", "Gurumandar", "Nipa", "Metropole", "Dolmen").
  - Interchange/transfer point metadata (e.g., Numaish Chowrangi, Karsaz) used for multi-leg journeys.
- **Update cadence:** Low-frequency (new routes, fare revisions, alias dictionary growth).
- **Storage suggestion:** Relational DB or structured document store (source of truth), served to the reasoning layer as a filtered JSON slice.

### 3.2 Stream 2: Mocked Bus GPS Telemetry (`bus_telemetry.json`)
- **Type:** Hot/real-time data, high write frequency.
- **Responsibility:** Live position tracking of active buses.
- **Contents:**
  - Bus ID, route ID, current lat/long, last-updated timestamp, direction/heading, current speed.
  - Derived field: estimated distance/time to a given stop.
- **Update cadence:** Seconds-level refresh (real system) or simulated tick interval (mocked/demo system).
- **Storage suggestion:** In-memory store / time-series-friendly cache (e.g., Redis-style key-value) for low-latency reads; not suited to a traditional relational store at scale.
- **Consumption pattern:** Only the subset of buses near the user's route/origin needs to be pulled into context — full telemetry dump would be wasteful.

### 3.3 Stream 3: Live Incident Feed (`active_disruptions.json`)
- **Type:** Hot/real-time, user-generated, ephemeral.
- **Responsibility:** Temporary road/route blockage awareness.
- **Contents:**
  - Incident ID, affected route segment(s)/stop(s), incident type (flooding, protest, accident, road closure), free-text description, reporter type (in-bus rider vs. roadside), timestamp, expiry/TTL.
- **Update cadence:** Continuous, community-submitted; needs moderation/decay logic (auto-expire stale reports).
- **Storage suggestion:** Append-only event log with a TTL/expiry job; queried by route-segment overlap.
- **Trust/quality layer (recommended):** Confidence scoring based on report volume/recency to avoid single-report false positives.

### 3.4 Stream 4: Commuter Review Store (`route_reviews.json`)
- **Type:** Warm data, semi-static, grows over time.
- **Responsibility:** Informal local intelligence layer.
- **Contents:**
  - Route ID, review text, timestamp, tags/categories (fare dispute, overcrowding, AC status, safety, timing reliability).
  - Optionally: sentiment/tag extraction pre-computed offline so the LLM doesn't have to parse raw free text at query time.
- **Update cadence:** Medium — new reviews trickle in; periodic batch summarization recommended (e.g., nightly job that condenses reviews into short "tip" strings per route to reduce prompt bloat).
- **Storage suggestion:** Document store indexed by route_id; consider a pre-aggregation/summarization microservice to keep only the top N relevant tips per route available for injection.

---

## 4. Input Layer — Modalities & Normalization

| Input Type | Mechanism | Processing Path |
|---|---|---|
| Voice (Urdu) — priority | Microphone capture | STT via ur-PK model or Whisper API → text → NLU |
| Voice (English) | Microphone capture | Standard ASR → text → NLU |
| Text (Roman Urdu) | Direct text input | Passed directly into LLM system prompt context, no translation layer |
| Text (English) | Direct text input | Passed directly as natural language query |
| Text/Voice (Urdu script) | Input or STT output | Passed directly; LLM handles script natively |

**Design note:** No separate machine-translation step — the LLM itself is responsible for understanding Roman Urdu/code-switched input and responding in the same register. This reduces pipeline hops but means prompt engineering and alias-mapping quality directly determine accuracy.

---

## 5. Reasoning Pipeline — Stage-by-Stage Architecture

### Stage 1: Intent & Entity Extraction (NLU + Alias Mapping)
- **Input:** Raw normalized text.
- **Extracts:** Origin, Destination, Departure Time (if given), User Preference.
- **Preference vocabulary:**
  - "Sasti"/"Budget" → optimize for lowest fare.
  - "Jaldi"/"Fast" → optimize for shortest wait + travel time via live telemetry.
  - "Sukoon"/"AC" → optimize for comfort (prioritize EV/Pink bus fleet over mini buses).
- **Alias resolution:** Fuzzy-matches informal landmark names against Stream 1's alias dictionary to resolve to canonical stop IDs.
- **Failure mode handling:** If origin/destination can't be resolved to any known stop, short-circuit to a clarification response rather than proceeding.

### Stage 2: Baseline Route Matching
- **Queries:** Stream 1 only.
- **Logic:** Graph search over the static route network.
  1. Look for a direct single-route path.
  2. If none, search for valid 1-transfer paths through known interchange nodes (e.g., Numaish Chowrangi, Karsaz).
  3. Cap search depth at 1 transfer to keep responses practical (configurable).
- **Output:** Candidate route set (ranked list of route IDs / route+transfer combos).

### Stage 3: Real-Time Telemetry Filtering
- **Queries:** Stream 2, scoped to candidate routes from Stage 2.
- **Logic:** For each candidate route, find nearest active bus to the user's origin stop; compute ETA.
- **Ranking effect:** A candidate with a 3-minute ETA bus outranks a nominally "better" route with a 35-minute wait, unless user preference explicitly overrides (e.g., "sasti" cares about fare more than wait time).

### Stage 4: Disruption Rerouting & Override
- **Queries:** Stream 3, scoped to the path segments of surviving candidates.
- **Logic:**
  - If a segment overlaps an active incident → mark leg invalid.
  - Attempt automatic recompute through an alternate transfer point.
  - If no valid alternate exists → set `status: "WARNING_REROUTED"` or `"NO_ROUTE_FOUND"` and surface the disruption text to the user.
- **This stage can trigger a loop back to Stage 2** with the disrupted segment excluded from the graph search.

### Stage 5: Qualitative Tip Enrichment
- **Queries:** Stream 4, scoped to final selected route ID(s).
- **Logic:** Pull top-relevance tips (fare-collection discrepancies, overcrowding windows, AC reliability) to attach as `commuter_tips`.
- **Recommended optimization:** Use pre-summarized tips (see §3.4) rather than raw review dumps to control prompt size.

### Stage 6: Multi-Lingual Response Synthesis
- **Compiles:** Selected route + ETA + disruption status + fare + tips into the final schema.
- **Language matching:** Output `summary_text` must mirror the detected input language/register from Stage 1.
- **Constraint enforcement:** Output must be valid JSON only, matching the fixed schema — no prose outside the JSON block.

---

## 6. Prompt / LLM Layer Architecture

- **System prompt:** Fixed instruction block defining persona ("Karachi Transit AI"), parsing rules, alias-normalization rules, preference vocabulary, the 6-step reasoning order, and the strict output schema.
- **Context injection:** The 4 data streams are injected as structured JSON blocks into the prompt at request time — ideally *pre-filtered* by the Data Retrieval layer (§2) rather than dumping entire datasets, to manage token budget and latency.
- **Output contract:** Strict JSON schema (`reasoning_trace` + `journey_card`) — no markdown, no freeform prose outside the object.
- **Statelessness:** Each request should be treated as stateless from the LLM's perspective unless multi-turn context (e.g., "actually make it faster instead") is explicitly passed in as conversation history by the orchestration layer.

---

## 7. Output Schema Structure

```
reasoning_trace
 ├── extracted_intent (origin, destination, preference, detected_language)
 ├── matched_routes []
 ├── applied_disruptions []
 └── selected_strategy

journey_card
 ├── status: RECOMMENDED | WARNING_REROUTED | NO_ROUTE_FOUND
 ├── primary_route_name
 ├── estimated_fare
 ├── estimated_wait_time_mins
 ├── has_disruption (bool)
 ├── disruption_warning (nullable string)
 ├── steps []
 │    ├── step_number
 │    ├── action (BOARD / TRANSFER / ALIGHT)
 │    ├── route_id
 │    ├── stop_name
 │    └── instructions
 ├── commuter_tips []
 └── summary_text (localized to input language)
```

- `reasoning_trace` is primarily for internal debugging/observability and analytics — can be stripped before rendering to end users if not needed client-side.
- `journey_card` is the user-facing payload.

---

## 8. Cross-Cutting Concerns

### 8.1 Latency Budget
- STT (voice path): adds ~0.5–2s depending on provider.
- Data retrieval/pre-filtering: should be sub-200ms (in-memory/cache lookups for Streams 2 & 3).
- LLM inference: dominant latency cost — minimize injected context size via pre-filtering, not raw dumps.

### 8.2 Reliability & Fallbacks
- Schema validation layer must catch malformed LLM output and retry or fall back to a deterministic "NO_ROUTE_FOUND" response.
- Stream 2/3 staleness handling: if telemetry/disruption feeds haven't updated within an expected window, flag data as "stale" rather than presenting it as live fact.

### 8.3 Data Quality & Trust
- Stream 3 (user-submitted incidents) needs a confidence/decay mechanism to avoid acting on a single unverified report.
- Stream 4 (reviews) benefits from periodic offline summarization to prevent prompt bloat and reduce noise from outdated comments.

### 8.4 Observability
- Log `reasoning_trace` per request for debugging routing decisions and auditing why a particular route was recommended.
- Track metrics: alias-resolution failure rate, NO_ROUTE_FOUND rate, disruption-triggered reroute rate, per-language usage split.

### 8.5 Scalability Considerations
- Stream 1: low write volume, can be cached aggressively (CDN/edge cache for read-heavy static data).
- Streams 2 & 3: high write volume, need a fast key-value/cache layer and geo-indexed queries (e.g., geospatial index for "buses near X").
- Stream 4: moderate volume, can tolerate eventual consistency and batch processing.

### 8.6 Security & Privacy
- Voice data (Urdu/English) should be processed and discarded per a defined retention policy unless the user opts into storage for personalization.
- User-submitted disruption reports (Stream 3) should be rate-limited per user/device to prevent spam or malicious false reports.

---

## 9. Suggested Component Ownership Map

| Component | Nature | Suggested Ownership |
|---|---|---|
| Input Normalization (STT/ASR) | External API / managed service | Platform team |
| Data Retrieval / Context Builder | Backend service | Backend team |
| Routes Catalog (Stream 1) | Data store + admin tooling | Data/Ops team |
| Telemetry Ingestion (Stream 2) | Real-time pipeline | Backend/Infra team |
| Disruption Feed (Stream 3) | User-generated content pipeline + moderation | Backend + Trust & Safety |
| Review Store (Stream 4) | Data store + summarization job | Backend + Data team |
| LLM Reasoning Engine | Prompted model integration | AI/ML team |
| Response Validator | Backend middleware | Backend team |
| Client Rendering | Mobile/Web/Voice UI | Frontend team |

---

## 10. Summary

The architecture separates concerns cleanly into four data domains (static structure, live position, live disruption, historical sentiment), a normalization layer for multilingual/voice input, and a single LLM reasoning stage that executes a fixed six-step decision pipeline before emitting a strictly-schema'd JSON journey card. The main engineering levers for quality and cost are (1) pre-filtering data streams before LLM context injection, (2) maintaining a robust alias-mapping dictionary for Karachi-specific slang/landmarks, and (3) building trust/decay mechanisms around the two live, user-generated streams (telemetry mocking aside, disruptions and reviews are the noisiest inputs).