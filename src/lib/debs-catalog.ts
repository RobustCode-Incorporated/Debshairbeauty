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
  /** True when the service is temporarily closed to booking. */
  unavailable?: boolean;
  /**
   * Minutes to block for this service. Cross-referenced from
   * https://www.treatwell.be/en/place/debs-hair-beauty-1/ (2026-09-07) by
   * matching service name — Treatwell's own prices sometimes differ from
   * ours (that's a separate, real discrepancy worth asking Déborah about;
   * duration itself shouldn't move with price). Ranges shown on Treatwell
   * (e.g. "30 mins - 1 hr") use the upper bound, so a booking never blocks
   * less time than the service could actually take. `undefined` = no
   * reliable match found — still needs a real answer from Déborah before
   * duration-aware slot conflicts can use it.
   */
  durationMinutes?: number;
};

type CatalogSection = {
  categoryLabel: string;
  items: Array<[name: string, priceEuros: number, startingFrom?: boolean, durationMinutes?: number, unavailable?: boolean]>;
};

const CATALOG_SECTIONS: CatalogSection[] = [
  {
    categoryLabel: "Coiffure Afro",
    items: [
      ["Pose perruque lace simple", 75, undefined, 60],
      ["Pose perruque lace pro", 90, undefined, 60],
      ["Pose perruque closure", 60, undefined, 60],
      ["Tissage avec closure", 75, undefined, 60],
      ["Tissage", 75, undefined, 60],
      ["Ponytail", 65],
      ["Ponytail avec lace", 90],
      ["Flip over", 75],
      ["Rasta", 75, true],
      ["Locks", 55, true],
      ["Twists", 55, true],
      ["Tresses enfant", 50],
      ["Nattes collées", 50],
      ["Natte tourniquet", 25],
      ["Défrisage cheveux", 30],
    ],
  },
  {
    categoryLabel: "Pack Mariage",
    items: [
      ["Essai maquillage", 50],
      ["Pose perruque jour J", 120],
      ["Maquillage jour J", 60],
      ["Retouche soirée", 180],
      ["Pose perruque et chignon", 200, undefined, 60],
      ["Tissage chignon", 120],
    ],
  },
  {
    categoryLabel: "Beauté du regard",
    items: [
      ["Microblading", 200],
      ["Microshading", 200],
      ["Retouche", 80],
      ["Combo brow", 200],
      ["Henna brow sourcils", 50],
      ["Browlift", 55],
      ["Rehaussement des sourcils", 45, undefined, 60],
      ["Rehaussement des cils", 40, undefined, 60],
      ["Extensions des cils", 65, undefined, undefined, true],
      ["Volume Russe", 70, undefined, undefined, true],
      ["Pose cils simple", 40, undefined, undefined, true],
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
      ["Brushing", 25, true, 60],
      ["Coupe à sec", 15],
      ["Coupe transformation", 30],
      ["Shampoing", 20],
      ["Shampoing, coupe, brushing", 45, undefined, 90],
      ["Soin Botox", 65, true],
      ["Lissage brésilien", 100, true, 180],
      ["Lissage kératine", 100, true, 180],
      ["Lissage indien", 100, true],
      ["Coloration racine", 40, undefined, 150],
      ["Coloration tête complète", 65, true],
      ["Transformation balayage, ombré", 150, true],
      ["Extensions de cheveux", 300, true],
    ],
  },
  {
    categoryLabel: "Massage",
    items: [
      ["Massage relaxant 30 min", 45, undefined, 30],
      ["Massage aux huiles chaudes 1h", 90, undefined, 60],
      ["Massage aux pierres chaudes 1h", 90, undefined, 60],
      ["Massage pour enfants 30 min", 40, undefined, 30],
      ["Massage en duo 1h", 150, undefined, 60],
    ],
  },
  {
    categoryLabel: "Beauté des mains",
    items: [
      ["Manucure simple", 25, undefined, 30],
      ["Pose de vernis semi-permanent", 30, undefined, 30],
      ["Pose d'ongles en gel", 40, undefined, 80],
    ],
  },
  {
    categoryLabel: "Beauté des pieds",
    items: [
      ["Pédicure spa", 50, undefined, 30],
      ["Pédicure esthétique", 45, undefined, 30],
    ],
  },
  {
    categoryLabel: "Blanchiment dentaire",
    items: [
      ["Blanchiment dentaire", 50, undefined, 40],
      ["Strass dentaire", 15],
    ],
  },
  {
    categoryLabel: "Épilation",
    items: [
      ["Épilation du maillot", 30],
      ["Épilation du dos entier", 45, undefined, 30],
      ["Épilation du visage", 10, undefined, 30],
      ["Épilation jambe complète", 45],
      ["Épilation demi-jambe", 35],
      ["Épilation à la cire des sourcils", 10, undefined, 15],
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
  section.items.map(([name, priceEuros, startingFrom, durationMinutes, unavailable]) => ({
    id: `${slugify(section.categoryLabel)}--${slugify(name)}`,
    categoryLabel: section.categoryLabel,
    name,
    priceEuros,
    startingFrom,
    durationMinutes,
    unavailable,
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
