import type { Metadata } from "next";
import HistoryTimeline from "@/components/HistoryTimeline";
import { historySource } from "@/data/history";

export const metadata: Metadata = {
  title: "Our History — Ancient Puna to Black Rock Cafe",
  description:
    "An interactive timeline of Pahoa, Hawaiʻi — from ancient ʻōhiʻa rainforest and waves of immigration through the plantation era to Black Rock Cafe, opened in 1998.",
};

export default function HistoryPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">From ancient Puna to Black Rock Cafe</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        Pahoa has an extremely interesting history that closely parallels the
        rest of Hawaiʻi, with some unique differences. Explore the timeline —
        sourced from the historical placard on our wall.
      </p>

      <div className="mt-12">
        <HistoryTimeline />
      </div>

      <p className="mt-12 text-sm text-stone-500">
        {historySource.title}. {historySource.note}
      </p>
    </div>
  );
}
