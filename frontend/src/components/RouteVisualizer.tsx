"use client";

import React, { useState } from "react";
import { Bus, MapPin, CheckCircle, Navigation, ShieldCheck } from "lucide-react";

const ROUTE_1_STOPS = [
  { id: "ST-01", name: "Model Colony", landmark: "Terminal Origin" },
  { id: "ST-02", name: "Malir Halt", landmark: "Malir Bridge" },
  { id: "ST-03", name: "Star Gate", landmark: "Airport Road" },
  { id: "ST-04", name: "Drigh Road Station", landmark: "Railway Station / Lal Kothi" },
  { id: "ST-05", name: "Karsaz", landmark: "National Stadium Turn" },
  { id: "ST-06", name: "Baloch Colony", landmark: "Expressway Flyover" },
  { id: "ST-07", name: "Nursery", landmark: "PECHS Block 6" },
  { id: "ST-08", name: "FTC", landmark: "Finance & Trade Centre" },
  { id: "ST-09", name: "Metropole Hotel", landmark: "Saddar / Club Road" },
  { id: "ST-10", name: "Arts Council", landmark: "Sindh Assembly" },
  { id: "ST-11", name: "Tower", landmark: "Merewether Clock Tower (Terminal)" }
];

export default function RouteVisualizer() {
  const [activeStop, setActiveStop] = useState<string | null>(null);

  return (
    <aside className="route-visualizer-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-badge">
          <Bus size={15} />
          <span>Active Fleet Line</span>
        </div>
        <h2 className="sidebar-title">Route 1 (EV-1) Corridor</h2>
        <p className="sidebar-desc">Official 11-Stop Sharea Faisal Transit Path</p>
      </div>

      <div className="sidebar-info-card">
        <div className="info-stat">
          <span className="stat-label">Official Fare</span>
          <span className="stat-val">Rs. 50 Flat</span>
        </div>
        <div className="info-stat">
          <span className="stat-label">Fleet</span>
          <span className="stat-val">Electric AC</span>
        </div>
        <div className="info-stat">
          <span className="stat-label">Stops</span>
          <span className="stat-val">11 Canonical</span>
        </div>
      </div>

      <div className="stops-scroll-list">
        {ROUTE_1_STOPS.map((stop, idx) => {
          const isTerminal = idx === 0 || idx === ROUTE_1_STOPS.length - 1;
          const isSelected = activeStop === stop.id;

          return (
            <div
              key={stop.id}
              className={`sidebar-stop-row ${isSelected ? "stop-selected" : ""}`}
              onClick={() => setActiveStop(stop.id)}
            >
              <div className="stop-tracker-col">
                <div className={`stop-node ${isTerminal ? "terminal-node" : ""}`}>
                  {idx + 1}
                </div>
                {idx < ROUTE_1_STOPS.length - 1 && <div className="stop-track-line"></div>}
              </div>

              <div className="stop-info-col">
                <div className="stop-name-row">
                  <span className="stop-name">{stop.name}</span>
                  {isTerminal && <span className="term-badge">Terminal</span>}
                </div>
                <span className="stop-landmark">{stop.landmark}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <ShieldCheck size={14} className="verified-icon" />
        <span>Verified with Sindh Mass Transit Authority</span>
      </div>
    </aside>
  );
}
