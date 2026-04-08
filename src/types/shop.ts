export interface ShopOffer {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: string[];
  code: string;
  image: string;
  image_alt: string;
  brand_image?: string;
  brand_image_alt?: string;
  shop?: string;
  shop_website?: string;
  shop_link?: string;
  shipping?: string;
  modal?: string;
  condition?: string;
  gender?: string;
  boost?: boolean;
  click_count?: number;
  created_at?: string;
}

export interface ShopProfile {
  gender: string | null;
  main_goal: string | null;
  supplements: string | null;
}
