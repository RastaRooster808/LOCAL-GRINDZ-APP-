import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Visit — Directions, Hours & Puna Guide",
  description: "Directions and hours for Black Rock Cafe in Pahoa, plus a visitor guide to the Puna district of Hawaiʻi Island.",
};

const VISITOR_GUIDE = [
  { name: "Lava Tree State Monument", note: "Ancient lava-cast tree molds, a short drive from town." },
  { name: "Ahalanui Hot Pond", note: "A warm, spring-fed ocean pool (check current access status before visiting)." },
  { name: "Pahoa Village Farmers Market", note: "Local produce and crafts, weekly." },
  { name: "Isaac Hale Beach Park", note: "Pohoiki black-sand beach and boat ramp." },
];

export default function VisitPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Visit</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-display text-xl font-semibold text-white">Hours</h2>
          <ul className="prose-cafe mt-3 space-y-1 text-sm">
            {site.hours.map((h) => (
              <li key={h.days} className="flex justify-between">
                <span>{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 font-display text-xl font-semibold text-white">Directions</h2>
          <address className="prose-cafe mt-2 not-italic text-sm">
            {site.address.line1}
            <br />
            {site.address.city}, {site.address.state} {site.address.zip}
          </address>
          <p className="mt-3 text-sm text-stone-500">
            Map embed placeholder — add a Google Maps embed or static map once
            the address above is finalized.
          </p>

          <h2 className="mt-6 font-display text-xl font-semibold text-white">Volcano Updates</h2>
          <p className="prose-cafe mt-2 text-sm">
            For current lava activity and hazard status in Puna, check the{" "}
            <a
              href="https://www.usgs.gov/volcanoes/kilauea"
              target="_blank"
              rel="noreferrer"
              className="text-sunrise-300 underline focus-ring rounded"
            >
              USGS Hawaiian Volcano Observatory
            </a>{" "}
            before you travel.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold text-white">Virtual Tour</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="relative col-span-2 aspect-video overflow-hidden rounded-2xl border border-white/10">
              <Image src="/images/exterior.jpg" alt="Black Rock Cafe exterior" fill className="object-cover" sizes="100vw" />
            </div>
            {["Dining Room", "Counter & Kitchen", "Lanai Seating"].map((label) => (
              <div key={label} className="card-surface flex aspect-video items-center justify-center text-sm text-stone-500">
                {label} photo coming soon
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Add interior photos or a 360° tour embed (Matterport/Google
            Street View) to complete the virtual tour.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-white">Visitor Guide to Puna</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {VISITOR_GUIDE.map((g) => (
            <div key={g.name} className="card-surface p-5">
              <p className="font-semibold text-white">{g.name}</p>
              <p className="prose-cafe mt-1 text-sm">{g.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
