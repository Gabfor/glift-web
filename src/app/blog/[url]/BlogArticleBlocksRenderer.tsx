"use client";

import React from "react";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";

type ContentBlock = {
  id: string;
  type: string;
  titre?: string;
  texte?: string;
  ancreId?: string;
  url?: string;
  nom_bouton?: string;
  table_rows?: any[];
};

type Props = {
  blocks: ContentBlock[];
};

export default function BlogArticleBlocksRenderer({ blocks }: Props) {
  React.useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            const headerOffset = 100;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
            // Update URL without jump
            window.history.pushState(null, "", href);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-[30px] w-full text-[15px] text-[#5D6494] leading-[1.7]">
      {blocks.map((block) => {
        const key = block.id;

        switch (block.type) {
          case "titre-texte":
            return (
              <div key={key} id={block.ancreId || undefined} className="flex flex-col gap-[10px] scroll-mt-[100px]">
                {block.titre && (
                  <h2 className="text-[22px] font-bold text-[#2E3271]">
                    {block.titre}
                  </h2>
                )}
                {block.texte && (
                  <div
                    className="prose prose-sm xl:prose-base max-w-none text-[#5D6494] space-y-4 font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
                    dangerouslySetInnerHTML={{ __html: block.texte }}
                  />
                )}
              </div>
            );

          case "texte":
            return (
              <div key={key} id={block.ancreId || undefined} className="flex flex-col scroll-mt-[100px]">
                {block.texte && (
                  <div
                    className="prose prose-sm xl:prose-base max-w-none text-[#5D6494] space-y-4 font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
                    dangerouslySetInnerHTML={{ __html: block.texte }}
                  />
                )}
              </div>
            );

          case "source":
            return (
              <React.Fragment key={key}>
                <div className="w-full h-[1px] bg-[#E7E8EA]" />
                <div
                  id={block.ancreId || undefined}
                  className="bg-[#F7F7FF] rounded-[10px] p-[20px] flex flex-col gap-[10px]"
                >
                {block.titre && (
                  <h3 className="text-[14px] font-bold text-[#2E3271]">
                    {block.titre}
                  </h3>
                )}
                {block.texte && (
                  <div
                    className="text-[12px] text-[#5D6494] font-semibold [&_a]:underline [&_a]:text-[#5D6494] [&_a]:hover:text-[#3A416F] transition-colors [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 source-text-container"
                    dangerouslySetInnerHTML={{ __html: block.texte }}
                  />
                )}
              </div>
            </React.Fragment>
          );

          case "programme":
            return (
              <div
                key={key}
                id={block.ancreId || undefined}
                className="bg-[#FAFAFF] rounded-[15px] p-[25px] border border-[#E9E8EC] flex flex-col gap-[15px] scroll-mt-[100px]"
              >
                {block.titre && (
                  <h3 className="text-[18px] font-bold text-[#2E3271] text-center mb-2">
                    {block.titre}
                  </h3>
                )}
                {block.texte && (
                  <div
                    className="prose prose-sm max-w-none text-[#5D6494] mb-4 text-center font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
                    dangerouslySetInnerHTML={{ __html: block.texte }}
                  />
                )}
                <div className="flex justify-center">
                   <Link href="/program-store">
                     <CTAButton className="font-semibold bg-[#7069FA] text-white">
                        Découvrir les programmes
                     </CTAButton>
                   </Link>
                </div>
              </div>
            );

          case "seance":
            return (
              <div key={key} id={block.ancreId || undefined} className="flex flex-col gap-[15px] scroll-mt-[100px]">
                {block.titre && (
                  <h2 className="text-[20px] font-bold text-[#2E3271]">
                    {block.titre}
                  </h2>
                )}
                {block.texte && (
                  <div
                    className="prose prose-sm max-w-none text-[#5D6494] font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
                    dangerouslySetInnerHTML={{ __html: block.texte }}
                  />
                )}
                {block.table_rows && block.table_rows.length > 0 && (
                  <div className="overflow-x-auto w-full mt-4">
                    <table className="w-full border-collapse bg-white border border-[#D7D4DC] rounded-[10px] overflow-hidden">
                      <thead>
                        <tr className="bg-[#F4F5FE]">
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-[#3A416F] uppercase">Jour</th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-[#3A416F] uppercase">Exercice</th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-[#3A416F] uppercase">Séries</th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-[#3A416F] uppercase">Reps</th>
                          <th className="px-4 py-3 text-left text-[12px] font-bold text-[#3A416F] uppercase">Repos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.table_rows.map((row, idx) => (
                          <tr key={idx} className="border-t border-[#E9E8EC]">
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#5D6494]">{row.jour}</td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#5D6494]">{row.exercice}</td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#5D6494]">{row.series}</td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#5D6494]">{row.reps}</td>
                            <td className="px-4 py-3 text-[14px] font-semibold text-[#5D6494]">{row.repos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );

          case "telechargement":
            return (
              <div
                key={key}
                id={block.ancreId || undefined}
                className="bg-white rounded-[15px] p-[25px] border border-[#D7D4DC] flex flex-col md:flex-row items-center gap-[20px] justify-between shadow-sm scroll-mt-[100px]"
              >
                <div className="flex flex-col gap-[5px] flex-1">
                  {block.titre && (
                    <h3 className="text-[18px] font-bold text-[#2E3271]">
                      {block.titre}
                    </h3>
                  )}
                  {block.texte && (
                    <div
                      className="text-[14px] text-[#5D6494] line-clamp-3 font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
                      dangerouslySetInnerHTML={{ __html: block.texte }}
                    />
                  )}
                </div>
                {block.url && (
                  <a href={block.url} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                    <CTAButton className="w-full md:w-auto px-8 font-semibold bg-[#7069FA] text-white flex items-center gap-2">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="white"/>
                       </svg>
                       {block.nom_bouton || "Télécharger"}
                    </CTAButton>
                  </a>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
