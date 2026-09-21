/**
 * Utilitaires pour la génération de slugs d'URL optimisés pour le SEO et le GEO
 * (Search Engine Optimization & Generative Engine Optimization / Moteurs IA).
 */

/**
 * Génère un slug d'URL propre, lisible et performant pour le SEO et les moteurs IA (GEO).
 * 
 * Traitements appliqués :
 * 1. Décomposition Unicode des caractères accentués (é, è, à, ç, etc.)
 * 2. Remplacement des ligatures françaises (œ -> oe, æ -> ae)
 * 3. Remplacement sémantique des symboles (& -> et, + -> et, % -> pourcent)
 * 4. Remplacement des apostrophes et guillemets par des tirets (l'entraînement -> l-entrainement)
 * 5. Suppression des diacritiques restants
 * 6. Passage en minuscules
 * 7. Remplacement des séparateurs et caractères non alphanumériques par un tiret unique
 * 8. Nettoyage des tirets consécutifs et des tirets en début/fin de chaîne
 */
export function generateSlugFromTitle(title: string): string {
  if (!title || typeof title !== "string") return "";

  return title
    .normalize("NFKD")
    .replace(/\u0153/g, "oe")
    .replace(/\u0152/g, "oe")
    .replace(/\u00e6/g, "ae")
    .replace(/\u00c6/g, "ae")
    .replace(/&/g, " et ")
    .replace(/\+/g, " et ")
    .replace(/%/g, " pourcent ")
    .replace(/['’`]/g, "-")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
