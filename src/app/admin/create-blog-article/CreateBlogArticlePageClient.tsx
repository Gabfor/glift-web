"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";
import Image from "next/image";
import { BlogArticleFormState, emptyBlogArticle } from "./blogArticleForm";
import AddWidgetModal from "@/app/admin/components/AddWidgetModal";
import WidgetsRenderer from "@/app/admin/components/WidgetsRenderer";
import { ContentBlock } from "./blogArticleForm";
import RichTextEditor from "@/components/ui/RichTextEditor";

type Props = {
  articleId: string | null;
};

export default function CreateBlogArticlePageClient({ articleId }: Props) {
  const router = useRouter();
  const [article, setArticle] = useState<BlogArticleFormState>(emptyBlogArticle);
  const [baseArticle, setBaseArticle] = useState<BlogArticleFormState>(emptyBlogArticle);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    status: false,
    introduction: true,
    seo: true,
    tags: true,
    images: true,
    related: true,
    content: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const isCurrentlyCollapsed = prev[section];
      const nextState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        nextState[key] = true;
      });
      if (isCurrentlyCollapsed) {
        nextState[section] = false;
      }
      return nextState;
    });
  };

  const isDirty = useMemo(
    () => JSON.stringify(article) !== JSON.stringify(baseArticle),
    [article, baseArticle],
  );

  const isFormValid = useMemo(
    () =>
      article.titre.trim() !== "" &&
      article.description.trim() !== "" &&
      article.url.trim() !== "",
    [article]
  );

  const [isSaving, setIsSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!articleId) return;

    const fetchArticle = async () => {
      const { data: rawData, error } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("id", articleId)
        .single();

      if (rawData && !error) {
        const data = rawData as any;
        const fetchedArticle: BlogArticleFormState = {
          id: data.id,
          type: data.type || "Conseil",
          titre: data.titre || "",
          description: data.description || "",
          url: data.url || "",
          categorie: data.categorie || "",
          sexe: data.sexe || "",
          langue: data.langue || "Français",
          niveau: data.niveau || "",
          objectif: data.objectif || "",
          nombre_seances: data.nombre_seances || "",
          duree_moyenne: data.duree_moyenne || "",
          nombre_semaines: data.nombre_semaines || "",
          lieu: data.lieu || "",
          intensite: data.intensite || "",
          image: data.image_url || "",
          image_alt: data.image_alt || "",
          article_lie_1: data.article_lie_1_id || "",
          article_lie_2: data.article_lie_2_id || "",
          content_blocks: data.content_blocks || [],
          is_published: !!data.is_published,
          is_featured: !!data.is_featured,
          is_ai_generated: !!data.is_ai_generated,
          seo_title: data.seo_title || "",
          seo_description: data.seo_description || "",
          noindex: !!data.noindex,
          nofollow: !!data.nofollow,
          canonical_override: data.canonical_override || "",
        };
        setArticle(fetchedArticle);
        setBaseArticle(fetchedArticle);
      } else {
        console.error("Erreur lors du chargement de l'article:", error);
      }
    };

    void fetchArticle();
  }, [articleId, supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        type: article.type,
        titre: article.titre,
        description: article.description,
        url: article.url,
        categorie: article.categorie || null,
        sexe: article.sexe || null,
        langue: article.langue || "Français",
        niveau: article.niveau || null,
        objectif: article.objectif || null,
        nombre_seances: article.nombre_seances || null,
        duree_moyenne: article.duree_moyenne || null,
        nombre_semaines: article.nombre_semaines || null,
        lieu: article.lieu || null,
        intensite: article.intensite || null,
        image_url: article.image || null,
        image_alt: article.image_alt || null,
        article_lie_1_id: article.article_lie_1 || null,
        article_lie_2_id: article.article_lie_2 || null,
        content_blocks: article.content_blocks || [],
        is_published: article.is_published,
        is_featured: article.is_featured,
        is_ai_generated: article.is_ai_generated,
        seo_title: article.seo_title || null,
        seo_description: article.seo_description || null,
        noindex: article.noindex,
        nofollow: article.nofollow,
        canonical_override: article.canonical_override || null,
      };
      
      let reqError;
      if (article.id) {
        const { error } = await (supabase as any)
          .from("blog_articles")
          .update(payload)
          .eq("id", article.id);
        reqError = error;
      } else {
        const { error } = await (supabase as any)
          .from("blog_articles")
          .insert([payload]);
        reqError = error;
      }

      if (reqError) throw reqError;

      if (article.id) {
        setBaseArticle(article);
      } else {
        router.push("/admin/content-blog");
      }
    } catch (err: any) {
      console.error("Erreur de sauvegarde:", err);
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";
  const textareaClass =
    "min-h-[70px] h-[70px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150 resize-none";

  return (
    <>
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full">
        <BackLink href="/admin/content-blog" className="mb-6">
          Blog
        </BackLink>
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col items-center">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-6">
            {articleId ? "Modifier l'article" : "Créer l'article"}
          </h2>

          {/* Toggle Conseil / Programme */}
          {!articleId && (
            <div className="relative flex items-center bg-[#F4F5FE] h-[40px] p-[5px] rounded-full mb-10 w-[230px]">
              <div
                className={`absolute h-[30px] w-[110px] bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm`}
                style={{
                  transform: article.type === "Conseil" ? "translateX(0)" : "translateX(110px)",
                }}
              />
              <button
                onClick={() => setArticle({ ...article, type: "Conseil" })}
                className={`relative z-10 h-[30px] w-[110px] flex items-center justify-center text-[14px] font-semibold rounded-full transition-colors duration-200 ${
                  article.type === "Conseil"
                    ? "text-[#3A416F]"
                    : "text-[#5D6494] hover:text-[#3A416F]"
                }`}
              >
                Conseil
              </button>
              <button
                onClick={() => setArticle({ ...article, type: "Programme", categorie: article.categorie || "Entraînement" })}
                className={`relative z-10 h-[30px] w-[110px] flex items-center justify-center text-[14px] font-semibold rounded-full transition-colors duration-200 ${
                  article.type === "Programme"
                    ? "text-[#3A416F]"
                    : "text-[#5D6494] hover:text-[#3A416F]"
                }`}
              >
                Programme
              </button>
            </div>
          )}

          <div className="flex flex-col gap-8 w-full">
            {/* SECTION 0: STATUT DE L'ARTICLE */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("status")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Statut de l'article
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.status ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.status ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.status && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  {/* Statut (is_published) */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le statut"
                      selected={article.is_published ? "ON" : "OFF"}
                      onSelect={(value) => setArticle({ ...article, is_published: value === "ON" })}
                      options={[
                        { value: "ON", label: "ON" },
                        { value: "OFF", label: "OFF" },
                      ]}
                    />
                  </div>
                  {/* Mis en avant (is_featured) */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Mis en avant</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={article.is_featured ? "OUI" : "NON"}
                      onSelect={(value) => setArticle({ ...article, is_featured: value === "OUI" })}
                      options={[
                        { value: "OUI", label: "OUI" },
                        { value: "NON", label: "NON" },
                      ]}
                    />
                  </div>
                  {/* Langue */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Langue</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez la langue"
                      selected={article.langue}
                      onSelect={(value) => setArticle({ ...article, langue: value })}
                      options={[
                        { value: "Français", label: "Français", iconSrc: "/flags/france.svg" },
                      ]}
                    />
                  </div>
                  {/* Généré par IA */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Généré par IA</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={article.is_ai_generated ? "OUI" : "NON"}
                      onSelect={(value) => setArticle({ ...article, is_ai_generated: value === "OUI" })}
                      options={[
                        { value: "OUI", label: "OUI" },
                        { value: "NON", label: "NON" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 1: INTRODUCTION */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("introduction")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Introduction
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.introduction ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.introduction ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.introduction && (
                <div className="flex flex-col gap-5 mt-[10px]">
                  {/* Titre */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Titre</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {article.titre.length}/52
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Titre de l'article"
                      value={article.titre || ""}
                      onChange={(e) => setArticle({ ...article, titre: e.target.value })}
                      className={inputClass}
                      maxLength={52}
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Description</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {article.description.length}/169
                      </span>
                    </div>
                    <textarea
                      placeholder="Description de l'article"
                      value={article.description || ""}
                      onChange={(e) => setArticle({ ...article, description: e.target.value })}
                      className={textareaClass}
                      maxLength={169}
                    />
                  </div>

                  {/* URL */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL</label>
                    <input
                      type="text"
                      placeholder="Url de l'article"
                      value={article.url || ""}
                      onChange={(e) => setArticle({ ...article, url: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION: SEO (NEW) */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("seo")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">SEO</h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.seo ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.seo ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.seo && (
                <div className="flex flex-col gap-5 mt-[10px]">
                  {/* Meta title */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Meta title</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {article.seo_title.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Meta title"
                      value={article.seo_title}
                      onChange={(e) => setArticle({ ...article, seo_title: e.target.value.slice(0, 60) })}
                      className={inputClass}
                      maxLength={60}
                    />
                  </div>

                  {/* Meta description */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Meta description</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {article.seo_description.replace(/<[^>]*>/g, "").length}/155
                      </span>
                    </div>
                    <RichTextEditor
                      value={article.seo_description}
                      onChange={(val) => setArticle({ ...article, seo_description: val })}
                      minHeight="100px"
                    />
                  </div>

                  {/* No index & No follow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">No index</label>
                      <AdminDropdown
                        label=""
                        placeholder="Sélectionnez"
                        selected={article.noindex ? "OUI" : "NON"}
                        onSelect={(v) => setArticle({ ...article, noindex: v === "OUI" })}
                        options={[
                          { value: "NON", label: "NON" },
                          { value: "OUI", label: "OUI" }
                        ]}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">No follow</label>
                      <AdminDropdown
                        label=""
                        placeholder="Sélectionnez"
                        selected={article.nofollow ? "OUI" : "NON"}
                        onSelect={(v) => setArticle({ ...article, nofollow: v === "OUI" })}
                        options={[
                          { value: "NON", label: "NON" },
                          { value: "OUI", label: "OUI" }
                        ]}
                      />
                    </div>
                  </div>

                  {/* URL Canonique */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL Canonique</label>
                    <input
                      type="text"
                      placeholder="Url canonique"
                      value={article.canonical_override}
                      onChange={(e) => setArticle({ ...article, canonical_override: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: TAGS */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("tags")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Tags
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.tags ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.tags ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.tags && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  {/* Catégories & Sexe */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Catégories</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez la catégorie"
                      selected={article.categorie}
                      onSelect={(value) => setArticle({ ...article, categorie: value })}
                      options={[
                        { value: "Nutrition", label: "Nutrition" },
                        { value: "Entraînement", label: "Entraînement" },
                        { value: "Santé", label: "Santé" },
                        { value: "Motivation", label: "Motivation" },
                        { value: "Lifestyle", label: "Lifestyle" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Sexe</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le sexe"
                      selected={article.sexe}
                      onSelect={(value) => setArticle({ ...article, sexe: value })}
                      options={[
                        { value: "Tous", label: "Tous" },
                        { value: "Homme", label: "Homme" },
                        { value: "Femme", label: "Femme" },
                      ]}
                    />
                  </div>

                  {/* Niveau & Objectif */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Niveau</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le niveau"
                      selected={article.niveau}
                      onSelect={(value) => setArticle({ ...article, niveau: value })}
                      sortStrategy="none"
                      options={[
                        { value: "Débutant", label: "Débutant" },
                        { value: "Intermédiaire", label: "Intermédiaire" },
                        { value: "Confirmé", label: "Confirmé" },
                        { value: "Tous", label: "Tous" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Objectif</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez un objectif"
                      selected={article.objectif}
                      onSelect={(value) => setArticle({ ...article, objectif: value })}
                      options={[
                        { value: "Tous", label: "Tous" },
                        { value: "Prise de muscle", label: "Prise de muscle" },
                        { value: "Perte de graisse", label: "Perte de graisse" },
                        { value: "Gain de force", label: "Gain de force" },
                        { value: "Performance", label: "Performance" },
                      ]}
                    />
                  </div>

                  {article.type === "Programme" && (
                    <>
                      {/* Nombre de séances & Durée moyenne */}
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de séances</label>
                        <input
                          type="number"
                          placeholder="Nombre de séances"
                          value={article.nombre_seances || ""}
                          onChange={(e) => setArticle({ ...article, nombre_seances: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Durée moyenne</label>
                        <input
                          type="text"
                          placeholder="Durée moyenne"
                          value={article.duree_moyenne || ""}
                          onChange={(e) => setArticle({ ...article, duree_moyenne: e.target.value })}
                          className={inputClass}
                        />
                      </div>

                      {/* Nombre de semaines & Lieu */}
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de semaines</label>
                        <input
                          type="text"
                          placeholder="Nombre de semaines"
                          value={article.nombre_semaines || ""}
                          onChange={(e) => setArticle({ ...article, nombre_semaines: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lieu</label>
                        <AdminDropdown
                          label=""
                          placeholder="Sélectionnez le lieu"
                          selected={article.lieu}
                          onSelect={(value) => setArticle({ ...article, lieu: value })}
                          options={[
                            { value: "Salle", label: "Salle" },
                            { value: "Domicile", label: "Domicile" },
                          ]}
                        />
                      </div>

                      {/* Intensité */}
                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Intensité</label>
                        <AdminDropdown
                          label=""
                          placeholder="Sélectionnez l'intensité"
                          selected={article.intensite}
                          onSelect={(value) => setArticle({ ...article, intensite: value })}
                          sortStrategy="none"
                          options={[
                            { value: "Faible", label: "Faible" },
                            { value: "Modérée", label: "Modérée" },
                            { value: "Élevée", label: "Élevée" },
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: IMAGES DE L'OFFRE / ARTICLE */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("images")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Images de l'offre
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.images ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.images ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.images && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  {/* Image principale */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image principale</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">760px x 400px</span>
                    </div>
                    <ImageUploader
                      value={article.image || ""}
                      onChange={(url) => setArticle({ ...article, image: url })}
                      placeholder="Importer un fichier"
                    />
                  </div>
                  {/* Alt image */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Alt image</label>
                    <input
                      type="text"
                      placeholder="Alt de l'image"
                      value={article.image_alt || ""}
                      onChange={(e) => setArticle({ ...article, image_alt: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: ARTICLES LIÉS */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("related")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Articles liés
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.related ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.related ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>

              {!collapsedSections.related && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  {/* Article 1 */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Article 1</label>
                    <input
                      type="text"
                      placeholder="Id de l’article"
                      value={article.article_lie_1 || ""}
                      onChange={(e) => setArticle({ ...article, article_lie_1: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  {/* Article 2 */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Article 2</label>
                    <input
                      type="text"
                      placeholder="Id de l’article"
                      value={article.article_lie_2 || ""}
                      onChange={(e) => setArticle({ ...article, article_lie_2: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: CONTENU DE L'ARTICLE */}
            <div className="flex flex-col">
              <div 
                onClick={() => toggleSection("content")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Contenu de l'article
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image 
                    src="/icons/chevron_bloc.svg" 
                    alt="Chevron" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.content ? "rotate-180" : ""} group-hover:hidden`} 
                  />
                  <Image 
                    src="/icons/chevron_bloc_hover.svg" 
                    alt="Chevron Hover" 
                    fill 
                    className={`object-contain transition-transform duration-200 ${!collapsedSections.content ? "rotate-180" : ""} hidden group-hover:block`} 
                  />
                </div>
              </div>
              
              {!collapsedSections.content && (
                <div className="mt-[10px]">
                  {article.content_blocks.length > 0 && (
                    <div className="mb-5">
                      <WidgetsRenderer 
                        blocks={article.content_blocks} 
                        onChangeBlocks={(blocks: ContentBlock[]) => setArticle({ ...article, content_blocks: blocks })} 
                        currentNiveau={article.niveau}
                        currentSexe={article.sexe}
                        currentIntensite={article.intensite}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (article.type === "Conseil") {
                        setIsWidgetModalOpen(true);
                      } else {
                        setIsWidgetModalOpen(true);
                      }
                    }}
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
              )}
            </div>

            <div className="flex justify-center">
              <CTAButton
                onClick={handleSave}
                disabled={!isFormValid || !isDirty || isSaving}
                variant={isFormValid && isDirty && !isSaving ? "active" : "inactive"}
                className="font-semibold"
              >
                {isSaving ? "Sauvegarde en cours..." : articleId ? "Mettre à jour" : "Créer l'article"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>

    {isWidgetModalOpen && (
      <AddWidgetModal
        articleType={article.type}
        onClose={() => setIsWidgetModalOpen(false)}
        onSelect={(type) => {
          const newId = Math.random().toString(36).substr(2, 9);
          let newBlock = null;

          switch (type) {
            case "titre-texte":
              newBlock = { id: newId, type: "titre-texte", titre: "", ancreId: "", texte: "" };
              break;
            case "texte":
              newBlock = { id: newId, type: "texte", texte: "" };
              break;
            case "source":
              newBlock = { id: newId, type: "source", titre: "", texte: "" };
              break;
            case "programme":
              newBlock = { id: newId, type: "programme", ancreId: "programme", titre: "", texte: "" };
              break;
            case "telechargement":
              newBlock = { id: newId, type: "telechargement", programme_id: "" };
              break;
            case "seance":
              newBlock = { 
                id: newId, 
                type: "seance", 
                titre: "", 
                table_rows: [{ exercice: "", materiel: "", series: 4, reps: ["", "", "", ""], repos: "", conseils: "" }] 
              };
              break;
          }

          if (newBlock) {
            setArticle({
              ...article,
              content_blocks: [...article.content_blocks, newBlock as any]
            });
          }
          setIsWidgetModalOpen(false);
        }}
      />
    )}
    </>
  );
}
