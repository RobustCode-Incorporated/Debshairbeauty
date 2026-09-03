# Configuration Stripe — Debs Hair Beauty

Ce fichier sert de checklist pour configurer le compte Stripe de Déborah,
d'abord en **mode test (sandbox)**, puis en **mode live** (argent réel).
Il liste aussi tout le catalogue (prestations + boutique) tel qu'il existe
déjà dans le code, pour référence.

---

## 0. Point important : pas de "produits/abonnements" à créer sur Stripe

Contrairement à ce qu'on pourrait croire, **il n'y a rien à créer manuellement
dans "Produits" ou "Facturation" sur le Dashboard Stripe** pour que les
paiements fonctionnent. Le code (`src/app/api/debs/checkout/route.ts` et
`src/app/api/debs/products/checkout/route.ts`) construit chaque session de
paiement **à la volée**, avec le prix envoyé directement dans la requête
(`price_data`), à partir des fichiers :

- [`src/lib/debs-catalog.ts`](src/lib/debs-catalog.ts) — prix des prestations
- [`src/lib/debs-services.ts`](src/lib/debs-services.ts) — acompte par
  catégorie (si la cliente ne choisit pas une prestation précise)
- [`src/lib/debs-products.ts`](src/lib/debs-products.ts) — produits boutique

**Autrement dit : si demain Déborah change un prix, tu modifies le fichier
`.ts` correspondant — pas besoin de retoucher Stripe.** Stripe ne sert qu'à
encaisser la carte et déclencher la réservation/commande via webhook. Il n'y
a pas non plus d'abonnement récurrent nulle part dans le produit actuel —
chaque paiement est un paiement unique (`mode: 'payment'`), jamais un
`mode: 'subscription'`.

Ce fichier existe donc pour deux choses :
1. Te donner la liste complète du catalogue à titre de référence (utile pour
   vérifier les prix, configurer la TVA, ou comparer aux rapports Stripe).
2. Te guider sur ce qu'il **faut vraiment** configurer côté Stripe : le
   compte, les clés API, le webhook, et les infos de paiement/versement.

---

## 1. Deux flux de paiement à connaître

| Flux | Déclenché quand | Montant facturé |
|---|---|---|
| **Réservation — prestation précise** | La cliente choisit une prestation nommée sur `/debs/prestations` | Prix **complet** de la prestation (`priceEuros` dans `debs-catalog.ts`) |
| **Réservation — catégorie seule** | La cliente réserve juste une catégorie (ex. "Cheveux") sans prestation précise | **Acompte** = prix de départ de la catégorie (`minPriceEuros` dans `debs-services.ts`) |
| **Boutique** | Achat d'un produit sur `/debs` (perruques, mèches, produits de beauté) | Prix du produit × quantité (`debs-products.ts`) — **bloqué tant que `placeholder: true`** |

Les deux flux de réservation, plus la boutique, passent par **le même
webhook** (`/api/debs/checkout/webhook`) qui distingue via
`metadata.kind === 'product_order'`.

⚠️ Rappel : tant qu'un produit boutique a `placeholder: true` (c'est le cas
de tous, y compris les 4 mèches ajoutées récemment), l'API refuse la
commande côté serveur. Il faudra repasser `placeholder` à `false` produit
par produit une fois les vrais noms/tailles/prix confirmés par Déborah —
sinon aucune vente boutique réelle n'est possible même en mode live.

---

## 2. Catalogue complet (référence)

### 2.1 Prestations à la carte (paiement intégral à la réservation)

**Coiffure Afro**
| Prestation | Prix |
|---|---|
| Pose perruque lace | 75€ |
| Pose perruque closure | 60€ |
| Tissage avec closure | 75€ |
| Ponytail | 55€ |
| Rasta | à p.d. 75€ |
| Locks | à p.d. 55€ |
| Twists | à p.d. 55€ |
| Tresses enfant | 50€ |
| Nattes collées | 25€ |

**Pack Mariage**
| Prestation | Prix |
|---|---|
| Essai maquillage | 50€ |
| Pose perruque jour J | 120€ |
| Maquillage jour J | 60€ |
| Retouche soirée | 180€ |
| Pose perruque et chignon | 200€ |
| Tissage chignon | 120€ |

**Beauté du regard**
| Prestation | Prix |
|---|---|
| Microblading | 180€ |
| Microshading | 150€ |
| Retouche | 80€ |
| Combo brow | 200€ |
| Henna brow sourcils | 50€ |
| Browlift | 55€ |
| Rehaussement des sourcils | 45€ |
| Rehaussement des cils | 40€ |
| Extensions des cils | 65€ |
| Volume Russe | 70€ |
| Pose cils simple | 40€ |
| Épilation à la cire des sourcils | 10€ |

**Maquillage**
| Prestation | Prix |
|---|---|
| Maquillage de jour | 50€ |
| Maquillage de soirée | 70€ |
| Maquillage simple | 45€ |

**Coiffure Européen**
| Prestation | Prix |
|---|---|
| Brushing | à p.d. 25€ |
| Coupe à sec | 15€ |
| Coupe transformation | 30€ |
| Shampoing | 20€ |
| Shampoing, coupe, brushing | 45€ |
| Soin Botox | à p.d. 65€ |
| Lissage brésilien | à p.d. 100€ |
| Lissage kératine | à p.d. 100€ |
| Coloration racine | à p.d. 40€ |
| Coloration tête complète | 65€ |
| Transformation balayage, ombré | à p.d. 150€ |
| Extensions de cheveux | à p.d. 300€ |

**Massage**
| Prestation | Prix |
|---|---|
| Massage relaxant 30 min | 45€ |
| Massage aux huiles chaudes 1h | 90€ |
| Massage aux pierres chaudes 1h | 90€ |
| Massage pour enfants 30 min | 40€ |
| Massage en duo 1h | 150€ |

**Beauté des mains**
| Prestation | Prix |
|---|---|
| Manucure simple | 25€ |
| Pose de vernis semi-permanent | 35€ |
| Pose d'ongles en gel | 40€ |

**Beauté des pieds**
| Prestation | Prix |
|---|---|
| Pédicure spa | 50€ |
| Pédicure esthétique | 45€ |

**Blanchiment dentaire** — 100€

**Épilation**
| Prestation | Prix |
|---|---|
| Épilation du maillot | 30€ |
| Épilation du dos entier | 45€ |
| Épilation du visage | 10€ |

### 2.2 Acomptes par catégorie (si pas de prestation précise choisie)

| Catégorie | Acompte |
|---|---|
| Cheveux | 25€ |
| Ongles | 25€ |
| Épilation | 8€ |
| Visage | 40€ |
| Massage | 40€ |
| Maquillage | 150€ |

### 2.3 Boutique (statut : **placeholder**, vente réelle désactivée)

| Produit | Variante | Prix |
|---|---|---|
| Perruque lace front | 18 pouces — Naturel | 180€ |
| Perruque closure | 16 pouces — Bouclée | 140€ |
| Mèches lisses | 22 pouces | 55€ |
| Mèches ondulées | 20 pouces | 45€ |
| Mèches ondulées | 24 pouces | 60€ |
| Mèches bouclées | 18 pouces | 50€ |
| Huile capillaire nourrissante | — | 18€ |
| Crème visage hydratante | — | 22€ |

---

## 3. Configuration en mode SANDBOX (test)

Objectif : valider tout le parcours (réservation + boutique + webhook +
WhatsApp) avec de fausses cartes, sans toucher au compte réel.

### Étape 1 — Récupérer les clés de test
1. Dans le Dashboard Stripe, active le bouton **"Mode test"** (coin en haut
   à droite — indicateur orange).
2. Va dans **Développeurs → Clés API**. Copie la **clé secrète** (commence
   par `sk_test_...`).
3. En local, dans `.env` (jamais commité), remplis :
   ```
   DEBS_STRIPE_SECRET_KEY=sk_test_...
   ```

### Étape 2 — Webhook en local avec Stripe CLI
Le webhook (`/api/debs/checkout/webhook`) doit recevoir les événements
Stripe même en local.
1. Installe la CLI : `brew install stripe/stripe-cli/stripe` (Mac).
2. `stripe login` — connecte-toi au compte Stripe de Déborah.
3. Lance le serveur Next.js en local (`npm run dev`).
4. Dans un autre terminal :
   ```
   stripe listen --forward-to localhost:3000/api/debs/checkout/webhook
   ```
5. La CLI affiche un secret `whsec_...` — mets-le dans `.env` :
   ```
   DEBS_STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Redémarre `npm run dev` pour recharger les variables d'environnement.

### Étape 3 — Tester le parcours réservation
1. Va sur `/debs/prestations`, choisis une prestation, remplis le formulaire
   de réservation.
2. Au paiement, utilise une carte de test Stripe :
   - `4242 4242 4242 4242`, toute date future, tout CVC, tout code postal.
   - Pour tester un refus : `4000 0000 0000 0002`.
   - Pour tester le 3‑D Secure : `4000 0025 0000 3155`.
3. Vérifie que :
   - Le paiement passe côté Stripe (Dashboard → Paiements, en mode test).
   - Le terminal `stripe listen` montre l'événement
     `checkout.session.completed` transmis avec un `200`.
   - Une ligne apparaît dans `debs_appointments` (base Neon/Postgres) avec
     `payment_status = 'PAID'`.
   - Le lien WhatsApp de confirmation se génère (si
     `DEBS_WHATSAPP_NUMBER` est configuré).

### Étape 4 — Tester le parcours boutique
Comme tous les produits ont `placeholder: true`, la commande boutique sera
**refusée intentionnellement** (c'est le garde-fou anti-facturation d'un
article provisoire). Pour tester ce flux en sandbox :
1. Passe temporairement un produit en `placeholder: false` dans
   [`debs-products.ts`](src/lib/debs-products.ts) **sur une branche locale,
   jamais commitée en l'état**.
2. Refais le test d'achat avec la carte `4242 4242 4242 4242`.
3. Vérifie la ligne créée dans `debs_orders`.
4. Remets `placeholder: true` avant de committer quoi que ce soit — les prix
   boutique ne sont pas encore réels.

### Étape 5 — Cas d'erreur à vérifier
- Paiement annulé par la cliente → doit rediriger vers `?booking=annulee`
  ou `?order=annulee`, aucune ligne créée en base.
- Rejouer deux fois le même webhook (Stripe le fait parfois) → aucune
  double réservation (protégé par la contrainte unique sur
  `stripe_session_id`).

---

## 4. Passage en mode LIVE (argent réel)

⚠️ Ne fais cette partie qu'une fois l'étape sandbox validée de bout en bout,
et seulement quand Déborah est prête à encaisser réellement.

### Étape 1 — Activer le compte Stripe
Dans le Dashboard Stripe (bouton "Mode test" désactivé cette fois),
Stripe demandera à Déborah :
- Informations légales de l'entreprise (n° d'entreprise/TVA, adresse,
  représentant légal).
- Coordonnées bancaires pour les **virements (payouts)**.
- Pièce d'identité (vérification KYC).
- Description de l'activité (secteur : salon de coiffure/beauté).

Sans cette activation complète, Stripe autorise les paiements test mais
**bloque les vrais paiements ou les payouts**.

### Étape 2 — Paramètres à vérifier avant le premier vrai paiement
Dans **Paramètres** du Dashboard (mode live) :
- **Informations de l'entreprise / Branding** → logo, nom affiché sur le
  relevé bancaire de la cliente (statement descriptor) — ex. `DEBS HAIR`.
- **Devise** → EUR (déjà codé en dur dans le projet, cohérent).
- **Reçus par e‑mail** → active l'envoi automatique de reçu au client
  (Paramètres → Emails clients).
- **TVA** → si Déborah est assujettie, Stripe Tax peut être activé, mais ce
  n'est pas branché dans le code actuel (les prix sont TTC fixes dans les
  fichiers catalogue) — à voir avec elle/son comptable si un changement de
  prix affiché HT/TTC est nécessaire.
- **Moyens de paiement acceptés** → le code force `payment_method_types:
  ['card']`. Si elle veut Bancontact (courant en Belgique) ou iDEAL, il
  faudra l'ajouter dans le code des deux routes de checkout, pas seulement
  dans le Dashboard.

### Étape 3 — Clés API live
1. **Développeurs → Clés API** (mode live) → copier la clé secrète
   `sk_live_...`.
2. Ne jamais la mettre dans `.env` local ni la committer. Elle va
   uniquement dans les variables d'environnement du projet **Vercel**
   (Production) :
   - `DEBS_STRIPE_SECRET_KEY = sk_live_...`

### Étape 4 — Webhook live
1. Une fois le site déployé sur le domaine final
   (`www.debshairbeauty.com`, cf. `ROADMAP.md`), va dans
   **Développeurs → Webhooks → Ajouter un endpoint** (mode live).
2. URL : `https://www.debshairbeauty.com/api/debs/checkout/webhook`.
3. Événements à écouter : `checkout.session.completed` et
   `checkout.session.async_payment_succeeded` (les deux seuls gérés par le
   code, voir `route.ts` du webhook).
4. Stripe donne un secret de signature `whsec_...` **différent** de celui
   du CLI local → à mettre dans Vercel :
   - `DEBS_STRIPE_WEBHOOK_SECRET = whsec_...`

### Étape 5 — Premier vrai test
1. Fais une vraie réservation avec une vraie carte, pour un petit montant
   (ex. une prestation à 10-15€), toi-même ou Déborah.
2. Vérifie le paiement dans le Dashboard live, la ligne en base, le message
   WhatsApp, et que le virement (payout) apparaît bien programmé vers le
   compte bancaire.
3. Rembourse ce paiement test depuis le Dashboard (Paiements → ... →
   Rembourser) une fois vérifié.

### Étape 6 — Avant d'ouvrir la boutique en vrai
Ne passe **aucun** produit de [`debs-products.ts`](src/lib/debs-products.ts)
à `placeholder: false` tant que Déborah n'a pas confirmé nom exact, prix
réel et disponibilité — le code refuse déjà la vente tant que c'est
`true`, ce qui est voulu.

---

## 5. Suivi une fois en production

- **Payouts** : par défaut Stripe verse automatiquement selon un cycle
  (souvent J+7 pour un nouveau compte, puis plus rapide) — visible dans
  **Solde → Paramètres de virement**.
- **Litiges/contestations (disputes)** : Stripe email Déborah directement ;
  répondre vite avec une preuve (ticket, échange WhatsApp) augmente les
  chances de gagner.
- **Rapports** : Dashboard → **Rapports** exporte les paiements en CSV,
  utile pour la compta.
- **Rotation des clés** : si une clé secrète fuite (ex. poussée par erreur
  dans un commit), la révoquer immédiatement dans Développeurs → Clés API
  et en générer une nouvelle, à remettre dans Vercel.
