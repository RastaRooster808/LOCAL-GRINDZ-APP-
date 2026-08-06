"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { answerConcierge } from "@/lib/ai-concierge";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Aloha! I'm the Black Rock Cafe concierge (demo mode). Ask me about the menu, our history, hours, or directions." },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const answer = answerConcierge(trimmed);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "assistant", text: answer.text }]);
    setInput("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="AI Concierge chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="card-surface mb-3 flex h-[28rem] w-[22rem] max-w-[90vw] flex-col overflow-hidden bg-night-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-semibold text-white">Ask Black Rock Cafe</p>
              <span className="rounded-full bg-sunrise-400/20 px-2 py-0.5 text-xs text-sunrise-200">Demo AI</span>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "assistant" ? "bg-white/10 text-stone-100" : "ml-auto bg-lava-500 text-white"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-white/10 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <label className="sr-only" htmlFor="concierge-input">Type your question</label>
              <input
                id="concierge-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What's on the menu?"
                className="focus-ring flex-1 rounded-full border border-white/15 bg-night-950 px-4 py-2 text-sm text-white placeholder:text-stone-500"
              />
              <button type="submit" className="btn-primary !px-4 !py-2 text-sm">
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-lava-500 text-white shadow-xl shadow-lava-900/50 transition hover:bg-lava-400"
        aria-expanded={open}
        aria-label={open ? "Close concierge chat" : "Open concierge chat"}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    </div>
  );
}
