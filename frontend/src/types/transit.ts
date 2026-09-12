// ==============================================================================
// Karachi Transit AI — TypeScript Interfaces
// ==============================================================================

export interface RouteStep {
  step_number: number;
  action: "BOARD" | "TRANSIT" | "ALIGHT" | "TRANSFER";
  route_id: string;
  stop_name: string;
  instructions: string;
}

export interface JourneyCardData {
  status: "CONFIRMED" | "WARNING_REROUTED" | "NO_ROUTE_FOUND";
  primary_route_name: string;
  operator: string;
  fleet_type: string;
  estimated_fare: string;
  origin: string;
  destination: string;
  steps: RouteStep[];
  commuter_tips: string[];
  summary_text: string;
  // Phase 2 (live telemetry / disruption) fields — optional so Phase 1
  // responses without them remain valid.
  estimated_wait_time_mins?: number;
  has_disruption?: boolean;
  disruption_warning?: string;
}

export interface ReasoningTrace {
  detected_language: string;
  extracted_intent: {
    origin: string | null;
    destination: string | null;
    query_type?: string;
    preference?: string;
    fare_limit?: number | null;
  } | null;
  matched_route: string | null;
  fare_evaluated: number | null;
}

export interface TransitIntent {
  origin: string | null;
  destination: string | null;
  fare_limit: number | null;
  arrival_deadline: string | null;
  departure_time: string | null;
  preference: string;
  language: string;
}

export interface ApiResponse {
  reasoning_trace?: ReasoningTrace;
  journey_card: JourneyCardData;
  intent?: TransitIntent | null;
  result?: Record<string, unknown>;
  response?: string;
  transcript?: string;
  error?: { code: string; message: string };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  journeyCard?: JourneyCardData;
}
