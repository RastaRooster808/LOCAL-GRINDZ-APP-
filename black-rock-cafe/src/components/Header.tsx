"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import { site } from "@/data/site";

const NAV_PRIMARY: { href: string; key: string }[] = [
  { href: "/menu", key: "nav_menu" },
  { href: "/history", key: "nav_history" },
  { href: "/reservations", key: "nav_reservations" },
  { href: "/visit", key: "nav_visit" },
];

const NAV_MORE: { href: string; key: string }[] = [
  { href: "/loyalty", key: "nav_loyalty" },
  { href: "/gift-cards", key: "nav_giftcards" },
  { href: "/private-events", key: "nav_events" },
  { href: "/shop", key: "nav_shop" },
  { href: "/about", key: "nav_about" },
];

const NAV_MOBILE = [...NAV_PRIMARY, ...NAV_MORE];

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus-ring flex items-center gap-1 rounded text-sm font-medium text-stone-200 transition hover:text-sunrise-300"
      >
        More
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="card-surface absolute right-0 top-full mt-2 w-48 overflow-hidden bg-night-900 py-1 shadow-xl"
          >
            {NAV_MORE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="focus-ring block px-4 py-2 text-sm text-stone-200 hover:bg-white/5 hover:text-sunrise-300"
              >
                {t(item.key)}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night-950/85 backdrop-blur-md">
      <div className="container-cafe flex h-16 items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex items-center gap-2 font-display text-xl font-bold text-white">
          <span aria-hidden className="text-lava-400">●</span>
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {NAV_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring rounded text-sm font-medium text-stone-200 transition hover:text-sunrise-300"
            >
              {t(item.key)}
            </Link>
          ))}
          <MoreMenu />
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
              {NAV_MOBILE.map((item) => (
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
