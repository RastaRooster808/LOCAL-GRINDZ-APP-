import type { MetadataRoute } from "next";

const BASE_URL = "https://blackrockcafepahoa.example.com";

const ROUTES = [
  "",
  "/menu",
  "/order",
  "/reservations",
  "/history",
  "/loyalty",
  "/gift-cards",
  "/private-events",
  "/shop",
  "/about",
  "/visit",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
