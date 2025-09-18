"use client";

import Link from "next/link";
import Image from "next/image";
import InfoAdornment from "@/components/InfoAdornment";

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
        <div className="relative bg-white rounded-[12px] p-8 flex flex-col text-center shadow-glift hover:shadow-glift-hover transition-shadow duration-300 w-[466px] h-[640px]">
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
            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <b className="text-[#3A416F]">Un nombre illimité</b> d'entraînements
            </li>

            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <b className="text-[#3A416F]">Un nombre illimité</b> d'exercices
            </li>

            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              Un tableau de bord personnalisé
            </li>

            {/* Glift Store (sans lien, + icône info bleue avec tooltip) */}
            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <span className="font-bold text-[#3A416F]">Accès aux programmes du</span>{' '}
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-[#3A416F]">Glift Store</span>
                <InfoAdornment
                  message="Des programmes gratuits à télécharger et à utiliser directement dans Glift."
                  iconSrc="/icons/info_blue.svg"
                  iconHoverSrc="/icons/info_blue_hover.svg"
                  iconSize={18}
                  gapPx={12}
                  widthPx={220}
                />
              </span>
            </li>

            {/* Glift Shop (sans lien, + icône info bleue avec tooltip) */}
            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <span className="font-bold text-[#3A416F]">Accès aux offres Premium de la</span>{' '}
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-[#3A416F]">Glift Shop</span>
                <InfoAdornment
                  message="Une sélection d’offres régulièrement mise à jour correspondant à votre profil."
                  iconSrc="/icons/info_blue.svg"
                  iconHoverSrc="/icons/info_blue_hover.svg"
                  iconSize={18}
                  gapPx={12}
                  widthPx={220}
                />
              </span>
            </li>

            <li className="flex items-center gap-1">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              Annulation gratuite à tout moment
            </li>
          </ul>

          <div className="mt-10 flex flex-col items-center">
            <Link
              href="/inscription?plan=premium"
              className="inline-flex items-center justify-center gap-1 w-[214px] h-[44px] bg-[#7069FA] hover:bg-[#6660E4] text-white font-semibold rounded-full transition-all duration-300 group"
            >
              Tester gratuitement
              <div className="relative w-[25px] h-[25px]">
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
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
