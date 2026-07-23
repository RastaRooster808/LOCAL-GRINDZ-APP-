import { Link } from 'react-router-dom';
import { FeaturedVendor } from '../lib/marketplace';

/**
 * Premium placement card for a featured vendor. Clearly labeled as featured so
 * vendor branding stays distinct from Local Grindz marketplace branding, and
 * the category never reads as exclusive to one vendor. Renders a CDN banner
 * when the vendor has one, otherwise the vendor's themed gradient + emoji.
 */
export function FeaturedVendorCard({ vendor }: { vendor: FeaturedVendor }) {
  return (
    <article className="fv-card" aria-label={`${vendor.categoryLabel} — ${vendor.name}`}>
      <div className="fv-banner-wrap" style={vendor.bannerUrl ? undefined : { background: vendor.theme.banner }}>
        {vendor.bannerUrl
          ? <img src={vendor.bannerUrl} alt="" className="fv-banner" loading="lazy" />
          : <span className="fv-banner-emoji" aria-hidden="true">{vendor.emoji}</span>
        }
        <span className="fv-featured-badge">★ Featured Vendor</span>
      </div>
      <div className="fv-body">
        <div className="fv-identity">
          {vendor.logoUrl
            ? <img src={vendor.logoUrl} alt={`${vendor.name} logo`} className="fv-logo" loading="lazy" />
            : <span className="fv-logo fv-logo--emoji" style={{ borderColor: vendor.theme.accent }} aria-hidden="true">{vendor.emoji}</span>
          }
          <div>
            <p className="fv-category-label" style={{ color: vendor.theme.accent }}>
              {vendor.categoryLabel} — {vendor.name}
            </p>
            <h3 className="fv-tagline">{vendor.tagline}</h3>
            <p className="fv-rating">
              {vendor.rating === 'New' ? '✨ New Vendor' : `★ ${vendor.rating}`}
            </p>
          </div>
        </div>
        <p className="fv-desc">{vendor.description}</p>
        <div className="fv-badges">
          {vendor.badges.map(b => (
            <span key={b} className="fv-badge">✓ {b}</span>
          ))}
        </div>
        {vendor.menuSlug ? (
          <Link to={`/vendors/${vendor.menuSlug}`} className="fv-shop-btn" style={{ background: vendor.theme.accent }}>
            {vendor.shopLabel} →
          </Link>
        ) : vendor.shopUrl ? (
          <a href={vendor.shopUrl} target="_blank" rel="noopener noreferrer" className="fv-shop-btn">
            {vendor.shopLabel} →
          </a>
        ) : null}
      </div>
    </article>
  );
}
