import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import ShopPageClient from "./ShopPageClient";
import { mapOfferRowToOffer, OfferQueryRow } from "@/utils/shopUtils";
import { sortOffersByRelevance } from "@/utils/sortingUtils";
import { ShopProfile } from "@/types/shop";
import type { Metadata } from "next";

export const revalidate = 60; // Mise à jour auto toutes les minutes

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("titre, description, seo_title, seo_description, noindex, nofollow, canonical_override")
    .eq("id", "eb4e258a-0876-421e-b653-176c8c08ed3d")
    .single();

  if (!pageConfig) return { title: "Shop" };

  const title = pageConfig.seo_title || pageConfig.titre || "Glift Shop";
  const plainTitle = title.replace(/<[^>]*>/g, "").trim();
  const description = pageConfig.seo_description || pageConfig.description || "Découvrez une sélection d'offres de musculation régulièrement mise à jour.";
  const plainDescription = description.replace(/<[^>]*>/g, "").trim();

  const robots: any = {};
  if (pageConfig.noindex) robots.index = false;
  if (pageConfig.nofollow) robots.follow = false;

  return {
    title: plainTitle,
    description: plainDescription,
    robots: Object.keys(robots).length > 0 ? robots : undefined,
    alternates: {
      canonical: pageConfig.canonical_override || "/shop",
    },
  };
}

import ShopHeader from "@/components/shop/ShopHeader";

export default async function ShopPage() {
  const supabase = await createServerClient();
  
  // 0. Check custom URL redirection
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url")
    .eq("id", "eb4e258a-0876-421e-b653-176c8c08ed3d")
    .single();

  if (pageConfig && pageConfig.url && pageConfig.url !== "shop") {
    redirect(`/${pageConfig.url}`);
  }
  
  // 1. Get user profile for relevance sorting
  const { data: { session } } = await supabase.auth.getSession();
  let userProfile: ShopProfile | null = null;
  
  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender, main_goal, supplements")
      .eq("id", session.user.id)
      .single();
    
    if (profile) {
      userProfile = profile as ShopProfile;
    }
  }

  // 2. Fetch total count
  const { count: totalCount } = await supabase
    .from("offer_shop")
    .select("*", { count: "exact", head: true })
    .eq("status", "ON");

  // 3. Fetch offers for initial display (Default relevance sort)
  const { data: rawOffers } = await supabase
    .from("offer_shop")
    .select(`
      id,
      name,
      start_date,
      end_date,
      type,
      code,
      image,
      image_alt,
      brand_image,
      brand_image_alt,
      shop,
      shop_website,
      shop_link,
      shipping,
      modal,
      condition,
      gender,
      boost,
      click_count,
      created_at,
      sport
    `)
    .eq("status", "ON");

  const mappedOffers = (rawOffers ?? []).map(row => mapOfferRowToOffer(row as OfferQueryRow));
  
  // Perform relevance sorting on the server
  const sortedOffers = sortOffersByRelevance(mappedOffers, userProfile);
  
  // Only send the first 8 for the initial page
  const initialOffers = sortedOffers.slice(0, 8);

  // 4. Fetch Slider Configuration
  const { data: adminConfig } = await supabase
    .from("sliders_admin")
    .select("*")
    .single();

  let sliderConfig = { type: "none" as "none" | "single" | "double", slides: [] as any[] };

  if (adminConfig && adminConfig.is_active && adminConfig.type !== "none") {
    // 4a. Normalize priority slides
    const normalizeSlides = (value: any): any[] => {
      if (!Array.isArray(value)) return [];
      return value.map((slide) => {
        if (typeof slide === "object" && slide !== null && !Array.isArray(slide)) {
          return {
            image: slide.image || "",
            alt: slide.alt || "",
            link: slide.link || "",
          };
        }
        return { image: "", alt: "", link: "" };
      });
    };

    const prioritySlides = normalizeSlides(adminConfig.slides);
    const slotCount = adminConfig.slot_count || 1;
    const slotsNeeded = Math.max(0, slotCount - prioritySlides.length);

    let offerSlides: any[] = [];

    if (slotsNeeded > 0) {
      const { data: offers } = await supabase
        .from("offer_shop")
        .select(`
          id, name, slider_image, image_alt, 
          shop_link, shop_website, 
          code, modal, condition, 
          start_date, end_date, brand_image, type,
          image
        `)
        .eq("status", "ON")
        .neq("slider_image", null)
        .limit(slotsNeeded + 2);

      if (offers) {
        offerSlides = (offers ?? [])
          .filter((o) => o.slider_image)
          .map((o) => ({
            image: o.slider_image!,
            alt: o.image_alt || o.name,
            link: o.shop_link || o.shop_website || "",
            offer: {
              id: o.id,
              name: o.name,
              code: o.code ?? "",
              modal: o.modal ?? "",
              condition: o.condition ?? "",
              start_date: o.start_date ?? "",
              end_date: o.end_date ?? "",
              shop_link: o.shop_link ?? "",
              shop_website: o.shop_website ?? "",
              brand_image: o.brand_image ?? "",
              type: Array.isArray(o.type) ? o.type : [],
              image: o.image || "",
              image_alt: o.image_alt || "",
              created_at: "",
            }
          }));
      }
    }

    sliderConfig = {
      type: adminConfig.type as "single" | "double",
      slides: [...prioritySlides, ...offerSlides].slice(0, slotCount)
    };
  }

  const initialPageContent = {
    surtitre: pageConfig?.surtitre ?? "",
    titre: pageConfig?.titre || "Glift Shop",
    description: pageConfig?.description ?? "Découvrez une sélection d'offres régulièrement mise à jour.<br/>Pour en profiter, cliquez sur le bouton « En profiter » et laissez-vous guider.",
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
      <div className="max-w-[1152px] mx-auto">
        <ShopHeader initialPageContent={initialPageContent} />
      </div>
      <ShopPageClient 
        initialOffers={initialOffers} 
        sliderConfig={sliderConfig}
      />
    </main>
  );
}
