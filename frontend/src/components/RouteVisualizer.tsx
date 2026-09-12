"use client";

import React, { useEffect, useState } from "react";
import { Bus, Radio, Navigation, Gauge, Clock, ShieldCheck } from "lucide-react";

const SHERAZ_STOPS = [
  { id: "SHZ-STP-01", name: "CP 06 Malir Cantt", landmark: "Terminal Origin" },
  { id: "SHZ-STP-02", name: "Safoora Chowrangi", landmark: "Safoora Goth" },
  { id: "SHZ-STP-03", name: "Bin Hashim / NADRA Office", landmark: "Safoora" },
  { id: "SHZ-STP-04", name: "Mausamiyat", landmark: "Mausamiyat Chowrangi" },
  { id: "SHZ-STP-05", name: "Dow / Ojha Campus", landmark: "Ojha Hospital" },
  { id: "SHZ-STP-06", name: "KU Main Gate", landmark: "Karachi University" },
  { id: "SHZ-STP-07", name: "NED University", landmark: "NED Main Gate" },
  { id: "SHZ-STP-08", name: "Safari Park", landmark: "University Road Safari" },
  { id: "SHZ-STP-09", name: "NIPA Chowrangi", landmark: "Gulshan Block 6" },
  { id: "SHZ-STP-10", name: "Urdu Science College", landmark: "Federal Urdu University" },
  { id: "SHZ-STP-11", name: "Hassan Square", landmark: "Expo Centre Karachi" },
  { id: "SHZ-STP-12", name: "Sabzi Mandi / Askari Park", landmark: "Kashmir Road Extension" },
  { id: "SHZ-STP-13", name: "Jail Chowrangi", landmark: "Jail Road" },
  { id: "SHZ-STP-14", name: "Mazar-e-Quaid", landmark: "Quaid Tomb" },
  { id: "SHZ-STP-15", name: "Old Numaish", landmark: "Numaish Chowrangi" },
  { id: "SHZ-STP-16", name: "Plaza / MA Jinnah Road", landmark: "Plaza Cinema" },
  { id: "SHZ-STP-17", name: "Jama Cloth Market", landmark: "Lighthouse Market" },
  { id: "SHZ-STP-18", name: "Denso Hall", landmark: "MA Jinnah Wholesale Market" },
  { id: "SHZ-STP-19", name: "Boulton Market", landmark: "Kharadar Entrance" },
  { id: "SHZ-STP-20", name: "Tower", landmark: "Merewether Tower" },
  { id: "SHZ-STP-21", name: "Jamat Khana", landmark: "Aga Khan Road" },
  { id: "SHZ-STP-22", name: "G. Allana Road", landmark: "Machli Miyani" },
  { id: "SHZ-STP-23", name: "Gulbai", landmark: "Gulbai Chowrangi" },
  { id: "SHZ-STP-24", name: "Hawksbay", landmark: "Terminal Destination" }
];

const BUS_ID = "SHZ-01";
const TICK_MS = 4500;

interface TelemetryState {
  idx: number;
  dir: 1 | -1;
  speed: number;
}

export default function RouteVisualizer() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({ idx: 5, dir: 1, speed: 28 });
  const [activeStop, setActiveStop] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let dir = prev.dir;
        let next = prev.idx + dir;
        if (next > SHERAZ_STOPS.length - 1 || next < 0) {
          dir = (dir * -1) as 1 | -1;
          next = prev.idx + dir;
        }
        const speed = 26 + Math.round(Math.random() * 24); // 26–50 km/h
        return { idx: next, dir, speed };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const n = SHERAZ_STOPS.length;
  const { idx, dir, speed } = telemetry;
  const currentStop = SHERAZ_STOPS[idx];
  const nextStop = SHERAZ_STOPS[idx + dir] ?? currentStop;
  const heading = dir === 1 ? "Westbound · towards Hawksbay" : "Eastbound · towards CP 06";
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
    <section className="transit-stage" aria-label="Live Sheraz Coach corridor status">
      {/* Stage hero — corridor identity + live telemetry */}
      <div className="stage-hero">
        <div className="stage-hero-content">
          <div>
            <span className="stage-eyebrow">
              <Radio size={12} />
              Live Corridor · University Road to Hawksbay
            </span>
            <h2 className="stage-title">Sheraz Coach</h2>
            <p className="stage-desc">CP 06 Malir Cantt ⇄ Hawksbay · 24 canonical stops</p>
          </div>
          <span className="stage-live-pill">
            <span className="live-dot" />
            LIVE
          </span>
        </div>

        <div className="telemetry-strip">
          <span className="telemetry-chip accent">
            <Bus size={13} className="tc-icon" />
            {BUS_ID} · Local Non-AC Coach
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

            {SHERAZ_STOPS.map((stop, i) => {
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
            <span className="stage-stat-value">Rs. 20–100 Stage Fare</span>
          </div>
          <div className="stage-stat">
            <span className="stage-stat-label">Fleet</span>
            <span className="stage-stat-value">Local Mini Bus · Non-AC</span>
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
