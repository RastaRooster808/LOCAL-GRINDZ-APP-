import type { Metadata } from "next";
import Image from "next/image";
import { hawaiianWords } from "@/data/hawaiian-words";

export const metadata: Metadata = {
  title: "About & Community",
  description: "The story of Black Rock Cafe, our local farmers and suppliers, and a small ʻōlelo Hawaiʻi glossary.",
};

const FARMERS = [
  { name: "Puna diversified growers", note: "Orchids, papaya, banana & pineapple sourced from the same district that pioneered diversified agriculture in the 1980s." },
  { name: "Local fishers", note: "Catch of the day from Hawaiʻi Island waters." },
  { name: "Island ranchers", note: "Fresh local island beef for every burger." },
];

export default function AboutPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">About Black Rock Cafe</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
        <Image src="/images/exterior.jpg" alt="Black Rock Cafe storefront" width={800} height={600} className="rounded-3xl border border-white/10 object-cover" />
        <div>
          <p className="prose-cafe">
            Black Rock Cafe opened in Pahoa in 1998, in a town that calls
            itself &ldquo;the last frontier in Hawaiʻi.&rdquo; We serve big,
            honest plates — Loco Moco, plate lunches, burgers, and
            comfort-food classics — to a community built by generations of
            immigration and hard work.
          </p>
          <p className="prose-cafe mt-4">
            Welcome to our community.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-white">Local Farmers & Suppliers</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {FARMERS.map((f) => (
            <div key={f.name} className="card-surface p-5">
              <p className="font-semibold text-white">{f.name}</p>
              <p className="prose-cafe mt-1 text-sm">{f.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-white">A Few Words in ʻŌlelo Hawaiʻi</h2>
        <p className="prose-cafe mt-1 max-w-2xl text-sm">
          Offered with respect — a starting point, not a substitute for
          learning from a fluent speaker or kumu.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {hawaiianWords.map((w) => (
            <div key={w.word} className="card-surface p-4">
              <dt className="font-display text-lg font-semibold text-sunrise-300">{w.word}</dt>
              <dd className="prose-cafe text-sm">{w.meaning}{w.note ? ` — ${w.note}` : ""}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
