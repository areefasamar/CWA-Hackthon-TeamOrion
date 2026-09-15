"use client";

import React from "react";
import type { JourneyCardData, RouteStep } from "@/types/transit";

interface JourneyCardProps {
  card: JourneyCardData;
  onTrackMap?: () => void;
}

function fmtTime(minsFromNow: number): string {
  return new Date(Date.now() + minsFromNow * 60000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function downloadSchedule(card: JourneyCardData) {
  const lines = [
    `Safar Transit — ${card.primary_route_name}`,
    `Operator: ${card.operator}`,
    `Route: ${card.origin} -> ${card.destination}`,
    `Fare: ${card.estimated_fare}`,
    "",
    "Steps:",
    ...card.steps.map(
      (s) => `  ${s.step_number}. ${s.action} at ${s.stop_name} — ${s.instructions}`
    ),
    "",
    ...card.commuter_tips.map((t) => `Tip: ${t}`),
    "",
    card.summary_text,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safar-${card.origin}-${card.destination}`.replace(/\s+/g, "-").toLowerCase() + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

function setDepartureAlert(card: JourneyCardData, mins: number) {
  const body = `${card.primary_route_name} departs from ${card.origin} in ~${mins} minutes.`;
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "granted") {
      new Notification("Safar Departure Alert", { body });
      return;
    }
    if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification("Safar Departure Alert", { body });
      });
      return;
    }
  }
  window.alert(body);
}

export default function JourneyCard({ card, onTrackMap }: JourneyCardProps) {
  const isConfirmed = card.status === "CONFIRMED";
  const hasSteps = Array.isArray(card.steps) && card.steps.length > 0;
  const wait = typeof card.estimated_wait_time_mins === "number" ? card.estimated_wait_time_mins : 6;
  const duration = (card.intermediate_stops ?? 0) * 4 + 10;
  const departsAt = fmtTime(wait);
  const arrivesAt = fmtTime(wait + duration);
  const isAc = card.fleet_type.toLowerCase().includes("ac") && !card.fleet_type.toLowerCase().includes("non-ac");

  return (
    <article className="journey-card">
      {/* Header — bus chip + route identity + status pill */}
      <div className="jc-header">
        <div className="jc-route-identity">
          <div className="jc-icon-wrap">
            <span className="material-symbols-outlined">directions_bus</span>
          </div>
          <div className="jc-identity-text">
            <div className="jc-name-row">
              <span className="jc-route-name">{card.primary_route_name}</span>
              <span className="jc-ac-badge">
                <span className="material-symbols-outlined">mode_fan</span>
                {isAc ? "Climate AC" : "Non-AC"}
              </span>
            </div>
            <span className="jc-operator">{card.operator}</span>
          </div>
        </div>
        {isConfirmed && (
          <div className="jc-status-pill">
            <span className="jc-status-dot" />
            On Time • Departs {departsAt}
          </div>
        )}
      </div>

      {/* Alerts */}
      {card.has_disruption && (
        <div className="jc-alert jc-alert-warning" role="alert">
          <span className="material-symbols-outlined">warning</span>
          <p>{card.disruption_warning}</p>
        </div>
      )}
      {card.status === "NO_ROUTE_FOUND" && (
        <div className="jc-alert jc-alert-error" role="alert">
          <span className="material-symbols-outlined">error</span>
          <p>{card.summary_text}</p>
        </div>
      )}

      {/* Wayfinding timeline */}
      {isConfirmed && (
        <div className="jc-wayfinding">
          <div className="jc-endpoint">
            <span className="jc-endpoint-dot jc-endpoint-dot--origin" />
            <div className="jc-endpoint-text">
              <span className="jc-endpoint-name">{card.origin}</span>
              <span className="jc-endpoint-meta jc-endpoint-meta--origin">Boarding • {departsAt}</span>
            </div>
          </div>

          <div className="jc-wayline">
            <div className="jc-wayline-meta">
              <span>{card.intermediate_stops ?? 0} intermediate stops</span>
              <span>{duration} min direct</span>
            </div>
            <div className="jc-wayline-bar">
              <div className="jc-wayline-fill" style={{ width: "66%" }} />
            </div>
          </div>

          <div className="jc-endpoint jc-endpoint--dest">
            <span className="jc-endpoint-dot jc-endpoint-dot--dest" />
            <div className="jc-endpoint-text">
              <span className="jc-endpoint-name">{card.destination}</span>
              <span className="jc-endpoint-meta jc-endpoint-meta--dest">Drop-off • {arrivesAt}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trip quick specs bento grid */}
      {isConfirmed && (
        <div className="jc-specs">
          <div className="jc-spec-tile">
            <div className="jc-spec-left">
              <span className="material-symbols-outlined jc-spec-icon jc-spec-icon--primary">schedule</span>
              <span className="jc-spec-label">Trip Duration</span>
            </div>
            <span className="jc-spec-value">{duration} mins</span>
          </div>
          <div className="jc-spec-tile">
            <div className="jc-spec-left">
              <span className="material-symbols-outlined jc-spec-icon jc-spec-icon--secondary">payments</span>
              <span className="jc-spec-label">Fare</span>
            </div>
            <span className="jc-spec-value">{card.estimated_fare}</span>
          </div>
          <div className="jc-spec-tile">
            <div className="jc-spec-left">
              <span className="material-symbols-outlined jc-spec-icon jc-spec-icon--tertiary">airline_seat_recline_normal</span>
              <span className="jc-spec-label">Stops covered</span>
            </div>
            <span className="jc-spec-value">{(card.intermediate_stops ?? 0) + 2}</span>
          </div>
        </div>
      )}

      {/* Step-by-step timeline */}
      {hasSteps && isConfirmed && (
        <div className="jc-steps">
          <h4 className="jc-section-title">Journey Steps</h4>
          <ol className="jc-steps-list">
            {card.steps.map((step: RouteStep, idx: number) => (
              <li key={idx} className={`jc-step jc-step--${step.action}`}>
                <div className="jc-step-node">
                  {step.action === "BOARD" ? (
                    step.step_number
                  ) : step.action === "ALIGHT" ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                  ) : null}
                </div>
                {idx < card.steps.length - 1 && <span className="jc-step-connector" aria-hidden="true" />}
                <div className="jc-step-body">
                  <div className="jc-step-head">
                    <span className="jc-action-tag">{step.action}</span>
                    <span className="jc-stop-name">{step.stop_name}</span>
                  </div>
                  <p className="jc-step-instruction">{step.instructions}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Commuter tips */}
      {card.commuter_tips && card.commuter_tips.length > 0 && isConfirmed && (
        <div className="jc-tips">
          <div className="jc-tips-title">
            <span className="material-symbols-outlined">info</span>
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

      {/* Action CTA group */}
      {isConfirmed && (
        <div className="jc-ctas">
          {onTrackMap && (
            <button className="jc-cta-primary" type="button" onClick={onTrackMap}>
              <span className="material-symbols-outlined">map</span>
              <span>Track Live on Map</span>
            </button>
          )}
          <button className="jc-cta-secondary" type="button" onClick={() => downloadSchedule(card)}>
            <span className="material-symbols-outlined">download</span>
            <span>Download Schedule</span>
          </button>
          <button className="jc-cta-secondary" type="button" onClick={() => setDepartureAlert(card, wait)}>
            <span className="material-symbols-outlined">notifications_active</span>
            <span>Set Departure Alert</span>
          </button>
        </div>
      )}

      {/* Summary banner */}
      {isConfirmed && card.summary_text && (
        <div className="jc-summary">
          <span className="material-symbols-outlined jc-summary-spark">auto_awesome</span>
          <p>{card.summary_text}</p>
        </div>
      )}
    </article>
  );
}
