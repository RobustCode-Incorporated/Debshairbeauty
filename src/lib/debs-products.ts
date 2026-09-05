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

export type DebsProduct = {
  id: string;
  category: "Perruques" | "Mèches" | "Produits de beauté";
  name: string;
  variant?: string;
  priceEuros: number;
  image: string;
  placeholder: boolean;
};

export const DEBS_PRODUCTS: DebsProduct[] = [
  {
    id: "perruque-lace-18-naturelle",
    category: "Perruques",
    name: "Perruque lace front",
    variant: "18 pouces — Naturel",
    priceEuros: 180,
    image: "/download (3).webp",
    placeholder: true,
  },
  {
    id: "perruque-closure-16-bouclee",
    category: "Perruques",
    name: "Perruque closure",
    variant: "16 pouces — Bouclée",
    priceEuros: 140,
    image: "/download (6).webp",
    placeholder: true,
  },
  {
    id: "meche-lisse-22",
    category: "Mèches",
    name: "Mèches lisses",
    variant: "22 pouces",
    priceEuros: 55,
    image: "/meche-lisse.jpeg",
    placeholder: true,
  },
  {
    id: "meche-ondulee-20",
    category: "Mèches",
    name: "Mèches ondulées",
    variant: "20 pouces",
    priceEuros: 45,
    image: "/meche-ondulee-1.jpeg",
    placeholder: true,
  },
  {
    id: "meche-ondulee-24",
    category: "Mèches",
    name: "Mèches ondulées",
    variant: "24 pouces",
    priceEuros: 60,
    image: "/meche-ondulee-2.jpeg",
    placeholder: true,
  },
  {
    id: "meche-bouclee-18",
    category: "Mèches",
    name: "Mèches bouclées",
    variant: "18 pouces",
    priceEuros: 50,
    image: "/meche-bouclee.jpeg",
    placeholder: true,
  },
  {
    id: "lace-frontale",
    category: "Mèches",
    name: "Lace frontale",
    variant: "13x4 — Lisse",
    priceEuros: 120,
    image: "/lace-frontale.jpeg",
    placeholder: true,
  },
  {
    id: "closure",
    category: "Mèches",
    name: "Closure",
    variant: "4x4 — Ondulée",
    priceEuros: 90,
    image: "/closure.jpeg",
    placeholder: true,
  },
  {
    id: "lace-360",
    category: "Mèches",
    name: "Lace 360",
    variant: "Bouclée",
    priceEuros: 150,
    image: "/lace-360.jpeg",
    placeholder: true,
  },
  {
    id: "bundles",
    category: "Mèches",
    name: "Bundles",
    variant: "Lot de 3 — Bouclée",
    priceEuros: 130,
    image: "/bundles.jpeg",
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
