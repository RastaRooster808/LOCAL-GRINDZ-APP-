/**
 * Central business facts. Values marked TODO are placeholders — replace with
 * verified real details before launch (do not ship guessed contact info).
 */
export const site = {
  name: "Black Rock Cafe",
  tagline: "Local grinds in the heart of Pahoa since 1998",
  founded: 1998,
  town: "Pahoa",
  region: "Puna, Hawaiʻi Island",
  phone: "TODO: (808) 000-0000",
  email: "TODO: aloha@blackrockcafepahoa.com",
  address: {
    line1: "TODO: Street Address",
    city: "Pahoa",
    state: "HI",
    zip: "96778",
  },
  hours: [
    { days: "Mon – Fri", time: "TODO: 7:00 AM – 8:00 PM" },
    { days: "Sat – Sun", time: "TODO: 7:00 AM – 8:00 PM" },
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
