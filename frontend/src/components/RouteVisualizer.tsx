"use client";

import React, { useEffect, useState } from "react";
import { Bus, Radio, Navigation, Gauge, Clock, ShieldCheck } from "lucide-react";

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

const BUS_ID = "PB-101";
const TICK_MS = 4500;

interface TelemetryState {
  idx: number;
  dir: 1 | -1;
  speed: number;
}

export default function RouteVisualizer() {
  // Simulated live telemetry ticker — PB-101 ping-pongs along the corridor
  // (mirrors the backend telemetry simulator for the demo).
  const [telemetry, setTelemetry] = useState<TelemetryState>({ idx: 3, dir: 1, speed: 38 });
  const [activeStop, setActiveStop] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let dir = prev.dir;
        let next = prev.idx + dir;
        if (next > ROUTE_1_STOPS.length - 1 || next < 0) {
          dir = (dir * -1) as 1 | -1;
          next = prev.idx + dir;
        }
        const speed = 26 + Math.round(Math.random() * 24); // 26–50 km/h
        return { idx: next, dir, speed };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const n = ROUTE_1_STOPS.length;
  const { idx, dir, speed } = telemetry;
  const currentStop = ROUTE_1_STOPS[idx];
  const nextStop = ROUTE_1_STOPS[idx + dir] ?? currentStop;
  const heading = dir === 1 ? "Westbound · towards Tower" : "Eastbound · towards Model Colony";
  const etaNext = Math.max(1, Math.round(120 / speed)); // minutes to next stop
  const stopsToEnd = dir === 1 ? n - 1 - idx : idx;
  const etaTerminus = stopsToEnd * etaNext;
  const progress = (idx / (n - 1)) * 100;

  // Vertical track geometry — node centers sit at (i + 0.5) / n of the rows height.
  const firstPct = (0.5 / n) * 100;
  const busPct = ((idx + 0.5) / n) * 100;

  const toggleStop = (id: string) => {
    setActiveStop((prev) => (prev === id ? null : id));
  };

  const stopEta = (stopIdx: number) => Math.max(1, Math.abs(stopIdx - idx) * etaNext);

  return (
    <section className="transit-stage" aria-label="Live Route 1 corridor status">
      {/* Stage hero — corridor identity + live telemetry */}
      <div className="stage-hero">
        <div className="stage-hero-content">
          <div>
            <span className="stage-eyebrow">
              <Radio size={12} />
              Live Corridor · Sharea Faisal
            </span>
            <h2 className="stage-title">Route 1 (EV-1)</h2>
            <p className="stage-desc">Model Colony ⇄ Tower · 11 canonical stops · Peoples Bus Service</p>
          </div>
          <span className="stage-live-pill">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        <div className="telemetry-strip">
          <span className="telemetry-chip accent">
            <Bus size={13} className="tc-icon" />
            {BUS_ID} · Electric AC
          </span>
          <span className="telemetry-chip">
            <Navigation size={13} className="tc-icon" />
            {currentStop.name} → {nextStop.name}
          </span>
          <span className="telemetry-chip">
            <Gauge size={13} className="tc-icon" />
            {speed} km/h
          </span>
          <span className="telemetry-chip">
            <Clock size={13} className="tc-icon" />
            Next stop ~{etaNext} min · {heading}
          </span>
        </div>
      </div>

      {/* Corridor board — stop-by-stop live tracker */}
      <div className="corridor-board">
        <div className="corridor-head">
          <span className="corridor-heading-label">Stop-by-stop corridor tracker</span>
          <div className="corridor-progress-meta">
            <div className="corridor-progress" aria-hidden="true">
              <div className="corridor-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="corridor-track">
          <div className="corridor-rows">
            <span className="track-line" aria-hidden="true" />
            <span
              className="track-fill"
              aria-hidden="true"
              style={{ top: `${firstPct}%`, height: `${busPct - firstPct}%` }}
            />
            <span className="track-bus" style={{ top: `${busPct}%` }} aria-hidden="true">
              <span className="track-bus-icon">
                <Bus size={14} />
              </span>
            </span>

            {ROUTE_1_STOPS.map((stop, i) => {
              const isTerminal = i === 0 || i === n - 1;
              const isBehind = dir === 1 ? i < idx : i > idx;
              const isCurrent = i === idx;
              const isActive = activeStop === stop.id;

              const rowClass = [
                "corridor-row",
                isCurrent ? "stop-current" : isBehind ? "stop-visited" : "",
                isActive ? "stop-active" : "",
                isTerminal ? "is-terminal" : ""
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={stop.id}
                  className={rowClass}
                  onClick={() => toggleStop(stop.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleStop(stop.id);
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <div className="stop-node">
                    {isTerminal ? <Bus size={12} /> : i + 1}
                  </div>
                  <div className="stop-info">
                    <div className="stop-name">
                      <span>{stop.name}</span>
                      {isTerminal && <span className="term-badge">Terminal</span>}
                    </div>
                    {isActive && !isCurrent ? (
                      <span className="stop-eta-chip">
                        <Clock size={10} />
                        {BUS_ID} · ~{stopEta(i)} min
                      </span>
                    ) : (
                      <span className="stop-landmark">{stop.landmark}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage footer — corridor facts */}
      <div className="stage-footer">
        <div className="stage-stats">
          <div className="stage-stat">
            <span className="stage-stat-label">Official Fare</span>
            <span className="stage-stat-value">Rs. 50 Flat</span>
          </div>
          <div className="stage-stat">
            <span className="stage-stat-label">Fleet</span>
            <span className="stage-stat-value">Electric AC</span>
          </div>
          <div className="stage-stat">
            <span className="stage-stat-label">Terminus ETA</span>
            <span className="stage-stat-value">~{etaTerminus} min</span>
          </div>
        </div>
        <span className="verified-note">
          <ShieldCheck size={14} />
          Verified with Sindh Mass Transit Authority
        </span>
      </div>
    </section>
  );
}
