import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendUrl =
      process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

    const incoming = await req.formData();
    const outbound = new FormData();
    const audio = incoming.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }
    outbound.append("audio", audio, "recording.webm");

    const lat = incoming.get("lat");
    const lng = incoming.get("lng");
    const params = new URLSearchParams();
    if (typeof lat === "string" && lat) params.set("lat", lat);
    if (typeof lng === "string" && lng) params.set("lng", lng);
    const qs = params.toString();

    const pyRes = await fetch(`${backendUrl}/api/voice${qs ? `?${qs}` : ""}`, {
      method: "POST",
      body: outbound,
      signal: AbortSignal.timeout(60000),
    });

    const data = await pyRes.json();
    return NextResponse.json(data, { status: pyRes.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice proxy failed" },
      { status: 500 }
    );
  }
}
