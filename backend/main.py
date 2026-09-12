import os
import sys
from datetime import datetime
from typing import Optional

# Ensure backend directory is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import httpx

from services.transit_engine import nearest_stop_from_gps, process_transit_query
from services.telemetry import (
    get_telemetry,
    get_disruptions,
    advance_bus_position,
    toggle_disruption
)
from services.grok_client import (
    GrokError,
    extract_transit_intent,
    generate_user_response,
    grok_configured,
    transcribe_audio,
)


# Load environment variables from backend/.env or root .env
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
if not os.getenv("SUPABASE_URL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


app = FastAPI(
    title="Karachi Transit AI Backend",
    description="FastAPI Backend for Karachi Transit AI (Route 1 & Sheraz Coach)",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "web-session"
    lat: Optional[float] = None
    lng: Optional[float] = None

class DisruptionToggleRequest(BaseModel):
    active: bool


def _public_error(code: str, message: str, status_code: int = 200) -> dict:
    return {
        "error": {"code": code, "message": message},
        "intent": None,
        "result": {"available": False, "reason": code},
        "response": message,
        "journey_card": {
            "status": "NO_ROUTE_FOUND",
            "primary_route_name": "",
            "operator": "",
            "fleet_type": "",
            "estimated_fare": "",
            "origin": "",
            "destination": "",
            "steps": [],
            "commuter_tips": [],
            "summary_text": message,
        },
        "reasoning_trace": {"detected_language": None, "extracted_intent": None},
    }


def run_chat_pipeline(message: str, lat: Optional[float] = None, lng: Optional[float] = None) -> dict:
    live_telemetry = get_telemetry()
    disruptions = get_disruptions()
    current_time = datetime.now().strftime("%H:%M")
    current_stop = None
    if lat is not None and lng is not None:
        current_stop = nearest_stop_from_gps(lat, lng)

    intent = None
    grok_status = "ok"

    if grok_configured():
        try:
            intent = extract_transit_intent(
                user_message=message,
                current_location=current_stop,
                current_time=current_time,
            )
        except GrokError as err:
            grok_status = err.code
            intent = None
    else:
        grok_status = "missing_api_key"

    skip_defaults = intent is not None
    engine = process_transit_query(
        message=message,
        live_telemetry=live_telemetry,
        disruptions=disruptions,
        intent=intent,
        current_stop=current_stop,
        skip_default_stops=skip_defaults,
    )

    backend_result = engine.get("result") or {}
    journey_card = engine.get("journey_card") or {}
    user_facing = journey_card.get("summary_text") or ""

    if intent and grok_configured():
        try:
            user_facing = generate_user_response(message, intent, backend_result)
            journey_card["summary_text"] = user_facing
        except GrokError as err:
            grok_status = err.code

    return {
        "intent": intent,
        "result": backend_result,
        "response": user_facing,
        "journey_card": journey_card,
        "reasoning_trace": engine.get("reasoning_trace"),
        "context": {
            "current_location": current_stop,
            "current_time": current_time,
        },
        "ai": {
            "provider": "xai-grok",
            "status": grok_status,
        },
    }


@app.get("/")
def root():
    return {
        "service": "Karachi Transit AI Backend",
        "status": "online",
        "routes_supported": ["Peoples Bus Service Route 1 (EV-1)", "Sheraz Coach"]
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return run_chat_pipeline(req.message.strip(), req.lat, req.lng)

@app.post("/api/voice")
async def voice_endpoint(
    audio: UploadFile = File(...),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
):
    if not grok_configured():
        payload = _public_error(
            "missing_api_key",
            "Voice input needs XAI_API_KEY on the server. You can still type your question.",
        )
        payload["transcript"] = None
        return payload

    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Audio file cannot be empty")

    try:
        transcript = transcribe_audio(raw, audio.filename or "audio.webm")
    except GrokError:
        payload = _public_error(
            "grok_api_failure",
            "Voice could not be transcribed right now. Please type your question.",
        )
        payload["transcript"] = None
        return payload

    result = run_chat_pipeline(transcript, lat, lng)
    result["transcript"] = transcript
    return result

@app.get("/api/telemetry")
def telemetry_endpoint():
    return get_telemetry()

@app.post("/api/telemetry/advance")
def advance_bus_endpoint():
    return advance_bus_position()

@app.get("/api/disruptions")
def disruptions_endpoint():
    return {"disruptions": get_disruptions()}

@app.post("/api/disruptions/toggle")
def toggle_disruption_endpoint(req: DisruptionToggleRequest):
    updated = toggle_disruption(req.active)
    return {"disruptions": updated}

@app.get("/api/routes")
async def routes_endpoint():
    """
    Fetches live transit routes and canonical stops directly from Supabase PostgreSQL database.
    Allows verifying end-to-end database connectivity (not hardcoded).
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_key:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"{supabase_url}/rest/v1/routes?select=id,route_code,name,operator,fleet_type,fare_type,base_fare_pkr,max_fare_pkr,stops(id,stop_code,name,sequence_number,is_terminal)&order=route_code.asc",
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}"
                    },
                    timeout=6.0
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "connected": True,
                        "source": "supabase_database",
                        "database_url": supabase_url,
                        "routes_count": len(data),
                        "routes": data
                    }
        except Exception as err:
            return {
                "connected": False,
                "source": "supabase_error",
                "error": str(err)
            }

    return {
        "connected": False,
        "source": "local_fallback",
        "message": "SUPABASE_URL or SUPABASE_ANON_KEY not configured in environment.",
        "routes": [
            {"route_code": "PBS-01", "name": "Peoples Bus Service Route 1 (EV-1)"},
            {"route_code": "SHERAZ-01", "name": "Sheraz Coach"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
