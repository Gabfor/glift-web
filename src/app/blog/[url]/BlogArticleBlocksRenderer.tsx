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
import PricingTable from "@/components/PricingTable";
import { Subscription } from "@/app/admin/create-blog-article/blogArticleForm";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";
import { EmailField, isValidEmail } from "@/components/forms/EmailField";
import { motion, AnimatePresence } from "framer-motion";

const PlaceholderImage = ({ width, height, className = "" }: { width?: number | string, height?: number | string, className?: string }) => (
  <div 
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      minHeight: typeof height === 'number' ? `${height}px` : height,
    }}
    className={`bg-[#F2F1F6] text-[#D7D4DC] font-bold text-[32px] tracking-wider flex items-center justify-center rounded-[15px] ${className}`}
  >
    IMAGE
  </div>
);

function hexToRgba(hex: string, opacityPercent: number = 100): string {
  let cleanHex = (hex || "#FBFCFE").replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    cleanHex = "FBFCFE";
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const alpha = Math.min(100, Math.max(0, isNaN(opacityPercent) ? 65 : opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  abonnement1?: Subscription;
  abonnement2?: Subscription;
};

type Props = {
  blocks: ContentBlock[];
  isConceptPage?: boolean;
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

function NewsletterBlockComponent({ block, gradientStyle }: { block: any, gradientStyle?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isValid = isValidEmail(email);

  const cleanText = (raw?: string) => {
    if (!raw) return "";
    return raw.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message || "Merci pour ton inscription !");
        setEmail("");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Une erreur est survenue.");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 3000);
      }
    } catch (err) {
      setStatus("error");
      setMessage("Une erreur réseau est survenue.");
    }
  };

  return (
    <div
      id={block.ancreId || undefined}
      className="w-full max-w-[1152px] mx-auto rounded-[20px] px-[20px] py-[2.5rem] sm:p-[2.5rem] scroll-mt-[100px] my-0"
      style={{
        background: gradientStyle || "linear-gradient(115deg, rgba(246, 233, 249, 0.65) 0%, rgba(240, 235, 255, 0.65) 45%, rgba(228, 236, 255, 0.65) 100%)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Colonne gauche (Surtitre, Titre, Texte + Icône Enveloppe) */}
        <div className="flex flex-col justify-center">
          {/* Icône Enveloppe dans un cercle */}
          <div className="w-[30px] h-[30px] rounded-full border-2 border-[#2E3271] text-[#2E3271] flex items-center justify-center mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>

          {/* Surtitre */}
          <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
            {cleanText(block.surtitre) || "NEWSLETTER"}
          </p>

          {/* Titre */}
          <h2 className="text-[28px] font-bold text-[#2E3271] leading-tight mb-[10px]">
            {cleanText(block.titre) || "Reste informé"}
          </h2>

          {/* Texte */}
          <p className="text-[#5D6494] font-semibold text-[16px] leading-relaxed max-w-[440px]">
            {cleanText(block.texte) || "Abonne-toi à notre newsletter et sois le premier informé des nouveautés, des offres spéciales et plein d'autres choses ! Lien de désabonnement dans chaque email."}
          </p>
        </div>

        {/* Colonne droite (Carte blanche avec EmailField & CTAButton - Animation de la droite vers la gauche au scroll) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-[20px] p-6 sm:p-8 border border-[#D7D4DC] shadow-[0_4px_20px_rgba(93,100,148,0.06)]"
        >
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex flex-col sm:flex-row items-end gap-[20px] sm:gap-3 w-full">
              <div className="flex-1 w-full">
                <EmailField
                  value={email}
                  onChange={setEmail}
                  label="Email"
                  placeholder="john.doe@email.com"
                  hideSuccessMessage={true}
                  messageContainerClassName="hidden min-h-0 mt-0 h-0"
                  disabled={status === "loading"}
                />
              </div>
              <CTAButton
                type="submit"
                variant={isValid ? "active" : "inactive"}
                disabled={!isValid || status === "loading"}
                loading={status === "loading"}
                loadingText="Inscription..."
                className="w-full sm:w-auto h-[45px] px-6"
              >
                {cleanText(block.boutonTexte) || "S'abonner"}
              </CTAButton>
            </div>

            <AnimatePresence>
              {status === "success" && (
                <motion.p
                  key="success-msg"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="text-[#10B981] font-semibold text-[14px] mt-2 overflow-hidden"
                >
                  {message}
                </motion.p>
              )}

              {status === "error" && (
                <motion.p
                  key="error-msg"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="text-[#EF4444] font-semibold text-[14px] mt-2 overflow-hidden"
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

interface BlogArticleBlocksRendererProps {
  blocks: any[];
  articleMeta?: any;
  isConceptPage?: boolean;
  isFeaturePage?: boolean;
  pageUrl?: string;
}

export default function BlogArticleBlocksRenderer({
  blocks,
  articleMeta,
  isConceptPage = false,
  isFeaturePage = false,
  pageUrl,
}: BlogArticleBlocksRendererProps) {
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>({});

  const { contactUrl, storeUrl, shopUrl } = useDashboardUrl();
  const siteSettings = useSiteSettings();
  const {
    trialDays,
    gradientEnabled,
    gradientColor1,
    gradientOpacity1,
    gradientColor2,
    gradientOpacity2,
    gradientColor3,
    gradientOpacity3,
  } = siteSettings;

  const rgba1 = hexToRgba(gradientColor1 || "#F6E9F9", gradientOpacity1 ?? 65);
  const rgba2 = hexToRgba(gradientColor2 || "#E4ECFF", gradientOpacity2 ?? 65);
  const rgba3 = hexToRgba(gradientColor3 || "#F0EBFF", gradientOpacity3 ?? 80);

  const dynamicGradient = gradientEnabled
    ? `linear-gradient(115deg, ${rgba1} 0%, ${rgba3} 45%, ${rgba2} 100%)`
    : "none";

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
    <div className={`flex flex-col gap-[30px] w-full ${isConceptPage ? "text-[16px]" : "text-[15px]"} text-[#5D6494] leading-[1.7] [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]`}>
      {blocks.map((block, index) => {
        const key = block.id;

        switch (block.type) {
          case "titre":
            return (
              <div key={key} id={block.ancreId || undefined} className={`flex flex-col scroll-mt-[100px] text-center w-full ${isConceptPage ? 'max-w-[500px]' : 'max-w-[760px]'} mx-auto`}>
                {block.surtitre && (
                  <div className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
                    {block.surtitre}
                  </div>
                )}
                {block.titre && (
                  <div 
                    className="text-[24px] sm:text-[32px] md:text-[30px] font-bold text-[var(--color-text-heading)] leading-snug"
                    dangerouslySetInnerHTML={{ __html: block.titre.replace(/\n/g, '<br />') }}
                  />
                )}
              </div>
            );

          case "texte-image":
            const isRight = block.imagePosition === "droite";
            const isFirstBlock = index === 0 || (index === 1 && blocks[0]?.type === "boutons");
            return (
              <AnimatedSection key={key} className="w-full" isFirst={isFirstBlock}>
                <div id={block.ancreId || undefined} className="w-full max-w-[956px] mx-auto flex flex-col md:flex-row items-center justify-between gap-[24px] scroll-mt-[100px]">
                  {/* Order on mobile is always Image then Text if not specified, but here we respect imagePosition */}
                  {/* On mobile flex-col items-center will center them horizontally */}
                  
                  <div className={`flex items-center ${isRight ? "order-2 md:order-1" : "order-2"}`}>
                    <div className="w-full md:w-[466px] flex flex-col items-center">
                      <div className="w-full max-w-[400px] flex flex-col items-start text-left">
                        {block.surtitre && (
                          <div className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
                            {block.surtitre}
                          </div>
                        )}
                        {block.titre && (
                          <div 
                            className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]"
                            dangerouslySetInnerHTML={{ __html: block.titre.replace(/\n/g, '<br />') }}
                          />
                        )}
                        {block.texte && (
                          <div 
                            className={`text-[var(--color-text-body)] ${isConceptPage || isFeaturePage ? "text-[16px]" : "text-[15px]"} leading-relaxed font-semibold mb-[20px] prose prose-sm max-w-none [&_p]:mb-0 [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]`}
                            dangerouslySetInnerHTML={{ __html: block.texte }}
                          />
                        )}
                        {block.boutonType && block.boutonType !== "aucun" && block.boutonTexte && (
                          <Link
                            href={block.boutonLien || "#"}
                            className={
                              block.boutonType === "primaire"
                                ? "btn-primary w-full sm:w-[250px] flex justify-center items-center h-[55px]"
                                : "w-full sm:w-fit px-[30px] h-[44px] group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
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
                    </div>
                  </div>

                  <div className={`w-full md:w-auto flex items-center justify-center ${isRight ? "order-1 md:order-2" : "order-1"}`}>
                    <div className="flex-shrink-0 w-full max-w-[466px] md:w-[466px] flex items-center justify-center">
                      {block.image ? (
                        <Image
                          src={block.image}
                          alt={block.alt || ""}
                          width={466}
                          height={350}
                          priority={false}
                          className="w-full max-w-[466px] md:w-[466px] h-auto md:h-[350px] rounded-[15px] object-cover"
                        />
                      ) : (
                        <PlaceholderImage width={466} height={350} className="w-full max-w-[466px] md:w-[466px] h-[260px] md:h-[350px]" />
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            );

          case "card":
          case "bonus":
            if (block.enabled === false) return null;

            const card1Data = block.card1 || {};
            const card2Data = block.card2 || {};

            const cleanText = (raw?: string) => {
              if (!raw) return "";
              return raw.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
            };

            return (
              <React.Fragment key={key}>
                <div 
                  id={block.ancreId || undefined} 
                  className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-[25px] md:mt-0 py-[50px] md:py-[100px] scroll-mt-[100px]"
                  style={{
                    background: dynamicGradient,
                  }}
                >
                  <div className="max-w-[1152px] mx-auto px-4 md:px-0 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-10 items-center">
                    
                    {/* Colonne gauche (Texte + Bonus épuré) */}
                    <div className="flex flex-col justify-center">
                      {/* Icône Plus */}
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-[#2E3271] text-[#2E3271] flex items-center justify-center font-bold text-[16px] mb-3">
                        +
                      </div>

                      {/* Surtitre */}
                      <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
                        {cleanText(block.surtitre) || "BONUS"}
                      </p>

                      {/* Titre */}
                      <h2 className="text-[28px] font-bold text-[#2E3271] leading-tight mb-[10px]">
                        {cleanText(block.titre) || "Glift, c'est bien plus"}
                      </h2>

                      {/* Texte descriptif épuré (sans traces de code) */}
                      <p className="text-[#5D6494] font-semibold text-[16px] leading-relaxed max-w-[440px]">
                        {cleanText(block.texte) || "Glift n'est pas seulement un écosystème qui te permet de créer, organiser et suivre tes programmes de musculation."}
                      </p>
                    </div>

                    {/* Colonne droite (2 Cards sans image : Store et Shop - 368px chacun, séparés par 24px) */}
                    <div className="flex flex-col sm:flex-row gap-[24px] items-stretch justify-end w-full">
                      
                      {/* Card 1: Glift Store */}
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full sm:w-[368px] max-w-[368px] bg-white rounded-[24px] p-7 shadow-[0_4px_20px_rgba(93,100,148,0.06)] border border-[#D7D4DC] flex flex-col justify-between h-full flex-shrink-0"
                      >
                        <div className="mb-[20px]">
                          <h3 className="text-[24px] font-bold text-[#2E3271] mb-[10px]">
                            {cleanText(card1Data.titre) || "Le Glift Store"}
                          </h3>

                          <p className="text-[#5D6494] font-semibold text-[16px] leading-relaxed">
                            {cleanText(card1Data.texte) || "En seulement un clic, télécharge des programmes de musculation, complets, clé en main, correspondant à ton profil et à tes objectifs."}
                          </p>
                        </div>

                        {card1Data.boutonType !== "aucun" && (
                          <Link
                            href={card1Data.boutonLien || storeUrl || "/store"}
                            className="h-[44px] px-6 rounded-full border border-[#2E3271] text-[#2E3271] hover:bg-[#2E3271] hover:text-white font-semibold text-[16px] transition group flex items-center justify-center gap-2 cursor-pointer mt-auto w-full sm:w-fit"
                          >
                            {cleanText(card1Data.boutonTexte) || "Découvrir le Store"}
                            <div className="relative w-[20px] h-[20px]">
                              <Image
                                src="/icons/arrow_blue.svg"
                                alt="Flèche"
                                fill
                                className="object-contain transition-opacity group-hover:opacity-0"
                              />
                              <Image
                                src="/icons/arrow.svg"
                                alt="Flèche"
                                fill
                                className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                              />
                            </div>
                          </Link>
                        )}
                      </motion.div>

                      {/* Card 2: Glift Shop */}
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
                        className="w-full sm:w-[368px] max-w-[368px] bg-white rounded-[24px] p-7 shadow-[0_4px_20px_rgba(93,100,148,0.06)] border border-[#D7D4DC] flex flex-col justify-between h-full flex-shrink-0"
                      >
                        <div className="mb-[20px]">
                          <h3 className="text-[24px] font-bold text-[#2E3271] mb-[10px]">
                            {cleanText(card2Data.titre) || "La Glift Shop"}
                          </h3>

                          <p className="text-[#5D6494] font-semibold text-[16px] leading-relaxed">
                            {cleanText(card2Data.texte) || "Accède aux meilleures réductions du moment pour faire des économies sur tes achats dans l'univers de la musculation, du sport et du bien être."}
                          </p>
                        </div>

                        {card2Data.boutonType !== "aucun" && (
                          <Link
                            href={card2Data.boutonLien || shopUrl || "/shop"}
                            className="h-[44px] px-6 rounded-full border border-[#2E3271] text-[#2E3271] hover:bg-[#2E3271] hover:text-white font-semibold text-[16px] transition group flex items-center justify-center gap-2 cursor-pointer mt-auto w-full sm:w-fit"
                          >
                            {cleanText(card2Data.boutonTexte) || "Découvrir le Shop"}
                            <div className="relative w-[20px] h-[20px]">
                              <Image
                                src="/icons/arrow_blue.svg"
                                alt="Flèche"
                                fill
                                className="object-contain transition-opacity group-hover:opacity-0"
                              />
                              <Image
                                src="/icons/arrow.svg"
                                alt="Flèche"
                                fill
                                className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                              />
                            </div>
                          </Link>
                        )}
                      </motion.div>

                    </div>

                  </div>
                </div>
              </React.Fragment>
            );

          case "tarifs":
            if (block.enabled === false) return null;
            return (
              <div key={key} className="w-full max-w-[1152px] mx-auto scroll-mt-[100px]" id={block.ancreId || undefined}>
                <PricingTable 
                  abonnement1={block.abonnement1} 
                  abonnement2={block.abonnement2} 
                />
              </div>
            );

          case "newsletter":
            if (block.enabled === false) return null;
            return <NewsletterBlockComponent key={key} block={block} gradientStyle={dynamicGradient} />;

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
              <div key={key} className="flex flex-col gap-[10px] scroll-mt-[100px]">
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
              <div key={key} id={block.ancreId || undefined} className={`flex flex-col scroll-mt-[100px] ${isConceptPage ? 'max-w-[500px] mx-auto text-center' : ''}`}>
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
                  className="bg-[#F7F7FF] rounded-[10px] p-[20px] flex flex-col gap-[10px] last:-mb-[20px]"
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
                    <div className="text-[20px] font-bold text-[#2E3271]">
                      {block.titre}
                    </div>
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
                <section className="w-full relative text-center my-[25px]">
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
                  <div className="absolute left-[120px] top-[40%] -translate-y-1/2 hidden md:block pointer-events-none animate-float">
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
                  <div className="absolute right-[150px] top-[25%] -translate-y-1/2 hidden md:block pointer-events-none animate-float-delayed">
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
                <div id={block.ancreId || undefined} className="flex flex-col scroll-mt-[100px] my-[25px]">
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
                      Vous voulez devenir partenaire ?{" "}
                      <br className="sm:hidden" />
                      <Link href={contactUrl} className="text-[#7069FA] hover:no-underline hover:text-[#6660E4] transition-colors">
                        Contactez-nous
                      </Link>
                    </div>
                  </section>
                </div>
              </React.Fragment>
            );

          case "boutons":
            if (block.enabled === false) return null;
            const isAppButtons = block.bouton1?.type === "google" || block.bouton1?.type === "apple" || block.bouton2?.type === "google" || block.bouton2?.type === "apple";

            const renderBtn = (btn?: { type?: string; texte?: string; lien?: string }) => {
              if (!btn || !btn.texte) return null;
              const href = btn.lien || "#";
              const isExternal = href.startsWith("http");

              if (btn.type === "google") {
                return (
                  <Link
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center justify-center gap-3 h-[44px] w-full sm:w-auto px-[28px] sm:px-[30px] rounded-full border border-black bg-white text-black font-semibold text-[15px] sm:text-[16px] whitespace-nowrap select-none cursor-pointer"
                    aria-label={btn.texte}
                  >
                    <svg
                      viewBox="0 0 512 512"
                      className="h-[20px] w-auto shrink-0"
                      aria-hidden="true"
                    >
                      <path fill="#EA4335" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                      <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z" />
                      <path fill="#FBBC04" d="M472.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                      <path fill="#34A853" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                    </svg>
                    <span>{btn.texte}</span>
                  </Link>
                );
              }

              if (btn.type === "apple") {
                return (
                  <Link
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center justify-center gap-3 h-[44px] w-full sm:w-auto px-[28px] sm:px-[30px] rounded-full bg-black text-white font-semibold text-[15px] sm:text-[16px] whitespace-nowrap select-none cursor-pointer"
                    aria-label={btn.texte}
                  >
                    <svg
                      viewBox="0 0 384 512"
                      fill="#FFFFFF"
                      className="h-[20px] w-auto shrink-0 -mt-0.5"
                      aria-hidden="true"
                    >
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                    <span>{btn.texte}</span>
                  </Link>
                );
              }

              if (btn.type === "primaire") {
                return (
                  <Link
                    href={href}
                    className="w-full sm:w-auto bg-[#7069FA] hover:bg-[#6660E4] text-white text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center justify-center gap-2 transition"
                  >
                    {btn.texte}
                    <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" priority={false} width={25} height={25} />
                  </Link>
                );
              }

              return (
                <Link
                  href={href}
                  className="w-full sm:w-auto border border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center justify-center gap-2 transition"
                >
                  {btn.texte}
                </Link>
              );
            };

            return (
              <React.Fragment key={key}>
                <div id={block.ancreId || undefined} className={`flex flex-col items-center justify-center w-full scroll-mt-[100px] ${isAppButtons ? "mb-[30px] sm:mb-[50px]" : ""}`}>
                  <div className={`flex flex-col sm:flex-row items-center justify-center w-full max-w-[500px] gap-4 ${!isAppButtons ? "mb-4" : ""}`}>
                    {renderBtn(block.bouton1)}
                    {renderBtn(block.bouton2)}
                  </div>
                  {!isAppButtons && (
                    <div className="flex justify-center items-center gap-2 text-[14px] text-[#5D6494] font-semibold">
                      <span className="relative flex items-center justify-center w-2 h-2">
                        <span className="absolute -inset-0.5 rounded-full bg-[#00D591] opacity-65 animate-ping"></span>
                        <span className="relative w-2 h-2 rounded-full bg-[#00D591]"></span>
                      </span>
                      {trialDays < 1 ? "1 heure" : `${trialDays} jours`} pour tester • Sans engagement
                    </div>
                  )}
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
