import Image from "next/image";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import Tooltip from "@/components/Tooltip";

type Props = {
  article: {
    id: string;
    url: string;
    titre: string;
    description: string;
    image_url: string;
    image_mobile?: string;
    image_alt?: string;
    type: string;
    categorie?: string | string[];
    sexe?: string;
    niveau?: string;
    nombre_seances?: string;
    duree_moyenne?: string;
  };
  maxWidth?: string;
  imageHeight?: string;
  blogUrl?: string;
  className?: string;
};

function getCategories(cat: unknown): string[] {
  if (Array.isArray(cat)) {
    return cat.filter((c): c is string => typeof c === "string" && c.trim() !== "");
  }
  if (typeof cat === "string") {
    try {
      const parsed = JSON.parse(cat);
      if (Array.isArray(parsed)) {
        return parsed.filter((c): c is string => typeof c === "string" && c.trim() !== "");
      }
    } catch {}
    return cat.trim() ? [cat.trim()] : [];
  }
  return [];
}

export default function BlogArticleCard({ 
  article, 
  maxWidth, 
  imageHeight, 
  blogUrl = "/blog",
  className = "" 
}: Props) {
  const isProgramme = article.type === "Programme";
  const categories = getCategories(article.categorie);
  const displayCategories = categories.length > 0 ? categories : ["Lifestyle"];

  return (
    <div 
      className={`w-full bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col h-full shadow-glift hover:shadow-glift-hover transition-shadow duration-200 ${className}`}
      style={maxWidth ? { maxWidth } : {}}
    >
      <Link href={`${blogUrl}/${article.url}`} className="block">
        {article.image_mobile ? (
          <>
            <div 
              className="relative w-full h-[180px] md:hidden bg-[#F4F5FE] cursor-pointer"
              style={imageHeight ? { height: imageHeight } : {}}
            >
              <Image
                src={article.image_mobile}
                alt={article.image_alt || article.titre}
                fill
                className="w-full h-full object-cover rounded-t-[15px]"
                unoptimized
              />
              {/* Badge Type (CONSEIL...) */}
              <div className={`absolute top-[15px] left-[15px] ${isProgramme ? "bg-[#6660E4]" : "bg-[#3A416F]"} text-white text-[10px] h-[20px] px-[10px] font-bold uppercase rounded-[10px] shadow-glift tracking-wider flex items-center justify-center`}>
                {article.type || "Conseil"}
              </div>
            </div>
            <div 
              className="relative w-full h-[180px] hidden md:block bg-[#F4F5FE] cursor-pointer"
              style={imageHeight ? { height: imageHeight } : {}}
            >
              <Image
                src={article.image_url || "/images/placeholder_image.jpg"}
                alt={article.image_alt || article.titre}
                fill
                className="w-full h-full object-cover rounded-t-[15px]"
                unoptimized
              />
              {/* Badge Type (CONSEIL...) */}
              <div className={`absolute top-[15px] left-[15px] ${isProgramme ? "bg-[#6660E4]" : "bg-[#3A416F]"} text-white text-[10px] h-[20px] px-[10px] font-bold uppercase rounded-[10px] shadow-glift tracking-wider flex items-center justify-center`}>
                {article.type || "Conseil"}
              </div>
            </div>
          </>
        ) : (
          <div 
            className="relative w-full h-[180px] bg-[#F4F5FE] cursor-pointer"
            style={imageHeight ? { height: imageHeight } : {}}
          >
            <Image
              src={article.image_url || "/images/placeholder_image.jpg"}
              alt={article.image_alt || article.titre}
              fill
              className="w-full h-full object-cover rounded-t-[15px]"
              unoptimized
            />
            {/* Badge Type (CONSEIL...) */}
            <div className={`absolute top-[15px] left-[15px] ${isProgramme ? "bg-[#6660E4]" : "bg-[#3A416F]"} text-white text-[10px] h-[20px] px-[10px] font-bold uppercase rounded-[10px] shadow-glift tracking-wider flex items-center justify-center`}>
              {article.type || "Conseil"}
            </div>
          </div>
        )}
      </Link>

      <div className="pt-5 px-2.5 pb-5 flex-1 flex flex-col items-start">
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left leading-tight line-clamp-2">
          <Link href={`${blogUrl}/${article.url}`}>
            {article.titre}
          </Link>
        </h3>

        {/* Badges Dynamiques */}
        <div className="flex justify-start flex-wrap gap-[5px] mb-[10px]">
          {isProgramme ? (
            <>
              {/* 1. Niveau */}
              {article.niveau && (
                <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
                  {article.niveau}
                </span>
              )}
              {/* 2. Nombre de séances */}
              {article.nombre_seances && (
                <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
                  {article.nombre_seances} {Number(article.nombre_seances) <= 1 ? "séance" : "séances"}
                </span>
              )}
              {/* 3. Durée moyenne */}
              {article.duree_moyenne && (
                <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
                  {article.duree_moyenne} min
                </span>
              )}
            </>
          ) : (
            <>
              {/* Pour les articles classiques (Conseil...) */}
              {displayCategories.map((cat) => (
                <span key={cat} className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
                  {cat}
                </span>
              ))}
            </>
          )}

          {/* 4. Sexe (Commun à tous) */}
          {article.sexe === "Tous" ? (
            <Tooltip content="Article mixte" placement="top" asChild={true}>
              <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] h-[25px] w-[25px] inline-flex items-center justify-center rounded-[5px]">
                <Image src="/icons/mixte.svg" alt="Mixte" width={14} height={14} />
              </span>
            </Tooltip>
          ) : article.sexe === "Homme" ? (
            <Tooltip content="Article homme" placement="top" asChild={true}>
              <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] h-[25px] w-[25px] inline-flex items-center justify-center rounded-[5px]">
                <Image src="/icons/homme.svg" alt="Homme" width={14} height={14} />
              </span>
            </Tooltip>
          ) : article.sexe === "Femme" ? (
            <Tooltip content="Article femme" placement="top" asChild={true}>
              <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] h-[25px] w-[25px] inline-flex items-center justify-center rounded-[5px]">
                <Image src="/icons/femme.svg" alt="Femme" width={14} height={14} />
              </span>
            </Tooltip>
          ) : null}
        </div>
        
        <p className="text-[14px] text-[#5D6494] font-semibold mb-5 text-left line-clamp-4 leading-relaxed">
          {article.description}
        </p>

        <div className="w-full mt-auto flex justify-center">
          <Link href={`${blogUrl}/${article.url}`} className="w-full md:w-auto">
            <CTAButton
              className="w-full md:w-auto text-[16px] font-semibold bg-[#7069FA] hover:bg-[#5E56E8] text-white flex items-center justify-center md:px-[30px]"
            >
              Lire cet article
            </CTAButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
