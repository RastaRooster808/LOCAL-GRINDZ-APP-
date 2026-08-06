export interface HawaiianWord {
  word: string;
  meaning: string;
  note?: string;
}

/**
 * A small ʻōlelo Hawaiʻi glossary relevant to the site and menu — offered
 * with respect, not as a substitute for professional translation. Expand
 * with guidance from a fluent speaker/cultural advisor before treating this
 * as authoritative multi-language content.
 */
export const hawaiianWords: HawaiianWord[] = [
  { word: "ʻOhana", meaning: "Family", note: "Including the community that gathers at the cafe." },
  { word: "ʻĀina", meaning: "Land", note: "The land that feeds Puna's farms." },
  { word: "ʻŌhiʻa", meaning: "Native Hawaiian tree", note: "Once grew over 100 feet tall across Pahoa before harvest for lumber." },
  { word: "Mauka", meaning: "Toward the mountain" },
  { word: "Makai", meaning: "Toward the sea" },
  { word: "Kalua", meaning: "To bake in an underground oven", note: "As in kalua pork/pig." },
  { word: "Keiki", meaning: "Child / children" },
  { word: "Pau hana", meaning: "After work / done with work" },
  { word: "Mahalo", meaning: "Thank you" },
  { word: "Aloha", meaning: "Love, hello, goodbye — a way of being" },
];
