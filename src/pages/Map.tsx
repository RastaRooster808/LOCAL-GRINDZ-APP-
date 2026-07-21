import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import type { Vendor } from '../lib/types';

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Big Island neighborhood → approximate lat/lng
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'hilo': [19.7074, -155.0849],
  'downtown hilo': [19.7236, -155.0895],
  'kona': [19.6408, -155.9969],
  'kailua-kona': [19.6408, -155.9969],
  'kailua kona': [19.6408, -155.9969],
  'puna': [19.4969, -154.9249],
  'keaau': [19.6194, -155.0522],
  'pahoa': [19.4941, -154.9446],
  'volcano': [19.4286, -155.2389],
  'waimea': [20.0219, -155.6667],
  'kamuela': [20.0219, -155.6667],
  'kohala': [20.2500, -155.7500],
  'north kohala': [20.2500, -155.7500],
  'south kohala': [19.9800, -155.8000],
  'waikoloa': [19.9298, -155.7853],
  'kau': [19.0833, -155.6333],
  'naalehu': [19.0662, -155.5851],
  'captain cook': [19.4972, -155.9228],
  'honaunau': [19.4220, -155.9008],
  'mountain view': [19.5475, -155.1097],
  'kurtistown': [19.5826, -155.0566],
};

const BIG_ISLAND_CENTER: [number, number] = [19.7074, -155.0849];

function nearbyCoords(address: string | null, neighborhood: string | null): [number, number] | null {
  const haystack = `${address ?? ''} ${neighborhood ?? ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (haystack.includes(key)) return coords;
  }
  return null;
}

async function geocode(address: string): Promise<[number, number] | null> {
  const cacheKey = `lgeo_${btoa(encodeURIComponent(address)).slice(0, 40)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached) as [number, number];
  try {
    const q = encodeURIComponent(`${address}, Hawaii, USA`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=us`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }
  } catch { /* network failure; fall through */ }
  return null;
}

export function Map() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load vendors once
  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, slug, name, cuisine_type, description, neighborhood, photo_url, logo_url, is_active, locations(id, name, address, status, hours)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setVendors((data as Vendor[]) || []);
        setLoading(false);
      });
  }, []);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    mapRef.current = L.map(mapEl.current, { zoomControl: true }).setView(BIG_ISLAND_CENTER, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, []);

  // Place / refresh markers whenever vendors or filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = vendors.filter(v => {
      if (openOnly && !v.locations?.some(l => l.status === 'open')) return false;
      if (cuisineFilter !== 'all' && v.cuisine_type !== cuisineFilter) return false;
      return true;
    });

    const mapInstance = map;
    let cancelled = false;
    let lastGeoAt = 0;

    async function placeMarkers() {
      for (const v of filtered) {
        if (cancelled) break;
        const loc = v.locations?.[0];

        // Resolve coords: neighborhood lookup → geocode → random fallback
        let coords = nearbyCoords(loc?.address ?? null, v.neighborhood ?? null);
        if (!coords && loc?.address && loc.address.trim().length > 4) {
          // Throttle Nominatim to ≤1 req/s
          const now = Date.now();
          const gap = now - lastGeoAt;
          if (gap < 1100) await new Promise(r => setTimeout(r, 1100 - gap));
          lastGeoAt = Date.now();
          coords = await geocode(loc.address);
        }
        if (!coords) {
          coords = [
            BIG_ISLAND_CENTER[0] + (Math.random() - 0.5) * 0.08,
            BIG_ISLAND_CENTER[1] + (Math.random() - 0.5) * 0.12,
          ];
        }

        const isOpen = loc?.status === 'open';
        const iconHtml = v.logo_url
          ? `<img src="${v.logo_url}" alt="${v.name}" />`
          : '🍽';

        const icon = L.divIcon({
          className: '',
          html: `<div class="map-pin${isOpen ? ' map-pin--open' : ''}" title="${v.name}">${iconHtml}</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
          popupAnchor: [0, -46],
        });

        const marker = L.marker(coords as L.LatLngExpression, { icon });
        marker.addTo(mapInstance);
        marker.bindPopup(
          `<div class="map-popup">
            ${v.logo_url ? `<img src="${v.logo_url}" class="map-popup-logo" alt="${v.name}" />` : ''}
            <div class="map-popup-body">
              <strong class="map-popup-name">${v.name}</strong>
              <span class="map-popup-dot${isOpen ? '--open' : '--closed'}">${isOpen ? '● Open' : '○ Closed'}</span>
              ${v.cuisine_type ? `<p class="map-popup-cuisine">${v.cuisine_type}</p>` : ''}
              ${loc?.address ? `<p class="map-popup-addr">${loc.address}</p>` : ''}
              ${loc?.hours ? `<p class="map-popup-hours">${loc.hours}</p>` : ''}
              <a href="#/vendors/${v.slug}" class="map-popup-link">View Menu →</a>
            </div>
          </div>`,
          { maxWidth: 240 },
        );

        markersRef.current.push(marker);
      }
    }

    placeMarkers();
    return () => { cancelled = true; };
  }, [vendors, openOnly, cuisineFilter, loading]);

  function handleNearMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      pos => mapRef.current!.setView([pos.coords.latitude, pos.coords.longitude], 13),
      () => alert('Location access was denied or unavailable.'),
    );
  }

  const cuisines = Array.from(new Set(vendors.map(v => v.cuisine_type).filter(Boolean) as string[])).sort();

  return (
    <div className="map-page">
      <header className="map-header">
        <Link to="/" className="map-back-link">← Home</Link>
        <h1 className="map-title">Vendor Map</h1>
        <div className="map-controls" role="group" aria-label="Map filters">
          <button
            className={`map-filter-btn${!openOnly ? ' active' : ''}`}
            onClick={() => setOpenOnly(false)}
            aria-pressed={!openOnly}
          >All</button>
          <button
            className={`map-filter-btn${openOnly ? ' active' : ''}`}
            onClick={() => setOpenOnly(true)}
            aria-pressed={openOnly}
          >Open Now</button>
          {cuisines.length > 1 && (
            <select
              className="map-cuisine-select"
              value={cuisineFilter}
              onChange={e => setCuisineFilter(e.target.value)}
              aria-label="Filter by cuisine"
            >
              <option value="all">All Cuisines</option>
              {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <button className="map-filter-btn map-near-me" onClick={handleNearMe} aria-label="Center map on my location">
            📍 Near Me
          </button>
        </div>
      </header>

      {loading && (
        <div className="map-loading" role="status" aria-live="polite">Loading vendors…</div>
      )}

      <div ref={mapEl} className="map-canvas" aria-label="Interactive map of Local Grindz vendors" role="application" />

      <nav className="map-footer-nav" aria-label="Map footer navigation">
        <Link to="/vendors">All Vendors</Link>
        <span aria-hidden>·</span>
        <Link to="/apply">Join as Vendor</Link>
        <span aria-hidden>·</span>
        <Link to="/account">My Account</Link>
      </nav>
    </div>
  );
}
