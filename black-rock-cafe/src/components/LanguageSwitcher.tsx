"use client";

import { LOCALES, useLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <label className="flex items-center gap-2 text-sm text-stone-300">
      <span className="sr-only">Choose language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="focus-ring rounded-md border border-white/15 bg-night-900 px-2 py-1 text-stone-200"
        aria-label="Language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
