import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../lib/types';
import { STATUS_LABELS } from '../lib/types';

interface ReferralCode {
  code: string;
  uses: number;
  points_earned: number;
}

function generateCode(email: string): string {
  const prefix = email.split('@')[0].replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'GNDZ';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${suffix}`;
}

export function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [points, setPoints] = useState(0);
  const [referral, setReferral] = useState<ReferralCode | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOrders = useCallback(async (customerEmail: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, vendors(name, slug)')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    const list = (data as Order[]) || [];
    setOrders(list);
    setPoints(
      list.filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + Math.floor(Number(o.total) * 10), 0),
    );
    setLoading(false);
  }, []);

  const loadOrCreateReferral = useCallback(async (customerEmail: string) => {
    // Try to fetch existing code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code, uses, points_earned')
      .eq('customer_email', customerEmail)
      .single();

    if (existing) {
      setReferral(existing as ReferralCode);
      return;
    }

    // Create a new one (retry up to 3 times on collision)
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode(customerEmail);
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ customer_email: customerEmail, code })
        .select('code, uses, points_earned')
        .single();

      if (!error && data) {
        setReferral(data as ReferralCode);
        return;
      }
      // If conflict on unique code, retry with a new code
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        loadOrders(session.user.email);
        loadOrCreateReferral(session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        loadOrders(session.user.email);
        loadOrCreateReferral(session.user.email);
      } else {
        setLoading(false);
        setOrders([]);
        setPoints(0);
        setReferral(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadOrders, loadOrCreateReferral]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/#/account` },
    });
    if (error) alert(error.message);
    else setSent(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleCopyCode() {
    if (!referral) return;
    const shareText = `Use my The Kingdom Emporium referral code ${referral.code} on your first order and earn 25 bonus Grindz Points! ${window.location.origin}/#/vendors`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (loading) return (
    <div className="tracking-page">
      <header className="site-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>My Account</h1>
      </header>
      <main className="tracking-main"><p className="loading-msg">Loading…</p></main>
    </div>
  );

  if (!user) {
    return (
      <div className="tracking-page">
        <header className="site-header">
          <Link to="/" className="back-link">← Home</Link>
          <h1>My Account</h1>
          <p className="tagline">Sign in to track orders &amp; earn rewards</p>
        </header>
        <main className="tracking-main">
          {sent
            ? <section className="account-magic-sent" aria-live="polite">
                <span className="account-icon" aria-hidden="true">📬</span>
                <h2>Check your email</h2>
                <p>We sent a sign-in link to <strong>{email}</strong>.</p>
                <p>Click it to access your account — no password needed.</p>
              </section>
            : <section className="account-login">
                <h2>Sign In</h2>
                <p>Enter your email to view order history and loyalty points.</p>
                <form onSubmit={handleSignIn} className="account-login-form">
                  <label htmlFor="acct-email">Email address</label>
                  <input
                    id="acct-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    aria-required="true"
                  />
                  <button type="submit" className="btn-primary">Send Magic Link</button>
                </form>
                <p className="account-login-sub">
                  Use the same email you order with — your history links automatically.
                </p>
              </section>
          }
        </main>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="tracking-page">
      <header className="site-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>My Account</h1>
        <p className="tagline">{user.email}</p>
      </header>

      <main className="tracking-main">
        {/* Loyalty Points Card */}
        <section className="account-points-card" aria-label="Loyalty points">
          <div className="points-badge">
            <span className="points-number" aria-label={`${points.toLocaleString()} Grindz Points`}>
              {points.toLocaleString()}
            </span>
            <span className="points-label">Grindz Points</span>
          </div>
          <div className="points-meta">
            <p className="points-info">Earn 10 pts per $1 · Redeem at participating vendors</p>
            {totalSpent > 0 && (
              <p className="points-spent">Total spent: <strong>${totalSpent.toFixed(2)}</strong></p>
            )}
          </div>
        </section>

        {/* Referral Code Card */}
        {referral && (
          <section className="referral-card" aria-label="Your referral code">
            <div className="referral-card-header">
              <h2>Refer a Friend</h2>
              <span className="referral-badge">🤝</span>
            </div>
            <p className="referral-desc">
              Share your code — they get <strong>25 bonus points</strong> on their first order,
              you get <strong>50 points</strong> when they order!
            </p>
            <div className="referral-code-row">
              <span className="referral-code" aria-label={`Your referral code: ${referral.code}`}>
                {referral.code}
              </span>
              <button
                className={`btn-copy${copied ? ' copied' : ''}`}
                onClick={handleCopyCode}
                aria-label="Copy referral code and share message"
              >
                {copied ? '✓ Copied!' : 'Copy & Share'}
              </button>
            </div>
            {referral.uses > 0 && (
              <p className="referral-stats">
                {referral.uses} friend{referral.uses !== 1 ? 's' : ''} referred ·{' '}
                {referral.points_earned} pts earned from referrals
              </p>
            )}
          </section>
        )}

        {/* Active / in-progress orders */}
        {activeOrders.length > 0 && (
          <section aria-label="Active orders">
            <h2>Active Orders</h2>
            <div className="account-orders">
              {activeOrders.map(o => {
                const vendorName = (o.vendors as { name: string } | null)?.name ?? 'Vendor';
                return (
                  <Link key={o.id} to={`/order/${o.id}`} className="account-order-card account-order-card--active">
                    <div className="order-card-top">
                      <span className="order-card-vendor">{vendorName}</span>
                      <span className={`order-card-status-pill status-${o.status}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </div>
                    <div className="order-card-bottom">
                      <span className="order-card-total">${Number(o.total).toFixed(2)}</span>
                      <span className="order-card-cta" aria-hidden="true">Track →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Order history */}
        <section aria-label="Order history">
          <h2>Order History</h2>
          {orders.length === 0
            ? (
              <p className="empty-msg">
                No orders yet. <Link to="/">Browse vendors →</Link>
              </p>
            )
            : (
              <div className="account-orders" role="list">
                {pastOrders.map(o => {
                  const vendorName = (o.vendors as { name: string } | null)?.name ?? 'Vendor';
                  const vendorSlug = (o.vendors as { slug: string } | null)?.slug;
                  return (
                    <div key={o.id} className="account-order-card" role="listitem">
                      <div className="order-card-top">
                        <span className="order-card-vendor">{vendorName}</span>
                        <span className={`order-card-status-pill status-${o.status}`}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </div>
                      <div className="order-card-bottom">
                        <span className="order-card-date">
                          {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="order-card-items">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                        <span className="order-card-total">${Number(o.total).toFixed(2)}</span>
                        {o.status === 'completed' && o.total && (
                          <span className="order-card-pts">+{Math.floor(Number(o.total) * 10)} pts</span>
                        )}
                      </div>
                      {vendorSlug && (
                        <Link to={`/vendors/${vendorSlug}`} className="order-card-reorder">
                          Order again →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          }
        </section>

        <button onClick={handleSignOut} className="btn-secondary account-signout">
          Sign Out
        </button>
      </main>
    </div>
  );
}
