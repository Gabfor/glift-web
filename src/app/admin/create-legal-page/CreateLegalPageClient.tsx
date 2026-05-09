"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";
import Image from "next/image";
import AddWidgetModal from "@/app/admin/components/AddWidgetModal";

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const months = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - 1 + i).toString());

const getDateParts = (value: string): [string, string, string] => {
  if (value && value.includes("-")) {
    const [year = "", month = "", day = ""] = value.split("-");
    return [year, month, day];
  }
  return ["", "", ""];
};

type Props = {
  pageId: string | null;
};

export default function CreateLegalPageClient({ pageId }: Props) {
  const router = useRouter();
  
  const supabase = useMemo(() => createClient(), []);
  
  const [pageData, setPageData] = useState({
    is_published: false,
    langue: "Français",
    updated_at: "",
    titre: "",
    url: "",
    content_blocks: []
  });

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const isFormValid = pageData.titre.trim() !== "" && pageData.url.trim() !== "";
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    const fetchPage = async () => {
      const { data, error } = await (supabase as any)
        .from("legal_pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (data && !error) {
        setPageData({
          is_published: !!data.is_published,
          langue: data.langue || "Français",
          updated_at: data.updated_at || "",
          titre: data.titre || "",
          url: data.url || "",
          content_blocks: data.content_blocks || []
        });
      } else {
        console.error("Erreur lors du chargement:", error);
      }
    };

    void fetchPage();
  }, [pageId, supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    
    const payload = {
      is_published: pageData.is_published,
      langue: pageData.langue,
      updated_at: pageData.updated_at || null,
      titre: pageData.titre,
      url: pageData.url,
      content_blocks: pageData.content_blocks || []
    };

    let reqError;
    if (pageId) {
      const { error } = await (supabase as any)
        .from("legal_pages")
        .update(payload)
        .eq("id", pageId);
      reqError = error;
    } else {
      const { error } = await (supabase as any)
        .from("legal_pages")
        .insert([payload]);
      reqError = error;
    }

    setIsSaving(false);

    if (reqError) {
      console.error("Erreur de sauvegarde:", reqError);
      alert("Erreur: " + reqError.message);
    } else {
      router.push("/admin/legal");
    }
  };

  const inputClass =
    "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";

  const [updatedYear, updatedMonth, updatedDay] = getDateParts(pageData.updated_at);

  return (
    <>
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full">
        <BackLink href="/admin/legal" className="mb-6">
          Pages légales
        </BackLink>
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col items-center">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
            {pageId ? "Modifier une page légale" : "Créer une page légale"}
          </h2>

          <div className="flex flex-col gap-[40px] w-full">
            {/* SECTION 0: STATUT DE LA PAGE */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Statut de la page
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                {/* Statut (is_published) */}
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                  <AdminDropdown
                    label=""
                    placeholder="Sélectionnez le statut"
                    selected={pageData.is_published ? "ON" : "OFF"}
                    onSelect={(value) => setPageData({ ...pageData, is_published: value === "ON" })}
                    options={[
                      { value: "ON", label: "ON" },
                      { value: "OFF", label: "OFF" },
                    ]}
                  />
                </div>
                
                {/* Langue */}
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Langue</label>
                  <AdminDropdown
                    label=""
                    placeholder="Sélectionnez la langue"
                    selected={pageData.langue}
                    onSelect={(value) => setPageData({ ...pageData, langue: value })}
                    options={[
                      { value: "Français", label: "Français", iconSrc: "/flags/france.svg" },
                    ]}
                  />
                </div>

                {/* Date MAJ */}
                <div className="flex flex-col md:col-span-1">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Date MAJ</label>
                  <div className="flex gap-2">
                    <>
                      {/* Jour */}
                      <AdminDropdown
                        className="w-[88px]"
                        label=""
                        placeholder="Jour"
                        selected={updatedDay || ""}
                        onSelect={(day) => {
                          setPageData({
                            ...pageData,
                            updated_at: `${updatedYear || ""}-${updatedMonth || ""}-${day}`,
                          });
                        }}
                        options={days.map((day) => ({
                          value: day,
                          label: day,
                        }))}
                        allowTyping
                        digitsOnly
                        inputLength={2}
                        padWithZero
                      />

                      {/* Mois */}
                      <AdminDropdown
                        className="w-[154px]"
                        label=""
                        placeholder="Mois"
                        selected={updatedMonth || ""}
                        onSelect={(month) => {
                          setPageData({
                            ...pageData,
                            updated_at: `${updatedYear || ""}-${month}-${updatedDay || ""}`,
                          });
                        }}
                        options={months}
                        allowTyping
                        digitsOnly
                        inputLength={2}
                        padWithZero
                        sortStrategy="month"
                      />

                      {/* Année */}
                      <AdminDropdown
                        className="w-[111px]"
                        label=""
                        placeholder="Année"
                        selected={updatedYear || ""}
                        onSelect={(year) => {
                          setPageData({
                            ...pageData,
                            updated_at: `${year}-${updatedMonth || ""}-${updatedDay || ""}`,
                          });
                        }}
                        options={years.map((year) => ({
                          value: year,
                          label: year,
                        }))}
                        allowTyping
                        digitsOnly
                        inputLength={4}
                        sortStrategy="none"
                      />
                    </>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: INTRODUCTION */}
            <div className="flex flex-col mt-[10px]">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Introduction
              </h3>
              <div className="flex flex-col gap-[30px]">
                {/* Titre */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[16px] text-[#3A416F] font-bold">Titre</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                      {pageData.titre.length}/52
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Titre de l'article"
                    value={pageData.titre}
                    onChange={(e) => setPageData({ ...pageData, titre: e.target.value })}
                    className={inputClass}
                    maxLength={52}
                  />
                </div>

                {/* URL */}
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL</label>
                  <input
                    type="text"
                    placeholder="Url de l'article"
                    value={pageData.url}
                    onChange={(e) => setPageData({ ...pageData, url: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTENU DE LA PAGE */}
            <div className="flex flex-col mt-[10px]">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Contenu de la page
              </h3>
              
              <button
                onClick={() => setIsWidgetModalOpen(true)}
                className="w-full h-[45px] border border-dashed border-[#D7D4DC] rounded-[5px] bg-white flex items-center justify-center gap-2 hover:border-[#C2BFC6] transition-all duration-150 group"
              >
                <div className="relative w-[16px] h-[16px]">
                  <Image src="/icons/plus_grey.svg" alt="Ajouter" fill className="object-contain" />
                </div>
                <span className="text-[16px] font-semibold text-[#D7D4DC] transition-colors">
                  Ajouter un bloc de contenu
                </span>
              </button>
            </div>

            <div className="mt-[20px] flex justify-center">
              <CTAButton
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
                variant={isFormValid && !isSaving ? "active" : "inactive"}
                className="font-semibold"
              >
                {isSaving ? "Création en cours..." : "Créer la page"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>

    {isWidgetModalOpen && (
      <AddWidgetModal
        articleType="Legal"
        onClose={() => setIsWidgetModalOpen(false)}
        onSelect={(type) => {
          alert(`Type sélectionné: ${type}. Implémentation du rendu à venir.`);
          setIsWidgetModalOpen(false);
        }}
      />
    )}
    </>
  );
}
