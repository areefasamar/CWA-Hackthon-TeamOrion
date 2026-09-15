"use client";

import React from "react";

interface SidebarProps {
  onNewJourney?: () => void;
}

const NAV_ITEMS = [
  { icon: "search", label: "Search & Explore", active: true },
  { icon: "directions_transit", label: "Fare & Routes" },
  { icon: "sensors", label: "Live Telematics" },
];

interface SidebarProps {
  onNewJourney?: () => void;
  onNavSelect?: (label: string) => void;
}

export default function Sidebar({ onNewJourney, onNavSelect }: SidebarProps) {
  return (
    <aside className="stitch-sidebar">
      <div className="stitch-sidebar-content">
        {/* Brand Header */}
        <div className="stitch-brand">
          <img
            alt="Safar Transit AI Logo"
            className="stitch-brand-logo"
            src="/safar-logo.svg"
          />
          <div className="stitch-brand-text">
            <div className="stitch-brand-name">Safar</div>
            <span className="stitch-brand-sub">Transit AI Studio</span>
          </div>
        </div>

        {/* New Journey Button */}
        <div className="stitch-new-journey-wrap">
          <button className="stitch-new-journey-btn" type="button" onClick={onNewJourney}>
            <div className="stitch-njb-left">
              <span className="material-symbols-outlined">add</span>
              <span className="stitch-njb-label">New Journey</span>
            </div>
            <span className="stitch-njb-kbd">⌘K</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="stitch-nav-section-title">Navigation</div>
        <nav className="stitch-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`stitch-nav-link ${item.active ? "stitch-nav-link--active" : ""}`}
              onClick={() => onNavSelect?.(item.label)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Recent Chats — static mock history (non-interactive by design) */}
        <div className="stitch-recent-header">
          <span>Recent Chats</span>
          <span className="material-symbols-outlined stitch-history-icon">history</span>
        </div>
        <div className="stitch-recent-list">
          {[
            "CP 6 to Dolmen Mall",
            "Safoora to Tower fare",
            "EV-1 stop list",
            "Sheraz timings",
          ].map((chat) => (
            <span key={chat} className="stitch-recent-item">
              <span className="material-symbols-outlined stitch-recent-icon">chat_bubble_outline</span>
              <span className="stitch-recent-text">{chat}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Engine Status */}
      <div className="stitch-engine-badge">
        <div className="stitch-engine-inner">
          <span className="material-symbols-outlined stitch-engine-icon">smart_toy</span>
          <div className="stitch-engine-text">
            <span className="stitch-engine-name">Safar Engine</span>
            <span className="stitch-engine-ver">Local mock · 2 routes</span>
          </div>
        </div>
        <span className="stitch-engine-pulse"></span>
      </div>
    </aside>
  );
}
