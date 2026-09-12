# Karachi Transit AI — Hackathon Project Implementation Plan (1-Bus MVP)

## Executive Summary & Scope Definition

This plan adapts the full **Karachi Transit AI Technical Architecture (`base.MD`)** into a lean, demo-ready **Hackathon MVP**. 

### Key Constraints & Adjustments:
1. **Client Interface:** Web-based Chatbot application (responsive, modern UI with interactive journey cards and route visualization).
2. **Data Scope:** Scoped to **1 Bus Route / 1 Active Bus** (e.g., **Peoples Bus Service Route 1 / EV-1**: *Model Colony ⇄ Tower* via Sharea Faisal / Saddar).
   - Demonstrates all 4 architectural data streams without overwhelming data curation overhead.
   - Allows high-fidelity telemetry simulation, live disruption injection, and authentic local commuter tips.
3. **Team Structure:** Divided among **4 Team Members** with clear ownership and zero blocker dependencies.
4. **Timeline:** Structured into **3 Progressive Phases** leading to a polished live presentation.

---

## Team Roles & Ownership Matrix

| Role | Assigned Area | Primary Responsibilities |
|---|---|---|
| **Member 1 (M1)** | **Backend & LLM Orchestration Lead** | Fast API / Node.js API Gateway, 6-stage reasoning pipeline prompt integration, context builder, strict JSON response validator & fallbacks. |
| **Member 2 (M2)** | **Frontend & UI/UX Engineer** | Web Chatbot interface, interactive Journey Card renderer, 1-Bus visual route tracker / live map progress, responsive design & micro-interactions. |
| **Member 3 (M3)** | **Data Architecture & Telemetry Simulator** | Curating Route 1 dataset (`routes.json`, alias dictionary), mock live bus GPS ticker (`bus_telemetry.json`), disruption feed (`active_disruptions.json`), commuter review store (`route_reviews.json`), demo control toggles. |
| **Member 4 (M4)** | **Multilingual AI, Voice & QA/Demo Lead** | Multilingual prompt engineering (Roman Urdu, Urdu script, English), Web Voice STT/TTS integration, alias mapping accuracy, test suites, and pitch demo script. |

---

## The 1-Bus Target Domain: Route 1 (Model Colony ⇄ Tower)

- **Operator:** Peoples Bus Service (Red/EV Bus Fleet)
- **Fleet Unit:** Bus ID `PB-101` (Active electric AC bus)
- **Key Stops (Westbound):**
  1. Model Colony (Origin terminal)
  2. Malir Halt
  3. Star Gate (Airport Road)
  4. Drigh Road Station
  5. Karsaz (National Stadium turn)
  6. Baloch Colony
  7. Nursery (PECHS)
  8. FTC (Finance & Trade Centre)
  9. Metropole Hotel (Saddar / Club Road)
  10. Arts Council / Sindh Assembly
  11. Tower (Merewether Clock Tower — Destination terminal)
- **Official Fare:** Rs. 50 flat (EV / Peoples Bus rate)

---

## Phase 1: Core Foundation & Static Route Baseline

> **Goal:** Establish working client-server communication, render static route and fare answers for Route 1, and validate the LLM JSON journey card schema.

```
┌─────────────────┐        HTTP / WebSocket       ┌──────────────────────┐
│  M2: Web Chat   │ ────────────────────────────► │ M1: Backend Gateway  │
│  Interface      │ ◄──────────────────────────── │ + LLM Prompt Engine  │
└─────────────────┘       JSON Journey Card       └──────────┬───────────┘
                                                             │
                                                  ┌──────────▼───────────┐
                                                  │ M3: Stream 1         │
                                                  │ routes.json (Route 1)│
                                                  └──────────────────────┘
```

### Member Tasks:
- **Member 1 (Backend & LLM):**
  - Initialize backend project (FastAPI / Express.js) with CORS and environment configuration.
  - Implement `/api/chat` POST endpoint receiving `{ message: string, session_id: string }`.
  - Design initial LLM System Prompt enforcing JSON-only output format matching `journey_card` specification.
  - Implement Stream 1 context injection into LLM prompt.

- **Member 2 (Frontend & UI/UX):**
  - Scaffold web application (React + Vite or Next.js) with modern typography and sleek theme.
  - Build chat container: chat bubble feed, message input box, send button, and quick-prompt chips (e.g., *"Model Colony se Tower kitna kiraya hai?"*, *"Next bus kab hai?"*).
  - Create basic Journey Card card component displaying: Route Name, Origin, Destination, Estimated Fare, and Step-by-step instructions.

- **Member 3 (Data & Simulation):**
  - Create `data/routes.json` for Route 1:
    - Ordered stop list with sequence numbers and approximate GPS lat/long.
    - Fare structure (Rs. 50 flat).
    - Comprehensive **Karachi Alias Dictionary** mapping colloquial names to canonical stops:
      - *"Airport/Jinnah"* → `Star Gate`
      - *"Lal Kothi / Drigh Road"* → `Drigh Road Station`
      - *"Avari / Metropol"* → `Metropole Hotel`
      - *"Karsaz Chowrangi"* → `Karsaz`
      - *"Tower / Kharadar"* → `Tower`

- **Member 4 (Multilingual AI & QA):**
  - Define system persona: *"Karachi Transit AI — Dost aur Guide"*.
  - Build prompt instructions for language detection (English vs. Roman Urdu vs. Urdu script).
  - Prepare Phase 1 test dataset (15 test queries covering English and Roman Urdu fare & stop queries).
  - Verify alias resolution accuracy against `routes.json`.

### Phase 1 Deliverables & Milestone
- **Milestone 1:** User types *"Model Colony se Metropole jana hai, kitne paise lagenge?"* in the web chat. The backend queries `routes.json`, prompts the LLM, and returns a verified JSON journey card showing Rs. 50 fare, rendered cleanly on the web interface.

---

## Phase 2: Live Streams, Telemetry Ticker & Dynamic Rerouting

> **Goal:** Inject real-time dynamics: moving Bus PB-101 telemetry, live disruption handling (e.g. road protest / waterlogging), and qualitative commuter tips.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   M1: 6-Stage Reasoning Pipeline                       │
│  Stage 1: Intent & Alias Mapping ──► Stage 2: Baseline Route Match     │
│  Stage 3: Telemetry Filter (PB-101 ETA) ──► Stage 4: Disruption Check │
│  Stage 5: Commuter Tips Enrichment ──► Stage 6: Multilingual Synthesis│
└────────▲──────────────────────────▲────────────────────────▲──────────┘
         │                          │                        │
  ┌──────┴───────┐           ┌──────┴────────┐        ┌──────┴───────┐
  │ M3: Stream 2 │           │ M3: Stream 3  │        │ M3: Stream 4 │
  │ bus_telemetry│           │ disruptions   │        │ reviews.json │
  │ (live ticker)│           │ (mock alerts) │        │ (local tips) │
  └──────────────┘           └───────────────┘        └──────────────┘
```

### Member Tasks:
- **Member 1 (Backend & LLM):**
  - Implement Stage 3 (Telemetry Filtering): Read `bus_telemetry.json` to calculate current distance/ETA of `PB-101` from the user's boarding stop.
  - Implement Stage 4 (Disruption Evaluation): Read `active_disruptions.json`; if incident overlaps Route 1 segments, trigger `WARNING_REROUTED` or alternative boarding stop advice.
  - Implement Stage 5 (Tip Enrichment): Append top commuter tips from `route_reviews.json` into prompt context.
  - Add server-side fallback parser for robust JSON extraction from LLM response.

- **Member 2 (Frontend & UI/UX):**
  - Enhance Journey Card with rich dynamic elements:
    - **Live ETA Badge:** Pulsing indicator showing e.g., *"Bus PB-101 arrives in 7 mins"*.
    - **Disruption Warning Banner:** Amber/Red alert card when a route segment is affected.
    - **Commuter Tip Accordion / Pills:** e.g., *"AC is chilling"*, *"Keep exact Rs. 50 change"*.
  - Add **1-Bus Visual Route Progress Tracker**: A horizontal or vertical timeline showing all 11 stops with an animated bus icon representing PB-101's current position.

- **Member 3 (Data & Simulation):**
  - Build `scripts/telemetry_ticker.js` (or `.py`):
    - Periodically updates `data/bus_telemetry.json` simulating Bus `PB-101` moving along Route 1 stops at realistic speeds (e.g. progressing stop-to-stop every 30-45 seconds for demo purposes).
  - Create `data/active_disruptions.json`:
    - Seed with toggleable scenarios: e.g., *"Traffic jam at Metropole due to protest"* or *"Waterlogging near Drigh Road underpass"*.
  - Create `data/route_reviews.json`:
    - Populate with authentic commuter insights (rush hours, conductor behavior, card vs. cash payments).
  - Provide a lightweight **Demo Control Panel** (or CLI trigger) to easily trigger/clear disruptions and fast-forward bus position.

- **Member 4 (Multilingual AI & QA):**
  - Calibrate prompt behavior for disruption alerts in Roman Urdu (e.g., *"Khabardaar: Metropole par ehtijaj ki wajah se bus Arts Council se divert ho sakti hai"*).
  - Integrate browser-native **Web Speech API** for mic speech-to-text input directly in the chat UI.
  - Validate multi-turn conversations (e.g., Q1: *"Karsaz se Tower jana hai"* → Q2: *"AC wali bus hai?"*).
  - Log and track reasoning trace validation.

### Phase 2 Deliverables & Milestone
- **Milestone 2:** With the telemetry ticker running, user asks *"Karsaz par bus kab tak aayegi?"*. The system calculates ETA from PB-101's simulated coordinate, surfaces the live wait time, warns about any active disruption down the line at Metropole, and displays the animated bus position on the web UI.

---

## Phase 3: Polish, Voice, Edge Cases & Hackathon Demo Readiness

> **Goal:** Bulletproof the application, elevate visual aesthetics to a "wow" standard, integrate Text-to-Speech (TTS), and rehearse an airtight 3-minute hackathon pitch demo.

### Member Tasks:
- **Member 1 (Backend & LLM):**
  - Error resilience: Graceful fallbacks for unknown locations (`NO_ROUTE_FOUND`), API timeouts, or rate limits.
  - Add diagnostic debug endpoint `/api/debug/state` returning the full `reasoning_trace` for judging inspection.
  - Response caching / latency optimization to guarantee sub-2-second bot responses during live presentation.

- **Member 2 (Frontend & UI/UX):**
  - Aesthetic polish: Sleek dark/light theme, glassmorphic journey cards, smooth CSS micro-animations, loading skeletons.
  - Audio interface: Add audio waveform animation while user speaks and "Read Aloud" (TTS) speaker button on journey cards.
  - Demo Presets Bar: Add 3 one-click scenario chips for judges:
    1. 🟢 *Scenario A: Normal commute & live ETA (Roman Urdu)*
    2. 🟡 *Scenario B: Active disruption & reroute warning*
    3. 🔴 *Scenario C: Out-of-network / invalid stop handling*

- **Member 3 (Data & Simulation):**
  - Package simulation runner with automated reset script (`npm run demo:reset`).
  - Stress-test telemetry and disruption JSON updates under concurrent reads.
  - Ensure mock data represents realistic Karachi transit dynamics (fares, timings, localized terminology).

- **Member 4 (Multilingual AI & QA):**
  - Conduct full end-to-end testing across 30+ prompt variations (English, Roman Urdu, Urdu script).
  - Verify pronunciation and speech synthesis clarity for Roman Urdu voice output.
  - Author the **Hackathon Pitch Script & Live Demo Playbook** (exact 3-minute sequence of spoken query → live bus screen → judge wow factor).

### Phase 3 Deliverables & Milestone
- **Milestone 3:** A fully polished, high-performing web application running locally or on staging. A presenter speaks into the mic in Roman Urdu, the bot responds in real-time with voice and rich interactive cards, displaying live bus progress and handling dynamic disruption overrides seamlessly.

---

## Complete 3-Phase Timeline & Checkpoints

```
PHASE 1: Foundation (Hours 0 - 8)
├── M3: routes.json + Karachi Alias Map (Route 1)
├── M1: FastAPI / Express Gateway + LLM Prompt + JSON Schema
├── M2: Web Chatbot Shell + Static Journey Card
└── M4: Persona + Language Detection + Phase 1 Test Prompts
└── CHECKPOINT 1: Chatbot answers static route/fare query with structured card.

PHASE 2: Live Dynamics (Hours 8 - 18)
├── M3: Telemetry Ticker script + active_disruptions.json + reviews.json
├── M1: 6-Stage Reasoning (ETA calculation + Disruption override)
├── M2: Dynamic ETA Badge + Disruption Banner + 1-Bus Visual Stepper
└── M4: Roman Urdu disruption prompts + Web Speech Mic integration
└── CHECKPOINT 2: Live bus ETA changes dynamically; disruptions trigger warnings.

PHASE 3: Polish & Demo (Hours 18 - 24)
├── M1: Schema fallback validation + Latency tuning + /api/debug
├── M2: Glassmorphic UI polish + Audio wave + Preset demo buttons
├── M3: One-click demo control panel & reset script
└── M4: 30+ QA suite + TTS audio output + 3-Minute Demo Pitch Playbook
└── CHECKPOINT 3: Flawless live demo rehearsal with voice, live ticker & judging flow.
```

---

## Data Schema Reference (1-Bus Scope)

### 1. `data/routes.json` (Stream 1)
```json
{
  "route_id": "PBS-01",
  "route_name": "Route 1 (EV-1)",
  "operator": "Peoples Bus Service",
  "fare_pkr": 50,
  "fleet_type": "Electric AC",
  "stops": [
    {"stop_id": "ST-01", "name": "Model Colony", "lat": 24.8992, "lng": 67.1865},
    {"stop_id": "ST-02", "name": "Malir Halt", "lat": 24.8920, "lng": 67.1684},
    {"stop_id": "ST-03", "name": "Star Gate", "lat": 24.8872, "lng": 67.1512},
    {"stop_id": "ST-04", "name": "Drigh Road Station", "lat": 24.8789, "lng": 67.1265},
    {"stop_id": "ST-05", "name": "Karsaz", "lat": 24.8722, "lng": 67.0988},
    {"stop_id": "ST-06", "name": "Baloch Colony", "lat": 24.8654, "lng": 67.0782},
    {"stop_id": "ST-07", "name": "Nursery", "lat": 24.8580, "lng": 67.0620},
    {"stop_id": "ST-08", "name": "FTC", "lat": 24.8540, "lng": 67.0505},
    {"stop_id": "ST-09", "name": "Metropole Hotel", "lat": 24.8505, "lng": 67.0315},
    {"stop_id": "ST-10", "name": "Arts Council", "lat": 24.8548, "lng": 67.0180},
    {"stop_id": "ST-11", "name": "Tower", "lat": 24.8530, "lng": 66.9995}
  ],
  "aliases": {
    "airport": "ST-03",
    "jinnah international": "ST-03",
    "star gate": "ST-03",
    "drig road": "ST-04",
    "drigh road station": "ST-04",
    "lal kothi": "ST-04",
    "karsaz chowrangi": "ST-05",
    "national stadium turn": "ST-05",
    "pechs": "ST-07",
    "nursery": "ST-07",
    "ftc building": "ST-08",
    "metropol": "ST-09",
    "avari": "ST-09",
    "saddar club road": "ST-09",
    "arts council": "ST-10",
    "sindh assembly": "ST-10",
    "tower": "ST-11",
    "kharadar": "ST-11",
    "merewether clock tower": "ST-11"
  }
}
```

### 2. `data/bus_telemetry.json` (Stream 2)
```json
{
  "bus_id": "PB-101",
  "route_id": "PBS-01",
  "current_stop_id": "ST-04",
  "next_stop_id": "ST-05",
  "heading": "Westbound (towards Tower)",
  "speed_kmh": 38,
  "lat": 24.8755,
  "lng": 67.1120,
  "estimated_next_stop_arrival_mins": 4,
  "last_updated": "2026-09-12T12:30:00Z"
}
```

### 3. `data/active_disruptions.json` (Stream 3)
```json
{
  "active_incidents": [
    {
      "incident_id": "INC-881",
      "route_id": "PBS-01",
      "affected_stop_id": "ST-09",
      "affected_area": "Metropole Hotel & Club Road",
      "type": "PROTEST_ROADBLOCK",
      "severity": "HIGH",
      "description": "Road closure near Metropole due to protest rally. Traffic diverted towards Arts Council via alternate lane.",
      "advice": "Alight at FTC or expect 15-20 min delay approaching Tower.",
      "reported_at": "2026-09-12T12:00:00Z",
      "active": true
    }
  ]
}
```

### 4. `data/route_reviews.json` (Stream 4)
```json
{
  "route_id": "PBS-01",
  "curated_tips": [
    "Peak rush between 8:30 AM - 10:00 AM at Drigh Road; boarding can be crowded.",
    "Air conditioning is generally functioning well on this electric bus.",
    "Keep exact Rs. 50 cash ready or use the official digital travel card.",
    "Conductors announce stops in both Urdu and English."
  ]
}
```

### 5. API Response Schema Contract (Backend ➔ Frontend)
```json
{
  "reasoning_trace": {
    "detected_language": "roman_urdu",
    "extracted_intent": {
      "origin": "Karsaz",
      "destination": "Tower",
      "preference": "fastest"
    },
    "matched_route": "PBS-01",
    "telemetry_evaluated": {
      "bus_id": "PB-101",
      "distance_stops": 2,
      "eta_mins": 7
    },
    "disruption_flagged": true
  },
  "journey_card": {
    "status": "WARNING_REROUTED",
    "primary_route_name": "Peoples Bus Service - Route 1 (EV-1)",
    "estimated_fare": "Rs. 50",
    "estimated_wait_time_mins": 7,
    "has_disruption": true,
    "disruption_warning": "Metropole par traffic jam / protest ki wajah se 15 minute ki takheer mutawaqqe hai.",
    "steps": [
      {
        "step_number": 1,
        "action": "BOARD",
        "route_id": "PBS-01",
        "stop_name": "Karsaz Stop",
        "instructions": "Bus PB-101 mein sawaar hon (ETA 7 mins)."
      },
      {
        "step_number": 2,
        "action": "ALIGHT",
        "route_id": "PBS-01",
        "stop_name": "Tower",
        "instructions": "Tower Merewether Clock Tower par utrein."
      }
    ],
    "commuter_tips": [
      "AC theek chal raha hai.",
      "Khulay 50 rupay pas rakhein."
    ],
    "summary_text": "Aap Karsaz se Route 1 (PB-101) le sakte hain. Bus 7 minute mein pohnch rahi hai. Metropole par ehtijaj ki wajah se thora waqt lag sakta hai. Kiraya Rs. 50 hai."
  }
}
```

---

## Git Workflow & Daily Sync Strategy

- **Repository Structure:**
  - `/backend` — M1 (FastAPI / Node API gateway & prompt logic)
  - `/frontend` — M2 (Web Chatbot UI & visualization components)
  - `/data` & `/scripts` — M3 (JSON streams, ticker simulator, admin toggles)
  - `/evals` & `/docs` — M4 (Prompt test suite, pitch deck & demo guide)
- **Branching:**
  - `main` (Protected, demo-ready code only)
  - Feature branches: `feat/m1-backend`, `feat/m2-ui`, `feat/m3-data-simulator`, `feat/m4-prompts-voice`
- **Milestone Merge Schedule:**
  - End of Phase 1: All 4 members merge into `main` and verify Milestone 1.
  - End of Phase 2: Live ticker and dynamic cards integration merge.
  - End of Phase 3: Final freeze for live judging.
