// ==============================================================================
// Karachi Transit AI — Supabase Edge Function: /functions/v1/chat
// Deno / TypeScript Runtime
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatRequest {
  message: string;
  session_id?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, session_id } = (await req.json()) as ChatRequest;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'message' in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";

    // 1. Language Detection heuristic (Roman Urdu vs English vs Urdu)
    const normalizedMsg = message.toLowerCase();
    let detectedLang = "english";
    const urduKeywords = ["jana", "hai", "kitna", "kiraya", "kahan", "se", "tak", "kaise", "milegi", "paise", "batao", "chalegi", "stop", "rukegi"];
    if (/[\u0600-\u06FF]/.test(message)) {
      detectedLang = "urdu_script";
    } else if (urduKeywords.some(kw => normalizedMsg.includes(kw))) {
      detectedLang = "roman_urdu";
    }

    // 2. Fetch routes, stops, and aliases from Supabase DB (or fallback static data if DB credentials not yet configured)
    let routesData: any[] = [];
    let stopsData: any[] = [];
    let aliasesData: any[] = [];

    if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const [rRes, sRes, aRes] = await Promise.all([
          supabase.from("routes").select("*").eq("is_active", true),
          supabase.from("stops").select("*").order("sequence_number", { ascending: true }),
          supabase.from("stop_aliases").select("alias_name, stop_id, stops(name, route_id)")
        ]);
        routesData = rRes.data || [];
        stopsData = sRes.data || [];
        aliasesData = aRes.data || [];
      } catch (err) {
        console.error("Supabase query error, falling back to static schema:", err);
      }
    }

    // If DB is not populated yet or offline, use canonical Route 1 static data
    if (routesData.length === 0) {
      routesData = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          route_code: "PBS-01",
          name: "Peoples Bus Service - Route 1 (EV-1)",
          operator: "Peoples Bus Service",
          fleet_type: "Electric AC",
          fare_type: "FLAT",
          base_fare_pkr: 50,
        }
      ];
      stopsData = [
        { stop_code: "ST-01", name: "Model Colony", sequence_number: 1, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-02", name: "Malir Halt", sequence_number: 2, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-03", name: "Star Gate", sequence_number: 3, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-04", name: "Drigh Road Station", sequence_number: 4, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-05", name: "Karsaz", sequence_number: 5, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-06", "name": "Baloch Colony", sequence_number: 6, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-07", name: "Nursery", sequence_number: 7, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-08", name: "FTC", sequence_number: 8, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-09", name: "Metropole Hotel", sequence_number: 9, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-10", name: "Arts Council", sequence_number: 10, route_id: "11111111-1111-1111-1111-111111111111" },
        { stop_code: "ST-11", name: "Tower", sequence_number: 11, route_id: "11111111-1111-1111-1111-111111111111" },
      ];
    }

    // 3. Match Origin and Destination from Message
    // Common alias dictionary lookup
    const canonicalAliasMap: Record<string, string> = {
      "airport": "Star Gate",
      "jinnah": "Star Gate",
      "star gate": "Star Gate",
      "stargate": "Star Gate",
      "drigh road": "Drigh Road Station",
      "drig road": "Drigh Road Station",
      "lal kothi": "Drigh Road Station",
      "karsaz": "Karsaz",
      "stadium": "Karsaz",
      "baloch colony": "Baloch Colony",
      "nursery": "Nursery",
      "pechs": "Nursery",
      "ftc": "FTC",
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
      "malir halt": "Malir Halt"
    };

    let originMatch: string | null = null;
    let destMatch: string | null = null;

    // Check for stops or aliases mentioned
    for (const [alias, canonical] of Object.entries(canonicalAliasMap)) {
      if (normalizedMsg.includes(alias)) {
        if (!originMatch) {
          originMatch = canonical;
        } else if (originMatch !== canonical && !destMatch) {
          destMatch = canonical;
        }
      }
    }

    // Default fallback if user asks generally about Route 1 or fare
    if (!originMatch && !destMatch) {
      originMatch = "Model Colony";
      destMatch = "Tower";
    } else if (originMatch && !destMatch) {
      destMatch = originMatch === "Tower" ? "Model Colony" : "Tower";
    }

    // 4. Build Structured Journey Card Response
    const fare = 50;
    const isRomanUrdu = detectedLang === "roman_urdu" || detectedLang === "urdu_script";

    const summaryText = isRomanUrdu
      ? `Aap ${originMatch} se Peoples Bus Service (Route 1 / EV-1) le sakte hain jo Sharea Faisal se guzar kar ${destMatch} pohnchati hai. Kiraya flat Rs. ${fare} hai.`
      : `You can take Peoples Bus Service Route 1 (EV-1) from ${originMatch} towards ${destMatch} via Sharea Faisal. The official flat fare is Rs. ${fare}.`;

    const journeyCard = {
      status: "CONFIRMED",
      primary_route_name: "Peoples Bus Service - Route 1 (EV-1)",
      operator: "Peoples Bus Service",
      fleet_type: "Electric AC",
      estimated_fare: `Rs. ${fare}`,
      origin: originMatch,
      destination: destMatch,
      steps: [
        {
          step_number: 1,
          action: "BOARD",
          route_id: "PBS-01",
          stop_name: originMatch,
          instructions: isRomanUrdu
            ? `${originMatch} stop par Peoples Bus (EV-1) mein sawaar hon.`
            : `Board the Peoples Bus (EV-1) at ${originMatch} stop.`
        },
        {
          step_number: 2,
          action: "TRANSIT",
          route_id: "PBS-01",
          stop_name: "Sharea Faisal Corridor",
          instructions: isRomanUrdu
            ? `Bus Sharea Faisal se hoti hui apne stop ki taraf rawana hogi.`
            : `Travel along the main Sharea Faisal transit corridor.`
        },
        {
          step_number: 3,
          action: "ALIGHT",
          route_id: "PBS-01",
          stop_name: destMatch,
          instructions: isRomanUrdu
            ? `${destMatch} stop par utrein.`
            : `Alight from the bus at ${destMatch} stop.`
        }
      ],
      commuter_tips: [
        isRomanUrdu ? "Electric AC bus hai, safar pur-sukoon rehta hai." : "Fully air-conditioned electric bus.",
        isRomanUrdu ? "Kiraya flat Rs. 50 hai, conductor se ticket zaroor lein." : "Flat fare Rs. 50; ensure you collect your conductor ticket."
      ],
      summary_text: summaryText
    };

    const responsePayload = {
      reasoning_trace: {
        detected_language: detectedLang,
        extracted_intent: {
          origin: originMatch,
          destination: destMatch,
          query_type: "route_and_fare"
        },
        matched_route: "PBS-01",
        fare_evaluated: fare
      },
      journey_card: journeyCard
    };

    // Log to Supabase chat_logs if accessible
    if (supabaseUrl && supabaseUrl.startsWith("http") && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("chat_logs").insert({
          session_id: session_id || "anonymous",
          user_message: message,
          detected_language: detectedLang,
          bot_response: responsePayload
        });
      } catch (err) {
        console.warn("Could not log chat to DB:", err);
      }
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
