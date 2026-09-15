# Run Doc — Safar Transit AI (hackathon preview)

## How to reproduce the artifacts

1. **Frontend deps** (from repo root):
   ```
   cd frontend && npm install
   ```
2. **Python backend deps** (FastAPI engine — optional; the frontend ships an
   identical local fallback engine, but the architecture proxies to Python
   first):
   ```
   python -m pip install -r backend/requirements.txt
   ```
3. **Env files**: none are required. Optional integrations (`XAI_API_KEY` for
   Grok NLU, `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_*`) are all optional — the
   app runs fully mocked from `frontend/src/data/dataset.json` and
   `backend/data/*.json`. Copy `.env` from the main checkout if you need them.
4. **Data**: both engines read the canonical `dataset.json` (Sheraz Coach
   SHERAZ-01, 24 stops, stage fares Rs. 20–100; EV-1 EV-01, 15 stops, zone
   fares Rs. 80/120). The backend loads `backend/data/{sheraz,route1}.json`.

## How to run the server

1. Start the Python backend (optional, port 8000):
   ```
   cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
2. Start the Next.js frontend on a free port (3000 is often taken; this
   preview uses 5178):
   ```
   cd frontend && npx next dev -p 5178
   ```
3. Open `http://localhost:5178/`. The chat proxies to the Python backend on
   port 8000 first and falls back to the in-app engine when it's down — both
   produce identical answers from the same dataset.

Windows detach recipe (used by the preview): start `npm.cmd run dev` via
`Start-Process -WindowStyle Hidden -PassThru` with stdout/stderr redirected
to two different log files, then verify with `Get-Process -Id <pid>`.
