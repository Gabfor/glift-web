import { ContentBlock } from "@/app/admin/create-blog-article/blogArticleForm";

export type LegalPageFormState = {
  id?: string;
  titre: string;
  url: string;
  is_published: boolean;
  langue: string;
  updated_at: string;
  content_blocks: ContentBlock[];
};

export const emptyLegalPage: LegalPageFormState = {
  titre: "",
  url: "",
  is_published: false,
  langue: "Français",
  updated_at: "",
  content_blocks: [],
};

export const mapLegalPageRowToForm = (row: any): LegalPageFormState => {
  return {
    id: row.id,
    titre: row.titre || "",
    url: row.url || "",
    is_published: !!row.is_published,
    langue: row.langue || "Français",
    updated_at: row.updated_at || "",
    content_blocks: row.content_blocks || [],
  };
};

export const buildLegalPagePayload = (form: LegalPageFormState) => {
  return {
    titre: form.titre,
    url: form.url,
    is_published: form.is_published,
    langue: form.langue,
    updated_at: form.updated_at || null,
    content_blocks: form.content_blocks,
  };
};
