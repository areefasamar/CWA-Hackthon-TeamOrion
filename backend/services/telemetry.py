from datetime import datetime, timezone
from typing import Dict, Any, List

# 11 Canonical stops on Route 1
ROUTE_1_STOPS_GEO = [
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
]

# Simulated active state of Bus PB-101
CURRENT_BUS_TELEMETRY: Dict[str, Any] = {
    "bus_id": "PB-101",
    "route_id": "PBS-01",
    "current_stop_index": 3,
    "current_stop_id": "ST-04",
    "current_stop_name": "Drigh Road Station",
    "next_stop_id": "ST-05",
    "next_stop_name": "Karsaz",
    "heading": "Westbound (towards Tower)",
    "speed_kmh": 36,
    "lat": 24.8755,
    "lng": 67.1120,
    "estimated_next_stop_arrival_mins": 4,
    "last_updated": datetime.now(timezone.utc).isoformat()
}

# Active Disruption feed
ACTIVE_DISRUPTIONS: List[Dict[str, Any]] = [
    {
        "incident_id": "INC-881",
        "route_id": "PBS-01",
        "affected_stop_id": "ST-09",
        "affected_area": "Metropole Hotel & Club Road",
        "type": "PROTEST_ROADBLOCK",
        "severity": "HIGH",
        "description": "Metropole par traffic jam / ehtijaj ki wajah se 15 minute delay mutawaqqe hai.",
        "advice": "Alight at FTC or expect 15-20 min delay approaching Tower.",
        "active": False  # Toggleable for hackathon demo!
    }
]

def get_telemetry() -> Dict[str, Any]:
    return CURRENT_BUS_TELEMETRY

def get_disruptions() -> List[Dict[str, Any]]:
    return ACTIVE_DISRUPTIONS

def advance_bus_position() -> Dict[str, Any]:
    """Advances Bus PB-101 to the next stop (for demo simulation)."""
    curr_idx = CURRENT_BUS_TELEMETRY["current_stop_index"]
    next_idx = (curr_idx + 1) % len(ROUTE_1_STOPS_GEO)
    
    stop_curr = ROUTE_1_STOPS_GEO[curr_idx]
    stop_next = ROUTE_1_STOPS_GEO[next_idx]

    CURRENT_BUS_TELEMETRY.update({
        "current_stop_index": next_idx,
        "current_stop_id": stop_curr["stop_id"],
        "current_stop_name": stop_curr["name"],
        "next_stop_id": stop_next["stop_id"],
        "next_stop_name": stop_next["name"],
        "lat": stop_curr["lat"],
        "lng": stop_curr["lng"],
        "estimated_next_stop_arrival_mins": 3,
        "last_updated": datetime.now(timezone.utc).isoformat()
    })
    return CURRENT_BUS_TELEMETRY

def toggle_disruption(active: bool) -> List[Dict[str, Any]]:
    """Toggles active disruption for live judging demo."""
    if ACTIVE_DISRUPTIONS:
        ACTIVE_DISRUPTIONS[0]["active"] = active
    return ACTIVE_DISRUPTIONS
