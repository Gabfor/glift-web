import React from "react";
import { v4 as uuidv4 } from "uuid";
import BlockAdminWrapper from "./BlockAdminWrapper";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { ContentBlock, SeanceRow, BlockPartenaires } from "../create-blog-article/blogArticleForm";
import AdminSeanceTable from "./AdminSeanceTable";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import AdminDropdown from "@/app/admin/components/AdminDropdown";

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

  const inputClass = "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";
  const textareaClass = "min-h-[100px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150 resize-y";

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
              block.type === "partenaires" || block.type === "boutons" || block.type === "image-principale" ? (
                <ToggleSwitch 
                  checked={(block as any).enabled} 
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
                    selected={block.boutonType || "aucun"}
                    onSelect={(v) => updateBlock(block.id, { boutonType: v as any })}
                    options={[
                      { value: "primaire", label: "Primaire" },
                      { value: "secondaire", label: "Secondaire" },
                      { value: "aucun", label: "Aucun" }
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
              <div className="flex flex-col gap-5">
                {/* Card 1 */}
                <div className="flex flex-col gap-4">
                  <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">Card 1</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-end mb-[5px]">
                        <label className="text-[16px] text-[#3A416F] font-bold">Image</label>
                        <span className="text-[#A0A2B8] text-[12px] font-semibold">466 x 350px</span>
                      </div>
                      <ImageUploader
                        value={block.card1?.image || ""}
                        onChange={(url) => updateBlock(block.id, { card1: { ...block.card1, image: url } })}
                      />
                    </div>
                    <AdminTextField
                      label="Alt image"
                      placeholder="alt image"
                      value={block.card1?.alt || ""}
                      onChange={(val) => updateBlock(block.id, { card1: { ...block.card1, alt: val } })}
                    />
                  </div>
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
                      editorClassName="min-h-[150px] h-full"
                      containerClassName="min-h-[150px]"
                    />
                  </div>
                  <div className="flex flex-col w-1/2 pr-4">
                    <AdminDropdown
                      label="Type de bouton"
                      placeholder="Type"
                      options={[
                        { label: "Primaire", value: "primaire" },
                        { label: "Secondaire", value: "secondaire" },
                        { label: "Aucun", value: "aucun" }
                      ]}
                      selected={block.card1?.boutonType || "aucun"}
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

                {/* Card 2 */}
                <div className="flex flex-col gap-4 pt-[14px]">
                  <span className="text-[12px] font-bold text-[#D7D4DC] uppercase tracking-wider">Card 2</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-end mb-[5px]">
                        <label className="text-[16px] text-[#3A416F] font-bold">Image</label>
                        <span className="text-[#A0A2B8] text-[12px] font-semibold">466 x 350px</span>
                      </div>
                      <ImageUploader
                        value={block.card2?.image || ""}
                        onChange={(url) => updateBlock(block.id, { card2: { ...block.card2, image: url } })}
                      />
                    </div>
                    <AdminTextField
                      label="Alt image"
                      placeholder="alt image"
                      value={block.card2?.alt || ""}
                      onChange={(val) => updateBlock(block.id, { card2: { ...block.card2, alt: val } })}
                    />
                  </div>
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
                      editorClassName="min-h-[150px] h-full"
                      containerClassName="min-h-[150px]"
                    />
                  </div>
                  <div className="flex flex-col w-1/2 pr-4">
                    <AdminDropdown
                      label="Type de bouton"
                      placeholder="Type"
                      options={[
                        { label: "Primaire", value: "primaire" },
                        { label: "Secondaire", value: "secondaire" },
                        { label: "Aucun", value: "aucun" }
                      ]}
                      selected={block.card2?.boutonType || "aucun"}
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
                <AdminTextField
                  label="Titre"
                  placeholder="Inscrivez-vous à la newsletter"
                  value={block.titre || ""}
                  onChange={(val) => updateBlock(block.id, { titre: val })}
                />
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte</label>
                  <RichTextEditor
                    value={block.texte || ""}
                    onChange={(val) => updateBlock(block.id, { texte: val })}
                    minHeight="120px"
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
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Sexe</span>
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
                      selected={block.bouton1.type}
                      onSelect={(val) => updateBlock(block.id, { bouton1: { ...block.bouton1, type: val as any } })}
                      options={[
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
                      selected={block.bouton2.type}
                      onSelect={(val) => updateBlock(block.id, { bouton2: { ...block.bouton2, type: val as any } })}
                      options={[
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
                    placeholder="Lien du bouton 1"
                  />
                  <AdminTextField
                    label="Lien du bouton 2"
                    value={block.bouton2.lien || ""}
                    onChange={(val) => updateBlock(block.id, { bouton2: { ...block.bouton2, lien: val } })}
                    placeholder="Lien du bouton 2"
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
                        {abo.arguments.map((arg, argIdx) => (
                          <div key={arg.id} className="flex flex-col gap-4">
                             {/* Separator Argument - Identical to BlockAdminWrapper Header */}
                             <div className="relative flex items-center justify-between bg-[#FBFCFE] h-[50px] mb-4 z-10">
                                {/* Icônes de déplacement à gauche */}
                                <div className="flex items-center absolute left-0 z-10 bg-[#FBFCFE] py-2 pr-2">
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
                                  >
                                    <div className="relative w-full h-full">
                                      <img src="/icons/move_down.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 hover:opacity-0" />
                                      <img src="/icons/move_down_hover.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 opacity-0 hover:opacity-100" />
                                    </div>
                                  </button>

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
                                  >
                                    <div className="relative w-full h-full">
                                      <img src="/icons/move_up.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 hover:opacity-0" />
                                      <img src="/icons/move_up_hover.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 opacity-0 hover:opacity-100" />
                                    </div>
                                  </button>

                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newArgs = [...abo.arguments];
                                      const newArg = { ...arg, id: uuidv4() };
                                      newArgs.splice(argIdx + 1, 0, newArg);
                                      updateBlock(block.id, { [key]: { ...abo, arguments: newArgs } });
                                    }} 
                                    className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
                                  >
                                    <div className="relative w-full h-full">
                                      <img src="/icons/duplicate.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 hover:opacity-0" />
                                      <img src="/icons/duplicate_hover.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 opacity-0 hover:opacity-100" />
                                    </div>
                                  </button>
                                </div>

                                {/* Titre centré */}
                                <div className="flex-1 flex justify-center items-center relative z-10">
                                  <div className="bg-[#FBFCFE] px-4 text-[14px] text-[#D7D4DC] font-bold">
                                    Argument {argIdx + 1}
                                  </div>
                                </div>

                                {/* Poubelle à droite */}
                                <div className="flex items-center absolute right-0 z-10 bg-[#FBFCFE] py-2 pl-2">
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
                                  >
                                    <div className="relative w-full h-full">
                                      <img src="/icons/delete_grey.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 hover:opacity-0" />
                                      <img src="/icons/delete_hover.svg" alt="" className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 opacity-0 hover:opacity-100" />
                                    </div>
                                  </button>
                                </div>

                                {/* La ligne (séparateur) en dessous */}
                                <div className="absolute top-[25px] left-0 w-full h-[1px] bg-[#ECE9F1] z-0"></div>
                             </div>

                             <RichTextEditor
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
                        ))}
                        
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
