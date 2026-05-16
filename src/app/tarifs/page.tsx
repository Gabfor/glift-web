import PricingTable from "@/components/PricingTable";

export default function TarifsPage() {
  return (
    <>
      {/* Section header */}
      <section className="bg-[#FBFCFE] text-center px-4 pt-[140px] pb-[60px] max-w-[1152px] mx-auto">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">Nos tarifs</h1>
        <p className="text-[#5D6494] font-semibold text-[16px]">
          Choisissez la formule d’abonnement qui vous convient.
        </p>
      </section>

      {/* Section abonnements */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-6 bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 pb-[100px]">
        <PricingTable 
          abonnement1={{
            nom: "Starter",
            prix: "0,00",
            description: "Un abonnement pour ceux qui suivent toujours le même entraînement.",
            boutonType: "secondaire",
            boutonTexte: "Choisir cet abonnement",
            boutonLien: "/inscription?plan=starter",
            arguments: [
              { id: "a1", texte: "Un seul entraînement", active: true },
              { id: "a2", texte: "Un maximum de 10 exercices", active: true },
              { id: "a3", texte: "Un tableau de bord personnalisé", active: true },
              { id: "a4", texte: "Accès aux programmes du Glift Store", active: false },
              { id: "a5", texte: "Offres personnalisées dans la Glift Shop", active: false },
            ]
          }}
          abonnement2={{
            nom: "Premium",
            prix: "2,49",
            description: "Un abonnement pour ceux qui suivent plusieurs entraînements.",
            boutonType: "primaire",
            boutonTexte: "Tester gratuitement",
            boutonLien: "/inscription?plan=premium",
            badge: "Plus populaire",
            arguments: [
              { id: "b1", texte: "Un nombre illimité d'entraînements", active: true },
              { id: "b2", texte: "Un nombre illimité d'exercices", active: true },
              { id: "b3", texte: "Un tableau de bord personnalisé", active: true },
              { id: "b4", texte: "Accès aux programmes du Glift Store", active: true },
              { id: "b5", texte: "Offres personnalisées dans la Glift Shop", active: true },
              { id: "b6", texte: "Annulation gratuite à tout moment", active: true },
            ]
          }}
        />
      </section>
    </>
  );
}
