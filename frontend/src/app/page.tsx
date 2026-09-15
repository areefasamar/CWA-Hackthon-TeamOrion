"use client";

import React, { useState } from "react";
import ChatContainer from "@/components/ChatContainer";
import RouteVisualizer from "@/components/RouteVisualizer";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <main className="stitch-main">
      <Sidebar
        onNewJourney={() => {
          setResetKey((k) => k + 1);
          setIsMapOpen(false);
        }}
      />
      <div className="stitch-main-inner">
        <div className={`stitch-content-split ${isMapOpen ? "map-open" : ""}`}>
          <div className="stitch-chat-pane">
            <ChatContainer
              onToggleMap={() => setIsMapOpen((v) => !v)}
              mapOpen={isMapOpen}
              resetKey={resetKey}
            />
          </div>
          {isMapOpen && (
            <div className="stitch-map-pane">
              <RouteVisualizer onCloseMap={() => setIsMapOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
