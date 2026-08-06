"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { site } from "@/data/site";

const NAV: { href: string; key: string }[] = [
  { href: "/menu", key: "nav_menu" },
  { href: "/order", key: "nav_order" },
  { href: "/reservations", key: "nav_reservations" },
  { href: "/history", key: "nav_history" },
  { href: "/loyalty", key: "nav_loyalty" },
  { href: "/gift-cards", key: "nav_giftcards" },
  { href: "/private-events", key: "nav_events" },
  { href: "/shop", key: "nav_shop" },
  { href: "/about", key: "nav_about" },
  { href: "/visit", key: "nav_visit" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night-950/85 backdrop-blur-md">
      <div className="container-cafe flex h-16 items-center justify-between">
        <Link href="/" className="focus-ring flex items-center gap-2 font-display text-xl font-bold text-white">
          <span aria-hidden className="text-lava-400">●</span>
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded text-sm font-medium text-stone-200 transition hover:text-sunrise-300"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <Link href="/order" className="btn-primary !px-4 !py-2 text-sm">
            {t("cta_order")}
          </Link>
        </div>

        <button
          type="button"
          className="focus-ring rounded-md p-2 text-stone-200 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-night-950 lg:hidden"
          >
            <div className="container-cafe flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded-md px-2 py-2 text-stone-200 hover:bg-white/5"
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between gap-3">
                <LanguageSwitcher />
                <Link href="/order" onClick={() => setOpen(false)} className="btn-primary !px-4 !py-2 text-sm">
                  {t("cta_order")}
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
