# Local Grindz — Admin Approval System

## Overview

The admin approval system gates new vendors before they go live. Vendors apply through a public form; admins review, approve, or reject through a protected dashboard.

---

## Admin Access Control

### How admin is identified
A separate `admins` table maps to `auth.users`:

```sql
create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- RLS: only service_role (Edge Functions) can write; admins read their own row
alter table admins enable row level security;
create policy "admin read own" on admins for select using (id = auth.uid());
```

### Admin dashboard route
`/admin/index.html` — checks on load:

```js
const { data: adminRow } = await db
  .from('admins')
  .select('id')
  .eq('id', user.id)
  .single();

if (!adminRow) {
  document.body.innerHTML = '<p>Access denied.</p>';
  return;
}
```

No URL-based security — the RLS check is the real gate.

---

## Vendor Application Flow

### Step 1 — Public application form (`/apply/`)

Fields:
- Business name (required)
- Cuisine type (select)
- Primary neighborhood (select)
- Contact email (required)
- Contact phone
- Instagram handle
- Short description (max 300 chars)
- Agree to platform terms (checkbox, required)

On submit:
```js
await db.from('vendor_applications').insert({
  business_name, cuisine_type, location, contact_email,
  contact_phone, instagram, description
});
```

Confirmation message shown. No email sent at this stage (Phase 3 — email via Edge Function in Phase 4).

### Step 2 — Admin reviews in dashboard

Admin sees a table of pending applications sorted by `created_at` ascending (oldest first).

Columns: Business name, cuisine, neighborhood, contact email, submitted date, actions.

Actions per row:
- **Approve** — creates vendor account, sends invite
- **Reject** — marks rejected, stores reason
- **Request Info** — marks as `info_requested`, stores note (Phase 4: sends email)

### Step 3 — Approve action

```js
async function approveVendor(applicationId) {
  const app = await getApplication(applicationId);

  // 1. Create vendor row
  const { data: vendor } = await db.from('vendors').insert({
    email: app.contact_email,
    name: app.business_name,
    slug: toSlug(app.business_name),
    cuisine_type: app.cuisine_type,
    is_active: true
  }).select().single();

  // 2. Mark application approved
  await db.from('vendor_applications').update({
    status: 'approved',
    reviewed_at: new Date().toISOString()
  }).eq('id', applicationId);

  // 3. Send Supabase Auth invite (via Edge Function in Phase 4)
  // For now: admin manually invites via Supabase dashboard
  alert(`Vendor created. Manually invite ${app.contact_email} via Supabase Auth.`);
}
```

### Step 4 — Reject action

```js
async function rejectVendor(applicationId, reason) {
  await db.from('vendor_applications').update({
    status: 'rejected',
    admin_note: reason,
    reviewed_at: new Date().toISOString()
  }).eq('id', applicationId);
}
```

Phase 4 will trigger a rejection email via Supabase Edge Function + Resend.

---

## Admin Dashboard Sections

### 1. Applications queue
- Tab: Pending / Approved / Rejected
- Pending count badge on tab
- Approve / Reject buttons inline

### 2. Active vendors
- List of all `is_active = true` vendors
- Actions: View storefront, Suspend, Edit details

### 3. Suspend vendor
```js
await db.from('vendors').update({ is_active: false }).eq('id', vendorId);
```
Vendor immediately disappears from directory. They see "Account suspended" on dashboard login.

### 4. Flagged reviews
- Reviews where `approved = false` (customer-flagged or auto-flagged)
- Admin can approve or permanently delete

### 5. Featured listings
- Manually mark vendor as featured with expiry date
```js
await db.from('vendor_features').insert({
  vendor_id, tier, feature_expires_at
});
```

### 6. Platform stats (read-only)
- Total vendors, total orders, total reviews
- New applications this week

---

## Vendor Applications Table

```sql
create table vendor_applications (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  cuisine_type text,
  location text,
  contact_email text not null,
  contact_phone text,
  instagram text,
  description text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table vendor_applications enable row level security;

-- Public can insert (apply)
create policy "public apply" on vendor_applications
  for insert with check (true);

-- Only admins can read (via service_role in Edge Functions, or direct admin check)
create policy "admin read applications" on vendor_applications
  for select using (
    exists (select 1 from admins where id = auth.uid())
  );

create policy "admin update applications" on vendor_applications
  for update using (
    exists (select 1 from admins where id = auth.uid())
  );
```

---

## Security Rules Summary

| Action | Who can do it |
|--------|--------------|
| Submit application | Anyone (anon) |
| Read applications | Admin only |
| Approve / reject | Admin only |
| Create vendor row | Admin only (no public self-signup) |
| Suspend vendor | Admin only |
| Approve/delete reviews | Admin only |
| Set featured listings | Admin only |
| Read admin table | Own row only |

---

## Phase 3 Admin Build Order

1. Create `admins` table + insert your user ID
2. Create `vendor_applications` table + RLS
3. Build `/apply/index.html` — public application form
4. Build `/admin/index.html` — protected dashboard skeleton
5. Add Applications tab (pending queue, approve/reject buttons)
6. Add Vendors tab (active list, suspend button)
7. Add Reviews tab (flagged queue)
8. Add Featured tab (manual toggle + expiry date)
9. Phase 4: Wire Edge Functions for email notifications
