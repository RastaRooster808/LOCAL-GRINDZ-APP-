import { Link, useLocation, useSearchParams } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Restaurants', to: '/vendors?cat=restaurants' },
  { label: 'Markets', to: '/vendors?cat=markets' },
  { label: 'Fruit', to: '/vendors?cat=fruit' },
  { label: 'Flowers', to: '/vendors?cat=flowers' },
  { label: 'Featured Vendors', to: '/vendors?cat=featured' },
  { label: 'Events', to: '/events' },
  { label: 'Profile', to: '/account' },
];

/** Horizontal marketplace navigation — Local Grindz branding, category-first. */
export function MarketplaceNav() {
  const location = useLocation();
  const [params] = useSearchParams();
  const currentCat = params.get('cat');

  function isActive(to: string): boolean {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    if (!query) return path !== '/vendors' || !currentCat;
    return query === `cat=${currentCat}`;
  }

  return (
    <nav className="mkt-nav" aria-label="Marketplace navigation">
      {NAV_ITEMS.map(item => (
        <Link
          key={item.label}
          to={item.to}
          className={`mkt-nav-link${isActive(item.to) ? ' active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
