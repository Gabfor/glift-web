interface StoreHeaderProps {
  initialPageContent?: {
    surtitre?: string;
    titre?: string;
    description?: string;
  };
}

export default function StoreHeader({ initialPageContent }: StoreHeaderProps) {
  const surtitre = initialPageContent?.surtitre ?? "";
  const titre = initialPageContent?.titre || "Glift Store";
  const description = initialPageContent?.description ?? "Téléchargez un programme pour l’utiliser directement dans Glift.";

  return (
    <div className="text-center mb-10">
      {surtitre && (
        <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
          {surtitre}
        </div>
      )}
      <h1 
        className="text-[30px] font-bold text-[#2E3271] mb-2"
        dangerouslySetInnerHTML={{ __html: titre }}
      />
      <div 
        className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] [&_p]:mb-0"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}
