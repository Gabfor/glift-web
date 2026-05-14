import { ContentBlock } from "@/app/admin/create-blog-article/blogArticleForm";

export type PageFormState = {
  id?: string;
  titre: string;
  surtitre: string;
  url: string;
  is_published: boolean;
  langue: string;
  updated_at: string;
  content_blocks: ContentBlock[];
};

export const emptyPage: PageFormState = {
  titre: "",
  surtitre: "",
  url: "",
  is_published: false,
  langue: "Français",
  updated_at: "",
  content_blocks: [],
};

export const mapPageRowToForm = (row: any): PageFormState => {
  return {
    id: row.id,
    titre: row.titre || "",
    surtitre: row.surtitre || "",
    url: row.url || "",
    is_published: !!row.is_published,
    langue: row.langue || "Français",
    updated_at: row.updated_at || "",
    content_blocks: row.content_blocks || [],
  };
};

export const buildPagePayload = (form: PageFormState) => {
  const payload: any = {
    titre: form.titre,
    surtitre: form.surtitre,
    url: form.url,
    is_published: form.is_published,
    langue: form.langue,
    content_blocks: form.content_blocks,
  };

  if (form.updated_at) {
    payload.updated_at = form.updated_at;
  }

  return payload;
};
