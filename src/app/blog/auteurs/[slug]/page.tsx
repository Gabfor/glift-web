import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
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
import AuthorArticlesClient from "./AuthorArticlesClient";
import ShinyAuthorImage from "@/components/ShinyAuthorImage";

export const revalidate = 60; // Auto-update cache every minute

type Props = {
  params: Promise<{ slug: string }>;
};

type Author = {
  id: string;
  prenom: string;
  nom: string;
  poste_actuel: string;
  image_url: string;
  image_mobile?: string;
  image_alt: string;
  experience: string;
  expertise: string;
  description_courte: string;
  description: string;
  liens_sociaux: { platform: string; url: string }[];
  statut: boolean;
  is_shiny?: boolean;
};

type Article = {
  id: string;
  url: string;
  titre: string;
  description: string;
  image_url: string;
  image_mobile?: string;
  image_alt?: string;
  type: string;
  categorie: string | string[];
  sexe: string;
  is_featured?: boolean;
  niveau?: string;
  nombre_seances?: string;
  duree_moyenne?: string;
  created_at: string;
  auteur?: string;
};

function getAuthorSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await fetchAuthorBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';

  if (!author) {
    return {
      title: "Auteur introuvable | Glift",
    };
  }

  const name = `${author.prenom} ${author.nom}`;
  const title = `${name} – ${author.poste_actuel || "Auteur & Expert Musculation"} | Glift`;
  const description = author.description_courte || `Découvrez le profil, le parcours et les articles de musculation rédigés par ${name} sur Glift.`;
  const canonicalUrl = `${siteUrl}/blog/auteurs/${slug}`;
  const imageUrl = author.image_url ? (author.image_url.startsWith("http") ? author.image_url : `${siteUrl}${author.image_url}`) : `${siteUrl}/images/gabriel_fort.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: canonicalUrl,
      siteName: "Glift",
      locale: "fr_FR",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: author.image_alt || name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

async function fetchAuthorBySlug(slug: string): Promise<Author | null> {
  const supabase = await createServerClient();
  try {
    const { data: dbAuthors } = await (supabase as any)
      .from("auteurs")
      .select("*")
      .eq("statut", true);

    if (dbAuthors && dbAuthors.length > 0) {
      const match = (dbAuthors as Author[]).find(
        (a) => getAuthorSlug(a.prenom, a.nom) === slug
      );
      if (match) return match;
    }
  } catch (err) {
    console.warn("Could not query database table auteurs:", err);
  }

  // Fallback specifically for Gabriel Fort
  if (slug === "gabriel-fort") {
    return {
      id: "1",
      prenom: "Gabriel",
      nom: "Fort",
      poste_actuel: "Fondateur de Glift",
      image_url: "/images/gabriel_fort.png",
      image_alt: "Gabriel Fort",
      experience: "+ 11 ans de pratique de la musculation",
      expertise: "Master en Marketing Interactif et Management de Projet",
      description_courte:
        "Passionné de musculation depuis l'adolescence et pratiquant régulier depuis plus de 11 ans , Gabriel Fort a créé l'outil qui l'aurait aimé avoir lorsqu'il a décidé de se lancer sérieusement dans la musculation. Découvrez son parcours et ses motivations.",
      description: `
        <p>Gabriel Fort est né dans les années 90 et c'est après avoir découvert le physique d'Arnold Schwarzenegger au cinéma que son intérêt pour la musculation est né. Comme beaucoup d'adolescents avant lui, il a acheté deux haltères et a commencé à s'entraîner dans sa chambre sans réellement savoir comment s'y prendre.</p>
        <p>C'est quelques années plus tard, quelques mois avant la naissance de sa première fille, que Gabriel s'est mis sérieusement à la musculation avec pour objectif que sa fille ait l'image d'un papa "fort".</p>
        <p>Heureusement, entre temps, internet est arrivé et c'est principalement à travers des articles de blogs et des vidéos Youtube que Gabriel a pu développer ses connaissances pour notamment comprendre comment construire un programme de musculation ou élaborer un plan alimentaire adapté à lui et ses objectifs.</p>
        <p>Devenu rapidement accroc à la musculation, qui lui a permis de prendre confiance en lui et surtout à aborder la vie avec discipline, Gabriel a transformé son garage en Home Gym afin de pouvoir s'entraîner tous les soirs après le travail.</p>
        <p>Plutôt réservé et préoccupé par le regard des autres, c'est finalement suite à une expatriation au Canada qu'il a mis les pieds pour la première fois dans une salle de sport et qu'il a compris que beaucoup de personnes suivaient le même parcours que lui : envie de se construire un meilleur physique mais sans réellement savoir comment s'y prendre et avec la peur d'être jugé.</p>
        <p>C'est à ce moment-là que l'idée de Glift a commencé à germer dans son esprit. L'idée de créer un outil qui permettra à n'importe quel pratiquant de musculation motivé de pouvoir concevoir ou trouver un programme de musculation qui correspond à son niveau et ses objectifs afin de progresser à son rythme.</p>
      `,
      liens_sociaux: [
        { platform: "facebook", url: "#" },
        { platform: "twitter", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "tiktok", url: "#" },
        { platform: "youtube", url: "#" },
      ],
      statut: true,
    };
  }

  return null;
}

export default async function AuthorDetailPage({ params }: Props) {
  const { slug } = await params;
  const author = await fetchAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const supabase = await createServerClient();
  const authorFullName = `${author.prenom} ${author.nom}`;

  // Fetch blog articles written by this author
  let articles: Article[] = [];
  try {
    const { data: dbArticles } = await (supabase.from("blog_articles") as any)
      .select(
        "id, url, titre, description, image_url, image_mobile, image_alt, type, categorie, sexe, is_featured, niveau, nombre_seances, duree_moyenne, created_at, auteur"
      )
      .eq("is_published", true)
      .eq("auteur", authorFullName)
      .order("created_at", { ascending: false });

    if (dbArticles) {
      articles = dbArticles as Article[];
    }
  } catch (err) {
    console.warn("Could not query blog_articles for author:", err);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glift.io';
  const authorEntityId = `${siteUrl}/blog/auteurs/${slug}#person`;
  const authorImageUrl = author.image_url ? (author.image_url.startsWith('http') ? author.image_url : `${siteUrl}${author.image_url}`) : `${siteUrl}/images/gabriel_fort.png`;

  // Liens sociaux externes valides pour sameAs (signal d'autorité GEO)
  const sameAsLinks = (author.liens_sociaux || [])
    .map(link => link.url)
    .filter(url => url && url.startsWith('http') && !url.includes('#'));

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
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": authorFullName,
        "item": `${siteUrl}/blog/auteurs/${slug}`
      }
    ]
  };

  const personProfileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteUrl}/blog/auteurs/${slug}#webpage`,
    "url": `${siteUrl}/blog/auteurs/${slug}`,
    "name": `${authorFullName} – Profil Auteur | Glift`,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Glift"
    },
    "mainEntity": {
      "@type": "Person",
      "@id": authorEntityId,
      "name": authorFullName,
      "givenName": author.prenom,
      "familyName": author.nom,
      "jobTitle": author.poste_actuel,
      "image": authorImageUrl,
      "description": author.description_courte,
      "url": `${siteUrl}/blog/auteurs/${slug}`,
      ...(sameAsLinks.length > 0 ? { "sameAs": sameAsLinks } : {}),
      "worksFor": {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Glift",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo-glift.svg`
        }
      },
      "hasOccupation": {
        "@type": "Occupation",
        "name": author.poste_actuel
      },
      "knowsAbout": [
        "Musculation",
        "Programmes de musculation",
        "Hypertrophie musculaire",
        "Nutrition sportive",
        "Force athlétique",
        "Discipline sportive"
      ],
      ...(author.expertise ? {
        "hasCredential": {
          "@type": "EducationalOccupationalCredential",
          "name": author.expertise
        }
      } : {})
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
          __html: JSON.stringify(personProfileSchema)
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
          <Link
            href="/blog/auteurs"
            className="hover:text-[#2E3271] transition-colors"
          >
            Auteurs
          </Link>
          <Image src="/icons/chevron_right.svg" alt="" width={6} height={12} aria-hidden="true" className="shrink-0" />
          <span className="text-[#3A416F]">{authorFullName}</span>
        </div>
      </div>

      {/* Header text content */}
      <div className="max-w-[760px] mx-auto text-center mb-[30px] md:mb-12">
        <h1 className="text-[30px] font-bold text-[#2E3271] leading-tight mb-[15px]">
          {authorFullName}
        </h1>
        <p className="text-[16px] text-[#5D6494] font-semibold">
          {author.poste_actuel}
        </p>
      </div>

      {/* Profile Details Section */}
      <div className="max-w-[1152px] mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-[30px]">
        {/* Left Column: Image + Socials */}
        <div className="w-full md:w-[270px] flex flex-col items-center shrink-0">
          {(() => {
            const isGabriel =
              author.prenom?.trim().toLowerCase() === "gabriel" &&
              author.nom?.trim().toLowerCase() === "fort";
            const isShiny = Boolean(author.is_shiny);

            const desktopCutout = author.image_url || (isGabriel ? "/images/gabrielfort.png" : "/images/gabriel_fort.png");
            const mobileCutout = author.image_mobile || author.image_url || (isGabriel ? "/images/gabrielfort_mobile.png" : "/images/gabriel_fort.png");

            return (
              <div className="relative w-full h-[180px] sm:h-[220px] md:w-[270px] md:h-[270px] rounded-[20px] overflow-hidden border border-[#ECE9F1]">
                {author.image_mobile ? (
                  <>
                    <ShinyAuthorImage
                      src={mobileCutout}
                      alt={author.image_alt || authorFullName}
                      isShiny={isShiny}
                      sizes="(max-width: 768px) 100vw, 270px"
                      className="w-full h-full object-cover md:hidden rounded-[20px]"
                      containerClassName="w-full h-full md:hidden rounded-[20px]"
                      priority
                    />
                    <ShinyAuthorImage
                      src={desktopCutout}
                      alt={author.image_alt || authorFullName}
                      isShiny={isShiny}
                      sizes="270px"
                      className="w-full h-full object-cover hidden md:block rounded-[20px]"
                      containerClassName="w-full h-full hidden md:block rounded-[20px]"
                      priority
                    />
                  </>
                ) : (
                  <ShinyAuthorImage
                    src={desktopCutout}
                    alt={author.image_alt || authorFullName}
                    isShiny={isShiny}
                    sizes="(max-width: 768px) 100vw, 270px"
                    className="w-full h-full object-cover rounded-[20px]"
                    containerClassName="w-full h-full rounded-[20px]"
                    priority
                  />
                )}
              </div>
            );
          })()}
          {/* Social Links under image */}
          {author.liens_sociaux && author.liens_sociaux.length > 0 && (
            <div className="flex items-center justify-center gap-[10px] mt-5">
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
                    className="w-[30px] h-[30px] flex items-center justify-center hover:opacity-80 transition-opacity duration-200 shrink-0"
                    aria-label={link.platform}
                  >
                    {customLogo ? (
                      <Image
                        src={customLogo}
                        alt={link.platform}
                        width={30}
                        height={30}
                        className="w-[30px] h-[30px] object-contain shrink-0"
                      />
                    ) : isWebsite ? (
                      <Globe className="w-[30px] h-[30px] text-[#5D6494] hover:text-[#3A416F] transition-colors" />
                    ) : (
                      <FontAwesomeIcon
                        icon={getSocialIcon(link.platform)}
                        className="w-[30px] h-[30px] text-[#5D6494] hover:text-[#3A416F] transition-colors"
                      />
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Profile details */}
        <div className="flex-1">

          {/* Metadata (Experience / Expertises) */}
          <div className="flex flex-col gap-0 mb-[14px] md:mb-[10px]">
            {author.experience && (
              <>
                {/* Mobile version (mockup stacked) */}
                <div className="flex items-start gap-[10px] md:hidden">
                  <Image
                    src="/icons/experience.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="shrink-0 mt-[2px]"
                  />
                  <div className="flex flex-col gap-[6px]">
                    <span className="text-[#3a416f] font-bold text-[14px]">
                      Expérience
                    </span>
                    <span className="text-[#5D6494] text-[14px] font-semibold leading-relaxed">
                      {author.experience}
                    </span>
                  </div>
                </div>

                {/* Desktop version */}
                <div className="hidden md:flex items-center gap-4 text-[14px] font-semibold">
                  <div className="flex items-center gap-2 w-[120px] shrink-0">
                    <Image
                      src="/icons/experience.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="shrink-0"
                    />
                    <span className="text-[#3a416f] font-bold">
                      Expérience
                    </span>
                  </div>
                  <span className="text-[#5D6494]">
                    {author.experience}
                  </span>
                </div>
                <div className="w-full h-[1px] bg-[#EBECEE] my-[14px] md:my-[10px]" />
              </>
            )}
            {author.expertise && (
              <>
                {/* Mobile version (mockup stacked) */}
                <div className="flex items-start gap-[10px] md:hidden">
                  <Image
                    src="/icons/expertise.svg"
                    alt=""
                    width={18}
                    height={20}
                    className="shrink-0 mt-[2px]"
                  />
                  <div className="flex flex-col gap-[6px]">
                    <span className="text-[#3a416f] font-bold text-[14px]">
                      Expertises
                    </span>
                    <span className="text-[#5D6494] text-[14px] font-semibold leading-relaxed">
                      {author.expertise}
                    </span>
                  </div>
                </div>

                {/* Desktop version */}
                <div className="hidden md:flex items-center gap-4 text-[14px] font-semibold">
                  <div className="flex items-center gap-2 w-[120px] shrink-0">
                    <Image
                      src="/icons/expertise.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="shrink-0"
                    />
                    <span className="text-[#3a416f] font-bold">
                      Expertises
                    </span>
                  </div>
                  <span className="text-[#5D6494]">
                    {author.expertise}
                  </span>
                </div>
                <div className="w-full h-[1px] bg-[#EBECEE] my-[14px] md:my-[10px]" />
              </>
            )}
          </div>

          {/* Bio Description */}
          <div
            className="text-[14px] text-[#5D6494] font-semibold leading-relaxed [&_p]:mb-4 last:[&_p]:mb-0"
            dangerouslySetInnerHTML={{
              __html: author.description || author.description_courte,
            }}
          />
        </div>
      </div>

      {/* Separation line */}
      <div className="max-w-[1152px] mx-auto w-full h-[1px] bg-[#ECE9F1] my-[30px]" />

        {/* Articles Grid Section with LoadMore */}
        <div className="max-w-[1152px] mx-auto">
          <h2 className="text-[14px] font-bold text-[#3A416F] uppercase mb-1 tracking-wider">
            Les articles de {author.prenom} {author.nom}
          </h2>
          <p className="text-[14px] text-[#5D6494] mb-8 font-semibold">
            Voici tous les articles réalisés par {author.prenom} {author.nom}.
          </p>

          <AuthorArticlesClient articles={articles} authorName={authorFullName} />
        </div>
      </main>
    </>
  );
}
