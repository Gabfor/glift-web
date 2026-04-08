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

type Props = {
  articleId: string | null;
};

export default function CreateBlogArticlePageClient({ articleId }: Props) {
  const router = useRouter();
  const [article, setArticle] = useState<BlogArticleFormState>(emptyBlogArticle);
  const [baseArticle, setBaseArticle] = useState<BlogArticleFormState>(emptyBlogArticle);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);

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
            Créer un article
          </h2>

          {/* Toggle Conseil / Programme */}
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
              onClick={() => setArticle({ ...article, type: "Programme" })}
              className={`relative z-10 h-[30px] w-[110px] flex items-center justify-center text-[14px] font-semibold rounded-full transition-colors duration-200 ${
                article.type === "Programme"
                  ? "text-[#3A416F]"
                  : "text-[#5D6494] hover:text-[#3A416F]"
              }`}
            >
              Programme
            </button>
          </div>

          <div className="flex flex-col gap-[40px] w-full">
            {/* SECTION 0: STATUT DE L'ARTICLE */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Statut de l'article
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
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
              </div>
            </div>

            {/* SECTION 1: INTRODUCTION */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Introduction
              </h3>
              <div className="flex flex-col gap-[30px]">
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
                    value={article.titre}
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
                    value={article.description}
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
                    value={article.url}
                    onChange={(e) => setArticle({ ...article, url: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: TAGS */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Tags
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
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
                    options={[
                      { value: "Tous", label: "Tous" },
                      { value: "Débutant", label: "Débutant" },
                      { value: "Intermédiaire", label: "Intermédiaire" },
                      { value: "Confirmé", label: "Confirmé" },
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
                        value={article.nombre_seances}
                        onChange={(e) => setArticle({ ...article, nombre_seances: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Durée moyenne</label>
                      <input
                        type="text"
                        placeholder="Durée moyenne"
                        value={article.duree_moyenne}
                        onChange={(e) => setArticle({ ...article, duree_moyenne: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    {/* Nombre de semaines & Lieu */}
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de semaines</label>
                      <input
                        type="number"
                        placeholder="Nombre de semaines"
                        value={article.nombre_semaines}
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
            </div>

            {/* SECTION 3: IMAGES DE L'OFFRE / ARTICLE */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Images de l'offre
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                {/* Image principale */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[16px] text-[#3A416F] font-bold">Image principale</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">760px x 400px</span>
                  </div>
                  <ImageUploader
                    value={article.image}
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
                    value={article.image_alt}
                    onChange={(e) => setArticle({ ...article, image_alt: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: ARTICLES LIÉS */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Articles liés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                {/* Article 1 */}
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Article 1</label>
                  <input
                    type="text"
                    placeholder="Id de l’article"
                    value={article.article_lie_1}
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
                    value={article.article_lie_2}
                    onChange={(e) => setArticle({ ...article, article_lie_2: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: CONTENU DE L'ARTICLE */}
            <div className="flex flex-col">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px] tracking-wide">
                Contenu de l'article
              </h3>
              
              {article.content_blocks.length > 0 && (
                <div className="mb-[30px]">
                  <WidgetsRenderer 
                    blocks={article.content_blocks} 
                    onChangeBlocks={(blocks: ContentBlock[]) => setArticle({ ...article, content_blocks: blocks })} 
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

            <div className="mt-[10px] flex justify-center">
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
              newBlock = { id: newId, type: "programme", titre: "", texte: "", features_list: "" };
              break;
            case "telechargement":
              newBlock = { id: newId, type: "telechargement", titre: "", url: "", nom_bouton: "", texte: "" };
              break;
            case "seance":
              newBlock = { id: newId, type: "seance", titre: "", table_rows: [], texte: "" };
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
