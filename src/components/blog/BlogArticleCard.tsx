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
    image_alt?: string;
    type: string;
    categorie?: string;
    sexe?: string;
    niveau?: string;
    nombre_seances?: string;
    duree_moyenne?: string;
  };
};

export default function BlogArticleCard({ article }: Props) {
  const isProgramme = article.type === "Programme";

  return (
    <div className="w-full max-w-[270px] bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col h-full">
      <div className="relative w-full h-[180px] bg-[#F4F5FE]">
        <Image
          src={article.image_url || "/images/placeholder_image.jpg"}
          alt={article.image_alt || article.titre}
          fill
          className="w-full h-full object-cover rounded-t-[15px]"
          unoptimized
        />
        {/* Badge Type (CONSEIL...) */}
        <div className="absolute top-[15px] left-[15px] bg-[#6660E4] text-white text-[10px] h-[20px] px-[10px] font-bold uppercase rounded-[10px] shadow-sm tracking-wider flex items-center justify-center">
          {article.type || "Conseil"}
        </div>
      </div>

      <div className="pt-2 px-2.5 pb-5 flex-1 flex flex-col items-start">
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left leading-tight line-clamp-2">
          {article.titre}
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
              <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
                {article.categorie || "Lifestyle"}
              </span>
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
        
        <p className="text-[14px] text-[#5D6494] font-semibold mb-5 text-left line-clamp-3 leading-relaxed">
          {article.description}
        </p>

        <Link href={`/blog/${article.url}`} className="mt-auto mx-auto">
          <CTAButton
            className="text-[16px] font-semibold bg-[#7069FA] hover:bg-[#5E56E8] text-white flex items-center justify-center gap-2"
          >
            Lire cet article
            <Image
              src="/icons/arrow.svg"
              alt="Flèche"
              width={25}
              height={25}
              className="ml-[-5px]"
            />
          </CTAButton>
        </Link>
      </div>
    </div>
  );
}
