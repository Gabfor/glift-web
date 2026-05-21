"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabaseClient";
import Image from "next/image";
import type { Database } from "@/lib/supabase/types";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import AddWidgetModal from "@/app/admin/components/AddWidgetModal";
import WidgetsRenderer from "@/app/admin/components/WidgetsRenderer";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  PageFormState,
  emptyPage,
  mapPageRowToForm,
  buildPagePayload,
  BLOG_PAGE_ID,
  CONTACT_PAGE_ID,
} from "./pageForm";
import { ContentBlock } from "@/app/admin/create-blog-article/blogArticleForm";

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

export default function CreatePageClient({ pageId }: { pageId: string | null }) {
  const router = useRouter();
  const isLockedPage =
    pageId === "59822297-b8b2-4041-bfa6-03793221fcf6" || // Dashboard
    pageId === "eb4e258a-0876-421e-b653-176c8c08ed3d" || // Glift Shop
    pageId === "fd7e055c-bf17-4222-a8f8-c27b014d3062" || // Glift Store
    pageId === "90c6b3f6-1b46-4711-8882-28177874b51d" || // Trainings
    pageId === "eb40db10-0d10-47af-b102-62e2763bef86" || // Help / Aide
    pageId === CONTACT_PAGE_ID || // Contact
    pageId === BLOG_PAGE_ID; // Blog
  const supabaseFull = useMemo(() => createClient(), []);

  // --- Generic PAGE state ---
  const [pageData, setPageData] = useState<PageFormState>(emptyPage);
  const [basePageData, setBasePageData] = useState<PageFormState>(emptyPage);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (pageId) {
      // Fetch generic page
      const { data, error } = await (supabaseFull as any)
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (data && !error) {
        const mapped = mapPageRowToForm(data);
        setPageData(mapped);
        setBasePageData(mapped);
      }
    }

    setLoading(false);
  }, [pageId, supabaseFull]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Generic Page Logic ---
  const isPageDirty = useMemo(() => JSON.stringify(pageData) !== JSON.stringify(basePageData), [pageData, basePageData]);
  const isFormValid = pageData.titre.trim() !== "" && pageData.url.trim() !== "";

  const handleSavePage = async () => {
    setSaving(true);
    const payload = buildPagePayload(pageData);
    try {
      let reqError;
      if (pageId) {
        const { error } = await (supabaseFull as any).from("pages").update(payload).eq("id", pageId);
        reqError = error;
      } else {
        const { error } = await (supabaseFull as any).from("pages").insert([payload]);
        reqError = error;
      }
      if (reqError) throw reqError;
      if (pageId) setBasePageData(pageData);
      else router.push("/admin/pages");
    } catch (err: any) {
      console.error("Erreur de sauvegarde:", err);
      alert("Erreur: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
        <div className="w-full max-w-3xl text-center text-[#5D6494] font-semibold">
          Chargement...
        </div>
      </main>
    );
  }

  const [updatedYear, updatedMonth, updatedDay] = getDateParts(pageData.updated_at);
  const inputClass = "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";
  const textareaClass = "min-h-[70px] h-[70px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150 resize-none";

  return (
    <>
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
        <div className="w-full max-w-[1152px]">
          <BackLink href="/admin/pages" className="mb-6">
            Pages
          </BackLink>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
              {pageId ? "Modifier la page" : "Créer une page"}
            </h2>

            <div className="flex flex-col gap-5 w-full">
                {/* Status Section */}
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Statut de la page</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                      <AdminDropdown
                        label=""
                        placeholder="Statut"
                        selected={pageData.is_published ? "ON" : "OFF"}
                        onSelect={(v) => setPageData({ ...pageData, is_published: v === "ON" })}
                        options={[{ value: "ON", label: "ON" }, { value: "OFF", label: "OFF" }]}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Langue</label>
                      <AdminDropdown
                        label=""
                        placeholder="Langue"
                        selected={pageData.langue}
                        onSelect={(v) => setPageData({ ...pageData, langue: v })}
                        options={[{ value: "Français", label: "Français", iconSrc: "/flags/france.svg" }]}
                      />
                    </div>
                  </div>
                </div>

                {/* Introduction Section */}
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Introduction</h3>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-[5px]">
                        <span className="text-[16px] text-[#3A416F] font-bold">Surtitre</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Surtitre de la page"
                        value={pageData.surtitre}
                        onChange={(e) => setPageData({ ...pageData, surtitre: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-[5px]">
                        <span className="text-[16px] text-[#3A416F] font-bold">Titre</span>
                      </div>
                      <RichTextEditor
                        value={pageData.titre}
                        onChange={(val) => setPageData({ ...pageData, titre: val })}
                        minHeight="80px"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Description</label>
                      <RichTextEditor
                        value={pageData.description}
                        onChange={(val) => setPageData({ ...pageData, description: val })}
                        minHeight="100px"
                      />
                    </div>
                    {pageId === CONTACT_PAGE_ID && (
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Description (depuis Aide)</label>
                        <RichTextEditor
                          value={pageData.description_aide || ""}
                          onChange={(val) => setPageData({ ...pageData, description_aide: val })}
                          minHeight="100px"
                        />
                      </div>
                    )}
                    {pageId === BLOG_PAGE_ID && (
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                        <RichTextEditor
                          value={pageData.texte || ""}
                          onChange={(val) => setPageData({ ...pageData, texte: val })}
                          minHeight="120px"
                        />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL</label>
                      <input
                        type="text"
                        placeholder="Url de la page"
                        value={pageData.url}
                        onChange={(e) => setPageData({ ...pageData, url: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Contenu de la page</h3>
                  {isLockedPage ? (
                    <div className="w-full h-[45px] rounded-[5px] bg-[#F8F7FC] border border-dashed border-[#D7D4DC] flex items-center justify-center gap-2 select-none">
                      <div className="relative w-[16px] h-[16px]">
                        <Image src="/icons/locked.svg" alt="Verrouillé" fill className="object-contain" />
                      </div>
                      <span className="text-[16px] font-semibold text-[#D7D4DC] tracking-wide">Contenu verrouillé</span>
                    </div>
                  ) : (
                    <>
                      {pageData.content_blocks?.length > 0 && (
                        <div className="mb-5">
                          <WidgetsRenderer
                            blocks={pageData.content_blocks}
                            onChangeBlocks={(blocks) => setPageData({ ...pageData, content_blocks: blocks })}
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setIsWidgetModalOpen(true)}
                        className="w-full h-[45px] border border-dashed border-[#D7D4DC] rounded-[5px] bg-white flex items-center justify-center gap-2 hover:border-[#C2BFC6] transition-all duration-150 group"
                      >
                        <div className="relative w-[16px] h-[16px]">
                          <Image src="/icons/plus_grey.svg" alt="Ajouter" fill className="object-contain" />
                        </div>
                        <span className="text-[16px] font-semibold text-[#D7D4DC]">Ajouter un bloc de contenu</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex justify-center">
                  <CTAButton
                    onClick={handleSavePage}
                    disabled={!isFormValid || !isPageDirty || saving}
                    variant={isFormValid && isPageDirty && !saving ? "active" : "inactive"}
                  >
                    {saving ? "Sauvegarde..." : pageId ? "Mettre à jour" : "Créer la page"}
                  </CTAButton>
                </div>
              </div>
            </div>
          </div>
      </main>

      {isWidgetModalOpen && (
        <AddWidgetModal
          articleType="Page"
          onClose={() => setIsWidgetModalOpen(false)}
          onSelect={(type) => {
            const newId = Math.random().toString(36).substr(2, 9);
            let newBlock = null;
            switch (type) {
              case "titre-texte": newBlock = { id: newId, type: "titre-texte", titre: "", ancreId: "", texte: "" }; break;
              case "titre": newBlock = { id: newId, type: "titre", titre: "" }; break;
              case "texte": newBlock = { id: newId, type: "texte", texte: "" }; break;
              case "texte-image": newBlock = { id: newId, type: "texte-image", imagePosition: "gauche", surtitre: "", titre: "", texte: "", image: "", alt: "", boutonType: "secondaire", boutonTexte: "", boutonLien: "" }; break;
              case "card": newBlock = { id: newId, type: "card", enabled: true, card1: { boutonType: "secondaire" }, card2: { boutonType: "secondaire" } }; break;
              case "newsletter": newBlock = { id: newId, type: "newsletter", enabled: true, titre: "", texte: "" }; break;
              case "tarifs": 
                newBlock = { 
                  id: newId, 
                  type: "tarifs", 
                  enabled: true,
                  abonnement1: {
                    nom: "Starter",
                    prix: "0,00",
                    description: "Un abonnement pour ceux qui suivent toujours le même entraînement.",
                    boutonType: "secondaire",
                    boutonTexte: "Choisir cet abonnement",
                    boutonLien: "/inscription?plan=starter",
                    arguments: [
                      { id: "a1", texte: "Un seul entraînement", active: true },
                      { id: "a2", texte: "Un maximum de 10 exercices", active: true },
                      { id: "a3", texte: "Un tableau de bord personnalisé", active: true },
                      { id: "a4", texte: "Accès aux programmes du Glift Store", active: false },
                      { id: "a5", texte: "Offres personnalisées dans la Glift Shop", active: false },
                    ]
                  },
                  abonnement2: {
                    nom: "Premium",
                    prix: "2,49",
                    description: "Un abonnement pour ceux qui suivent plusieurs entraînements.",
                    boutonType: "primaire",
                    boutonTexte: "Tester gratuitement",
                    boutonLien: "/inscription?plan=premium",
                    badge: "Plus populaire",
                    badgeStatus: "ON",
                    badgeColor: "#7069FA",
                    badgeTextColor: "#FFFFFF",
                    arguments: [
                      { id: "b1", texte: "Un nombre illimité d'entraînements", active: true },
                      { id: "b2", texte: "Un nombre illimité d'exercices", active: true },
                      { id: "b3", texte: "Un tableau de bord personnalisé", active: true },
                      { id: "b4", texte: "Accès aux programmes du Glift Store", active: true },
                      { id: "b5", texte: "Offres personnalisées dans la Glift Shop", active: true },
                      { id: "b6", texte: "Annulation gratuite à tout moment", active: true },
                    ]
                  }
                }; 
                break;
              case "texte-1-1": newBlock = { id: newId, type: "texte-1-1", titre: "", texte: "" }; break;
              case "partenaires": 
                newBlock = { 
                  id: newId, 
                  type: "partenaires", 
                  surtitre: "Partenaires",
                  titre: "Merci à nos partenaires !",
                  enabled: true, 
                  slots: Array(4).fill({ logo_url: "", alt_text: "", link_url: "" }) 
                }; 
                break;
              case "boutons":
                newBlock = {
                  id: newId,
                  type: "boutons",
                  enabled: true,
                  bouton1: { type: "primaire", texte: "Tester gratuitement", lien: "/inscription?plan=premium" },
                  bouton2: { type: "secondaire", texte: "En savoir plus", lien: "#methode-glift" },
                };
                break;
              case "image-principale":
                newBlock = {
                  id: newId,
                  type: "image-principale",
                  enabled: true,
                  image: "/images/mockups-app-site.png",
                  alt: "Mockups Glift",
                  texte1: "Une app pour\nsuivre ses entraînements\nefficacement",
                  texte2: "Un site pour\ncréer ses entraînements\nfacilement"
                };
                break;
            }
            if (newBlock) setPageData({ ...pageData, content_blocks: [...(pageData.content_blocks || []), newBlock as ContentBlock] });
            setIsWidgetModalOpen(false);
          }}
        />
      )}
    </>
  );
}

