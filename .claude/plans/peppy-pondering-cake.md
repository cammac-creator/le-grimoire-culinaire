# Plan : 12 améliorations pour Le Grimoire Culinaire

## Contexte

L'app fonctionne bien mais manque de fonctionnalités utilisateur, de robustesse technique et de performance. La fonctionnalité police manuscrite est mise de côté. On implémente 12 améliorations regroupées en 3 axes : fonctionnalités, code/performance, architecture.

---

## Ordre d'implémentation global

| Phase | # | Amélioration | Complexité |
|-------|---|-------------|-----------|
| A | 6 | Code splitting | Faible |
| A | 10 | Error boundaries | Faible |
| A | 12 | CORS restriction | Faible |
| B | 3 | Conversion de portions | Faible |
| B | 11 | Optimistic updates (likes/comments) | Moyenne |
| B | 8 | Optimisation images | Moyenne |
| C | 4 | Minuteur intégré | Moyenne |
| C | 9 | Tests (Vitest) | Moyenne |
| D | 7 | Pagination serveur (infinite scroll) | Élevée |
| D | 2 | Liste de courses | Élevée |
| E | 1 | Import depuis URL | Moyenne |
| E | 5 | PWA / Mode hors-ligne | Moyenne |

---

## Phase A — Quick wins techniques

### 6. Code splitting — `vite.config.ts`

Ajouter `build.rollupOptions.output.manualChunks` :
- `pdf-renderer` : `@react-pdf/renderer` et deps
- `pdf-viewer` : `pdfjs-dist`
- `font-tools` : `opentype.js`, `imagetracerjs`
- `ui-vendor` : tous les `@radix-ui/*`
- `react-vendor` : `react-dom`

Objectif : index de 719KB → ~250KB, chunks lourds chargés uniquement à la navigation.

### 10. Error boundaries

**Créer :**
- `src/components/ErrorBoundary.tsx` — Class component avec `resetError()`, prop `fallback` (render prop ou ReactNode)
- `src/components/ErrorFallback.tsx` — `DefaultErrorFallback` (message FR + bouton Réessayer), `ImageErrorFallback` (icône placeholder)
- `src/components/QueryErrorBoundary.tsx` — Intègre `useQueryErrorResetBoundary` de TanStack Query

**Modifier :**
- `src/App.tsx` — Envelopper `<Routes>` dans `<ErrorBoundary>`, ajouter `<QueryErrorBoundary>` sur les routes lazy
- `src/components/recipe/RecipeCard.tsx` — `onError` sur `<img>` avec fallback
- `src/components/recipe/RecipeDetail.tsx` — Idem pour les images

### 12. CORS restriction — Edge Functions

**Créer :**
- `supabase/functions/_shared/cors.ts` — `getCorsHeaders(req)` lit `ALLOWED_ORIGINS` env var, valide l'origin de la requête, retourne le header exact. Fallback localhost si non configuré.

**Modifier :**
- `supabase/functions/ocr-recipe/index.ts` — Remplacer `CORS_HEADERS` statique par import de `_shared/cors.ts`
- `supabase/functions/extract-characters/index.ts` — Idem

**Config :** `supabase secrets set ALLOWED_ORIGINS="https://le-grimoire-culinaire.vercel.app,http://localhost:5173"`

---

## Phase B — UX et robustesse

### 3. Conversion de portions

**Créer :**
- `src/lib/portion-scaler.ts` — `parseQuantity(str)` (gère "1/2", "1,5", fractions), `formatQuantity(value, unit)` (500g→0.5kg, arrondi intelligent), `scaleIngredients(ingredients, original, target)`
- `src/components/recipe/ServingsAdjuster.tsx` — Boutons +/- avec reset, min=1

**Modifier :**
- `src/components/recipe/RecipeDetail.tsx` — `useState(targetServings)`, `useMemo` pour `scaleIngredients()`, remplacer le texte statique "X personnes" par `<ServingsAdjuster>`

Pas de dépendance npm, pas de changement DB.

### 11. Optimistic updates

**Créer :**
- `src/components/ui/toast.tsx` + `src/components/ui/toaster.tsx` + `src/hooks/useToast.ts` — Composants toast shadcn/ui (utilise `@radix-ui/react-toast` déjà installé)

**Modifier :**
- `src/hooks/useLikes.ts` — Pattern `onMutate`/`onError`/`onSettled` :
  - `onMutate` : cancel queries, sauvegarder prev, mettre à jour cache optimistiquement
  - `onError` : rollback avec le contexte
  - `onSettled` : `invalidateQueries` pour re-sync
  - `toggleLike.mutate({ wasLiked })` — Passer l'état actuel en variable pour éviter la race condition (le cache est déjà modifié dans onMutate)
- `src/components/appreciation/LikeButton.tsx` — Adapter l'appel `toggleLike({ wasLiked: hasLiked })`
- `src/components/appreciation/CommentSection.tsx` — Commentaire optimiste temporaire avec `id: temp-${Date.now()}`, vider le champ dans `onMutate`, toast d'erreur sur rollback
- `src/App.tsx` — Ajouter `<Toaster />`

### 8. Optimisation images

**Créer :**
- `src/lib/image-resize.ts` — `resizeImage(file, maxWidth, quality)` via Canvas API, sortie WebP

**Modifier :**
- `src/components/upload/ImageUploader.tsx` — Upload 3 versions : thumb (400px), full (1200px), orig
- `src/lib/utils.ts` — `getImageUrl(path, bucket, size?)` avec suffixe `-thumb`/`-full`
- `src/components/recipe/RecipeCard.tsx` — `loading="lazy"`, `decoding="async"`, URL thumb avec fallback `onError`
- `src/components/recipe/RecipeDetail.tsx` — `loading="lazy"` sur les images

Quick win immédiat : ajouter `loading="lazy"` partout avant même le redimensionnement.

---

## Phase C — Fonctionnalités et tests

### 4. Minuteur intégré

**Créer :**
- `src/lib/time-parser.ts` — `extractTimers(steps)` : regex FR ("cuire 15 minutes", "1h30", "pendant 30 min", plages "20 à 25 min")
- `src/hooks/useTimer.ts` — State avec `Map<id, TimerState>`, `setInterval` avec correction drift (`Date.now()`), Notification API + audio
- `src/components/timer/StepTimer.tsx` — Bouton inline "⏱ 15 min" dans chaque étape
- `src/components/timer/TimerWidget.tsx` — Widget flottant (position fixed, bas droite), barre de progression, play/pause/reset, mode mini

**Modifier :**
- `src/components/recipe/RecipeDetail.tsx` — `extractTimers(recipe.steps)` via `useMemo`, afficher `<StepTimer>` par étape, monter `<TimerWidget>`

### 9. Tests (Vitest)

**Installer :** `bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom`

**Créer :**
- `vitest.config.ts` — Environment happy-dom, globals, setup, alias @/, css: false
- `src/test/setup.ts` — Import `@testing-library/jest-dom/vitest`, cleanup afterEach
- `src/lib/__tests__/utils.test.ts` — `formatDuration`, `getMainImage`, `cn`
- `src/lib/__tests__/validators.test.ts` — `loginSchema`, `recipeSchema`
- `src/lib/__tests__/portion-scaler.test.ts` — `parseQuantity`, `scaleIngredients`
- `src/lib/__tests__/time-parser.test.ts` — `extractTimers`
- `src/components/recipe/__tests__/RecipeCard.test.tsx` — Rendu titre, badges, catégorie

**Modifier :**
- `package.json` — Ajouter `"test": "vitest"`, `"test:run": "vitest run"`

---

## Phase D — Features complexes

### 7. Pagination serveur (infinite scroll)

**Créer :**
- `src/hooks/useInfiniteRecipes.ts` — `useInfiniteQuery` avec `.range(from, to)`, `PAGE_SIZE=12`, `getNextPageParam` basé sur la taille du résultat
- `src/components/recipe/RecipeGrid.tsx` — Grille réutilisable avec `IntersectionObserver` (rootMargin 200px), skeleton loading, sentinel div

**Modifier :**
- `src/pages/Home.tsx` — Remplacer `useRecipes(24)` par `useInfiniteRecipes`, utiliser `<RecipeGrid>`
- `src/pages/MyRecipes.tsx` — `useInfiniteMyRecipes` + `<RecipeGrid>`
- `src/pages/Search.tsx` — `useInfiniteSearch` + `<RecipeGrid>`
- `src/pages/Favorites.tsx` — `useInfiniteFavorites` + `<RecipeGrid>`
- `src/hooks/useSearch.ts` — Ajouter `useInfiniteSearch`
- `src/hooks/useLikes.ts` — Ajouter `useInfiniteFavorites`

**Conserver** `useRecipes`/`useMyRecipes` simples pour `BookBuilder` (besoin de tout charger).

### 2. Liste de courses

**Créer :**
- `src/lib/ingredient-merge.ts` — `mergeIngredients(recipes[])` : normaliser noms, convertir unités compatibles (kg→g, cl→ml, c.à.s→ml), sommer, garder séparés si incompatibles. Réutilise `parseQuantity()` de `portion-scaler.ts`.
- `src/hooks/useShoppingList.ts` — State + `localStorage`, fonctions: addRecipe, removeRecipe, toggleItem, clearList
- `src/pages/ShoppingList.tsx` — Liste groupée par catégorie, checkboxes, boutons Imprimer/Partager/Vider
- `src/components/recipe/AddToShoppingList.tsx` — Bouton panier (icône ShoppingCart) avec badge

**Modifier :**
- `src/App.tsx` — Route `/shopping-list`
- `src/components/layout/Header.tsx` — Lien "Courses" avec badge compteur
- `src/components/recipe/RecipeDetail.tsx` — Bouton "Ajouter à la liste de courses"

---

## Phase E — Features avancées

### 1. Import depuis URL

**Créer :**
- `supabase/functions/scrape-recipe/index.ts` — Fetch HTML, nettoyer (retirer script/style/nav), tronquer à 15000 chars, envoyer à Claude Sonnet 4 avec prompt d'extraction structurée → même format `OcrResult`
- `src/hooks/useScrape.ts` — Même pattern que `useOcr.ts` (mutation, fetch Edge Function)
- `src/pages/ImportUrl.tsx` — Champ URL + bouton, aperçu résultat, pré-remplir `RecipeForm`

**Modifier :**
- `src/App.tsx` — Route `/import-url`
- `src/components/layout/Header.tsx` — Lien "Import URL"
- `supabase/functions/scrape-recipe/index.ts` importera `_shared/cors.ts` (phase A)

### 5. PWA / Mode hors-ligne

**Installer :** `bun add -D vite-plugin-pwa`

**Créer :**
- `public/manifest.json` — name, short_name, icons, display: standalone, theme_color
- `public/icons/` — Icônes 192x192 et 512x512 (classique + maskable)
- `src/components/layout/OfflineIndicator.tsx` — Bannière "Mode hors-ligne" (event listeners online/offline)

**Modifier :**
- `vite.config.ts` — Ajouter `VitePWA({ registerType: 'autoUpdate', workbox: { runtimeCaching: [...] } })` :
  - API Supabase : NetworkFirst (cache 24h, timeout 5s)
  - Images Storage : CacheFirst (cache 30j, max 200 entries)
- `index.html` — `<link rel="manifest">`, meta tags PWA, apple-touch-icon
- `src/App.tsx` — Ajouter `<OfflineIndicator />`

---

## Dépendances npm totales

```bash
# Production : aucune nouvelle
# Dev :
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom vite-plugin-pwa
```

## Fichiers à supprimer (nettoyage feature police)

Optionnel, si l'utilisateur confirme :
- `src/components/font/CharacterPicker.tsx`
- `src/components/font/FontPreview.tsx`
- `src/components/font/HandwritingText.tsx`
- `src/pages/FontCreator.tsx`
- `src/lib/character-extractor.ts`
- `src/lib/font-generator.ts`
- `supabase/functions/extract-characters/`
- Route `/font-creator` dans `App.tsx`
- Lien "Polices" dans `Header.tsx`
- Deps `opentype.js` et `imagetracerjs` dans `package.json`

## Vérification

1. **Build** : `bun run build` sans erreur TS, vérifier taille des chunks
2. **Tests** : `bun run test:run` passe
3. **Navigation** : toutes les routes fonctionnent, lazy loading OK
4. **Error boundary** : simuler une erreur de rendu → fallback FR avec bouton Réessayer
5. **Likes optimistes** : cliquer like → UI instantanée, couper réseau → rollback + toast
6. **Portions** : ajuster les portions → quantités recalculées correctement
7. **Timer** : étape avec durée → bouton timer → notification à la fin
8. **Infinite scroll** : Home/Search/MyRecipes chargent par pages de 12
9. **Images** : nouvelles images uploadées en 3 tailles, lazy loading sur les cards
10. **Liste de courses** : ajouter 2 recettes → ingrédients fusionnés intelligemment
11. **Import URL** : coller un lien Marmiton → recette pré-remplie
12. **PWA** : Lighthouse PWA audit pass, offline indicator fonctionne
13. **CORS** : requête depuis un domaine non autorisé → bloquée
