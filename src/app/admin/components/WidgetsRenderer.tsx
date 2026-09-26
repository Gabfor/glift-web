import React, { useState } from "react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import BlockAdminWrapper from "./BlockAdminWrapper";
import RichTextEditor from "@/components/ui/RichTextEditor";
import Tooltip from "@/components/Tooltip";
import { ContentBlock, SeanceRow, BlockPartenaires, BlockTableau, BlockCTA, BlockListe, BlockFAQ, FAQItem } from "../create-blog-article/blogArticleForm";
import AdminSeanceTable from "./AdminSeanceTable";
import AddRowButton from "@/components/AddRowButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import { TrashIcon, TrashHoverIcon } from "@/components/icons/TrashIcons";

type Props = {
  blocks: ContentBlock[];
  onChangeBlocks: (blocks: ContentBlock[]) => void;
  currentNiveau?: string;
  currentSexe?: string;
  currentIntensite?: string;
};

export default function WidgetsRenderer({ blocks, onChangeBlocks, currentNiveau, currentSexe, currentIntensite }: Props) {
  const getNiveauIcon = (niveau?: string) => {
    if (!niveau) return "/icons/admin_niveau_1.svg";
    const n = niveau.toLowerCase();
    if (n.includes("débutant") || n.includes("tous")) return "/icons/admin_niveau_1.svg";
    if (n.includes("intermédiaire")) return "/icons/admin_niveau_2.svg";
    if (n.includes("confirmé")) return "/icons/admin_niveau_3.svg";
    return "/icons/admin_niveau_1.svg";
  };

  const getSexeIcon = (sexe?: string) => {
    if (!sexe) return "/icons/admin_sexe.svg";
    const s = sexe.toLowerCase();
    if (s.includes("femme")) return "/icons/admin_femme.svg";
    if (s.includes("homme")) return "/icons/admin_sexe.svg";
    if (s.includes("tous") || s.includes("mixte")) return "/icons/admin_mixte.svg";
    return "/icons/admin_sexe.svg";
  };

  const getIntensiteIcon = (intensite?: string) => {
    if (!intensite) return "/icons/admin_intensite_modere.svg";
    const i = intensite.toLowerCase();
    if (i.includes("faible")) return "/icons/admin_intensite_faible.svg";
    if (i.includes("modérée") || i.includes("modere")) return "/icons/admin_intensite_modere.svg";
    if (i.includes("élevée") || i.includes("eleve")) return "/icons/admin_intensite_eleve.svg";
    return "/icons/admin_intensite_modere.svg";
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChangeBlocks(
      blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)) as ContentBlock[]
    );
  };

  const removeBlock = (id: string) => {
    onChangeBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) return;

    const newBlocks = [...blocks];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    onChangeBlocks(newBlocks);
  };

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index];
    const newBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChangeBlocks(newBlocks);
  };

  const inputClass = "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5D6494] transition-all duration-150 truncate";
  const textareaClass = "min-h-[100px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5D6494] transition-all duration-150 resize-y";

  const getBlockTitle = (type: string) => {
    switch (type) {
      case "titre-texte": return "Bloc titre + texte";
      case "titre": return "Bloc titre";
      case "texte-1-1": return "Bloc texte 1.1";
      case "texte": return "Bloc texte";
      case "texte-image": return "Bloc texte + image";
      case "card": return "Bloc cards";
      case "newsletter": return "Bloc newsletter";
      case "source": return "Bloc source";
      case "note": return "Bloc note";
      case "tableau": return "Bloc tableau";
      case "cta": return "Bloc CTA";
      case "liste": return "Bloc liste";
      case "faq": return "Bloc FAQ";
      case "programme": return "Bloc programme";
      case "telechargement": return "Bloc téléchargement";
      case "seance": return "Bloc séance";
      case "image-principale": return "Image principale";
      case "partenaires": return "Bloc partenaires";
      case "boutons": return "Bloc boutons";
      default: return `Bloc ${type}`;
    }
  };

  return (
    <div className="flex flex-col gap-0 w-full">
      {blocks.map((block, index) => {
        const isFirst = index === 0;
        const isLast = index === blocks.length - 1;

        return (
          <BlockAdminWrapper
            key={block.id}
            title={getBlockTitle(block.type)}
            onMoveUp={() => moveBlock(index, "up")}
            onMoveDown={() => moveBlock(index, "down")}
            onDelete={() => removeBlock(block.id)}
            onDuplicate={() => duplicateBlock(index)}
            isFirst={isFirst}
            isLast={isLast}
            headerActions={
              block.type === "partenaires" || block.type === "boutons" || block.type === "image-principale" || block.type === "newsletter" ? (
                <ToggleSwitch 
                  checked={(block as any).enabled !== false} 
                  onCheckedChange={(checked) => updateBlock(block.id, { enabled: checked })} 
                />
              ) : undefined
            }
          >
            {/* Rendu spécifique selon le type */}

            {block.type === "titre-texte" && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre</label>
                    <input 
                      type="text" 
                      placeholder="Titre" 
                      value={block.titre || ""} 
                      onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id</label>
                    <input 
                      type="text"
                      placeholder="Id"
                      value={block.ancreId || ""}
                      onChange={(e) => updateBlock(block.id, { ancreId: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor 
                    value={block.texte} 
                    onChange={(html) => updateBlock(block.id, { texte: html })}
                  />
                </div>
              </>
            )}

            {block.type === "titre" && (
              <>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminTextField
                      label="Surtitre"
                      placeholder="Surtitre"
                      value={block.surtitre || ""}
                      onChange={(val) => updateBlock(block.id, { surtitre: val })}
                    />
                    <AdminTextField
                      label="Id"
                      placeholder="Id"
                      value={block.ancreId || ""}
                      onChange={(val) => updateBlock(block.id, { ancreId: val })}
                    />
                  </div>
                  <AdminTextField
                    label="Titre"
                    placeholder="Titre"
                    value={block.titre || ""}
                    onChange={(val) => updateBlock(block.id, { titre: val })}
                  />
                </div>
              </>
            )}

            {block.type === "texte-image" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col w-1/2 pr-4">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Position de l'image</label>
                  <AdminDropdown
                    label=""
                    placeholder="Position"
                    selected={block.imagePosition || "gauche"}
                    onSelect={(v) => updateBlock(block.id, { imagePosition: v as any })}
                    options={[{ value: "gauche", label: "Gauche" }, { value: "droite", label: "Droite" }]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-end mb-[5px]">
                      <label className="text-[16px] text-[#3A416F] font-bold">Image</label>
                      <span className="text-[#A0A2B8] text-[12px] font-semibold">466 x 350px</span>
                    </div>
                    <ImageUploader 
                      value={block.image || ""} 
                      onChange={(url) => updateBlock(block.id, { image: url })} 
                    />
                  </div>
                  <AdminTextField
                    label="Alt image"
                    placeholder="alt image"
                    value={block.alt || ""}
                    onChange={(val) => updateBlock(block.id, { alt: val })}
                  />
                  <AdminTextField
                    label="Surtitre"
                    placeholder="Surtitre"
                    value={block.surtitre || ""}
                    onChange={(val) => updateBlock(block.id, { surtitre: val })}
                  />
                  <AdminTextField
                    label="Titre"
                    placeholder="Titre"
                    value={block.titre || ""}
                    onChange={(val) => updateBlock(block.id, { titre: val })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor
                    value={block.texte || ""}
                    onChange={(val) => updateBlock(block.id, { texte: val })}
                    minHeight="120px"
                  />
                </div>
                <div className="flex flex-col w-1/2 pr-4">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Type de bouton</label>
                  <AdminDropdown
                    label=""
                    placeholder="Type"
                    sortStrategy="none"
                    selected={block.boutonType || "aucun"}
                    onSelect={(v) => updateBlock(block.id, { boutonType: v as any })}
                    options={[
                      { value: "primaire", label: "Primaire" },
                      { value: "secondaire", label: "Secondaire" },
                      { value: "google", label: "Bouton Google" },
                      { value: "apple", label: "Bouton Apple" },
                      { value: "aucun", label: "Aucun" },
                    ]}
                  />
                </div>
                {block.boutonType !== "aucun" && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <AdminTextField
                      label="Texte du bouton"
                      placeholder="Texte du bouton"
                      value={block.boutonTexte || ""}
                      onChange={(val) => updateBlock(block.id, { boutonTexte: val })}
                    />
                    <AdminTextField
                      label="Lien du bouton"
                      placeholder="Lien du bouton"
                      value={block.boutonLien || ""}
                      onChange={(val) => updateBlock(block.id, { boutonLien: val })}
                    />
                  </div>
                )}
              </div>
            )}

            {block.type === "card" && (
              <div className="flex flex-col gap-6">
                {/* Section INTRODUCTION */}
                <div className="flex flex-col gap-4">
                  <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">INTRODUCTION</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminTextField
                      label="Surtitre"
                      placeholder="Surtitre"
                      value={block.surtitre || ""}
                      onChange={(val) => updateBlock(block.id, { surtitre: val })}
                    />
                    <AdminTextField
                      label="Titre"
                      placeholder="Titre"
                      value={block.titre || ""}
                      onChange={(val) => updateBlock(block.id, { titre: val })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                    <RichTextEditor
                      value={block.texte || ""}
                      onChange={(val) => updateBlock(block.id, { texte: val })}
                      editorClassName="min-h-[120px] h-full"
                      containerClassName="min-h-[120px]"
                    />
                  </div>
                </div>

                {/* Section CARD 1 */}
                <div className="flex flex-col gap-4 pt-[14px]">
                  <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">CARD 1</span>
                  
                  <AdminTextField
                    label="Titre"
                    placeholder="Titre"
                    value={block.card1?.titre || ""}
                    onChange={(val) => updateBlock(block.id, { card1: { ...block.card1, titre: val } })}
                  />

                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                    <RichTextEditor
                      value={block.card1?.texte || ""}
                      onChange={(val) => updateBlock(block.id, { card1: { ...block.card1, texte: val } })}
                      editorClassName="min-h-[120px] h-full"
                      containerClassName="min-h-[120px]"
                    />
                  </div>

                  <div className="flex flex-col w-1/2 pr-4">
                    <AdminDropdown
                      label="Type de bouton"
                      placeholder="Type"
                      sortStrategy="none"
                      options={[
                        { label: "Primaire", value: "primaire" },
                        { label: "Secondaire", value: "secondaire" },
                        { label: "Bouton Google", value: "google" },
                        { label: "Bouton Apple", value: "apple" },
                        { label: "Aucun", value: "aucun" },
                      ]}
                      selected={block.card1?.boutonType || "secondaire"}
                      onSelect={(val) => updateBlock(block.id, { card1: { ...block.card1, boutonType: val as any } })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminTextField
                      label="Texte du bouton"
                      placeholder="Texte du bouton"
                      value={block.card1?.boutonTexte || ""}
                      onChange={(val) => updateBlock(block.id, { card1: { ...block.card1, boutonTexte: val } })}
                    />
                    <AdminTextField
                      label="Lien du bouton"
                      placeholder="Lien du bouton"
                      value={block.card1?.boutonLien || ""}
                      onChange={(val) => updateBlock(block.id, { card1: { ...block.card1, boutonLien: val } })}
                    />
                  </div>
                </div>

                {/* Section CARD 2 */}
                <div className="flex flex-col gap-4 pt-[14px]">
                  <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">CARD 2</span>
                  
                  <AdminTextField
                    label="Titre"
                    placeholder="Titre"
                    value={block.card2?.titre || ""}
                    onChange={(val) => updateBlock(block.id, { card2: { ...block.card2, titre: val } })}
                  />

                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                    <RichTextEditor
                      value={block.card2?.texte || ""}
                      onChange={(val) => updateBlock(block.id, { card2: { ...block.card2, texte: val } })}
                      editorClassName="min-h-[120px] h-full"
                      containerClassName="min-h-[120px]"
                    />
                  </div>

                  <div className="flex flex-col w-1/2 pr-4">
                    <AdminDropdown
                      label="Type de bouton"
                      placeholder="Type"
                      sortStrategy="none"
                      options={[
                        { label: "Primaire", value: "primaire" },
                        { label: "Secondaire", value: "secondaire" },
                        { label: "Bouton Google", value: "google" },
                        { label: "Bouton Apple", value: "apple" },
                        { label: "Aucun", value: "aucun" },
                      ]}
                      selected={block.card2?.boutonType || "secondaire"}
                      onSelect={(val) => updateBlock(block.id, { card2: { ...block.card2, boutonType: val as any } })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminTextField
                      label="Texte du bouton"
                      placeholder="Texte du bouton"
                      value={block.card2?.boutonTexte || ""}
                      onChange={(val) => updateBlock(block.id, { card2: { ...block.card2, boutonTexte: val } })}
                    />
                    <AdminTextField
                      label="Lien du bouton"
                      placeholder="Lien du bouton"
                      value={block.card2?.boutonLien || ""}
                      onChange={(val) => updateBlock(block.id, { card2: { ...block.card2, boutonLien: val } })}
                    />
                  </div>
                </div>
              </div>
            )}

            {block.type === "newsletter" && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdminTextField
                    label="Surtitre"
                    placeholder="Surtitre"
                    value={block.surtitre || ""}
                    onChange={(val) => updateBlock(block.id, { surtitre: val })}
                  />
                  <AdminTextField
                    label="Titre"
                    placeholder="Titre"
                    value={block.titre || ""}
                    onChange={(val) => updateBlock(block.id, { titre: val })}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor
                    value={block.texte || ""}
                    onChange={(val) => updateBlock(block.id, { texte: val })}
                    editorClassName="min-h-[120px] h-full"
                    containerClassName="min-h-[120px]"
                  />
                </div>

                <div className="w-1/2 pr-4">
                  <AdminTextField
                    label="Texte du bouton"
                    placeholder="Texte du bouton"
                    value={block.boutonTexte || ""}
                    onChange={(val) => updateBlock(block.id, { boutonTexte: val })}
                  />
                </div>
              </div>
            )}

            {block.type === "texte-1-1" && (
              <>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre</label>
                  <input 
                    type="text" 
                    placeholder="Titre" 
                    value={block.titre || ""} 
                    onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor 
                    value={block.texte} 
                    onChange={(html) => updateBlock(block.id, { texte: html })}
                  />
                </div>
              </>
            )}

            {block.type === "texte" && (
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                <RichTextEditor 
                  value={block.texte} 
                  onChange={(html) => updateBlock(block.id, { texte: html })}
                />
              </div>
            )}

            {block.type === "source" && (
              <>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre des sources</label>
                  <input 
                    type="text" 
                    placeholder="Titre" 
                    value={block.titre || ""} 
                    onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor 
                    value={block.texte} 
                    onChange={(html) => updateBlock(block.id, { texte: html })}
                    containerClassName="h-[170px] overflow-hidden"
                    editorClassName="h-[130px] overflow-y-auto w-full min-h-[130px]"
                  />
                </div>
              </>
            )}

            {block.type === "note" && (
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte de la note</label>
                <RichTextEditor 
                  value={block.texte || ""} 
                  onChange={(html) => updateBlock(block.id, { texte: html })}
                  minHeight="100px"
                />
              </div>
            )}

            {block.type === "tableau" && (
              <AdminTableBlock
                block={block as BlockTableau}
                updateBlock={updateBlock}
                inputClass={inputClass}
              />
            )}

            {block.type === "cta" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <AdminTextField
                  label="Texte"
                  placeholder="Texte du bouton"
                  value={(block as BlockCTA).texte || ""}
                  onChange={(val) => updateBlock(block.id, { texte: val })}
                />
                <AdminTextField
                  label="URL"
                  placeholder="https://... ou /lien"
                  value={(block as BlockCTA).url || ""}
                  onChange={(val) => updateBlock(block.id, { url: val })}
                />
              </div>
            )}

            {block.type === "liste" && (
              <AdminListBlock
                block={block as BlockListe}
                updateBlock={updateBlock}
                inputClass={inputClass}
              />
            )}

            {block.type === "faq" && (
              <AdminFAQBlock
                block={block as BlockFAQ}
                updateBlock={updateBlock}
                inputClass={inputClass}
              />
            )}

            {block.type === "telechargement" && (
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">ID du programme</label>
                <input 
                  type="text" 
                  value={block.programme_id || ""} 
                  onChange={(e) => updateBlock(block.id, { programme_id: e.target.value })}
                  placeholder="75d0f9c9-ec6c-4220-af22-3632ddcc8ac9"
                  className={inputClass}
                />
              </div>
            )}

            {block.type === "programme" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-[15px] border border-[#D7D4DC] p-[20px] grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-[10px]">
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_objectif.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Objectif</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_temps.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Durée moyenne des séances</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_seance.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Nombre de séances</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_semaines.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Nombre de semaines</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={getNiveauIcon(currentNiveau)} alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Niveau</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_lieu.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Lieu d'entraînement</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={getSexeIcon(currentSexe)} alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Genre</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={getIntensiteIcon(currentIntensite)} alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Intensité</span>
                  </div>
                </div>
              </div>
            )}

            {block.type === "seance" && (
              <>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nom de la séance</label>
                  <input 
                    type="text" 
                    value={block.titre || ""} 
                    onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                    className={inputClass}
                    placeholder="Nom de la séance"
                  />
                </div>

                <AdminSeanceTable 
                  rows={block.table_rows} 
                  setRows={(newRows) => updateBlock(block.id, { table_rows: newRows })} 
                />

              </>
            )}

            {block.type === "image-principale" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  {/* Image */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[#2E3271] font-bold text-[16px]">Image</label>
                      <span className="text-[12px] text-[#A1A5C1]">700 x 355px</span>
                    </div>
                    <ImageUploader
                      value={block.image}
                      onChange={(url: string) => updateBlock(block.id, { image: url })}
                      bucket="blog-images"
                      basePath="pages"
                    />
                  </div>

                  {/* Alt */}
                  <AdminTextField
                    label="Alt image"
                    placeholder="alt image"
                    value={block.alt}
                    onChange={(val) => updateBlock(block.id, { alt: val })}
                  />

                  {/* Texte 1 */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte 1</label>
                    <textarea
                      placeholder="Texte 1"
                      value={block.texte1 || ""}
                      onChange={(e) => updateBlock(block.id, { texte1: e.target.value })}
                      className="input-admin py-2 min-h-[100px] resize-y"
                    />
                  </div>

                  {/* Texte 2 */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte 2</label>
                    <textarea
                      placeholder="Texte 2"
                      value={block.texte2 || ""}
                      onChange={(e) => updateBlock(block.id, { texte2: e.target.value })}
                      className="input-admin py-2 min-h-[100px] resize-y"
                    />
                  </div>
                </div>
              </div>
            )}

            {block.type === "partenaires" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <AdminTextField
                    label="Surtitre"
                    value={block.surtitre || ""}
                    onChange={(val) => updateBlock(block.id, { surtitre: val })}
                    placeholder="Surtitre du bloc"
                  />
                  <AdminTextField
                    label="Titre"
                    value={block.titre || ""}
                    onChange={(val) => updateBlock(block.id, { titre: val })}
                    placeholder="Titre du bloc"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {block.slots.map((slot, sIdx) => {
                    const position = sIdx + 1;
                  return (
                    <div key={sIdx} className="flex flex-col gap-5">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-[5px]">
                          <span className="text-[16px] text-[#3A416F] font-bold">Partenaire {position}</span>
                          <span className="text-[#C2BFC6] text-xs font-semibold">222px x 102px</span>
                        </div>
                        <ImageUploader
                          value={slot.logo_url || ""}
                          onChange={(url) => {
                            const newSlots = [...block.slots];
                            newSlots[sIdx] = { ...newSlots[sIdx], logo_url: url };
                            updateBlock(block.id, { slots: newSlots });
                          }}
                          placeholder="Importer un fichier"
                          bucket="partners"
                          basePath=""
                        />
                      </div>
                      <AdminTextField
                        label={`Alt image partenaire ${position}`}
                        value={slot.alt_text || ""}
                        onChange={(val) => {
                          const newSlots = [...block.slots];
                          newSlots[sIdx] = { ...newSlots[sIdx], alt_text: val };
                          updateBlock(block.id, { slots: newSlots });
                        }}
                        placeholder={`Alt partenaire ${position}`}
                      />
                      <AdminTextField
                        label={`Lien partenaire ${position}`}
                        value={slot.link_url || ""}
                        onChange={(val) => {
                          const newSlots = [...block.slots];
                          newSlots[sIdx] = { ...newSlots[sIdx], link_url: val };
                          updateBlock(block.id, { slots: newSlots });
                        }}
                        placeholder={`Lien partenaire ${position}`}
                      />
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {block.type === "boutons" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Bouton 1</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez un type de bouton"
                      sortStrategy="none"
                      selected={block.bouton1.type}
                      onSelect={(val) => updateBlock(block.id, { bouton1: { ...block.bouton1, type: val as any } })}
                      options={[
                        { value: "google", label: "Bouton Google" },
                        { value: "apple", label: "Bouton Apple" },
                        { value: "primaire", label: "Bouton primaire" },
                        { value: "secondaire", label: "Bouton secondaire" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Bouton 2</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez un type de bouton"
                      sortStrategy="none"
                      selected={block.bouton2.type}
                      onSelect={(val) => updateBlock(block.id, { bouton2: { ...block.bouton2, type: val as any } })}
                      options={[
                        { value: "apple", label: "Bouton Apple" },
                        { value: "google", label: "Bouton Google" },
                        { value: "primaire", label: "Bouton primaire" },
                        { value: "secondaire", label: "Bouton secondaire" },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <AdminTextField
                    label="Texte du bouton 1"
                    value={block.bouton1.texte || ""}
                    onChange={(val) => updateBlock(block.id, { bouton1: { ...block.bouton1, texte: val } })}
                    placeholder="Texte du bouton 1"
                  />
                  <AdminTextField
                    label="Texte du bouton 2"
                    value={block.bouton2.texte || ""}
                    onChange={(val) => updateBlock(block.id, { bouton2: { ...block.bouton2, texte: val } })}
                    placeholder="Texte du bouton 2"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <AdminTextField
                    label="Lien du bouton 1"
                    value={block.bouton1.lien || ""}
                    onChange={(val) => updateBlock(block.id, { bouton1: { ...block.bouton1, lien: val } })}
                    placeholder={
                      block.bouton1.type === "google"
                        ? "ex: https://play.google.com/..."
                        : block.bouton1.type === "apple"
                        ? "ex: https://apps.apple.com/..."
                        : "Lien du bouton 1"
                    }
                  />
                  <AdminTextField
                    label="Lien du bouton 2"
                    value={block.bouton2.lien || ""}
                    onChange={(val) => updateBlock(block.id, { bouton2: { ...block.bouton2, lien: val } })}
                    placeholder={
                      block.bouton2.type === "google"
                        ? "ex: https://play.google.com/..."
                        : block.bouton2.type === "apple"
                        ? "ex: https://apps.apple.com/..."
                        : "Lien du bouton 2"
                    }
                  />
                </div>
              </div>
            )}

            {block.type === "tarifs" && (
              <div className="flex flex-col gap-10">
                {/* Abonnement 1 & 2 */}
                {[1, 2].map((num) => {
                  const key = `abonnement${num}` as "abonnement1" | "abonnement2";
                  const abo = block[key];
                  
                  return (
                    <div key={key} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4">
                        <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">Abonnement {num}</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <AdminTextField
                            label="Nom de l'abonnement"
                            value={abo.nom}
                            onChange={(val) => updateBlock(block.id, { [key]: { ...abo, nom: val } })}
                            placeholder="Nom de l'abonnement"
                          />
                          <AdminTextField
                            label="Prix de l'abonnement"
                            value={abo.prix}
                            onChange={(val) => updateBlock(block.id, { [key]: { ...abo, prix: val } })}
                            placeholder="Prix de l'abonnement"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Description de l'abonnement</label>
                        <RichTextEditor
                          value={abo.description}
                          onChange={(val) => updateBlock(block.id, { [key]: { ...abo, description: val } })}
                          minHeight="120px"
                        />
                      </div>

                      <div className="flex flex-col gap-5">
                        {abo.arguments.map((arg, argIdx) => {
                          const argKey = arg.id || `arg-${argIdx}`;
                          return (
                            <div key={argKey} className="flex flex-col gap-4">
                              {/* Separator Argument - Identical to BlockAdminWrapper Header */}
                              <div className="relative flex items-center justify-between bg-[#FBFCFE] h-[50px] mb-4 z-10">
                                {/* Titre centré */}
                                <div className="flex-1 flex justify-center items-center relative z-10 pointer-events-none">
                                  <div className="bg-[#FBFCFE] px-4 text-[14px] text-[#D7D4DC] font-bold pointer-events-auto">
                                    Argument {argIdx + 1}
                                  </div>
                                </div>

                                {/* Icônes de déplacement à gauche */}
                                <div className="flex items-center absolute left-0 z-20 bg-[#FBFCFE] p-2">
                                  <Tooltip content="Descendre">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (argIdx < abo.arguments.length - 1) {
                                          const newArgs = [...abo.arguments];
                                          [newArgs[argIdx + 1], newArgs[argIdx]] = [newArgs[argIdx], newArgs[argIdx + 1]];
                                          updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                        }
                                      }} 
                                      disabled={argIdx === abo.arguments.length - 1} 
                                      className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${argIdx === abo.arguments.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      aria-label="Descendre"
                                    >
                                      <div className="relative w-full h-full">
                                        <Image
                                          src="/icons/move_down.svg"
                                          alt="Descendre"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0 pointer-events-none"
                                        />
                                        <Image
                                          src="/icons/move_down_hover.svg"
                                          alt="Descendre"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100 pointer-events-none"
                                        />
                                      </div>
                                    </button>
                                  </Tooltip>

                                  <Tooltip content="Monter">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (argIdx > 0) {
                                          const newArgs = [...abo.arguments];
                                          [newArgs[argIdx - 1], newArgs[argIdx]] = [newArgs[argIdx], newArgs[argIdx - 1]];
                                          updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                        }
                                      }} 
                                      disabled={argIdx === 0} 
                                      className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${argIdx === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      aria-label="Monter"
                                    >
                                      <div className="relative w-full h-full">
                                        <Image
                                          src="/icons/move_up.svg"
                                          alt="Monter"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0 pointer-events-none"
                                        />
                                        <Image
                                          src="/icons/move_up_hover.svg"
                                          alt="Monter"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100 pointer-events-none"
                                        />
                                      </div>
                                    </button>
                                  </Tooltip>

                                  <Tooltip content="Dupliquer">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const newArgs = [...abo.arguments];
                                        const newArg = { ...arg, id: uuidv4() };
                                        newArgs.splice(argIdx + 1, 0, newArg);
                                        updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                      }} 
                                      className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
                                      aria-label="Dupliquer"
                                    >
                                      <div className="relative w-full h-full">
                                        <Image
                                          src="/icons/duplicate.svg"
                                          alt="Dupliquer"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0 pointer-events-none"
                                        />
                                        <Image
                                          src="/icons/duplicate_hover.svg"
                                          alt="Dupliquer"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100 pointer-events-none"
                                        />
                                      </div>
                                    </button>
                                  </Tooltip>
                                </div>

                                {/* Poubelle à droite */}
                                <div className="flex items-center absolute right-0 z-20 bg-[#FBFCFE] py-2 pl-2">
                                  <Tooltip content="Supprimer">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (argIdx > 0) {
                                          const newArgs = [...abo.arguments];
                                          newArgs.splice(argIdx, 1);
                                          updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                        }
                                      }}
                                      disabled={argIdx === 0}
                                      className={`relative w-[20px] h-[20px] transition duration-300 ease-in-out ${argIdx === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      aria-label="Supprimer"
                                    >
                                      <div className="relative w-full h-full">
                                        <Image
                                          src="/icons/delete_grey.svg"
                                          alt="Supprimer"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0 pointer-events-none"
                                        />
                                        <Image
                                          src="/icons/delete_hover.svg"
                                          alt="Supprimer"
                                          fill
                                          className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100 pointer-events-none"
                                        />
                                      </div>
                                    </button>
                                  </Tooltip>
                                </div>

                                {/* La ligne (séparateur) en dessous */}
                                <div className="absolute top-[25px] left-0 w-full h-[1px] bg-[#ECE9F1] z-0" />
                              </div>

                              <RichTextEditor
                                key={argKey}
                                value={arg.texte}
                                onChange={(val) => {
                                  const newArgs = [...abo.arguments];
                                  newArgs[argIdx] = { ...arg, texte: val };
                                  updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                }}
                                minHeight="80px"
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <AdminDropdown
                                  label={`Statut argument ${argIdx + 1}`}
                                  placeholder="Sélectionner un statut"
                                  options={[
                                    { label: "Activé", value: "true" },
                                    { label: "Désactivé", value: "false" }
                                  ]}
                                  selected={arg.active ? "true" : "false"}
                                  onSelect={(opt) => {
                                    const newArgs = [...abo.arguments];
                                    newArgs[argIdx] = { ...arg, active: opt === "true" };
                                    updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="pt-4">
                          <button
                            onClick={() => {
                              const newArgs = [...abo.arguments, { id: uuidv4(), texte: "", active: true }];
                              updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                            }}
                            className="w-full h-[45px] border border-dashed border-[#D7D4DC] rounded-[5px] flex items-center justify-center gap-2 hover:border-[#C2BFC6] transition-all duration-150 group"
                          >
                            <div className="relative w-[16px] h-[16px]">
                              <img src="/icons/plus_grey.svg" alt="" className="object-contain w-full h-full" />
                            </div>
                            <span className="text-[16px] font-semibold text-[#D7D4DC]">Ajouter un argument</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col">
                            <label className="text-[16px] text-[#2E3271] font-bold mb-[5px] block">Type de bouton</label>
                            <AdminDropdown
                              label=""
                              placeholder="Sélectionner un type"
                              options={[
                                { label: "Primaire", value: "primaire" },
                                { label: "Secondaire", value: "secondaire" },
                                { label: "Aucun", value: "aucun" }
                              ]}
                              selected={abo.boutonType || "aucun"}
                              onSelect={(val) => updateBlock(block.id, { [key]: { ...abo, boutonType: val as any } })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <AdminTextField
                            label="Texte du bouton"
                            value={abo.boutonTexte}
                            onChange={(val) => updateBlock(block.id, { [key]: { ...abo, boutonTexte: val } })}
                            placeholder="Texte du bouton"
                          />
                          <AdminTextField
                            label="Lien du bouton"
                            value={abo.boutonLien}
                            onChange={(val) => updateBlock(block.id, { [key]: { ...abo, boutonLien: val } })}
                            placeholder="Lien du bouton"
                          />
                        </div>
                      </div>

                      {num === 2 && (
                        <div className="pt-4">
                          <p className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-widest mb-4">BADGE</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <AdminTextField
                              label="Texte du badge"
                              value={abo.badge || ""}
                              onChange={(val) => updateBlock(block.id, { [key]: { ...abo, badge: val } })}
                              placeholder="Texte du badge"
                            />
                            <AdminDropdown
                              label="Statut badge"
                              placeholder="Statut badge"
                              options={[
                                { value: "ON", label: "ON" },
                                { value: "OFF", label: "OFF" }
                              ]}
                              selected={abo.badgeStatus || "ON"}
                              onSelect={(val: string) => updateBlock(block.id, { [key]: { ...abo, badgeStatus: val as any } })}
                            />
                            <AdminTextField
                              label="Couleur du badge"
                              value={abo.badgeColor || ""}
                              onChange={(val) => updateBlock(block.id, { [key]: { ...abo, badgeColor: val } })}
                              placeholder="#7069FA"
                            />
                            <AdminTextField
                              label="Couleur du texte"
                              value={abo.badgeTextColor || ""}
                              onChange={(val) => updateBlock(block.id, { [key]: { ...abo, badgeTextColor: val } })}
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </BlockAdminWrapper>
        );
      })}
    </div>
  );
}

function AdminTableBlock({
  block,
  updateBlock,
  inputClass,
}: {
  block: BlockTableau;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  inputClass: string;
}) {
  const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
  const [colPlusIcon, setColPlusIcon] = useState("/icons/admin_plus.svg");
  const [hoveredColDelIdx, setHoveredColDelIdx] = useState<number | null>(null);
  const [hoveredRowDelIdx, setHoveredRowDelIdx] = useState<number | null>(null);
  const headers = block.headers && block.headers.length > 0
    ? block.headers
    : ["Colonne 1", "Colonne 2", "Colonne 3"];
  const rows = block.rows && block.rows.length > 0
    ? block.rows
    : [["", "", ""]];

  const handleUpdateHeader = (colIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = value;
    updateBlock(block.id, { headers: newHeaders });
  };

  const handleAddColumn = () => {
    const newHeaders = [...headers, `Colonne ${headers.length + 1}`];
    const newRows = rows.map((r) => [...r, ""]);
    updateBlock(block.id, { headers: newHeaders, rows: newRows });
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== colIndex);
    const newRows = rows.map((r) => r.filter((_, i) => i !== colIndex));
    updateBlock(block.id, { headers: newHeaders, rows: newRows });
  };

  const handleUpdateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((r, rIdx) => {
      if (rIdx !== rowIndex) return r;
      const updatedRow = [...r];
      updatedRow[colIndex] = value;
      return updatedRow;
    });
    updateBlock(block.id, { rows: newRows });
  };

  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill("");
    updateBlock(block.id, { rows: [...rows, newRow] });
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== rowIndex);
    updateBlock(block.id, { rows: newRows });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre du tableau</label>
          <input
            type="text"
            placeholder="Titre"
            value={block.titre || ""}
            onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id</label>
          <input
            type="text"
            placeholder="Id"
            value={block.ancreId || ""}
            onChange={(e) => updateBlock(block.id, { ancreId: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="w-full mt-2">
        <div className="flex justify-end items-center mb-2 min-h-[24px]">
          <Tooltip content="Ajouter une colonne" placement="top">
            <button
              type="button"
              onClick={handleAddColumn}
              onMouseEnter={() => setColPlusIcon("/icons/admin_plus_hover.svg")}
              onMouseLeave={() => setColPlusIcon("/icons/admin_plus.svg")}
              className="cursor-pointer flex items-center justify-center p-0.5"
            >
              <Image
                src={colPlusIcon}
                alt="Ajouter une colonne"
                width={20}
                height={20}
                className="w-5 h-5 transition-all duration-200"
              />
            </button>
          </Tooltip>
        </div>

        <div className="overflow-x-auto w-full border border-[#ECE9F1] rounded-t-[5px] overflow-hidden">
          <table className="w-full text-[14px] font-medium border-collapse table-fixed bg-white">
            <thead className="bg-[#3A416F] text-white text-left h-10">
              <tr style={{ height: "40px" }}>
                {headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    className="relative group border-r border-white/20 last:border-r-0 px-2 font-semibold text-center"
                    style={{ height: "40px" }}
                  >
                    <div className="relative flex items-center justify-center w-full">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleUpdateHeader(colIdx, e.target.value)}
                        placeholder={`Colonne ${colIdx + 1}`}
                        className="w-full h-10 bg-transparent text-white font-semibold text-[14px] focus:outline-none placeholder-[#D7D4DC] text-center px-6 placeholder:text-center"
                      />
                      {headers.length > 1 && (
                        <Tooltip content="Supprimer la colonne" placement="top" offset={10} asChild>
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(colIdx)}
                            onMouseEnter={() => setHoveredColDelIdx(colIdx)}
                            onMouseLeave={() => setHoveredColDelIdx(null)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer"
                          >
                            <Image
                              src={
                                hoveredColDelIdx === colIdx
                                  ? "/icons/admin_supp_colonne_hover.svg"
                                  : "/icons/admin_supp_colonne.svg"
                              }
                              alt="Supprimer la colonne"
                              width={16}
                              height={16}
                            />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ width: "40px", maxWidth: "40px" }} className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="bg-white border-t border-[#ECE9F1]">
                  {headers.map((_, colIdx) => (
                    <td
                      key={colIdx}
                      className="p-0 border-r border-[#ECE9F1]"
                      style={{ height: "40px" }}
                    >
                      <input
                        type="text"
                        value={row[colIdx] ?? ""}
                        onChange={(e) => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                        placeholder="Texte"
                        className="w-full h-10 text-[14px] font-semibold text-[#5D6494] bg-transparent focus:outline-none placeholder-[#D7D4DC] text-center px-2 placeholder:text-center"
                      />
                    </td>
                  ))}
                  <td
                    className="w-10 text-center p-0"
                    style={{ width: "40px", maxWidth: "40px", height: "40px" }}
                  >
                    {rows.length > 1 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tooltip content="Supprimer la ligne" placement="top" offset={10} asChild>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rowIdx)}
                            onMouseEnter={() => setHoveredRowDelIdx(rowIdx)}
                            onMouseLeave={() => setHoveredRowDelIdx(null)}
                            className="w-5 h-5 flex items-center justify-center cursor-pointer"
                          >
                            <Image
                              src={
                                hoveredRowDelIdx === rowIdx
                                  ? "/icons/admin_supp_colonne_hover.svg"
                                  : "/icons/admin_supp_colonne.svg"
                              }
                              alt="Supprimer la ligne"
                              width={16}
                              height={16}
                            />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AddRowButton
          icon={plusIcon}
          setIcon={setPlusIcon}
          onClick={handleAddRow}
          adminMode={true}
        />
      </div>
    </div>
  );
}

function AdminListBlock({
  block,
  updateBlock,
  inputClass,
}: {
  block: BlockListe;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  inputClass: string;
}) {
  const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
  const items = block.items && block.items.length > 0 ? block.items : [""];

  const handleUpdateItem = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    updateBlock(block.id, { items: newItems });
  };

  const handleAddItem = () => {
    updateBlock(block.id, { items: [...items, ""] });
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      updateBlock(block.id, { items: [""] });
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    updateBlock(block.id, { items: newItems });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre</label>
          <input
            type="text"
            placeholder="Titre"
            value={block.titre || ""}
            onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id</label>
          <input
            type="text"
            placeholder="Id"
            value={block.ancreId || ""}
            onChange={(e) => updateBlock(block.id, { ancreId: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-1">
        <label className="text-[16px] text-[#3A416F] font-bold">Éléments de la liste</label>
        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const numStr = String(index + 1).padStart(2, "0");
            return (
              <div key={index} className="flex items-start gap-3">
                <span className="text-[14px] font-bold text-[#3A416F] w-[26px] text-center shrink-0 select-none pt-[12px]">
                  {numStr}
                </span>
                <div className="flex-1 min-w-0">
                  <RichTextEditor
                    value={item || ""}
                    onChange={(val) => handleUpdateItem(index, val)}
                    placeholder="Texte"
                    minHeight="60px"
                  />
                </div>
                <div className="pt-[10px] shrink-0">
                  <Tooltip content="Supprimer" placement="top" offset={10}>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="p-1 group cursor-pointer shrink-0"
                    >
                      <Image
                        src="/icons/admin_supp_colonne.svg"
                        alt="Supprimer"
                        width={16}
                        height={16}
                        className="group-hover:hidden"
                      />
                      <Image
                        src="/icons/admin_supp_colonne_hover.svg"
                        alt="Supprimer"
                        width={16}
                        height={16}
                        className="hidden group-hover:block"
                      />
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        <AddRowButton
          icon={plusIcon}
          setIcon={setPlusIcon}
          onClick={handleAddItem}
          adminMode={true}
        />
      </div>
    </div>
  );
}

function AdminFAQBlock({
  block,
  updateBlock,
  inputClass,
}: {
  block: BlockFAQ;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  inputClass: string;
}) {
  const [plusIcon, setPlusIcon] = useState("/icons/admin_plus.svg");
  const items = block.items && block.items.length > 0 ? block.items : [{ question: "", reponse: "" }];

  const handleUpdateItem = (index: number, field: "question" | "reponse", val: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    updateBlock(block.id, { items: newItems });
  };

  const handleAddItem = () => {
    updateBlock(block.id, { items: [...items, { question: "", reponse: "" }] });
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      updateBlock(block.id, { items: [{ question: "", reponse: "" }] });
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    updateBlock(block.id, { items: newItems });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre</label>
          <input
            type="text"
            placeholder="Titre"
            value={block.titre || ""}
            onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id</label>
          <input
            type="text"
            placeholder="Id"
            value={block.ancreId || ""}
            onChange={(e) => updateBlock(block.id, { ancreId: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {items.map((item, index) => {
          return (
            <div key={index} className="flex flex-col">
              {/* Question Divider Bar */}
              <div className="relative flex items-center justify-between bg-[#FBFCFE] h-[50px] mb-[12px] z-10">
                {/* Conteneur du nom centré avec z-index pour passer au-dessus de la ligne */}
                <div className="flex-1 flex justify-center items-center relative z-10 pointer-events-none">
                  <div className="flex items-center text-[16px] text-[#D7D4DC] font-semibold bg-[#FBFCFE] p-2 pointer-events-auto">
                    <span>Question</span>
                  </div>
                </div>

                {/* Poubelle à droite avec fond pour masquer la ligne */}
                <div className="flex items-center absolute right-0 z-20 bg-[#FBFCFE] py-2 pl-2">
                  <Tooltip content="Supprimer">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(index)}
                      className="relative w-[20px] h-[20px] transition duration-300 ease-in-out cursor-pointer"
                      aria-label="Supprimer"
                    >
                      <div className="relative w-full h-full">
                        <TrashIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0 pointer-events-none" />
                        <TrashHoverIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100 pointer-events-none" />
                      </div>
                    </button>
                  </Tooltip>
                </div>

                {/* La ligne (séparateur) en dessous de tout */}
                <div className="absolute top-[25px] left-0 w-full h-[1px] bg-[#ECE9F1] z-0" />
              </div>

              {/* Champ Question */}
              <div className="flex flex-col mb-4">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Question</label>
                <input
                  type="text"
                  placeholder="Question"
                  value={item.question || ""}
                  onChange={(e) => handleUpdateItem(index, "question", e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Champ Réponse */}
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Réponse</label>
                <RichTextEditor
                  value={item.reponse || ""}
                  onChange={(val) => handleUpdateItem(index, "reponse", val)}
                  placeholder="Réponse"
                  minHeight="100px"
                />
              </div>
            </div>
          );
        })}

        <AddRowButton
          icon={plusIcon}
          setIcon={setPlusIcon}
          onClick={handleAddItem}
          adminMode={true}
          className="mt-0"
        />
      </div>
    </div>
  );
}
