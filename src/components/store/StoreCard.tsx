"use client";

import Image from "next/image";
import { downloadProgram } from "@/utils/downloadProgram";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DownloadAuthModal from "@/components/DownloadAuthModal";
import CTAButton from "@/components/CTAButton";

type Props = {
  program: {
    id: number;
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
  };
  isAuthenticated: boolean;
};

export default function StoreCard({ program, isAuthenticated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lockedHover, setLockedHover] = useState(false);

  const handleDownload = async () => {
    if (!isAuthenticated || loading) return;
    setLoading(true);
    const newProgramId = await downloadProgram(program.id);
    setLoading(false);
    if (newProgramId) {
      console.log("Programme téléchargé avec succès :", newProgramId);
      localStorage.setItem("newly_downloaded_program_id", newProgramId);
      router.push("/entrainements");
    }
  };

  return (
    <div className="w-full max-w-[270px] bg-white rounded-[5px] border border-[#ECE9F1] overflow-hidden flex flex-col shadow-glift hover:shadow-glift-hover transition-all duration-300 transform hover:-translate-y-1">
      {/* IMAGE PRINCIPALE */}
      <Image
        src={program.image}
        alt={program.image_alt || program.title}
        width={540}
        height={360}
        className="w-full h-[180px] object-cover rounded-t-[5px]"
        unoptimized
      />

      {/* IMAGE PARTENAIRE ENTRE IMAGE ET TITRE */}
      {program.partner_image && (
        <div className="flex justify-center -mt-8">
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
        <h3 className="text-[#2E3271] text-[16px] font-bold mb-[10px] uppercase text-left">
          {program.title}
        </h3>

        <div className="flex justify-start flex-wrap gap-[5px] mb-[10px]">
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px]">
            {program.level}
          </span>
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px]">
            {program.sessions} séances
          </span>
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px]">
            {program.duration} min
          </span>
        </div>

        <p className="text-[14px] text-[#5D6494] font-semibold mb-5 text-left">
          {program.description}
        </p>

        {/* BOUTON TÉLÉCHARGER */}
        {isAuthenticated ? (
          <CTAButton
            onClick={handleDownload}
            loading={loading}
            className="mx-auto font-bold text-[16px]"
          >
            <span className="inline-flex items-center gap-2">
              Télécharger
              <Image src="/icons/download.svg" alt="" width={20} height={20} />
            </span>
          </CTAButton>
        ) : (
          <CTAButton
            onClick={() => setShowModal(true)}
            onMouseEnter={() => setLockedHover(true)}
            onMouseLeave={() => setLockedHover(false)}
            variant="inactive"
            className="mx-auto font-bold text-[16px]"
          >
            <span className="inline-flex items-center gap-2">
              <Image
                src={`/icons/${lockedHover ? "locked_hover" : "locked"}.svg`}
                alt=""
                width={15}
                height={15}
              />
              Télécharger
            </span>
          </CTAButton>
        )}

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
      <DownloadAuthModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
