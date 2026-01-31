import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/entrainements");
  }

  // Fetch partners and settings in parallel
  const [partnersResponse, settingsResponse] = await Promise.all([
    supabase
      .from("partners")
      .select("*")
      .order("position", { ascending: true })
      .limit(4),
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "partners_enabled")
      .single()
  ]);

  const partners = partnersResponse.data;
  const displayPartners = partners && partners.length > 0 ? partners : [];

  // Determine visibility
  // If no setting found, default to TRUE to show partners unless explicitly disabled
  const showPartners = settingsResponse.data?.value === false ? false : true;

  const surfaceBackground = "bg-[var(--color-surface-primary)]";
  const maxContentWidth = "max-w-[var(--layout-max-width)]";

  return (
    <>
      {/* Section principale */}
      <section
        className={`${surfaceBackground} text-center px-4 pt-[140px] pb-[30px] ${maxContentWidth} mx-auto`}
      >
        <p className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
          Outil de suivi en musculation
        </p>

        <h1 className="text-[24px] sm:text-[32px] md:text-[30px] font-bold leading-snug text-[var(--color-text-heading)] mb-[10px]">
          Gérer et suivre facilement<br />
          ses programmes de musculation
        </h1>

        <p className="text-[15px] sm:text-[16px] text-[var(--color-text-body)] font-semibold b-8 leading-relaxed max-w-[700px] mx-auto mb-[20px]">
          Digitalisez vos programmes de musculation, analysez vos performances
          <br className="hidden sm:block" />
          et progressez efficacement séance après séance.
        </p>

        <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <Link
            href="#methode-glift"
            className="border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center gap-2 transition"
          >
            En savoir plus
          </Link>
          <Link
            href="/inscription?plan=premium"
            className="bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white text-[16px] font-semibold px-[30px] h-[44px] rounded-full flex items-center justify-center gap-2 transition"
          >
            Tester gratuitement
            <Image
              src="/icons/arrow.svg"
              className="ml-[-5px]"
              alt="Flèche"
              priority={false}
              width={25}
              height={25}
            />
          </Link>
        </div>

        <div className="flex justify-center items-center gap-2 text-[14px] text-[var(--color-text-body)] font-semibold">
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute w-full h-full rounded-full bg-[var(--color-accent-success)] opacity-50 animate-ping"></span>
            <span className="relative w-2 h-2 rounded-full bg-[var(--color-accent-success)]"></span>
          </span>
          30 jours pour tester gratuitement
        </div>
      </section>
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 pt-[30px] text-center relative`}>
        {/* Mockups */}
        <div className="flex justify-center">
          <Image
            src="/images/mockups-app-site.png"
            alt="Appareils"
            priority={false}
            width={800}
            height={400}
            className="w-full max-w-[700px]"
          />
        </div>
        {/* Flèche + texte gauche */}
        <div className="absolute left-[120px] top-[40%] -translate-y-1/2 hidden md:block">
          <p className="text-[var(--color-text-strong)] text-[14px] font-bold rotate-[-10deg] origin-left w-[180px]">
            Une app pour<br />
            suivre ses entraînements<br />
            efficacement
          </p>
          <Image
            src="/images/arrow-left.png"
            alt="Flèche"
            priority={false}
            width={114}
            height={114}
            className="ml-[60px] mt-[-35px]"
          />
        </div>

        {/* Flèche + texte droite */}
        <div className="absolute right-[150px] top-[25%] -translate-y-1/2 hidden md:block">
          <p className="text-[var(--color-text-strong)] text-[14px] font-bold rotate-[8deg] origin-right w-[180px] ml-auto">
            Un site pour<br />
            créer ses entraînements<br />
            facilement
          </p>
          <Image
            src="/images/arrow-right.png"
            alt="Flèche"
            priority={false}
            width={114}
            height={114}
            className="ml-[-5px] mt-[-37px]"
          />
        </div>
      </section>
      {/* ... previous sections ... */}

      {/* ... (Keep all other sections the same until Partenaires) ... */}

      {/* Section outils */}
      <section
        className={`${surfaceBackground} text-center px-4 ${maxContentWidth} pt-[80px] mx-auto`}
        id="methode-glift"
      >
        <p className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
          La méthode Glift
        </p>
        <h2 className="text-[28px] font-bold leading-snug text-[var(--color-text-heading)]">
          Comment fonctionne Glift ?
        </h2>
      </section>

      {/* ... (Keep tool sections) ... */}

      {/* Nouvelle section : Outil de création */}
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10`}>
        {/* ... content ... */}
        <AnimatedSection>
          <div className="max-w-[520px] flex flex-col">
            <p className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
              Outil de création
            </p>
            <h2 className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]">
              Construisez facilement<br />
              vos programmes de musculation<br />
              selon vos objectifs
            </h2>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold mb-[20px]">
              Notre plateforme a été pensée pour vous permettre de créer vos
              programmes de musculation rapidement et en toute simplicité
              tranquillement chez vous.
            </p>

            <Link
              href="/creation"
              className="px-[30px] h-[44px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
            >
              En savoir plus
              <div className="relative w-[25px] h-[25px]">
                <Image
                  src="/icons/arrow_blue.svg"
                  alt="Flèche normale"
                  fill
                  className="object-contain transition-opacity  group-hover:opacity-0"
                  priority={false}
                />
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  fill
                  className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                  priority={false}
                />
              </div>
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
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10`}>
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
            <p className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
              Outil de suivi
            </p>
            <h2 className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]">
              Entraînez-vous efficacement<br />
              et tirer profits de chaque minute<br />
              d’entraînement
            </h2>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold mb-[20px]">
              Retrouvez vos entraînements sur l’app Glift où nous avons créé une expérience simple et intuitive pour vous permettre d’optimiser votre temps d’entraînement.
            </p>

            <Link
              href="/suivi"
              className="px-[30px] h-[44px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
            >
              En savoir plus
              <div className="relative w-[25px] h-[25px]">
                <Image
                  src="/icons/arrow_blue.svg"
                  alt="Flèche normale"
                  fill
                  className="object-contain transition-opacity  group-hover:opacity-0"
                  priority={false}
                />
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  fill
                  className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                  priority={false}
                />
              </div>
            </Link>
          </div>
        </AnimatedSection>
      </section>
      {/* Nouvelle section : Outil de notation */}
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10`}>
        {/* Texte à gauche */}
        <AnimatedSection>
          <div className="max-w-[520px] flex flex-col">
            <p className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
              Outil de notation
            </p>
            <h2 className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]">
              Notez facilement vos<br />
              performances et assurez-vous<br />
              de toujours progresser
            </h2>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold mb-[20px]">
              Notez vos performances mais aussi vos sensations. Ajustez vos entraînements en temps réel ou plus tard afin de toujours être dans votre zone de progression.
            </p>

            <Link
              href="/notation"
              className="px-[30px] h-[44px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
            >
              En savoir plus
              <div className="relative w-[25px] h-[25px]">
                <Image
                  src="/icons/arrow_blue.svg"
                  alt="Flèche normale"
                  fill
                  className="object-contain transition-opacity  group-hover:opacity-0"
                  priority={false}
                />
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  fill
                  className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                  priority={false}
                />
              </div>
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
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 py-[30px] flex flex-col md:flex-row items-center justify-between gap-10`}>
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
            <p className="text-[var(--color-brand-primary)] text-xs font-bold uppercase tracking-wide mb-[10px]">
              Outil de visualisation
            </p>
            <h2 className="text-[24px] sm:text-[24px] font-bold text-[var(--color-brand-strong)] leading-tight mb-[10px]">
              Visualisez votre progression<br />
              séance après séance et restez<br />
              motivé pour longtemps
            </h2>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold mb-[20px]">
              Visualisez vos progrès exercice par exercice dans votre tableau de bord, fixez-vous des objectifs toujours plus ambitieux et sortez de votre zone de confort.
            </p>

            <Link
              href="/visualisation"
              className="px-[30px] h-[44px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition"
            >
              En savoir plus
              <div className="relative w-[25px] h-[25px]">
                <Image
                  src="/icons/arrow_blue.svg"
                  alt="Flèche normale"
                  fill
                  className="object-contain transition-opacity  group-hover:opacity-0"
                  priority={false}
                />
                <Image
                  src="/icons/arrow.svg"
                  alt="Flèche blanche"
                  fill
                  className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                  priority={false}
                />
              </div>
            </Link>
          </div>
        </AnimatedSection>
      </section>
      {/* Section bonus */}
      <section className={`${surfaceBackground} text-center px-4 ${maxContentWidth} pt-[50px] mx-auto`}>
        <p className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
          En bonus
        </p>
        <h2 id="methode-glift" className="text-[28px] font-bold leading-snug text-[var(--color-text-heading)]">
          Glift, c&apos;est aussi...
        </h2>
      </section>
      <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 pt-[60px] pb-0 grid grid-cols-1 md:grid-cols-2 gap-6`}>
        {/* Glift Store */}
        <div className="bg-white rounded-[20px] p-8 flex flex-col gap-4 border border-[#D7D4DC]">
          <div>
            <h3 className="text-[var(--color-brand-strong)] text-[24px] font-bold mb-1">Le Glift Store</h3>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold">
              Le Glift Store vous permet de télécharger gratuitement des programmes de musculation. En un seul clic, votre programme est immédiatement utilisable dans Glift. Vous pouvez l’utiliser tel quel ou y apporter vos modifications si besoin.
            </p>
          </div>
          <div className="h-[44px] px-[30px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition cursor-pointer">
            Découvrir
            <div className="relative w-[25px] h-[25px]">
              <Image
                src="/icons/arrow_blue.svg"
                alt="Flèche normale"
                fill
                className="object-contain transition-opacity  group-hover:opacity-0"
                priority={false}
              />
              <Image
                src="/icons/arrow.svg"
                alt="Flèche blanche"
                fill
                className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                priority={false}
              />
            </div>
          </div>
        </div>
        {/* Glift Shop */}
        <div className="bg-white rounded-[20px] p-8 flex flex-col gap-4 border border-[#D7D4DC]">
          <div>
            <h3 className="text-[var(--color-brand-strong)] text-[24px] font-bold mb-1">La Glift Shop</h3>
            <p className="text-[var(--color-text-body)] text-[15px] leading-relaxed font-semibold">
              La Glift Shop vous donne accès à une sélection d’offres de réduction sur des marques dans l’univers
              de la musculation. Le petit plus, c’est que nous adaptons les offres à votre profil pour être sûr que vous
              voyez en priorité ce qui vous intéresse.
            </p>
          </div>
          <div className="h-[44px] px-[30px] w-fit group border border-[var(--color-brand-strong)] text-[var(--color-brand-strong)] hover:text-white hover:bg-[var(--color-brand-strong)] font-semibold rounded-full flex items-center justify-center gap-1 transition cursor-pointer">
            Découvrir
            <div className="relative w-[25px] h-[25px]">
              <Image
                src="/icons/arrow_blue.svg"
                alt="Flèche normale"
                fill
                className="object-contain transition-opacity  group-hover:opacity-0"
                priority={false}
              />
              <Image
                src="/icons/arrow.svg"
                alt="Flèche blanche"
                fill
                className="object-contain opacity-0 transition-opacity group-hover:opacity-100 absolute top-0 left-0"
                priority={false}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      {showPartners && (
        <>
          <section className={`${surfaceBackground} text-center px-4 ${maxContentWidth} pt-[50px] mx-auto`}>
            <p className="uppercase text-[12px] font-bold text-[var(--color-brand-primary)] mb-[10px] tracking-wide">
              Partenaires
            </p>
            <h2 className="text-[28px] font-bold leading-snug text-[var(--color-text-heading)]">
              Merci à nos partenaires !
            </h2>
          </section>

          <section className={`${surfaceBackground} ${maxContentWidth} mx-auto px-4 pt-[60px]`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {displayPartners.length > 0 ? (
                displayPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6 relative"
                  >
                    <div className="relative w-full h-full">
                      {partner.link_url ? (
                        <a href={partner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
                          <Image
                            src={partner.logo_url}
                            alt={partner.alt_text || partner.name}
                            fill
                            className="object-contain"
                          />
                        </a>
                      ) : (
                        <Image
                          src={partner.logo_url}
                          alt={partner.alt_text || partner.name}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Placeholder text if no partners in DB
                <>
                  {/* Fitadium */}
                  <div className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6">
                    <span className="text-[#B1BACC] text-2xl font-bold">Fitadium</span>
                  </div>
                  {/* Foodspring */}
                  <div className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6">
                    <span className="text-[#B1BACC] text-2xl font-bold">foodspring</span>
                  </div>
                  {/* MyProtein */}
                  <div className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6">
                    <span className="text-[#B1BACC] text-2xl font-bold tracking-widest">MYPROTEIN</span>
                  </div>
                  {/* Bulk */}
                  <div className="h-[150px] bg-white border border-[#D7D4DC] rounded-[20px] flex items-center justify-center p-6">
                    <span className="text-[#B1BACC] text-2xl font-bold">bulk</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[#2E3271] font-semibold text-[15px]">
              Vous voulez devenir partenaire ? <Link href="#" className="text-[var(--color-brand-primary)] hover:underline">Contactez-nous</Link>
            </div>
          </section>
        </>
      )}

      {/* Helper for consistent bottom spacing */}
      <div className="pt-[100px]"></div>
    </>
  );
}