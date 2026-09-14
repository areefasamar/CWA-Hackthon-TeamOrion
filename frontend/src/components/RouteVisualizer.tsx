"use client";

import React, { useEffect, useState } from "react";

const SHERAZ_STOPS = [
  { id: "SHZ-STP-01", name: "CP 06 Malir Cantt",         landmark: "Terminal Origin" },
  { id: "SHZ-STP-02", name: "Safoora Chowrangi",          landmark: "Safoora Goth" },
  { id: "SHZ-STP-03", name: "Bin Hashim / NADRA Office",  landmark: "Safoora" },
  { id: "SHZ-STP-04", name: "Mausamiyat",                 landmark: "Mausamiyat Chowrangi" },
  { id: "SHZ-STP-05", name: "Dow / Ojha Campus",          landmark: "Ojha Hospital" },
  { id: "SHZ-STP-06", name: "KU Main Gate",               landmark: "Karachi University" },
  { id: "SHZ-STP-07", name: "NED University",             landmark: "NED Main Gate" },
  { id: "SHZ-STP-08", name: "Safari Park",                landmark: "University Road Safari" },
  { id: "SHZ-STP-09", name: "NIPA Chowrangi",             landmark: "Gulshan Block 6" },
  { id: "SHZ-STP-10", name: "Urdu Science College",       landmark: "Federal Urdu University" },
  { id: "SHZ-STP-11", name: "Hassan Square",              landmark: "Expo Centre Karachi" },
  { id: "SHZ-STP-12", name: "Sabzi Mandi / Askari Park",  landmark: "Kashmir Road Extension" },
  { id: "SHZ-STP-13", name: "Jail Chowrangi",             landmark: "Jail Road" },
  { id: "SHZ-STP-14", name: "Mazar-e-Quaid",              landmark: "Quaid Tomb" },
  { id: "SHZ-STP-15", name: "Old Numaish",                landmark: "Numaish Chowrangi" },
  { id: "SHZ-STP-16", name: "Plaza / MA Jinnah Road",     landmark: "Plaza Cinema" },
  { id: "SHZ-STP-17", name: "Jama Cloth Market",          landmark: "Lighthouse Market" },
  { id: "SHZ-STP-18", name: "Denso Hall",                 landmark: "MA Jinnah Wholesale Market" },
  { id: "SHZ-STP-19", name: "Boulton Market",             landmark: "Kharadar Entrance" },
  { id: "SHZ-STP-20", name: "Tower",                      landmark: "Merewether Tower" },
  { id: "SHZ-STP-21", name: "Jamat Khana",               landmark: "Aga Khan Road" },
  { id: "SHZ-STP-22", name: "G. Allana Road",             landmark: "Machli Miyani" },
  { id: "SHZ-STP-23", name: "Gulbai",                     landmark: "Gulbai Chowrangi" },
  { id: "SHZ-STP-24", name: "Hawksbay",                   landmark: "Terminal Destination" },
];

const BUS_ID = "SHZ-01";
const TICK_MS = 4500;

interface TelemetryState { idx: number; dir: 1 | -1; speed: number; }
interface RouteVisualizerProps { onCloseMap?: () => void; }

export default function RouteVisualizer({ onCloseMap }: RouteVisualizerProps) {
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
        return { idx: next, dir, speed: 26 + Math.round(Math.random() * 24) };
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const n = SHERAZ_STOPS.length;
  const { idx, dir, speed } = telemetry;
  const currentStop = SHERAZ_STOPS[idx];
  const nextStop = SHERAZ_STOPS[idx + dir] ?? currentStop;
  const heading = dir === 1 ? "Westbound → Hawksbay" : "Eastbound → CP 06";
  const etaNext = Math.max(1, Math.round(120 / speed));
  const stopsToEnd = dir === 1 ? n - 1 - idx : idx;
  const etaTerminus = stopsToEnd * etaNext;
  const progress = Math.round((idx / (n - 1)) * 100);

  // vertical track geometry
  const firstPct = (0.5 / n) * 100;
  const busPct   = ((idx + 0.5) / n) * 100;

  const toggleStop = (id: string) =>
    setActiveStop((prev) => (prev === id ? null : id));

  const stopEta = (i: number) => Math.max(1, Math.abs(i - idx) * etaNext);

  return (
    <section className="rv-stage" aria-label="Live Sheraz Coach corridor">

      {/* ── Header ── */}
      <div className="rv-hero">
        <div className="rv-hero-top">
          <div>
            <span className="rv-eyebrow">
              <span className="material-symbols-outlined rv-radio-icon">sensors</span>
              Live Corridor · University Road to Hawksbay
            </span>
            <h2 className="rv-title">Sheraz Coach</h2>
            <p className="rv-desc">CP 06 Malir Cantt ⇄ Hawksbay · 24 stops</p>
          </div>
          <div className="rv-hero-right">
            <span className="rv-live-pill">
              <span className="rv-live-dot" />
              LIVE
            </span>
            {onCloseMap && (
              <button onClick={onCloseMap} className="rv-close-btn" title="Close map">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry chips */}
        <div className="rv-chips">
          <span className="rv-chip rv-chip--accent">
            <span className="material-symbols-outlined">directions_bus</span>
            {BUS_ID} · Non-AC Coach
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">navigation</span>
            {currentStop.name} → {nextStop.name}
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">speed</span>
            {speed} km/h
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">schedule</span>
            ~{etaNext} min · {heading}
          </span>
        </div>
      </div>

      {/* ── Corridor board ── */}
      <div className="rv-board">
        {/* progress header */}
        <div className="rv-board-head">
          <span className="rv-board-label">Stop-by-stop tracker</span>
          <div className="rv-progress-meta">
            <div className="rv-progress-bar">
              <div className="rv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="rv-progress-pct">{progress}%</span>
          </div>
        </div>

        {/* vertical track */}
        <div className="rv-track-wrap">
          <div className="rv-track-rows">
            {/* static rail */}
            <span className="rv-rail" aria-hidden="true" />
            {/* filled portion */}
            <span
              className="rv-rail-fill"
              aria-hidden="true"
              style={{ top: `${firstPct}%`, height: `${Math.max(0, busPct - firstPct)}%` }}
            />
            {/* bus dot */}
            <span className="rv-bus-dot" style={{ top: `${busPct}%` }} aria-hidden="true">
              <span className="material-symbols-outlined rv-bus-icon">directions_bus</span>
            </span>

            {SHERAZ_STOPS.map((stop, i) => {
              const isTerminal = i === 0 || i === n - 1;
              const isBehind   = dir === 1 ? i < idx : i > idx;
              const isCurrent  = i === idx;
              const isActive   = activeStop === stop.id;

              return (
                <div
                  key={stop.id}
                  className={[
                    "rv-row",
                    isCurrent  ? "rv-row--current"  : "",
                    isBehind   ? "rv-row--visited"  : "",
                    isActive   ? "rv-row--active"   : "",
                    isTerminal ? "rv-row--terminal" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => toggleStop(stop.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleStop(stop.id); }
                  }}
                  aria-pressed={isActive}
                >
                  <div className="rv-node">
                    {isTerminal
                      ? <span className="material-symbols-outlined" style={{ fontSize: 12 }}>directions_bus</span>
                      : i + 1}
                  </div>
                  <div className="rv-stop-info">
                    <div className="rv-stop-name">
                      <span>{stop.name}</span>
                      {isTerminal && <span className="rv-terminal-badge">Terminal</span>}
                      {isCurrent  && <span className="rv-current-badge">● Now</span>}
                    </div>
                    {isActive && !isCurrent ? (
                      <span className="rv-eta-chip">
                        <span className="material-symbols-outlined" style={{ fontSize: 10 }}>schedule</span>
                        {BUS_ID} · ~{stopEta(i)} min
                      </span>
                    ) : (
                      <span className="rv-landmark">{stop.landmark}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="rv-footer">
        <div className="rv-stats">
          <div className="rv-stat">
            <span className="rv-stat-label">Official Fare</span>
            <span className="rv-stat-value">Rs. 20–100</span>
          </div>
          <div className="rv-stat">
            <span className="rv-stat-label">Fleet</span>
            <span className="rv-stat-value">Mini Bus · Non-AC</span>
          </div>
          <div className="rv-stat">
            <span className="rv-stat-label">Terminus ETA</span>
            <span className="rv-stat-value rv-stat-value--primary">~{etaTerminus} min</span>
          </div>
        </div>
        <span className="rv-verified">
          <span className="material-symbols-outlined rv-shield-icon">verified_user</span>
          Verified · Sindh Mass Transit Authority
        </span>
      </div>
    </section>
  );
}
