"use client";
import React from "react";

export default function Header() {
  return (
    <header className="stitch-header">
      <div className="stitch-header-left">
        <div className="stitch-breadcrumbs">
          <span className="stitch-bc-item stitch-bc-hoverable">Safar</span>
          <span className="material-symbols-outlined stitch-bc-chevron">chevron_right</span>
          <span className="stitch-bc-item stitch-bc-hoverable">Transit Workspace</span>
          <span className="material-symbols-outlined stitch-bc-chevron">chevron_right</span>
          <span className="stitch-bc-item stitch-bc-active">Route Intelligence</span>
        </div>
        <div className="stitch-ai-pill">
          <span className="material-symbols-outlined stitch-bolt-icon">bolt</span>
          <span>Safar AI 2.5 Transit</span>
        </div>
      </div>

      <div className="stitch-header-right">
        <button className="stitch-hdr-btn" type="button">
          <span className="material-symbols-outlined">ios_share</span>
          <span className="stitch-hdr-btn-label">Share</span>
        </button>
        <button className="stitch-hdr-icon-btn" type="button">
          <span className="material-symbols-outlined">tune</span>
        </button>
        <div className="stitch-hdr-divider"></div>
        <div className="stitch-profile-area">
          <img
            alt="Profile"
            className="stitch-profile-avatar"
            src="https://lh3.googleusercontent.com/aida/AEtjO1UDhQQha1kvvMBG63vfg6poRS_LFYo1d1iLgYkW4S1kpM27V2BveLMg13d1-p9dDlspdtG41sEp5CcfBUR02Goxx9DZU-Uua-NKDKiHWC2VuPiE1oD2wedXgD0E4qwG4mMHiWMhot_U4N3R0kBIJKK_t658Wo-vFeb7brOsIcVUObDaBnaxwWJPg6Xk1X3_tz98yGPytqtXC9qsxreUFS7MP9ARTiRNWXtlq0sZ9KtPlSaWMoky584sK5NXDht7mwxu1u2ToE-tINY"
          />
          <span className="material-symbols-outlined stitch-expand-icon">expand_more</span>
        </div>
      </div>
    </header>
  );
}
