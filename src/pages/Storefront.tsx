import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Vendor, MenuItem, Location, Special, Review, CartItem } from '../lib/types';
import { getPointsBalance, earnPoints, redeemPoints, earnReviewPoints, dollarValue, POINTS_PER_REDEMPTION } from '../hooks/useLoyalty';

export function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'direct';
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [loyaltyEmail, setLoyaltyEmail] = useState('');
  const [redeemChecked, setRedeemChecked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from('vendors').select('*').eq('slug', slug).eq('is_active', true).single();
      if (!data) { setNotFound(true); return; }
      setVendor(data as Vendor);
      const vid = data.id;

      // Record page view
      supabase.from('vendor_events').insert({ vendor_id: vid, event_type: 'page_view', source });

      const [menuR, locR, specR, revR] = await Promise.all([
        supabase.from('menu_items').select('*').eq('vendor_id', vid).eq('available', true).order('category'),
        supabase.from('locations').select('*').eq('vendor_id', vid).order('updated_at', { ascending: false }).limit(1).single(),
        supabase.from('specials').select('*').eq('vendor_id', vid).eq('active', true),
        supabase.from('reviews').select('*').eq('vendor_id', vid).eq('approved', true).order('created_at', { ascending: false }).limit(10),
      ]);
      setMenu((menuR.data as MenuItem[]) || []);
      if (locR.data) setLocation(locR.data as Location);
      setSpecials((specR.data as Special[]) || []);
      setReviews((revR.data as Review[]) || []);
    })();
  }, [slug]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleEmailBlur = async (email: string) => {
    if (!email) return;
    const pts = await getPointsBalance(email);
    setLoyaltyPoints(pts);
  };

  const categories = [...new Set(menu.map(i => i.category))];

  if (notFound) {
    return (
      <div>
        <header className="site-header"><h1>Local Grindz</h1></header>
        <main style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Truck not found</h2>
          <Link to="/vendors" className="btn-primary">Browse all trucks</Link>
        </main>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <header className="site-header"><h1>Local Grindz</h1></header>
        <main style={{ padding: '2rem' }}><p className="loading-msg">Loading…</p></main>
      </div>
    );
  }

  return (
    <div>
      <header className="site-header" id="vendor-header">
        <Link to="/vendors" className="back-link">← All Trucks</Link>
        <h1 id="vendor-title">{vendor.name}</h1>
        <p className="tagline">{vendor.cuisine_type || ''}</p>
      </header>

      <nav className="bottom-nav">
        <a href="#location">Location</a>
        <a href="#specials">Specials</a>
        <a href="#menu">Menu</a>
        <a href="#order">Order</a>
        <a href="#reviews">Reviews</a>
      </nav>

      <main>
        {/* Location */}
        <section id="location">
          <h2>Live Location</h2>
          {location ? (
            <div>
              <p className="location-name">{location.name}</p>
              <p className="location-address">{location.address}</p>
              <p className="location-hours">{location.hours}</p>
              <span className={`location-status status-${location.status}`}>
                {location.status === 'open' ? 'Open Now' : 'Closed'}
              </span>
            </div>
          ) : <p>Location info unavailable.</p>}
        </section>

        {/* Specials */}
        <section id="specials">
          <h2>Today's Specials</h2>
          {specials.length > 0
            ? specials.map(s => (
                <div key={s.id} className="special-card">
                  <strong>{s.title}</strong>
                  <p>{s.description}</p>
                </div>
              ))
            : <p>No specials today.</p>
          }
        </section>

        {/* Menu */}
        <section id="menu">
          <h2>Menu</h2>
          {categories.map(cat => (
            <div key={cat} className="menu-category">
              <h3>{cat.charAt(0).toUpperCase() + cat.slice(1)}s</h3>
              {menu.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-info">
                    <strong>{item.name}</strong>
                    <span className="menu-item-desc">{item.description}</span>
                  </div>
                  <div className="menu-item-price">${Number(item.price).toFixed(2)}</div>
                  <button className="btn-add" onClick={() => addToCart(item)}>+</button>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* Order */}
        <section id="order">
          <h2>Your Order</h2>
          {cart.length === 0
            ? <p>Your cart is empty.</p>
            : <>
                {cart.map(i => (
                  <div key={i.id} className="cart-item">
                    <span>{i.qty}× {i.name}</span>
                    <span>${(i.price * i.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(i.id)}>✕</button>
                  </div>
                ))}
                <p id="cart-total">Total: <strong>${cartTotal.toFixed(2)}</strong></p>
              </>
          }
          <h3>Place Order</h3>
          <form onSubmit={async e => {
            e.preventDefault();
            if (!cart.length) { alert('Add items first.'); return; }
            const fd = new FormData(e.currentTarget);
            const name = fd.get('name') as string;
            const email = fd.get('email') as string;
            const note = fd.get('note') as string;

            const { data, error } = await supabase
              .from('orders')
              .insert({ vendor_id: vendor.id, customer_name: name, customer_email: email || null, customer_note: note || null, items: cart, total: cartTotal, status: 'pending' })
              .select('id')
              .single();

            if (error || !data) { alert('Could not place order. Try again.'); return; }

            if (email) {
              if (redeemChecked && loyaltyPoints && loyaltyPoints >= POINTS_PER_REDEMPTION) {
                await redeemPoints(email, loyaltyPoints, vendor.id, data.id);
              }
              await earnPoints(email, vendor.id, data.id, cartTotal);
            }

            setCart([]);
            setLoyaltyPoints(null);
            setRedeemChecked(false);
            navigate(`/order/${data.id}`);
          }}>
            <label>Your Name <input name="name" required autoComplete="name" /></label>
            <label>
              Email <span className="label-hint">(earn loyalty points)</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                onChange={e => setLoyaltyEmail(e.target.value)}
                onBlur={e => handleEmailBlur(e.target.value.trim())}
              />
            </label>
            {loyaltyPoints !== null && loyaltyEmail && (
              <div className="loyalty-wrap">
                <p className="loyalty-balance">
                  {loyaltyPoints > 0
                    ? `You have ${loyaltyPoints} pts ($${dollarValue(loyaltyPoints)} value)`
                    : 'You have 0 pts — earn 1 pt per $1 spent'}
                </p>
                {loyaltyPoints >= POINTS_PER_REDEMPTION && (
                  <label className="checkbox-label">
                    <input type="checkbox" checked={redeemChecked} onChange={e => setRedeemChecked(e.target.checked)} />
                    Redeem points for discount
                    <span className="loyalty-discount">(-${dollarValue(loyaltyPoints)})</span>
                  </label>
                )}
              </div>
            )}
            <label>Special Instructions <textarea name="note" rows={2} placeholder="Allergies, substitutions…"></textarea></label>
            <button type="submit" className="btn-primary">Place Order</button>
          </form>
        </section>

        {/* Reviews */}
        <section id="reviews">
          <h2>Reviews</h2>
          {reviews.length > 0
            ? reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <blockquote>"{r.body}"</blockquote>
                  <cite>— {r.customer_name}</cite>
                </div>
              ))
            : <p>No reviews yet. Be the first!</p>
          }
          <h3>Leave a Review</h3>
          <form onSubmit={async e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const email = fd.get('email') as string;
            await supabase.from('reviews').insert({
              vendor_id: vendor.id,
              customer_name: fd.get('name') as string,
              rating: parseInt(fd.get('rating') as string),
              body: fd.get('body') as string,
            });
            if (email) await earnReviewPoints(email, vendor.id);
            alert(email ? 'Thanks! You earned 5 loyalty points.' : 'Thanks for your review!');
            e.currentTarget.reset();
            const { data } = await supabase.from('reviews').select('*').eq('vendor_id', vendor.id).eq('approved', true).order('created_at', { ascending: false }).limit(10);
            setReviews((data as Review[]) || []);
          }}>
            <label>Your Name <input name="name" required autoComplete="name" /></label>
            <label>Email <span className="label-hint">(earn 5 loyalty points)</span> <input name="email" type="email" placeholder="you@email.com" /></label>
            <label>Rating
              <select name="rating" required>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</option>)}
              </select>
            </label>
            <label>Review <textarea name="body" required rows={3} placeholder="Tell us about your experience…"></textarea></label>
            <button type="submit" className="btn-primary">Submit Review</button>
          </form>
        </section>
      </main>

      <footer><p>Local Grindz – Big Island, Hawaii</p></footer>
    </div>
  );
}
