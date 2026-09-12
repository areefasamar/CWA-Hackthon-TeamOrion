-- ==============================================================================
-- Karachi Transit AI: Database Schema (Phase 1)
-- Designed for Supabase PostgreSQL
-- ==============================================================================

-- 1. Routes Table
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    operator TEXT NOT NULL,
    fleet_type TEXT DEFAULT 'Bus',
    fare_type TEXT DEFAULT 'FLAT', -- 'FLAT' or 'STAGE_BASED'
    base_fare_pkr INTEGER NOT NULL DEFAULT 50,
    max_fare_pkr INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stops Table
CREATE TABLE IF NOT EXISTS public.stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_code TEXT NOT NULL,
    name TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    is_terminal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_route_stop_sequence UNIQUE(route_id, sequence_number)
);

-- 3. Stop Aliases & Colloquial Landmarks Table
CREATE TABLE IF NOT EXISTS public.stop_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID REFERENCES public.stops(id) ON DELETE CASCADE,
    alias_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stop_aliases_name ON public.stop_aliases (LOWER(alias_name));
CREATE INDEX IF NOT EXISTS idx_stops_name ON public.stops (LOWER(name));

-- 4. Chat Logs / Query Telemetry Table
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    user_message TEXT NOT NULL,
    detected_language TEXT,
    bot_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Row Level Security (RLS) Policies
-- Public can read routes, stops, and aliases
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read routes" ON public.routes;
    CREATE POLICY "Public read routes" ON public.routes FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public read stops" ON public.stops;
    CREATE POLICY "Public read stops" ON public.stops FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public read aliases" ON public.stop_aliases;
    CREATE POLICY "Public read aliases" ON public.stop_aliases FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public insert chat logs" ON public.chat_logs;
    CREATE POLICY "Public insert chat logs" ON public.chat_logs FOR INSERT WITH CHECK (true);
END $$;
