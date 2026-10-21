import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer";
import CTAButton from "@/components/CTAButton";
import ShinyAuthorImage from "@/components/ShinyAuthorImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faXTwitter,
  faInstagram,
  faTiktok,
  faYoutube,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";
import { Globe } from "lucide-react";

export const revalidate = 60; // Auto-update cache every minute

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("titre, description, seo_title, seo_description, noindex, nofollow, canonical_override")
    .eq("url", "blog/auteurs")
    .maybeSingle();

  const defaultTitle = "Nos experts et auteurs musculation & fitness | Glift";
  const defaultDesc = "Découvrez les profils de nos coachs et auteurs d'articles de musculation et nutrition. Apprenez de leur expérience et parcours pour progresser.";

  if (!pageConfig) {
    return {
      title: defaultTitle,
      description: defaultDesc,
      alternates: {
        canonical: "/blog/auteurs",
      },
    };
  }

  const title = pageConfig.seo_title || pageConfig.titre || defaultTitle;
  const plainTitle = title.replace(/<[^>]*>/g, "").trim();
  const description = pageConfig.seo_description || pageConfig.description || defaultDesc;
  const plainDescription = description.replace(/<[^>]*>/g, "").trim();

  const robots: any = {};
  if (pageConfig.noindex) robots.index = false;
  if (pageConfig.nofollow) robots.follow = false;

  return {
    title: plainTitle,
    description: plainDescription,
    robots: Object.keys(robots).length > 0 ? robots : undefined,
    alternates: {
      canonical: pageConfig.canonical_override || "/blog/auteurs",
    },
  };
}

type Author = {
  id: string;
  prenom: string;
  nom: string;
  poste_actuel: string;
  image_url: string;
  image_mobile?: string;
  image_alt: string;
  description_courte: string;
  description: string;
  liens_sociaux?: { platform: string; url: string }[];
  statut: boolean;
  is_shiny?: boolean;
};

function getSocialIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "facebook":
      return faFacebookF;
    case "twitter":
    case "x":
      return faXTwitter;
    case "instagram":
      return faInstagram;
    case "tiktok":
      return faTiktok;
    case "youtube":
      return faYoutube;
    case "linkedin":
      return faLinkedinIn;
    default:
      return faFacebookF;
  }
}

function getSocialLogo(platform: string): string | null {
  switch (platform.toLowerCase()) {
    case "facebook":
      return "/logos/logo_facebook.png";
    case "twitter":
    case "x":
      return "/logos/logo_X.png";
    case "instagram":
      return "/logos/logo_instagram.png";
    case "tiktok":
      return "/logos/logo_tiktok.png";
    case "youtube":
      return "/logos/logo_youtube.png";
    case "linkedin":
      return "/logos/logo_linkedin.png";
    default:
      return null;
  }
}

function getDePreposition(name: string): string {
  if (!name) return "de ";
  const firstLetter = name.trim().charAt(0).toLowerCase();
  const vowels = ["a", "e", "i", "o", "u", "y", "é", "è", "à", "ù", "â", "ê", "î", "ô", "û", "h"];
  return vowels.includes(firstLetter) ? "d'" : "de ";
}

function getAuthorSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

export default async function AuteursPage() {
  const supabase = await createServerClient();
  let authors: Author[] = [];

  // Fetch page configuration
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("is_published, titre, description")
    .eq("url", "blog/auteurs")
    .maybeSingle();

  if (pageConfig && !pageConfig.is_published) {
    notFound();
  }

  try {
    const { data: dbAuthors } = await (supabase as any)
      .from("auteurs")
      .select("*")
      .eq("statut", true)
      .order("nom", { ascending: true });

    if (dbAuthors && dbAuthors.length > 0) {
      authors = dbAuthors as Author[];
    }
  } catch (err) {
    console.warn("Could not query database table auteurs:", err);
  }

  // Fallback to Gabriel Fort if empty or error
  if (authors.length === 0) {
    authors = [
      {
        id: "1",
        prenom: "Gabriel",
        nom: "Fort",
        poste_actuel: "Fondateur de Glift",
        image_url: "/images/gabriel_fort.png",
        image_alt: "Gabriel Fort",
        description_courte:
          "Passionné de musculation depuis l'adolescence et pratiquant régulier depuis plus de 11 ans , Gabriel Fort a créé l'outil qui l'aurait aimé avoir lorsqu'il a décidé de se lancer sérieusement dans la musculation.",
        description:
          "Passionné de musculation depuis l'adolescence et pratiquant régulier depuis plus de 11 ans , Gabriel Fort a créé l'outil qui l'aurait aimé avoir lorsqu'il a décidé de se lancer sérieusement dans la musculation.",
        liens_sociaux: [
          { platform: "tiktok", url: "https://www.tiktok.com/fr/" },
          { platform: "facebook", url: "https://www.facebook.com/GliftApp/" },
          { platform: "twitter", url: "https://x.com/GliftApp" },
          { platform: "instagram", url: "https://www.instagram.com/glift.io/" },
          { platform: "youtube", url: "https://www.youtube.com/@glift2621" },
        ],
        statut: true,
      },
    ];
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${siteUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Auteurs",
        "item": `${siteUrl}/blog/auteurs`
      }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageConfig?.titre || "Nos experts et auteurs musculation & fitness | Glift",
    "description": pageConfig?.description ? pageConfig.description.replace(/<[^>]*>/g, "").trim() : "Découvrez les profils de nos coachs et auteurs d'articles de musculation et nutrition. Apprenez de leur expérience et parcours pour progresser.",
    "url": `${siteUrl}/blog/auteurs`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": authors.length,
      "itemListElement": authors.map((author, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Person",
          "@id": `${siteUrl}/blog/auteurs/${getAuthorSlug(author.prenom, author.nom)}#person`,
          "name": `${author.prenom} ${author.nom}`,
          "jobTitle": author.poste_actuel,
          "url": `${siteUrl}/blog/auteurs/${getAuthorSlug(author.prenom, author.nom)}`,
          "image": author.image_url ? (author.image_url.startsWith('http') ? author.image_url : `${siteUrl}${author.image_url}`) : undefined,
          "description": author.description_courte
        }
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema)
        }}
      />
      <main className="min-h-screen bg-[#FBFCFE] pt-[100px] md:pt-[140px] px-5 md:px-0">
      {/* Fil d'ariane (Breadcrumbs) */}
      <div className="max-w-[1152px] mx-auto mb-10">
        <div className="flex items-center gap-[10px] text-[12px] font-semibold text-[#5D6494]">
          <Link href="/blog" className="hover:text-[#2E3271] transition-colors">
            Blog
          </Link>
          <Image src="/icons/chevron_right.svg" alt="" width={6} height={12} aria-hidden="true" className="shrink-0" />
          <span className="text-[#3A416F]">Auteurs</span>
        </div>
      </div>

      {/* Header text content */}
      <div className="max-w-[1152px] mx-auto text-center mb-12 flex flex-col items-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] leading-tight mb-[15px]">
          {pageConfig?.titre || "Auteurs"}
        </h1>
        {pageConfig?.description ? (
          <div
            className="text-[15px] font-semibold text-[#5D6494] max-w-[500px] leading-relaxed [&_p]:m-0"
            dangerouslySetInnerHTML={{
              __html: pageConfig.description,
            }}
          />
        ) : (
          <p className="text-[15px] font-semibold text-[#5D6494] max-w-[500px] leading-relaxed">
            Entraînement, nutrition et motivation : profitez des conseils de nos experts pour progresser.
          </p>
        )}
      </div>

      {/* Authors list container */}
      <div className="max-w-[1152px] mx-auto pb-16">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center">
          {authors.map((author) => {
            const authorFullName = `${author.prenom} ${author.nom}`;
            const authorSlug = getAuthorSlug(author.prenom, author.nom);
            const authorUrl = `/blog/auteurs/${authorSlug}`;
            const isGabriel =
              author.prenom?.trim().toLowerCase() === "gabriel" &&
              author.nom?.trim().toLowerCase() === "fort";
            const isShiny = Boolean(author.is_shiny);

            const finalDesc = (author.description_courte || author.description || "").trim();

            const desktopCutout = author.image_url || (isGabriel ? "/images/gabrielfort.png" : "/images/gabriel_fort.png");
            const mobileCutout = author.image_mobile || author.image_url || (isGabriel ? "/images/gabrielfort_mobile.png" : "/images/gabriel_fort.png");

            return (
              <div
                key={author.id}
                className="w-full bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col h-full shadow-glift hover:shadow-glift-hover transition-shadow duration-200"
              >
                {/* Profile Image (Responsive Mobile / Desktop) */}
                {author.image_mobile ? (
                  <>
                    <ShinyAuthorImage
                      src={mobileCutout}
                      alt={author.image_alt || authorFullName}
                      isShiny={isShiny}
                      sizes="(max-width: 768px) 100vw, 270px"
                      className="w-full h-full object-cover rounded-t-[15px]"
                      containerClassName="w-full h-[180px] md:hidden rounded-t-[15px]"
                      priority
                      unoptimized
                    />
                    <ShinyAuthorImage
                      src={desktopCutout}
                      alt={author.image_alt || authorFullName}
                      isShiny={isShiny}
                      sizes="270px"
                      className="w-full h-full object-cover rounded-t-[15px]"
                      containerClassName="w-full h-[180px] hidden md:block rounded-t-[15px]"
                      priority
                      unoptimized
                    />
                  </>
                ) : (
                  <ShinyAuthorImage
                    src={desktopCutout}
                    alt={author.image_alt || authorFullName}
                    isShiny={isShiny}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 270px"
                    className="w-full h-full object-cover rounded-t-[15px]"
                    containerClassName="w-full h-[180px] rounded-t-[15px]"
                    priority
                    unoptimized
                  />
                )}

                {/* Profile details */}
                <div className="p-[15px] pb-[20px] flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#2E3271] uppercase tracking-wide mb-[6px] text-left leading-tight">
                      <Link href={authorUrl} className="hover:text-[#7069FA] transition-colors">
                        {authorFullName}
                      </Link>
                    </h2>

                    {author.poste_actuel && (
                      <div className="flex justify-start mb-[10px]">
                        <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[22px] inline-flex items-center justify-center rounded-[5px]">
                          {author.poste_actuel}
                        </span>
                      </div>
                    )}

                    {/* Social links as in the mockup in 25px by 25px */}
                    {author.liens_sociaux && author.liens_sociaux.length > 0 && (
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        {author.liens_sociaux.map((link, idx) => {
                          if (!link.url || !link.platform) return null;
                          const isWebsite =
                            link.platform.toLowerCase() === "website" ||
                            link.platform.toLowerCase() === "site web" ||
                            link.platform.toLowerCase() === "globe";
                          const customLogo = getSocialLogo(link.platform);

                          return (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-[25px] h-[25px] inline-flex items-center justify-center hover:opacity-80 transition-opacity duration-200 shrink-0"
                              aria-label={link.platform}
                            >
                              {customLogo ? (
                                <Image
                                  src={customLogo}
                                  alt={link.platform}
                                  width={25}
                                  height={25}
                                  className="w-[25px] h-[25px] object-contain shrink-0"
                                />
                              ) : isWebsite ? (
                                <Globe className="w-[25px] h-[25px] text-[#5D6494] hover:text-[#3A416F] transition-colors" />
                              ) : (
                                <FontAwesomeIcon
                                  icon={getSocialIcon(link.platform)}
                                  className="w-[25px] h-[25px] text-[#5D6494] hover:text-[#3A416F] transition-colors"
                                />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}

                    <div
                      className="text-[14px] text-[#5D6494] font-semibold leading-relaxed mb-5 text-left [&_p]:m-0"
                      dangerouslySetInnerHTML={{
                        __html: finalDesc,
                      }}
                    />
                  </div>

                  <div className="w-full mt-auto flex justify-center">
                    <CTAButton
                      href={authorUrl}
                      isAdmin={false}
                      className="w-full text-[14px] sm:text-[15px] font-semibold bg-[#7069FA] hover:bg-[#5E56E8] text-white flex items-center justify-center h-[44px] rounded-full shadow-none"
                    >
                      Voir le profil {getDePreposition(author.prenom)}{author.prenom}
                    </CTAButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
    </>
  );
}
