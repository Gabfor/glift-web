interface ShopHeaderProps {
  initialPageContent?: {
    surtitre?: string;
    titre?: string;
    description?: string;
  };
}

export default function ShopHeader({ initialPageContent }: ShopHeaderProps) {
  const surtitre = initialPageContent?.surtitre ?? "";
  const titre = initialPageContent?.titre || "Glift Shop";
  const description = initialPageContent?.description ?? "Découvrez une sélection d’offres régulièrement mise à jour.<br/>Pour en profiter, cliquez sur le bouton « En profiter » et laissez-vous guider.";

  return (
    <div className="text-center">
      {surtitre && (
        <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
          {surtitre}
        </div>
      )}
      <h1 
        className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: titre }}
      />
      <div 
        className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[700px] mx-auto leading-relaxed mb-8 [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}
