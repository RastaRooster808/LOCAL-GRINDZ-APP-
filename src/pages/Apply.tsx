import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CUISINES = ['Burger', 'Plate Lunch', 'Seafood', 'Vegan', 'Coffee', 'Dessert', 'BBQ', 'Tacos', 'Pizza', 'Fusion', 'Other'];
const NEIGHBORHOODS = ['Hilo', 'Kona', 'Puna', 'Hamakua', 'Ka\'u', 'Kohala', 'Waimea', 'Other'];

export function Apply() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('vendor_applications').insert({
      business_name: fd.get('business_name') as string,
      cuisine_type: fd.get('cuisine_type') as string,
      neighborhood: fd.get('neighborhood') as string,
      contact_email: fd.get('contact_email') as string,
      contact_phone: fd.get('contact_phone') as string || null,
      instagram: fd.get('instagram') as string || null,
      description: fd.get('description') as string || null,
    });
    setSubmitting(false);
    if (error) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <header className="site-header"><Link to="/" className="back-link">← Home</Link><h1>Local Grindz</h1></header>
        <main className="apply-main">
          <section className="success-box">
            <div className="success-icon">🎉</div>
            <h2>Application Submitted!</h2>
            <p>We'll review your application and reach out to <strong>{email}</strong> within a few days.</p>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header"><Link to="/" className="back-link">← Home</Link><h1>Local Grindz</h1></header>
      <main className="apply-main">
        <div className="apply-intro">
          <h2>Join as a Vendor</h2>
          <p>Get your food truck or pop-up listed on Local Grindz — free to apply.</p>
          <ul className="apply-benefits">
            <li>Your own storefront page with live location and menu</li>
            <li>Online ordering and loyalty points for customers</li>
            <li>Analytics dashboard and QR code generator</li>
            <li>Featured listing opportunities</li>
          </ul>
        </div>

        <section>
          <form onSubmit={handleSubmit}>
            <label>Business Name <input name="business_name" required /></label>
            <label>Cuisine Type
              <select name="cuisine_type" required>
                <option value="">Select…</option>
                {CUISINES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Neighborhood
              <select name="neighborhood">
                <option value="">Select…</option>
                {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label>Contact Email
              <input name="contact_email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>Phone (optional) <input name="contact_phone" type="tel" /></label>
            <label>Instagram Handle (optional) <input name="instagram" placeholder="@yourtruck" /></label>
            <label>
              Tell us about your truck
              <textarea name="description" rows={4} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What do you serve? What makes you unique?" />
              <span className="char-count">{desc.length}/500</span>
            </label>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
