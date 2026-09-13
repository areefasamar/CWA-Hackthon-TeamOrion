"use client";

import React, { useEffect, useState } from "react";
import { Bus, Radio, Navigation, Gauge, Clock, ShieldCheck, X } from "lucide-react";

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

interface RouteVisualizerProps {
  onCloseMap?: () => void;
}

export default function RouteVisualizer({ onCloseMap }: RouteVisualizerProps) {
  // Simulated live telemetry ticker
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

  const firstPct = (0.5 / n) * 100;
  const busPct = ((idx + 0.5) / n) * 100;

  const toggleStop = (id: string) => {
    setActiveStop((prev) => (prev === id ? null : id));
  };

  const stopEta = (stopIdx: number) => Math.max(1, Math.abs(stopIdx - idx) * etaNext);

  return (
    <section className="flex flex-col h-full bg-surface-container-lowest" aria-label="Live Route corridor status">
      {/* Telemetry Radar Overlay (Mocked map area) */}
      <div className="relative h-64 bg-surface-container flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/layers.png')] opacity-10 blur-sm"></div>
        {onCloseMap && (
          <button onClick={onCloseMap} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white transition z-10 shadow-sm border border-surface-container">
            <X size={16} />
          </button>
        )}
        <div className="bg-white/90 backdrop-blur-xl rounded-lg p-4 shadow-lg border border-white flex flex-wrap items-center justify-between gap-4 z-10 min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <Navigation size={16} />
            </div>
            <div>
              <div className="font-bold text-on-surface font-title-sm text-[14px]">Route 104 Telematics</div>
              <div className="text-[12px] text-on-surface-variant">Fleet #PK-889 • GPS Sat-Link Active</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant font-label-sm">Live Speed</span>
              <span className="font-bold text-primary text-[14px]">{speed} km/h</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant font-label-sm">Next Stop</span>
              <span className="font-bold text-on-surface text-[14px]">{nextStop.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor board — stop-by-stop live tracker */}
      <div className="flex-1 overflow-y-auto px-space-md py-space-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-label-sm uppercase tracking-wider text-on-surface-variant">Corridor Tracker</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-label-sm text-primary">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="relative pl-6 pb-6">
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-primary/20" />
          <div className="absolute left-8 w-1 bg-primary transition-all duration-1000 rounded-full" style={{ top: `${firstPct}%`, height: `${busPct - firstPct}%` }} />
          <div className="absolute left-[28px] w-3 h-3 bg-white border-2 border-primary rounded-full transition-all duration-1000 z-10" style={{ top: `${busPct}%`, transform: 'translateY(-50%)' }} />

          <div className="flex flex-col h-full justify-between gap-6 relative z-10 ml-6">
            {ROUTE_1_STOPS.map((stop, i) => {
              const isCurrent = i === idx;
              const isActive = activeStop === stop.id;
              return (
                <div key={stop.id} onClick={() => toggleStop(stop.id)} className={`relative flex flex-col cursor-pointer p-2 rounded transition hover:bg-surface-container-lowest border border-transparent ${isActive ? 'bg-surface-container-lowest border-surface-container/60 shadow-sm' : ''}`}>
                  <div className="font-semibold text-[15px] text-on-surface">{stop.name}</div>
                  {isActive && !isCurrent ? (
                    <span className="text-[12px] text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full self-start mt-1">
                      ~{stopEta(i)} min ETA
                    </span>
                  ) : (
                    <span className="text-[13px] text-on-surface-variant">{stop.landmark}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low p-space-md border-t border-surface-container flex flex-wrap gap-4 justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-on-surface-variant font-bold">Fare</span>
          <span className="font-bold text-on-surface text-[14px]">Rs. 50 Flat</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-on-surface-variant font-bold">Fleet</span>
          <span className="font-bold text-on-surface text-[14px]">Electric AC</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] uppercase text-on-surface-variant font-bold">Terminus ETA</span>
          <span className="font-bold text-primary text-[14px]">~{etaTerminus} min</span>
        </div>
      </div>
    </section>
  );
}
