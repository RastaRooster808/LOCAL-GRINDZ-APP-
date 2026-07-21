import { FeaturedVendor } from '../lib/marketplace';

/**
 * Premium placement card for a featured vendor. Clearly labeled as featured so
 * vendor branding stays distinct from Local Grindz marketplace branding, and
 * the category never reads as exclusive to one vendor.
 */
export function FeaturedVendorCard({ vendor }: { vendor: FeaturedVendor }) {
  return (
    <article className="fv-card" aria-label={`${vendor.categoryLabel} — ${vendor.name}`}>
      <div className="fv-banner-wrap">
        <img src={vendor.bannerUrl} alt="" className="fv-banner" loading="lazy" />
        <span className="fv-featured-badge">★ Featured Vendor</span>
      </div>
      <div className="fv-body">
        <div className="fv-identity">
          <img src={vendor.logoUrl} alt={`${vendor.name} logo`} className="fv-logo" loading="lazy" />
          <div>
            <p className="fv-category-label">{vendor.categoryLabel} — {vendor.name}</p>
            <h3 className="fv-tagline">{vendor.tagline}</h3>
          </div>
        </div>
        <p className="fv-desc">{vendor.description}</p>
        <div className="fv-badges">
          {vendor.badges.map(b => (
            <span key={b} className="fv-badge">✓ {b}</span>
          ))}
        </div>
        <a
          href={vendor.shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fv-shop-btn"
        >
          {vendor.shopLabel} →
        </a>
      </div>
    </article>
  );
}
