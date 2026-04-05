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
};
