import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { compressImage } from '../components/ui/ImageUpload';
import {
  GARMENT_OPTIONS,
  SHIRT_COLORS,
  PRINT_LOCATIONS,
  PRINT_SIZES,
  FULFILLMENT_OPTIONS,
  calculateCustomTeeOrder,
  type ShirtType,
  type PrintLocation,
  type PrintSize,
  type PrintSpec,
  type Fulfillment,
} from '../lib/customTeeOrder';

const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

// Flat mockup geometry — a stylized tee silhouette, not a photo. Each print
// spot gets a fixed box on the silhouette; PRINT_SIZES.widthFrac scales the
// image within it.
const TEE_PATH = 'M60,10 L80,10 Q100,26 120,10 L140,10 L172,42 L150,64 L138,52 L138,232 L62,232 L62,52 L50,64 L28,42 Z';
const SPOT_BOX: Record<PrintLocation, { cx: number; cy: number; w: number; h: number }> = {
  front: { cx: 100, cy: 130, w: 66, h: 90 },
  back: { cx: 100, cy: 130, w: 66, h: 90 },
  sleeve: { cx: 42, cy: 68, w: 30, h: 36 },
};

function TeeMockup({ label, color, spots, forLocation }: {
  label: string;
  color: string;
  spots: PrintSpec[];
  /** Which non-sleeve location this panel represents ('front' or 'back'). Sleeve always shows too. */
  forLocation: 'front' | 'back';
}) {
  const visible = spots.filter(s => s.location === forLocation || s.location === 'sleeve');
  return (
    <div className="ct-mockup">
      <svg viewBox="0 0 200 240" className="ct-mockup-svg" role="img" aria-label={`${label} mockup`}>
        <defs>
          {visible.map(s => {
            const box = SPOT_BOX[s.location];
            const sizeOpt = PRINT_SIZES.find(p => p.value === s.size)!;
            const w = box.w * sizeOpt.widthFrac, h = box.h * sizeOpt.widthFrac;
            return (
              <clipPath id={`clip-${forLocation}-${s.location}`} key={s.location}>
                <rect x={box.cx - w / 2} y={box.cy - h / 2} width={w} height={h} rx={2} />
              </clipPath>
            );
          })}
        </defs>
        <path d={TEE_PATH} fill={color} stroke="#00000022" strokeWidth={1.5} />
        {visible.map(s => {
          const box = SPOT_BOX[s.location];
          const sizeOpt = PRINT_SIZES.find(p => p.value === s.size)!;
          const w = box.w * sizeOpt.widthFrac, h = box.h * sizeOpt.widthFrac;
          return (
            <image
              key={s.location}
              href={s.previewUrl}
              x={box.cx - w / 2}
              y={box.cy - h / 2}
              width={w}
              height={h}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-${forLocation}-${s.location})`}
            />
          );
        })}
      </svg>
      <p className="ct-mockup-label">{label}</p>
    </div>
  );
}

export function CustomTee() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [shirtType, setShirtType] = useState<ShirtType>('standard_tee');
  const [shirtSize, setShirtSize] = useState('M');
  const [shirtColor, setShirtColor] = useState(SHIRT_COLORS[0].value);
  const [spots, setSpots] = useState<PrintSpec[]>([]);
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pahoa_pickup');
  const [quantity, setQuantity] = useState(1);
  const [designNotes, setDesignNotes] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [email, setEmail] = useState('');

  const colorHex = SHIRT_COLORS.find(c => c.value === shirtColor)?.hex ?? '#f5f5f0';
  const quote = useMemo(
    () => calculateCustomTeeOrder({ shirtType, printSpotCount: Math.max(1, spots.length), fulfillment, quantity }),
    [shirtType, spots.length, fulfillment, quantity],
  );
  const anyUploading = spots.some(s => s.uploading);
  const anyFailed = spots.some(s => !s.uploading && !s.imageUrl);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  function locationActive(loc: PrintLocation) {
    return spots.some(s => s.location === loc);
  }

  async function toggleLocation(loc: PrintLocation, file: File | null) {
    if (!file) {
      setSpots(prev => prev.filter(s => s.location !== loc));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const defaultSize: PrintSize = loc === 'sleeve' ? 'small' : 'large';
    setSpots(prev => [...prev.filter(s => s.location !== loc), { location: loc, size: defaultSize, previewUrl, imageUrl: null, uploading: true }]);

    try {
      const compressed = await compressImage(file, 1200, 1200);
      const path = `custom-tee-designs/${sessionId}/${loc}.webp`;
      const { error } = await supabase.storage.from('vendor-assets').upload(path, compressed, {
        contentType: 'image/webp',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('vendor-assets').getPublicUrl(path);
      setSpots(prev => prev.map(s => s.location === loc ? { ...s, imageUrl: `${data.publicUrl}?t=${Date.now()}`, uploading: false } : s));
    } catch (err) {
      console.error('Design upload failed', err);
      setSpots(prev => prev.map(s => s.location === loc ? { ...s, uploading: false } : s));
      setError(`Upload failed for the ${loc} design. Try again, or remove it and continue without.`);
    }
  }

  function setSpotSize(loc: PrintLocation, size: PrintSize) {
    setSpots(prev => prev.map(s => s.location === loc ? { ...s, size } : s));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (anyUploading) { setError('Still uploading a design — one sec and try again.'); return; }
    if (anyFailed) { setError('One of your designs failed to upload — retry it or uncheck that spot before submitting.'); return; }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    const printSpecs = spots.map(s => ({ location: s.location, size: s.size, image_url: s.imageUrl }));
    const { error } = await supabase.from('custom_tee_orders').insert({
      shirt_type: shirtType,
      shirt_color: shirtColor,
      shirt_size: shirtSize,
      print_locations: spots.map(s => s.location),
      print_specs: printSpecs,
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
            Upload your own design, place it on the tee, and see it before you send it —
            free pickup in Pāhoa or shipped anywhere on the Big Island, printed locally.
          </p>
          <ul className="apply-benefits">
            <li>Garment-dyed tees, heavy cotton tees, and hoodies</li>
            <li>Upload art for front, back, and/or sleeve — each its own size</li>
            <li>Free Pāhoa pickup — no shipping fee</li>
            <li>We'll confirm your design and price before anything goes to print</li>
          </ul>
        </div>

        <div className="ct-mockup-row">
          <TeeMockup label="Front" color={colorHex} spots={spots} forLocation="front" />
          <TeeMockup label="Back" color={colorHex} spots={spots} forLocation="back" />
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

            <label>
              Color
              <span className="ct-color-picker">
                {SHIRT_COLORS.map(c => (
                  <button
                    type="button"
                    key={c.value}
                    className={`ct-color-choice${shirtColor === c.value ? ' ct-color-choice--active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setShirtColor(c.value)}
                    aria-label={c.label}
                    aria-pressed={shirtColor === c.value}
                    title={c.label}
                  />
                ))}
              </span>
            </label>

            <fieldset className="ct-spots">
              <legend>Your Design — Front, Back, and/or Sleeve</legend>
              {PRINT_LOCATIONS.map(loc => {
                const spot = spots.find(s => s.location === loc.value);
                const availableSizes = loc.value === 'sleeve' ? PRINT_SIZES.filter(p => p.value === 'small') : PRINT_SIZES;
                return (
                  <div className="ct-spot-row" key={loc.value}>
                    <label className="ct-spot-toggle">
                      <input
                        type="checkbox"
                        checked={locationActive(loc.value)}
                        onChange={e => {
                          if (!e.target.checked) { toggleLocation(loc.value, null); return; }
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'image/*';
                          input.onchange = () => { const f = input.files?.[0]; if (f) toggleLocation(loc.value, f); };
                          input.click();
                        }}
                      /> {loc.label}
                    </label>
                    {spot && (
                      <>
                        <select
                          value={spot.size}
                          onChange={e => setSpotSize(loc.value, e.target.value as PrintSize)}
                          disabled={availableSizes.length === 1}
                        >
                          {availableSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <span className={`ct-spot-status${!spot.uploading && !spot.imageUrl ? ' ct-spot-status--error' : ''}`}>
                          {spot.uploading ? 'Uploading…' : spot.imageUrl ? '✓ Ready' : '⚠ Upload failed — retry'}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
              <p className="ct-spot-hint">Front and back can go up to 9". Sleeves are 3".</p>
            </fieldset>

            <label>
              Design Notes (optional)
              <textarea
                rows={3}
                maxLength={500}
                value={designNotes}
                onChange={e => setDesignNotes(e.target.value)}
                placeholder="Placement tweaks, colors to avoid, anything we should know…"
              />
              <span className="char-count">{designNotes.length}/500</span>
            </label>

            <label>Inspiration Link (optional)
              <input
                type="url"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                placeholder="A Pinterest board, Instagram post, etc. — separate from your uploaded art"
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
            <button type="submit" className="btn-primary" disabled={submitting || anyUploading || anyFailed}>
              {submitting ? 'Submitting…' : anyUploading ? 'Uploading design…' : 'Request This Tee'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
