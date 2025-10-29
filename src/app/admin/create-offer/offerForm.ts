import type { Database } from "@/lib/supabase/types";

type OfferRow = Database["public"]["Tables"]["offer_shop"]["Row"];
type OfferInsert = Database["public"]["Tables"]["offer_shop"]["Insert"];

type OfferFormState = {
  start_date: string;
  end_date: string;
  name: string;
  image: string;
  image_alt: string;
  brand_image: string;
  brand_image_alt: string;
  shop: string;
  shop_website: string;
  shop_link: string;
  type: string[];
  code: string;
  gender: string;
  shipping: string;
  modal: string;
  status: string;
  premium: boolean;
  sport: string;
  condition: string;
};

const emptyOffer: OfferFormState = {
  start_date: "",
  end_date: "",
  name: "",
  image: "",
  image_alt: "",
  brand_image: "",
  brand_image_alt: "",
  shop: "",
  shop_website: "",
  shop_link: "",
  type: [],
  code: "",
  gender: "",
  shipping: "",
  modal: "",
  status: "ON",
  premium: false,
  sport: "",
  condition: "",
};

const mapOfferRowToForm = (row: OfferRow): OfferFormState => ({
  start_date: row.start_date ?? "",
  end_date: row.end_date ?? "",
  name: row.name,
  image: row.image,
  image_alt: row.image_alt ?? "",
  brand_image: row.brand_image ?? "",
  brand_image_alt: row.brand_image_alt ?? "",
  shop: row.shop ?? "",
  shop_website: row.shop_website ?? "",
  shop_link: row.shop_link ?? "",
  type: Array.isArray(row.type)
    ? row.type.filter((value): value is string => typeof value === "string")
    : [],
  code: row.code ?? "",
  gender: row.gender ?? "",
  shipping: row.shipping ?? "",
  modal: row.modal ?? "",
  status: row.status,
  premium: Boolean(row.premium),
  sport: row.sport ?? "",
  condition: row.condition ?? "",
});

const buildOfferPayload = (form: OfferFormState): OfferInsert => {
  const normalizedTypes = form.type.filter((value) => value.trim() !== "");
  const normalizedShipping = form.shipping.trim();
  return {
    start_date: form.start_date ? form.start_date : null,
    end_date:
      form.end_date && form.end_date.includes("-") ? form.end_date : null,
    name: form.name,
    image: form.image,
    image_alt: form.image_alt || null,
    brand_image: form.brand_image || null,
    brand_image_alt: form.brand_image_alt || null,
    shop: form.shop || null,
    shop_website: form.shop_website || null,
    shop_link: form.shop_link || null,
    type: normalizedTypes.length > 0 ? normalizedTypes : null,
    code: form.code || null,
    gender: form.gender || null,
    shipping: normalizedShipping ? normalizedShipping.replace(",", ".") : null,
    modal: form.modal || null,
    status: form.status,
    premium: form.premium,
    sport: form.sport || null,
    condition: form.condition || null,
  };
};

const normalizeOfferId = (rawId: unknown): number | null => {
  if (typeof rawId === "number") {
    return Number.isFinite(rawId) ? rawId : null;
  }

  if (typeof rawId !== "string") {
    return null;
  }

  const trimmedId = rawId.trim();
  if (trimmedId === "") {
    return null;
  }

  const numericId = Number.parseInt(trimmedId, 10);

  if (Number.isNaN(numericId)) {
    return null;
  }

  return numericId;
};

export type { OfferFormState, OfferRow };
export {
  buildOfferPayload,
  emptyOffer,
  mapOfferRowToForm,
  normalizeOfferId,
};
