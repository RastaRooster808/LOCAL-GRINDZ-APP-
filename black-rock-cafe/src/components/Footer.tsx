import Link from "next/link";
import { site } from "@/data/site";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Eat & Drink",
    links: [
      { href: "/menu", label: "Menu" },
      { href: "/order", label: "Order Online" },
      { href: "/reservations", label: "Reservations" },
      { href: "/private-events", label: "Catering & Private Events" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/history", label: "Our History" },
      { href: "/about", label: "About & Local Farmers" },
      { href: "/visit", label: "Visitor Guide to Puna" },
      { href: "/loyalty", label: "VIP Club & Rewards" },
    ],
  },
  {
    title: "More",
    links: [
      { href: "/gift-cards", label: "Gift Cards" },
      { href: "/shop", label: "Merch Shop" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-night-900">
      <div className="container-cafe grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl font-bold text-white">{site.name}</p>
          <p className="prose-cafe mt-2 max-w-xs">{site.tagline}</p>
          <address className="prose-cafe mt-4 not-italic text-sm">
            {site.address.line1}
            <br />
            {site.address.city}, {site.address.state} {site.address.zip}
            <br />
            <a href={`tel:${site.phone}`} className="focus-ring rounded hover:text-sunrise-300">
              {site.phone}
            </a>
          </address>
          <div className="mt-4 flex gap-4 text-sm text-stone-300">
            <a className="focus-ring rounded hover:text-sunrise-300" href={site.social.google} target="_blank" rel="noreferrer">
              Find & Review Us on Google
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sunrise-300">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="focus-ring rounded text-sm text-stone-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {site.name}, {site.town}, Hawaiʻi. Built with aloha.
      </div>
    </footer>
  );
}
