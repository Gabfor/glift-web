"use client";

import Link from "next/link";
import Image from "next/image";
import CTAButton from "@/components/CTAButton";
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
      <section className="flex flex-col md:flex-row items-center justify-center gap-6 bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 pb-[100px]">

        {/* Starter */}
        <div className="bg-white border border-[#D7D4DC] rounded-[20px] p-6 pb-[50px] md:p-8 md:pb-[50px] flex flex-col text-center w-full max-w-[466px]">
          <h2 className="uppercase text-[#3A416F] font-bold text-[20px] pt-[20px]">Starter</h2>
          <p className="text-[#2E3271] font-bold text-[40px] leading-tight pt-[15px] pb-[15px]">
            0,00 €<span className="text-[20px] font-semibold">/mois</span>
          </p>
          <p className="text-[#5D6494] text-[16px] font-semibold leading-relaxed pb-[30px]">
            Un abonnement pour ceux qui suivent
            <br className="hidden sm:block" />
            toujours le même entraînement.
          </p>
          <ul className="text-[#5D6494] text-left text-[16px] space-y-3 font-semibold">
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un seul entraînement</li>
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un maximum de 10 exercices</li>
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un tableau de bord personnalisé</li>
            <li className="flex items-center gap-2 text-[#B1BACC] line-through">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} className="grayscale opacity-60" />
              Accès aux programmes du Glift Store
            </li>
            <li className="flex items-center gap-2 text-[#B1BACC] line-through">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} className="grayscale opacity-60" />
              Offres personnalisées dans la Glift Shop
            </li>
          </ul>
          {/* Bouton */}
          <div className="mt-auto pt-[30px]">
            <Link
              href="/inscription?plan=starter"
              className="inline-flex items-center justify-center gap-1 h-[44px] w-full md:w-auto px-[30px] border border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] font-semibold rounded-full transition-all duration-300 group"
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
        <div className="relative bg-white border border-[#D7D4DC] rounded-[20px] p-6 pb-[50px] md:p-8 md:pb-[50px] flex flex-col text-center w-full max-w-[466px] min-h-[640px]">

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
            Un abonnement pour ceux qui suivent
            <br className="hidden sm:block" />
            plusieurs entraînements.
          </p>

          <ul className="text-[#5D6494] text-left text-[16px] space-y-3 font-semibold">
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Un nombre illimité</b> d&apos;entraînements</li>
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} /><b className="text-[#3A416F]">Un nombre illimité</b> d&apos;exercices</li>
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Un tableau de bord personnalisé</li>
            <li className="flex items-center gap-2">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-[#3A416F]">
                  Accès aux programmes du{" "}
                  <Link
                    href="/store"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline hover:underline hover:decoration-solid underline-offset-2"
                  >
                    Glift Store
                  </Link>
                </span>
                <InfoAdornment
                  message="Des programmes gratuits à télécharger et à utiliser directement dans Glift."
                  iconSrc="/icons/info_blue.svg"
                  iconHoverSrc="/icons/info_blue_hover.svg"
                  iconSize={18}
                  gapPx={12}
                  widthPx={220}
                  ariaLabel="Plus d’informations sur le Glift Store"
                />
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-[#3A416F]">
                  Offres personnalisées dans la{" "}
                  <Link
                    href="/shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline hover:underline hover:decoration-solid underline-offset-2"
                  >
                    Glift Shop
                  </Link>
                </span>
                <InfoAdornment
                  message="Une sélection d’offres régulièrement mise à jour correspondant à votre profil."
                  iconSrc="/icons/info_blue.svg"
                  iconHoverSrc="/icons/info_blue_hover.svg"
                  iconSize={18}
                  gapPx={12}
                  widthPx={220}
                  ariaLabel="Plus d’informations sur la Glift Shop"
                />
              </span>
            </li>
            <li className="flex items-center gap-2"><Image src="/icons/inclus.svg" alt="Check" width={30} height={30} />Annulation gratuite à tout moment</li>
          </ul>

          {/* Bouton */}
          <div className="mt-auto pt-[30px] flex flex-col items-center gap-2">
            <CTAButton href="/inscription?plan=premium" className="font-semibold w-full md:w-auto">
              Tester gratuitement
              <Image
                src="/icons/arrow.svg"
                alt="Flèche blanche"
                width={25}
                height={25}
                className="object-contain"
              />
            </CTAButton>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[#5D6494] text-[14px] font-semibold">
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
