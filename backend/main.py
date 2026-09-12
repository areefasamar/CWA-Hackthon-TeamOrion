import os
import sys
from typing import Optional

# Ensure backend directory is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from services.transit_engine import process_transit_query
from services.telemetry import (
    get_telemetry, 
    get_disruptions, 
    advance_bus_position, 
    toggle_disruption
)


load_dotenv()

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
