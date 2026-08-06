export type Allergen =
  | "gluten"
  | "dairy"
  | "shellfish"
  | "fish"
  | "egg"
  | "soy"
  | "pork"
  | "tree-nut";

export type DietTag = "vegetarian" | "vegetarian-option" | "spicy" | "gluten-free-option";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel?: string;
  allergens: Allergen[];
  diet: DietTag[];
}

export interface MenuCategory {
  id: string;
  name: string;
  note?: string;
  items: MenuItem[];
}

export interface TimelineEntry {
  year: string;
  yearSort: number;
  title: string;
  description: string;
  era: "ancient" | "settlement" | "plantation" | "modern" | "cafe";
}

export interface Review {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  source: "Google";
  date: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: "live-music" | "farmers-market" | "community" | "cafe";
  description: string;
}
