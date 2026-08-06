"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { historyTimeline } from "@/data/history";
import type { TimelineEntry } from "@/data/types";

const ERA_COLOR: Record<TimelineEntry["era"], string> = {
  ancient: "bg-ohia-500",
  settlement: "bg-sunrise-400",
  plantation: "bg-lava-500",
  modern: "bg-ohia-400",
  cafe: "bg-lava-400",
};

const ERA_LABEL: Record<TimelineEntry["era"], string> = {
  ancient: "Ancient Puna",
  settlement: "Settlement & Immigration",
  plantation: "Plantation Era",
  modern: "Modern Pahoa",
  cafe: "Black Rock Cafe",
};

export default function HistoryTimeline() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div role="tablist" aria-label="History timeline" className="relative border-l border-white/15 pl-6">
        {historyTimeline.map((entry, i) => (
          <button
            key={entry.year}
            role="tab"
            aria-selected={active === i}
            id={`timeline-tab-${i}`}
            aria-controls={`timeline-panel-${i}`}
            onClick={() => setActive(i)}
            className="focus-ring group relative mb-6 block w-full text-left last:mb-0"
          >
            <span
              aria-hidden
              className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-night-950 transition ${
                active === i ? ERA_COLOR[entry.era] : "bg-white/20 group-hover:bg-white/40"
              }`}
            />
            <span className={`text-sm font-semibold uppercase tracking-wide ${active === i ? "text-sunrise-300" : "text-stone-500"}`}>
              {entry.year}
            </span>
            <span className={`block ${active === i ? "text-white" : "text-stone-400 group-hover:text-stone-200"}`}>
              {entry.title}
            </span>
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        role="tabpanel"
        id={`timeline-panel-${active}`}
        aria-labelledby={`timeline-tab-${active}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-surface h-fit p-8"
      >
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-night-950 ${ERA_COLOR[historyTimeline[active].era]}`}>
          {ERA_LABEL[historyTimeline[active].era]}
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold text-white">{historyTimeline[active].title}</h2>
        <p className="mt-1 text-sm font-medium text-sunrise-300">{historyTimeline[active].year}</p>
        <p className="prose-cafe mt-4 text-lg">{historyTimeline[active].description}</p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
            className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-30"
          >
            ← Earlier
          </button>
          <button
            type="button"
            onClick={() => setActive((a) => Math.min(historyTimeline.length - 1, a + 1))}
            disabled={active === historyTimeline.length - 1}
            className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-30"
          >
            Later →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
