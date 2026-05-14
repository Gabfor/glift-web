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

export type BoutonConfig = {
  type: "primaire" | "secondaire" | "";
  texte: string;
  lien: string;
};

export type BlockBoutons = BaseBlock & {
  type: "boutons";
  enabled: boolean;
  bouton1: BoutonConfig;
  bouton2: BoutonConfig;
};

export type ContentBlock = 
  | BlockTitreTexte 
  | BlockTexte 
  | BlockTexte11
  | BlockSource 
  | BlockProgramme 
  | BlockTelechargement 
  | BlockSeance
  | BlockPartenaires
  | BlockBoutons;

export type BlogArticleFormState = {
  id?: string;
  type: "Conseil" | "Programme";
  titre: string;
  description: string;
  url: string;
  categorie: string;
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
  image_alt: string;
  article_lie_1: string;
  article_lie_2: string;
  content_blocks: ContentBlock[];
  is_published: boolean;
  is_featured: boolean;
  is_ai_generated: boolean;
};

export const emptyBlogArticle: BlogArticleFormState = {
  type: "Conseil",
  titre: "",
  description: "",
  url: "",
  categorie: "",
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
  image_alt: "",
  article_lie_1: "",
  article_lie_2: "",
  content_blocks: [],
  is_published: false,
  is_featured: false,
  is_ai_generated: false,
};
