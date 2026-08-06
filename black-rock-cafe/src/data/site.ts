/**
 * Central business facts. Phone, address, and hours below are verified
 * (cross-checked across Yelp, Tripadvisor, and the phone number printed on
 * the restaurant's own menu placard — 965-1177). Values still marked TODO
 * are unverified — replace before launch (do not ship guessed contact info).
 */
export const site = {
  name: "Black Rock Cafe",
  tagline: "Local grinds in the heart of Pahoa since 1998",
  founded: 1998,
  town: "Pahoa",
  region: "Puna, Hawaiʻi Island",
  phone: "(808) 965-1177",
  email: "TODO: aloha@blackrockcafepahoa.com",
  address: {
    line1: "15-2872 Pahoa Village Rd",
    city: "Pahoa",
    state: "HI",
    zip: "96778",
  },
  hours: [
    { days: "Mon – Sun", time: "7:00 AM – 9:00 PM" },
  ],
  social: {
    instagram: "https://instagram.com/TODO",
    facebook: "https://facebook.com/TODO",
    tiktok: "https://tiktok.com/@TODO",
    google: "https://g.page/r/TODO",
  },
  seoKeywords: [
    "Best Breakfast in Pahoa",
    "Best Burgers in Hawaii",
    "Big Island Local Food",
    "Pahoa restaurant",
    "Puna Hawaii dining",
  ],
} as const;
