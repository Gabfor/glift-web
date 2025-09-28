import { useState } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";

interface DownloadAuthModalProps {
  show: boolean;
  onClose: () => void;
}

export default function DownloadAuthModal({ show, onClose }: DownloadAuthModalProps) {
  const [hoveredClose, setHoveredClose] = useState(false);
  const router = useRouter();

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#2E3142] bg-opacity-60 z-50 flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-[5px] w-[564px] shadow-lg">
        <button
          onClick={onClose}
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

        <h2 className="text-xl text-[#3A416F] text-[22px] font-bold mb-6 text-center">Téléchargement impossible</h2>

        <div className="bg-[#F4F5FE] border-l-[3px] border-[#A1A5FD] pl-4 py-3 mb-6 text-[#7069FA] text-[12px] font-bold text-left rounded-tr-[5px] rounded-br-[5px]">
          Attention<br />
          <span className="font-semibold text-[12px] text-[#A1A5FD]">
            Le téléchargement de ce programme d’entraînements est impossible car vous devez avoir préalablement créé un compte.
          </span>
        </div>

        <p className="text-[14px] text-[#5D6494] font-semibold mb-6 text-left leading-normal">
          En cliquant sur <span className="text-[#3A416F]">« Créer un compte »</span> vous serez redirigé vers une page où vous pourrez créer votre compte en choisissant la formule d’abonnement qui convient à votre besoin.
          <br /><br />
          En cliquant sur <span className="text-[#3A416F]">« Annuler »</span> vous resterez sur la page du Glift Store et vous pourrez continuer votre navigation.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-[#5D6494] hover:text-[#3A416F]"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/tarifs");
            }}
            className="inline-flex items-center justify-center gap-1 w-[166px] h-[44px] bg-[#7069FA] hover:bg-[#5E57D8] text-white font-semibold rounded-full transition-all duration-300"
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
