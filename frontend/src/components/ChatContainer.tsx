"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RefreshCw, Mic, Compass, Search, Map, Zap, Layers, Navigation, Bus, Clock } from "lucide-react";
import JourneyCard from "./JourneyCard";

interface ChatContainerProps {
  onToggleMap?: () => void;
}

const MOCK_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Where would you like to travel today? Real-time routes, live telematics, and transit fare intelligence across the network.",
    timestamp: "10:45 AM"
  },
  {
    id: "usr-1",
    sender: "user",
    text: "Find the fastest route from Central Station to Innovation Tech Park during peak hours, and check if Route 104 Express has AC.",
    timestamp: "10:48 AM"
  },
  {
    id: "bot-2",
    sender: "bot",
    text: "The fastest commute right now is Route 104 Express, boarding from Platform 2B in exactly 4 minutes.\n\nYes, this vehicle is confirmed to have active, temperature-regulated climate control (Dual AC). By bypassing the surface road congestion via the newly integrated elevated transit bypass, it saves approximately 14 minutes compared to the Local 42 bus line.",
    timestamp: "10:48 AM",
    sources: [
      { title: "Route 104 Express", desc: "Live Telematics", icon: Bus, color: "text-primary" },
      { title: "Central Terminal", desc: "Gate 2B Sensor", icon: Clock, color: "text-secondary" },
      { title: "Transit Fare DB", desc: "Zone A Tariff", icon: Zap, color: "text-tertiary" },
      { title: "Corridor Radar", desc: "No Incidents", icon: Navigation, color: "text-primary" },
    ],
    journeyCardMock: true
  }
];

const SUGGESTIONS = [
  "What are the evening return trip timings?",
  "Alternative Blue Metro Line connection",
  "View full weekly transit fare table"
];

export default function ChatContainer({ onToggleMap }: ChatContainerProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
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
    if (!query) return;

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

    // Mock bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "This is a mocked response based on the design specifications. Real telematics data would be displayed here.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full relative px-space-gutter py-space-lg w-full max-w-4xl mx-auto pb-32">
      {/* Mode Tabs */}
      <div className="flex items-center justify-between bg-surface-container-lowest rounded-full p-1.5 shadow-sm border border-surface-container mb-space-lg shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button onClick={() => setActiveTab("answer")} className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${activeTab === "answer" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"}`}>
            <Sparkles size={14} /> Answer
          </button>
          <button onClick={() => setActiveTab("live-tracking")} className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${activeTab === "live-tracking" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"}`}>
            <Navigation size={14} /> Live Tracking
          </button>
          <button onClick={() => setActiveTab("fare")} className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${activeTab === "fare" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"}`}>
            <Bus size={14} /> Fare & Routes
          </button>
          <button onClick={() => setActiveTab("sources")} className={`flex items-center gap-1 px-4 py-1.5 rounded-full font-label-md transition ${activeTab === "sources" ? "bg-surface-container text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"}`}>
            <Layers size={14} /> Sources
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm ml-1">8</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex flex-col gap-space-lg flex-1 overflow-y-auto">
        {messages.map((msg, index) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-sm border border-surface-container/60">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">U</span>
                    <span className="font-semibold text-on-surface">Traveler Query</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
                <p className="font-title-md text-on-surface font-semibold leading-snug">{msg.text}</p>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md border border-surface-container/60">
                <div className="flex items-center justify-between gap-space-xs pb-space-xs">
                  <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                    <Sparkles size={14} className="text-primary" />
                    <span className="font-label-sm text-on-surface font-semibold">Researched feeds</span>
                  </div>
                </div>

                {/* Sources Bento Grid Mock */}
                {msg.sources && (
                  <div className="flex flex-col gap-space-xs">
                    <div className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Sources Consulted</div>
                    <div className="grid grid-cols-2 gap-space-xs">
                      {msg.sources.map((src, i) => (
                        <div key={i} className="p-space-xs px-space-sm rounded bg-surface-container-low flex items-center gap-space-xs cursor-pointer hover:bg-surface-container">
                          <src.icon size={16} className={src.color} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-sm text-on-surface font-semibold truncate">{src.title}</span>
                            <span className="text-[12px] text-on-surface-variant truncate">{src.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-space-xs text-on-surface leading-relaxed text-[15px] whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Mocked Journey Card inside Chat */}
                {msg.journeyCardMock && (
                  <div className="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-md border border-surface-container/60 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                          <Bus size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">104 Express</span>
                          <span className="text-[12px] text-on-surface-variant">Fleet Unit #PK-889</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-secondary font-label-sm font-semibold">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span> On Time
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button onClick={onToggleMap} className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-white font-label-sm transition hover:bg-primary-container">
                        <Map size={14} /> Track Live on Map
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {index === messages.length - 1 && (
                  <div className="flex flex-col gap-space-xs pt-space-xs mt-4">
                    <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Suggested Follow-ups</span>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((sug, i) => (
                        <button key={i} onClick={() => handleSend(sug)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-fixed text-primary font-label-sm hover:bg-primary hover:text-white transition">
                          <Search size={12} /> {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Prompt Dock */}
      <div className="absolute bottom-6 left-0 right-0 px-space-gutter pointer-events-none">
        <div className="w-full max-w-3xl mx-auto pointer-events-auto bg-white/95 backdrop-blur-2xl rounded-xl p-3 shadow-lg flex flex-col gap-2 border border-surface-container/60">
          <input 
            type="text" 
            className="w-full bg-transparent border-none outline-none text-on-surface px-2 py-1 placeholder:text-outline" 
            placeholder="Ask a follow-up or plan a new transit route..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button className="text-on-surface-variant hover:text-primary"><Compass size={18} /></button>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-on-surface-variant hover:text-primary"><Mic size={18} /></button>
              <button onClick={() => handleSend()} className="w-8 h-8 rounded-full bg-secondary-container text-white flex items-center justify-center hover:bg-secondary transition"><Send size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
