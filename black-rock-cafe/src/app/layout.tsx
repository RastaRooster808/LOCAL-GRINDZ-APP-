import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/data/site";
import { LanguageProvider } from "@/lib/i18n";
import SkipLink from "@/components/SkipLink";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIConcierge from "@/components/AIConcierge";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackrockcafepahoa.example.com"),
  title: {
    default: `${site.name} — A Pāhoa Institution Since 1998 | Best Breakfast & Burgers, Big Island`,
    template: `%s | ${site.name}`,
  },
  description:
    "Black Rock Cafe has fed Pāhoa since 1998 — big-portion breakfast, burgers, and plate lunches rooted in Puna's history. Planning a Hawaiʻi Island trip? Start your visit here.",
  keywords: [...site.seoKeywords],
  openGraph: {
    title: `${site.name} — A Pāhoa Institution Since 1998`,
    description:
      "Big-portion local grinds and a story rooted in Puna, Hawaiʻi. Plan your Big Island visit around it.",
    images: ["/images/exterior.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description:
      "Big-portion local grinds and a story rooted in Puna, Hawaiʻi. Plan your Big Island visit around it.",
    images: ["/images/exterior.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0e0a",
  width: "device-width",
  initialScale: 1,
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: site.name,
  description: site.tagline,
  servesCuisine: ["American", "Hawaiian", "Local Hawaii Regional"],
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line1,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: "US",
  },
  telephone: site.phone,
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "07:00",
    closes: "21:00",
  },
  servesBreakfast: true,
  acceptsReservations: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* eslint-disable-next-line react/no-danger */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <LanguageProvider>
          <SkipLink />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <AIConcierge />
          <ServiceWorkerRegister />
        </LanguageProvider>
      </body>
    </html>
  );
}
