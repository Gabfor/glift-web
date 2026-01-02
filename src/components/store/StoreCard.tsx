"use client";

import Image from "next/image";
import { downloadProgram } from "@/utils/downloadProgram";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DownloadAuthModal from "@/components/DownloadAuthModal";
import CTAButton from "@/components/CTAButton";

import { createClient } from "@/lib/supabaseClient";
import { useEffect } from "react";

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
  };
  isAuthenticated: boolean;
  subscriptionPlan: string | null;
};

export default function StoreCard({ program, isAuthenticated, subscriptionPlan }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lockedHover, setLockedHover] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated || !subscriptionPlan) return;

      if (subscriptionPlan === 'basic') {
        const sessions = parseInt(program.sessions);

        // Rule 1: > 1 Session
        if (sessions > 1) {
          setIsRestricted(true);
          return;
        }

        // Rule 2: 1 Session > 10 Exercises
        if (sessions === 1) {
          setCheckingEligibility(true);
          const supabase = createClient();

          try {
            // 1. Get linked program ID
            const { data: storeData } = await supabase
              .from('program_store')
              .select('linked_program_id')
              .eq('id', program.id)
              .single();

            if (storeData?.linked_program_id) {
              // 2. Get trainings (should be 1)
              const { data: trainings } = await supabase
                .from('trainings_admin')
                .select('id')
                .eq('program_id', storeData.linked_program_id);

              if (trainings && trainings.length > 0) {
                const trainingIds = trainings.map(t => t.id);
                // 3. Count exercises
                const { count } = await supabase
                  .from('training_rows_admin')
                  .select('*', { count: 'exact', head: true })
                  .in('training_id', trainingIds);

                if (count && count > 10) {
                  setIsRestricted(true);
                }
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setCheckingEligibility(false);
          }
        }
      } else {
        setIsRestricted(false);
      }
    };

    checkEligibility();
  }, [isAuthenticated, subscriptionPlan, program]);

  const handleDownload = async () => {
    if (!isAuthenticated || loading || isRestricted || checkingEligibility) return;
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
      ? [
        { src: "/icons/homme.svg", label: "homme" },
        { src: "/icons/femme.svg", label: "femme" },
      ]
      : program.gender === "Homme"
        ? [{ src: "/icons/homme.svg", label: "homme" }]
        : program.gender === "Femme"
          ? [{ src: "/icons/femme.svg", label: "femme" }]
          : [];

  return (
    <div className="w-full max-w-[270px] bg-white rounded-[8px] border border-[#D7D4DC] overflow-hidden flex flex-col">
      {/* IMAGE PRINCIPALE */}
      <Image
        src={program.image}
        alt={program.image_alt || program.title}
        width={540}
        height={360}
        className="w-full h-[180px] object-cover rounded-t-[8px]"
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
          <span className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px] inline-flex items-center gap-[5px]">
            {program.duration} min
          </span>
          {genderIcons.map(({ src, label }) => (
            <span
              key={label}
              className="bg-[#F4F5FE] text-[#A1A5FD] text-[10px] font-semibold px-[5px] py-[5px] rounded-[5px] inline-flex items-center justify-center gap-[5px]"
              title={`Programme ${label}`}
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
          ))}
        </div>

        <p className="text-[14px] text-[#5D6494] font-semibold mb-5 text-left">
          {program.description}
        </p>

        {/* BOUTON TÉLÉCHARGER */}
        {isAuthenticated ? (
          checkingEligibility ? (
            <div className="mx-auto w-full h-[40px] flex items-center justify-center bg-[#F2F1F6] rounded-[25px] text-[#D7D4DC] font-semibold text-[16px]">
              Calcul...
            </div>
          ) : isRestricted ? (
            <div className="mx-auto w-full h-[40px] flex items-center justify-center gap-2 bg-[#F2F1F6] rounded-[25px] text-[#D7D4DC] font-semibold text-[16px] cursor-not-allowed select-none">
              <Image src="/icons/locked.svg" alt="Cadenas" width={15} height={15} />
              Télécharger
            </div>
          ) : (
            <CTAButton
              onClick={handleDownload}
              loading={loading}
              className="mx-auto text-[16px] font-semibold bg-[#7069FA] hover:bg-[#5E56E8] text-white"
            >
              <span className="inline-flex items-center gap-2">
                Télécharger
                <Image src="/icons/download.svg" alt="" width={20} height={20} />
              </span>
            </CTAButton>
          )
        ) : (
          <CTAButton
            onClick={() => setShowModal(true)}
            onMouseEnter={() => setLockedHover(true)}
            onMouseLeave={() => setLockedHover(false)}
            variant="inactive"
            className="mx-auto text-[16px] font-semibold"
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
