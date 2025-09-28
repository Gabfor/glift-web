"use client";

import Link from "next/link";
import Image from "next/image";
import CTAButton from "@/components/CTAButton";

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
      <section className="flex flex-col md:flex-row items-center justify-center gap-6 bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 pb-[100px] grid-cols-1 md:grid-cols-2">
        
        {/* Starter */}
        <div className="bg-white rounded-[12px] p-8 flex flex-col text-center shadow-glift hover:shadow-glift-hover transition-shadow duration-300 w-[466px] h-[577px]">
          <h2 className="uppercase text-[#3A416F] font-bold text-[20px] pt-[20px]">Starter</h2>
          <p className="text-[#2E3271] font-bold text-[40px] leading-tight pt-[15px] pb-[15px]">
            0,00 €<span className="text-[20px] font-semibold">/mois</span>
          </p>
          <p className="text-[#5D6494] text-[16px] font-semibold leading-relaxed pb-[30px]">
            Un abonnement pour ceux qui suivent<br/>
            toujours le même entraînement.
          </p>
          <ul className="text-[#5D6494] text-left text-[16px] space-y-3 font-semibold">
          <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un seul entraînement</li>
          <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un maximum de 10 exercices</li>
          <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un tableau de bord personnalisé</li>
          <li className="flex items-center gap-1 text-[#B1BACC] line-through"><Image src="/icons/exclus.svg" alt="Cross" width={30} height={30} />Accès aux programmes du Glift Store</li>
          <li className="flex items-center gap-1 text-[#B1BACC] line-through"><Image src="/icons/exclus.svg" alt="Cross" width={30} height={30} />Accès aux offres Premium de la Glift Shop</li>
          </ul>
          {/* Bouton */}
          <div className="mt-10">
          <Link
            href="/inscription?plan=starter"
            className="inline-flex items-center justify-center gap-1 h-[44px] w-[243px] border-2 border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] font-semibold rounded-full transition-all duration-300 group"
          >
            Choisir cet abonnement
            <div className="relative w-[25px] h-[25px]">
              <Image
                src="/icons/arrow_blue.svg"
                alt="Flèche normale"
                fill
                className="object-contain transition-opacity group-hover:opacity-0"
              />
              <Image
                src="/icons/arrow.svg"
                alt="Flèche blanche"
                fill
                className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
              />
            </div>
          </Link>
          </div>
        </div>

        {/* Premium */}
{/* Premium */}
<div className="relative bg-white rounded-[12px] p-8 flex flex-col text-center shadow-glift hover:shadow-glift-hover transition-shadow duration-300 w-[466px] h-[640px]">

  {/* Badge en diagonale */}
  <div className="absolute top-0 right-0 overflow-hidden w-[180px] h-[180px]">
    <div className="absolute bg-[#7069FA] text-white text-[14px] font-bold uppercase rotate-45 w-[200px] text-center py-1 right-[-40px] top-[45px] shadow-md">
      Plus populaire
    </div>
  </div>

  <h2 className="uppercase text-[#3A416F] font-bold text-[20px] pt-[20px]">Premium</h2>
  <p className="text-[#2E3271] font-bold text-[40px] leading-tight pt-[15px] pb-[15px]">
    2,49 €<span className="text-[20px] font-semibold">/mois</span>
  </p>
  <p className="text-[#5D6494] text-[16px] font-semibold leading-relaxed pb-[30px]">
    Un abonnement pour ceux qui suivent<br/>
    plusieurs entraînements.
  </p>

  <ul className="text-[#5D6494] text-left text-[16px] space-y-3 font-semibold">
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Un nombre illimité</b> d&apos;entraînements</li>
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Un nombre illimité</b> d&apos;exercices</li>
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un tableau de bord personnalisé</li>
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Accès aux programmes du <span className="relative inline-block"><Link href="/store" className="underline decoration-dotted hover:decoration-solid underline-offset-4 peer">Glift Store</Link><span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-[230px] px-3 py-2 text-white text-[14px] font-medium bg-[#2E3142] rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 pointer-events-none">Des programmes gratuits à télécharger et à utiliser directement dans Glift.<span className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#2E3142]"></span></span></span></b></li>
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Accès aux offres Premium de la <span className="relative inline-block"><Link href="/shop" className="underline decoration-dotted hover:decoration-solid underline-offset-4 peer">Glift Shop</Link><span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-[230px] px-3 py-2 text-white text-[14px] font-medium bg-[#2E3142] rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 pointer-events-none">Une sélection d’offres régulièrement mise à jour correspondant à votre profil.<span className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-[#2E3142]"></span></span></span></b></li>
    <li className="flex items-center gap-1"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Annulation gratuite à tout moment</li>
  </ul>

  {/* Bouton */}
  <div className="mt-10 flex flex-col items-center">
    <CTAButton href="/inscription?plan=premium" className="font-semibold">
      <span className="inline-flex items-center gap-1">
        Tester gratuitement
        <div className="relative w-[25px] h-[25px]">
          <Image
            src="/icons/arrow.svg"
            alt="Flèche blanche"
            fill
            className="object-contain"
          />
        </div>
      </span>
    </CTAButton>
    <div className="flex items-center justify-center gap-2 text-[#5D6494] text-[14px] font-semibold mt-2">
      <span className="relative flex items-center justify-center w-2 h-2">
        <span className="absolute w-full h-full rounded-full bg-[#00D591] opacity-50 animate-ping"></span>
        <span className="relative w-2 h-2 rounded-full bg-[#00D591]"></span>
      </span>
      <span>30 jours pour tester</span>
    </div>
  </div>
</div>

      </section>
    </>
  );
}
