import type { Metadata } from "next";
import PrivateEventForm from "@/components/PrivateEventForm";
import EventCalendar from "@/components/EventCalendar";

export const metadata: Metadata = {
  title: "Private Events & Catering",
  description: "Catering, party reservations, tour bus stops, and wedding brunch bookings at Black Rock Cafe, Pahoa.",
};

const SECTIONS = [
  { id: "catering", title: "Catering Requests", blurb: "Off-site or drop-off catering for your gathering." },
  { id: "party", title: "Party Reservations", blurb: "Book our back room or lanai for a private party." },
  { id: "tour-bus", title: "Tour Bus Reservations", blurb: "Group stops welcome — let us know your headcount and ETA." },
  { id: "wedding-brunch", title: "Wedding Brunch Bookings", blurb: "A local-style brunch for your wedding weekend." },
];

export default function PrivateEventsPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Private Events & Catering</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        From a tour bus stop to a wedding brunch, our team can host your
        group. Fill out the request that matches your event.
      </p>

      <div className="mt-12 space-y-14">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="font-display text-2xl font-semibold text-white">{s.title}</h2>
            <p className="prose-cafe mt-1 max-w-xl text-sm">{s.blurb}</p>
            <div className="mt-4 max-w-2xl">
              <PrivateEventForm eventType={s.id} />
            </div>
          </section>
        ))}

        <section>
          <h2 className="font-display text-2xl font-semibold text-white">Local Event Calendar</h2>
          <p className="prose-cafe mt-1 max-w-xl text-sm">Live music, farmers markets, and community gatherings we&rsquo;re part of.</p>
          <div className="mt-4">
            <EventCalendar />
          </div>
        </section>
      </div>
    </div>
  );
}
