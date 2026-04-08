import { Database } from "@/lib/supabase/types";
import { ShopOffer } from "@/types/shop";

type OfferRow = Database["public"]["Tables"]["offer_shop"]["Row"];
export type OfferQueryRow = Pick<
  OfferRow,
  | "id"
  | "name"
  | "start_date"
  | "end_date"
  | "type"
  | "code"
  | "image"
  | "image_alt"
  | "brand_image"
  | "brand_image_alt"
  | "shop"
  | "shop_website"
  | "shop_link"
  | "shipping"
  | "modal"
  | "condition"
  | "gender"
  | "boost"
  | "click_count"
  | "created_at"
>;

const parseOfferTypes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return value.split(",").map((item: string) => item.trim());
    }
  }

  return [];
};

export const mapOfferRowToOffer = (row: OfferQueryRow): ShopOffer => ({
  id: row.id,
  name: row.name,
  start_date: row.start_date ?? "",
  end_date: row.end_date ?? "",
  type: parseOfferTypes(row.type),
  code: row.code ?? "",
  image: row.image,
  image_alt: row.image_alt ?? "",
  brand_image: row.brand_image ?? "",
  brand_image_alt: row.brand_image_alt ?? "",
  shop: row.shop ?? "",
  shop_website: row.shop_website ?? "",
  shop_link: row.shop_link ?? "",
  shipping: row.shipping ?? "",
  modal: row.modal ?? "",
  condition: row.condition ?? "",
  gender: row.gender ?? "",
  boost: row.boost ?? false,
  click_count: row.click_count ?? 0,
  created_at: row.created_at ?? "",
});
