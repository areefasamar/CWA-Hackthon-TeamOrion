"use client";

import React, { useState } from "react";

export default function Header() {
  const [shareLabel, setShareLabel] = useState("Share");

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link copied!");
      setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <header className="stitch-header">
      <div className="stitch-header-left">
        <img alt="Safar logo" className="stitch-header-logo" src="/safar-logo.svg" />
        <div className="stitch-breadcrumbs">
          <span className="stitch-bc-item stitch-bc-active">Safar</span>
          <span className="material-symbols-outlined stitch-bc-chevron">chevron_right</span>
          <span className="stitch-bc-item">Transit Workspace</span>
        </div>
        <div className="stitch-ai-pill">
          <span className="material-symbols-outlined stitch-bolt-icon">bolt</span>
          <span>Route Intelligence</span>
        </div>
      </div>

      <div className="stitch-header-right">
        <button className="stitch-hdr-btn" type="button" onClick={handleShare}>
          <span className="material-symbols-outlined">ios_share</span>
          <span className="stitch-hdr-btn-label">{shareLabel}</span>
        </button>
        <div className="stitch-hdr-divider"></div>
        <div className="stitch-profile-area">
          <span className="stitch-user-avatar stitch-profile-avatar">U</span>
          <span className="material-symbols-outlined stitch-expand-icon">expand_more</span>
        </div>
      </div>
    </header>
  );
}
