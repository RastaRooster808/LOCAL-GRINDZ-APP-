import type { Metadata } from "next";
import ReservationForm from "@/components/ReservationForm";

export const metadata: Metadata = {
  title: "Reservations",
  description: "Reserve a table at Black Rock Cafe in Pahoa, Hawaiʻi.",
};

export default function ReservationsPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Reserve a Table</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        Send us a request and we&rsquo;ll confirm by phone or email. For
        parties of 8+, see{" "}
        <a href="/private-events" className="text-sunrise-300 underline focus-ring rounded">Private Events</a>.
      </p>
      <div className="mt-10 max-w-2xl">
        <ReservationForm />
      </div>
    </div>
  );
}
