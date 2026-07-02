import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/analytics';

interface VendorResult {
  id: string;
  name: string;
  slug: string;
  cuisine_type: string;
  description: string;
  photo_url: string | null;
  logo_url: string | null;
  score: number;
}

interface ItemResult {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  vendor_id: string;
  vendor_name: string;
  vendor_slug: string;
  score: number;
}

interface SearchResults {
  vendors: VendorResult[];
  items: ItemResult[];
  mode: 'vector' | 'fts' | 'empty';
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = 'Search trucks and dishes…', className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Flatten all results for keyboard nav
  const allLinks: { href: string; label: string }[] = [
    ...(results?.vendors ?? []).map(v => ({ href: `/vendors/${v.slug}`, label: v.name })),
    ...(results?.items ?? []).map(i => ({ href: `/vendors/${i.vendor_slug}`, label: `${i.name} at ${i.vendor_name}` })),
  ];

  useEffect(() => {
    if (!query.trim()) { setResults(null); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<SearchResults>('search', {
          body: { query: query.trim(), limit: 5 },
        });
        if (!error && data) {
          setResults(data);
          setOpen(true);
          setActiveIdx(-1);
          trackEvent('search_query', { query: query.trim(), section: 'search_bar' });
        }
      } catch { /* network error — silently skip */ }
      setLoading(false);
    }, 320);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1); return; }
    if (!open || allLinks.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allLinks.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      navigate(allLinks[activeIdx].href);
      setOpen(false);
    }
  }

  const hasResults = (results?.vendors.length ?? 0) > 0 || (results?.items.length ?? 0) > 0;

  return (
    <div className={`search-bar-wrap ${className}`} ref={wrapRef} role="search">
      <div className="search-bar-input-row">
        <span className="search-bar-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="search-bar-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (hasResults) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search vendors and menu items"
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
        />
        {loading && <span className="search-bar-spinner" aria-hidden="true" />}
        {query && !loading && (
          <button className="search-bar-clear" onClick={() => { setQuery(''); setResults(null); setOpen(false); }} aria-label="Clear search">✕</button>
        )}
      </div>

      {open && (
        <div className="search-results" role="listbox" aria-label="Search results">
          {!hasResults && query.trim() && !loading && (
            <p className="search-empty">No results for "{query}"</p>
          )}

          {(results?.vendors.length ?? 0) > 0 && (
            <div className="search-group">
              <p className="search-group-label">
                Vendors
                {results?.mode === 'vector' && <span className="search-ai-badge">AI</span>}
              </p>
              {results!.vendors.map((v, i) => (
                <Link
                  key={v.id}
                  to={`/vendors/${v.slug}`}
                  className={`search-result-item${activeIdx === i ? ' search-result-item--active' : ''}`}
                  onClick={() => { setOpen(false); trackEvent('search_result_click', { label: v.name, vendor_id: v.id, section: 'search_bar' }); }}
                  role="option"
                  aria-selected={activeIdx === i}
                >
                  {(v.logo_url || v.photo_url) && (
                    <img
                      src={v.logo_url ?? v.photo_url!}
                      alt=""
                      className="search-result-thumb"
                      loading="lazy"
                    />
                  )}
                  <div className="search-result-text">
                    <span className="search-result-name">{v.name}</span>
                    {v.cuisine_type && <span className="search-result-sub">{v.cuisine_type}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {(results?.items.length ?? 0) > 0 && (
            <div className="search-group">
              <p className="search-group-label">Menu Items</p>
              {results!.items.map((item, i) => {
                const idx = (results?.vendors.length ?? 0) + i;
                return (
                  <Link
                    key={item.id}
                    to={`/vendors/${item.vendor_slug}`}
                    className={`search-result-item${activeIdx === idx ? ' search-result-item--active' : ''}`}
                    onClick={() => setOpen(false)}
                    role="option"
                    aria-selected={activeIdx === idx}
                  >
                    <div className="search-result-text">
                      <span className="search-result-name">{item.name}</span>
                      <span className="search-result-sub">
                        ${Number(item.price).toFixed(2)} · {item.vendor_name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
