"use client";

import React from "react";
import { Bus, MapPin } from "lucide-react";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="brand-group">
        <div className="brand-mark" aria-hidden="true">
          <Bus size={21} strokeWidth={2.2} />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1 className="brand-title">Safar</h1>
            <span className="badge-beta">Transit AI</span>
          </div>
          <p className="brand-subtitle">Aapka smart commute dost — route, kiraya & live bus guide</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-pill live-pill" title="Live network status">
          <span className="live-dot" />
          <span className="pill-label">Live Network</span>
        </div>

        <div className="header-pill" title="Peoples Bus Service — Route 1 (EV-1)">
          <span className="pill-route-tag">R1</span>
          <span className="pill-label">Model Colony ⇄ Tower</span>
        </div>

        <div className="header-pill" title="Sheraz Coach — Malir Cantt ⇄ Hawksbay">
          <MapPin size={13} className="pill-icon" />
          <span className="pill-label">Sheraz Coach</span>
        </div>
      </div>
    </header>
  );
}
