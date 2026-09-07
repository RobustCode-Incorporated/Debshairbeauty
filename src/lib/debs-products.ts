// Boutique catalogue — perruques, mèches, produits de beauté vendus à
// récupérer au salon (pas de livraison). Single source of truth for both
// display (`/debs`) and the product-checkout API (authoritative price —
// never trust a client-sent amount, same rule as `debs-catalog.ts`).
//
// ⚠️ TOUTES les fiches ci-dessous sont des EXEMPLES PROVISOIRES
// (`placeholder: true`) : noms, tailles et prix inventés le temps que
// Déborah fournisse le vrai catalogue. Le bouton d'achat reste désactivé
// côté UI *et* le endpoint de paiement refuse la commande côté serveur tant
// qu'un produit a `placeholder: true` — impossible de facturer un client
// pour un article encore provisoire. Pour publier un vrai produit : mets à
// jour ses champs avec les vraies données et passe `placeholder` à `false`.

export type DebsProductSize = { label: string; priceEuros: number };

export type DebsProduct = {
  id: string;
  category: "Perruques" | "Mèches" | "Produits de beauté";
  name: string;
  variant?: string;
  priceEuros: number;
  /** When set, the boutique card shows a size grid instead of a fixed price — `priceEuros` above becomes the "starting from" price (the cheapest size). */
  sizes?: DebsProductSize[];
  image: string;
  placeholder: boolean;
};

// Shared by every hair-extension product (wigs, closures, bundles) — same
// size range and pricing across the board, confirmed by Déborah.
export const HAIR_SIZE_GRID: DebsProductSize[] = [
  { label: '8"', priceEuros: 30 },
  { label: '10"', priceEuros: 37 },
  { label: '12"', priceEuros: 40 },
  { label: '14"', priceEuros: 45 },
  { label: '15"', priceEuros: 50 },
  { label: '16"', priceEuros: 60 },
  { label: '18"', priceEuros: 65 },
  { label: '20"', priceEuros: 75 },
  { label: '22"', priceEuros: 80 },
  { label: '24"', priceEuros: 90 },
  { label: '26"', priceEuros: 100 },
  { label: '30"', priceEuros: 110 },
];

const HAIR_STARTING_PRICE = HAIR_SIZE_GRID[0].priceEuros;

export const DEBS_PRODUCTS: DebsProduct[] = [
  {
    id: "perruque-lace-18-naturelle",
    category: "Perruques",
    name: "Perruque lace front",
    variant: "Naturel",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/lace-360.jpeg",
    placeholder: true,
  },
  {
    id: "perruque-closure-16-bouclee",
    category: "Perruques",
    name: "Perruque closure",
    variant: "Set of 3 — Curly",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/download (6).webp",
    placeholder: true,
  },
  {
    id: "meche-lisse-22",
    category: "Mèches",
    name: "Mèches bouclées",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/meche-lisse.jpeg",
    placeholder: true,
  },
  {
    id: "meche-ondulee-20",
    category: "Mèches",
    name: "Mèches ondulées",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/meche-ondulee-1.jpeg",
    placeholder: true,
  },
  {
    id: "meche-ondulee-24",
    category: "Mèches",
    name: "Mèches ondulées",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/meche-ondulee-2.jpeg",
    placeholder: true,
  },
  {
    id: "meche-bouclee-18",
    category: "Mèches",
    name: "Mèches lisses",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/meche-bouclee.jpeg",
    placeholder: true,
  },
  {
    id: "lace-frontale",
    category: "Mèches",
    name: "Lace frontale",
    variant: "13x4 — Lisse",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/lace-frontale.jpeg",
    placeholder: true,
  },
  {
    id: "closure",
    category: "Mèches",
    name: "Closure",
    variant: "4x4 — Ondulée",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/closure.jpeg",
    placeholder: true,
  },
  {
    id: "lace-360",
    category: "Mèches",
    name: "Lace 360",
    variant: "Bouclée",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/lace-360.jpeg",
    placeholder: true,
  },
  {
    id: "bundles",
    category: "Mèches",
    name: "Bundles",
    variant: "16 inches — Curly",
    priceEuros: HAIR_STARTING_PRICE,
    sizes: HAIR_SIZE_GRID,
    image: "/lace-360.jpeg",
    placeholder: true,
  },
  {
    id: "soin-huile-cheveux",
    category: "Produits de beauté",
    name: "Huile capillaire nourrissante",
    priceEuros: 18,
    image: "/download (2).webp",
    placeholder: true,
  },
  {
    id: "creme-visage-hydratante",
    category: "Produits de beauté",
    name: "Crème visage hydratante",
    priceEuros: 22,
    image: "/download.webp",
    placeholder: true,
  },
];

export const DEBS_PRODUCT_CATEGORIES: DebsProduct["category"][] = ["Perruques", "Mèches", "Produits de beauté"];

export function getDebsProduct(id: string): DebsProduct | null {
  return DEBS_PRODUCTS.find((product) => product.id === id) ?? null;
}
