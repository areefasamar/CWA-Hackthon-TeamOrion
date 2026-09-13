"use client";

import React from "react";
import { Menu, ChevronRight, Zap, Map, Share, SlidersHorizontal, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header className="top-header">
      <div className="header-left">
        {/* Mobile Menu Hamburger Trigger */}
        <button id="mobile-menu-btn" className="mobile-menu-btn" type="button">
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span className="breadcrumb-item hidden-sm hoverable" onClick={() => location.reload()}>Safar</span>
          <ChevronRight size={14} className="hidden-sm" />
          <span className="breadcrumb-item hoverable">Transit Workspace</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active truncate-item">Route Intelligence</span>
        </div>

        {/* Safar AI Status Pill */}
        <div className="safar-ai-status-pill hidden-sm">
          <Zap size={14} className="status-icon" />
          <span>Safar AI 2.5 Transit</span>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="header-right">
        {/* Split Map Dynamic Toggle */}
        <button id="toggle-map-btn" className="header-action-btn" type="button" title="Toggle Live Transit Map Split Screen">
          <Map size={16} />
          <span className="btn-label hidden-sm">Split Map</span>
        </button>

        {/* Share Trigger */}
        <button className="header-action-btn" type="button" onClick={() => alert('Shareable route link copied to clipboard!')}>
          <Share size={16} />
          <span className="hidden-sm">Share</span>
        </button>

        {/* Tune Settings Button */}
        <button className="header-icon-btn" title="Settings & Schedules" type="button">
          <SlidersHorizontal size={16} />
        </button>

        <div className="header-divider"></div>

        {/* Profile Dropdown */}
        <div className="profile-dropdown" onClick={() => alert('Logged in as Traveler #8821')}>
          <div className="profile-avatar">
            <span className="material-symbols-outlined profile-icon">account_circle</span>
          </div>
          <ChevronDown size={14} className="dropdown-icon" />
        </div>
      </div>
    </header>
  );
}
