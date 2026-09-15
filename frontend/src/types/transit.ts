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
  status: "CONFIRMED" | "WARNING_REROUTED" | "NO_ROUTE_FOUND" | "NEEDS_INPUT";
  primary_route_name: string;
  operator: string;
  fleet_type: string;
  estimated_fare: string;
  origin: string;
  destination: string;
  steps: RouteStep[];
  commuter_tips: string[];
  summary_text: string;
  // Optional telemetry / meta fields
  estimated_wait_time_mins?: number;
  has_disruption?: boolean;
  disruption_warning?: string;
  intermediate_stops?: number;
}

/**
 * When the chatbot cannot resolve a stop, it asks back with tappable options.
 * `field` says which endpoint the chips set; `other` is the already-known
 * opposite endpoint (kept when the chip is clicked).
 */
export interface ClarifySuggestions {
  field: "origin" | "destination";
  message: string;
  options: string[];
  other?: string;
  /** When true, chips complete a full "A to B" query using `other`. */
  withOther?: boolean;
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

export interface ApiResponse {
  reasoning_trace?: ReasoningTrace;
  journey_card?: JourneyCardData;
  response: string;
  clarify?: ClarifySuggestions | null;
  follow_ups?: string[];
  error?: { code: string; message: string };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  journeyCard?: JourneyCardData;
  clarify?: ClarifySuggestions | null;
  follow_ups?: string[];
}
