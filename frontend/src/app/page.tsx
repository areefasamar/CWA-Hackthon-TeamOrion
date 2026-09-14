"use client";

import React, { useState } from "react";
import ChatContainer from "@/components/ChatContainer";
import RouteVisualizer from "@/components/RouteVisualizer";

export default function Home() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <main className="stitch-main">
      <div className="stitch-main-inner">
        {/* Chat column is always full width unless map is open */}
        <div className={`stitch-content-split ${isMapOpen ? "map-open" : ""}`}>
          <div className="stitch-chat-pane">
            <ChatContainer onToggleMap={() => setIsMapOpen(!isMapOpen)} />
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
