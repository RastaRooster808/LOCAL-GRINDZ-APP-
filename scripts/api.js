// =============================================================================
// scripts/api.js — Local Grindz data access layer
//
// Dual-mode: reads from Supabase when configured, falls back to local JSON.
// No build step. No npm. Load this before any page script that fetches data.
//
// To enable Supabase, add before this script tag in each HTML file:
//   <script>
//     window.SUPABASE_URL     = 'https://xxxx.supabase.co';
//     window.SUPABASE_ANON_KEY = 'eyJ...';
//   </script>
//
// When those globals are absent the app runs exactly as it did before —
// all reads fall through to the /data/*.json files.
// =============================================================================

(function (global) {

  const URL_BASE  = (global.SUPABASE_URL  || '').replace(/\/$/, '');
  const ANON_KEY  = global.SUPABASE_ANON_KEY || '';
  const LIVE      = Boolean(URL_BASE && ANON_KEY);

  // ── Internal helpers ────────────────────────────────────────────────────────

  function sbHeaders(authToken) {
    const h = {
      apikey: ANON_KEY,
      Authorization: `Bearer ${authToken || ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    return h;
  }

  async function sbGet(table, query) {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?${query}`, {
      headers: sbHeaders(),
    });
    if (!res.ok) throw new Error(`[API] GET ${table}: HTTP ${res.status}`);
    return res.json();
  }

  async function sbPost(table, body, authToken) {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...sbHeaders(authToken), Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`[API] POST ${table}: HTTP ${res.status}`);
    return res.json();
  }

  async function sbPatch(table, filter, body, authToken) {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: { ...sbHeaders(authToken), Prefer: 'return=representation' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`[API] PATCH ${table}: HTTP ${res.status}`);
    return res.json();
  }

  async function jsonFetch(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`[API] JSON ${path}: HTTP ${res.status}`);
    return res.json();
  }

  async function edgeFn(name, body, authToken) {
    const res = await fetch(`${URL_BASE}/functions/v1/${name}`, {
      method: 'POST',
      headers: sbHeaders(authToken),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`[API] Edge ${name}: HTTP ${res.status}`);
    return res.json();
  }

  // ── Public API object ───────────────────────────────────────────────────────

  const API = {

    /** True when Supabase credentials are present and active. */
    isLive: LIVE,

    // ── Vendors ───────────────────────────────────────────────────────────────

    /** Returns all approved vendors. */
    async getVendors() {
      if (LIVE) return sbGet('vendors', 'approved_status=eq.true&select=*');
      return jsonFetch('/data/vendors.json');
    },

    /** Returns a single vendor by vendor_id string (e.g. 'v001'). */
    async getVendor(vendorId) {
      if (LIVE) {
        const rows = await sbGet('vendors', `vendor_id=eq.${encodeURIComponent(vendorId)}&select=*`);
        return rows[0] ?? null;
      }
      const list = await jsonFetch('/data/vendors.json');
      return list.find(v => v.vendor_id === vendorId) ?? list[0] ?? null;
    },

    // ── Menu ──────────────────────────────────────────────────────────────────

    /**
     * Returns menu items. When vendorId is provided, filters to that vendor.
     * Returns only available items in Supabase mode (matching public RLS).
     */
    async getMenuItems(vendorId) {
      if (LIVE) {
        const filter = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&order=category.asc,name.asc&select=*`
          : 'order=category.asc,name.asc&select=*';
        return sbGet('menu_items', filter);
      }
      const items = await jsonFetch('/data/menus.json');
      return vendorId ? items.filter(i => i.vendor_id === vendorId) : items;
    },

    /**
     * Vendor: update a single menu item (requires auth token from login).
     */
    async updateMenuItem(itemId, patch, authToken) {
      if (!LIVE) throw new Error('[API] Menu updates require Supabase.');
      return sbPatch('menu_items', `item_id=eq.${encodeURIComponent(itemId)}`, patch, authToken);
    },

    // ── Locations ─────────────────────────────────────────────────────────────

    /**
     * Returns location rows. In JSON mode returns the full locations array.
     */
    async getLocations(vendorId) {
      if (LIVE) {
        const filter = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&select=*`
          : 'select=*';
        return sbGet('locations', filter);
      }
      const locs = await jsonFetch('/data/locations.json');
      return vendorId ? locs.filter(l => l.vendor_id === vendorId) : locs;
    },

    /**
     * Vendor: toggle live status / update location (requires auth token).
     * patch = { live_status, current_location_name, address, hours_today, latitude, longitude }
     */
    async updateLocation(vendorId, patch, authToken) {
      if (!LIVE) throw new Error('[API] Live location requires Supabase.');
      return sbPatch(
        'locations',
        `vendor_id=eq.${encodeURIComponent(vendorId)}`,
        { ...patch, last_updated: new Date().toISOString() },
        authToken
      );
    },

    // ── Specials ──────────────────────────────────────────────────────────────

    /**
     * Returns currently active specials that have not expired.
     * JSON fallback filters by active flag only (no server-side time check).
     */
    async getSpecials(vendorId) {
      if (LIVE) {
        const base = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&active=eq.true`
          : 'active=eq.true';
        return sbGet('specials', `${base}&order=created_at.desc&select=*`);
      }
      const specials = await jsonFetch('/data/specials.json');
      const list = vendorId ? specials.filter(s => s.vendor_id === vendorId) : specials;
      return list.filter(s => s.active);
    },

    /**
     * Vendor: create a new special (requires auth token).
     */
    async createSpecial(data, authToken) {
      if (!LIVE) throw new Error('[API] Creating specials requires Supabase.');
      return sbPost('specials', {
        special_id: `sp_${Date.now()}`,
        active: true,
        ...data,
      }, authToken);
    },

    /**
     * Vendor: deactivate a special (requires auth token).
     */
    async deactivateSpecial(specialId, authToken) {
      if (!LIVE) throw new Error('[API] Deactivating specials requires Supabase.');
      return sbPatch('specials', `special_id=eq.${encodeURIComponent(specialId)}`, { active: false }, authToken);
    },

    // ── Loyalty ───────────────────────────────────────────────────────────────

    /**
     * Returns campaign metadata for public display.
     * In Supabase mode uses the loyalty_campaign_public view — stamp_code excluded.
     * In JSON mode returns the full loyalty.json (stamp_code visible locally).
     */
    async getLoyaltyCampaign(vendorId) {
      if (LIVE) {
        const filter = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&campaign_active=eq.true`
          : 'campaign_active=eq.true';
        const rows = await sbGet('loyalty_campaign_public', filter);
        return rows[0] ?? null;
      }
      return jsonFetch('/data/loyalty.json');
    },

    /**
     * Validate a stamp code.
     *
     * In Supabase mode: delegates to the validate-stamp Edge Function.
     *   Returns { valid: boolean, stamps: number, stamps_required: number, reason: string }
     *   stamp_code never leaves the server.
     *
     * In JSON mode: returns null — loyalty.js falls back to local comparison.
     */
    async validateStamp(vendorId, enteredCode, customerToken) {
      if (!LIVE) return null;
      return edgeFn('validate-stamp', {
        vendor_id: vendorId,
        code: enteredCode,
        customer_token: customerToken,
      });
    },

    /**
     * Get a loyalty card by customer token.
     * Returns { stamps, lifetime_stamps } or null.
     */
    async getLoyaltyCard(vendorId, customerToken) {
      if (LIVE) {
        const rows = await sbGet(
          'loyalty_cards',
          `vendor_id=eq.${encodeURIComponent(vendorId)}&customer_token=eq.${encodeURIComponent(customerToken)}&select=stamps,lifetime_stamps`
        );
        return rows[0] ?? null;
      }
      return null; // localStorage is the source of truth in JSON mode
    },

    // ── Orders ────────────────────────────────────────────────────────────────

    /**
     * Submit an order.
     *
     * In Supabase mode: inserts into orders table, returns server-assigned ticket.
     * In JSON mode: generates a local ticket number (no persistence).
     *
     * orderData = { vendor_id, customer_name, customer_phone, items, total, special_requests, pickup_time }
     */
    async submitOrder(orderData) {
      if (LIVE) {
        const ticketNumber = `LG-${Date.now().toString(36).toUpperCase().slice(-5)}`;
        const rows = await sbPost('orders', {
          ticket_number: ticketNumber,
          status: 'pending',
          ...orderData,
        });
        return rows[0] ?? { ticket_number: ticketNumber, status: 'pending', ...orderData };
      }
      const ticket = `LG-${String(Math.floor(1000 + Math.random() * 9000))}`;
      return { ticket_number: ticket, status: 'pending', ...orderData };
    },

    /**
     * Look up an order by ticket number.
     * Delegates to the check-order Edge Function (avoids exposing all orders).
     */
    async getOrderStatus(ticketNumber) {
      if (!LIVE) throw new Error('[API] Order lookup requires Supabase.');
      return edgeFn('check-order', { ticket_number: ticketNumber });
    },

    /**
     * Vendor: update order status (requires auth token).
     * status = 'accepted' | 'ready' | 'completed' | 'cancelled'
     */
    async updateOrderStatus(orderId, status, authToken) {
      if (!LIVE) throw new Error('[API] Order status requires Supabase.');
      return sbPatch('orders', `id=eq.${encodeURIComponent(orderId)}`, { status }, authToken);
    },

    // ── Vendor Updates ────────────────────────────────────────────────────────

    /**
     * Returns submitted updates for a vendor (dashboard use).
     */
    async getVendorUpdates(vendorId) {
      if (LIVE) {
        const filter = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&order=timestamp.desc&limit=20&select=*`
          : 'order=timestamp.desc&limit=20&select=*';
        return sbGet('vendor_updates', filter);
      }
      const all = await jsonFetch('/data/updates.json');
      return vendorId ? all.filter(u => u.vendor_id === vendorId) : all;
    },

    /**
     * Submit a vendor update.
     * In Supabase mode: persists to DB; admin sees it in approval queue.
     * In JSON mode: returns null (vendor.js handles copy-to-clipboard flow).
     */
    async submitVendorUpdate(data) {
      if (LIVE) {
        return sbPost('vendor_updates', {
          update_id: `u_${Date.now()}`,
          developer_status: 'pending',
          timestamp: new Date().toISOString(),
          ...data,
        });
      }
      return null;
    },

    // ── Reviews ───────────────────────────────────────────────────────────────

    /** Returns approved reviews for a vendor. Empty array in JSON mode. */
    async getReviews(vendorId) {
      if (LIVE) {
        const filter = vendorId
          ? `vendor_id=eq.${encodeURIComponent(vendorId)}&approved=eq.true&order=created_at.desc&select=*`
          : 'approved=eq.true&order=created_at.desc&select=*';
        return sbGet('reviews', filter);
      }
      return [];
    },

    /** Submit a customer review (Supabase required). */
    async submitReview(reviewData) {
      if (!LIVE) throw new Error('[API] Reviews require Supabase.');
      return sbPost('reviews', { approved: false, ...reviewData });
    },

    // ── Admin ─────────────────────────────────────────────────────────────────
    // All admin methods require a Supabase session token from auth.getSession().

    /** Returns all pending vendor updates (admin approval queue). */
    async getAdminQueue(authToken) {
      if (!LIVE) throw new Error('[API] Admin requires Supabase.');
      return sbGet('vendor_updates', `developer_status=eq.pending&order=timestamp.asc&select=*`, authToken);
    },

    /** Approve a vendor update (marks completed). */
    async approveUpdate(updateId, authToken) {
      if (!LIVE) throw new Error('[API] Admin requires Supabase.');
      return sbPatch('vendor_updates', `update_id=eq.${encodeURIComponent(updateId)}`,
        { developer_status: 'completed' }, authToken);
    },

    /** Reject a vendor update. */
    async rejectUpdate(updateId, adminNotes, authToken) {
      if (!LIVE) throw new Error('[API] Admin requires Supabase.');
      return sbPatch('vendor_updates', `update_id=eq.${encodeURIComponent(updateId)}`,
        { developer_status: 'rejected', admin_notes: adminNotes }, authToken);
    },

    /** Approve a vendor (sets approved_status = true). */
    async approveVendor(vendorId, authToken) {
      if (!LIVE) throw new Error('[API] Admin requires Supabase.');
      return sbPatch('vendors', `vendor_id=eq.${encodeURIComponent(vendorId)}`,
        { approved_status: true }, authToken);
    },

    /** Approve a review. */
    async approveReview(reviewId, authToken) {
      if (!LIVE) throw new Error('[API] Admin requires Supabase.');
      return sbPatch('reviews', `id=eq.${encodeURIComponent(reviewId)}`,
        { approved: true }, authToken);
    },

  };

  // ── Expose globally ─────────────────────────────────────────────────────────
  global.LocalGrindzAPI = API;

  if (LIVE) {
    console.log('[LocalGrindz] Supabase active —', URL_BASE);
  } else {
    console.log('[LocalGrindz] JSON fallback mode — add SUPABASE_URL + SUPABASE_ANON_KEY to enable live data.');
  }

})(window);
