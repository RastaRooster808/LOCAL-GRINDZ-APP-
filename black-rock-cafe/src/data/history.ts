import type { TimelineEntry } from "./types";

/**
 * Sourced from the "Black Rock Cafe / Pahoa Has an Extremely Interesting
 * History" placard displayed in the restaurant (statistics credited to
 * "Pahoa Yesterday" by Hiro Sato). Transcribed and lightly expanded for
 * the web with era groupings for the interactive timeline.
 */
export const historyTimeline: TimelineEntry[] = [
  {
    year: "Pre-contact",
    yearSort: 0,
    title: "A dense ʻōhiʻa rainforest",
    description:
      "Before the arrival of outsiders, Pahoa and its surroundings were a dense tropical rainforest, with native ʻōhiʻa trees growing in excess of 100 feet tall.",
    era: "ancient",
  },
  {
    year: "1852",
    yearSort: 1852,
    title: "Chinese immigration begins",
    description:
      "The first wave of the immigrant communities that would shape Pahoa arrives, drawn by Hawaii's growing agricultural economy.",
    era: "settlement",
  },
  {
    year: "1868",
    yearSort: 1868,
    title: "Japanese immigration",
    description: "Japanese families settle in the Puna district, many working the land that would become sugar and diversified agriculture.",
    era: "settlement",
  },
  {
    year: "1878",
    yearSort: 1878,
    title: "Portuguese immigration",
    description: "Portuguese immigrants arrive, bringing traditions — including foods — still felt on local plate lunches today.",
    era: "settlement",
  },
  {
    year: "1880s",
    yearSort: 1880,
    title: "Norwegian, German & Spanish immigration",
    description:
      "Norwegian (1880), German (1881), and Spanish (1889) immigrants continue the wave of settlement that built Puna's plantation towns.",
    era: "settlement",
  },
  {
    year: "1891",
    yearSort: 1891,
    title: "Coffee trees planted",
    description: "One of Pahoa's earliest agricultural \"firsts\" — coffee trees are planted in the district.",
    era: "plantation",
  },
  {
    year: "1895",
    yearSort: 1895,
    title: "Pahoa School opens",
    description: "The one-room Pahoa School opens its doors, the beginning of formal education in the district.",
    era: "plantation",
  },
  {
    year: "1903",
    yearSort: 1903,
    title: "Korean immigration",
    description: "Korean families join Puna's growing, multicultural plantation community.",
    era: "plantation",
  },
  {
    year: "1906",
    yearSort: 1906,
    title: "Filipino immigration",
    description: "Filipino immigrants arrive, becoming one of the largest and most enduring communities in Puna.",
    era: "plantation",
  },
  {
    year: "1908",
    yearSort: 1908,
    title: "Rubber plantation",
    description: "Pahoa becomes home to a rubber plantation — a short-lived but notable chapter in the district's agricultural experiments.",
    era: "plantation",
  },
  {
    year: "1925",
    yearSort: 1925,
    title: "First automobiles",
    description: "The automobile arrives in Pahoa, beginning the slow shift away from rail and foot travel.",
    era: "plantation",
  },
  {
    year: "1929",
    yearSort: 1929,
    title: "The telephone arrives",
    description: "Pahoa is connected by telephone for the first time.",
    era: "plantation",
  },
  {
    year: "1938",
    yearSort: 1938,
    title: "Electricity comes to Pahoa",
    description: "The town is electrified, transforming daily life and small business.",
    era: "plantation",
  },
  {
    year: "1962",
    yearSort: 1962,
    title: "A modern water system",
    description: "Pahoa gets a piped water system, one of the last major infrastructure \"firsts\" of the plantation era.",
    era: "plantation",
  },
  {
    year: "1980s",
    yearSort: 1980,
    title: "Sugar — then diversified agriculture",
    description:
      "Sugar replaces ʻōhiʻa (once harvested for railroad ties and lumber) as Hawaii's number one industry. By the eighties, Pahoa becomes a forerunner of diversified agriculture — orchids, papaya, banana, and pineapple are now sold commercially.",
    era: "modern",
  },
  {
    year: "1998",
    yearSort: 1998,
    title: "Black Rock Cafe opens",
    description:
      "Black Rock Cafe opens its doors in Pahoa town, joining a community shaped by a century of immigration, plantation life, and hard-won \"firsts.\"",
    era: "cafe",
  },
  {
    year: "Today",
    yearSort: 3000,
    title: "The last frontier in Hawaii",
    description:
      "Pahoa is still known as \"the last frontier in Hawaii\" — a place of lava, ʻōhiʻa forest, farmers markets, and community. Black Rock Cafe remains a gathering place at the center of it, welcoming locals and visitors alike.",
    era: "cafe",
  },
];

export const historySource = {
  title: "Statistics from \"Pahoa Yesterday\" by Hiro Sato",
  note: "Transcribed from the historical placard displayed in Black Rock Cafe.",
};
