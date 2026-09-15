"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import JourneyCard from "@/components/JourneyCard";
import type { ApiResponse, ChatMessage, ClarifySuggestions } from "@/types/transit";
import { SHERAZ, EV1 } from "@/lib/transitData";

interface ChatContainerProps {
  onToggleMap?: () => void;
  mapOpen?: boolean;
  resetKey?: number;
  presetQuery?: string | null;
  onPresetConsumed?: () => void;
}

const QUICK_PROMPTS = [
  "Fare from Safoora to Tower",
  "Malir Halt to Dolmen Mall Clifton",
  "List all Sheraz Coach stops",
  "EV-1 timings",
];

const EXAMPLE_QUERY = "Fare from Safoora Chowrangi to Tower?";

export default function ChatContainer({
  onToggleMap,
  mapOpen = false,
  resetKey = 0,
  presetQuery,
  onPresetConsumed,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("answer");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presetHandled = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, activeTab]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setActiveTab("answer");
    presetHandled.current = false;
  }, [resetKey]);

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query || loading) return;

      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setActiveTab("answer");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query }),
        });

        const data: ApiResponse = await res.json();
        const journeyCard = data.journey_card;
        const responseText =
          data.response || journeyCard?.summary_text || "Sorry, I could not process that request.";

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          journeyCard,
          clarify: data.clarify ?? null,
          follow_ups: data.follow_ups ?? [],
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: "bot",
            text: "Connection error. Please check your network and try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  useEffect(() => {
    if (presetQuery && !presetHandled.current) {
      presetHandled.current = true;
      handleSend(presetQuery);
      onPresetConsumed?.();
    }
  }, [presetQuery, handleSend, onPresetConsumed]);

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (key === "live-tracking") onToggleMap?.();
    else if (mapOpen && onToggleMap) onToggleMap();
  };

  const showHero = messages.length === 0 && !loading;

  const handleClarify = (clarify: ClarifySuggestions, choice: string) => {
    if (clarify.withOther && clarify.other) {
      const query =
        clarify.field === "origin"
          ? `${choice} to ${clarify.other}`
          : `${clarify.other} to ${choice}`;
      handleSend(query);
    } else {
      handleSend(choice);
    }
  };

  const farePanel = (
    <div className="stitch-fare-panel">
      <div className="stitch-fare-route">
        <h3>{SHERAZ.route_name}</h3>
        <p>
          {SHERAZ.canonical_stops[0].official_name} ⇄{" "}
          {SHERAZ.canonical_stops[SHERAZ.canonical_stops.length - 1].official_name} ·{" "}
          {SHERAZ.canonical_stops.length} stops · {SHERAZ.ac_available ? "AC" : "Non-AC"}
        </p>
        <p className="stitch-fare-highlight">
          Stage fare: Rs. {SHERAZ.fare_policy.minimum_fare} – {SHERAZ.fare_policy.maximum_fare} ·{" "}
          {SHERAZ.fare_policy.payment_methods.join(", ").toLowerCase().replace(/_/g, " ")}
        </p>
      </div>
      <div className="stitch-fare-route">
        <h3>{EV1.route_name}</h3>
        <p>
          {EV1.canonical_stops[0].official_name} ⇄{" "}
          {EV1.canonical_stops[EV1.canonical_stops.length - 1].official_name} ·{" "}
          {EV1.canonical_stops.length} stops · {EV1.ac_available ? "AC" : "Non-AC"}
        </p>
        <p className="stitch-fare-highlight">
          Rs. {EV1.fare_policy.short_distance_fare} up to {EV1.fare_policy.fare_threshold_landmark},{" "}
          Rs. {EV1.fare_policy.long_distance_fare} beyond ·{" "}
          {EV1.fare_policy.payment_methods.join(", ").toLowerCase().replace(/_/g, " ")}
        </p>
      </div>
    </div>
  );

  const sourcesPanel = (
    <div className="stitch-sources-panel">
      <div className="stitch-source-tile">
        <span className="material-symbols-outlined stitch-source-icon text-primary">directions_bus</span>
        <div className="stitch-source-text">
          <span className="stitch-source-title">{SHERAZ.route_name} Dataset</span>
          <span className="stitch-source-desc">{SHERAZ.canonical_stops.length} verified stops</span>
        </div>
      </div>
      <div className="stitch-source-tile">
        <span className="material-symbols-outlined stitch-source-icon text-secondary">electric_car</span>
        <div className="stitch-source-text">
          <span className="stitch-source-title">{EV1.route_name} Dataset</span>
          <span className="stitch-source-desc">{EV1.canonical_stops.length} verified stops</span>
        </div>
      </div>
      <div className="stitch-source-tile">
        <span className="material-symbols-outlined stitch-source-icon text-tertiary">map</span>
        <div className="stitch-source-text">
          <span className="stitch-source-title">Live Map Tracker</span>
          <span className="stitch-source-desc">Simulated telemetry (mock)</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-lg pb-36 stitch-chat-col">
      {showHero && (
        <div className="flex flex-col items-center text-center pt-space-xs pb-space-sm">
          <div className="relative mb-space-md stitch-hero-glow-group">
            <div className="stitch-hero-glow-ring"></div>
            <div className="stitch-hero-avatar">
              <img alt="Safar Transit" className="stitch-hero-logo" src="/safar-logo.png" />
            </div>
            <span className="stitch-copilot-badge">Safar Transit Copilot</span>
          </div>
          <h1 className="stitch-hero-heading">Where would you like to travel today?</h1>
          <p className="stitch-hero-subtext">
            Real-time routes, live telematics, and transit fare intelligence across the network.
          </p>
        </div>
      )}

      <div className="stitch-mode-tabs">
        <div className="stitch-tabs-inner">
          {[
            { key: "answer", icon: "auto_awesome", label: "Answer", fill: true },
            { key: "live-tracking", icon: "sensors", label: "Live Tracking" },
            { key: "fare", icon: "directions_transit", label: "Fare & Routes" },
            { key: "sources", icon: "lan", label: "Sources", badge: "2 Routes" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`stitch-tab-btn ${activeTab === tab.key ? "active" : ""}`}
              type="button"
            >
              <span
                className="material-symbols-outlined stitch-tab-icon"
                style={tab.fill && activeTab === tab.key ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && <span className="stitch-tab-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
        <div className="stitch-gtfs-pill">
          <span className="stitch-gtfs-dot"></span>
          <span className="stitch-gtfs-label">Karachi Routes Active</span>
        </div>
      </div>

      {activeTab === "fare" && farePanel}
      {activeTab === "sources" && sourcesPanel}

      <div className="flex flex-col gap-space-lg">
        {showHero && activeTab === "answer" && (
          <>
            <div className="stitch-welcome-card">
              <p className="stitch-welcome-label">Try asking</p>
              <p className="stitch-welcome-example">&ldquo;{EXAMPLE_QUERY}&rdquo;</p>
              <button
                className="stitch-welcome-try-btn"
                type="button"
                onClick={() => handleSend(EXAMPLE_QUERY)}
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Try this example
              </button>
            </div>

            <div className="stitch-suggestions-section">
              <span className="stitch-suggestions-label">Quick prompts</span>
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
          </>
        )}

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
                <div className="stitch-query-actions">
                  <button
                    className="stitch-query-action-btn"
                    title="Edit query"
                    type="button"
                    onClick={() => {
                      setInput(msg.text);
                    }}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    className="stitch-query-action-btn"
                    title="Copy text"
                    type="button"
                    onClick={() => copyText(msg.text, msg.id)}
                  >
                    <span className="material-symbols-outlined">
                      {copiedId === msg.id ? "check" : "content_copy"}
                    </span>
                  </button>
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
                  <span className="stitch-feed-label">Researched {msg.journeyCard ? 2 : 1} transit feeds</span>
                </div>
                <div className="stitch-verified-badge">
                  <span className="material-symbols-outlined stitch-verified-icon">verified_user</span>
                  <span>Verified dataset v2026.4</span>
                </div>
              </div>

              {/* Sources Consulted — per stitch design */}
              <div className="stitch-sources-section">
                <div className="stitch-sources-label">Sources Consulted</div>
                <div className="stitch-sources-grid">
                  <div className="stitch-source-tile">
                    <span className="material-symbols-outlined stitch-source-icon text-primary">directions_bus</span>
                    <div className="stitch-source-text">
                      <span className="stitch-source-title">{msg.journeyCard?.primary_route_name || "Route Datasets"}</span>
                      <span className="stitch-source-desc">Canonical stops</span>
                    </div>
                  </div>
                  <div className="stitch-source-tile">
                    <span className="material-symbols-outlined stitch-source-icon text-secondary">payments</span>
                    <div className="stitch-source-text">
                      <span className="stitch-source-title">Transit Fare DB</span>
                      <span className="stitch-source-desc">Official tariff</span>
                    </div>
                  </div>
                </div>
              </div>

              {msg.journeyCard && msg.journeyCard.status === "CONFIRMED" && msg.journeyCard.steps.length > 0 ? (
                <JourneyCard card={msg.journeyCard} onTrackMap={() => handleTabClick("live-tracking")} />
              ) : (
                <div className="stitch-synthesis">
                  <p className="stitch-synthesis-primary" style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </p>
                  {msg.journeyCard?.commuter_tips && msg.journeyCard.commuter_tips.length > 0 && (
                    <ul className="stitch-error-tips">
                      {msg.journeyCard.commuter_tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {msg.clarify && msg.clarify.options.length > 0 && (
                <div className="stitch-clarify-block">
                  <span className="stitch-clarify-label">
                    <span className="material-symbols-outlined">touch_app</span>
                    {msg.clarify.withOther
                      ? `Tap to complete your trip — sets the ${msg.clarify.field}`
                      : "Tap an option"}
                  </span>
                  <div className="stitch-suggestions-chips">
                    {msg.clarify.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="stitch-suggestion-chip stitch-clarify-chip"
                        disabled={loading}
                        onClick={() => handleClarify(msg.clarify!, opt)}
                      >
                        <span className="material-symbols-outlined stitch-chip-icon">
                          {msg.clarify!.field === "origin" ? "trip_origin" : "place"}
                        </span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="stitch-suggestions-section" style={{ paddingTop: "0.5rem" }}>
                  <span className="stitch-suggestions-label">Suggested follow-ups</span>
                  <div className="stitch-suggestions-chips">
                    {msg.follow_ups.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(prompt)}
                        className="stitch-suggestion-chip"
                        type="button"
                        disabled={loading}
                      >
                        <span className="material-symbols-outlined stitch-chip-icon">arrow_outward</span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {loading && (
          <div className="stitch-ai-response-card">
            <div className="stitch-feed-badge">
              <span className="stitch-ping-dot"></span>
              <span className="stitch-feed-label">Finding your route...</span>
            </div>
            <div className="stitch-typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={`stitch-input-dock ${mapOpen ? "with-map" : ""}`}>
        <div className="stitch-input-pod">
          <div className="stitch-textarea-wrap">
            <textarea
              className="stitch-textarea"
              placeholder="Ask about Sheraz Coach or EV-1 — e.g. 'Safoora se Tower kitna kiraya?'"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
          </div>
          <div className="stitch-input-toolbar">
            <div className="stitch-toolbar-left">
              <button
                className="stitch-toolbar-pill-btn"
                type="button"
                onClick={() => handleSend("List all Sheraz Coach stops")}
                disabled={loading}
              >
                <span className="material-symbols-outlined stitch-explore-icon">explore</span>
                <span>Focus: Transit AI</span>
              </button>
            </div>
            <div className="stitch-toolbar-right">
              <button
                className="stitch-toolbar-icon-btn"
                title="Voice search"
                type="button"
                onClick={() => {
                  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!SR) {
                    alert("Voice input is not supported in this browser.");
                    return;
                  }
                  const rec = new SR();
                  rec.lang = "en-US";
                  rec.onresult = (e: any) => {
                    const said = e.results?.[0]?.[0]?.transcript;
                    if (said) handleSend(said);
                  };
                  rec.start();
                }}
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button
                onClick={() => handleSend()}
                className="stitch-send-btn"
                title="Send"
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
