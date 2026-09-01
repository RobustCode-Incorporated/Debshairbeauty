// Full à-la-carte service catalogue for Debs Hair Beauty, transcribed from the
// salon's printed price list (2026-09-01). Distinct from `debs-services.ts`,
// which only groups services into six broad categories for the homepage
// cards and the deposit-checkout flow. This file is the authoritative price
// for a *specific* named service (used by `/debs/prestations` and the
// catalogue-aware checkout path in `POST /api/debs/checkout`).
//
// Prices here are charged in FULL online at booking (not a category
// "starting price" acompte) — see ROADMAP-DEBS-SALON.md Phase 4 for why.

export type DebsCatalogItem = {
  id: string;
  categoryLabel: string;
  name: string;
  priceEuros: number;
  /** True when the printed price is a starting price ("à.p.d" — à partir de). */
  startingFrom?: boolean;
};

type CatalogSection = {
  categoryLabel: string;
  items: Array<[name: string, priceEuros: number, startingFrom?: boolean]>;
};

const CATALOG_SECTIONS: CatalogSection[] = [
  {
    categoryLabel: "Coiffure Afro",
    items: [
      ["Pose perruque lace", 75],
      ["Pose perruque closure", 60],
      ["Tissage avec closure", 75],
      ["Ponytail", 55],
      ["Rasta", 75, true],
      ["Locks", 55, true],
      ["Twists", 55, true],
      ["Tresses enfant", 50],
      ["Nattes collées", 25],
    ],
  },
  {
    categoryLabel: "Pack Mariage",
    items: [
      ["Essai maquillage", 50],
      ["Pose perruque jour J", 120],
      ["Maquillage jour J", 60],
      ["Retouche soirée", 180],
      ["Pose perruque et chignon", 200],
      ["Tissage chignon", 120],
    ],
  },
  {
    categoryLabel: "Beauté du regard",
    items: [
      ["Microblading", 180],
      ["Microshading", 150],
      ["Retouche", 80],
      ["Combo brow", 200],
      ["Henna brow sourcils", 50],
      ["Browlift", 55],
      ["Rehaussement des sourcils", 45],
      ["Rehaussement des cils", 40],
      ["Extensions des cils", 65],
      ["Volume Russe", 70],
      ["Pose cils simple", 40],
      ["Épilation à la cire des sourcils", 10],
    ],
  },
  {
    categoryLabel: "Maquillage",
    items: [
      ["Maquillage de jour", 50],
      ["Maquillage de soirée", 70],
      ["Maquillage simple", 45],
    ],
  },
  {
    categoryLabel: "Coiffure Européen",
    items: [
      ["Brushing", 25, true],
      ["Coupe à sec", 15],
      ["Coupe transformation", 30],
      ["Shampoing", 20],
      ["Shampoing, coupe, brushing", 45],
      ["Soin Botox", 65, true],
      ["Lissage brésilien", 100, true],
      ["Lissage kératine", 100, true],
      ["Coloration racine", 40, true],
      ["Coloration tête complète", 65],
      ["Transformation balayage, ombré", 150, true],
      ["Extensions de cheveux", 300, true],
    ],
  },
  {
    categoryLabel: "Massage",
    items: [
      ["Massage relaxant 30 min", 45],
      ["Massage aux huiles chaudes 1h", 90],
      ["Massage aux pierres chaudes 1h", 90],
      ["Massage pour enfants 30 min", 40],
      ["Massage en duo 1h", 150],
    ],
  },
  {
    categoryLabel: "Beauté des mains",
    items: [
      ["Manucure simple", 25],
      ["Pose de vernis semi-permanent", 35],
      ["Pose d'ongles en gel", 40],
    ],
  },
  {
    categoryLabel: "Beauté des pieds",
    items: [
      ["Pédicure spa", 50],
      ["Pédicure esthétique", 45],
    ],
  },
  {
    categoryLabel: "Blanchiment dentaire",
    items: [["Blanchiment dentaire", 100]],
  },
  {
    categoryLabel: "Épilation",
    items: [
      ["Épilation du maillot", 30],
      ["Épilation du dos entier", 45],
      ["Épilation du visage", 10],
    ],
  },
];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const DEBS_CATALOG: DebsCatalogItem[] = CATALOG_SECTIONS.flatMap((section) =>
  section.items.map(([name, priceEuros, startingFrom]) => ({
    id: `${slugify(section.categoryLabel)}--${slugify(name)}`,
    categoryLabel: section.categoryLabel,
    name,
    priceEuros,
    startingFrom,
  })),
);

export const DEBS_CATALOG_SECTIONS: Array<{ categoryLabel: string; items: DebsCatalogItem[] }> =
  CATALOG_SECTIONS.map((section) => ({
    categoryLabel: section.categoryLabel,
    items: DEBS_CATALOG.filter((item) => item.categoryLabel === section.categoryLabel),
  }));

export function getDebsCatalogItem(id: string): DebsCatalogItem | null {
  return DEBS_CATALOG.find((item) => item.id === id) ?? null;
}
