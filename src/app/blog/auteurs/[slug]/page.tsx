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
  faYoutube,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";
import { Globe } from "lucide-react";
import BlogArticleCard from "@/components/blog/BlogArticleCard";

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
  image_alt: string;
  experience: string;
  expertise: string;
  description_courte: string;
  description: string;
  liens_sociaux: { platform: string; url: string }[];
  statut: boolean;
};

type Article = {
  id: string;
  url: string;
  titre: string;
  description: string;
  image_url: string;
  image_alt?: string;
  type: string;
  categorie: string;
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
    case "youtube":
      return faYoutube;
    case "linkedin":
      return faLinkedinIn;
    default:
      return faFacebookF;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await fetchAuthorBySlug(slug);

  if (!author) {
    return {
      title: "Auteur introuvable",
    };
  }

  const name = `${author.prenom} ${author.nom}`;
  return {
    title: name,
    description: author.description_courte || `Profil de l'auteur ${name}`,
    alternates: {
      canonical: `/blog/auteurs/${slug}`,
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
        "id, url, titre, description, image_url, image_alt, type, categorie, sexe, is_featured, niveau, nombre_seances, duree_moyenne, created_at, auteur"
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

  return (
    <main className="min-h-screen bg-[#FBFCFE] pt-[140px] px-4">
      {/* Fil d'ariane (Breadcrumbs) */}
      <div className="max-w-[1152px] mx-auto mb-10">
        <div className="flex items-center gap-[10px] text-[12px] font-semibold text-[#5D6494]">
          <Link href="/blog" className="hover:text-[#2E3271] transition-colors">
            Blog
          </Link>
          <span>›</span>
          <Link
            href="/blog/auteurs"
            className="hover:text-[#2E3271] transition-colors"
          >
            Auteurs
          </Link>
          <span>›</span>
          <span className="text-[#3A416F]">{authorFullName}</span>
        </div>
      </div>

      {/* Header text content */}
      <div className="max-w-[760px] mx-auto px-4 md:px-0 text-center mb-12">
        <h1 className="text-[30px] font-bold text-[#2E3271] leading-tight mb-[15px]">
          {authorFullName}
        </h1>
        <p className="text-[16px] text-[#5D6494] font-semibold mb-[20px]">
          {author.poste_actuel}
        </p>
      </div>

      {/* Profile Details Section */}
      <div className="max-w-[1152px] mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-start mb-[30px]">
        {/* Left Column: Image + Socials */}
        <div className="w-full md:w-[270px] flex flex-col items-center shrink-0">
          <div className="relative w-[270px] h-[270px] rounded-[20px] overflow-hidden border border-[#ECE9F1]">
            <Image
              src={author.image_url || "/images/gabriel_fort.png"}
              alt={author.image_alt || authorFullName}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Social Links under image */}
          {author.liens_sociaux && author.liens_sociaux.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              {author.liens_sociaux.map((link, idx) => {
                if (!link.url || !link.platform) return null;
                const isWebsite =
                  link.platform.toLowerCase() === "website" ||
                  link.platform.toLowerCase() === "site web" ||
                  link.platform.toLowerCase() === "globe";
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5D6494] hover:text-[#3A416F] transition-colors duration-200"
                    aria-label={link.platform}
                  >
                    {isWebsite ? (
                      <Globe className="w-[20px] h-[20px]" />
                    ) : (
                      <FontAwesomeIcon
                        icon={getSocialIcon(link.platform)}
                        className="w-[20px] h-[20px]"
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
          <div className="flex flex-col gap-0 mb-[10px]">
            {author.experience && (
              <>
                <div className="flex items-center gap-4 text-[14px] font-semibold">
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
                <div className="w-full h-[1px] bg-[#EBECEE] my-[10px]" />
              </>
            )}
            {author.expertise && (
              <>
                <div className="flex items-center gap-4 text-[14px] font-semibold">
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
                <div className="w-full h-[1px] bg-[#EBECEE] my-[10px]" />
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

      {/* Articles Grid Section */}
      <div className="max-w-[1152px] mx-auto">
        <h2 className="text-[14px] font-bold text-[#3A416F] uppercase mb-1 tracking-wider">
          Les articles de {author.prenom} {author.nom}
        </h2>
        <p className="text-[14px] text-[#5D6494] mb-8 font-semibold">
          Voici tous les articles réalisés par {author.prenom} {author.nom}.
        </p>

        {articles.length > 0 ? (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] justify-center mt-6">
            {articles.map((article) => (
              <BlogArticleCard
                key={article.id}
                article={article}
                blogUrl="/blog"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#5D6494] text-[16px] font-semibold">
              Aucun article n'a été rédigé par cet auteur pour le moment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
