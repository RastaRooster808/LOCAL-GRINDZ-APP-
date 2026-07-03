import { commerce, PRODUCT_TYPES, PRODUCT_STATUS } from '../data/commerce.js';
import { CommerceCard } from './CommerceCard';

const SECTIONS = [
  {
    type:    PRODUCT_TYPES.DIGITAL_PRINT,
    heading: 'TOPP Botanical Prints',
    sub:     'High-res photographs from Puna protea farms — $0.99 each.',
    icon:    '🌺',
  },
  {
    type:    PRODUCT_TYPES.FLORIST_HOTEL,
    heading: 'Ohana Bloom — Fresh Flowers',
    sub:     'Weekly protea bundles delivered direct from the farm.',
    icon:    '💐',
  },
  {
    type:    PRODUCT_TYPES.MERCH,
    heading: 'TOPP Merch',
    sub:     'Wear the roots.',
    icon:    '👕',
  },
  {
    type:    PRODUCT_TYPES.MEMBERSHIP,
    heading: 'Community Memberships',
    sub:     'Support the Puna archive and TOPP growers.',
    icon:    '🌿',
  },
  {
    type:    PRODUCT_TYPES.GROWER_RESOURCE,
    heading: 'Grower Resources',
    sub:     'Digital guides for Puna farmers and small-scale growers.',
    icon:    '🌱',
  },
] as const;

export function CommerceGrid() {
  const visible = commerce.filter(
    item => item.status !== PRODUCT_STATUS.HIDDEN && item.status !== PRODUCT_STATUS.DRAFT,
  );

  return (
    <>
      {SECTIONS.map(({ type, heading, sub, icon }) => {
        const items = visible.filter(item => item.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type} className="landing-section commerce-grid-section">
            <div className="commerce-grid-head">
              <h2>{icon} {heading}</h2>
              <p className="section-sub">{sub}</p>
            </div>
            <div className="commerce-product-grid">
              {items.map(item => <CommerceCard key={item.id} item={item} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
