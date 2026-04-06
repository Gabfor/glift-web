import Image from "next/image";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";

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
  };
};

export default function BlogArticleCard({ article }: Props) {
  return (
    <div className="w-full bg-white rounded-[20px] border border-[#E9E8EC] overflow-hidden flex flex-col h-full transition-all duration-300">
      <div className="relative w-full h-[240px] bg-[#F4F5FE]">
        <Image
          src={article.image_url || "/images/placeholder_image.jpg"}
          alt={article.image_alt || article.titre}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Badge Type (CONSEIL...) */}
        <div className="absolute top-[15px] left-[15px] bg-[#6660E4] text-white text-[10px] h-[20px] px-[10px] font-bold uppercase rounded-[10px] shadow-sm tracking-wider flex items-center justify-center">
          {article.type || "Conseil"}
        </div>
      </div>

      <div className="pt-[10px] px-[10px] pb-[30px] flex-1 flex flex-col items-start">
        {/* Badges Catégorie & Sexe */}
        <div className="flex items-center gap-[5px] mb-[15px]">
          <div className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px]">
            {article.categorie || "Lifestyle"}
          </div>
          
          {/* Logique de genre identique au Store */}
          {article.sexe === "Tous" ? (
            <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px] inline-flex items-center justify-center">
              <Image src="/icons/mixte.svg" alt="Mixte" width={14} height={14} />
            </span>
          ) : article.sexe === "Homme" ? (
            <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px] inline-flex items-center justify-center">
              <Image src="/icons/homme.svg" alt="Homme" width={14} height={14} />
            </span>
          ) : article.sexe === "Femme" ? (
            <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px] inline-flex items-center justify-center">
              <Image src="/icons/femme.svg" alt="Femme" width={14} height={14} />
            </span>
          ) : null}
        </div>

        <h3 className="text-[#3A416F] text-[16px] font-bold mb-[15px] uppercase leading-tight line-clamp-2">
          {article.titre}
        </h3>
        
        <p className="text-[14px] text-[#5D6494] font-semibold mb-[20px] line-clamp-3 leading-relaxed">
          {article.description}
        </p>

          <Link href={`/blog/${article.url}`} className="mt-auto mx-auto group">
            <CTAButton
              className="font-semibold text-[16px] flex items-center justify-center gap-2"
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
