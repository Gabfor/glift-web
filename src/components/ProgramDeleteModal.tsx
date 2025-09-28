import { useState } from "react";
import ReactDOM from "react-dom";

interface ProgramDeleteModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ProgramDeleteModal({ show, onCancel, onConfirm }: ProgramDeleteModalProps) {
  const [hoveredClose, setHoveredClose] = useState(false);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#2E3142] bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-[5px] w-[564px] shadow-lg">
        {/* Bouton de fermeture */}
        <button
          onClick={onCancel}
          onMouseEnter={() => setHoveredClose(true)}
          onMouseLeave={() => setHoveredClose(false)}
          className="absolute top-4 right-4 w-6 h-6"
        >
          <img
            src={hoveredClose ? "/icons/close_hover.svg" : "/icons/close.svg"}
            alt="Fermer"
            className="w-full h-full"
          />
        </button>

        <h2 className="text-xl text-[#3A416F] text-[22px] font-bold mb-6 text-center">Supprimer un programme</h2>

        {/* Alerte avec bordure gauche */}
        <div className="bg-[#FFE3E3] border-l-[3px] border-[#EF4F4E] pl-4 py-3 mb-6 text-[#BA2524] text-[12px] font-bold text-left rounded-tr-[5px] rounded-br-[5px]">
          Attention<br />
          <span className="font-semibold text-[12px] text-[#EF4F4E]">
            La suppression d&apos;un programme d&apos;entraînements est définitive.
          </span>
        </div>

        {/* Texte explicatif */}
        <p className="text-[14px] text-[#5D6494] font-semibold mb-4 text-left leading-normal">
          En cliquant sur <span className="text-[#3A416F]">« Confirmer »</span> ce programme d’entraînements ainsi que l’ensemble des exercices encore à l’intérieur seront <span className="text-[#3A416F]">définitivement supprimés</span> de la plateforme et toute progression sera perdue.
        </p>
        <p className="text-[14px] text-[#5D6494] font-semibold mb-6 text-left leading-normal">
          Si ce n’est pas ce que vous souhaitez faire, vous trouverez peut-être la solution à votre besoin dans la partie <a href="#" className="text-[#3A416F] underline">Aide</a> du site.
        </p>

        {/* Boutons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1 w-[116px] h-[44px] bg-[#EF4F4E] hover:bg-[#BA2524] text-white font-semibold rounded-full transition-all duration-300 group"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
