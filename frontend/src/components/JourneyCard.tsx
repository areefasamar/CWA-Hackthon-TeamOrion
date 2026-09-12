"use client";

import React from "react";
import { JourneyCardData, RouteStep } from "@/types/transit";
import { Bus, MapPin, ArrowRight, CheckCircle2, AlertCircle, Info, DollarSign, Sparkles } from "lucide-react";

interface JourneyCardProps {
  card: JourneyCardData;
}

export default function JourneyCard({ card }: JourneyCardProps) {
  const isConfirmed = card.status === "CONFIRMED";

  return (
    <div className="journey-card-wrapper">
      {/* Header Banner */}
      <div className="card-header">
        <div className="header-left">
          <div className="badge-route-type">
            <Bus size={16} className="route-icon" />
            <span>{card.fleet_type}</span>
          </div>
          <h3 className="route-title">{card.primary_route_name}</h3>
          <p className="operator-sub">Operator: {card.operator}</p>
        </div>

        <div className="header-right">
          <div className="fare-badge">
            <span className="fare-label">Fare</span>
            <span className="fare-value">{card.estimated_fare}</span>
          </div>
        </div>
      </div>

      {/* Origin -> Destination Corridor Bar */}
      <div className="corridor-bar">
        <div className="corridor-point">
          <div className="point-dot origin-dot"></div>
          <div>
            <span className="corridor-label">Boarding</span>
            <div className="corridor-name">{card.origin}</div>
          </div>
        </div>

        <div className="corridor-arrow">
          <div className="corridor-line"></div>
          <ArrowRight size={18} className="arrow-icon" />
        </div>

        <div className="corridor-point destination-point">
          <div className="point-dot dest-dot"></div>
          <div>
            <span className="corridor-label">Destination</span>
            <div className="corridor-name">{card.destination}</div>
          </div>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="steps-section">
        <h4 className="section-heading">Journey Steps</h4>
        <div className="steps-timeline">
          {card.steps.map((step: RouteStep, idx: number) => {
            const isBoard = step.action === "BOARD";
            const isAlight = step.action === "ALIGHT";

            return (
              <div key={idx} className="timeline-step">
                <div className="step-marker-container">
                  <div className={`step-marker ${isBoard ? "marker-board" : isAlight ? "marker-alight" : "marker-transit"}`}>
                    {isBoard ? (
                      <span className="marker-number">1</span>
                    ) : isAlight ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="marker-dot"></span>
                    )}
                  </div>
                  {idx < card.steps.length - 1 && <div className="step-connector"></div>}
                </div>

                <div className="step-body">
                  <div className="step-header">
                    <span className="step-action-tag">{step.action}</span>
                    <span className="step-stop-name">{step.stop_name}</span>
                  </div>
                  <p className="step-instruction">{step.instructions}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commuter Tips */}
      {card.commuter_tips && card.commuter_tips.length > 0 && (
        <div className="tips-section">
          <div className="tips-title">
            <Info size={15} className="tips-icon" />
            <span>Local Commuter Guidance</span>
          </div>
          <ul className="tips-list">
            {card.commuter_tips.map((tip, idx) => (
              <li key={idx} className="tip-item">
                <span className="tip-bullet">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Speech Bubble */}
      {card.summary_text && (
        <div className="summary-banner">
          <Sparkles size={16} className="summary-sparkle" />
          <p className="summary-text">{card.summary_text}</p>
        </div>
      )}
    </div>
  );
}
