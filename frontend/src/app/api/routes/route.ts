// ==============================================================================
// Karachi Transit AI — API Route: /api/routes
// Fetches live routes and stops directly from Supabase PostgreSQL database
// ==============================================================================

import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      connected: false,
      source: "hardcoded_fallback",
      message: "Supabase client is not configured (check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)",
      routes: [
        {
          route_code: "PBS-01",
          name: "Peoples Bus Service - Route 1 (EV-1)",
          operator: "Peoples Bus Service",
          fleet_type: "Electric AC",
          fare_type: "FLAT",
          base_fare_pkr: 50,
          stops_count: 11
        },
        {
          route_code: "SHERAZ-01",
          name: "Sheraz Coach",
          operator: "Sheraz Transport Co.",
          fleet_type: "Local Mini Bus / Coach",
          fare_type: "STAGE_BASED",
          base_fare_pkr: 20,
          stops_count: 24
        }
      ]
    });
  }

  try {
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select("id, route_code, name, operator, fleet_type, fare_type, base_fare_pkr, max_fare_pkr, is_active, stops(id, stop_code, name, sequence_number, lat, lng, is_terminal)")
      .order("route_code", { ascending: true });

    if (routesError) {
      return NextResponse.json(
        { connected: false, source: "supabase_error", error: routesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: true,
      source: "supabase_database",
      timestamp: new Date().toISOString(),
      routes_count: routes ? routes.length : 0,
      routes: routes
    });
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, source: "server_error", error: err.message },
      { status: 500 }
    );
  }
}
