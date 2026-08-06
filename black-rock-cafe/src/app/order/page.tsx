import type { Metadata } from "next";
import OrderClient from "@/components/OrderClient";

export const metadata: Metadata = {
  title: "Order Online",
  description: "Order Black Rock Cafe's local grinds online for pickup — burgers, plate lunches, Loco Moco, and more.",
};

export default function OrderPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Order Online</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        Demo ordering flow — build your cart below. This isn&rsquo;t wired to
        a live POS yet; see the README for the integration point.
      </p>
      <div className="mt-10">
        <OrderClient />
      </div>
    </div>
  );
}
