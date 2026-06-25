import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { VendorApplication, Vendor, VendorFeature } from '../lib/types';

type AdminTab = 'applications' | 'vendors' | 'featured';

export function AdminDashboard() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>('applications');
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [featured, setFeatured] = useState<Array<{ id: string; tier: string; feature_expires_at: string; vendors: { name: string } | null }>>([]);
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
  }, [isAdmin]);

  async function loadApplications(status = 'pending') {
    const { data } = await supabase.from('vendor_applications').select('*').eq('status', status).order('created_at');
    setApplications((data as VendorApplication[]) || []);
  }

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('id, name, slug, cuisine_type, is_active, email').order('name');
    setVendors((data as Vendor[]) || []);
  }

  async function loadFeatured() {
    const { data } = await supabase.from('vendor_features').select('id, tier, feature_expires_at, vendors(name)').order('feature_expires_at', { ascending: false });
    setFeatured((data as unknown as Array<{ id: string; tier: string; feature_expires_at: string; vendors: { name: string } | null }>) || []);
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

  return (
    <div className="vendor-body">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={signOut} className="btn-secondary">Log Out</button>
      </header>

      <section className="vendor-section">
        <nav className="vendor-tabs">
          <button onClick={() => setTab('applications')}>
            Applications {pendingCount > 0 && <span className="badge badge-pending">{pendingCount}</span>}
          </button>
          <button onClick={() => setTab('vendors')}>Vendors</button>
          <button onClick={() => setTab('featured')}>Featured</button>
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
            <h3>Add Featured</h3>
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
