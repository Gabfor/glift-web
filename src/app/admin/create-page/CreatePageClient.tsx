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

            <div className="flex flex-col gap-[40px] w-full">
                {/* Status Section */}
                <div className="flex flex-col">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Statut de la page</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
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
                <div className="flex flex-col mt-[10px]">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Introduction</h3>
                  <div className="flex flex-col gap-[30px]">
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
                      <input
                        type="text"
                        placeholder="Titre de la page"
                        value={pageData.titre}
                        onChange={(e) => setPageData({ ...pageData, titre: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Description</label>
                      <textarea
                        placeholder="Description de la page"
                        value={pageData.description}
                        onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                        className={textareaClass}
                      />
                    </div>
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
                <div className="flex flex-col mt-[10px]">
                  <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">Contenu de la page</h3>
                  {pageData.content_blocks?.length > 0 && (
                    <div className="mb-[30px]">
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
                </div>

                <div className="mt-[10px] flex justify-center">
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
          articleType="Legal"
          onClose={() => setIsWidgetModalOpen(false)}
          onSelect={(type) => {
            const newId = Math.random().toString(36).substr(2, 9);
            let newBlock = null;
            switch (type) {
              case "titre-texte": newBlock = { id: newId, type: "titre-texte", titre: "", ancreId: "", texte: "" }; break;
              case "texte": newBlock = { id: newId, type: "texte", texte: "" }; break;
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
            }
            if (newBlock) setPageData({ ...pageData, content_blocks: [...(pageData.content_blocks || []), newBlock as ContentBlock] });
            setIsWidgetModalOpen(false);
          }}
        />
      )}
    </>
  );
}

