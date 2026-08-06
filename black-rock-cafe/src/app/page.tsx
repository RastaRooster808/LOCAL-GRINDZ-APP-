import Image from "next/image";
import Link from "next/link";
import LavaHero from "@/components/LavaHero";
import GoogleReviews from "@/components/GoogleReviews";
import SocialWall from "@/components/SocialWall";
import { menu } from "@/data/menu";
import { historyTimeline } from "@/data/history";

const FEATURED_IDS = ["loco-moco", "bacon-cheeseburger", "kalua-pig-cabbage", "baby-back-ribs"];
const featuredItems = menu.flatMap((c) => c.items).filter((i) => FEATURED_IDS.includes(i.id));
const cafeFounding = historyTimeline.find((e) => e.year === "1998");

export default function HomePage() {
  return (
    <>
      <LavaHero />

      <section className="container-cafe grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
          <Image src="/images/exterior.jpg" alt="Black Rock Cafe storefront in Pahoa, Hawaiʻi" fill className="object-cover" sizes="(min-width: 1024px) 480px, 100vw" />
        </div>
        <div>
          <h2 className="section-heading">Where Pahoa comes to eat</h2>
          <p className="prose-cafe mt-4">
            Black Rock Cafe has served Pahoa&rsquo;s plate lunches, burgers,
            and Loco Moco since 1998 — a gathering place in a town shaped by
            a century of immigration, ʻōhiʻa forest, and hard-won
            &ldquo;firsts.&rdquo;
          </p>
          <p className="prose-cafe mt-3">{cafeFounding?.description}</p>
          <Link href="/history" className="btn-secondary mt-6 inline-flex">
            Explore our history →
          </Link>
        </div>
      </section>

      <section className="border-y border-white/10 bg-gradient-to-b from-ohia-950/40 to-transparent py-20">
        <div className="container-cafe">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="section-heading">Local favorites</h2>
            <Link href="/menu" className="btn-secondary">Full menu with allergen filters →</Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredItems.map((item) => (
              <div key={item.id} className="card-surface flex flex-col p-5">
                <p className="font-display text-lg font-semibold text-white">{item.name}</p>
                <p className="prose-cafe mt-2 flex-1 text-sm">{item.description}</p>
                <p className="mt-4 font-semibold text-sunrise-300">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-cafe py-20">
        <h2 className="section-heading">What locals & visitors say</h2>
        <p className="prose-cafe mt-2 max-w-xl">Live from Google Reviews (demo data — see integration notes in the README).</p>
        <div className="mt-8">
          <GoogleReviews />
        </div>
      </section>

      <section className="border-t border-white/10 bg-night-900 py-20">
        <div className="container-cafe">
          <h2 className="section-heading">Follow along</h2>
          <p className="prose-cafe mt-2 max-w-xl">Instagram, Facebook & TikTok, all in one wall (demo grid — see integration notes).</p>
          <div className="mt-8">
            <SocialWall />
          </div>
        </div>
      </section>

      <section className="container-cafe py-20">
        <div className="card-surface flex flex-col items-center gap-6 bg-lava-flow bg-200 p-10 text-center animate-lava-shift">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Hungry yet?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/order" className="btn-primary bg-white text-lava-900 hover:bg-stone-100">Order Online</Link>
            <Link href="/reservations" className="btn-secondary border-white/70 text-white">Reserve a Table</Link>
            <Link href="/gift-cards" className="btn-secondary border-white/70 text-white">Send a Gift Card</Link>
          </div>
        </div>
      </section>
    </>
  );
}
