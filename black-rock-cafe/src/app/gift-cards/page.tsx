import type { Metadata } from "next";
import GiftCardPurchase from "@/components/GiftCardPurchase";

export const metadata: Metadata = {
  title: "Digital Gift Cards",
  description: "Send a Black Rock Cafe digital gift card — perfect for local grinds fans in Pahoa, Hawaiʻi.",
};

export default function GiftCardsPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">Digital Gift Cards</h1>
      <p className="prose-cafe mt-3 max-w-2xl">Delivered by email, redeemable in-house.</p>
      <div className="mt-10 max-w-2xl">
        <GiftCardPurchase />
      </div>
    </div>
  );
}
