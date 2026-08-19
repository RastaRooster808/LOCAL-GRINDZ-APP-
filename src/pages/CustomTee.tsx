import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import {
  GARMENT_OPTIONS,
  FULFILLMENT_OPTIONS,
  EXTRA_PRINT_LOCATION_FEE,
  calculateCustomTeeOrder,
  type ShirtType,
  type PrintLocation,
  type Fulfillment,
} from '../lib/customTeeOrder';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

export function CustomTee() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [shirtType, setShirtType] = useState<ShirtType>('standard_tee');
  const [shirtSize, setShirtSize] = useState('M');
  const [shirtColor, setShirtColor] = useState('');
  const [printLocations, setPrintLocations] = useState<PrintLocation[]>(['front']);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pahoa_pickup');
  const [quantity, setQuantity] = useState(1);
  const [designNotes, setDesignNotes] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [email, setEmail] = useState('');

  const quote = useMemo(
    () => calculateCustomTeeOrder({ shirtType, printLocations, fulfillment, quantity }),
    [shirtType, printLocations, fulfillment, quantity],
  );

  function togglePrintLocation(loc: PrintLocation) {
    setPrintLocations(prev => {
      if (prev.includes(loc)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(l => l !== loc);
      }
      return [...prev, loc];
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    const { error } = await supabase.from('custom_tee_orders').insert({
      shirt_type: shirtType,
      shirt_color: shirtColor || null,
      shirt_size: shirtSize,
      print_locations: printLocations,
      design_notes: designNotes || null,
      reference_image_url: referenceUrl || null,
      fulfillment,
      quantity,
      price_per_item: quote.pricePerItem,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      total: quote.total,
      customer_name: fd.get('customer_name') as string,
      customer_email: fd.get('customer_email') as string,
      customer_phone: (fd.get('customer_phone') as string) || null,
      shipping_address: fulfillment === 'hawaii_ship' ? shippingAddress || null : null,
    });

    setSubmitting(false);
    if (error) { setError('Something went wrong. Please try again.'); return; }
    trackEvent('cta_click', { label: 'Custom Tee Order Submitted', destination: '/custom-tee', section: 'custom_tee' });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <header className="site-header"><Link to="/" className="back-link">← Home</Link><h1>Rasta Rooster Clothing</h1></header>
        <main className="apply-main">
          <section className="success-box">
            <div className="success-icon">👕</div>
            <h2>Order Request Received!</h2>
            <p>
              We'll review your design request and reach out to <strong>{email}</strong> to
              confirm details and arrange payment before printing.
            </p>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header"><Link to="/" className="back-link">← Home</Link><h1>Rasta Rooster Clothing</h1></header>
      <main className="apply-main">
        <div className="apply-intro">
          <h2>Custom Tee Request — Pāhoa, Hawaiʻi</h2>
          <p>
            Design your own tee with Rasta Rooster flash art, custom text, or a photo you send
            us. Pick up free in Pāhoa or get it shipped anywhere on the Big Island.
          </p>
          <ul className="apply-benefits">
            <li>Garment-dyed tees, heavy cotton tees, and hoodies</li>
            <li>Front print, or front + back for one flat add-on fee</li>
            <li>Free Pāhoa pickup — no shipping fee</li>
            <li>We'll confirm your design and price before anything goes to print</li>
          </ul>
        </div>

        <section>
          <form onSubmit={handleSubmit}>
            <label>Garment
              <select value={shirtType} onChange={e => setShirtType(e.target.value as ShirtType)}>
                {GARMENT_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>{g.label} — ${g.basePrice.toFixed(2)}</option>
                ))}
              </select>
            </label>

            <label>Size
              <select value={shirtSize} onChange={e => setShirtSize(e.target.value)}>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label>Color (optional)
              <input value={shirtColor} onChange={e => setShirtColor(e.target.value)} placeholder="Black, White, Natural…" />
            </label>

            <label>
              Print Locations
              <span className="custom-tee-checkbox-row">
                <label className="custom-tee-checkbox">
                  <input
                    type="checkbox"
                    checked={printLocations.includes('front')}
                    onChange={() => togglePrintLocation('front')}
                  /> Front
                </label>
                <label className="custom-tee-checkbox">
                  <input
                    type="checkbox"
                    checked={printLocations.includes('back')}
                    onChange={() => togglePrintLocation('back')}
                  /> Back (+${EXTRA_PRINT_LOCATION_FEE.toFixed(2)})
                </label>
              </span>
            </label>

            <label>
              Design Notes
              <textarea
                rows={4}
                maxLength={500}
                value={designNotes}
                onChange={e => setDesignNotes(e.target.value)}
                placeholder="Rasta Rooster flash art, custom text, Pūna district callout, or describe a photo you'll send us…"
              />
              <span className="char-count">{designNotes.length}/500</span>
            </label>

            <label>Reference Art Link (optional)
              <input
                type="url"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                placeholder="Link to a photo or design reference (Instagram, Google Drive, etc.)"
              />
            </label>

            <label>
              Fulfillment
              <span className="custom-tee-radio-row">
                {FULFILLMENT_OPTIONS.map(f => (
                  <label key={f.value} className="custom-tee-radio">
                    <input
                      type="radio"
                      name="fulfillment"
                      checked={fulfillment === f.value}
                      onChange={() => setFulfillment(f.value)}
                    />
                    <span><strong>{f.label}</strong><br /><small>{f.description}</small></span>
                  </label>
                ))}
              </span>
            </label>

            {fulfillment === 'hawaii_ship' && (
              <label>Shipping Address
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Street address, town, zip"
                />
              </label>
            )}

            <label>Quantity
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>

            <label>Your Name
              <input name="customer_name" required />
            </label>
            <label>Email
              <input name="customer_email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>Phone (optional)
              <input name="customer_phone" type="tel" />
            </label>

            <section className="custom-tee-quote">
              <div className="custom-tee-quote-row"><span>Price per item</span><span>${quote.pricePerItem.toFixed(2)}</span></div>
              <div className="custom-tee-quote-row"><span>Subtotal ({quantity} × ${quote.pricePerItem.toFixed(2)})</span><span>${quote.subtotal.toFixed(2)}</span></div>
              <div className="custom-tee-quote-row"><span>Shipping</span><span>{quote.shipping > 0 ? `$${quote.shipping.toFixed(2)}` : 'Free'}</span></div>
              <div className="custom-tee-quote-row custom-tee-quote-total"><span>Estimated Total</span><span>${quote.total.toFixed(2)}</span></div>
              <p className="custom-tee-quote-note">This is an estimate. We'll confirm final pricing and take payment once your design is approved.</p>
            </section>

            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Request This Tee'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
