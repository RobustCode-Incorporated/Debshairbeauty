# Stratégie SEO — Debs Hair Beauty

## 0. Constat important avant de commencer

Avant toute modification, j'ai mesuré le score SEO de référence (Lighthouse,
catégorie "SEO" uniquement) sur les pages principales, en local, build de
production :

| Page | Score SEO (Lighthouse) |
|---|---|
| `/debs` (page d'accueil réelle) | **100 %** |
| `/debs/prestations` | **100 %** |
| `/debs/commande-confirmee` | **100 %** |
| `/en/debs`, `/nl/debs` | **100 %** |

**Le score demandé (75 %, puis 90 %) est donc déjà dépassé avant toute
implémentation.** Ce n'est pas une erreur de mesure : le score "SEO" de
Lighthouse est un contrôle **technique automatisé** très basique (titre
présent, meta description présente, code de statut HTTP correct, liens
crawlables, `alt` sur les images, `hreflang` valide...). Next.js couvre déjà
la majorité de ces critères par défaut. Il ne mesure **ni** la pertinence du
contenu, **ni** la présence de données structurées correctes (l'audit
`structured-data` est explicitement marqué "manual" — hors score), **ni** le
référencement local réel (Google Business Profile, avis, cohérence
NOM/Adresse/Téléphone), **ni** la vitesse de chargement (catégorie séparée
"Performance").

**Conséquence sur la méthode demandée** : le principe "on teste après chaque
implémentation, on annule si le score baisse" reste appliqué à la lettre —
mais comme le score de référence est déjà au plafond (100 %), l'objectif de
ce protocole devient : **ne jamais faire redescendre ce 100 %** (garde-fou de
non-régression), pendant qu'on implémente les vraies briques utiles pour le
référencement réel du salon — ce qui inclut le point 1 de la demande
(Schema.org), qui ne bouge justement pas le chiffre Lighthouse mais compte
énormément pour Google (rich snippets, Knowledge Panel, pack local "3-pack").

## 1. Ce qui manquait réellement (au-delà du score Lighthouse)

- Pas de `robots.txt` ni de `sitemap.xml`.
- Pas de `metadataBase`, donc pas de `<link rel="canonical">` ni de balises
  `hreflang` complètes et robustes par page.
- Titre/description **identiques sur toutes les pages** (génériques, définis
  une seule fois dans le layout) — mauvais pour le CTR dans les résultats de
  recherche et pour la duplication de contenu perçue par Google.
- Aucune donnée structurée (JSON-LD) : ni `LocalBusiness`/`BeautySalon` (nom,
  adresse, téléphone, horaires, réseaux sociaux), ni `Service` pour le
  catalogue de prestations, ni `Product` pour la boutique.
- Pas d'image Open Graph par défaut pour les partages (WhatsApp, Facebook,
  Instagram bio link...).

## 2. Plan d'implémentation (par étapes testées)

Chaque étape = un commit logique. Après chaque étape : build de production
local + `npx lighthouse` (catégorie SEO) sur `/debs` et `/debs/prestations`.
Si le score baisse en dessous de la référence (100 %), l'étape est annulée
et reprise différemment avant de continuer.

| # | Étape | Score attendu | Statut |
|---|---|---|---|
| 0 | Référence (avant tout changement) | 100 % | ✅ mesuré |
| 1 | `robots.txt` + `sitemap.xml` + `metadataBase` | 100 % | ⚠️→✅ régression détectée et corrigée (voir note) |
| 2 | Canonical + hreflang par page réelle + titres/descriptions uniques (4 langues) sur `/debs` et `/debs/prestations` | 100 % (prod) | ⚠️→✅ voir note |
| 3 | JSON-LD `HairSalon`/`BeautySalon` (site entier) + `Service` (catalogue prestations) + `Product` (boutique, seulement les articles non-placeholder) | ✅ 100 % (confirmé avec hôte de test aligné sur le domaine de prod) | ✅ |

**Validation du JSON-LD (étape 3)** :
1. Script Node : JSON syntaxiquement valide sur `/debs` et `/debs/prestations`, `@context`/`@type` présents sur chaque bloc — ✅ vérifié.
2. Contenu vérifié manuellement : adresse, téléphone, horaires (mardi-samedi, fermé dimanche/lundi) identiques à ceux affichés sur la page ; les 56 prestations du catalogue apparaissent dans `hasOfferCatalog` avec leur nom traduit et leur prix exact ; **aucun `Product` de la boutique n'apparaît** tant que `placeholder: true` (comportement voulu, même garde-fou que l'API d'achat).
3. Reste à faire une fois déployé : coller l'URL réelle dans le [Rich Results Test de Google](https://search.google.com/test/rich-results) — impossible à tester depuis cet environnement local (nécessite une URL publique accessible par Google).

**Note étape 2** : en local, `npx lighthouse` sur `http://localhost:3450/debs`
tombe à 92 % (audit `canonical` en échec, message "Points to another
hreflang location (http://localhost:3450/en/debs)"). J'ai vérifié la cause
exacte dans le code source de l'audit
(`node_modules/lighthouse/core/audits/seo/canonical.js`) : il compare l'URL
réellement visitée à l'ensemble des URLs `hreflang` récoltées — **en
mélangeant deux sources** : mes balises `<link>` HTML (qui pointent, à
raison, vers le vrai domaine de production `www.debshairbeauty.com`) et les
en-têtes HTTP `Link` que le middleware next-intl envoie automatiquement
(qui reflètent, forcément, l'hôte réellement appelé — ici `localhost:3450`).
Ces deux domaines ne peuvent jamais coïncider en local. **Preuve
empirique** : en pointant temporairement `DEBS_SITE_URL` sur
`http://localhost:3450` (rebuild, test, puis immédiatement annulé), le
score remonte à 100 % avec l'audit `canonical` qui passe proprement — ce qui
confirme que le code est correct et que seul l'environnement de test local
crée ce faux négatif. Rien à corriger dans le code ; à revalider une fois en
production sur le vrai domaine (recommandé après déploiement, avec
`npx lighthouse https://www.debshairbeauty.com/debs`).

**Note étape 1** : ajouter un `alternates` générique (`canonical: "/"`) au niveau
du layout a fait chuter `/debs` à 92 % (audit `canonical` en échec) — parce que
le middleware next-intl envoie déjà, via des en-têtes HTTP `Link`, les bons
hreflang **spécifiques à chaque page** (ex. `/en/debs`), alors que mon
`<link>` HTML générique pointait vers la racine du site pour toutes les
pages. Corrigé en retirant l'`alternates` générique du layout (le canonical
par page arrive proprement à l'étape 2) — retour confirmé à 100 %.

## 3. Ce qui reste hors périmètre de ce chantier

- **Vitesse de chargement (Performance)** — catégorie Lighthouse séparée du
  SEO, pas demandée ici, mais Google l'utilise indirectement (Core Web
  Vitals). À traiter dans un chantier dédié si besoin.
- **Google Business Profile** — fiche établissement Google (avis, photos,
  horaires) : c'est un compte externe à créer/gérer par Déborah, hors code.
  C'est pourtant l'un des leviers les plus importants pour un salon local —
  à recommander séparément.
- **Contenu éditorial (blog, articles)** — Lighthouse ne le mesure pas, mais
  c'est un vrai levier SEO à moyen terme, hors périmètre "code" de cette
  session.
- **Pages de confirmation** (`/debs/commande-confirmee`,
  `/debs/reservation-confirmee`) — exclues du sitemap et mises en
  `disallow` dans `robots.txt` : ce sont des pages de remerciement
  post-paiement sans contenu évergreen, jamais liées depuis une autre page
  du site (donc jamais découvertes par un crawler normal), pas de valeur
  SEO à leur donner un titre/description dédié.

## 4. Résumé — fait dans cette session

- ✅ `robots.txt` + `sitemap.xml` (site entier, 4 langues, exclut les pages de confirmation).
- ✅ `metadataBase` + titre/description uniques par page + canonical/hreflang corrects sur `/debs` et `/debs/prestations`, dans les 4 langues.
- ✅ Image Open Graph par défaut pour les partages (WhatsApp, réseaux sociaux).
- ✅ JSON-LD `HairSalon`/`BeautySalon` (adresse, téléphone, horaires réels) sur tout le site.
- ✅ JSON-LD `Service` pour les 56 prestations du catalogue, avec prix, sur `/debs/prestations`.
- ✅ JSON-LD `Product` prêt pour la boutique — s'activera automatiquement dès qu'un produit passe `placeholder: false`.
- Score Lighthouse SEO : **100 % maintenu de bout en bout** (objectif 90 % dépassé dès la référence).
- Fichiers touchés : voir `git status` — rien n'a été committé, à valider et committer quand tu es prête.

## 6. Passe 2 — audit `squirrelscan` (QA site élargi : SEO, a11y, sécurité, perf)

Outil complémentaire à Lighthouse — installé via `curl -fsSL
https://install.squirrelscan.com | bash` (script vérifié : checksum SHA256,
open source, aucune escalade root). Contrairement à Lighthouse (une page à la
fois, catégorie SEO seule), `squirrel audit <url>` crawle plusieurs pages et
note aussi accessibilité, sécurité, performance et légal/E-E-A-T.

**Score global 47-48/100 (F) — chiffre trompeur en local**, pour la même
raison que le "92 %" Lighthouse : plusieurs règles pénalisent le fait de
tester en HTTP sur `localhost` un site dont le sitemap/hreflang pointent (à
raison) vers `https://www.debshairbeauty.com` (HTTPS manquant, "sitemap
domain mismatch", hreflang self-reference). **Ces lignes ne comptent pas une
fois déployé en vrai** — à revalider avec `squirrel audit
https://www.debshairbeauty.com` une fois en ligne.

**Deux vrais bugs trouvés et corrigés dans cette passe** :
- **Deux landmarks `<main>` imbriqués** sur *toutes* les pages (`layout.tsx`
  en a un, chaque page en remettait un second) — cassait la navigation au
  clavier/lecteur d'écran. Corrigé (le `<main>` du layout reste le seul,
  celui des pages devient un `<div>`) → **Accessibilité 49 → 92 (+43)**.
- **Aucun en-tête de sécurité** (`Content-Security-Policy`,
  `X-Frame-Options`) → ajoutés dans `next.config.ts` → **Sécurité 62 → 73
  (+11)**.

**Reste à faire, qui nécessite ton avis (contenu/juridique, pas du code)** :
- Une **Politique de confidentialité** — pas juste du SEO : le site collecte
  des données personnelles (nom, téléphone) et encaisse des paiements via
  Stripe (un sous-traitant au sens RGPD). C'est une obligation légale réelle
  pour un site belge, pas une simple case à cocher. Je n'ai pas rédigé de
  texte à ta place — il faut ton contenu (ou celui d'un juriste).
- Pages **À propos** et **Contact** dédiées (les infos existent déjà sur
  `/debs`, mais des pages séparées aident le référencement et la confiance).

**Reste à faire, optionnel (à prioriser ensemble)** :
- Resserrer la CSP : elle autorise encore `'unsafe-inline'` pour les
  scripts — un vrai renforcement demanderait un système de nonce par requête
  dans `proxy.ts`, un changement plus délicat sur le routage i18n, à traiter
  à part.
- Performance (poids de page 2,3 Mo, images sans `width`/`height`, pas de
  cache HTTP) — volontairement hors périmètre du chantier SEO initial.
- `llms.txt` (équivalent `robots.txt` pour les agents IA) — mineur.

## 7. Comment retester après coup

```bash
npm run build
PORT=3450 npm run start &
npx lighthouse http://localhost:3450/debs --only-categories=seo \
  --output=json --output-path=./report.json \
  --chrome-flags="--headless --no-sandbox" --quiet
node -e "console.log(require('./report.json').categories.seo.score * 100 + '%')"
```
