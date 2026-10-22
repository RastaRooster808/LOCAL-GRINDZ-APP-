# Violet Love Designs — listing and cooperative notes

**Pāhoa, Hawaiʻi · Artists & Makers · [violetlovedesign.com](https://www.violetlovedesign.com/)**

Contemporary art and Hawaiian craft: coconut and lauhala weaving handmade on the
Big Island, fine art, art cards, canvas and metal prints, and island jewelry.

## Cooperative efforts

This is the part worth paying attention to, because it lines up with what Local
Grindz is for.

**Lau Hui.** Violet Love Designs describes its own trade as supporting "the Big
Island community of Weavers" through a collective it calls the *Lau Hui*. Buying
from the shop is framed as supporting that wider group of weavers, not one
maker. The business describes itself as led by its founder and supported by
family and close friends, with "teamwork and collaborative weaving" as the basis
for growth.

**Violet Loves Art Gallery**, at the Puna Kai Shopping Center in Pāhoa, is
explicitly a shared space: it exists to give artists "an opportunity to build
collaborative wealth in a healthy and supportive space." It shows and sells
original work by other artists, runs workshops, and hosts seasonal art shows.

**Weaving is taught, not just sold.** Lauhala weaving on Saturdays, coconut
weaving on Sundays, plus beginner acrylic painting. Violet has woven coconut
leaf since childhood; it is described as a family tradition and a cultural
practice, and the classes pass it on rather than keeping it in-house.

**Why this matters to the marketplace.** Every other featured vendor is a single
business. This one is a business *and* a venue for other makers — the nearest
thing in the directory to Local Grindz's own model. If a partnership is ever
worth proposing beyond a listing, this is the one: a gallery whose stated purpose
is collaborative wealth for artists is a natural counterpart to a marketplace
whose purpose is the same for food vendors. Uncle Robert's plays a comparable
role for food; Violet Loves Art Gallery plays it for art.

## Other places they appear

- Etsy shop **VioletLoveDesign**
- Class booking at **violetlovedesigns.setmore.com**
- A second domain, **viloved.com**
- Listed on Yelp, kuhikuhi.com, and a Gust startup profile
- YouTube channel **@violetlovedesigns1489**

## The vendor dashboard login

This vendor is set up differently from every other one, on purpose.

Vendor RLS matches on `vendors.email = auth.email()` (see
`docs/migrations/phase-4-3-vendor-auth-rls.sql`), and `vendors.user_id` backfills
from the same address. Every prior vendor uses a `bankspham5+slug@gmail.com`
alias, which keeps the dashboard with the operator. Violet's row instead carries
**`violetpainstheworld@gmail.com`**, which is what lets her sign in and manage
her own profile, hours and orders.

**The login itself is not created in this repo, and cannot be.** The app uses
`signInWithPassword`, so a vendor login is an auth user with a password —
provisioned through the Supabase Auth admin, never committed. To finish:

1. In the Supabase dashboard → **Authentication → Users → Add user**, create
   `violetpainstheworld@gmail.com` with a temporary password.
2. Link the row (or re-run the backfill in `phase-4-3-vendor-auth-rls.sql`):
   ```sql
   update vendors v set user_id = u.id
     from auth.users u
    where v.slug = 'violet-love-designs' and v.user_id is null and v.email = u.email;
   ```
3. Send her the temporary password out of band. `/vendor` has a **Set your own
   password** panel; she should use it on first sign-in.

## Not confirmed

- **Street address and phone** — `15-2714 Pahoa Village Rd, Unit J1, Pāhoa, HI
  96778` and `(808) 731-6679` come from directory listings read through search.
  Both violetlovedesign.com and the Puna Kai tenant page are blocked by this
  environment's egress proxy, so neither was read first-hand. Confirm before
  promoting.
- **Gallery hours** — the class days are known; the gallery's own opening hours
  are not. The location is seeded `closed`, because that badge means "open right
  now".
- **Prices** — none recorded, so no `menu_items`. The papale (woven coconut-leaf
  hat) is described as the best seller and classes are bookable, but nothing here
  asserts a price nobody has verified. With no menu, the storefront hides its
  Menu and Place Order sections automatically.
