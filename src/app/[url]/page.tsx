import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import BlogArticleBlocksRenderer from "@/app/blog/[url]/BlogArticleBlocksRenderer";
import DashboardClient from "@/app/dashboard/DashboardClient";

import ShopPageClient from "@/app/shop/ShopPageClient";
import { mapOfferRowToOffer, OfferQueryRow } from "@/utils/shopUtils";
import { sortOffersByRelevance } from "@/utils/sortingUtils";
import { ShopProfile } from "@/types/shop";
import ShopHeader from "@/components/shop/ShopHeader";

import StorePageClient from "@/app/store/StorePageClient";
import { mapProgramRowToCard, ProgramQueryRow } from "@/utils/storeUtils";
import { sortProgramsByRelevance } from "@/utils/sortingUtils";
import { StoreProfile } from "@/types/store";
import StoreHeader from "@/components/store/StoreHeader";
import EntrainementsClient from "@/app/entrainements/EntrainementsClient";
import BlogListClient from "@/app/blog/BlogListClient";
import AideClient from "@/app/aide/AideClient";
import ContactClient from "@/app/contact/ContactClient";

export const revalidate = 60;

export default async function LegalPage({ params }: { params: Promise<{ url: string }> }) {
  const resolvedParams = await params;
  const supabase = await createServerClient();
  
  // 1. Fetch legal page
  let isGenericPage = false;
  let { data: pages, error } = await (supabase as any)
    .from("legal_pages")
    .select("*")
    .eq("url", resolvedParams.url)
    .eq("is_published", true)
    .limit(1);

  if (error || !pages || pages.length === 0) {
    // 2. Fallback to generic page
    const { data: genericPages, error: genericError } = await (supabase as any)
      .from("pages")
      .select("*")
      .eq("url", resolvedParams.url)
      .eq("is_published", true)
      .limit(1);

    if (genericError || !genericPages || genericPages.length === 0) {
      notFound();
    }

    pages = genericPages;
    isGenericPage = true;
  }

  const page = pages[0];

  if (page.id === "59822297-b8b2-4041-bfa6-03793221fcf6") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/connexion");
    }

    return (
      <DashboardClient
        initialPageContent={{
          surtitre: page.surtitre || "",
          titre: page.titre || "",
          description: page.description || "",
        }}
      />
    );
  }

  if (page.id === "90c6b3f6-1b46-4711-8882-28177874b51d") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/connexion");
    }

    return (
      <EntrainementsClient
        initialPageContent={{
          surtitre: page.surtitre ?? "",
          titre: page.titre || "Entraînements",
          description: page.description ?? "Gérez vos programmes et vos entraînements.",
        }}
      />
    );
  }

  if (page.id === "eb4e258a-0876-421e-b653-176c8c08ed3d") {
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
    const sortedOffers = sortOffersByRelevance(mappedOffers, userProfile);
    const initialOffers = sortedOffers.slice(0, 8);

    // 4. Fetch Slider Configuration
    const { data: adminConfig } = await supabase
      .from("sliders_admin")
      .select("*")
      .single();

    let sliderConfig = { type: "none" as "none" | "single" | "double", slides: [] as any[] };

    if (adminConfig && adminConfig.is_active && adminConfig.type !== "none") {
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

    const shopPageContent = {
      surtitre: page.surtitre ?? "",
      titre: page.titre || "Glift Shop",
      description: page.description ?? "Découvrez une sélection d'offres régulièrement mise à jour.<br/>Pour en profiter, cliquez sur le bouton « En profiter » et laissez-vous guider.",
    };

    return (
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
        <div className="max-w-[1152px] mx-auto">
          <ShopHeader initialPageContent={shopPageContent} />
        </div>
        <ShopPageClient 
          initialOffers={initialOffers} 
          sliderConfig={sliderConfig}
        />
      </main>
    );
  }

  if (page.id === "fd7e055c-bf17-4222-a8f8-c27b014d3062") {
    // 1. Get user profile for relevance sorting
    const { data: { session } } = await supabase.auth.getSession();
    let userProfile: StoreProfile | null = null;
    
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan, gender, main_goal, experience, training_place, weekly_sessions")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        userProfile = profile as StoreProfile;
      }
    }

    // 2. Fetch total count
    const { count: totalCount } = await supabase
      .from("program_store")
      .select("*", { count: "exact", head: true })
      .eq("status", "ON");

    // 3. Fetch first batch of programs for initial display (Default relevance sort)
    const { data: rawPrograms } = await supabase
      .from("program_store")
      .select(`
        id,
        title,
        level,
        goal,
        gender,
        sessions,
        duration,
        description,
        image,
        image_alt,
        partner_image,
        partner_image_alt,
        partner_link,
        link,
        downloads,
        created_at,
        plan,
        location
      `)
      .eq("status", "ON");

    const mappedPrograms = (rawPrograms ?? []).map(row => mapProgramRowToCard(row as ProgramQueryRow));
    const sortedPrograms = sortProgramsByRelevance(mappedPrograms, userProfile);
    const initialPrograms = sortedPrograms.slice(0, 8);

    const storePageContent = {
      surtitre: page.surtitre ?? "",
      titre: page.titre || "Glift Store",
      description: page.description ?? "Téléchargez un programme pour l'utiliser directement dans Glift.",
    };

    return (
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
        <div className="max-w-[1152px] mx-auto">
          <StoreHeader initialPageContent={storePageContent} />
        </div>
        <StorePageClient 
          initialPrograms={initialPrograms} 
          initialTotalCount={totalCount || 0} 
          initialUserProfile={userProfile}
          initialIsAuthenticated={!!session?.user}
        />
      </main>
    );
  }

  if (page.id === "f9709b0b-b513-4d53-a6ef-d9cda3f0a706") {
    // Fetch blog articles
    const { data: articles } = await (supabase.from("blog_articles") as any)
      .select("id, url, titre, description, image_url, image_alt, type, categorie, sexe, is_featured, niveau, nombre_seances, duree_moyenne")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const defaultBlogText = "Que votre objectif soit la <strong>prise de masse musculaire</strong>, la <strong>perte de gras (sèche)</strong> ou le <strong>développement de votre force</strong>, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, <strong>passez au niveau supérieur</strong>.";

    // Extract extra text from content_blocks
    let extraText = defaultBlogText;
    if (page.content_blocks) {
      const blocks = page.content_blocks || [];
      const textBlock = Array.isArray(blocks) ? blocks.find((b: any) => b.type === "texte") : null;
      if (textBlock && textBlock.texte) {
        extraText = textBlock.texte;
      }
    }

    return (
      <main className="min-h-screen bg-[#FBFCFE] pt-[140px] px-4">
        <div className="max-w-[1152px] mx-auto text-center">
          {page.surtitre && (
            <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
              {page.surtitre}
            </div>
          )}
          <h1 
            className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles"
            dangerouslySetInnerHTML={{ __html: page.titre || "Blog" }}
          />
          {page.description && (
            <div 
              className="text-[16px] font-semibold text-[#5D6494] mb-8 text-center max-w-[700px] mx-auto leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.description }}
            />
          )}
          {extraText && (
            <div 
              className="max-w-[1152px] mx-auto bg-[#F7F7FF] rounded-[10px] p-[25px] text-[#5D6494] text-[14px] font-semibold text-left [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
              dangerouslySetInnerHTML={{ __html: extraText }}
            />
          )}
        </div>

        <BlogListClient initialArticles={articles || []} />
      </main>
    );
  }
  if (page.id === "eb40db10-0d10-47af-b102-62e2763bef86") {
    const helpPageContent = {
      surtitre: page.surtitre ?? "",
      titre: page.titre || "Aide",
      description: page.description ?? "Retrouvez les questions les plus fréquemment posées par nos utilisateurs.",
    };

    return <AideClient initialPageContent={helpPageContent} />;
  }

  if (page.id === "c131a31e-4c74-4b53-bdf5-d41a87e5b61b") {
    const blocks = page.content_blocks || [];
    const textBlock = Array.isArray(blocks) ? (blocks as any[]).find((b: any) => b.type === "description_aide") : null;
    const description_aide = textBlock ? (textBlock as any).texte || "" : "";

    const contactPageContent = {
      surtitre: page.surtitre ?? "",
      titre: page.titre || "Contactez-nous",
      description: page.description ?? "Vous souhaitez nous contacter ? Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.",
      description_aide,
    };

    return <ContactClient initialPageContent={contactPageContent} />;
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px]">
      <div className="max-w-[1152px] mx-auto px-4 md:px-0">
        {page.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {page.surtitre}
          </div>
        )}
        <div 
          className={`text-[30px] font-bold text-[#2E3271] leading-tight text-center max-w-[760px] mx-auto ${isGenericPage && page.description ? "mb-[10px]" : !isGenericPage && page.updated_at ? "mb-[20px]" : "mb-[50px]"} prose-titles`}
          dangerouslySetInnerHTML={{ __html: page.titre }}
        />

        {page.description && (
          <div 
            className="text-[15px] sm:text-[16px] text-[#5D6494] font-semibold leading-relaxed max-w-[700px] mx-auto mb-[30px] text-center"
            dangerouslySetInnerHTML={{ __html: page.description }}
          />
        )}

        {!isGenericPage && page.updated_at && (
          <div className="text-[14px] text-[#5D6494] font-semibold text-center mb-[40px]">
            Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}

        <article className="w-full">
          <BlogArticleBlocksRenderer 
            blocks={page.content_blocks || []} 
            articleMeta={{}}
          />
        </article>
      </div>
    </main>
  );
}
