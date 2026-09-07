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

// Per-texture grids for the plain mèches (individuel bundle pricing from
// Déborah's official price list — "lots 3 pcs" pricing exists too but isn't
// used here since these cards sell single bundles).
export const MECHE_LISSE_SIZE_GRID: DebsProductSize[] = [
  { label: '14"', priceEuros: 35 },
  { label: '16"', priceEuros: 40 },
  { label: '18"', priceEuros: 45 },
  { label: '20"', priceEuros: 45 },
  { label: '22"', priceEuros: 45 },
  { label: '24"', priceEuros: 55 },
  { label: '26"', priceEuros: 55 },
  { label: '28"', priceEuros: 60 },
];

export const MECHE_ONDULEE_SIZE_GRID: DebsProductSize[] = [
  { label: '18"', priceEuros: 45 },
  { label: '20"', priceEuros: 50 },
  { label: '22"', priceEuros: 50 },
  { label: '24"', priceEuros: 55 },
  { label: '26"', priceEuros: 55 },
  { label: '28"', priceEuros: 60 },
];

// Only one size point on the official price list (Kinky Curly, individuel).
export const MECHE_BOUCLEE_SIZE_GRID: DebsProductSize[] = [{ label: '18"', priceEuros: 50 }];

// Per-product grids for the "Closure et Lace 100% cheveux humain" trio —
// each has its own sizes/pricing, confirmed by Déborah, distinct from the
// per-texture mèches grids above.
export const LACE_360_SIZE_GRID: DebsProductSize[] = [
  { label: '14"', priceEuros: 65 },
  { label: '16"', priceEuros: 70 },
  { label: '18"', priceEuros: 75 },
  { label: '20"', priceEuros: 85 },
];

export const CLOSURE_SIZE_GRID: DebsProductSize[] = [
  { label: '14"', priceEuros: 35 },
  { label: '16"', priceEuros: 40 },
  { label: '18"', priceEuros: 45 },
  { label: '20"', priceEuros: 50 },
];

export const LACE_FRONTALE_SIZE_GRID: DebsProductSize[] = [
  { label: '14"', priceEuros: 50 },
  { label: '16"', priceEuros: 60 },
  { label: '18"', priceEuros: 70 },
  { label: '20"', priceEuros: 75 },
];

export const DEBS_PRODUCTS: DebsProduct[] = [
  {
    id: "perruque-lace-18-naturelle",
    category: "Perruques",
    name: "Perruque lace front",
    variant: "Naturel",
    priceEuros: LACE_360_SIZE_GRID[0].priceEuros,
    sizes: LACE_360_SIZE_GRID,
    image: "/lace-360.jpeg",
    placeholder: false,
  },
  {
    id: "closure",
    category: "Perruques",
    name: "Closure",
    variant: "5x5 — Ondulée",
    priceEuros: CLOSURE_SIZE_GRID[0].priceEuros,
    sizes: CLOSURE_SIZE_GRID,
    image: "/closure.jpeg",
    placeholder: false,
  },
  {
    id: "lace-frontale",
    category: "Perruques",
    name: "Lace frontale",
    variant: "13x4 — Lisse",
    priceEuros: LACE_FRONTALE_SIZE_GRID[0].priceEuros,
    sizes: LACE_FRONTALE_SIZE_GRID,
    image: "/lace-frontale.jpeg",
    placeholder: false,
  },
  {
    id: "meche-lisse-22",
    category: "Mèches",
    name: "Mèches bouclées",
    priceEuros: MECHE_BOUCLEE_SIZE_GRID[0].priceEuros,
    sizes: MECHE_BOUCLEE_SIZE_GRID,
    image: "/meche-lisse.jpeg",
    placeholder: false,
  },
  {
    id: "meche-ondulee-20",
    category: "Mèches",
    name: "Mèches ondulées",
    priceEuros: MECHE_ONDULEE_SIZE_GRID[0].priceEuros,
    sizes: MECHE_ONDULEE_SIZE_GRID,
    image: "/meche-ondulee-1.jpeg",
    placeholder: false,
  },
  {
    id: "meche-bouclee-18",
    category: "Mèches",
    name: "Mèches lisses",
    priceEuros: MECHE_LISSE_SIZE_GRID[0].priceEuros,
    sizes: MECHE_LISSE_SIZE_GRID,
    image: "/meche-bouclee.jpeg",
    placeholder: false,
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
  {
    id: "soraali-huile-demaquillante",
    category: "Produits de beauté",
    name: "Soraali — Huile démaquillante & nettoyante",
    variant: "Bio — 120 ml",
    priceEuros: 35,
    image: "/soraali-huile-demaquillante.jpeg",
    placeholder: false,
  },
  {
    id: "soraali-huile-figue-de-barbarie",
    category: "Produits de beauté",
    name: "Soraali — Huile de pépins de figue de Barbarie",
    variant: "Bio — 30 ml",
    priceEuros: 55,
    image: "/soraali-huile-figue-de-barbarie.jpeg",
    placeholder: false,
  },
];

export const DEBS_PRODUCT_CATEGORIES: DebsProduct["category"][] = ["Perruques", "Mèches", "Produits de beauté"];

export function getDebsProduct(id: string): DebsProduct | null {
  return DEBS_PRODUCTS.find((product) => product.id === id) ?? null;
}
