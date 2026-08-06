import type { Metadata } from "next";
import LoyaltyPunchCard from "@/components/LoyaltyPunchCard";
import BirthdayClubForm from "@/components/BirthdayClubForm";

export const metadata: Metadata = {
  title: "VIP Club & Rewards",
  description: "Join Black Rock Cafe's VIP Club — free birthday meal, points on every purchase, monthly giveaways, and a secret menu.",
};

const PERKS = [
  { title: "Free Birthday Meal", desc: "Join the Birthday Club and get a free entrée during your birthday month." },
  { title: "Points on Every Purchase", desc: "Earn points on every order, redeemable for food, merch, or gift cards." },
  { title: "Monthly Giveaways", desc: "VIP members are auto-entered into our monthly giveaway drawing." },
  { title: "Burger of the Month", desc: "Get first access — and a discount — on each month's featured burger." },
  { title: "Secret Menu", desc: "Unlock off-menu items once you hit VIP status." },
];

export default function LoyaltyPage() {
  return (
    <div className="container-cafe py-16">
      <h1 className="section-heading">VIP Club & Rewards</h1>
      <p className="prose-cafe mt-3 max-w-2xl">
        Sign up is free. This page demonstrates the member experience — wire
        the perks below into a real loyalty backend to launch.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          {PERKS.map((p) => (
            <div key={p.title} className="card-surface p-5">
              <h2 className="font-semibold text-white">{p.title}</h2>
              <p className="prose-cafe mt-1 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <LoyaltyPunchCard />

          <BirthdayClubForm />
        </div>
      </div>
    </div>
  );
}
