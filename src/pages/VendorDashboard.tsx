import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useVendorOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/vendor/OrderCard';
import { showToast } from '../components/ui/Toast';
import { ImageUpload, compressImage } from '../components/ui/ImageUpload';
import { MenuItem, Location, Special, Order, OrderStatus, Vendor, Review } from '../lib/types';
import { VendorInbox } from './VendorInbox';
import { usePushSubscription } from '../hooks/usePushSubscription';
import QRCode from 'qrcode';
import {
  Chart, BarController, BarElement, LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnalyticsState {
  orders7: Order[];
  orders30: Order[];
}

type Tab = 'orders' | 'menu' | 'location' | 'specials' | 'profile' | 'qr' | 'analytics' | 'reviews' | 'inbox' | 'billing';

interface MonthlyStatement {
  statement_month: string;
  prepaid_orders: number;
  confirmed_prepaid_volume: number;
  platform_fee_due: number;
}

export function VendorDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [tab, setTab] = useState<Tab>('orders');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [location, setLocation] = useState<Partial<Location>>({});
  const [locationId, setLocationId] = useState<string | null>(null);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartInstance = useRef<Chart | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsState | null>(null);
  const [statements, setStatements] = useState<MonthlyStatement[]>([]);

  const { orders, updateStatus } = useVendorOrders(vendor?.id ?? null);
  const { status: pushStatus, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushSubscription('vendor', vendor?.id ?? '');

  // Track new orders for toast
  const prevOrderCount = useRef(0);
  useEffect(() => {
    if (!vendor) return;
    if (prevOrderCount.current > 0 && orders.length > prevOrderCount.current) {
      const newest = orders[0];
      showToast(`New order from ${newest.customer_name}! $${Number(newest.total).toFixed(2)}`, 'success');
      try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA==').play(); } catch (_) { /* silent */ }
    }
    prevOrderCount.current = orders.length;
  }, [orders, vendor]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('vendors')
      .select('*')
      .eq('email', user.email)
      .single()
      .then(({ data }) => {
        if (data) {
          // Lazy backfill: link auth.uid() the first time this vendor logs in
          if (!data.user_id) {
            supabase.from('vendors').update({ user_id: user.id }).eq('id', data.id);
            data.user_id = user.id;
          }
          setVendor(data as Vendor);
          loadMenu(data.id);
          loadLocation(data.id);
          loadSpecials(data.id);
          loadReviews(data.id);
        }
      });
  }, [user]);

  async function loadMenu(vid: string) {
    const { data } = await supabase.from('menu_items').select('*').eq('vendor_id', vid).order('category');
    setMenuItems((data as MenuItem[]) || []);
  }

  async function loadLocation(vid: string) {
    const { data } = await supabase.from('locations').select('*').eq('vendor_id', vid).order('updated_at', { ascending: false }).limit(1).single();
    if (data) { setLocation(data as Location); setLocationId(data.id); }
  }

  async function loadSpecials(vid: string) {
    const { data } = await supabase.from('specials').select('*').eq('vendor_id', vid).order('created_at', { ascending: false });
    setSpecials((data as Special[]) || []);
  }

  async function loadReviews(vid: string) {
    const { data } = await supabase.from('reviews').select('*').eq('vendor_id', vid).order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
  }

  async function handleStatusUpdate(id: string, status: OrderStatus, extra?: { estimated_minutes?: number; cancellation_reason?: string }) {
    await updateStatus(id, status, extra);
    showToast(`Order marked ${status}`);
  }

  async function handleConfirmPayment(id: string) {
    await supabase.from('orders').update({ payment_status: 'confirmed' }).eq('id', id);
    showToast('Payment confirmed ✓', 'success');
  }

  // Billing statements — load when entering the tab
  useEffect(() => {
    if (tab !== 'billing' || !vendor?.id) return;
    supabase
      .from('vendor_monthly_statements')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('statement_month', { ascending: false })
      .limit(12)
      .then(({ data }) => setStatements((data as MonthlyStatement[]) || []));
  }, [tab, vendor?.id]);

  // QR Codes — generate all variants when entering the tab
  useEffect(() => {
    if (tab !== 'qr' || !vendor?.slug) return;
    const base = `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}#/vendors/${vendor.slug}`;
    const types: Record<string, string> = {
      Storefront: base,
      Menu: `${base}?tab=menu`,
      Order: `${base}?tab=order`,
      Reviews: `${base}?tab=reviews`,
    };
    Promise.all(
      Object.entries(types).map(async ([label, url]) => {
        const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', width: 240, margin: 2 });
        return [label, dataUrl] as [string, string];
      }),
    ).then(pairs => setQrCodes(Object.fromEntries(pairs)));
  }, [tab, vendor]);

  // Analytics — load data when tab opens
  useEffect(() => {
    if (tab !== 'analytics' || !vendor?.id) return;
    (async () => {
      const d7 = new Date(Date.now() - 7 * 864e5).toISOString();
      const d30 = new Date(Date.now() - 30 * 864e5).toISOString();
      const [r7, r30] = await Promise.all([
        supabase.from('orders').select('total, created_at, items, status').eq('vendor_id', vendor.id).gte('created_at', d7),
        supabase.from('orders').select('total, created_at, items, status').eq('vendor_id', vendor.id).gte('created_at', d30),
      ]);
      setAnalyticsData({
        orders7: (r7.data as Order[]) || [],
        orders30: (r30.data as Order[]) || [],
      });
    })();
  }, [tab, vendor]);

  // Draw / redraw charts whenever data lands
  useEffect(() => {
    if (!analyticsData || !chartRef.current || !revenueChartRef.current) return;
    const { orders7 } = analyticsData;

    const days: string[] = [];
    const orderCounts: number[] = [];
    const revenue: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = orders7.filter(o => o.created_at?.slice(0, 10) === dayStr);
      orderCounts.push(dayOrders.length);
      revenue.push(Number(dayOrders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)));
    }

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Orders', data: orderCounts, backgroundColor: '#E63946', borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    });

    if (revenueChartInstance.current) revenueChartInstance.current.destroy();
    revenueChartInstance.current = new Chart(revenueChartRef.current, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{ label: 'Revenue ($)', data: revenue, borderColor: '#E63946', backgroundColor: 'rgba(230,57,70,0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#E63946' }],
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });
  }, [analyticsData]);

  if (authLoading) return <div className="vendor-body"><p className="loading-msg" style={{ padding: '2rem' }}>Loading…</p></div>;

  if (!user) {
    return (
      <div className="vendor-body">
        <header><h1>Vendor Dashboard</h1></header>
        <section className="vendor-section">
          <h2>Vendor Login</h2>
          <form onSubmit={async e => {
            e.preventDefault();
            setLoginError('');
            const { error } = await signIn(loginEmail, loginPassword);
            if (error) setLoginError(error.message);
          }}>
            <label>Email <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Password <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required autoComplete="current-password" /></label>
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit" className="btn-primary">Log In</button>
          </form>
        </section>
      </div>
    );
  }

  if (!vendor) return <div className="vendor-body"><p className="loading-msg" style={{ padding: '2rem' }}>Loading vendor…</p></div>;

  const newOrderCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="vendor-body">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1>Vendor Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {pushStatus === 'unsupported' ? null : pushStatus === 'subscribed' ? (
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={unsubscribePush}
              title="Turn off push notifications"
            >
              🔔 Notifications On
            </button>
          ) : pushStatus === 'denied' ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }} title="Enable notifications in browser settings">🔕 Blocked</span>
          ) : pushStatus === 'unsubscribed' ? (
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
              onClick={subscribePush}
              title="Get push alerts for new orders"
            >
              🔔 Enable Alerts
            </button>
          ) : null}
          <button onClick={signOut} className="btn-secondary">Log Out</button>
        </div>
      </header>

      <section className="vendor-section">
        <nav className="vendor-tabs">
          {(['orders', 'menu', 'location', 'specials', 'profile', 'reviews', 'qr', 'analytics', 'billing', 'inbox'] as Tab[]).map(t => {
            const pendingReviews = reviews.filter(r => !r.approved).length;
            let label = t.charAt(0).toUpperCase() + t.slice(1);
            if (t === 'orders' && newOrderCount > 0) label = `Orders (${newOrderCount})`;
            if (t === 'reviews' && pendingReviews > 0) label = `Reviews (${pendingReviews})`;
            return (
              <button key={t} onClick={() => setTab(t)} className={tab === t ? 'tab-active' : ''}>
                {label}
              </button>
            );
          })}
        </nav>

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="vendor-tab">
            <h2>Incoming Orders</h2>
            {orders.length === 0
              ? <p className="empty-msg">No orders yet.</p>
              : orders.map(o => (
                <OrderCard key={o.id} order={o} onUpdateStatus={handleStatusUpdate} onConfirmPayment={handleConfirmPayment} />
              ))
            }
          </div>
        )}

        {/* MENU */}
        {tab === 'menu' && (
          <div className="vendor-tab">
            <h2>Menu Items</h2>
            {menuItems.map(item => (
              <div key={item.id} className="vendor-menu-item">
                {item.photo_url && <img src={item.photo_url} alt={item.name} className="vendor-menu-thumb" loading="lazy" />}
                <div className="vendor-menu-item-info">
                  <span className="vendor-menu-item-name">{item.name} — ${Number(item.price).toFixed(2)} <em className="vendor-menu-item-cat">({item.category})</em></span>
                </div>
                <div className="vendor-menu-item-actions">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={item.available} onChange={async e => {
                      await supabase.from('menu_items').update({ available: e.target.checked }).eq('id', item.id);
                      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, available: e.target.checked } : i));
                    }} /> Available
                  </label>
                  <label className="btn-link">
                    {item.photo_url ? 'Change Photo' : '+ Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file, 600, 600);
                      const path = `${vendor.id}/menu/${item.id}.webp`;
                      const { error } = await supabase.storage.from('vendor-assets').upload(path, compressed, { contentType: 'image/webp', upsert: true });
                      if (error) { alert('Upload failed. Check that the vendor-assets bucket exists.'); return; }
                      const { data } = supabase.storage.from('vendor-assets').getPublicUrl(path);
                      const url = `${data.publicUrl}?t=${Date.now()}`;
                      await supabase.from('menu_items').update({ photo_url: url }).eq('id', item.id);
                      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, photo_url: url } : i));
                      showToast('Photo updated!', 'success');
                      e.target.value = '';
                    }} />
                  </label>
                  <button className="btn-link btn-link--danger" onClick={async () => {
                    if (!confirm('Delete?')) return;
                    await supabase.from('menu_items').delete().eq('id', item.id);
                    setMenuItems(prev => prev.filter(i => i.id !== item.id));
                  }}>Delete</button>
                </div>
              </div>
            ))}
            <h3>Add Item</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { data } = await supabase.from('menu_items').insert({
                vendor_id: vendor.id,
                name: fd.get('name') as string,
                description: fd.get('description') as string,
                price: parseFloat(fd.get('price') as string),
                category: fd.get('category') as string,
                available: true,
              }).select().single();
              if (data) {
                setMenuItems(prev => [...prev, data as MenuItem]);
                supabase.functions.invoke('embed', { body: { table: 'menu_items', id: (data as MenuItem).id } }).catch(() => {});
              }
              e.currentTarget.reset();
            }}>
              <label>Name <input name="name" required /></label>
              <label>Description <input name="description" /></label>
              <label>Price <input name="price" type="number" step="0.01" min="0" required /></label>
              <label>Category
                <select name="category">
                  {['burger', 'plate', 'side', 'drink'].map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <button type="submit" className="btn-primary">Add Item</button>
            </form>
          </div>
        )}

        {/* LOCATION */}
        {tab === 'location' && (
          <div className="vendor-tab">
            <h2>Truck Location</h2>

            {/* One-tap open/close — the thing vendors do most */}
            <button
              className={`open-toggle open-toggle--${location.status === 'open' ? 'open' : 'closed'}`}
              onClick={async () => {
                const next = location.status === 'open' ? 'closed' : 'open';
                const stamp = new Date().toISOString();
                if (locationId) {
                  await supabase.from('locations').update({ status: next, updated_at: stamp }).eq('id', locationId);
                }
                setLocation(prev => ({ ...prev, status: next, updated_at: stamp }));
                showToast(next === 'open' ? "You're OPEN 🟢" : "You're CLOSED 🔴", 'success');
              }}
            >
              {location.status === 'open' ? '🟢 OPEN — tap to close' : '🔴 CLOSED — tap to open'}
            </button>

            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const asNew = fd.get('as_new') === 'on';
              const loc = {
                vendor_id: vendor.id,
                name: fd.get('name') as string,
                address: fd.get('address') as string,
                hours: fd.get('hours') as string,
                status: fd.get('status') as 'open' | 'closed',
                updated_at: new Date().toISOString(),
              };
              if (locationId && !asNew) {
                await supabase.from('locations').update(loc).eq('id', locationId);
              } else {
                const { data } = await supabase.from('locations').insert(loc).select('id').single();
                if (data) setLocationId(data.id);
              }
              setLocation(loc);
              showToast(asNew ? 'Moved to new location!' : 'Location saved!', 'success');
            }}>
              <label>Location Name <input name="name" required defaultValue={location.name ?? ''} /></label>
              <label>Address <input name="address" defaultValue={location.address ?? ''} /></label>
              <label>Hours <input name="hours" placeholder="11am – 7pm" defaultValue={location.hours ?? ''} /></label>
              <label>Status
                <select name="status" defaultValue={location.status ?? 'open'}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="as_new" /> Save as a new location (keeps your old spot in history — use when you move)
              </label>
              <button type="submit" className="btn-primary">Save Location</button>
            </form>
          </div>
        )}

        {/* SPECIALS */}
        {tab === 'specials' && (
          <div className="vendor-tab">
            <h2>Specials</h2>
            {specials.map(s => (
              <div key={s.id} className="vendor-special">
                <strong>{s.title}</strong> — {s.active ? 'Active' : 'Inactive'}
                <button onClick={async () => {
                  await supabase.from('specials').update({ active: !s.active }).eq('id', s.id);
                  setSpecials(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x));
                }}>{s.active ? 'Deactivate' : 'Activate'}</button>
                <button onClick={async () => {
                  if (!confirm('Delete?')) return;
                  await supabase.from('specials').delete().eq('id', s.id);
                  setSpecials(prev => prev.filter(x => x.id !== s.id));
                }}>Delete</button>
              </div>
            ))}
            <h3>Add Special</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { data } = await supabase.from('specials').insert({
                vendor_id: vendor.id,
                title: fd.get('title') as string,
                description: fd.get('description') as string,
                expires_at: fd.get('expires') || null,
                active: true,
              }).select().single();
              if (data) setSpecials(prev => [data as Special, ...prev]);
              e.currentTarget.reset();
            }}>
              <label>Title <input name="title" required /></label>
              <label>Description <textarea name="description"></textarea></label>
              <label>Expires <input name="expires" type="date" /></label>
              <button type="submit" className="btn-primary">Add Special</button>
            </form>
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div className="vendor-tab">
            <h2>Customer Reviews</h2>
            {reviews.length === 0
              ? <p className="empty-msg">No reviews yet.</p>
              : reviews.map(r => (
                <div key={r.id} className={`review-card${r.approved ? '' : ' review-card--pending'}`}>
                  <div className="review-card-header">
                    <div className="review-stars" aria-label={`${r.rating} stars`}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <strong>{r.customer_name}</strong>
                    {!r.approved && <span className="order-badge order-badge--pending">Pending</span>}
                    <span className="review-date" style={{ marginLeft: 'auto' }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {r.photo_url && <img src={r.photo_url} alt="Review photo" className="review-photo" loading="lazy" style={{ maxWidth: 200, borderRadius: 8, marginTop: '0.5rem' }} />}
                  <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>{r.body}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>👍 {r.helpful_count ?? 0} found helpful</p>

                  {/* Approval */}
                  {!r.approved && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} onClick={async () => {
                        await supabase.from('reviews').update({ approved: true }).eq('id', r.id);
                        setReviews(prev => prev.map(x => x.id === r.id ? { ...x, approved: true } : x));
                      }}>Approve</button>
                      <button className="btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} onClick={async () => {
                        if (!confirm('Delete this review?')) return;
                        await supabase.from('reviews').delete().eq('id', r.id);
                        setReviews(prev => prev.filter(x => x.id !== r.id));
                      }}>Delete</button>
                    </div>
                  )}

                  {/* Vendor reply */}
                  {r.vendor_reply
                    ? <div className="vendor-reply" style={{ marginTop: '0.5rem' }}>
                        <strong>Your reply:</strong> {r.vendor_reply}
                        <button className="btn-link btn-link--danger" onClick={async () => {
                          await supabase.from('reviews').update({ vendor_reply: null, vendor_replied_at: null }).eq('id', r.id);
                          setReviews(prev => prev.map(x => x.id === r.id ? { ...x, vendor_reply: null } : x));
                        }} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>Remove reply</button>
                      </div>
                    : r.approved && (
                      <form style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                        onSubmit={async e => {
                          e.preventDefault();
                          const replyEl = (e.currentTarget.elements.namedItem('reply') as HTMLTextAreaElement);
                          const reply = replyEl.value.trim();
                          if (!reply) return;
                          await supabase.from('reviews').update({ vendor_reply: reply, vendor_replied_at: new Date().toISOString() }).eq('id', r.id);
                          setReviews(prev => prev.map(x => x.id === r.id ? { ...x, vendor_reply: reply } : x));
                          replyEl.value = '';
                        }}>
                        <textarea name="reply" rows={2} placeholder="Reply to this review…" style={{ flex: 1, minWidth: '180px', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.88rem' }} />
                        <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>Reply</button>
                      </form>
                    )
                  }
                </div>
              ))
            }
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div className="vendor-tab">
            <h2>Vendor Profile</h2>
            <div className="profile-images">
              <ImageUpload
                bucket="vendor-assets"
                path={`${vendor.id}/logo`}
                label="Logo (square, shown on cards)"
                currentUrl={vendor.logo_url}
                maxWidth={400}
                maxHeight={400}
                onUpload={async url => {
                  await supabase.from('vendors').update({ logo_url: url }).eq('id', vendor.id);
                  setVendor(prev => prev ? { ...prev, logo_url: url } : prev);
                  showToast('Logo updated!', 'success');
                }}
              />
              <ImageUpload
                bucket="vendor-assets"
                path={`${vendor.id}/banner`}
                label="Banner (shown on your storefront)"
                currentUrl={vendor.photo_url}
                maxWidth={1200}
                maxHeight={400}
                onUpload={async url => {
                  await supabase.from('vendors').update({ photo_url: url }).eq('id', vendor.id);
                  setVendor(prev => prev ? { ...prev, photo_url: url } : prev);
                  showToast('Banner updated!', 'success');
                }}
              />
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const updates = {
                description: (fd.get('description') as string).trim() || null,
                cuisine_type: (fd.get('cuisine') as string).trim() || null,
              };
              await supabase.from('vendors').update(updates).eq('id', vendor.id);
              setVendor(prev => prev ? { ...prev, ...updates } : prev);
              showToast('Profile saved!', 'success');
              // Re-generate embedding so search stays fresh (best-effort)
              supabase.functions.invoke('embed', { body: { table: 'vendors', id: vendor.id } }).catch(() => {});
            }}>
              <label>Description
                <textarea name="description" rows={3} defaultValue={vendor.description || ''} placeholder="Tell customers what makes your truck special…" />
              </label>
              <label>Cuisine Type
                <input name="cuisine" defaultValue={vendor.cuisine_type || ''} placeholder="e.g. Hawaiian Plate, Burger, Tacos…" />
              </label>
              <button type="submit" className="btn-primary">Save Profile</button>
            </form>

            <h2 style={{ marginTop: '1.5rem' }}>Payment Methods</h2>
            <p className="payment-settings-hint">
              Customers pay you directly — money goes straight to your own account, never through
              Local Grindz. Add the handles you already use to run your business.
            </p>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const updates = {
                paypal_handle: (fd.get('paypal') as string).trim() || null,
                venmo_handle: (fd.get('venmo') as string).trim() || null,
                cashapp_handle: (fd.get('cashapp') as string).trim() || null,
                preferred_payment: (fd.get('preferred') as string) || null,
              };
              await supabase.from('vendors').update(updates).eq('id', vendor.id);
              setVendor(prev => prev ? { ...prev, ...updates } : prev);
              showToast('Payment methods saved!', 'success');
            }}>
              <label>PayPal.Me username <input name="paypal" defaultValue={vendor.paypal_handle || ''} placeholder="e.g. AlasKitchen" /></label>
              <label>Venmo username <input name="venmo" defaultValue={vendor.venmo_handle || ''} placeholder="e.g. Alas-Kitchen" /></label>
              <label>Cash App $cashtag <input name="cashapp" defaultValue={vendor.cashapp_handle || ''} placeholder="e.g. AlasKitchen" /></label>
              <label>Preferred method
                <select name="preferred" defaultValue={vendor.preferred_payment || ''}>
                  <option value="">No preference</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="cashapp">Cash App</option>
                </select>
              </label>
              <button type="submit" className="btn-primary">Save Payment Methods</button>
            </form>
          </div>
        )}

        {/* BILLING */}
        {tab === 'billing' && (
          <div className="vendor-tab">
            <h2>Monthly Statement</h2>
            <p className="billing-hint">
              Local Grindz charges <strong>5% only on confirmed online prepayments above $500 per
              month</strong>. Cash orders and your first $500 of prepaid volume each month are always
              free. Nothing is charged automatically — this becomes your end-of-month statement.
            </p>
            {statements.length === 0
              ? <p className="empty-msg">No prepaid orders yet — statements appear once customers start paying online.</p>
              : (
                <table className="billing-table">
                  <thead>
                    <tr><th>Month</th><th>Prepaid Orders</th><th>Confirmed Volume</th><th>Fee Due (EOM)</th></tr>
                  </thead>
                  <tbody>
                    {statements.map(s => (
                      <tr key={s.statement_month}>
                        <td>{new Date(s.statement_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                        <td>{s.prepaid_orders}</td>
                        <td>${Number(s.confirmed_prepaid_volume).toFixed(2)}</td>
                        <td>{Number(s.platform_fee_due) > 0 ? `$${Number(s.platform_fee_due).toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}

        {/* QR CODE */}
        {tab === 'qr' && (
          <div className="vendor-tab">
            <h2>QR Code Kit</h2>
            <p className="qr-hint">Print these and post them at your truck — each code takes customers to a different action.</p>
            {Object.keys(qrCodes).length === 0
              ? <p className="loading-msg">Generating…</p>
              : (
                <>
                  <div className="qr-grid">
                    {Object.entries(qrCodes).map(([label, dataUrl]) => (
                      <div key={label} className="qr-card">
                        <img src={dataUrl} alt={`${label} QR code`} width={180} height={180} />
                        <p className="qr-card-label">{label}</p>
                        <a href={dataUrl} download={`${vendor.slug}-qr-${label.toLowerCase()}.png`} className="btn-link">
                          ⬇ PNG
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="qr-url" style={{ marginTop: '1rem' }}>
                    Base URL: {window.location.origin}/#/vendors/{vendor.slug}
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => window.print()}
                    style={{ marginTop: '0.5rem' }}
                  >
                    🖨 Print All QR Codes
                  </button>
                </>
              )
            }
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="vendor-tab">
            <h2>Analytics</h2>
            {!analyticsData
              ? <p className="loading-msg">Loading data…</p>
              : (() => {
                  const { orders7, orders30 } = analyticsData;
                  const rev7 = orders7.reduce((s, o) => s + Number(o.total), 0);
                  const rev30 = orders30.reduce((s, o) => s + Number(o.total), 0);
                  const avg30 = orders30.length ? rev30 / orders30.length : 0;

                  const itemCounts: Record<string, number> = {};
                  orders30.forEach(o => o.items?.forEach((item: { name: string; qty: number }) => {
                    itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
                  }));
                  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                  const hourCounts: number[] = Array(24).fill(0);
                  orders30.forEach(o => {
                    const h = new Date(o.created_at).getHours();
                    hourCounts[h]++;
                  });
                  const maxHour = Math.max(...hourCounts, 1);

                  return (
                    <>
                      <div className="analytics-stats">
                        <div className="stat-box"><p className="stat-value">{orders7.length}</p><p className="stat-label">Orders (7 days)</p></div>
                        <div className="stat-box"><p className="stat-value">${rev7.toFixed(2)}</p><p className="stat-label">Revenue (7 days)</p></div>
                        <div className="stat-box"><p className="stat-value">{orders30.length}</p><p className="stat-label">Orders (30 days)</p></div>
                        <div className="stat-box"><p className="stat-value">${rev30.toFixed(2)}</p><p className="stat-label">Revenue (30 days)</p></div>
                        <div className="stat-box"><p className="stat-value">${avg30.toFixed(2)}</p><p className="stat-label">Avg Ticket (30 days)</p></div>
                      </div>

                      <h3>Orders per Day (7 days)</h3>
                      <div className="analytics-chart-wrap"><canvas ref={chartRef} height={180} /></div>

                      <h3>Revenue per Day (7 days)</h3>
                      <div className="analytics-chart-wrap"><canvas ref={revenueChartRef} height={180} /></div>

                      <h3>Orders by Hour (30 days)</h3>
                      <div className="hour-heatmap" aria-label="Orders by hour of day">
                        {hourCounts.map((count, h) => (
                          <div
                            key={h}
                            className="hour-cell"
                            title={`${h}:00 — ${count} orders`}
                            style={{ opacity: count ? 0.2 + 0.8 * (count / maxHour) : 0.07 }}
                          >
                            <span className="hour-label">{h % 3 === 0 ? `${h}h` : ''}</span>
                          </div>
                        ))}
                      </div>

                      <h3>Top Items (30 days)</h3>
                      {topItems.length === 0
                        ? <p className="empty-msg">No orders yet.</p>
                        : topItems.map(([name, qty]) => (
                          <div key={name} className="top-item">
                            <span className="top-item-name">{name}</span>
                            <div className="top-item-bar-wrap">
                              <div className="top-item-bar" style={{ width: `${(qty / topItems[0][1]) * 100}%` }} />
                            </div>
                            <span className="top-item-qty">{qty}</span>
                          </div>
                        ))
                      }
                    </>
                  );
                })()
            }
          </div>
        )}
        {/* INBOX */}
        {tab === 'inbox' && (
          <div className="vendor-tab">
            <h2>Customer Messages</h2>
            <VendorInbox vendorId={vendor.id} />
          </div>
        )}
      </section>
    </div>
  );
}
