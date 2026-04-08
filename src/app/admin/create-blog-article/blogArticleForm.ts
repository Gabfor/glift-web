export type BaseBlock = { id: string; };

export type BlockTitreTexte = BaseBlock & {
  type: "titre-texte";
  titre: string;
  ancreId: string;
  texte: string;
};

export type BlockTexte = BaseBlock & {
  type: "texte";
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
  titre: string;
  url: string;
  nom_bouton: string;
  texte: string;
};

export type SeanceRow = {
  jour: string;
  exercice: string;
  series: string;
  reps: string;
  repos: string;
};

export type BlockSeance = BaseBlock & {
  type: "seance";
  titre: string;
  table_rows: SeanceRow[];
  texte: string;
};

export type ContentBlock = 
  | BlockTitreTexte 
  | BlockTexte 
  | BlockSource 
  | BlockProgramme 
  | BlockTelechargement 
  | BlockSeance;

export type BlogArticleFormState = {
  id?: string;
  type: "Conseil" | "Programme";
  titre: string;
  description: string;
  url: string;
  categorie: string;
  sexe: string;
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
};

export const emptyBlogArticle: BlogArticleFormState = {
  type: "Conseil",
  titre: "",
  description: "",
  url: "",
  categorie: "",
  sexe: "",
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
};
