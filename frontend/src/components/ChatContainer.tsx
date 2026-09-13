"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Mic, Compass, Search, Map, Zap, Layers, Navigation, Bus, Clock } from "lucide-react";

interface ChatContainerProps {
  onToggleMap?: () => void;
}

const MOCK_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Assalam-o-Alaikum! Main Safar AI hoon — aapka Sheraz Coach route guide. CP 06 Malir Cantt se Hawksbay tak safar, stops aur kiraye ke baray mein poochein!",
    timestamp: "Just now"
  }
];

const QUICK_PROMPTS = [
  { label: "Safoora se Tower", query: "Sheraz Coach Safoora Chowrangi se Tower jayegi?" },
  { label: "CP 06 se Hawksbay", query: "CP 06 Malir Cantt se Hawksbay ka kiraya kitna hai?" },
  { label: "NED se Tower", query: "Sheraz Coach NED University se Tower jayegi?" }
];

const MOCK_BOT_RESPONSES = [
  "Sheraz Coach CP 06 se Hawksbay tak jaati hai. Safoora Chowrangi se Tower tak ka kiraya Rs. 30-40 hai (stage ke mutabiq).",
  "Haan! Sheraz Coach NED University gate ke saamne ruk'ti hai. Wahan se Tower tak ~25 minute lagtay hain peak hours mein.",
  "CP 06 Malir Cantt se Hawksbay ka poora kiraya Rs. 100 hai. Subah 6 baje se raat 10 baje tak service available hai."
];

export default function ChatContainer({ onToggleMap }: ChatContainerProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeTab, setActiveTab] = useState("answer");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    setLoading(true);

    // Mock bot response
    setTimeout(() => {
      const randomResponse = MOCK_BOT_RESPONSES[Math.floor(Math.random() * MOCK_BOT_RESPONSES.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: randomResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const toggleMic = () => {
    setListening((prev) => !prev);
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <div className="flex flex-col h-full relative w-full max-w-4xl mx-auto">
      {/* Mode Tabs */}
      <div className="flex items-center justify-between bg-surface-container-lowest rounded-full p-1.5 shadow-sm border border-surface-container mx-space-gutter mt-space-lg mb-space-md shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("answer")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${
              activeTab === "answer" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Sparkles size={14} /> Answer
          </button>
          <button
            onClick={() => setActiveTab("live-tracking")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${
              activeTab === "live-tracking" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Navigation size={14} /> Live Tracking
          </button>
          <button
            onClick={() => setActiveTab("fare")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${
              activeTab === "fare" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Bus size={14} /> Fare &amp; Routes
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${
              activeTab === "sources" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Layers size={14} /> Sources
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm ml-1">8</span>
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-on-surface-variant pr-space-sm font-label-sm text-label-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span>GTFS-RT Active</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex flex-col gap-space-lg flex-1 overflow-y-auto px-space-gutter pb-36">
        {messages.map((msg, index) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-sm border border-surface-container/60">
                <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-[11px]">U</span>
                  <span className="font-semibold text-on-surface">Traveler Query</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="font-title-md text-on-surface font-semibold leading-snug">{msg.text}</p>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container/60">
                <div className="flex items-center gap-space-xs pb-space-xs">
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                    <Sparkles size={14} className="text-primary" />
                    <span className="font-label-sm text-on-surface font-semibold">Safar AI</span>
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs text-on-surface leading-relaxed text-[15px] whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Track on Map CTA for all bot messages */}
                {index > 0 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={onToggleMap}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-white font-label-sm transition hover:bg-primary-container"
                    >
                      <Map size={14} /> Track Live on Map
                    </button>
                  </div>
                )}

                {/* Suggested Follow-ups on last message */}
                {index === messages.length - 1 && (
                  <div className="flex flex-col gap-space-xs pt-space-xs mt-2">
                    <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Suggested Follow-ups</span>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((qp, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(qp.query)}
                          disabled={loading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-sm hover:bg-primary hover:text-white transition"
                        >
                          <Search size={12} /> {qp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        })}

        {/* Quick prompts on fresh conversation */}
        {showSuggestions && (
          <div className="suggestions-block">
            <span className="suggestions-label">
              <Compass size={12} />
              Try asking
            </span>
            <div className="suggestions-chips">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => handleSend(qp.query)}
                  disabled={loading}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="message-row bot-row">
            <div className="message-bubble bot-bubble typing-bubble">
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
              <span className="typing-text">Rasta aur kiraya check kiya ja raha hai...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating prompt bar (Level 3 glass pod) */}
      <div className="prompt-dock">
        <div className="prompt-pod">
          <button
            type="button"
            className={`mic-button ${listening ? "listening" : ""}`}
            onClick={toggleMic}
            disabled={loading}
            title={listening ? "Stop listening" : "Speak your question"}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
          >
            <Mic size={17} />
          </button>

          <input
            type="text"
            className="chat-input"
            placeholder="Safoora se Tower ka kiraya kitna hai?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            aria-label="Ask Safar AI about Sheraz Coach routes and fares"
          />

          <button
            type="button"
            className="send-button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            title="Send message"
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </div>

        <div className="prompt-footer">
          <p className="prompt-hint">Roman Urdu · اردو · English — Sheraz Coach</p>
          <p className="prompt-hint prompt-hint--desktop">Safar AI can make mistakes. Verify critical trips.</p>
        </div>
      </div>
    </div>
  );
}
