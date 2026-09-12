"use client";

import React from "react";
import { JourneyCardData, RouteStep } from "@/types/transit";
import {
  Bus,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Clock,
  XCircle
} from "lucide-react";

interface JourneyCardProps {
  card: JourneyCardData;
}

export default function JourneyCard({ card }: JourneyCardProps) {
  const isError = card.status === "NO_ROUTE_FOUND";
  const isWarning = card.status === "WARNING_REROUTED" || card.has_disruption === true;
  const hasSteps = Array.isArray(card.steps) && card.steps.length > 0;

  return (
    <article className="journey-card">
      {/* Header — route identity + fare */}
      <div className="jc-header">
        <div className="jc-route-identity">
          <span className="jc-fleet-badge">
            <Bus size={12} />
            {card.fleet_type}
          </span>
          <h3 className="jc-route-name">{card.primary_route_name}</h3>
          <p className="jc-operator">Operator · {card.operator}</p>
        </div>

        <div className="jc-fare">
          <span className="jc-fare-label">Fare</span>
          <span className="jc-fare-value">{card.estimated_fare}</span>
        </div>
      </div>

      {/* Disruption / delay warning */}
      {isWarning && (
        <div className="jc-alert jc-alert-warning" role="alert">
          <AlertTriangle size={15} />
          <p>
            {card.disruption_warning ||
              "Is corridor par aaj halki takheer mutawaqqe hai — thora extra waqt sath rakhein."}
          </p>
        </div>
      )}

      {/* No-route error */}
      {isError && (
        <div className="jc-alert jc-alert-error" role="alert">
          <XCircle size={15} />
          <p>
            Is location ke liye koi direct service nahi mili. Barah-e-karam dobara koshish karein
            ya koi nazdeeqi stop poochein.
          </p>
        </div>
      )}

      {/* Live ETA pill (when backend supplies telemetry) */}
      {typeof card.estimated_wait_time_mins === "number" && !isError && (
        <span className="jc-wait-badge">
          <Clock size={13} />
          Bus arrives in ~{card.estimated_wait_time_mins} mins
        </span>
      )}

      {/* Origin → Destination corridor */}
      <div className="jc-corridor">
        <div className="jc-endpoint">
          <span className="jc-endpoint-label">Boarding</span>
          <span className="jc-endpoint-name">{card.origin}</span>
        </div>

        <div className="jc-corridor-line" aria-hidden="true" />

        <div className="jc-endpoint">
          <span className="jc-endpoint-label">Destination</span>
          <span className="jc-endpoint-name">{card.destination}</span>
        </div>
      </div>

      {/* Step-by-step timeline */}
      {hasSteps && (
        <div className="jc-steps">
          <h4 className="jc-section-title">Journey Steps</h4>
          <ol className="jc-steps-list">
            {card.steps.map((step: RouteStep, idx: number) => (
              <li key={idx} className={`jc-step jc-step--${step.action}`}>
                <div className="jc-step-node">
                  {step.action === "BOARD" ? (
                    step.step_number
                  ) : step.action === "ALIGHT" ? (
                    <CheckCircle2 size={14} />
                  ) : null}
                </div>
                {idx < card.steps.length - 1 && (
                  <span className="jc-step-connector" aria-hidden="true" />
                )}

                <div className="jc-step-head">
                  <span className="jc-action-tag">{step.action}</span>
                  <span className="jc-stop-name">{step.stop_name}</span>
                </div>
                <p className="jc-step-instruction">{step.instructions}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Commuter tips */}
      {card.commuter_tips && card.commuter_tips.length > 0 && (
        <div className="jc-tips">
          <div className="jc-tips-title">
            <Info size={14} />
            <span>Local Commuter Guidance</span>
          </div>
          <ul className="jc-tips-list">
            {card.commuter_tips.map((tip, idx) => (
              <li key={idx} className="jc-tip">
                <span className="jc-tip-bullet">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary banner */}
      {card.summary_text && (
        <div className="jc-summary">
          <Sparkles size={15} className="jc-summary-spark" />
          <p>{card.summary_text}</p>
        </div>
      )}
    </article>
  );
}
