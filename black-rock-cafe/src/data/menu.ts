import type { MenuCategory } from "./types";

/**
 * Transcribed from the physical Black Rock Cafe menu (Pahoa, HI).
 * Allergen tags are a best-effort read of ingredients as printed — the
 * kitchen should verify/own this list before it drives real allergen
 * filtering for guests with medical dietary restrictions.
 */
export const menu: MenuCategory[] = [
  {
    id: "burgers",
    name: "Burgers",
    note: "All burgers are 1/3 lb. fresh local island beef, char-broiled to your preference, on a toasted bun with mayonnaise, lettuce, tomato, onion & pickle. Served with your choice of fries, onion rings, macaroni salad, or tossed greens.",
    items: [
      { id: "hamburger", name: "Hamburger", description: "The classic, char-broiled to order.", price: 12.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "cheeseburger", name: "Cheeseburger", description: "Hamburger topped with melted cheese.", price: 13.95, allergens: ["gluten", "egg", "dairy"], diet: [] },
      { id: "bacon-cheeseburger", name: "Bacon Cheeseburger", description: "Cheeseburger with crisp bacon.", price: 15.95, allergens: ["gluten", "egg", "dairy", "pork"], diet: [] },
      { id: "mushroom-swiss", name: "Mushroom & Swiss", description: "Sauteed mushrooms and Swiss cheese.", price: 15.95, allergens: ["gluten", "egg", "dairy"], diet: [] },
      { id: "chili-cheese-burger", name: "Chili Cheese Burger", description: "Topped with house chili and melted cheese.", price: 15.95, allergens: ["gluten", "egg", "dairy"], diet: [] },
      { id: "dble-cheeseburger", name: "Dble Cheeseburger", description: "Double patty, double cheese.", price: 17.95, allergens: ["gluten", "egg", "dairy"], diet: [] },
      { id: "gravy-burger", name: "Gravy Burger", description: "Smothered in brown gravy.", price: 13.50, allergens: ["gluten", "egg", "dairy"], diet: [] },
      { id: "crispy-chicken-burger", name: "Crispy Chicken Burger", description: "Breaded, fried chicken breast.", price: 13.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "grilled-teri-chicken", name: "Grilled Teri Chicken", description: "Grilled chicken glazed in teriyaki.", price: 14.95, allergens: ["gluten", "egg", "soy"], diet: [] },
      { id: "shrimp-burger", name: "Shrimp Burger", description: "Breaded shrimp patty.", price: 14.95, allergens: ["gluten", "egg", "shellfish"], diet: [] },
      { id: "garden-burger", name: "Garden Burger", description: "Vegetarian patty on a toasted bun.", price: 13.95, allergens: ["gluten", "egg"], diet: ["vegetarian"] },
      { id: "grilled-chicken-breast", name: "Grilled Chicken Breast", description: "Char-broiled chicken breast.", price: 14.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "chicken-club-burger", name: "Chicken Club Burger", description: "Grilled chicken, bacon, and cheese.", price: 17.95, allergens: ["gluten", "egg", "dairy", "pork"], diet: [] },
      { id: "dbl-cheeseburger-bacon", name: "Dbl Cheeseburger w/Bacon", description: "Double patty, cheese, and bacon.", price: 20.95, allergens: ["gluten", "egg", "dairy", "pork"], diet: [] },
    ],
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    note: "Served with your choice of fries, onion rings, macaroni salad, or tossed greens.",
    items: [
      { id: "kalua-pork-sandwich", name: "Kalua Pork Sandwich", description: "Served with grilled onions & brown gravy or barbeque sauce.", price: 13.95, allergens: ["gluten", "pork"], diet: [] },
      { id: "french-dip", name: "French Dip", description: "Thinly sliced prime rib on a hoagie roll, served with au jus.", price: 16.95, allergens: ["gluten"], diet: [] },
      { id: "reuben", name: "Reuben", description: "Sliced corned beef, Swiss cheese & sauerkraut on rye. Choice of Thousand Island or horseradish mustard.", price: 14.95, allergens: ["gluten", "dairy", "egg"], diet: [] },
      { id: "teriyaki-steak-sandwich", name: "Teriyaki Steak Sandwich", description: "Served with lettuce, tomato, onion & pickle.", price: 14.95, allergens: ["gluten", "soy"], diet: [] },
      { id: "fish-sandwich", name: "Fish Sandwich", description: "Catch of the day with lettuce, tomato, onion & pickle.", price: 14.95, allergens: ["gluten", "fish", "egg"], diet: [] },
      { id: "grill-cheese", name: "Grill Cheese Sandwich", description: "Add ham for 5.95.", price: 8.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
      { id: "blt", name: "BLT on Toast", description: "Bacon, lettuce, and tomato on toast.", price: 11.95, allergens: ["gluten", "pork"], diet: [] },
      { id: "club-sandwich", name: "Club Sandwich", description: "Turkey, bacon, Swiss, tomato & lettuce on toast.", price: 14.95, allergens: ["gluten", "dairy", "pork"], diet: [] },
      { id: "patty-melt", name: "Patty Melt", description: "Grilled onions & Swiss cheese on rye.", price: 14.95, allergens: ["gluten", "dairy"], diet: [] },
    ],
  },
  {
    id: "submarines",
    name: "Submarines",
    note: "Served with your choice of fries, onion rings, macaroni salad, or tossed greens.",
    items: [
      { id: "cheese-steak", name: "Cheese Steak", description: "Thinly sliced rib steak, sauteed onions, green peppers & mozzarella.", price: 14.95, allergens: ["gluten", "dairy"], diet: [] },
      { id: "teriyaki-cheese-steak", name: "Teriyaki Cheese Steak", description: "Our own invention — the classic cheese steak with teriyaki-flavored beef.", price: 14.95, allergens: ["gluten", "dairy", "soy"], diet: [] },
      { id: "italian-sausage-sub", name: "Italian Sausage", description: "Slightly hot Italian sausage with sauteed onions & green peppers.", price: 14.95, allergens: ["gluten", "pork"], diet: ["spicy"] },
      { id: "meatball-sub", name: "Meat Ball", description: "Served with marinara sauce & mozzarella cheese.", price: 14.95, allergens: ["gluten", "dairy", "egg"], diet: [] },
      { id: "hot-veggie-sub", name: "Hot Veggie Sub", description: "Sauteed onions, green peppers & mushrooms with melted mozzarella.", price: 14.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
    ],
  },
  {
    id: "other-favorites",
    name: "Other Favorites",
    items: [
      { id: "loco-moco", name: "Loco Moco", description: "Hamburger patty over rice, smothered in gravy, topped with a fried egg.", price: 10.95, allergens: ["egg", "dairy"], diet: [] },
      { id: "chicken-loco", name: "Chicken Loco", description: "Chicken over rice, smothered in gravy, topped with a fried egg.", price: 10.95, allergens: ["egg", "dairy"], diet: [] },
      { id: "spam-loco", name: "Spam Loco", description: "Spam over rice, smothered in gravy, topped with a fried egg.", price: 10.95, allergens: ["egg", "pork", "soy"], diet: [] },
      { id: "portuguese-loco", name: "Portuguese Loco", description: "Portuguese sausage over rice, smothered in gravy, topped with a fried egg.", price: 10.95, allergens: ["egg", "pork"], diet: [] },
      { id: "double-loco", name: "Double Loco", description: "Two hamburger patties, gravy, and a fried egg over rice.", price: 14.95, allergens: ["egg", "dairy"], diet: [] },
      { id: "double-chicken-loco", name: "Double Chicken Loco", description: "Double chicken, gravy, and a fried egg over rice.", price: 14.95, allergens: ["egg", "dairy"], diet: [] },
      { id: "chili-rice", name: "Chili and Rice", description: "House chili over rice. Add cheese & onions for 2.95.", price: 8.95, allergens: [], diet: ["vegetarian-option"] },
      { id: "kalua-pork-loco", name: "Kalua Pork Loco", description: "Kalua pork, gravy, and a fried egg over rice.", price: 11.95, allergens: ["egg", "pork"], diet: [] },
    ],
  },
  {
    id: "pork",
    name: "Pork",
    items: [
      { id: "baby-back-ribs", name: "Baby Back Pork Ribs", description: "A half rack, slow-cooked for hours in our special beer sauce, then baked with BBQ sauce.", price: 23.95, allergens: ["pork", "gluten"], diet: [] },
      { id: "pork-roast-merlot", name: "Pork Roast Merlot", description: "Simmered in Merlot wine, garlic, and mushrooms, topped with our Merlot gravy.", price: 20.95, allergens: ["pork", "dairy"], diet: [] },
    ],
  },
  {
    id: "combos",
    name: "Combos",
    items: [
      { id: "mauka-makai", name: "Mauka Makai", description: "Four ounces of New York strip and catch of the day — broiled, grilled, sauteed, or with three large sauteed shrimp.", price: 24.95, allergens: ["fish", "shellfish"], diet: [] },
      { id: "oriental-platter", name: "Oriental Platter", description: "Korean chicken, teriyaki beef, and fried shrimp.", price: 24.95, allergens: ["shellfish", "soy", "gluten"], diet: [] },
    ],
  },
  {
    id: "ala-carte",
    name: "Ala Carte Meals",
    items: [
      { id: "spaghetti-marinara", name: "Spaghetti Marinara", description: "Our own marinara sauce, served with garlic bread.", price: 14.95, allergens: ["gluten"], diet: ["vegetarian"] },
      { id: "spaghetti-meat", name: "Spaghetti with Meatballs or Italian Sausage", description: "Served with garlic bread.", price: 16.95, allergens: ["gluten", "pork", "egg"], diet: [] },
      { id: "fettuccine-alfredo", name: "Fettuccine Alfredo", description: "Homemade sauce with fresh mushrooms and parmesan, served with garlic bread.", price: 16.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
      { id: "chicken-alfredo", name: "Chicken Alfredo", description: "Boneless, skinless chicken breast in our homemade alfredo with fresh mushrooms.", price: 20.95, allergens: ["gluten", "dairy"], diet: [] },
      { id: "shrimp-alfredo", name: "Shrimp Alfredo", description: "Six pieces of shrimp in homemade alfredo with fresh mushrooms.", price: 21.95, allergens: ["gluten", "dairy", "shellfish"], diet: [] },
      { id: "shrimp-scampi", name: "Shrimp Scampi", description: "Large shrimp sauteed in garlic butter, lemon, mushrooms, tomatoes, capers & white wine with parmesan, over pasta.", price: 21.95, allergens: ["gluten", "dairy", "shellfish"], diet: [] },
      { id: "chicken-marsala", name: "Our Chicken Marsala", description: "Boneless chicken sauteed in garlic butter, mushrooms, marinara, and Marsala wine over pasta.", price: 20.95, allergens: ["gluten", "dairy"], diet: [] },
      { id: "hawaiian-stroganoff", name: "Hawaiian Stroganoff", description: "Prime rib, mushrooms, tomatoes, and our own stroganoff sauce over pasta.", price: 21.95, allergens: ["gluten", "dairy"], diet: [] },
    ],
  },
  {
    id: "pizzas",
    name: "Pizzas",
    note: "Toppings: pepperoni, Italian sausage, ham, Portuguese sausage, Canadian bacon, mushrooms, black olives, onions, green peppers, jalapeno, tomatoes, pineapple, anchovies, extra cheese.",
    items: [
      { id: "pizza-small", name: "Small Cheese Pizza (9\")", description: "Additional toppings $1.75 each.", price: 11.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
      { id: "pizza-large", name: "Large Cheese Pizza (15\")", description: "Additional toppings $2.75 each.", price: 19.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
    ],
  },
  {
    id: "plate-lunches",
    name: "Plate Lunches",
    note: "Served with double scoop rice and macaroni salad, or 1 scoop rice and tossed greens. Based on availability.",
    items: [
      { id: "meat-loaf", name: "Meat Loaf", description: "House-made meat loaf.", price: 14.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "beef-stew", name: "Beef Stew", description: "Slow-simmered local beef stew.", price: 14.95, allergens: [], diet: [] },
      { id: "korean-chicken", name: "Boneless Korean Chicken", description: "Sweet and savory Korean-style chicken.", price: 14.95, allergens: ["soy"], diet: [] },
      { id: "oyster-chicken", name: "Boneless Oyster Chicken", description: "Chicken in oyster sauce.", price: 14.95, allergens: ["shellfish", "soy"], diet: [] },
      { id: "roast-pork", name: "Roast Pork", description: "Slow-roasted pork.", price: 14.95, allergens: ["pork"], diet: [] },
      { id: "chicken-katsu", name: "Chicken Katsu", description: "Panko-breaded fried chicken cutlet.", price: 14.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "pork-adobo", name: "Pork Adobo", description: "Filipino-style braised pork.", price: 14.95, allergens: ["pork", "soy"], diet: [] },
      { id: "beef-stir-fry", name: "Beef Stir Fry", description: "Wok-tossed beef and vegetables.", price: 14.95, allergens: ["soy"], diet: [] },
      { id: "chicken-stir-fry", name: "Chicken Stir Fry", description: "Wok-tossed chicken and vegetables.", price: 14.95, allergens: ["soy"], diet: [] },
      { id: "kalua-pig-cabbage", name: "Kalua Pig & Cabbage", description: "Traditional Hawaiian smoked pork with cabbage.", price: 14.95, allergens: ["pork"], diet: [] },
      { id: "mixed-platter", name: "Mixed Platter", description: "A sampling of our plate lunch favorites.", price: 16.95, allergens: ["gluten", "pork", "soy"], diet: [] },
    ],
  },
  {
    id: "keiki-senior",
    name: "Keikis & Seniors",
    items: [
      { id: "keiki-chicken-strips", name: "Chicken Strips & French Fries", description: "", price: 8.95, allergens: ["gluten"], diet: [] },
      { id: "keiki-fish", name: "Fish & French Fries", description: "", price: 8.95, allergens: ["gluten", "fish"], diet: [] },
      { id: "keiki-katsu", name: "Chicken Katsu & French Fries", description: "", price: 8.95, allergens: ["gluten", "egg"], diet: [] },
      { id: "keiki-spaghetti", name: "Spaghetti with Marinara", description: "", price: 8.95, allergens: ["gluten"], diet: ["vegetarian"] },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      { id: "dessert-selection", name: "Ask Your Server", description: "Assorted pies, fried ice cream, banana foster, and a rotating selection of ice cream desserts.", price: 0, priceLabel: "Varies", allergens: ["gluten", "dairy", "egg"], diet: [] },
    ],
  },
  {
    id: "sides-soups",
    name: "Side Orders & Soups",
    items: [
      { id: "soup-of-day", name: "Soup of the Day", description: "", price: 8.95, allergens: [], diet: [] },
      { id: "rice", name: "Rice (1 scoop)", description: "", price: 1.00, allergens: [], diet: ["vegetarian"] },
      { id: "biscuit", name: "Biscuit", description: "", price: 4.95, allergens: ["gluten", "dairy"], diet: ["vegetarian"] },
      { id: "dinner-salad", name: "Dinner Salad", description: "", price: 5.95, allergens: [], diet: ["vegetarian"] },
      { id: "macaroni-salad", name: "Macaroni Salad", description: "", price: 3.95, allergens: ["gluten", "egg", "dairy"], diet: ["vegetarian"] },
      { id: "baked-potato", name: "Baked Potato", description: "", price: 5.95, allergens: [], diet: ["vegetarian"] },
      { id: "loaded-baked", name: "Loaded Baked Potato", description: "", price: 8.95, allergens: ["dairy", "pork"], diet: [] },
      { id: "garlic-mash-gravy", name: "Garlic Mash & Gravy", description: "", price: 6.95, allergens: ["dairy"], diet: ["vegetarian"] },
      { id: "hot-veggies", name: "Hot Veggies", description: "", price: 5.95, allergens: [], diet: ["vegetarian"] },
      { id: "brown-gravy", name: "Brown Gravy", description: "", price: 2.95, allergens: [], diet: [] },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    items: [
      { id: "soft-drink", name: "Soft Drinks", description: "Free refills.", price: 3.75, allergens: [], diet: ["vegetarian"] },
      { id: "coffee", name: "Coffee", description: "Free refills.", price: 3.75, allergens: [], diet: ["vegetarian"] },
      { id: "hot-tea", name: "Hot Tea", description: "", price: 3.75, allergens: [], diet: ["vegetarian"] },
      { id: "hot-cocoa", name: "Hot Cocoa", description: "", price: 3.75, allergens: ["dairy"], diet: ["vegetarian"] },
      { id: "juice", name: "Juice", description: "", price: 3.75, allergens: [], diet: ["vegetarian"] },
      { id: "milk", name: "Milk", description: "", price: 3.75, allergens: ["dairy"], diet: ["vegetarian"] },
    ],
  },
];

export const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "Gluten",
  dairy: "Dairy",
  shellfish: "Shellfish",
  fish: "Fish",
  egg: "Egg",
  soy: "Soy",
  pork: "Pork",
  "tree-nut": "Tree Nut",
};
