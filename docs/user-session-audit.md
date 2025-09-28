# Audit de la gestion d'authentification & du data fetching

## 1. Symptômes observés
- Les pages `/shop`, `/store`, `/entrainements` et `/compte` peuvent rester bloquées sur un état « Chargement… » ou afficher du contenu vide après un retour sur un onglet inactif ou lorsque plusieurs onglets sont ouverts simultanément.
- Le composant `Header` continue de recevoir un utilisateur non nul, ce qui indique que l'hydratation de la session côté contexte fonctionne mais que les requêtes de données ne repartent pas.

## 2. Faiblesses identifiées

### 2.1 Gestion de la session (`UserContext`)
- Le `UserProvider` ne distinguait pas les origines des rafraîchissements de session et n'offrait pas de moyen explicite de relancer une synchronisation. Les hooks de données ne pouvaient donc pas forcer un `getSession()` au retour sur un onglet.
- Le provider n'écoutait pas les évènements `visibilitychange` / `focus`. Sur les retours depuis le mode veille ou un onglet inactif, aucune requête `getSession()` n'était déclenchée.

### 2.2 Hooks de données (`ShopPage`, `ShopGrid`, `usePrograms`)
- Les hooks bloquaient leurs requêtes tant que `user == null`, mais n'avaient pas de mécanisme de relance automatique lorsque l'utilisateur redevenait disponible après une longue inactivité.
- `usePrograms` créait son propre client Supabase via `createClient()` au lieu de réutiliser celui fourni par le provider. On obtenait bien le même singleton dans la plupart des cas, mais cela empêchait de mutualiser un rafraîchissement de session centralisé.
- Les effets `useEffect` de ces hooks ne se déclenchaient que sur des changements de dépendances (filtre, utilisateur). Un simple retour sur l'onglet ne déclenchait pas de re-fetch.

### 2.3 Visibilité et synchronisation multi-onglets
- Aucun mécanisme générique ne relançait les requêtes lors d'un passage d'un onglet inactif à actif. Les évènements `storage` de Supabase ne sont pas systématiquement émis dans ce scénario, d'où le blocage observé.

## 3. Corrections architecturales proposées

### 3.1 Renforcer `UserContext`
- Introduire un logger scoping pour mieux suivre le cycle de vie (`createScopedLogger`).
- Exposer une méthode `refreshSession(origin)` dans le contexte pour permettre aux composants clients de forcer une résolution.
- Ecouter `visibilitychange` et `focus` pour déclencher un `getSession()` lorsqu'un onglet redevient visible.

### 3.2 Hook utilitaire `useVisibilityRefetch`
- Nouveau hook partagé permettant d'exécuter un callback à chaque fois que la fenêtre retrouve le focus ou redevient visible.
- Ce hook est utilisé par le provider, les pages sensibles et les hooks de données pour rafraîchir la session et relancer les requêtes.

### 3.3 Harmonisation des hooks de données
- `usePrograms` s'appuie désormais sur `useSupabase()` et `refreshSession()` pour rester aligné sur l'état global.
- `ShopPage` et `ShopGrid` réagissent aux évènements de visibilité pour relancer les requêtes et faire un `refreshSession()` avant de recharger les données.
- Ajout d'un logging systématique dans `ShopPage`, `ShopGrid`, `usePrograms` et `EntrainementsPage` pour tracer les raisons d'un non-fetch (auth pas prête, absence d'utilisateur, erreur Supabase, etc.).

## 4. Plan de correction détaillé

1. **Instrumentation & monitoring**
   - Introduire `createScopedLogger` (`src/utils/logger.ts`) pour uniformiser les logs côté client.
   - Ajouter `useVisibilityRefetch` (`src/hooks/useVisibilityRefetch.ts`) et l'utiliser dans `UserProvider`, `ShopPage`, `ShopGrid`, `usePrograms`.

2. **Fiabiliser le provider d'utilisateur**
   - Ajouter `refreshSession` au contexte et l'exposer à toute l'application.
   - Factoriser les appels `applySession` / `resolveSession` pour éviter les duplications et enregistrer systématiquement la source des mises à jour (auth change, storage, visibility, etc.).

3. **Synchroniser les hooks de données**
   - `ShopPage` : relancer `refreshFilters` et `fetchTotalCount` à chaque focus/visibilité et déclencher `refreshSession` pour revalider le token.
   - `ShopGrid` : idem pour les programmes, avec logs détaillés.
   - `usePrograms` : utiliser le client du provider, ajouter un logger et relancer automatiquement les programmes lors d'un retour sur l'onglet.

4. **Observabilité côté pages sensibles**
   - Ajouter des logs ciblés dans `EntrainementsPage` pour suivre les rafraîchissements déclenchés par BroadcastChannel ou par hydratation du `localStorage`.

5. **Étapes suivantes (si besoin de corrections supplémentaires)**
   - Exploiter la méthode `refreshSession` dans d'autres écrans protégés (`/store`, `/compte`) pour uniformiser la logique.
   - Envisager l'ajout d'un état de chargement global (ex. `authStatus: "idle" | "resolving" | "ready"`) si des écrans doivent afficher un skeleton tant que le provider est en cours de résolution.
   - Centraliser le suivi des erreurs Supabase (Sentry, console) pour détecter rapidement les `JWT expired` ou erreurs réseau.

Ces ajustements donnent une base plus robuste pour supporter les scénarios multi-onglets / onglets inactifs tout en fournissant la télémétrie nécessaire pour comprendre rapidement où se situe le blocage si un cas edge persiste.
