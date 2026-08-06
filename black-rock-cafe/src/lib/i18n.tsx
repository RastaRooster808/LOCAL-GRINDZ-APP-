"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Lightweight multi-language foundation covering global chrome (nav, footer,
 * common CTAs). This is intentionally small in scope for a first pass —
 * translating full page bodies is a larger content project.
 *
 * To extend to full-site i18n: swap this for `next-intl` or `next-i18next`,
 * move `dictionary` below into `messages/{locale}.json`, and wrap routes
 * under `app/[locale]/...` per the next-intl App Router guide. Keep the
 * `useLanguage()` call signature so components don't need to change.
 */
export type Locale = "en" | "haw" | "es";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "haw", label: "ʻŌlelo Hawaiʻi" },
  { code: "es", label: "Español" },
];

const dictionary: Record<Locale, Record<string, string>> = {
  en: {
    nav_menu: "Menu",
    nav_order: "Order Online",
    nav_reservations: "Reservations",
    nav_history: "Our Story",
    nav_loyalty: "VIP Club",
    nav_giftcards: "Gift Cards",
    nav_events: "Private Events",
    nav_shop: "Shop",
    nav_about: "About",
    nav_visit: "Visit",
    nav_contact: "Contact",
    cta_order: "Order Online",
    cta_reserve: "Reserve a Table",
    footer_tagline: "Local grinds in the heart of Pahoa since 1998.",
  },
  haw: {
    nav_menu: "Papa ʻAi",
    nav_order: "Kūʻai Pūnaewele",
    nav_reservations: "Hoʻopaʻa Pākaukau",
    nav_history: "Ko Mākou Moʻolelo",
    nav_loyalty: "Hui VIP",
    nav_giftcards: "Kāleka Makana",
    nav_events: "Nā Hanana",
    nav_shop: "Hale Kūʻai",
    nav_about: "E Pili Ana",
    nav_visit: "E Kipa Mai",
    nav_contact: "Kelepona Mai",
    cta_order: "Kūʻai Pūnaewele",
    cta_reserve: "Hoʻopaʻa Pākaukau",
    footer_tagline: "Nā meaʻai kūloko ma ke kikowaena o Pāhoa mai 1998.",
  },
  es: {
    nav_menu: "Menú",
    nav_order: "Ordenar en Línea",
    nav_reservations: "Reservaciones",
    nav_history: "Nuestra Historia",
    nav_loyalty: "Club VIP",
    nav_giftcards: "Tarjetas de Regalo",
    nav_events: "Eventos Privados",
    nav_shop: "Tienda",
    nav_about: "Nosotros",
    nav_visit: "Visítanos",
    nav_contact: "Contacto",
    cta_order: "Ordenar en Línea",
    cta_reserve: "Reservar Mesa",
    footer_tagline: "Comida local en el corazón de Pahoa desde 1998.",
  },
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => dictionary[locale][key] ?? dictionary.en[key] ?? key,
    }),
    [locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
