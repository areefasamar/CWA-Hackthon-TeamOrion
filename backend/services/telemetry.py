from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import json
import math
import os

# EV-1 corridor stop geometry (loaded from canonical route data)
EV1_STOPS_GEO: List[Dict[str, Any]] = []

def _load_route1_geo():
    global EV1_STOPS_GEO
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "..", "data", "route1.json"),
        os.path.join(here, "..", "..", "data", "route1.json"),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                EV1_STOPS_GEO = [
                    {"stop_id": s["stop_id"], "name": s["official_name"],
                     "lat": s["coordinates"]["lat"], "lng": s["coordinates"]["lng"]}
                    for s in data.get("canonical_stops", [])
                    if s.get("coordinates")
                ]
                return
            except Exception as e:
                print(f"Warning: could not parse route1.json for telemetry: {e}")

_load_route1_geo()

# Fallback static list if route1.json is unavailable
if not EV1_STOPS_GEO:
    EV1_STOPS_GEO = [
        {"stop_id": "EV1-STP-01", "name": "CMH Malir Cantt", "lat": 24.9394, "lng": 67.2042},
        {"stop_id": "EV1-STP-15", "name": "Dolmen Mall Clifton", "lat": 24.8139, "lng": 67.0405},
    ]

# Simulated active state of EV-1 bus unit
CURRENT_BUS_TELEMETRY: Dict[str, Any] = {
    "bus_id": "EV1-07",
    "route_id": "EV-01",
    "current_stop_index": 4,
    "current_stop_id": "EV1-STP-05",
    "current_stop_name": "Malir Halt",
    "next_stop_id": "EV1-STP-06",
    "next_stop_name": "Star Gate / Nata Khan Bridge",
    "heading": "Clifton bound",
    "speed_kmh": 34,
    "lat": 24.9268,
    "lng": 67.1662,
    "estimated_next_stop_arrival_mins": 4,
    "last_updated": datetime.now(timezone.utc).isoformat()
}

# Active Disruption feed (toggleable for hackathon demo)
ACTIVE_DISRUPTIONS: List[Dict[str, Any]] = [
    {
        "incident_id": "INC-881",
        "route_id": "EV-01",
        "affected_stop_id": "EV1-STP-10",
        "affected_area": "Nursery / FTC",
        "type": "TRAFFIC_CONGESTION",
        "severity": "HIGH",
        "description": "Nursery par traffic jam ki wajah se 15 minute delay mutawaqqe hai.",
        "advice": "Alight at Karsaz / PAF Museum or expect 15-20 min delay towards Clifton.",
        "active": False
    }
]

def get_telemetry() -> Dict[str, Any]:
    return CURRENT_BUS_TELEMETRY

def get_disruptions() -> List[Dict[str, Any]]:
    return ACTIVE_DISRUPTIONS

def advance_bus_position() -> Dict[str, Any]:
    """Advances the EV-1 bus to the next stop (for demo simulation)."""
    curr_idx = CURRENT_BUS_TELEMETRY["current_stop_index"]
    next_idx = (curr_idx + 1) % len(EV1_STOPS_GEO)
    stop = EV1_STOPS_GEO[next_idx]
    nxt = EV1_STOPS_GEO[(next_idx + 1) % len(EV1_STOPS_GEO)]
    CURRENT_BUS_TELEMETRY.update({
        "current_stop_index": next_idx,
        "current_stop_id": stop["stop_id"],
        "current_stop_name": stop["name"],
        "next_stop_id": nxt["stop_id"],
        "next_stop_name": nxt["name"],
        "lat": stop["lat"],
        "lng": stop["lng"],
        "last_updated": datetime.now(timezone.utc).isoformat(),
    })
    return CURRENT_BUS_TELEMETRY

def toggle_disruption(active: bool) -> List[Dict[str, Any]]:
    for d in ACTIVE_DISRUPTIONS:
        d["active"] = active
    return get_disruptions()

def nearest_stop_from_gps(lat: float, lng: float) -> Optional[str]:
    """Deterministic nearest known stop (haversine) across all loaded routes."""
    best_name: Optional[str] = None
    best_dist: Optional[float] = None
    for stop in EV1_STOPS_GEO:
        dlat = math.radians(stop["lat"] - lat)
        dlng = math.radians(stop["lng"] - lng)
        a = (math.sin(dlat / 2) ** 2
             + math.cos(math.radians(lat)) * math.cos(math.radians(stop["lat"])) * math.sin(dlng / 2) ** 2)
        dist = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        if best_dist is None or dist < best_dist:
            best_dist, best_name = dist, stop["name"]
    return best_name
