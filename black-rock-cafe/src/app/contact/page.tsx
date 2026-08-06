import type { Metadata } from "next";
import { site } from "@/data/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Black Rock Cafe in Pahoa, Hawaiʻi.",
};

export default function ContactPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Contact Us</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <ContactForm />

        <div className="card-surface p-6">
          <h2 className="font-display text-xl font-semibold text-white">Reach us directly</h2>
          <p className="prose-cafe mt-3 text-sm">
            {site.address.line1}
            <br />
            {site.address.city}, {site.address.state} {site.address.zip}
          </p>
          <p className="prose-cafe mt-3 text-sm">
            <a href={`tel:${site.phone}`} className="focus-ring rounded hover:text-sunrise-300">{site.phone}</a>
          </p>
          {!site.email.startsWith("TODO") && (
            <p className="prose-cafe text-sm">
              <a href={`mailto:${site.email}`} className="focus-ring rounded hover:text-sunrise-300">{site.email}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
