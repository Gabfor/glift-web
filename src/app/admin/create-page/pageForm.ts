import { ContentBlock } from "@/app/admin/create-blog-article/blogArticleForm";

export type PageFormState = {
  id?: string;
  titre: string;
  surtitre: string;
  description: string;
  url: string;
  is_published: boolean;
  langue: string;
  updated_at: string;
  content_blocks: ContentBlock[];
  texte?: string;
  description_aide?: string;
  seo_title: string;
  seo_description: string;
  noindex: boolean;
  nofollow: boolean;
  canonical_override: string;
};

export const BLOG_PAGE_ID = "f9709b0b-b513-4d53-a6ef-d9cda3f0a706";
export const CONTACT_PAGE_ID = "c131a31e-4c74-4b53-bdf5-d41a87e5b61b";
const DEFAULT_BLOG_TEXT = "Que votre objectif soit la prise de masse musculaire, la perte de gras (sèche) ou le développement de votre force, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, passez au niveau supérieur.";

export const emptyPage: PageFormState = {
  titre: "",
  surtitre: "",
  description: "",
  url: "",
  is_published: false,
  langue: "Français",
  updated_at: "",
  content_blocks: [],
  texte: "",
  description_aide: "",
  seo_title: "",
  seo_description: "",
  noindex: false,
  nofollow: false,
  canonical_override: "",
};

export const mapPageRowToForm = (row: any): PageFormState => {
  let texte = "";
  if (row.id === BLOG_PAGE_ID) {
    const blocks = row.content_blocks || [];
    const textBlock = Array.isArray(blocks) ? blocks.find((b: any) => b.type === "texte") : null;
    texte = textBlock ? textBlock.texte || "" : DEFAULT_BLOG_TEXT;
  }

  let description_aide = "";
  if (row.id === CONTACT_PAGE_ID) {
    const blocks = row.content_blocks || [];
    const textBlock = Array.isArray(blocks) ? blocks.find((b: any) => b.type === "description_aide") : null;
    description_aide = textBlock ? textBlock.texte || "" : "Vous n'avez pas trouvé la réponse à votre question dans notre <a href=\"{{helpUrl}}\" class=\"text-[#7069FA] hover:text-[#6660E4] hover:no-underline transition-colors\">Aide</a> ?<br />Posez votre question ci-dessous et nous reviendrons vers vous.";
  }

  return {
    id: row.id,
    titre: row.titre || "",
    surtitre: row.surtitre || "",
    description: row.description || "",
    url: row.url || "",
    is_published: !!row.is_published,
    langue: row.langue || "Français",
    updated_at: row.updated_at || "",
    content_blocks: row.content_blocks || [],
    texte,
    description_aide,
    seo_title: row.seo_title || "",
    seo_description: row.seo_description || "",
    noindex: !!row.noindex,
    nofollow: !!row.nofollow,
    canonical_override: row.canonical_override || "",
  };
};

export const buildPagePayload = (form: PageFormState) => {
  const payload: any = {
    titre: form.titre,
    surtitre: form.surtitre,
    description: form.description,
    url: form.url,
    is_published: form.is_published,
    langue: form.langue,
    content_blocks: form.id === BLOG_PAGE_ID
      ? [{ id: "blog-text", type: "texte", texte: form.texte || "" }]
      : form.id === CONTACT_PAGE_ID
      ? [{ id: "contact-desc-aide", type: "description_aide", texte: form.description_aide || "" }]
      : form.content_blocks,
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    noindex: form.noindex,
    nofollow: form.nofollow,
    canonical_override: form.canonical_override || null,
  };

  if (form.updated_at) {
    payload.updated_at = form.updated_at;
  }

  return payload;
};
