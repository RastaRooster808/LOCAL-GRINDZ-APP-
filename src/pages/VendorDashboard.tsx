import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useVendorOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/vendor/OrderCard';
import { showToast } from '../components/ui/Toast';
import { ImageUpload, compressImage } from '../components/ui/ImageUpload';
import { MenuItem, Location, Special, Order, OrderStatus, Vendor } from '../lib/types';
import QRCode from 'qrcode';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

type Tab = 'orders' | 'menu' | 'location' | 'specials' | 'profile' | 'qr' | 'analytics';

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
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { orders, updateStatus } = useVendorOrders(vendor?.id ?? null);

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

  async function handleStatusUpdate(id: string, status: OrderStatus, extra?: { estimated_minutes?: number; cancellation_reason?: string }) {
    await updateStatus(id, status, extra);
    showToast(`Order marked ${status}`);
  }

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

  // Analytics
  useEffect(() => {
    if (tab !== 'analytics' || !vendor?.id || !chartRef.current) return;
    loadAnalytics(vendor.id);
  }, [tab, vendor]);

  async function loadAnalytics(vid: string) {
    const d7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const d30 = new Date(Date.now() - 30 * 864e5).toISOString();
    const [r7, r30] = await Promise.all([
      supabase.from('orders').select('total, created_at, items').eq('vendor_id', vid).gte('created_at', d7),
      supabase.from('orders').select('total, created_at, items').eq('vendor_id', vid).gte('created_at', d30),
    ]);
    const orders7 = (r7.data as Order[]) || [];
    const orders30 = (r30.data as Order[]) || [];

    const stats = document.getElementById('analytics-stats-container');
    if (stats) {
      const rev7 = orders7.reduce((s, o) => s + Number(o.total), 0);
      stats.innerHTML = `
        <div class="stat-box"><p class="stat-value">${orders7.length}</p><p class="stat-label">Orders (7 days)</p></div>
        <div class="stat-box"><p class="stat-value">$${rev7.toFixed(2)}</p><p class="stat-label">Revenue (7 days)</p></div>
        <div class="stat-box"><p class="stat-value">${orders30.length}</p><p class="stat-label">Orders (30 days)</p></div>
      `;
    }

    if (!chartRef.current) return;
    const days: string[] = [];
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      const dayStr = d.toISOString().slice(0, 10);
      counts.push(orders7.filter(o => o.created_at?.slice(0, 10) === dayStr).length);
    }
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels: days, datasets: [{ label: 'Orders', data: counts, backgroundColor: '#E63946', borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    });

    const itemCounts: Record<string, number> = {};
    orders30.forEach(o => o.items?.forEach((item: { name: string; qty: number }) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
    }));
    const topEl = document.getElementById('top-items-container');
    if (topEl) {
      const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      topEl.innerHTML = sorted.length
        ? sorted.map(([n, q]) => `<div class="top-item"><span class="top-item-name">${n}</span><span class="top-item-qty">${q} ordered</span></div>`).join('')
        : '<p class="empty-msg">No orders yet.</p>';
    }
  }

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>Vendor Dashboard</h1>
        <button onClick={signOut} className="btn-secondary">Log Out</button>
      </header>

      <section className="vendor-section">
        <nav className="vendor-tabs">
          {(['orders', 'menu', 'location', 'specials', 'profile', 'qr', 'analytics'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? 'tab-active' : ''}>
              {t === 'orders' ? `Orders${newOrderCount > 0 ? ` (${newOrderCount})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        {/* ORDERS */}
        {tab === 'orders' && (
          <div className="vendor-tab">
            <h2>Incoming Orders</h2>
            {orders.length === 0
              ? <p className="empty-msg">No orders yet.</p>
              : orders.map(o => (
                <OrderCard key={o.id} order={o} onUpdateStatus={handleStatusUpdate} />
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
              if (data) setMenuItems(prev => [...prev, data as MenuItem]);
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
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const loc = {
                vendor_id: vendor.id,
                name: fd.get('name') as string,
                address: fd.get('address') as string,
                hours: fd.get('hours') as string,
                status: fd.get('status') as 'open' | 'closed',
                updated_at: new Date().toISOString(),
              };
              if (locationId) {
                await supabase.from('locations').update(loc).eq('id', locationId);
              } else {
                const { data } = await supabase.from('locations').insert(loc).select('id').single();
                if (data) setLocationId(data.id);
              }
              setLocation(loc);
              showToast('Location saved!', 'success');
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
            }}>
              <label>Description
                <textarea name="description" rows={3} defaultValue={vendor.description || ''} placeholder="Tell customers what makes your truck special…" />
              </label>
              <label>Cuisine Type
                <input name="cuisine" defaultValue={vendor.cuisine_type || ''} placeholder="e.g. Hawaiian Plate, Burger, Tacos…" />
              </label>
              <button type="submit" className="btn-primary">Save Profile</button>
            </form>
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
            <div className="analytics-stats" id="analytics-stats-container"></div>
            <div className="analytics-chart-wrap">
              <canvas ref={chartRef} height={200}></canvas>
            </div>
            <h3>Top Items (30 days)</h3>
            <div id="top-items-container"></div>
          </div>
        )}
      </section>
    </div>
  );
}
