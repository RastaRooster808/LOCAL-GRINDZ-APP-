"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

/**
 * Cinematic hero. INTEGRATION POINT: drop a real drone-shot video of Pahoa /
 * lava landscapes at `/public/video/pahoa-drone.mp4` (+ a `.webm` fallback)
 * and it will autoplay behind this content — see the commented <video> tag
 * below. Until that asset exists, an animated lava-flow gradient (CSS/
 * Framer Motion only, no network weight) stands in so the hero still reads
 * as "cinematic" and stays fast.
 */
export default function LavaHero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-night-950">
      {/* <video
        autoPlay muted loop playsInline
        poster="/images/exterior.jpg"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src="/video/pahoa-drone.webm" type="video/webm" />
        <source src="/video/pahoa-drone.mp4" type="video/mp4" />
      </video> */}

      <div
        aria-hidden
        className="absolute inset-0 bg-lava-flow bg-200 animate-lava-shift opacity-70"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/40 to-transparent" />

      {[...Array(8)].map((_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute bottom-0 h-2 w-2 rounded-full bg-sunrise-300/80 blur-[1px]"
          style={{ left: `${8 + i * 11}%` }}
          animate={{ y: [-0, -260], opacity: [0.9, 0] }}
          transition={{ duration: 5 + (i % 3), repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        />
      ))}

      <div className="container-cafe relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 inline-block rounded-full border border-sunrise-300/40 bg-black/30 px-4 py-1 text-sm font-medium text-sunrise-200"
        >
          Pahoa, Hawaiʻi Island · Since 1998
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl"
        >
          Black Rock Cafe
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="prose-cafe mt-5 max-w-xl text-lg sm:text-xl"
        >
          Big-portion local grinds, hand-poured coffee, and small-town aloha —
          forged where the ʻōhiʻa forest meets the lava fields of Puna.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <Link href="/order" className="btn-primary">{t("cta_order")}</Link>
          <Link href="/menu" className="btn-secondary">View Menu</Link>
          <Link href="/reservations" className="btn-secondary">{t("cta_reserve")}</Link>
        </motion.div>
      </div>
    </section>
  );
}
