"use client";

import React, { useState } from "react";
import ChatContainer from "@/components/ChatContainer";
import RouteVisualizer from "@/components/RouteVisualizer";

export default function Home() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  // In a real app, this state would be lifted to a context or Zustand store
  // so the Header's "Split Map" button can toggle it. For now, we mock it by
  // assuming ChatContainer or an event listener can trigger it.

  return (
    <main className="app-main">
      <div className="chat-col">
        <ChatContainer onToggleMap={() => setIsMapOpen(!isMapOpen)} />
      </div>
      <div className={`map-col ${isMapOpen ? "open" : ""}`}>
        <RouteVisualizer onCloseMap={() => setIsMapOpen(false)} />
      </div>
    </main>
  );
}
