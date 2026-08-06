import type { Metadata } from "next";
import MenuFilterableList from "@/components/MenuFilterableList";
import QRCodeMenu from "@/components/QRCodeMenu";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Black Rock Cafe's full menu — burgers, plate lunches, Loco Moco, pizza, pasta and more, with allergen filters. Best breakfast and burgers in Pahoa, Hawaiʻi.",
};

export default function MenuPage() {
  return (
    <div className="container-cafe py-16">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="section-heading">Menu</h1>
          <p className="prose-cafe mt-3 max-w-2xl">
            Big-portion local grinds from Pahoa&rsquo;s own Black Rock Cafe.
            Filter out allergens or search for a favorite below.
          </p>
        </div>
        <QRCodeMenu url="https://blackrockcafepahoa.example.com/menu" label="Scan for this menu on your phone" />
      </div>

      <div className="mt-10">
        <MenuFilterableList />
      </div>
    </div>
  );
}
