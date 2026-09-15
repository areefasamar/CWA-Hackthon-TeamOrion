"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ROUTES, type RouteRecord, type CanonicalStop } from "@/lib/transitData";

interface TelemetryState {
  idx: number;
  dir: 1 | -1;
  speed: number;
}

interface RouteVisualizerProps {
  onCloseMap?: () => void;
}

export default function RouteVisualizer({ onCloseMap }: RouteVisualizerProps) {
  const [routeIdx, setRouteIdx] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryState>({ idx: 5, dir: 1, speed: 28 });
  const [activeStop, setActiveStop] = useState<string | null>(null);

  const route: RouteRecord = ROUTES[routeIdx] ?? ROUTES[0];
  const stops: CanonicalStop[] = route.canonical_stops;

  // Reset tracker when switching routes
  useEffect(() => {
    setTelemetry({ idx: Math.min(5, stops.length - 1), dir: 1, speed: 28 });
    setActiveStop(null);
  }, [routeIdx, stops.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let dir = prev.dir;
        let next = prev.idx + dir;
        if (next > stops.length - 1 || next < 0) {
          dir = (dir * -1) as 1 | -1;
          next = prev.idx + dir;
        }
        return { idx: next, dir, speed: 26 + Math.round(Math.random() * 24) };
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [stops.length]);

  const n = stops.length;
  const { idx, dir, speed } = telemetry;
  const currentStop = stops[idx] ?? stops[0];
  const nextStop = stops[idx + dir] ?? currentStop;
  const heading =
    dir === 1
      ? `${route.canonical_stops[n - 1].official_name} bound`
      : `${route.canonical_stops[0].official_name} bound`;
  const etaNext = Math.max(1, Math.round(120 / speed));
  const stopsToEnd = dir === 1 ? n - 1 - idx : idx;
  const etaTerminus = stopsToEnd * etaNext;
  const progress = Math.round((idx / (n - 1)) * 100);

  const firstPct = (0.5 / n) * 100;
  const busPct = ((idx + 0.5) / n) * 100;

  const toggleStop = (id: string) => setActiveStop((prev) => (prev === id ? null : id));
  const stopEta = (i: number) => Math.max(1, Math.abs(i - idx) * etaNext);

  const fareLine = useMemo(() => {
    if (route.fare_policy.type === "STAGE_BASED") {
      return `Rs. ${route.fare_policy.minimum_fare}–${route.fare_policy.maximum_fare}`;
    }
    return `Rs. ${route.fare_policy.short_distance_fare}/${route.fare_policy.long_distance_fare} (zone)`;
  }, [route]);

  return (
    <section className="rv-stage" aria-label={`Live ${route.route_name} corridor`}>
      {/* ── Header ── */}
      <div className="rv-hero">
        <div className="rv-hero-top">
          <div>
            <span className="rv-eyebrow">
              <span className="material-symbols-outlined rv-radio-icon">sensors</span>
              Live Corridor · {route.bus_type}
            </span>
            <h2 className="rv-title">{route.route_name}</h2>
            <p className="rv-desc">
              {stops[0].official_name} ⇄ {stops[n - 1].official_name} · {n} stops
            </p>
          </div>
          <div className="rv-hero-right">
            <span className="rv-live-pill">
              <span className="rv-live-dot" />
              LIVE
            </span>
            {onCloseMap && (
              <button onClick={onCloseMap} className="rv-close-btn" title="Close map" type="button">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Route switcher */}
        <div className="rv-route-switcher">
          {ROUTES.map((r, i) => (
            <button
              key={r.route_id}
              type="button"
              className={`rv-switch-btn ${i === routeIdx ? "active" : ""}`}
              onClick={() => setRouteIdx(i)}
            >
              {r.route_name}
            </button>
          ))}
        </div>

        {/* Telemetry chips */}
        <div className="rv-chips">
          <span className="rv-chip rv-chip--accent">
            <span className="material-symbols-outlined">directions_bus</span>
            {route.ac_available ? "AC" : "Non-AC"} · {route.operator}
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">navigation</span>
            {currentStop.official_name} → {nextStop.official_name}
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">speed</span>
            {speed} km/h
          </span>
          <span className="rv-chip">
            <span className="material-symbols-outlined">schedule</span>~{etaNext} min · {heading}
          </span>
        </div>
      </div>

      {/* ── Corridor board ── */}
      <div className="rv-board">
        <div className="rv-board-head">
          <span className="rv-board-label">Stop-by-stop tracker</span>
          <div className="rv-progress-meta">
            <div className="rv-progress-bar">
              <div className="rv-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="rv-progress-pct">{progress}%</span>
          </div>
        </div>

        <div className="rv-track-wrap">
          <div className="rv-track-rows">
            <span className="rv-rail" aria-hidden="true" />
            <span
              className="rv-rail-fill"
              aria-hidden="true"
              style={{ top: `${firstPct}%`, height: `${Math.max(0, busPct - firstPct)}%` }}
            />
            <span className="rv-bus-dot" style={{ top: `${busPct}%` }} aria-hidden="true">
              <span className="material-symbols-outlined rv-bus-icon">directions_bus</span>
            </span>

            {stops.map((stop, i) => {
              const isTerminal = i === 0 || i === n - 1;
              const isBehind = dir === 1 ? i < idx : i > idx;
              const isCurrent = i === idx;
              const isActive = activeStop === stop.stop_id;

              return (
                <div
                  key={stop.stop_id}
                  className={[
                    "rv-row",
                    isCurrent ? "rv-row--current" : "",
                    isBehind ? "rv-row--visited" : "",
                    isActive ? "rv-row--active" : "",
                    isTerminal ? "rv-row--terminal" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => toggleStop(stop.stop_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleStop(stop.stop_id);
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <div className="rv-node">
                    {isTerminal ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                        directions_bus
                      </span>
                    ) : (
                      stop.sequence
                    )}
                  </div>
                  <div className="rv-stop-info">
                    <div className="rv-stop-name">
                      <span>{stop.official_name}</span>
                      {isTerminal && <span className="rv-terminal-badge">Terminal</span>}
                      {isCurrent && <span className="rv-current-badge">● Now</span>}
                    </div>
                    {isActive && !isCurrent ? (
                      <span className="rv-eta-chip">
                        <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                          schedule
                        </span>
                        ~{stopEta(i)} min away
                      </span>
                    ) : (
                      <span className="rv-landmark">
                        {(stop.sub_landmarks && stop.sub_landmarks[0]) || ""}
                      </span>
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
            <span className="rv-stat-label">Fare</span>
            <span className="rv-stat-value">{fareLine}</span>
          </div>
          <div className="rv-stat">
            <span className="rv-stat-label">Hours</span>
            <span className="rv-stat-value">
              {route.operating_hours.start}–{route.operating_hours.end}
            </span>
          </div>
          <div className="rv-stat">
            <span className="rv-stat-label">Terminus ETA</span>
            <span className="rv-stat-value rv-stat-value--primary">~{etaTerminus} min</span>
          </div>
        </div>
        <span className="rv-verified">
          <span className="material-symbols-outlined rv-shield-icon">verified_user</span>
          Mock telemetry · {route.operator}
        </span>
      </div>
    </section>
  );
}
