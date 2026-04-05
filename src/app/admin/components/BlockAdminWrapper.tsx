import Image from "next/image";
import { TrashHoverIcon, TrashIcon } from "@/components/icons/TrashIcons";
import Tooltip from "@/components/Tooltip";

type Props = {
  title: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
};

export default function BlockAdminWrapper({ title, onMoveUp, onMoveDown, onDelete, onDuplicate, isFirst, isLast, children }: Props) {
  return (
    <div className={`flex flex-col relative w-full ${isLast ? 'mb-0' : 'mb-[30px]'}`}>
      {/* HEADER WIDGET */}
      <div className="relative flex items-center justify-between bg-[#FBFCFE] h-[50px] mb-[12px] z-10">
        
        {/* Conteneur du nom centré avec z-index pour passer au-dessus de la ligne */}
        <div className="flex-1 flex justify-center items-center relative z-10">
          <div className="group flex items-center text-[16px] text-[#D7D4DC] font-semibold transition bg-[#FBFCFE] p-2 hover:text-[#C2BFC6]">
            <span>{title}</span>
          </div>
        </div>

        {/* Icônes de déplacement à gauche avec fond pour masquer la ligne */}
        <div className="flex items-center absolute left-0 z-10 bg-[#FBFCFE] p-2">
          
          <Tooltip content="Descendre">
            <button 
              type="button"
              onClick={onMoveDown} 
              disabled={isLast} 
              className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${isLast ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Descendre"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/icons/move_down.svg"
                  alt="Descendre"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                />
                <Image
                  src="/icons/move_down_hover.svg"
                  alt="Descendre"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                />
              </div>
            </button>
          </Tooltip>

          <Tooltip content="Monter">
            <button 
              type="button"
              onClick={onMoveUp} 
              disabled={isFirst} 
              className={`relative w-[25px] h-[25px] transition duration-300 ease-in-out ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Monter"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/icons/move_up.svg"
                  alt="Monter"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                />
                <Image
                  src="/icons/move_up_hover.svg"
                  alt="Monter"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                />
              </div>
            </button>
          </Tooltip>

          <Tooltip content="Dupliquer">
            <button 
              type="button"
              onClick={onDuplicate} 
              className="relative w-[25px] h-[25px] transition duration-300 ease-in-out"
              aria-label="Dupliquer"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/icons/duplicate.svg"
                  alt="Dupliquer"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0"
                />
                <Image
                  src="/icons/duplicate_hover.svg"
                  alt="Dupliquer"
                  fill
                  sizes="100%"
                  className="absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100"
                />
              </div>
            </button>
          </Tooltip>

        </div>

        {/* Poubelle à droite avec fond pour masquer la ligne */}
        <div className="flex items-center absolute right-0 z-10 bg-[#FBFCFE] py-2 pl-2">
          <Tooltip content="Supprimer">
            <button 
              type="button"
              onClick={onDelete} 
              className="relative w-[20px] h-[20px] transition duration-300 ease-in-out"
              aria-label="Supprimer"
            >
              <div className="relative w-full h-full">
                <TrashIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0" />
                <TrashHoverIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100" />
              </div>
            </button>
          </Tooltip>
        </div>

        {/* La ligne (séparateur) en dessous de tout */}
        <div className="absolute top-[25px] left-0 w-full h-[1px] bg-[#ECE9F1] z-0"></div>
      </div>

      {/* CONTENT WIDGET */}
      <div className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
