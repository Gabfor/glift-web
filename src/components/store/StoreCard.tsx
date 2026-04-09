"use client";

import Image from "next/image";
import { downloadProgram } from "@/utils/downloadProgram";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DownloadAuthModal from "@/components/DownloadAuthModal";
import CTAButton from "@/components/CTAButton";

import { createClient } from "@/lib/supabaseClient";
import { useEffect } from "react";
import Tooltip from "@/components/Tooltip";

type Props = {
  program: {
    id: string;
    title: string;
    level: string;
    duration: string;
    sessions: string;
    description: string;
    image: string;
    image_alt: string;
    partner_image?: string;
    partner_image_alt?: string;
    partner_link?: string;
    link?: string;
    gender: string;
    plan: "starter" | "premium";
  };
  isAuthenticated: boolean;
  subscriptionPlan: string | null;
};

export default function StoreCard({ program, isAuthenticated, subscriptionPlan }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lockedHover, setLockedHover] = useState(false);
  // Logic: Restricted if user is starter AND program is premium.
  const isRestricted = isAuthenticated && subscriptionPlan === 'starter' && program.plan === 'premium';

  const handleDownload = async () => {
    if (!isAuthenticated || loading || isRestricted) return;
    setLoading(true);
    const newProgramId = await downloadProgram(program.id);
    setLoading(false);
    if (newProgramId) {
      console.log("Programme téléchargé avec succès :", newProgramId);
      localStorage.setItem("newly_downloaded_program_id", newProgramId);
      router.push("/entrainements");
    }
  };

  const genderIcons =
    program.gender === "Tous"
      ? [{ src: "/icons/mixte.svg", label: "mixte" }]
      : program.gender === "Homme"
        ? [{ src: "/icons/homme.svg", label: "homme" }]
        : program.gender === "Femme"
          ? [{ src: "/icons/femme.svg", label: "femme" }]
          : [];

  return (
    <div className="w-full max-w-[270px] bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col">
      {/* IMAGE PRINCIPALE */}
      <div className="relative w-full h-[180px]">
        <Image
          src={program.image}
          alt={program.image_alt || program.title}
          fill
          className="object-cover rounded-t-[15px]"
          unoptimized
        />
      </div>

      {/* IMAGE PARTENAIRE ENTRE IMAGE ET TITRE */}
      {program.partner_image && (
        <div className="flex justify-center -mt-8 relative z-10">
          {program.partner_link ? (
            <a
              href={program.partner_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(93,100,148,0.25)] relative">
                <Image
                  src={program.partner_image}
                  alt={program.partner_image_alt || "Partenaire"}
                  fill
                  sizes="100%"
                  className="object-cover"
                  unoptimized
                />
              </div>
            </a>
          ) : (
            <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-white overflow-hidden shadow-[0_0_10px_rgba(93,100,148,0.25)] relative">
              <Image
                src={program.partner_image}
                alt={program.partner_image_alt || "Partenaire"}
                fill
                sizes="100%"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      {/* CONTENU TEXTE */}
      <div className="pt-2 px-2.5 pb-5 flex-1 flex flex-col">
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left line-clamp-2 h-[48px]">
          {program.title}
        </h3>

        <div className="flex justify-start flex-wrap gap-[5px] mb-[10px] min-h-[32px]">
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
            {program.level}
          </span>
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
            {program.sessions} {parseInt(program.sessions) > 1 ? "séances" : "séance"}
          </span>
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[8px] h-[25px] inline-flex items-center justify-center rounded-[5px]">
            {program.duration} min
          </span>
          {genderIcons.map(({ src, label }) => (
            <Tooltip key={label} content={`Programme ${label}`} placement="top" asChild={true}>
              <span
                className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] h-[25px] w-[25px] inline-flex items-center justify-center rounded-[5px]"
              >
                <Image
                  src={src}
                  alt={`Icône ${label}`}
                  width={14}
                  height={14}
                  aria-hidden="true"
                />
                <span className="sr-only">Programme {label}</span>
              </span>
            </Tooltip>
          ))}
        </div>

        <p className="text-[14px] text-[#5D6494] font-semibold mb-5 text-left line-clamp-3 h-[63px]">
          {program.description}
        </p>

        {/* BOUTON TÉLÉCHARGER - Fixed structure to prevent layout jumps */}
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
              onClick={() => setShowModal(true)}
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

        {/* LIEN EN SAVOIR PLUS */}
        <a
          href={program.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-[#5D6494] font-semibold mt-3 cursor-pointer hover:text-[#3A416F] transition"
        >
          En savoir plus
        </a>
      </div>

      {/* MODALE DE CONNEXION */}
      <DownloadAuthModal
        show={showModal}
        onClose={() => setShowModal(false)}
        mode={isRestricted ? "restricted" : "auth"}
      />
    </div>
  );
}
