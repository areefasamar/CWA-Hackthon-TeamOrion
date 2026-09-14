"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatContainerProps {
  onToggleMap?: () => void;
}

const QUICK_PROMPTS = [
  "What are the evening return trip timings?",
  "Alternative Blue Metro Line connection",
  "View full weekly transit fare table"
];

export default function ChatContainer({ onToggleMap }: ChatContainerProps) {
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; timestamp: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("answer");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.value = "";
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "The fastest commute right now is Route 104 Express, boarding from Platform 2B in exactly 4 minutes. Yes, this vehicle is confirmed to have active, temperature-regulated climate control (Dual AC). By bypassing the surface road congestion via the newly integrated elevated transit bypass, it saves approximately 14 minutes compared to the Local 42 bus line.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setLoading(false);
    }, 1200);
  };

  const showHero = messages.length === 0 && !loading;

  return (
    <div className="max-w-4xl mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-lg pb-36 stitch-chat-col">
      {/* Hero Brand Block */}
      {showHero && (
        <div className="flex flex-col items-center text-center pt-space-xs pb-space-sm">
          <div className="relative mb-space-md stitch-hero-glow-group">
            <div className="stitch-hero-glow-ring"></div>
            <div className="stitch-hero-avatar">
              <img
                alt="Safar Truck Art Bus"
                className="w-full h-full object-contain rounded-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARDxv5gqzoMaNvApatiY9BtMlVkzLCIOZo5mJejOx8wFS3PJ57xUoJJQOwfP6lVfPNZ8FYa0iUbG89JxuyRwtZrllU95kxIRo7axcr9Ab7yWF2agObpg8FBXk46xncZPA1cW3tqouPwhz4Vsl-I_yLg577GvSfxu4liiBBL3gBDYmbDIs4VYJ138plJ1D5hCSytQn_bws4FvDUBSVEq5RT580D5BCblz8psEx7Rz27fSMtWgG968kXSe5N83KOpcB0v3Y"
              />
            </div>
            <span className="stitch-copilot-badge">Safar Transit Copilot</span>
          </div>
          <h1 className="stitch-hero-heading">Where would you like to travel today?</h1>
          <p className="stitch-hero-subtext">Real-time routes, live telematics, and transit fare intelligence across the network.</p>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="stitch-mode-tabs">
        <div className="stitch-tabs-inner">
          {[
            { key: "answer", icon: "auto_awesome", label: "Answer", fill: true },
            { key: "live-tracking", icon: "sensors", label: "Live Tracking" },
            { key: "fare", icon: "directions_transit", label: "Fare & Routes" },
            { key: "sources", icon: "lan", label: "Sources", badge: "8 Stations" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`stitch-tab-btn ${activeTab === tab.key ? "active" : ""}`}
              type="button"
            >
              <span className="material-symbols-outlined stitch-tab-icon"
                style={tab.fill && activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && <span className="stitch-tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
        <div className="stitch-gtfs-pill">
          <span className="stitch-gtfs-dot"></span>
          <span className="stitch-gtfs-label">GTFS-RT Active</span>
        </div>
      </div>

      {/* Conversation Flow */}
      <div className="flex flex-col gap-space-lg">
        {messages.length === 0 && !loading && (
          // Default static conversation (as in stitch design)
          <>
            {/* User Query Card */}
            <div className="stitch-user-query-card">
              <div className="stitch-query-meta">
                <div className="stitch-query-meta-left">
                  <span className="stitch-user-avatar">U</span>
                  <span className="stitch-query-label">Traveler Query</span>
                  <span className="stitch-dot">•</span>
                  <span className="stitch-query-time">10:48 AM</span>
                </div>
                <div className="stitch-query-actions">
                  <button className="stitch-query-action-btn" title="Edit query" type="button">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="stitch-query-action-btn" title="Copy text" type="button">
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
              <p className="stitch-query-text">
                Find the fastest route from Central Station to Innovation Tech Park during peak hours, and check if Route 104 Express has AC.
              </p>
            </div>

            {/* AI Response Card */}
            <div className="stitch-ai-response-card">
              {/* Feed Badging */}
              <div className="stitch-feed-badge-row">
                <div className="stitch-feed-badge">
                  <span className="stitch-ping-dot"></span>
                  <span className="material-symbols-outlined stitch-hub-icon">hub</span>
                  <span className="stitch-feed-label">Researched 4 transit feeds</span>
                  <span className="stitch-sep">•</span>
                  <span className="stitch-latency">2.1s latency</span>
                </div>
                <div className="stitch-verified-badge">
                  <span className="material-symbols-outlined stitch-verified-icon">verified_user</span>
                  <span>Verified GTFS Schedule 2026.4</span>
                </div>
              </div>

              {/* Sources Consulted */}
              <div className="stitch-sources-section">
                <div className="stitch-sources-label">Sources Consulted</div>
                <div className="stitch-sources-grid">
                  {[
                    { icon: "directions_bus", color: "text-primary", title: "Route 104 Express", desc: "Live Telematics" },
                    { icon: "departure_board", color: "text-secondary", title: "Central Terminal", desc: "Gate 2B Sensor" },
                    { icon: "payments", color: "text-tertiary", title: "Transit Fare DB", desc: "Zone A Tariff" },
                    { icon: "traffic", color: "text-primary", title: "Corridor Radar", desc: "No Incidents" },
                  ].map((src, i) => (
                    <div key={i} className="stitch-source-tile">
                      <span className={`material-symbols-outlined stitch-source-icon ${src.color}`}>{src.icon}</span>
                      <div className="stitch-source-text">
                        <span className="stitch-source-title">{src.title}</span>
                        <span className="stitch-source-desc">{src.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesis Text */}
              <div className="stitch-synthesis">
                <p className="stitch-synthesis-primary">
                  The fastest commute right now is{" "}
                  <strong className="stitch-highlight-primary">Route 104 Express</strong>, boarding from{" "}
                  <strong>Platform 2B</strong> in exactly{" "}
                  <strong className="stitch-highlight-primary">4 minutes</strong>.
                </p>
                <p className="stitch-synthesis-secondary">
                  Yes, this vehicle is confirmed to have active, temperature-regulated climate control (
                  <span className="stitch-highlight-primary font-semibold">Dual AC</span>). By bypassing the surface road
                  congestion via the newly integrated elevated transit bypass, it saves approximately 14 minutes compared
                  to the Local 42 bus line.
                </p>
              </div>

              {/* Journey Telematics Card */}
              <div className="stitch-journey-card">
                <div className="stitch-jc-header">
                  <div className="stitch-jc-route-info">
                    <div className="stitch-jc-icon-wrap">
                      <span className="material-symbols-outlined">directions_bus</span>
                    </div>
                    <div className="stitch-jc-meta">
                      <div className="stitch-jc-name-row">
                        <span className="stitch-jc-name">104 Express</span>
                        <span className="stitch-jc-ac-badge">
                          <span className="material-symbols-outlined stitch-fan-icon">mode_fan</span> Climate AC
                        </span>
                      </div>
                      <span className="stitch-jc-fleet">Fleet Unit #PK-889 • Safar Intercity Low-Floor</span>
                    </div>
                  </div>
                  <div className="stitch-jc-status">
                    <span className="stitch-status-dot"></span>
                    On Time • Departs 10:52 AM
                  </div>
                </div>

                {/* Wayfinding Timeline */}
                <div className="stitch-wayfinding">
                  <div className="stitch-waypoint">
                    <div className="stitch-wp-dot wp-origin"></div>
                    <div className="stitch-wp-info">
                      <span className="stitch-wp-name">Central Station</span>
                      <span className="stitch-wp-time stitch-highlight-primary">Platform 2B • 10:52 AM</span>
                    </div>
                  </div>
                  <div className="stitch-route-line">
                    <div className="stitch-route-line-meta">
                      <span>Via Elevated Flyover</span>
                      <span className="font-semibold">26 min direct</span>
                    </div>
                    <div className="stitch-route-progress">
                      <div className="stitch-route-progress-fill"></div>
                    </div>
                    <div className="stitch-route-stops">1 intermediate transfer stop</div>
                  </div>
                  <div className="stitch-waypoint">
                    <div className="stitch-wp-dot wp-destination"></div>
                    <div className="stitch-wp-info">
                      <span className="stitch-wp-name">Innovation Tech Park</span>
                      <span className="stitch-wp-time stitch-highlight-secondary">Main Gate Drop • 11:18 AM</span>
                    </div>
                  </div>
                </div>

                {/* Bento Specs Grid */}
                <div className="stitch-specs-grid">
                  {[
                    { icon: "schedule", color: "text-primary", label: "Trip Duration", value: "26 Mins" },
                    { icon: "payments", color: "text-secondary", label: "Tap-to-Pay", value: "$2.50" },
                    { icon: "airline_seat_recline_normal", color: "text-tertiary", label: "Occupancy", value: "64% (Seats Avail)" },
                  ].map((spec, i) => (
                    <div key={i} className="stitch-spec-tile">
                      <div className="stitch-spec-left">
                        <span className={`material-symbols-outlined ${spec.color}`}>{spec.icon}</span>
                        <span className="stitch-spec-label">{spec.label}</span>
                      </div>
                      <span className="stitch-spec-value">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA Group */}
                <div className="stitch-cta-row">
                  <button onClick={onToggleMap} className="stitch-cta-primary" type="button">
                    <span className="material-symbols-outlined">map</span>
                    <span>Track Live on Map</span>
                  </button>
                  <button className="stitch-cta-secondary" type="button">
                    <span className="material-symbols-outlined">download</span>
                    <span>Download Schedule</span>
                  </button>
                  <button className="stitch-cta-secondary" type="button">
                    <span className="material-symbols-outlined">notifications_active</span>
                    <span>Set Departure Alert</span>
                  </button>
                </div>
              </div>

              {/* Follow-Up Suggestions */}
              <div className="stitch-suggestions-section">
                <span className="stitch-suggestions-label">Suggested Follow-ups</span>
                <div className="stitch-suggestions-chips">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="stitch-suggestion-chip"
                      type="button"
                    >
                      <span className="material-symbols-outlined stitch-chip-icon">search</span>
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Dynamic messages (when user types) */}
        {messages.map((msg) =>
          msg.sender === "user" ? (
            <div key={msg.id} className="stitch-user-query-card">
              <div className="stitch-query-meta">
                <div className="stitch-query-meta-left">
                  <span className="stitch-user-avatar">U</span>
                  <span className="stitch-query-label">Traveler Query</span>
                  <span className="stitch-dot">•</span>
                  <span className="stitch-query-time">{msg.timestamp}</span>
                </div>
              </div>
              <p className="stitch-query-text">{msg.text}</p>
            </div>
          ) : (
            <div key={msg.id} className="stitch-ai-response-card">
              <div className="stitch-feed-badge-row">
                <div className="stitch-feed-badge">
                  <span className="stitch-ping-dot"></span>
                  <span className="material-symbols-outlined stitch-hub-icon">hub</span>
                  <span className="stitch-feed-label">Researched transit feeds</span>
                </div>
              </div>
              <div className="stitch-synthesis">
                <p className="stitch-synthesis-primary">{msg.text}</p>
              </div>
              <div className="stitch-suggestions-section" style={{ paddingTop: "0.5rem" }}>
                <span className="stitch-suggestions-label">Suggested Follow-ups</span>
                <div className="stitch-suggestions-chips">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button key={i} onClick={() => handleSend(prompt)} className="stitch-suggestion-chip" type="button">
                      <span className="material-symbols-outlined stitch-chip-icon">search</span>
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="stitch-ai-response-card">
            <div className="stitch-feed-badge">
              <span className="stitch-ping-dot"></span>
              <span className="stitch-feed-label">Researching transit feeds...</span>
            </div>
            <div className="stitch-typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Docked Input Bar */}
      <div className="stitch-input-dock">
        <div className="stitch-input-pod">
          <div className="stitch-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="stitch-textarea"
              placeholder="Ask a follow-up or plan a new transit route..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <div className="stitch-input-toolbar">
            <div className="stitch-toolbar-left">
              <button className="stitch-toolbar-icon-btn" title="Add location or image" type="button">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="stitch-toolbar-pill-btn" type="button">
                <span className="material-symbols-outlined stitch-explore-icon">explore</span>
                <span>Focus: Transit AI</span>
                <span className="material-symbols-outlined stitch-expand-icon">expand_more</span>
              </button>
              <button className="stitch-toolbar-pill-btn stitch-hidden-sm" type="button">
                <span className="material-symbols-outlined stitch-model-icon">psychology</span>
                <span>Safar 2.5 Pro</span>
              </button>
            </div>
            <div className="stitch-toolbar-right">
              <button className="stitch-toolbar-icon-btn" title="Voice Search" type="button">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button
                onClick={() => handleSend()}
                className="stitch-send-btn"
                title="Submit"
                type="button"
                disabled={loading || !input.trim()}
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
