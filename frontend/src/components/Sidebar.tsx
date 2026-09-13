"use client";

import React from "react";
import { Search, Clock, ShieldCheck, Plus, Compass, Navigation, Bookmark, FolderOpen, History, Settings2, MoreHorizontal } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="safar-sidebar" id="safar-sidebar">
      <div className="sidebar-content">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <span className="material-symbols-outlined brand-logo-icon">directions_bus</span>
          </div>
          <div className="brand-text-col">
            <div className="brand-title">Safar</div>
            <span className="brand-subtitle">Transit AI Studio</span>
          </div>
        </div>

        {/* New Journey Action Button */}
        <div className="new-journey-container">
          <button id="new-journey-btn" className="new-journey-btn" type="button">
            <div className="btn-inner">
              <Plus size={16} />
              <span className="btn-label">New Journey</span>
            </div>
            <span className="btn-shortcut">⌘K</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="nav-section-title">Navigation</div>
        <nav className="sidebar-nav">
          <a className="nav-link active" data-path="chat-workspace" href="#">
            <Search size={18} />
            <span>Search &amp; Explore</span>
          </a>
          <a className="nav-link" data-path="transit-schedules" href="#">
            <Clock size={18} />
            <span>Transit Schedules</span>
          </a>
          <a className="nav-link" data-path="live-telematics" href="#">
            <Navigation size={18} />
            <span>Live Telematics</span>
          </a>
          <a className="nav-link" data-path="saved-routes" href="#">
            <Bookmark size={18} />
            <span>Saved Routes</span>
          </a>
          <a className="nav-link" data-path="transit-library" href="#">
            <FolderOpen size={18} />
            <span>Transit Library</span>
          </a>
        </nav>

        {/* Recent Chats */}
        <div className="recent-chats-header">
          <span>Recent Chats</span>
          <History size={14} className="history-icon" title="Chat History" />
        </div>
        <div className="recent-chats-list">
          <a className="recent-chat-item" href="#">
            <Search size={14} className="recent-chat-icon" />
            <span className="truncate">Bus timings to Downtown</span>
          </a>
          <a className="recent-chat-item" href="#">
            <Search size={14} className="recent-chat-icon" />
            <span className="truncate">Route 42 fare breakdown</span>
          </a>
          <a className="recent-chat-item" href="#">
            <Search size={14} className="recent-chat-icon" />
            <span className="truncate">Live location updates</span>
          </a>
          <a className="recent-chat-item" href="#">
            <Search size={14} className="recent-chat-icon" />
            <span className="truncate">Platform 4 express</span>
          </a>
        </div>
      </div>

      {/* Engine Telemetry Status Badge */}
      <div className="telemetry-badge-container">
        <div className="telemetry-badge">
          <div className="telemetry-badge-inner">
            <ShieldCheck size={18} className="telemetry-icon" />
            <div className="telemetry-text-col">
              <span className="telemetry-title">Safar AI Engine</span>
              <span className="telemetry-subtitle">v2.5 Multimodal</span>
            </div>
          </div>
          <span className="pulse-dot" title="Engine Operational"></span>
        </div>
      </div>
    </aside>
  );
}
