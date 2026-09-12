import os
import sys
from typing import Optional

# Ensure backend directory is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import httpx

from services.transit_engine import process_transit_query
from services.telemetry import (
    get_telemetry, 
    get_disruptions, 
    advance_bus_position, 
    toggle_disruption
)


# Load environment variables from backend/.env or root .env
load_dotenv()
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

class DisruptionToggleRequest(BaseModel):
    active: bool

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

    live_telemetry = get_telemetry()
    disruptions = get_disruptions()

    result = process_transit_query(
        message=req.message,
        live_telemetry=live_telemetry,
        disruptions=disruptions
    )
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
