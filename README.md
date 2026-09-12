# Safar Transit AI

Technical documentation for the Sheraz Coach transit assistant.

## Architecture

```text
frontend (Next.js)
		|
		| /api/chat, /api/routes, /api/voice
		v
backend (FastAPI)
		|
		v
backend/data/sheraz.json
```

The authoritative Sheraz route data is [backend/data/sheraz.json](backend/data/sheraz.json). It contains:

- Route metadata and operating hours
- 24 canonical stops with coordinates
- Stop landmarks and aliases
- Stage-fare policy
- Route aliases such as `sheraz`, `cp6`, and `hawksbay`

## Important Code Locations

- [backend/main.py](backend/main.py): FastAPI application and API endpoints
- [backend/services/transit_engine.py](backend/services/transit_engine.py): JSON loading, alias resolution, language detection, fare calculation, and journey response generation
- [backend/services/grok_client.py](backend/services/grok_client.py): optional xAI intent extraction and response generation
- [backend/services/telemetry.py](backend/services/telemetry.py): demo vehicle telemetry and disruptions
- [frontend/src/components/ChatContainer.tsx](frontend/src/components/ChatContainer.tsx): chat, voice input, and quick prompts
- [frontend/src/components/RouteVisualizer.tsx](frontend/src/components/RouteVisualizer.tsx): 24-stop Sheraz route visualization and simulated ETA
- [frontend/src/app/api/chat/route.ts](frontend/src/app/api/chat/route.ts): frontend fallback chat pipeline

## Request Flow

1. The user enters text or records voice in the Next.js `ChatContainer`.
2. Text requests are sent to `/api/chat`; voice recordings are sent to `/api/voice`.
3. The Next.js API route calls the Supabase Edge Function when available, with a local Sheraz fallback.
4. The transit pipeline resolves stops from `backend/data/sheraz.json`.
5. The response returns the route, fare, ETA, journey steps, and commuter guidance.
6. The frontend renders the response as a chat message and journey card.

## Run Locally

Open two terminals.

### Backend

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend URL: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend URL: http://localhost:3000

## API Checks

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/api/routes

Invoke-RestMethod `
	-Method Post `
	-Uri http://localhost:8000/api/chat `
	-ContentType "application/json" `
	-Body '{"message":"CP 06 Malir Cantt se Hawksbay ka kiraya kitna hai?"}'
```

The routes response should report `backend/data/sheraz.json`, route ID `SHERAZ-01`, and 24 stops.

## Validation

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build

cd ..\backend
python -m compileall -q main.py services
```

## Environment Variables

Use local `.env` files and never commit credentials. Required backend variables are documented in [backend/.env.example](backend/.env.example) when present. Typical variables include `XAI_API_KEY`, `XAI_MODEL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.