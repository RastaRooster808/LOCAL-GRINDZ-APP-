import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  vendor_id: string;
  customer_email: string;
  sender: 'customer' | 'vendor';
  body: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  customer_email: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface VendorInboxProps {
  vendorId: string;
}

export function VendorInbox({ vendorId }: VendorInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('vendor_messages')
      .select('customer_email, body, created_at, read, sender')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (!data) return;

    const byEmail = new Map<string, Conversation>();
    for (const row of data as Message[]) {
      if (!byEmail.has(row.customer_email)) {
        byEmail.set(row.customer_email, {
          customer_email: row.customer_email,
          lastMessage: row.body,
          lastAt: row.created_at,
          unread: 0,
        });
      }
      if (!row.read && row.sender === 'customer') {
        byEmail.get(row.customer_email)!.unread++;
      }
    }
    setConversations(Array.from(byEmail.values()));
  }, [vendorId]);

  useEffect(() => {
    loadConversations();

    // Realtime: new messages to this vendor
    const channel = supabase
      .channel(`vendor-inbox-${vendorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vendor_messages',
        filter: `vendor_id=eq.${vendorId}`,
      }, payload => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
        loadConversations();
        if (msg.sender === 'customer' && msg.customer_email !== activeEmail) {
          // Typing indicator broadcasts come through presence
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.vendor_id === vendorId) {
          setIsTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId, loadConversations, activeEmail]);

  async function openConversation(email: string) {
    setActiveEmail(email);
    setIsTyping(false);

    const { data } = await supabase
      .from('vendor_messages')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('customer_email', email)
      .order('created_at', { ascending: true });

    setMessages((data as Message[]) || []);

    // Mark customer messages as read
    await supabase
      .from('vendor_messages')
      .update({ read: true })
      .eq('vendor_id', vendorId)
      .eq('customer_email', email)
      .eq('sender', 'customer')
      .eq('read', false);

    loadConversations();
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !activeEmail || sending) return;
    setSending(true);
    await supabase.from('vendor_messages').insert({
      vendor_id: vendorId,
      customer_email: activeEmail,
      sender: 'vendor',
      body: reply.trim(),
    });
    setReply('');
    setSending(false);
  }

  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="inbox-wrap">
      <div className="inbox-sidebar">
        <h3 className="inbox-sidebar-title">
          Inbox {unreadTotal > 0 && <span className="inbox-unread-badge">{unreadTotal}</span>}
        </h3>
        {conversations.length === 0
          ? <p className="empty-msg" style={{ padding: '0.75rem' }}>No messages yet.</p>
          : conversations.map(c => (
            <button
              key={c.customer_email}
              className={`inbox-convo-btn${activeEmail === c.customer_email ? ' active' : ''}`}
              onClick={() => openConversation(c.customer_email)}
              aria-label={`Conversation with ${c.customer_email}${c.unread > 0 ? `, ${c.unread} unread` : ''}`}
            >
              <div className="inbox-convo-header">
                <span className="inbox-convo-email">{c.customer_email}</span>
                {c.unread > 0 && <span className="inbox-unread-dot">{c.unread}</span>}
              </div>
              <p className="inbox-convo-preview">{c.lastMessage}</p>
              <p className="inbox-convo-time">
                {new Date(c.lastAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </button>
          ))
        }
      </div>

      <div className="inbox-chat">
        {!activeEmail
          ? <div className="inbox-empty"><p>Select a conversation</p></div>
          : (
            <>
              <div className="inbox-chat-header">
                <strong>{activeEmail}</strong>
              </div>
              <div className="inbox-messages" role="log" aria-live="polite" aria-label="Messages">
                {messages.map(m => (
                  <div key={m.id} className={`inbox-msg inbox-msg--${m.sender}`}>
                    <span className="inbox-msg-body">{m.body}</span>
                    <span className="inbox-msg-time">
                      {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="inbox-typing" aria-live="polite" aria-label="Customer is typing">
                    <span>Customer is typing…</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <form className="inbox-reply-form" onSubmit={sendReply}>
                <textarea
                  className="inbox-reply-input"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  rows={2}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e as unknown as React.FormEvent); } }}
                  aria-label="Reply message"
                />
                <button type="submit" className="btn-primary inbox-send-btn" disabled={!reply.trim() || sending}>
                  {sending ? '…' : 'Send'}
                </button>
              </form>
            </>
          )
        }
      </div>
    </div>
  );
}
