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
    <div className="w-full bg-white rounded-[20px] border border-[#E9E8EC] overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(58,65,111,0.08)] transition-all duration-300">
      <div className="relative w-full h-[240px] bg-[#F4F5FE]">
        <Image
          src={article.image_url || "/images/placeholder_image.jpg"}
          alt={article.image_alt || article.titre}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Badge Type (CONSEIL...) */}
        <div className="absolute top-[15px] left-[15px] bg-[#6660E4] text-white text-[11px] font-bold uppercase px-[14px] py-[6px] rounded-[10px] shadow-sm tracking-wider">
          {article.type || "Conseil"}
        </div>
      </div>

      <div className="p-[25px] flex-1 flex flex-col items-start">
        {/* Badges Catégorie & Sexe */}
        <div className="flex items-center gap-[10px] mb-[15px]">
          <div className="bg-[#F4F5FE] text-[#7069FA] text-[12px] font-bold px-[12px] py-[6px] rounded-[5px]">
            {article.categorie || "Lifestyle"}
          </div>
          {(article.sexe === "Homme" || article.sexe === "Femme" || article.sexe === "Tous") && (
            <div className="bg-[#F4F5FE] w-[30px] h-[30px] rounded-[5px] flex items-center justify-center">
              <Image 
                src={article.sexe === "Homme" ? "/icons/homme.svg" : article.sexe === "Femme" ? "/icons/femme.svg" : "/icons/mixte.svg"} 
                alt={article.sexe} 
                width={16} 
                height={16} 
              />
            </div>
          )}
        </div>

        <h3 className="text-[#3A416F] text-[18px] font-bold mb-[15px] uppercase leading-tight line-clamp-2">
          {article.titre}
        </h3>
        
        <p className="text-[14px] text-[#5D6494] font-medium mb-[25px] line-clamp-3 leading-relaxed">
          {article.description}
        </p>

        <div className="mt-auto w-full flex justify-center">
          <Link href={`/blog/${article.url}`} className="w-full max-w-[220px]">
            <CTAButton
              className="w-full text-[14px] font-bold bg-[#7069FA] hover:bg-[#5E56E8] text-white py-[12px] rounded-full flex items-center justify-center gap-2"
            >
              Lire cet article
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </CTAButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
