"use client";
import React from "react";

export default function Sidebar() {
  return (
    <aside className="stitch-sidebar">
      <div className="stitch-sidebar-content">
        {/* Brand Header */}
        <div className="stitch-brand">
          <img
            alt="Safar Transit AI Logo"
            className="stitch-brand-logo"
            src="https://lh3.googleusercontent.com/aida/AEtjO1UDhQQha1kvvMBG63vfg6poRS_LFYo1d1iLgYkW4S1kpM27V2BveLMg13d1-p9dDlspdtG41sEp5CcfBUR02Goxx9DZU-Uua-NKDKiHWC2VuPiE1oD2wedXgD0E4qwG4mMHiWMhot_U4N3R0kBIJKK_t658Wo-vFeb7brOsIcVUObDaBnaxwWJPg6Xk1X3_tz98yGPytqtXC9qsxreUFS7MP9ARTiRNWXtlq0sZ9KtPlSaWMoky584sK5NXDht7mwxu1u2ToE-tINY"
          />
          <div className="stitch-brand-text">
            <div className="stitch-brand-name">Safar</div>
            <span className="stitch-brand-sub">Transit AI Studio</span>
          </div>
        </div>

        {/* New Journey Button */}
        <div className="stitch-new-journey-wrap">
          <button className="stitch-new-journey-btn" type="button">
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
          <a aria-current="page" className="stitch-nav-link stitch-nav-link--active" href="#">
            <span className="material-symbols-outlined">search</span>
            Search &amp; Explore
          </a>
          <a className="stitch-nav-link" href="#">
            <span className="material-symbols-outlined">schedule</span>
            Transit Schedules
          </a>
          <a className="stitch-nav-link" href="#">
            <span className="material-symbols-outlined">sensors</span>
            Live Telematics
          </a>
          <a className="stitch-nav-link" href="#">
            <span className="material-symbols-outlined">bookmark_border</span>
            Saved Routes
          </a>
          <a className="stitch-nav-link" href="#">
            <span className="material-symbols-outlined">folder_open</span>
            Transit Library
          </a>
        </nav>

        {/* Recent Chats */}
        <div className="stitch-recent-header">
          <span>Recent Chats</span>
          <span className="material-symbols-outlined stitch-history-icon">history</span>
        </div>
        <div className="stitch-recent-list">
          {["Bus timings to Downtown", "Route 42 fare breakdown", "Live location updates", "Platform 4 express"].map((chat) => (
            <a key={chat} className="stitch-recent-item" href="#">
              <span className="material-symbols-outlined stitch-recent-icon">chat_bubble_outline</span>
              <span className="stitch-recent-text">{chat}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Engine Status */}
      <div className="stitch-engine-badge">
        <div className="stitch-engine-inner">
          <span className="material-symbols-outlined stitch-engine-icon">smart_toy</span>
          <div className="stitch-engine-text">
            <span className="stitch-engine-name">Safar AI Engine</span>
            <span className="stitch-engine-ver">v2.5 Multimodal</span>
          </div>
        </div>
        <span className="stitch-engine-pulse"></span>
      </div>
    </aside>
  );
}
