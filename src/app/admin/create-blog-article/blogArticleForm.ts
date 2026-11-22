export type BaseBlock = { id: string; ancreId?: string; };

export type BlockTitreTexte = BaseBlock & {
  type: "titre-texte";
  titre: string;
  texte: string;
};

export type BlockTexte = BaseBlock & {
  type: "texte";
  texte: string;
};

export type BlockTexte11 = BaseBlock & {
  type: "texte-1-1";
  titre: string;
  texte: string;
};

export type BlockSource = BaseBlock & {
  type: "source";
  titre: string;
  texte: string;
};

export type BlockNote = BaseBlock & {
  type: "note";
  texte: string;
};

export type BlockTableau = BaseBlock & {
  type: "tableau";
  titre?: string;
  headers: string[];
  rows: string[][];
  colWidths?: number[];
};

export type BlockCTA = BaseBlock & {
  type: "cta";
  texte: string;
  url: string;
};

export type BlockListe = BaseBlock & {
  type: "liste";
  titre?: string;
  items: string[];
};

export type FAQItem = {
  id?: string;
  question: string;
  reponse: string;
};

export type BlockFAQ = BaseBlock & {
  type: "faq";
  titre?: string;
  items: FAQItem[];
};

export type BlockProgramme = BaseBlock & {
  type: "programme";
  titre: string;
  texte: string;
  // TODO: affiner selon l'image
  features_list: string; // Pour les "caractéristiques" à cocher ou lister
};

export type BlockTelechargement = BaseBlock & {
  type: "telechargement";
  programme_id: string;
};

export type SeanceRow = {
  exercice: string;
  materiel?: string;
  series: number;
  reps: string[];
  repos: string;
  link?: string;
  superset_id?: string;
  conseils?: string;
};

export type BlockSeance = BaseBlock & {
  type: "seance";
  titre: string;
  table_rows: SeanceRow[];
};

export type PartnerSlot = {
  logo_url: string;
  alt_text: string;
  link_url: string;
};

export type BlockPartenaires = BaseBlock & {
  type: "partenaires";
  surtitre?: string;
  titre?: string;
  enabled: boolean;
  slots: PartnerSlot[];
};

export type ButtonType = "primaire" | "secondaire" | "google" | "apple";

export type BoutonConfig = {
  type: ButtonType | "";
  texte: string;
  lien: string;
};

export type BlockBoutons = {
  id: string;
  type: "boutons";
  enabled: boolean;
  ancreId?: string;
  bouton1: {
    type: ButtonType;
    texte: string;
    lien: string;
  };
  bouton2: {
    type: ButtonType;
    texte: string;
    lien: string;
  };
};

export type BlockImagePrincipale = {
  id: string;
  type: "image-principale";
  enabled: boolean;
  image: string;
  alt: string;
  texte1: string;
  texte2: string;
};

export type BlockTitre = BaseBlock & {
  type: "titre";
  surtitre?: string;
  titre?: string;
};

export type BlockTexteImage = BaseBlock & {
  type: "texte-image";
  imagePosition?: "gauche" | "droite";
  image?: string;
  alt?: string;
  surtitre?: string;
  titre?: string;
  texte?: string;
  boutonType?: "primaire" | "secondaire" | "aucun";
  boutonTexte?: string;
  boutonLien?: string;
};

export type BlockCard = BaseBlock & {
  type: "card";
  surtitre?: string;
  titre?: string;
  texte?: string;
  card1: {
    image?: string;
    alt?: string;
    titre?: string;
    texte?: string;
    boutonType?: "primaire" | "secondaire" | "aucun";
    boutonTexte?: string;
    boutonLien?: string;
  };
  card2: {
    image?: string;
    alt?: string;
    titre?: string;
    texte?: string;
    boutonType?: "primaire" | "secondaire" | "aucun";
    boutonTexte?: string;
    boutonLien?: string;
  };
};

export type BlockNewsletter = BaseBlock & {
  type: "newsletter";
  surtitre?: string;
  titre?: string;
  texte?: string;
  boutonTexte?: string;
};

export type SubscriptionArgument = {
  id: string;
  texte: string;
  active: boolean;
};

export type Subscription = {
  nom: string;
  prix: string;
  description: string;
  arguments: SubscriptionArgument[];
  boutonType: "primaire" | "secondaire" | "aucun";
  boutonTexte: string;
  boutonLien: string;
  badge?: string;
  badgeStatus?: "ON" | "OFF";
  badgeColor?: string;
  badgeTextColor?: string;
};

export type BlockTarifs = BaseBlock & {
  type: "tarifs";
  enabled: boolean;
  abonnement1: Subscription;
  abonnement2: Subscription;
};

export type ContentBlock = 
  | BlockTitreTexte 
  | BlockTexte 
  | BlockTexte11
  | BlockSource 
  | BlockNote
  | BlockTableau
  | BlockCTA
  | BlockListe
  | BlockFAQ
  | BlockProgramme 
  | BlockTelechargement 
  | BlockSeance
  | BlockPartenaires
  | BlockBoutons
  | BlockImagePrincipale
  | BlockTitre
  | BlockTexteImage
  | BlockCard
  | BlockNewsletter
  | BlockTarifs;

export type BlogArticleFormState = {
  id?: string;
  type: "Conseil" | "Programme";
  titre: string;
  description: string;
  url: string;
  categorie: string[];
  sexe: string;
  langue: string;
  niveau: string;
  objectif: string;
  nombre_seances: string;
  duree_moyenne: string;
  nombre_semaines: string;
  lieu: string;
  intensite: string;
  image: string;
  image_mobile: string;
  image_alt: string;
  article_lie_1: string;
  article_lie_2: string;
  content_blocks: ContentBlock[];
  is_published: boolean;
  is_featured: boolean;
  is_ai_generated: boolean;
  seo_title: string;
  seo_description: string;
  noindex: boolean;
  nofollow: boolean;
  canonical_override: string;
  auteur: string;
};

export const emptyBlogArticle: BlogArticleFormState = {
  type: "Conseil",
  titre: "",
  description: "",
  url: "",
  categorie: [],
  sexe: "",
  langue: "Français",
  niveau: "",
  objectif: "",
  nombre_seances: "",
  duree_moyenne: "",
  nombre_semaines: "",
  lieu: "",
  intensite: "",
  image: "",
  image_mobile: "",
  image_alt: "",
  article_lie_1: "",
  article_lie_2: "",
  content_blocks: [],
  is_published: false,
  is_featured: false,
  is_ai_generated: false,
  seo_title: "",
  seo_description: "",
  noindex: false,
  nofollow: false,
  canonical_override: "",
  auteur: "",
};

export function mapDbArticleToFormState(data: any): BlogArticleFormState {
  let parsedCategories: string[] = [];
  if (Array.isArray(data.categorie)) {
    parsedCategories = data.categorie.filter(
      (c: unknown): c is string => typeof c === "string" && c.trim() !== ""
    );
  } else if (typeof data.categorie === "string") {
    try {
      const parsed = JSON.parse(data.categorie);
      parsedCategories = Array.isArray(parsed)
        ? parsed.filter((c: unknown): c is string => typeof c === "string" && c.trim() !== "")
        : data.categorie.trim()
          ? [data.categorie.trim()]
          : [];
    } catch {
      parsedCategories = data.categorie.trim() ? [data.categorie.trim()] : [];
    }
  }

  const rawSeoDesc = data.seo_description || "";
  const cleanSeoDesc =
    typeof rawSeoDesc === "string"
      ? rawSeoDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : "";

  return {
    id: data.id,
    type: data.type || "Conseil",
    titre: data.titre || "",
    description: data.description || "",
    url: data.url || "",
    categorie: parsedCategories,
    sexe: data.sexe || "",
    langue: data.langue || "Français",
    niveau: data.niveau || "",
    objectif: data.objectif || "",
    nombre_seances: data.nombre_seances || "",
    duree_moyenne: data.duree_moyenne || "",
    nombre_semaines: data.nombre_semaines || "",
    lieu: data.lieu || "",
    intensite: data.intensite || "",
    image: data.image_url || "",
    image_mobile: data.image_mobile || "",
    image_alt: data.image_alt || "",
    article_lie_1: data.article_lie_1_id || "",
    article_lie_2: data.article_lie_2_id || "",
    content_blocks: data.content_blocks || [],
    is_published: !!data.is_published,
    is_featured: !!data.is_featured,
    is_ai_generated: !!data.is_ai_generated,
    seo_title: data.seo_title || "",
    seo_description: cleanSeoDesc,
    noindex: !!data.noindex,
    nofollow: !!data.nofollow,
    canonical_override: data.canonical_override || "",
    auteur: data.auteur || "",
  };
}
