// ==============================================================================
// Karachi Transit AI — API Route: /api/chat
// Connects frontend to Supabase Edge Function or executes Transit Reasoning Pipeline
// ==============================================================================

import { NextResponse } from "next/server";
import { JourneyCardData, ApiResponse } from "@/types/transit";

const ALIAS_MAP: Record<string, string> = {
  "airport": "Star Gate",
  "jinnah": "Star Gate",
  "star gate": "Star Gate",
  "stargate": "Star Gate",
  "drigh road": "Drigh Road Station",
  "drig road": "Drigh Road Station",
  "lal kothi": "Drigh Road Station",
  "karsaz": "Karsaz",
  "karsaz chowrangi": "Karsaz",
  "stadium": "Karsaz",
  "baloch colony": "Baloch Colony",
  "nursery": "Nursery",
  "pechs": "Nursery",
  "ftc": "FTC",
  "ftc building": "FTC",
  "metropole": "Metropole Hotel",
  "metropol": "Metropole Hotel",
  "avari": "Metropole Hotel",
  "saddar": "Metropole Hotel",
  "arts council": "Arts Council",
  "sindh assembly": "Arts Council",
  "tower": "Tower",
  "kharadar": "Tower",
  "merewether": "Tower",
  "model colony": "Model Colony",
  "malir halt": "Malir Halt",
  // Sheraz Coach Landmarks
  "cp 6": "CP 06 Malir Cantt",
  "cp6": "CP 06 Malir Cantt",
  "malir cantt": "CP 06 Malir Cantt",
  "safoora": "Safoora Chowrangi",
  "safoora goth": "Safoora Chowrangi",
  "bin hashim": "Bin Hashim / NADRA Office",
  "mausamiyat": "Mausamiyat",
  "mosamiyat": "Mausamiyat",
  "dow": "Dow / Ojha Campus",
  "ojha": "Dow / Ojha Campus",
  "ku": "KU Main Gate",
  "karachi university": "KU Main Gate",
  "ned": "NED University",
  "safari park": "Safari Park",
  "nipa": "NIPA Chowrangi",
  "hassan square": "Hassan Square",
  "hasan square": "Hassan Square",
  "sabzi mandi": "Sabzi Mandi",
  "jail chowrangi": "Jail Chowrangi",
  "mazar": "Mazar-e-Quaid",
  "quaid": "Mazar-e-Quaid",
  "numaish": "Old Numaish",
  "boulton market": "Boulton Market",
  "hawksbay": "Hawksbay"
};

export async function POST(req: Request) {
  try {
    const { message, session_id, lat, lng } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // 1. If Python FastAPI backend is running (Render or local), call it
    if (backendUrl) {
      try {
        const pyRes = await fetch(`${backendUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, session_id, lat, lng }),
          signal: AbortSignal.timeout(45000)
        });
        if (pyRes.ok) {
          const pyData = await pyRes.json();
          return NextResponse.json(pyData);
        }
      } catch (pyErr) {
        // Python backend not currently responding, continue to fallback
      }
    }

    // 2. If Supabase Edge Function is deployed and accessible, forward the call
    if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseAnonKey) {
      try {
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({ message, session_id })
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          return NextResponse.json(edgeData);
        }
      } catch (edgeErr) {
        console.warn("Could not reach Supabase Edge Function, falling back to local reasoning:", edgeErr);
      }
    }

    // Local Transit Reasoning Pipeline (Zero-failure fallback for offline / local testing)
    const normalized = message.toLowerCase();
    
    // Language detection
    const isUrduScript = /[\u0600-\u06FF]/.test(message);
    const romanUrduWords = ["jana", "hai", "kitna", "kiraya", "kahan", "se", "tak", "kaise", "paise", "batao", "chalegi", "stop", "rukegi", "kitne"];
    const isRomanUrdu = romanUrduWords.some(w => normalized.includes(w)) || isUrduScript;
    const detectedLang = isUrduScript ? "urdu_script" : isRomanUrdu ? "roman_urdu" : "english";

    // Match origin and destination
    let origin: string | null = null;
    let destination: string | null = null;

    for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
      if (normalized.includes(alias)) {
        if (!origin) {
          origin = canonical;
        } else if (origin !== canonical && !destination) {
          destination = canonical;
        }
      }
    }

    // Determine route: Sheraz Coach vs Route 1
    const isSheraz = normalized.includes("sheraz") || 
      ["safoora", "malir cantt", "cp 6", "cp6", "nipa", "ned", "ku", "dow", "ojha", "safari", "hassan square", "hawksbay"].some(k => normalized.includes(k));

    let routeName = "Peoples Bus Service - Route 1 (EV-1)";
    let routeId = "PBS-01";
    let operator = "Peoples Bus Service";
    let fleetType = "Electric AC";
    let fare = "Rs. 50";

    if (isSheraz) {
      routeName = "Sheraz Coach";
      routeId = "SHERAZ-01";
      operator = "Sheraz Transport Co.";
      fleetType = "Local Mini Bus / Non-AC";
      fare = "Rs. 40 - 80 (Stage Fare)";
      if (!origin) origin = "Safoora Chowrangi";
      if (!destination) destination = "Tower";
    } else {
      if (!origin) origin = "Model Colony";
      if (!destination) destination = origin === "Tower" ? "Model Colony" : "Tower";
    }

    const summaryText = isRomanUrdu
      ? `Aap ${origin} se ${routeName} le sakte hain jo ${destination} tak jaati hai. Is safar ka kiraya ${fare} hai.`
      : `You can take ${routeName} from ${origin} to ${destination}. The official fare is ${fare}.`;

    const journeyCard: JourneyCardData = {
      status: "CONFIRMED",
      primary_route_name: routeName,
      operator: operator,
      fleet_type: fleetType,
      estimated_fare: fare,
      origin: origin,
      destination: destination,
      steps: [
        {
          step_number: 1,
          action: "BOARD",
          route_id: routeId,
          stop_name: origin,
          instructions: isRomanUrdu
            ? `${origin} stop par ${routeName} mein sawaar hon.`
            : `Board the ${routeName} at ${origin} stop.`
        },
        {
          step_number: 2,
          action: "TRANSIT",
          route_id: routeId,
          stop_name: isSheraz ? "University Road Corridor" : "Sharea Faisal Corridor",
          instructions: isRomanUrdu
            ? `Bus direct corridor se guzar kar agle stops cover karegi.`
            : `Travel along the main transit corridor.`
        },
        {
          step_number: 3,
          action: "ALIGHT",
          route_id: routeId,
          stop_name: destination,
          instructions: isRomanUrdu
            ? `${destination} stop pohnch kar utrein.`
            : `Alight from the bus at ${destination} stop.`
        }
      ],
      commuter_tips: isSheraz
        ? [
            isRomanUrdu ? "Local coach hai, rush ke auqaat mein bheer zyada hoti hai." : "Local coach; expect crowds during peak commute hours.",
            isRomanUrdu ? "Kiraya conductor ko cash mein ada karein." : "Keep exact cash change for the conductor."
          ]
        : [
            isRomanUrdu ? "Electric AC bus hai, safar nihayat aaram-deh hai." : "Air-conditioned electric bus with smooth transit.",
            isRomanUrdu ? "Official flat rate Rs. 50 hai, ticket zaroor haasil karein." : "Flat fare Rs. 50. Digital cards and cash accepted."
          ],
      summary_text: summaryText
    };

    const response: ApiResponse = {
      reasoning_trace: {
        detected_language: detectedLang,
        extracted_intent: {
          origin: origin,
          destination: destination,
          query_type: "route_and_fare"
        },
        matched_route: routeId,
        fare_evaluated: isSheraz ? 60 : 50
      },
      journey_card: journeyCard
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
