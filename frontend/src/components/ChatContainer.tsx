"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, ApiResponse } from "@/types/transit";
import JourneyCard from "./JourneyCard";
import { Send, Sparkles, RefreshCw, Mic, Compass } from "lucide-react";

// --- Minimal Web Speech API typings (voice input micro-action) -------------
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Assalam-o-Alaikum! Main Safar AI hoon — aapka local transit guide aur route partner. Peoples Bus Service Route 1 (Model Colony ⇄ Tower) ya Sheraz Coach ke baray mein koi bhi sawaal poochein!",
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
  const [listening, setListening] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  }, []);

  // Stop any active speech recognition session when unmounting.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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
        body: JSON.stringify({
          message: query,
          session_id: "web-session-1",
          lat: coords?.lat,
          lng: coords?.lng
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.response || data.journey_card?.summary_text || "Aapka safar confirm ho gaya hai.",
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
    recognitionRef.current?.stop();
    setListening(false);
    setInput("");
    setMessages(INITIAL_MESSAGES);
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setListening(false);
  }, []);

  const startBrowserSpeechFallback = () => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!Ctor) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "bot",
          text: "Voice input is browser mein support nahi hai — Chrome ya Edge try karein, ya apna sawaal type karein.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      return;
    }

    const rec = new Ctor();
    rec.lang = "ur-PK";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const toggleMic = async () => {
    if (listening) {
      stopListening();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      startBrowserSpeechFallback();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 500) {
          startBrowserSpeechFallback();
          return;
        }
        setLoading(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          if (coords?.lat != null) form.append("lat", String(coords.lat));
          if (coords?.lng != null) form.append("lng", String(coords.lng));
          const res = await fetch("/api/voice", { method: "POST", body: form });
          const data: ApiResponse = await res.json();
          const spoken = data.transcript;
          if (!spoken) {
            startBrowserSpeechFallback();
            return;
          }
          const userMsg: ChatMessage = {
            id: `usr-${Date.now()}`,
            sender: "user",
            text: spoken,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: data.response || data.journey_card?.summary_text || "Aapka safar confirm ho gaya hai.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            journeyCard: data.journey_card
          };
          setMessages((prev) => [...prev, userMsg, botMsg]);
        } catch (err) {
          console.error("Voice request failed:", err);
          startBrowserSpeechFallback();
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setListening(true);
      window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setListening(false);
        }
      }, 8000);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      startBrowserSpeechFallback();
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <section className="chat-dock" aria-label="Safar AI conversation">
      {/* Dock header */}
      <div className="dock-header">
        <div className="dock-title-group">
          <span className="dock-eyebrow">
            <Sparkles size={12} />
            AI Route Assistant
          </span>
          <h2 className="dock-title">Kahan jaana hai?</h2>
        </div>

        <div className="dock-tools">
          <span className="dock-status" title="Assistant is online">
            <span className="live-dot" />
            Online
          </span>
          <button
            className="dock-reset"
            onClick={handleReset}
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="messages-stream">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div key={msg.id} className={`message-row ${isBot ? "bot-row" : "user-row"}`}>
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
          );
        })}

        {/* Suggested action chips — visible on a fresh conversation */}
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
            placeholder="Model Colony se Tower kitna kiraya hai?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Ask Safar AI about routes and fares"
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
          <p className="prompt-hint">Roman Urdu · اردو · English — Route 1 & Sheraz Coach</p>
          <p className="prompt-hint prompt-hint--desktop">Safar AI can make mistakes. Verify critical trips.</p>
        </div>
      </div>
    </section>
  );
}
