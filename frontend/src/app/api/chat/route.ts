import { NextResponse } from "next/server";
import { processTransitQuery } from "@/lib/transitEngine";

export async function POST(req: Request) {
  try {
    const { message, session_id, lat, lng } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // System architecture: frontend proxies to the Python FastAPI backend first.
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    try {
      const pyRes = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id, lat, lng }),
        signal: AbortSignal.timeout(5000),
      });
      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData?.journey_card || pyData?.response) return NextResponse.json(pyData);
      }
    } catch {
      // Backend unavailable → local engine fallback (same canonical dataset)
    }

    const result = processTransitQuery(message.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
