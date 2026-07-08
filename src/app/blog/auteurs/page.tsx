import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@/lib/supabaseServer";
import CTAButton from "@/components/CTAButton";

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
  image_alt: string;
  description_courte: string;
  description: string;
  statut: boolean;
};

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
          "Passionné de musculation depuis l'adolescence et pratiquant regular depuis plus de 11 ans , Gabriel Fort a créé l'outil qui l'aurait aimé avoir lorsqu'il a décidé de se lancer sérieusement dans la musculation. Découvrez son parcours et ses motivations.",
        description:
          "Passionné de musculation depuis l'adolescence et pratiquant regular depuis plus de 11 ans , Gabriel Fort a créé l'outil qui l'aurait aimé avoir lorsqu'il a décidé de se lancer sérieusement dans la musculation. Découvrez son parcours et ses motivations.",
        statut: true,
      },
    ];
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
            className="text-[15px] font-semibold text-[#5D6494] max-w-[700px] leading-relaxed [&_p]:m-0"
            dangerouslySetInnerHTML={{
              __html: pageConfig.description,
            }}
          />
        ) : (
          <p className="text-[15px] font-semibold text-[#5D6494] max-w-[700px] leading-relaxed">
            Découvrez les profils de nos auteurs et parcourez leurs derniers articles.
          </p>
        )}
      </div>

      {/* Authors list container */}
      <div className="max-w-[1152px] mx-auto flex flex-col gap-6">
        {authors.map((author) => {
          const authorFullName = `${author.prenom} ${author.nom}`;
          return (
            <div
              key={author.id}
              className="w-full bg-white border border-[#ECE9F1] rounded-[20px] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Profile Image (Left column on desktop, top on mobile) */}
              <div className="relative w-full md:w-[270px] h-[270px] shrink-0">
                <Image
                  src={author.image_url || "/images/gabriel_fort.png"}
                  alt={author.image_alt || authorFullName}
                  fill
                  sizes="(max-width: 768px) 100vw, 270px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Profile details (Right column on desktop) */}
              <div className="flex-1 p-[30px] flex flex-col justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-[#2E3271] uppercase tracking-wide mb-1">
                    {authorFullName}
                  </h2>
                  <p className="text-[14px] font-semibold text-[#3a416f] mb-4">
                    {author.poste_actuel}
                  </p>
                  {(() => {
                    const desc = (author.description_courte || author.description || "").trim();
                    const suffix = "Découvrez son parcours et ses motivations.";
                    let finalDesc = desc;
                    if (desc && !desc.includes(suffix)) {
                      const sentence = " " + suffix;
                      if (desc.endsWith("</p>")) {
                        finalDesc = desc.slice(0, -4) + sentence + "</p>";
                      } else {
                        finalDesc = desc + sentence;
                      }
                    }
                    return (
                      <div
                        className="text-[14px] text-[#5D6494] font-semibold leading-relaxed mb-5 [&_p]:m-0"
                        dangerouslySetInnerHTML={{
                          __html: finalDesc,
                        }}
                      />
                    );
                  })()}
                </div>
                <div>
                  <CTAButton
                    href={`/blog/auteurs/${getAuthorSlug(author.prenom, author.nom)}`}
                  >
                    Voir le profil {getDePreposition(author.prenom)}{author.prenom}
                    <Image
                      src="/icons/arrow.svg"
                      alt="Flèche"
                      width={25}
                      height={25}
                      className="ml-[-5px]"
                    />
                  </CTAButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
