"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";

export default function HeroConcept() {
  return (
    <>
      {/* Section principale */}
      <section className="bg-[#FBFCFE] text-center px-4 pt-[140px] pb-[30px] max-w-[1152px] mx-auto">
        <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
          Outil de suivi en musculation
        </p>

        <h1 className="text-[24px] sm:text-[32px] md:text-[30px] font-bold leading-snug text-[#3A416F] mb-[10px]">
          Gérer et suivre facilement<br />
          ses programmes de musculation
        </h1>

        <p className="text-[15px] sm:text-[16px] text-[#5D6494] font-semibold b-8 leading-relaxed max-w-[700px] mx-auto mb-[20px]">
          Digitalisez vos programmes de musculation, analysez vos performances
          <br className="hidden sm:block" />
          et progressez efficacement séance après séance.
        </p>

        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <Link
            href="/inscription"
            className="bg-[#2E3271] hover:bg-[#1f224e] text-white text-[16px] font-semibold px-5 h-[44px] rounded-full flex items-center justify-center gap-2 transition"
          >
            Tester gratuitement
            <Image
              src="/icons/arrow.svg"
              className="ml-[-5px]"
              alt="Flèche"
              width={25}
              height={25}
            />
          </Link>
          <Link
            href="#methode-glift"
            className="border-2 border-[#2E3271] text-[#2E3271] hover:text-white hover:bg-[#2E3271] text-[16px] font-semibold px-5 h-[44px] rounded-full flex items-center gap-2 transition"
          >
            En savoir plus
          </Link>
        </div>

        <div className="flex justify-center items-center gap-2 text-[14px] text-[#5D6494] font-semibold">
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute w-full h-full rounded-full bg-[#00D591] opacity-50 animate-ping"></span>
            <span className="relative w-2 h-2 rounded-full bg-[#00D591]"></span>
          </span>
          30 jours pour tester gratuitement
        </div>
      </section>
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 pt-[30px] text-center relative">
  {/* Mockups */}
  <div className="flex justify-center">
    <Image
      src="/images/mockups-app-site.png"
      alt="Appareils"
      width={800}
      height={400}
      className="w-full max-w-[700px]"
    />
  </div>
{/* Flèche + texte gauche */}
<div className="absolute left-[120px] top-[40%] -translate-y-1/2 hidden md:block">
    <p className="text-[#202121] text-[14px] font-bold rotate-[-10deg] origin-left w-[180px]">
      Une app pour<br />
      suivre ses entraînements<br />
      efficacement
    </p>
    <Image
    src="/images/arrow-left.png"
    alt="Flèche"
    width={114}
    height={114}
    className="ml-[60px] mt-[-35px]"
  />
  </div>

  {/* Flèche + texte droite */}
  <div className="absolute right-[150px] top-[25%] -translate-y-1/2 hidden md:block">
    <p className="text-[#202121] text-[14px] font-bold rotate-[8deg] origin-right w-[180px] ml-auto">
      Un site pour<br />
      créer ses entraînements<br />
      facilement
    </p>
    <Image
    src="/images/arrow-right.png"
    alt="Flèche"
    width={114}
    height={114}
    className="ml-[-5px] mt-[-37px]"
  />
</div>
      </section>
      {/* Section outils */}
      <section className="bg-[#FBFCFE] text-center px-4 max-w-[1152px] pt-[80px] mx-auto" id="methode-glift">
        <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
          La méthode Glift
        </p>
        <h2 className="text-[28px] font-bold leading-snug text-[#3A416F]">
          Comment fonctionne Glift ?
        </h2>
      </section>
      {/* Nouvelle section : Outil de création */}
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Texte à gauche */}
        <AnimatedSection>
        <div className="max-w-[520px] flex flex-col">
          <p className="text-[#7069FA] text-xs font-bold uppercase tracking-wide mb-[10px]">
            Outil de création
          </p>
          <h2 className="text-[24px] sm:text-[24px] font-bold text-[#2E3271] leading-tight mb-[10px]">
            Construisez facilement<br />
            vos programmes de musculation<br />
            selon vos objectifs
          </h2>
          <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold mb-[20px]">
            Notre plateforme a été pensée pour vous permettre de créer vos
            programmes de musculation rapidement et en toute simplicité
            tranquillement chez vous.
          </p>

          <Link
            href="/inscription"
            className="w-[214px] h-[44px] bg-[#2E3271] hover:bg-[#1f224e] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition"
          >
            Tester gratuitement
            <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" width={25} height={25} />
          </Link>
        </div>
        </AnimatedSection>
        {/* Image à droite */}
        <AnimatedSection>
        <div className="flex-shrink-0">
          <Image
            src="/images/illustration-creation.png"
            alt="Création programme"
            width={466}
            height={350}
            priority
          />
        </div>
        </AnimatedSection>
      </section>
      {/* Nouvelle section : Outil de suivi */}
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10">
  {/* Image à gauche */}
  <AnimatedSection>
  <div className="flex-shrink-0 order-1 md:order-none">
    <Image
      src="/images/illustration-suivi.png"
      alt="Création programme"
      width={466}
      height={350}
      priority
    />
  </div>
  </AnimatedSection>
  {/* Texte à droite */}
  <AnimatedSection>
  <div className="max-w-[520px] flex flex-col">
    <p className="text-[#7069FA] text-xs font-bold uppercase tracking-wide mb-[10px]">
      Outil de suivi
    </p>
    <h2 className="text-[24px] sm:text-[24px] font-bold text-[#2E3271] leading-tight mb-[10px]">
    Entraînez-vous efficacement<br />
    et tirer profits de chaque minute<br />
    d’entraînement
    </h2>
    <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold mb-[20px]">
    Retrouvez vos entraînements sur l’app Glift où nous avons créé une expérience simple et intuitive pour vous permettre d’optimiser votre temps d’entraînement.
    </p>

    <Link
      href="/inscription"
      className="w-[214px] h-[44px] bg-[#2E3271] hover:bg-[#1f224e] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition"
    >
      Tester gratuitement
      <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" width={25} height={25} />
    </Link>
  </div>
  </AnimatedSection>
      </section>
      {/* Nouvelle section : Outil de notation */}
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10">
        {/* Texte à gauche */}
        <AnimatedSection>
        <div className="max-w-[520px] flex flex-col">
          <p className="text-[#7069FA] text-xs font-bold uppercase tracking-wide mb-[10px]">
            Outil de notation
          </p>
          <h2 className="text-[24px] sm:text-[24px] font-bold text-[#2E3271] leading-tight mb-[10px]">
          Notez facilement vos<br />
          performances et assurez-vous<br />
          de toujours progresser
          </h2>
          <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold mb-[20px]">
          Notez vos performances mais aussi vos sensations. Ajustez vos entraînements en temps réel ou plus tard afin de toujours être dans votre zone de progression.
          </p>

          <Link
            href="/inscription"
            className="w-[214px] h-[44px] bg-[#2E3271] hover:bg-[#1f224e] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition"
          >
            Tester gratuitement
            <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" width={25} height={25} />
          </Link>
        </div>
        </AnimatedSection>
        {/* Image à droite */}
        <AnimatedSection>
        <div className="flex-shrink-0">
          <Image
            src="/images/illustration-notation.png"
            alt="Création programme"
            width={466}
            height={350}
            priority
          />
        </div>
        </AnimatedSection>
      </section>
      {/* Nouvelle section : Outil de visualisation */}
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10">
  {/* Image à gauche */}
  <AnimatedSection>
  <div className="flex-shrink-0 order-1 md:order-none">
    <Image
      src="/images/illustration-visualisation.png"
      alt="Création programme"
      width={466}
      height={350}
      priority
    />
  </div>
  </AnimatedSection>
  {/* Texte à droite */}
  <AnimatedSection>
  <div className="max-w-[520px] flex flex-col">
    <p className="text-[#7069FA] text-xs font-bold uppercase tracking-wide mb-[10px]">
      Outil de visualisation
    </p>
    <h2 className="text-[24px] sm:text-[24px] font-bold text-[#2E3271] leading-tight mb-[10px]">
    Visualisez votre progression<br />
    séance après séance et restez<br />
    motivé pour longtemps
    </h2>
    <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold mb-[20px]">
    Visualisez vos progrès exercice par exercice dans votre tableau de bord, fixez-vous des objectifs toujours plus ambitieux et sortez de votre zone de confort.
    </p>

    <Link
      href="/inscription"
      className="w-[214px] h-[44px] bg-[#2E3271] hover:bg-[#1f224e] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition"
    >
      Tester gratuitement
      <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" width={25} height={25} />
    </Link>
  </div>
  </AnimatedSection>
      </section>
      {/* Section bonus */}
      <section className="bg-[#FBFCFE] text-center px-4 max-w-[1152px] pt-[50px] mx-auto">
        <p className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide">
          En bonus
        </p>
        <h2 id="methode-glift" className="text-[28px] font-bold leading-snug text-[#3A416F]">
          Glift, c'est aussi...
        </h2>
      </section>
      <section className="bg-[#FBFCFE] max-w-[1152px] mx-auto px-4 pt-[60px] pb-[90px] grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Glift Store */}
  <Link href="/store" className="block">
  <div className="bg-white rounded-[12px] p-6 flex flex-col gap-4 shadow-glift hover:shadow-glift-hover transition-shadow duration-300 cursor-pointer">
    <Image src="/images/icon-store.png" alt="Icône Glift Store" width={60} height={60} />
    <div>
      <h3 className="text-[#2E3271] text-[24px] font-bold mb-1">Le Glift Store</h3>
      <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold">
      Le Glift Store vous permet de télécharger gratuitement des programmes de musculation. En un seul clic, votre programme est immédiatement utilisable dans Glift. Vous pouvez l’utiliser tel quel ou y apporter vos modifications si besoin.
      </p>
    </div>
    <div className="bg-[#2E3271] hover:bg-[#1f224e] text-white text-[16px] font-semibold px-5 h-[44px] w-[247px] rounded-full flex items-center justify-center gap-2 transition">
      Découvrir le Glift Store
      <Image src="/icons/arrow.svg" alt="→" width={25} height={25} />
    </div>
  </div>
</Link>
  {/* Glift Shop */}
  <Link href="/shop" className="block">
  <div className="bg-white rounded-[12px] p-6 flex flex-col gap-4 shadow-glift hover:shadow-glift-hover transition-shadow duration-300 cursor-pointer">
    <Image src="/images/icon-shop.png" alt="Icône Glift Shop" width={60} height={60} />
    <div>
      <h3 className="text-[#2E3271] text-[24px] font-bold mb-1">La Glift Shop</h3>
      <p className="text-[#5D6494] text-[15px] leading-relaxed font-semibold">
        La Glift Shop vous donne accès à une sélection d’offres de réduction sur des marques dans l’univers
        de la musculation. Le petit plus, c’est que nous adaptons les offres à votre profil pour être sûr que vous
        voyez en priorité ce qui vous intéresse.
      </p>
    </div>
    <div className="bg-[#2E3271] hover:bg-[#1f224e] text-white text-[16px] font-semibold px-5 h-[44px] w-[245px] rounded-full flex items-center justify-center gap-2 transition">
      Découvrir la Glift Shop
      <Image src="/icons/arrow.svg" alt="→" width={25} height={25} />
    </div>
  </div>
</Link>
</section>
    </>
  );
}