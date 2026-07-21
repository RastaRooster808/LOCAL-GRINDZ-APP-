import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'What botanical prints do you have?',
  'How do digital downloads work?',
  'Tell me about the fresh flower subscriptions',
];

/** Renders reply text with bare URLs as links. */
function AgentText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

export default function ShopAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartIdRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    const next: AgentMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke<{
        reply: string;
        cartId?: string;
      }>('shop-agent', { body: { messages: next, cartId: cartIdRef.current } });
      if (fnError || !data?.reply) throw fnError ?? new Error('empty reply');
      if (data.cartId) cartIdRef.current = data.cartId;
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('The shop assistant is unavailable right now. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="shop-agent-fab" onClick={() => setOpen(true)} aria-label="Open shop assistant">
        🌺 Ask the Farm
      </button>
    );
  }

  return (
    <div className="shop-agent-panel" role="dialog" aria-label="Shop assistant chat">
      <div className="shop-agent-header">
        <span>🌺 TOPP Shop Assistant</span>
        <button onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
      </div>
      <div className="shop-agent-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="shop-agent-welcome">
            <p>Aloha! Ask about our botanical prints, fresh flowers, or anything in the shop.</p>
            <div className="shop-agent-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`shop-agent-msg shop-agent-msg--${m.role}`}>
            <AgentText text={m.content} />
          </div>
        ))}
        {busy && <div className="shop-agent-msg shop-agent-msg--assistant shop-agent-typing">…</div>}
        {error && <div className="shop-agent-error">{error}</div>}
      </div>
      <form
        className="shop-agent-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about prints, flowers, delivery…"
          aria-label="Message the shop assistant"
        />
        <button type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
