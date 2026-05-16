import Modal from "@/components/ui/Modal";

type AddWidgetModalProps = {
  articleType: "Conseil" | "Programme" | "Legal" | "Page";
  onClose: () => void;
  onSelect: (type: string) => void;
};

export default function AddWidgetModal({ articleType, onClose, onSelect }: AddWidgetModalProps) {
  return (
    <Modal
      open
      title="Ajouter un widget"
      onClose={onClose}
      contentClassName="w-[880px] max-w-[95vw] !p-[40px]"
    >
      <div className="grid grid-cols-4 gap-6 mt-8">
        
        {articleType === "Page" ? (
          <>
            {/* 1. Bloc boutons (Page) */}
            <button
              onClick={() => onSelect("boutons")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc boutons
              </span>
              <div className="w-[85%] flex gap-2 justify-center mt-2 px-2">
                <div className="w-full h-[30px] bg-[#F4F5FE] rounded-full" />
                <div className="w-full h-[30px] bg-[#F4F5FE] rounded-full" />
              </div>
            </button>
            
            {/* 2. Bloc image principale (Page) */}
            <button
              onClick={() => onSelect("image-principale")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Image principale
              </span>
              <div className="w-[85%] h-[60px] bg-[#F4F5FE] rounded-[4px] mt-2" />
            </button>
 
            {/* 3. Bloc partenaire (Page) */}
            <button
              onClick={() => onSelect("partenaires")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc partenaires
              </span>
              <div className="w-[85%] grid grid-cols-2 gap-x-2 gap-y-3 mt-2">
                <div className="w-full h-[15px] bg-[#F4F5FE] rounded-[4px]" />
                <div className="w-full h-[15px] bg-[#F4F5FE] rounded-[4px]" />
                <div className="w-full h-[15px] bg-[#F4F5FE] rounded-[4px]" />
                <div className="w-full h-[15px] bg-[#F4F5FE] rounded-[4px]" />
              </div>
            </button>
 
            {/* 4. Bloc titre (Page) */}
            <button
              onClick={() => onSelect("titre")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc titre
              </span>
              <div className="w-[85%] flex flex-col items-center gap-[6px] mt-2">
                <div className="w-[30%] h-[8px] bg-[#F4F5FE] rounded-full" />
                <div className="w-[60%] h-[8px] bg-[#F4F5FE] rounded-full" />
                <div className="w-[90%] h-[8px] bg-[#F4F5FE] rounded-full" />
              </div>
            </button>
 
            {/* 5. Bloc texte + image (Page) */}
            <button
              onClick={() => onSelect("texte-image")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc texte + image
              </span>
              <div className="w-[85%] flex gap-[15px] items-center mt-2 px-2">
                <div className="flex-1 flex flex-col gap-[6px]">
                  <div className="w-[80%] h-[8px] bg-[#F4F5FE] rounded-full" />
                  <div className="w-full h-[8px] bg-[#F4F5FE] rounded-full" />
                  <div className="w-full h-[8px] bg-[#F4F5FE] rounded-full" />
                </div>
                <div className="w-[45px] h-[45px] bg-[#F4F5FE] rounded-[4px] shrink-0" />
              </div>
            </button>
 
            {/* 6. Bloc card (Page) */}
            <button
              onClick={() => onSelect("card")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc card
              </span>
              <div className="w-[85%] flex gap-2 justify-center mt-2 px-2">
                <div className="w-full h-[35px] bg-[#F4F5FE] rounded-[4px]" />
                <div className="w-full h-[35px] bg-[#F4F5FE] rounded-[4px]" />
              </div>
            </button>
 
            {/* 7. Bloc newsletter (Page) */}
            <button
              onClick={() => onSelect("newsletter")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc newsletter
              </span>
              <div className="w-[85%] flex flex-col gap-2 justify-center mt-2 px-2 items-center">
                <div className="w-full h-[40px] bg-[#F4F5FE] rounded-[4px]" />
              </div>
            </button>
 
            {/* 8. Bloc tarifs (Page) */}
            <button
              onClick={() => onSelect("tarifs")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc tarifs
              </span>
              <div className="w-[85%] flex gap-2 justify-center mt-4 px-2 items-end">
                <div className="w-[45%] h-[55px] bg-[#F4F5FE] rounded-[4px]" />
                <div className="w-[45%] h-[75px] bg-[#F4F5FE] rounded-[4px]" />
              </div>
            </button>
          </>
        ) : (
          <>
            {/* 1. Bloc titre + texte (Commun hors Page) */}
            <button
              onClick={() => onSelect("titre-texte")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc titre + texte
              </span>
              <div className="w-[85%] flex flex-col gap-[6px]">
                <div className="w-[40%] h-[6px] bg-[#F4F5FE] rounded-full mb-1" />
                <div className="w-full h-[6px] bg-[#F4F5FE] rounded-full" />
                <div className="w-full h-[6px] bg-[#F4F5FE] rounded-full" />
                <div className="w-[85%] h-[6px] bg-[#F4F5FE] rounded-full" />
              </div>
            </button>

            {/* 2. Bloc texte (Commun hors Page) */}
            <button
              onClick={() => onSelect("texte")}
              className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
            >
              <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                Bloc texte
              </span>
              <div className="w-[85%] flex flex-col gap-[8px]">
                <div className="w-full h-[8px] bg-[#F4F5FE] rounded-full" />
                <div className="w-full h-[8px] bg-[#F4F5FE] rounded-full" />
                <div className="w-[85%] h-[8px] bg-[#F4F5FE] rounded-full" />
              </div>
            </button>

            {articleType === "Legal" ? (
              <>
                {/* 3. Bloc texte 1.1 (Legal) */}
                <button
                  onClick={() => onSelect("texte-1-1")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc texte 1.1
                  </span>
                  <div className="w-[85%] flex flex-col gap-[6px]">
                    <div className="w-full h-[8px] bg-[#F4F5FE] rounded-full mb-1" />
                    <div className="w-[85%] h-[6px] bg-[#F4F5FE] rounded-full" />
                    <div className="w-[85%] h-[6px] bg-[#F4F5FE] rounded-full" />
                    <div className="w-[60%] h-[6px] bg-[#F4F5FE] rounded-full" />
                  </div>
                </button>

                {/* Vides 4, 5, 6 (Legal) */}
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
              </>
            ) : articleType === "Conseil" ? (
              <>
                {/* 3. Bloc source (Conseil) */}
                <button
                  onClick={() => onSelect("source")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc source
                  </span>
                  <div className="w-[85%]">
                    <div className="w-full h-[35px] bg-[#F4F5FE] rounded-[4px]" />
                  </div>
                </button>

                {/* Vides 4, 5, 6 (Conseil) */}
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
                <div className="flex items-center justify-center w-full h-[172px] rounded-[20px] border border-dashed border-[#D7D4DC]">
                  <span className="text-[#3A416F] font-semibold text-[15px]">Vide</span>
                </div>
              </>
            ) : (
              <>
                {/* 3. Bloc programme (Programme) */}
                <button
                  onClick={() => onSelect("programme")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc programme
                  </span>
                  <div className="w-[85%] flex flex-col gap-[6px]">
                    <div className="w-[35px] h-[6px] bg-[#F4F5FE] rounded-full mb-1" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-full flex justify-between gap-[4px]">
                        <div className="w-[20%] h-[8px] bg-[#F4F5FE] rounded-sm" />
                        <div className="w-[45%] h-[8px] bg-[#F4F5FE] rounded-sm" />
                        <div className="w-[30%] h-[8px] bg-[#F4F5FE] rounded-sm" />
                      </div>
                    ))}
                  </div>
                </button>

                {/* 4. Bloc téléchargement (Programme) */}
                <button
                  onClick={() => onSelect("telechargement")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc téléchargement
                  </span>
                  <div className="w-[85%] flex justify-center items-center h-[40px]">
                    <div className="w-[40px] h-[12px] bg-[#F4F5FE] rounded-full" />
                  </div>
                </button>

                {/* 5. Bloc séance (Programme) */}
                <button
                  onClick={() => onSelect("seance")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc séance
                  </span>
                  <div className="w-[85%] h-[40px] border border-[#F4F5FE] rounded-[4px] p-1 flex">
                    <div className="w-full h-[6px] bg-[#F4F5FE] rounded-sm" />
                  </div>
                </button>

                {/* 6. Bloc source (Programme) */}
                <button
                  onClick={() => onSelect("source")}
                  className="group w-full h-[172px] rounded-[20px] bg-white overflow-hidden flex flex-col border border-[#D7D4DC] hover:shadow-glift-hover transition-all duration-300 items-center justify-start pt-[30px] transform hover:-translate-y-1"
                >
                  <span className="text-[#5D6494] font-semibold text-[15px] mb-4 group-hover:text-[#3A416F] transition-colors duration-200">
                    Bloc source
                  </span>
                  <div className="w-[85%]">
                    <div className="w-full h-[35px] bg-[#F4F5FE] rounded-[4px]" />
                  </div>
                </button>
              </>
            )}
          </>
        )}

      </div>
    </Modal>
  );
}
