"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ApiResponse } from "@/types/transit";
import JourneyCard from "./JourneyCard";
import { Send, Bot, User, Sparkles, RefreshCw, MessageSquareQuote } from "lucide-react";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Assalam-o-Alaikum! Main Karachi Transit AI hoon — aapka local transit guide aur route partner. Peoples Bus Service Route 1 (Model Colony ⇄ Tower) ya Sheraz Coach ke baray mein koi bhi sawaal poochein!",
    timestamp: "Just now"
  }
];

const QUICK_PROMPTS = [
  { label: "Model Colony se Tower", query: "Model Colony se Tower kitna kiraya hai?" },
  { label: "Airport se Metropole", query: "Star Gate (Airport) se Metropole kaise jaun?" },
  { label: "Karsaz se Arts Council", query: "Karsaz se Arts Council jana hai, kitne paise lagenge?" },
  { label: "Sheraz Coach Safoora", query: "Sheraz Coach Safoora Chowrangi se Tower jayegi?" }
];

export default function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, session_id: "web-session-1" })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.journey_card?.summary_text || "Aapka safar confirm ho gaya hai.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        journeyCard: data.journey_card
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "Maazrat, rabta qaaim nahi ho saka. Barah-e-karam dobara koshish karein.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="chat-container">
      {/* Quick Suggestion Chips */}
      <div className="chips-bar">
        <span className="chips-title">
          <Sparkles size={14} className="sparkle-icon" />
          Fauri Sawalaat:
        </span>
        <div className="chips-scroll">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              className="quick-chip"
              onClick={() => handleSend(qp.query)}
              disabled={loading}
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="messages-stream">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div key={msg.id} className={`message-row ${isBot ? "bot-row" : "user-row"}`}>
              <div className="avatar-wrapper">
                {isBot ? (
                  <div className="avatar bot-avatar">
                    <Bot size={18} />
                  </div>
                ) : (
                  <div className="avatar user-avatar">
                    <User size={18} />
                  </div>
                )}
              </div>

              <div className="message-content">
                <div className={`message-bubble ${isBot ? "bot-bubble" : "user-bubble"}`}>
                  <p className="bubble-text">{msg.text}</p>
                </div>

                {msg.journeyCard && (
                  <div className="card-attachment">
                    <JourneyCard card={msg.journeyCard} />
                  </div>
                )}

                <span className="message-timestamp">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="message-row bot-row">
            <div className="avatar-wrapper">
              <div className="avatar bot-avatar pulsing">
                <Bot size={18} />
              </div>
            </div>
            <div className="message-content">
              <div className="message-bubble bot-bubble loading-bubble">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-text">Rasta aur kiraya check kiya ja raha hai...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="input-bar-container">
        <div className="input-bar-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Apna sawaal likhein (e.g. Model Colony se Tower kitna kiraya hai?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="input-footer-row">
          <p className="input-helper">
            Supported: Roman Urdu, Urdu script, English • Peoples Bus Route 1 & Sheraz Coach
          </p>
          <button className="reset-button" onClick={handleReset} title="Reset Chat">
            <RefreshCw size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
