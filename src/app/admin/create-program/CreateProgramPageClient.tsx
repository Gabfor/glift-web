"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import {
  ProgramFormState,
  ProgramRow,
  buildProgramPayload,
  emptyProgram,
  mapProgramRowToForm,
} from "./programForm";

type CreateProgramPageClientProps = {
  initialProgram: ProgramFormState | null;
  programId: string | null;
};

export default function CreateProgramPageClient({
  initialProgram,
  programId,
}: CreateProgramPageClientProps) {
  const supabase = useMemo(() => createClient({ scope: "admin" }), []);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramFormState>(
    initialProgram ?? emptyProgram,
  );
  const [loading, setLoading] = useState(
    () => Boolean(programId) && !initialProgram,
  );
  const showLoader = useMinimumVisibility(loading);

  const fetchProgram = useCallback(
    async (id: string) => {
      setLoading(true);

      const { data, error } = await supabase
        .from("program_store")
        .select("*")
        .eq("id", id)
        .maybeSingle<ProgramRow>();

      if (error) {
        console.error("Erreur lors de la récupération :", error);
        setLoading(false);
        return;
      }

      if (data) {
        setProgram(mapProgramRowToForm(data));
      }

      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    if (initialProgram) {
      setProgram(initialProgram);
      setLoading(false);
      return;
    }

    if (programId) {
      void fetchProgram(programId);
      return;
    }

    setProgram(emptyProgram);
    setLoading(false);
  }, [initialProgram, programId, fetchProgram]);

  const handleSave = async () => {
    const payload = buildProgramPayload(program);

    if (programId) {
      const { error } = await supabase
        .from("program_store")
        .update(payload)
        .eq("id", programId);

      if (error) {
        console.error("Erreur lors de la mise à jour :", error);
        alert(`Erreur : ${error.message}`);
        return;
      }

      router.push("/admin/program-store");
      return;
    }

    const { error } = await supabase
      .from("program_store")
      .insert([payload]);

    if (error) {
      console.error("Erreur lors de la création :", error);
      alert(`Erreur : ${error.message}`);
      return;
    }

    router.push("/admin/program-store");
  };

  const isFormValid = useMemo(
    () =>
      program.title.trim() !== "" &&
      program.level !== "" &&
      program.gender !== "" &&
      program.goal !== "" &&
      program.location !== "" &&
      program.duration.trim() !== "" &&
      program.sessions > 0 &&
      program.description.trim() !== "" &&
      program.image !== "" &&
      program.status !== "",
    [program]
  );

  return (
    <>
      {showLoader && <GliftLoader />}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
        <div className="w-full max-w-3xl px-4 sm:px-0">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {programId ? "Modifier la carte" : "Créer une carte"}
          </h2>

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Sexe */}
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Sexe</label>
                <AdminDropdown
                  label=""
                  placeholder="Sélectionnez le sexe"
                  selected={program.gender}
                  onSelect={(value) => setProgram({ ...program, gender: value })}
                  options={[
                    { value: "Tous", label: "Tous" },
                    { value: "Homme", label: "Homme" },
                    { value: "Femme", label: "Femme" },
                  ]}
                />
              </div>

                {/* Image principale */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[16px] text-[#3A416F] font-bold">Image principale</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">270px x 180px</span>
                  </div>
                  <ImageUploader
                    value={program.image}
                    onChange={(url) => setProgram({ ...program, image: url })}
                  />
                </div>

                {/* Titre */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[16px] text-[#3A416F] font-bold">Titre</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                      {program.title.length}/52
                    </span>
                  </div>
                <input
                  type="text"
                  placeholder="Titre du programme"
                  value={program.title}
                  onChange={(e) => setProgram({ ...program, title: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              {/* Alt image principale */}
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Alt image principale</label>
                <input
                  type="text"
                  placeholder="Alt de l’image principale"
                  value={program.image_alt}
                  onChange={(e) => setProgram({ ...program, image_alt: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col">
              <div className="flex justify-between mb-[5px]">
                <span className="text-[16px] text-[#3A416F] font-bold">Description</span>
                <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                  {program.description.length}/120
                </span>
              </div>
                <textarea
                  placeholder="Description du programme"
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  className="min-h-[143px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              {/* Images partenaire + alt */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                <div className="flex justify-between mb-[5px]">
                  <span className="text-[16px] text-[#3A416F] font-bold">Image du partenaire</span>
                  <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">70px x 70px</span>
                </div>
                  <ImageUploader
                    value={program.partner_image}
                    onChange={(url) => setProgram({ ...program, partner_image: url })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Alt image partenaire</label>
                  <input
                    type="text"
                    placeholder="Alt de l’image du partenaire"
                    value={program.partner_image_alt}
                    onChange={(e) => setProgram({ ...program, partner_image_alt: e.target.value })}
                    className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                               border border-[#D7D4DC] hover:border-[#C2BFC6]
                               focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                               transition-all duration-150"
                  />
                </div>
              </div>

              {/* Liens */}
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lien partenaire</label>
                <input
                  type="text"
                  placeholder="Lien du partenaire"
                  value={program.partner_link}
                  onChange={(e) => setProgram({ ...program, partner_link: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lien “En savoir plus”</label>
                <input
                  type="text"
                  placeholder="Lien vers la fiche"
                  value={program.link}
                  onChange={(e) => setProgram({ ...program, link: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              {/* Autres champs en grid... */}
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id du programme lié</label>
                <input
                  type="text"
                  placeholder="Id du programme lié"
                  value={program.linked_program_id}
                  onChange={(e) => setProgram({ ...program, linked_program_id: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nom du partenaire</label>
                <input
                  type="text"
                  placeholder="Nom du partenaire"
                  value={program.partner_name}
                  onChange={(e) => setProgram({ ...program, partner_name: e.target.value })}
                  className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                             border border-[#D7D4DC] hover:border-[#C2BFC6]
                             focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                             transition-all duration-150"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                <AdminDropdown
                  label=""
                  placeholder="Sélectionnez le statut"
                  selected={program.status}
                  onSelect={(value) => setProgram({ ...program, status: value })}
                  options={[
                    { value: "ON", label: "ON" },
                    { value: "OFF", label: "OFF" },
                  ]}
                />
              </div>

            <div className="flex flex-col">
              <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Niveau</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le niveau"
                selected={program.level}
                onSelect={(value) => setProgram({ ...program, level: value })}
                options={[
                  { value: "Débutant", label: "Débutant" },
                  { value: "Intermédiaire", label: "Intermédiaire" },
                  { value: "Confirmé", label: "Confirmé" },
                ]}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lieu</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le lieu"
                selected={program.location}
                onSelect={(value) => setProgram({ ...program, location: value })}
                options={[
                  { value: "Salle", label: "Salle" },
                  { value: "Domicile", label: "Domicile" },
                ]}
              />
            </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de séances</label>
                <input
                  type="number"
                  placeholder="Nombre de séances"
                  value={program.sessions || ""}
                  onChange={(e) => setProgram({ ...program, sessions: Number(e.target.value) })}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                           border border-[#D7D4DC] hover:border-[#C2BFC6]
                           focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                           transition-all duration-150"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Durée</label>
              <input
                type="text"
                placeholder="Durée moyenne"
                value={program.duration}
                onChange={(e) => setProgram({ ...program, duration: e.target.value })}
                className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                           border border-[#D7D4DC] hover:border-[#C2BFC6]
                           focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                           transition-all duration-150"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Objectif</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez l'objectif"
                selected={program.goal}
                onSelect={(value) => setProgram({ ...program, goal: value })}
                options={[
                  { value: "Prendre du muscle", label: "Prendre du muscle" },
                  { value: "Gagner en force", label: "Gagner en force" },
                  { value: "Perdre du poids", label: "Perdre du poids" },
                  { value: "Rester en forme", label: "Rester en forme" },
                  { value: "Remise en forme", label: "Remise en forme" },
                  { value: "Endurance musculaire", label: "Endurance musculaire" },
                  { value: "Performance sportive", label: "Performance sportive" },
                ]}
              />
            </div> 
          </div>
          <div className="mt-10 flex flex-col items-center">
            <CTAButton
              onClick={handleSave}
              disabled={!isFormValid}
              variant={isFormValid ? "active" : "inactive"}
              className="font-semibold"
            >
              {programId ? "Mettre à jour" : "Créer la carte"}
            </CTAButton>
          </div>
          </>
        )}
        </div>
      </main>
    </>
  );
}
