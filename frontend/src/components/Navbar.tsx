"use client";

import React from "react";
import { Bus, MapPin, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo-group">
          <div className="logo-icon-wrapper">
            <Bus className="logo-bus-icon" size={24} />
            <span className="logo-ping"></span>
          </div>
          <div>
            <div className="logo-title-row">
              <h1 className="logo-title">Karachi Transit AI</h1>
              <span className="badge-beta">Phase 1 MVP</span>
            </div>
            <p className="logo-subtitle">Aapka Smart Commute Dost & Route Guide</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="route-pill">
            <span className="status-dot"></span>
            <span className="route-name">Route 1 (EV-1)</span>
            <span className="route-divider">•</span>
            <span className="route-detail">Model Colony ⇄ Tower</span>
          </div>

          <div className="route-pill secondary-route">
            <MapPin size={13} className="pin-icon" />
            <span className="route-name">Sheraz Coach</span>
            <span className="route-detail">Malir Cantt ⇄ Hawksbay</span>
          </div>
        </div>
      </div>
    </header>
  );
}
