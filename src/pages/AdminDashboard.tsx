import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { VendorApplication, Vendor, Review } from '../lib/types';

type AdminTab = 'applications' | 'vendors' | 'featured' | 'reviews' | 'analytics' | 'announcements';

interface FeaturedRow {
  id: string;
  tier: string;
  feature_expires_at: string;
  vendors: { name: string } | null;
}

interface Announcement {
  id: string;
  body: string;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface PlatformStats {
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  gmv: number;
  orders7: number;
  revenue7: number;
  pendingApplications: number;
  reportedReviews: number;
}

export function AdminDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>('applications');
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [featured, setFeatured] = useState<FeaturedRow[]>([]);
  const [reportedReviews, setReportedReviews] = useState<Review[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.from('admins').select('id').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadApplications();
    loadVendors();
    loadFeatured();
    loadReportedReviews();
    loadAnnouncements();
    loadPlatformStats();
  }, [isAdmin]);

  async function loadApplications(status = 'pending') {
    const { data } = await supabase.from('vendor_applications').select('*').eq('status', status).order('created_at');
    setApplications((data as VendorApplication[]) || []);
  }

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('id, name, slug, cuisine_type, is_active, email, badges').order('name');
    setVendors((data as Vendor[]) || []);
  }

  async function loadFeatured() {
    const { data } = await supabase.from('vendor_features').select('id, tier, feature_expires_at, vendors(name)').order('feature_expires_at', { ascending: false });
    setFeatured((data as unknown as FeaturedRow[]) || []);
  }

  async function loadReportedReviews() {
    const { data } = await supabase.from('reviews').select('*').eq('reported', true).order('created_at', { ascending: false });
    setReportedReviews((data as Review[]) || []);
  }

  async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
  }

  async function loadPlatformStats() {
    const d7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const [vendorR, orderAllR, order7R, appR, reportR] = await Promise.all([
      supabase.from('vendors').select('id, is_active'),
      supabase.from('orders').select('total, status'),
      supabase.from('orders').select('total').gte('created_at', d7),
      supabase.from('vendor_applications').select('id').eq('status', 'pending'),
      supabase.from('reviews').select('id').eq('reported', true),
    ]);

    const vendorData = vendorR.data || [];
    const orderAll = (orderAllR.data || []) as { total: number; status: string }[];
    const order7 = (order7R.data || []) as { total: number }[];

    setStats({
      totalVendors: vendorData.length,
      activeVendors: vendorData.filter((v: { is_active: boolean }) => v.is_active).length,
      totalOrders: orderAll.length,
      gmv: orderAll.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total), 0),
      orders7: order7.length,
      revenue7: order7.reduce((s, o) => s + Number(o.total), 0),
      pendingApplications: (appR.data || []).length,
      reportedReviews: (reportR.data || []).length,
    });
  }

  async function approve(app: VendorApplication) {
    if (!confirm(`Approve "${app.business_name}"? This will create their vendor account.`)) return;
    const slug = app.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data: existing } = await supabase.from('vendors').select('id').eq('slug', slug).single();
    await supabase.from('vendors').insert({
      email: app.contact_email,
      name: app.business_name,
      slug: existing ? `${slug}-2` : slug,
      cuisine_type: app.cuisine_type,
      neighborhood: app.neighborhood,
      is_active: true,
    });
    await supabase.from('vendor_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', app.id);
    setApplications(prev => prev.filter(a => a.id !== app.id));
    alert(`Approved! Invite ${app.contact_email} via Supabase Auth → Authentication → Invite User.`);
  }

  async function reject(id: string) {
    await supabase.from('vendor_applications').update({ status: 'rejected', admin_note: rejectReason || null, reviewed_at: new Date().toISOString() }).eq('id', id);
    setApplications(prev => prev.filter(a => a.id !== id));
    setRejectId(null);
    setRejectReason('');
  }

  if (authLoading) return <div className="vendor-body"><p className="loading-msg" style={{ padding: '2rem' }}>Loading…</p></div>;

  if (!user) {
    return (
      <div className="vendor-body">
        <header><h1>Admin</h1></header>
        <section className="vendor-section">
          <h2>Admin Login</h2>
          <form onSubmit={async e => {
            e.preventDefault();
            setLoginError('');
            const { error } = await signIn(loginEmail, loginPassword);
            if (error) setLoginError(error.message);
          }}>
            <label>Email <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></label>
            <label>Password <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required /></label>
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit" className="btn-primary">Log In</button>
          </form>
        </section>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="vendor-body">
        <header><h1>Admin</h1></header>
        <section className="vendor-section">
          <p className="error-msg">Access denied — not an admin account.</p>
          <button onClick={signOut} className="btn-secondary">Log Out</button>
        </section>
      </div>
    );
  }

  if (isAdmin === null) return <div className="vendor-body"><p className="loading-msg" style={{ padding: '2rem' }}>Checking access…</p></div>;

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  const TABS: { key: AdminTab; label: string; badge?: number }[] = [
    { key: 'applications', label: 'Applications', badge: pendingCount || undefined },
    { key: 'vendors', label: 'Vendors' },
    { key: 'featured', label: 'Featured' },
    { key: 'reviews', label: 'Reports', badge: reportedReviews.length || undefined },
    { key: 'analytics', label: 'Analytics' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <div className="vendor-body">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={signOut} className="btn-secondary">Log Out</button>
      </header>

      <section className="vendor-section">
        <nav className="vendor-tabs">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={tab === t.key ? 'tab-active' : ''}>
              {t.label}{t.badge ? ` (${t.badge})` : ''}
            </button>
          ))}
        </nav>

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div>
            <div className="tab-filters">
              {(['pending', 'approved', 'rejected'] as const).map(s => (
                <button key={s} className="filter-chip" onClick={() => loadApplications(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {applications.length === 0
              ? <p className="empty-msg">No applications.</p>
              : applications.map(app => (
                  <div key={app.id} className="admin-card">
                    <div className="admin-card-header">
                      <strong>{app.business_name}</strong>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </div>
                    <p>{app.cuisine_type} · {app.neighborhood}</p>
                    <p><a href={`mailto:${app.contact_email}`}>{app.contact_email}</a>{app.contact_phone && ` · ${app.contact_phone}`}</p>
                    {app.instagram && <p>@{app.instagram}</p>}
                    {app.description && <p className="admin-desc">{app.description}</p>}
                    <p className="admin-date">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    {app.status === 'pending' && (
                      <div className="admin-actions">
                        <button className="btn-primary" onClick={() => approve(app)}>Approve</button>
                        <button className="btn-secondary" onClick={() => { setRejectId(app.id); setRejectReason(''); }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        )}

        {/* VENDORS */}
        {tab === 'vendors' && (
          <div>
            {vendors.map(v => (
              <div key={v.id} className="admin-card">
                <div className="admin-card-header">
                  <strong>{v.name}</strong>
                  <span className={`badge badge-${v.is_active ? 'approved' : 'rejected'}`}>{v.is_active ? 'Active' : 'Suspended'}</span>
                </div>
                <p>{v.cuisine_type} · <Link to={`/vendors/${v.slug}`}>/vendors/{v.slug}</Link></p>
                <p>{v.email}</p>

                {/* Badge management */}
                <div style={{ margin: '0.5rem 0', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(['verified', 'community-favorite', 'local-farm', 'organic'] as const).map(badge => {
                    const hasBadge = v.badges?.includes(badge);
                    return (
                      <button
                        key={badge}
                        className={hasBadge ? 'btn-primary' : 'btn-secondary'}
                        style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                        onClick={async () => {
                          const current = v.badges || [];
                          const next = hasBadge ? current.filter(b => b !== badge) : [...current, badge];
                          await supabase.from('vendors').update({ badges: next }).eq('id', v.id);
                          setVendors(prev => prev.map(x => x.id === v.id ? { ...x, badges: next } : x));
                        }}
                      >
                        {badge}
                      </button>
                    );
                  })}
                </div>

                <div className="admin-actions">
                  <button className="btn-secondary" onClick={async () => {
                    if (!confirm(`${v.is_active ? 'Suspend' : 'Reactivate'} ${v.name}?`)) return;
                    await supabase.from('vendors').update({ is_active: !v.is_active }).eq('id', v.id);
                    setVendors(prev => prev.map(x => x.id === v.id ? { ...x, is_active: !x.is_active } : x));
                  }}>
                    {v.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FEATURED */}
        {tab === 'featured' && (
          <div>
            {featured.map(f => (
              <div key={f.id} className="admin-card">
                <strong>{f.vendors?.name}</strong> — {f.tier}
                <p>Expires {new Date(f.feature_expires_at).toLocaleDateString()}</p>
                <button className="btn-secondary" onClick={async () => {
                  await supabase.from('vendor_features').delete().eq('id', f.id);
                  loadFeatured();
                }}>Remove</button>
              </div>
            ))}
            <h3>Add Featured Listing</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await supabase.from('vendor_features').insert({
                vendor_id: fd.get('vendor_id') as string,
                tier: fd.get('tier') as string,
                feature_expires_at: fd.get('expires') as string,
              });
              e.currentTarget.reset();
              loadFeatured();
            }}>
              <label>Vendor
                <select name="vendor_id" required>
                  {vendors.filter(v => v.is_active).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </label>
              <label>Tier
                <select name="tier">
                  <option value="boost">Boost (7 days)</option>
                  <option value="featured">Featured (30 days)</option>
                  <option value="spotlight">Spotlight (homepage hero)</option>
                </select>
              </label>
              <label>Expires <input name="expires" type="date" required /></label>
              <button type="submit" className="btn-primary">Add Featured</button>
            </form>
          </div>
        )}

        {/* REPORTED REVIEWS */}
        {tab === 'reviews' && (
          <div>
            <h2>Reported Reviews</h2>
            {reportedReviews.length === 0
              ? <p className="empty-msg">No reported reviews.</p>
              : reportedReviews.map(r => (
                <div key={r.id} className="admin-card">
                  <div className="admin-card-header">
                    <strong>{r.customer_name}</strong>
                    <span className="review-stars">{'★'.repeat(r.rating)}</span>
                  </div>
                  <p className="admin-desc">"{r.body}"</p>
                  <p className="admin-date">{new Date(r.created_at).toLocaleDateString()}</p>
                  <div className="admin-actions">
                    <button className="btn-primary" onClick={async () => {
                      // Approve: clear report flag
                      await supabase.from('reviews').update({ reported: false }).eq('id', r.id);
                      setReportedReviews(prev => prev.filter(x => x.id !== r.id));
                    }}>Dismiss Report</button>
                    <button className="btn-danger" onClick={async () => {
                      if (!confirm('Delete this review?')) return;
                      await supabase.from('reviews').delete().eq('id', r.id);
                      setReportedReviews(prev => prev.filter(x => x.id !== r.id));
                    }}>Delete Review</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* PLATFORM ANALYTICS */}
        {tab === 'analytics' && (
          <div>
            <h2>Platform Overview</h2>
            {!stats
              ? <p className="loading-msg">Loading…</p>
              : (
                <>
                  <div className="analytics-stats">
                    <div className="stat-box"><p className="stat-value">{stats.activeVendors}</p><p className="stat-label">Active Vendors</p></div>
                    <div className="stat-box"><p className="stat-value">{stats.totalVendors}</p><p className="stat-label">Total Vendors</p></div>
                    <div className="stat-box"><p className="stat-value">{stats.totalOrders}</p><p className="stat-label">Total Orders</p></div>
                    <div className="stat-box"><p className="stat-value">${stats.gmv.toFixed(0)}</p><p className="stat-label">Gross GMV</p></div>
                    <div className="stat-box"><p className="stat-value">{stats.orders7}</p><p className="stat-label">Orders (7 days)</p></div>
                    <div className="stat-box"><p className="stat-value">${stats.revenue7.toFixed(2)}</p><p className="stat-label">Revenue (7 days)</p></div>
                    <div className="stat-box"><p className="stat-value">{stats.pendingApplications}</p><p className="stat-label">Pending Apps</p></div>
                    <div className="stat-box"><p className="stat-value">{stats.reportedReviews}</p><p className="stat-label">Reported Reviews</p></div>
                  </div>
                  <button className="btn-secondary" onClick={loadPlatformStats} style={{ marginTop: '0.5rem' }}>
                    Refresh
                  </button>
                </>
              )
            }
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === 'announcements' && (
          <div>
            <h2>Homepage Announcements</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Active, non-expired announcements appear as a banner on the homepage.
            </p>
            {announcements.map(a => (
              <div key={a.id} className="admin-card">
                <div className="admin-card-header">
                  <span className={`badge badge-${a.active ? 'approved' : 'rejected'}`}>{a.active ? 'Active' : 'Inactive'}</span>
                  <span className="admin-date">{new Date(a.created_at).toLocaleDateString()}</span>
                  {a.expires_at && <span className="admin-date">Expires {new Date(a.expires_at).toLocaleDateString()}</span>}
                </div>
                <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>{a.body}</p>
                <div className="admin-actions">
                  <button className="btn-secondary" onClick={async () => {
                    await supabase.from('announcements').update({ active: !a.active }).eq('id', a.id);
                    setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, active: !x.active } : x));
                  }}>{a.active ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn-danger" onClick={async () => {
                    if (!confirm('Delete announcement?')) return;
                    await supabase.from('announcements').delete().eq('id', a.id);
                    setAnnouncements(prev => prev.filter(x => x.id !== a.id));
                  }}>Delete</button>
                </div>
              </div>
            ))}

            <h3>New Announcement</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const { data } = await supabase.from('announcements').insert({
                body: fd.get('body') as string,
                active: true,
                expires_at: (fd.get('expires') as string) || null,
              }).select().single();
              if (data) setAnnouncements(prev => [data as Announcement, ...prev]);
              e.currentTarget.reset();
            }}>
              <label>Announcement text
                <textarea name="body" required rows={3} placeholder="E.g. 🎉 New vendors joining this weekend at the Pahoa Farmers Market!" />
              </label>
              <label>Expires <input name="expires" type="date" /></label>
              <button type="submit" className="btn-primary">Post Announcement</button>
            </form>
          </div>
        )}
      </section>

      {/* Reject modal */}
      {rejectId && (
        <div className="modal">
          <div className="modal-box">
            <h3>Reject Application</h3>
            <label>Reason (optional) <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></label>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => reject(rejectId)}>Confirm Reject</button>
              <button className="btn-secondary" onClick={() => setRejectId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
