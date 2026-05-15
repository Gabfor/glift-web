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
import AdminSeanceTable from "@/app/admin/components/AdminSeanceTable";
import AnimatedSection from "@/components/AnimatedSection";

const PlaceholderImage = ({ width, height, className = "" }: { width: number | string, height: number | string, className?: string }) => (
  <div 
    style={{ width, height, minHeight: typeof height === 'number' ? `${height}px` : height }}
    className={`bg-[#F2F1F6] text-[#D7D4DC] font-bold text-[32px] tracking-wider flex items-center justify-center rounded-[15px] ${className}`}
  >
    IMAGE
  </div>
);

type ContentBlock = {
  id: string;
  type: string;
  titre?: string;
  texte?: string;
  ancreId?: string;
  programme_id?: string;
  table_rows?: any[];
  surtitre?: string;
  enabled?: boolean;
  slots?: any[];
  bouton1?: any;
  bouton2?: any;
  image?: string;
  alt?: string;
  texte1?: string;
  texte2?: string;
  imagePosition?: "gauche" | "droite";
  boutonType?: "primaire" | "secondaire" | "aucun";
  boutonTexte?: string;
  boutonLien?: string;
  card1?: {
    image?: string;
    alt?: string;
    titre?: string;
    texte?: string;
    boutonType?: "primaire" | "secondaire" | "aucun";
    boutonTexte?: string;
    boutonLien?: string;
  };
  card2?: {
    image?: string;
    alt?: string;
    titre?: string;
    texte?: string;
    boutonType?: "primaire" | "secondaire" | "aucun";
    boutonTexte?: string;
    boutonLien?: string;
  };
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
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});
  const [trialDays, setTrialDays] = useState(30);

  useEffect(() => {
    const fetchTrialDays = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "trial_period_days").single();
      if (data?.value) {
        setTrialDays(parseFloat(data.value));
      }
    };
    fetchTrialDays();
  }, []);

  const firstSeanceId = React.useMemo(() => {
    const first = blocks.find(b => b.type === "seance");
    if (!first) return null;
    return first.id || `seance-${blocks.indexOf(first)}`;
  }, [blocks]);

  const toggleSeance = (id: string, defaultCollapsed: boolean) => {
    setCollapsedState(prev => {
      const current = prev[id] !== undefined ? prev[id] : defaultCollapsed;
      return {
        ...prev,
        [id]: !current
      };
    });
  };

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
      {blocks.map((block, index) => {
        const key = block.id;

        switch (block.type) {
          case "titre":
            return (
              <div key={key} id={block.ancreId || undefined} className="flex flex-col scroll-mt-[100px] text-center w-full max-w-[760px] mx-auto pt-[50px]">
                {block.surtitre && (
                  <p className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
                    {block.surtitre}
                  </p>
                )}
                {block.titre && (
                  <h2 
                    className="text-[24px] sm:text-[32px] md:text-[30px] font-bold text-[var(--color-text-heading)] leading-snug"
                    dangerouslySetInnerHTML={{ __html: block.titre.replace(/\n/g, '<br />') }}
                  />
                )}
              </div>
            );

          case "texte-image":
            const isRight = block.imagePosition === "droite";
            return (
              <div key={key} id={block.ancreId || undefined} className="w-full max-w-[956px] mx-auto flex flex-col md:flex-row items-center justify-between gap-[24px] scroll-mt-[100px]">
                {/* Order on mobile is always Image then Text if not specified, but here we respect imagePosition */}
                {/* On mobile flex-col items-center will center them horizontally */}
                
                <div className={`flex items-center ${isRight ? "order-2 md:order-1" : "order-2"}`}>
                  <AnimatedSection>
                    <div className="w-full md:w-[466px] flex flex-col">
                      {block.surtitre && (
                        <p className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
                          {block.surtitre}
                        </p>
                      )}
                      {block.titre && (
                        <h2 
                          className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]"
                          dangerouslySetInnerHTML={{ __html: block.titre.replace(/\n/g, '<br />') }}
                        />
                      )}
                      {block.texte && (
                        <div 
                          className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold mb-[20px] prose prose-sm max-w-none [&_p]:mb-0"
                          dangerouslySetInnerHTML={{ __html: block.texte }}
                        />
                      )}
                      {block.boutonType && block.boutonType !== "aucun" && block.boutonTexte && (
                        <Link
                          href={block.boutonLien || "#"}
                          className={
                            block.boutonType === "primaire"
                              ? "btn-primary w-[250px] flex justify-center items-center h-[55px]"
                              : "px-[30px] h-[44px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
                          }
                        >
                          {block.boutonTexte}
                          {block.boutonType === "secondaire" && (
                            <div className="relative w-[25px] h-[25px]">
                              <Image src="/icons/arrow_blue.svg" alt="Flèche" fill className="object-contain transition-opacity group-hover:opacity-0" priority={false} />
                              <Image src="/icons/arrow.svg" alt="Flèche" fill className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0" priority={false} />
                            </div>
                          )}
                        </Link>
                      )}
                    </div>
                  </AnimatedSection>
                </div>

                <div className={`flex items-center ${isRight ? "order-1 md:order-2" : "order-1"}`}>
                  <AnimatedSection>
                    <div className="flex-shrink-0">
                      {block.image ? (
                        <Image
                          src={block.image}
                          alt={block.alt || ""}
                          width={466}
                          height={350}
                          priority={false}
                          className="rounded-[15px] object-cover"
                        />
                      ) : (
                        <PlaceholderImage width={466} height={350} />
                      )}
                    </div>
                  </AnimatedSection>
                </div>
              </div>
            );

          case "card":
            if (block.enabled === false) return null;
            return (
              <React.Fragment key={key}>
                <div id={block.ancreId || undefined} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-[10px] pb-0 scroll-mt-[100px] w-full">
                  {[block.card1, block.card2].map((card, idx) => {
                    if (!card) return null;
                    return (
                      <div key={idx} className="bg-white rounded-[20px] p-[20px] flex flex-col lg:flex-row gap-6 items-center lg:items-start border border-[#D7D4DC]">
                        {card.image ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={card.image}
                              alt={card.alt || "Card image"}
                              width={221}
                              height={221}
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0">
                            <PlaceholderImage width={221} height={221} className="!rounded-[20px]" />
                          </div>
                        )}
                        <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-left h-full justify-center">
                          <div className="pt-[10px] pr-[10px]">
                            {card.titre && <h3 className="text-[var(--color-brand-strong)] text-[24px] font-bold mb-2">{card.titre}</h3>}
                            {card.texte && (
                              <div 
                                className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold prose prose-sm max-w-none [&_span.font-bold]:text-[var(--color-text-heading)] [&_strong]:text-[var(--color-text-heading)]"
                                dangerouslySetInnerHTML={{ __html: card.texte }}
                              />
                            )}
                          </div>
                          {card.boutonType !== "aucun" && card.boutonTexte && (
                            <Link 
                              href={card.boutonLien || "#"} 
                              className="h-[44px] px-[30px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition cursor-pointer mt-auto mb-[10px]"
                            >
                              {card.boutonTexte}
                              <div className="relative w-[25px] h-[25px]">
                                <Image
                                  src="/icons/arrow_blue.svg"
                                  alt="Flèche normale"
                                  fill
                                  className="object-contain transition-opacity group-hover:opacity-0"
                                />
                                <Image
                                  src="/icons/arrow.svg"
                                  alt="Flèche blanche"
                                  fill
                                  className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                                />
                              </div>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );

          case "newsletter":
            return null; // Pas encore de rendu public pour ces blocs

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

          case "texte-1-1":
            return (
              <div key={key} className={`flex flex-col gap-[10px] scroll-mt-[100px] ${index > 0 ? "-mt-[20px]" : ""}`}>
                {block.titre && (
                  <h2 className="text-[16px] font-bold text-[#2E3271]">
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
            const seanceKey = block.id || `seance-${index}`;
            const defaultCollapsed = seanceKey !== firstSeanceId;
            const isCollapsed = collapsedState[seanceKey] !== undefined ? collapsedState[seanceKey] : defaultCollapsed;
            
            return (
              <div key={seanceKey} id={block.ancreId || undefined} className="flex flex-col scroll-mt-[100px]">
                {block.titre && (
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleSeance(seanceKey, defaultCollapsed)}
                  >
                    <h2 className="text-[20px] font-bold text-[#2E3271]">
                      {block.titre}
                    </h2>
                    <Image
                      src="/icons/chevron_down.svg"
                      alt="Toggle"
                      width={16}
                      height={16}
                      className={`transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                      style={{ filter: "brightness(0) saturate(100%) invert(20%) sepia(35%) saturate(1450%) hue-rotate(200deg) brightness(85%) contrast(85%)" }} // Approximates #2E3271
                    />
                  </div>
                )}
                
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? "h-0 opacity-0 mt-0" : "opacity-100"}`}>
                  {block.texte && (
                    <div
                      className={`prose prose-sm xl:prose-base max-w-none text-[#5D6494] font-semibold [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F] ${block.titre ? "mt-[20px]" : ""}`}
                      dangerouslySetInnerHTML={{ __html: block.texte }}
                    />
                  )}
                  {block.table_rows && block.table_rows.length > 0 && (
                    <div className="overflow-x-auto w-full">
                      <AdminSeanceTable
                        rows={block.table_rows}
                        setRows={() => {}}
                        readOnly={true}
                      />
                    </div>
                  )}
                </div>
                
                <div className="w-full h-[1px] bg-[#EBECEE] mt-[30px]"></div>
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

          case "image-principale":
            if (block.enabled === false) return null;
            return (
              <React.Fragment key={key}>
                <section className="w-full relative text-center pt-[30px]">
                  {/* Mockups */}
                  <div className="flex justify-center">
                    {block.image ? (
                      <Image
                        src={block.image}
                        alt={block.alt || "Appareils"}
                        priority={false}
                        width={800}
                        height={400}
                        className="w-full max-w-[700px] rounded-[15px]"
                      />
                    ) : (
                      <PlaceholderImage width="100%" height={400} className="w-full max-w-[700px] rounded-[15px]" />
                    )}
                  </div>
                  {/* Flèche + texte gauche */}
                  <div className="absolute left-[120px] top-[40%] -translate-y-1/2 hidden md:block pointer-events-none">
                    <p 
                      className="text-[var(--color-text-strong)] text-[14px] font-bold rotate-[-10deg] origin-left w-[180px]"
                      dangerouslySetInnerHTML={{ __html: (block.texte1 || "").replace(/\n/g, '<br />') }}
                    />
                    <Image
                      src="/images/arrow-left.png"
                      alt="Flèche"
                      priority={false}
                      width={114}
                      height={114}
                      className="ml-[60px] mt-[-35px]"
                    />
                  </div>

                  {/* Flèche + texte droite */}
                  <div className="absolute right-[150px] top-[25%] -translate-y-1/2 hidden md:block pointer-events-none">
                    <p 
                      className="text-[var(--color-text-strong)] text-[14px] font-bold rotate-[8deg] origin-right w-[180px] ml-auto"
                      dangerouslySetInnerHTML={{ __html: (block.texte2 || "").replace(/\n/g, '<br />') }}
                    />
                    <Image
                      src="/images/arrow-right.png"
                      alt="Flèche"
                      priority={false}
                      width={114}
                      height={114}
                      className="ml-[-5px] mt-[-37px]"
                    />
                  </div>
                </section>
              </React.Fragment>
            );

          case "partenaires":
            if (block.enabled === false) return null;
            return (
              <React.Fragment key={key}>
                <div id={block.ancreId || undefined} className="flex flex-col scroll-mt-[100px] pt-[50px]">
                  <section className="text-center px-4 w-full mx-auto">
                    {block.surtitre && (
                      <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
                        {block.surtitre}
                      </p>
                    )}
                    {block.titre && (
                      <h2 className="text-[28px] font-bold leading-snug text-[#2E3271]">
                        {block.titre}
                      </h2>
                    )}
                  </section>

                  <section className="w-full mx-auto px-0 pt-[40px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10 w-full">
                      {(block.slots || []).map((partner: any, idx: number) => {
                        if (!partner.logo_url) return null;
                        return (
                          <div
                            key={idx}
                            className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6 relative w-full"
                          >
                            <div className="relative w-full h-full">
                              {partner.link_url ? (
                                <a href={partner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                                  <Image
                                    src={partner.logo_url}
                                    alt={partner.alt_text || "Partenaire"}
                                    fill
                                    className="object-contain"
                                  />
                                </a>
                              ) : (
                                <Image
                                  src={partner.logo_url}
                                  alt={partner.alt_text || "Partenaire"}
                                  fill
                                  className="object-contain"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center text-[#2E3271] font-semibold text-[15px]">
                      Vous voulez devenir partenaire ? <Link href="/contact" className="text-[#7069FA] hover:no-underline hover:text-[#6660E4] transition-colors">Contactez-nous</Link>
                    </div>
                  </section>
                </div>
              </React.Fragment>
            );

          case "boutons":
            if (block.enabled === false) return null;
            return (
              <React.Fragment key={key}>
                <div id={block.ancreId || undefined} className="flex flex-col items-center justify-center w-full scroll-mt-[100px]">
                  <div className="flex justify-center gap-4 mb-4 flex-wrap">
                    {block.bouton1 && block.bouton1.texte && (
                      <Link
                        href={block.bouton1.lien || "#"}
                        className={block.bouton1.type === "primaire" 
                          ? "bg-[#7069FA] hover:bg-[#6660E4] text-white text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center justify-center gap-2 transition" 
                          : "border border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center gap-2 transition"
                        }
                      >
                        {block.bouton1.texte}
                        {block.bouton1.type === "primaire" && (
                          <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" priority={false} width={25} height={25} />
                        )}
                      </Link>
                    )}
                    {block.bouton2 && block.bouton2.texte && (
                      <Link
                        href={block.bouton2.lien || "#"}
                        className={block.bouton2.type === "primaire" 
                          ? "bg-[#7069FA] hover:bg-[#6660E4] text-white text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center justify-center gap-2 transition" 
                          : "border border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center gap-2 transition"
                        }
                      >
                        {block.bouton2.texte}
                        {block.bouton2.type === "primaire" && (
                          <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" priority={false} width={25} height={25} />
                        )}
                      </Link>
                    )}
                  </div>
                  <div className="flex justify-center items-center gap-2 text-[14px] text-[#5D6494] font-semibold">
                    <span className="relative flex items-center justify-center w-2 h-2">
                      <span className="absolute w-full h-full rounded-full bg-[#00D591] opacity-50 animate-ping"></span>
                      <span className="relative w-2 h-2 rounded-full bg-[#00D591]"></span>
                    </span>
                    {trialDays < 1 ? "1 heure" : `${trialDays} jours`} pour tester gratuitement
                  </div>
                </div>
              </React.Fragment>
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
