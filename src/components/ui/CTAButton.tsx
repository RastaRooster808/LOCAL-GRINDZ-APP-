import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CTADefinition } from '../../lib/cta';
import { handleCTAClick } from '../../lib/cta';

interface CTAButtonProps {
  cta: CTADefinition;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'ghost';
}

export function CTAButton({ cta, className = '', size = 'md', variant = 'primary' }: CTAButtonProps) {
  const [showingNotify, setShowingNotify] = useState(false);

  const sizeClass = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '';
  const variantClass = variant === 'outline' ? 'btn-outline' : variant === 'ghost' ? 'btn-ghost' : 'btn-primary';
  const cls = `${variantClass} ${sizeClass} ${className}`.trim();

  function handleClick() {
    const dest = handleCTAClick(cta);
    if (!dest && cta.comingSoon) {
      setShowingNotify(true);
      setTimeout(() => setShowingNotify(false), 2500);
    } else if (dest && dest.startsWith('http')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
    }
    // Internal hrefs are handled by the Link component below
  }

  if (showingNotify) {
    return (
      <span className={`cta-notify ${cls}`} aria-live="polite">
        {cta.icon} Coming soon — stay tuned!
      </span>
    );
  }

  // Live internal route → React Router Link
  if (!cta.comingSoon && cta.href && !cta.shopifyUrl) {
    return (
      <Link to={cta.href} className={cls} onClick={() => handleCTAClick(cta)}>
        {cta.icon && <span aria-hidden="true">{cta.icon} </span>}
        {cta.label}
      </Link>
    );
  }

  // Shopify external link
  if (!cta.comingSoon && cta.shopifyUrl) {
    return (
      <a
        href={cta.shopifyUrl}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {cta.icon && <span aria-hidden="true">{cta.icon} </span>}
        {cta.label}
        <span className="cta-shopify-note">via Shopify</span>
      </a>
    );
  }

  // Coming soon — button with notify flash
  return (
    <button type="button" className={`${cls} cta-coming-soon`} onClick={handleClick}>
      {cta.icon && <span aria-hidden="true">{cta.icon} </span>}
      {cta.label}
      <span className="cta-badge">Coming Soon</span>
    </button>
  );
}

/** Compact card version: icon + label + description + CTA */
export function CTACard({ cta }: { cta: CTADefinition }) {
  return (
    <div className="cta-card">
      {cta.icon && <div className="cta-card-icon" aria-hidden="true">{cta.icon}</div>}
      <div className="cta-card-body">
        <p className="cta-card-title">{cta.label}</p>
        <p className="cta-card-desc">{cta.description}</p>
      </div>
      <CTAButton cta={cta} size="sm" variant="outline" />
    </div>
  );
}
