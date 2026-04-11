import React from "react";
import BlockAdminWrapper from "./BlockAdminWrapper";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { ContentBlock, SeanceRow } from "../create-blog-article/blogArticleForm";

type Props = {
  blocks: ContentBlock[];
  onChangeBlocks: (blocks: ContentBlock[]) => void;
  currentNiveau?: string;
};

export default function WidgetsRenderer({ blocks, onChangeBlocks, currentNiveau }: Props) {
  const getNiveauIcon = (niveau?: string) => {
    if (!niveau) return "/icons/admin_niveau_1.svg";
    const n = niveau.toLowerCase();
    if (n.includes("débutant") || n.includes("tous")) return "/icons/admin_niveau_1.svg";
    if (n.includes("intermédiaire")) return "/icons/admin_niveau_2.svg";
    if (n.includes("confirmé")) return "/icons/admin_niveau_3.svg";
    return "/icons/admin_niveau_1.svg";
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

  const getBlockTitle = (type: string) => {
    switch (type) {
      case "titre-texte": return "Bloc titre + texte";
      case "texte": return "Bloc texte";
      case "source": return "Bloc source";
      case "programme": return "Bloc programme";
      case "telechargement": return "Bloc téléchargement";
      case "seance": return "Bloc séance";
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
                      value={block.titre} 
                      onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Id</label>
                    <input 
                      type="text"
                      placeholder="Id"
                      value={block.ancreId}
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
                    value={block.titre} 
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL du fichier</label>
                    <input 
                      type="text" 
                      placeholder="Lien PDF ou autre" 
                      value={block.url} 
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte du bouton</label>
                    <input 
                      type="text" 
                      placeholder="Télécharger" 
                      value={block.nom_bouton} 
                      onChange={(e) => updateBlock(block.id, { nom_bouton: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Texte descriptif</label>
                  <RichTextEditor 
                    value={block.texte} 
                    onChange={(html) => updateBlock(block.id, { texte: html })}
                  />
                </div>
              </>
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
                    <img src="/icons/admin_sexe.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Sexe</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src="/icons/admin_intensite.svg" alt="" className="w-[28px] h-[28px]" />
                    <span className="text-[#D7D4DC] text-[14px] font-semibold">Intensité</span>
                  </div>
                </div>
              </div>
            )}

            {block.type === "seance" && (
              <>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Titre de la séance</label>
                  <input 
                    type="text" 
                    value={block.titre} 
                    onChange={(e) => updateBlock(block.id, { titre: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col w-full border border-[#D7D4DC] rounded-[5px] overflow-hidden">
                   <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] bg-[#F4F5FE] px-4 py-2 border-b border-[#D7D4DC]">
                     <span className="text-[12px] font-bold text-[#3A416F] uppercase">Jour</span>
                     <span className="text-[12px] font-bold text-[#3A416F] uppercase">Exercice</span>
                     <span className="text-[12px] font-bold text-[#3A416F] uppercase">Séries</span>
                     <span className="text-[12px] font-bold text-[#3A416F] uppercase">Rép.</span>
                     <span className="text-[12px] font-bold text-[#3A416F] uppercase">Repos</span>
                     {/* Pas de place pour le trash ici sans casser le tableau, posons le en absolue au survol de la Ligne, ou via une grid w/ minmax */}
                   </div>
                   {block.table_rows.map((row, rID) => (
                     <div key={rID} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_30px] border-b border-[#E9E8EC] last:border-none p-2 gap-2 items-center">
                        <input className="text-[14px] w-full bg-transparent outline-none font-semibold text-[#5D6494] px-2" value={row.jour} onChange={(e) => {
                          const newRows = [...block.table_rows]; newRows[rID].jour = e.target.value; updateBlock(block.id, { table_rows: newRows });
                        }} placeholder="1" />
                        <input className="text-[14px] w-full bg-transparent outline-none font-semibold text-[#5D6494] px-2" value={row.exercice} onChange={(e) => {
                          const newRows = [...block.table_rows]; newRows[rID].exercice = e.target.value; updateBlock(block.id, { table_rows: newRows });
                        }} placeholder="Dev couché" />
                        <input className="text-[14px] w-full bg-transparent outline-none font-semibold text-[#5D6494] px-2" value={row.series} onChange={(e) => {
                          const newRows = [...block.table_rows]; newRows[rID].series = e.target.value; updateBlock(block.id, { table_rows: newRows });
                        }} placeholder="4" />
                        <input className="text-[14px] w-full bg-transparent outline-none font-semibold text-[#5D6494] px-2" value={row.reps} onChange={(e) => {
                          const newRows = [...block.table_rows]; newRows[rID].reps = e.target.value; updateBlock(block.id, { table_rows: newRows });
                        }} placeholder="8-12" />
                        <input className="text-[14px] w-full bg-transparent outline-none font-semibold text-[#5D6494] px-2" value={row.repos} onChange={(e) => {
                          const newRows = [...block.table_rows]; newRows[rID].repos = e.target.value; updateBlock(block.id, { table_rows: newRows });
                        }} placeholder="1'30" />
                        <button onClick={() => {
                           const newRows = block.table_rows.filter((_, idx) => idx !== rID);
                           updateBlock(block.id, { table_rows: newRows });
                        }} className="text-red-500 font-bold hover:text-red-700 flex justify-center items-center">X</button>
                     </div>
                   ))}
                   <div className="bg-white p-2 flex justify-center">
                      <button onClick={() => {
                        const newRow: SeanceRow = { jour: "", exercice: "", series: "", reps: "", repos: "" };
                        updateBlock(block.id, { table_rows: [...block.table_rows, newRow] });
                      }} className="text-[#3A416F] font-semibold text-[14px] underline hover:text-[#2E3271]">
                        + Ajouter une ligne
                      </button>
                   </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Conseils de séance / Texte</label>
                  <RichTextEditor 
                    value={block.texte} 
                    onChange={(html) => updateBlock(block.id, { texte: html })}
                  />
                </div>
              </>
            )}

          </BlockAdminWrapper>
        );
      })}
    </div>
  );
}
