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
}

export interface ReasoningTrace {
  detected_language: string;
  extracted_intent: {
    origin: string;
    destination: string;
    query_type?: string;
  };
  matched_route: string;
  fare_evaluated: number;
}

export interface ApiResponse {
  reasoning_trace?: ReasoningTrace;
  journey_card: JourneyCardData;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  journeyCard?: JourneyCardData;
}
