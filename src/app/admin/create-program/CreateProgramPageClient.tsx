"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [program, setProgram] = useState<ProgramFormState>(
    initialProgram ?? emptyProgram,
  );
  const [loading, setLoading] = useState(
    () => Boolean(programId) && !initialProgram,
  );
  const showLoader = useMinimumVisibility(loading);
  const shouldRefreshOnShowRef = useRef(Boolean(programId) && !initialProgram);

  const performProgramRefresh = useCallback(
    async (id: string) => {
      try {
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
      } catch (unknownError) {
        console.error("Erreur inattendue lors du chargement du programme", unknownError);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const handleLoaderShow = useCallback(() => {
    if (!shouldRefreshOnShowRef.current || !programId) {
      return;
    }

    shouldRefreshOnShowRef.current = false;
    void performProgramRefresh(programId);
  }, [performProgramRefresh, programId]);

  const requestProgramRefresh = useCallback(
    (id: string | null) => {
      if (!id) {
        shouldRefreshOnShowRef.current = false;
        return;
      }

      shouldRefreshOnShowRef.current = true;
      setLoading(true);
      if (showLoader) {
        handleLoaderShow();
      }
    },
    [handleLoaderShow, showLoader],
  );

  useEffect(() => {
    if (initialProgram) {
      setProgram(initialProgram);
      setLoading(false);
      shouldRefreshOnShowRef.current = false;
      return;
    }

    if (programId) {
      requestProgramRefresh(programId);
      return;
    }

    setProgram(emptyProgram);
    setLoading(false);
    shouldRefreshOnShowRef.current = false;
  }, [initialProgram, programId, requestProgramRefresh]);

  const handleSave = async () => {
    shouldRefreshOnShowRef.current = false;
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
      program.shortName.trim() !== "" &&
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

  const inputClass =
    "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";
  const textareaClass =
    "min-h-[143px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";

  return (
    <>
      {showLoader && <GliftLoader onShow={handleLoaderShow} />}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
        <div className="w-full max-w-3xl px-4 sm:px-0">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {programId ? "Modifier la carte" : "Créer une carte"}
          </h2>

          {!loading && (
            <div className="flex flex-col gap-[30px]">
              {/* SECTION 1: STATUT DE L’OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Statut de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Statut */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-[5px]">Statut</label>
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

                  {/* Id du programme lié */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-[5px]">Id du programme lié</label>
                    <input
                      type="text"
                      placeholder="Insérez l'id du programme lié"
                      value={program.linked_program_id}
                      onChange={(e) => setProgram({ ...program, linked_program_id: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {/* Plan */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-[5px]">Plan</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le plan"
                      selected={program.plan}
                      onSelect={(value) => setProgram({ ...program, plan: value as "starter" | "premium" })}
                      options={[
                        { value: "starter", label: "Starter" },
                        { value: "premium", label: "Premium" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: TITRES ET DESCRIPTION DU PROGRAMME */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Titres et description du programme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Left Column: Title & Short Title */}
                  <div className="flex flex-col gap-[30px]">
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
                        className={inputClass}
                      />
                    </div>

                    {/* Titre raccourci */}
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-[5px]">
                        <span className="text-[16px] text-[#3A416F] font-bold">Titre raccourci</span>
                        <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                          {program.shortName.length}/28
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={28}
                        placeholder="Titre du programme" // Placeholder from mockup says 'Titre du programme'
                        value={program.shortName}
                        onChange={(e) =>
                          setProgram({
                            ...program,
                            shortName: e.target.value.slice(0, 28),
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Right Column: Description (Full Height) */}
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Description</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {program.description.length}/169
                      </span>
                    </div>
                    <textarea
                      placeholder="Description du programme"
                      value={program.description}
                      onChange={(e) => setProgram({ ...program, description: e.target.value })}
                      className={`${textareaClass} h-full`}
                      style={{ minHeight: '143px', height: '100%' }} // Ensure it stretches
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: IMAGES DU PROGRAMME */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Images du programme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Row 1 */}
                  {/* Image principale (Site) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image principale (Site)</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">540px x 360px</span>
                    </div>
                    <ImageUploader
                      value={program.image}
                      onChange={(url) => setProgram({ ...program, image: url })}
                      placeholder="Importer un fichier"
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
                      className={inputClass}
                    />
                  </div>

                  {/* Row 2 */}
                  {/* Image principale (Mobile) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image principale (Mobile)</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">350px x 180px</span>
                    </div>
                    <ImageUploader
                      value={program.image_mobile}
                      onChange={(url) => setProgram({ ...program, image_mobile: url })}
                      placeholder="Importer un fichier"
                    />
                  </div>
                  {/* Empty Right Column for Row 2 */}
                  <div className="hidden md:block"></div>

                  {/* Row 3 */}
                  {/* Image du partenaire */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image du partenaire</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">140px x 140px</span>
                    </div>
                    <ImageUploader
                      value={program.partner_image}
                      onChange={(url) => setProgram({ ...program, partner_image: url })}
                      placeholder="Importer un fichier"
                    />
                  </div>
                  {/* Alt image partenaire */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Alt image partenaire</label>
                    <input
                      type="text"
                      placeholder="Alt de l’image du partenaire"
                      value={program.partner_image_alt}
                      onChange={(e) => setProgram({ ...program, partner_image_alt: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DÉTAILS DU PROGRAMME */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Détails du programme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Row 1: Sexe | Objectif */}
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
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Objectif</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez un objectif"
                      selected={program.goal}
                      onSelect={(value) => setProgram({ ...program, goal: value })}
                      sortStrategy="none"
                      options={[
                        { value: "Prise de muscle", label: "Prise de muscle" },
                        { value: "Perte de graisse", label: "Perte de graisse" },
                        { value: "Gain de force", label: "Gain de force" },
                        { value: "Performance sportive", label: "Performance sportive" },
                        { value: "Confiance & bien-être", label: "Confiance & bien-être" },
                        { value: "Prévention des blessures", label: "Prévention des blessures" },
                        { value: "Santé & longévité", label: "Santé & longévité" },
                        { value: "Routine & discipline", label: "Routine & discipline" },
                      ]}
                    />
                  </div>

                  {/* Row 2: Niveau | Durée */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Niveau</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le niveau"
                      selected={program.level}
                      onSelect={(value) => setProgram({ ...program, level: value })}
                      options={[
                        { value: "Tous niveaux", label: "Tous niveaux" },
                        { value: "Débutant", label: "Débutant" },
                        { value: "Intermédiaire", label: "Intermédiaire" },
                        { value: "Confirmé", label: "Confirmé" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Durée moyenne</label>
                    <input
                      type="text"
                      placeholder="Durée moyenne"
                      value={program.duration}
                      onChange={(e) => setProgram({ ...program, duration: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {/* Row 3: Nombre de séances | Lieu */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de séances</label>
                    <input
                      type="number"
                      placeholder="Nombre de séances"
                      value={program.sessions || ""}
                      onChange={(e) => setProgram({ ...program, sessions: Number(e.target.value) })}
                      className={inputClass}
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

                  {/* Row 4: Nom du partenaire | Lien du partenaire */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nom du partenaire</label>
                    <input
                      type="text"
                      placeholder="Nom du partenaire"
                      value={program.partner_name}
                      onChange={(e) => setProgram({ ...program, partner_name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lien du partenaire</label>
                    <input
                      type="text"
                      placeholder="Lien du partenaire"
                      value={program.partner_link}
                      onChange={(e) => setProgram({ ...program, partner_link: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {/* Row 5: Lien en savoir plus | Empty */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lien “En savoir plus”</label>
                    <input
                      type="text"
                      placeholder="Lien vers la fiche"
                      value={program.link}
                      onChange={(e) => setProgram({ ...program, link: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* BOUTON */}
              <div className="mt-10 flex justify-center">
                <CTAButton
                  onClick={handleSave}
                  disabled={!isFormValid}
                  variant={isFormValid ? "active" : "inactive"}
                  className="font-semibold"
                >
                  {programId ? "Mettre à jour" : "Créer la carte"}
                </CTAButton>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
