"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import { useUser } from "@/context/UserContext";
import { downloadProgram } from "@/utils/downloadProgram";
import DownloadAuthModal from "@/components/DownloadAuthModal";
import { createClient } from "@/lib/supabaseClient";

type ContentBlock = {
  id: string;
  type: string;
  titre?: string;
  texte?: string;
  ancreId?: string;
  programme_id?: string;
  table_rows?: any[];
};

type Props = {
  blocks: ContentBlock[];
  articleMeta?: {
    objectif?: string;
    nombre_seances?: string;
    duree_moyenne?: string;
    nombre_semaines?: string;
    lieu?: string;
    intensite?: string;
    sexe?: string;
    niveau?: string;
  };
};

export default function BlogArticleBlocksRenderer({ blocks, articleMeta }: Props) {
  const getNiveauIcon = (niveau?: string) => {
    if (!niveau) return "/icons/admin_niveau_1.svg";
    const n = niveau.toLowerCase();
    if (n.includes("débutant") || n.includes("tous")) return "/icons/admin_niveau_1.svg";
    if (n.includes("intermédiaire")) return "/icons/admin_niveau_2.svg";
    if (n.includes("confirmé")) return "/icons/admin_niveau_3.svg";
    return "/icons/admin_niveau_1.svg";
  };

  const getSexeIcon = (sexe?: string) => {
    if (!sexe) return "/icons/admin_sexe.svg";
    const s = sexe.toLowerCase();
    if (s.includes("femme")) return "/icons/admin_femme.svg";
    if (s.includes("homme")) return "/icons/admin_sexe.svg";
    if (s.includes("tous") || s.includes("mixte")) return "/icons/admin_mixte.svg";
    return "/icons/admin_sexe.svg";
  };

  const getIntensiteIcon = (intensite?: string) => {
    if (!intensite) return "/icons/admin_intensite_modere.svg";
    const i = intensite.toLowerCase();
    if (i.includes("faible")) return "/icons/admin_intensite_faible.svg";
    if (i.includes("modérée") || i.includes("modere")) return "/icons/admin_intensite_modere.svg";
    if (i.includes("élevée") || i.includes("eleve")) return "/icons/admin_intensite_eleve.svg";
    return "/icons/admin_intensite_modere.svg";
  };

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
                    className="prose prose-sm xl:prose-base max-w-none text-[#5D6494] font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
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
                    className="prose prose-sm xl:prose-base max-w-none text-[#5D6494] font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]"
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
              <div key={key} className="flex flex-col scroll-mt-[100px]" id={block.ancreId || "programme"}>
                <h2 className="text-[22px] font-bold text-[#2E3271] mb-2">
                  Présentation et structure du programme
                </h2>
                <div
                  className="prose prose-sm xl:prose-base max-w-none text-[#5D6494] font-semibold mb-6"
                >
                  <p>Voici, en un coup d’oeil, les informations clés du programme :</p>
                </div>
                <div
                  className="bg-white rounded-[15px] border border-[#D7D4DC] p-[30px] grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-[15px]"
                >
                  <CharacteristicItem icon="/icons/admin_objectif.svg" label="Objectif" value={articleMeta?.objectif} />
                  <CharacteristicItem icon="/icons/admin_temps.svg" label="Durée moyenne des séances" value={articleMeta?.duree_moyenne ? `${articleMeta.duree_moyenne} min` : undefined} />
                  <CharacteristicItem icon="/icons/admin_seance.svg" label="Nombre de séances" value={articleMeta?.nombre_seances} />
                  <CharacteristicItem icon="/icons/admin_semaines.svg" label="Nombre de semaines" value={articleMeta?.nombre_semaines} />
                  <CharacteristicItem icon={getNiveauIcon(articleMeta?.niveau)} label="Niveau" value={articleMeta?.niveau} />
                  <CharacteristicItem icon="/icons/admin_lieu.svg" label="Lieu d'entraînement" value={articleMeta?.lieu} />
                  <CharacteristicItem icon={getSexeIcon(articleMeta?.sexe)} label="Sexe" value={articleMeta?.sexe} />
                  <CharacteristicItem icon={getIntensiteIcon(articleMeta?.intensite)} label="Intensité" value={articleMeta?.intensite} />
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
              <DownloadBlock 
                key={key} 
                programmeId={block.programme_id || ""} 
                ancreId={block.ancreId}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
function DownloadBlock({ programmeId, ancreId }: { programmeId: string, ancreId?: string }) {
  const router = useRouter();
  const { isAuthenticated, isPremiumUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"auth" | "restricted">("auth");
  const [programInfo, setProgramInfo] = useState<{ plan: string } | null>(null);

  useEffect(() => {
    const trimmedId = programmeId?.trim();
    if (!trimmedId) return;

    const fetchInfo = async () => {
      const supabase = createClient();
      
      // 1. D'abord chercher par ID de Store
      let { data } = await supabase
        .from("program_store")
        .select("plan")
        .eq("id", trimmedId)
        .single();
      
      // 2. Si non trouvé, chercher si c'est un linked_program_id dans le store
      if (!data) {
        const { data: storeData } = await supabase
          .from("program_store")
          .select("plan")
          .eq("linked_program_id", trimmedId)
          .maybeSingle();
        data = storeData;
      }

      if (data) setProgramInfo(data);
    };
    fetchInfo();
  }, [programmeId]);

  const isRestricted = isAuthenticated && !isPremiumUser && programInfo?.plan === "premium";

  const handleDownload = async () => {
    const trimmedId = programmeId?.trim();
    if (!trimmedId) return;
    
    if (!isAuthenticated) {
      setModalMode("auth");
      setShowModal(true);
      return;
    }

    if (isRestricted) {
      setModalMode("restricted");
      setShowModal(true);
      return;
    }

    setLoading(true);
    const newProgramId = await downloadProgram(trimmedId);
    setLoading(false);

    if (newProgramId) {
      localStorage.setItem("newly_downloaded_program_id", newProgramId);
      router.push("/entrainements");
    }
  };

  return (
    <div id={ancreId} className="flex justify-center scroll-mt-[100px]">
      <div className="min-h-[44px] flex items-center justify-center">
        {isAuthenticated && !isRestricted ? (
          <CTAButton
            onClick={handleDownload}
            loading={loading}
            className="text-[16px] font-semibold bg-[#7069FA] hover:bg-[#5E56E8] text-white"
          >
            <span className="inline-flex items-center gap-2">
              <Image src="/icons/download.svg" alt="" width={20} height={20} />
              Télécharger
            </span>
          </CTAButton>
        ) : (
          <CTAButton
            onClick={() => {
              setModalMode(!isAuthenticated ? "auth" : "restricted");
              setShowModal(true);
            }}
            variant="inactive"
            className="group text-[16px] font-semibold"
          >
            <span className="inline-flex items-center gap-2">
              <div className="relative w-[15px] h-[15px]">
                <Image
                  src="/icons/locked.svg"
                  alt=""
                  fill
                  className="group-hover:hidden transition-opacity"
                />
                <Image
                  src="/icons/locked_hover.svg"
                  alt=""
                  fill
                  className="hidden group-hover:block transition-opacity"
                />
              </div>
              Télécharger
            </span>
          </CTAButton>
        )}
      </div>

      <DownloadAuthModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        mode={modalMode} 
      />
    </div>
  );
}

function CharacteristicItem({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-4">
      <img src={icon} alt="" className="w-[28px] h-[28px] shrink-0" />
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[14px] font-semibold text-[#5D6494]">{label} :</span>
        <span className="text-[14px] font-bold text-[#2E3271]">{value || "—"}</span>
      </div>
    </div>
  );
}
