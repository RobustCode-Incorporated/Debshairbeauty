// Single source of truth for Debs Hair Beauty's bookable categories and the
// deposit charged at booking time. Imported by both the public page (display)
// and the checkout API route (authoritative price — never trust a client-sent
// amount).

export type DebsServiceCategory = {
  id: string;
  name: string;
  /** Starting price for the category, in euros. Charged as the booking deposit. */
  minPriceEuros: number;
  priceLabel: string;
  items: string[];
};

export const DEBS_SERVICE_CATEGORIES: DebsServiceCategory[] = [
  {
    id: "Cheveux",
    name: "Cheveux",
    minPriceEuros: 25,
    priceLabel: "25€ – 55€",
    items: ["Brushing", "Coupe & coiffage", "Extensions & pose de perruque", "Lissage / kératine", "Coloration"],
  },
  {
    id: "Ongles",
    name: "Ongles",
    minPriceEuros: 25,
    priceLabel: "25€ – 70€",
    items: ["Manucure", "Pédicure", "Pose gel"],
  },
  {
    id: "Épilation",
    name: "Épilation",
    minPriceEuros: 8,
    priceLabel: "8€ – 36€",
    items: ["Cire visage", "Cire corps", "Épilation sourcils"],
  },
  {
    id: "Visage",
    name: "Visage",
    minPriceEuros: 40,
    priceLabel: "Dès 40€",
    items: ["Soin du visage", "Microblading", "Blanchiment dentaire"],
  },
  {
    id: "Massage",
    name: "Massage",
    minPriceEuros: 40,
    priceLabel: "Dès 40€",
    items: ["Massage relaxant"],
  },
  {
    id: "Maquillage",
    name: "Maquillage",
    minPriceEuros: 150,
    priceLabel: "150€",
    items: ["Maquillage mariée"],
  },
];

export function getDebsCategory(id: string): DebsServiceCategory | null {
  return DEBS_SERVICE_CATEGORIES.find((category) => category.id === id) ?? null;
}
