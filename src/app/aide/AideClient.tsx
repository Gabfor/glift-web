"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import { Accordion } from "@/components/ui/accordion";
import HelpQuestionItem from "@/components/aide/HelpQuestionItem";
import Pagination from "@/components/pagination/Pagination";
import AideSkeleton from "@/components/aide/AideSkeleton";
import CTAButton from "@/components/CTAButton";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";

const HELP_CATEGORIES = [
  { id: "Application", label: "Application", icon: "/icons/aide_application.svg" },
  { id: "Entraînement", label: "Entraînement", icon: "/icons/aide_entrainement.svg" },
  { id: "Compte", label: "Compte", icon: "/icons/aide_compte.svg" },
  { id: "Tableau de bord", label: "Tableau de bord", icon: "/icons/aide_tableau_de_bord.svg" },
  { id: "Store", label: "Store", icon: "/icons/aide_store.svg" },
  { id: "Shop", label: "Shop", icon: "/icons/aide_shop.svg" },
  { id: "Abonnement", label: "Abonnement", icon: "/icons/aide_abonnement.svg" },
  { id: "Autres", label: "Autres", icon: "/icons/aide_autres.svg" },
];

type HelpQuestion = {
  id: string;
  question: string;
  answer: string;
  categories: string[];
  status: string;
  top: number;
  flop: number;
  created_at: string;
  display: string;
};

function AideContent({
  initialPageContent,
}: {
  initialPageContent: { surtitre: string; titre: string; description: string };
}) {
  const { contactUrl } = useDashboardUrl();
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const q = searchParams.get('q');

  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumVisibility(loading, 400);

  const pageIntro = initialPageContent;

  const [isLogged, setIsLogged] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openSection, setOpenSection] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const logged = !!userData?.user;
      setIsLogged(logged);

      const { data, error } = await supabase
        .from("help_questions")
        .select("*")
        .eq("status", "ON")
        .order("top", { ascending: false })
        .order("created_at", { ascending: false });

      if (data && !error) {
        setQuestions(data as HelpQuestion[]);
      } else {
        console.error("Error fetching help questions:", error);
      }
      setLoading(false);
    };

    void fetchData();
  }, [supabase]);

  // Handle deep linking to a specific question via ?q=id
  useEffect(() => {
    if (!loading && questions.length > 0 && q) {
      if (questions.some(question => question.id === q)) {
        // Clear any filters so the question is definitely visible
        setSearchTerm("");
        setSelectedCategory("");

        setOpenSection(q);

        // Find the index of the question to determine the page
        const questionIndex = questions.findIndex((question) => question.id === q);
        if (questionIndex !== -1) {
          const targetPage = Math.floor(questionIndex / ITEMS_PER_PAGE) + 1;
          setCurrentPage(targetPage);
        }

        let attempts = 0;
        const scrollInterval = setInterval(() => {
          const el = document.getElementById(q);
          if (el) {
            // Found it, now scroll. Offset by 180 to account for the sticky header
            const y = el.getBoundingClientRect().top + window.scrollY - 180;
            window.scrollTo({ top: y, behavior: 'smooth' });
            clearInterval(scrollInterval);
          } else {
            attempts++;
            if (attempts > 30) {
              clearInterval(scrollInterval); // stop trying after 3 seconds
            }
          }
        }, 100);
      }
    }
  }, [loading, questions, q]);

  const scrollToResults = () => {
    setTimeout(() => {
      const resultsEl = document.getElementById("aide-results");
      if (resultsEl) {
        const headerOffset = 85;
        const y = resultsEl.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }, 100);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory("");
    } else {
      setSelectedCategory(categoryName);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        scrollToResults();
      }
    }
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    if (!searchTerm.trim() && !selectedCategory) return;

    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    scrollToResults();
  };

  const normalizeCat = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Filter questions based on search term, category and user login state
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // 1. Check Affichage display mode
      const displayMode = q.display || 'Les deux'; // legacy fallback
      if (displayMode === 'Connecté' && !isLogged) return false;
      if (displayMode === 'Non connecté' && isLogged) return false;

      // 2. Check search and categories
      const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "" ||
        (q.categories && q.categories.some(c => 
          c.toLowerCase().trim() === selectedCategory.toLowerCase().trim() ||
          normalizeCat(c) === normalizeCat(selectedCategory)
        ));
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchTerm, selectedCategory, isLogged]);

  // Extract the current page items
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const hasActiveFilter = Boolean(searchTerm.trim() || selectedCategory || q);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">

        {/* Header Section */}
        {pageIntro?.surtitre && (
          <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
            {pageIntro.surtitre}
          </div>
        )}
        <h1 
          className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: pageIntro?.titre || "Aide" }}
        />
        {pageIntro?.description ? (
          <div 
            className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0 [&_a]:!text-[#7069FA] hover:[&_a]:!text-[#6660E4] hover:[&_a]:no-underline [&_a]:transition-colors"
            dangerouslySetInnerHTML={{ __html: pageIntro.description }}
          />
        ) : (
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8">
            Retrouve les questions les plus fréquemment posées par nos utilisateurs.
            <br />
            Si tu as d’autres questions,{" "}
            <Link
              href={`${contactUrl}?from=aide`}
              className="text-[#7069FA] hover:text-[#6660E4] transition-colors"
            >
              contacte-nous.
            </Link>
          </p>
        )}

        {/* Search Bar */}
        <div className="w-full max-w-[368px]">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            onSubmit={handleSearchSubmit}
            placeholder="Rechercher par mot-clé"
          />
        </div>

        {/* Separator "ou par catégorie" with 30px margin top and bottom */}
        <div className="relative my-[30px] flex items-center justify-center w-full max-w-[760px]">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#ECE9F1]" />
          </div>
          <div className="relative bg-[#FBFCFE] px-4 text-[14px] font-semibold text-[#D7D4DC]">
            ou par catégorie
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-[24px] w-full max-w-[760px] justify-items-center mb-0">
          {HELP_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`group w-full md:w-[172px] h-[88px] rounded-[8px] bg-white flex flex-col items-center justify-between pt-[20px] pb-[15px] border cursor-pointer select-none transition-all duration-200 ease-in-out ${
                  isSelected
                    ? "border-[#A1A5FD] ring-1 ring-inset ring-[#A1A5FD] shadow-[0_4px_20px_rgba(93,100,148,0.06)]"
                    : "border-[#D7D4DC] ring-0 ring-transparent shadow-none"
                }`}
              >
                <div className="relative w-[30px] h-[30px] flex items-center justify-center shrink-0">
                  <Image
                    src={cat.icon}
                    alt=""
                    width={30}
                    height={30}
                    className="w-[30px] h-[30px] object-contain"
                  />
                </div>
                <span className={`text-[12px] font-bold text-center leading-none transition-colors duration-200 ${
                  isSelected ? "text-[#3A416F]" : "text-[#5D6494] group-hover:text-[#3A416F]"
                }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {hasActiveFilter && (
          <div id="aide-results" className="w-full max-w-[760px] text-left">
            {showSkeleton ? (
              <AideSkeleton />
            ) : (
              <>
                {/* Results Indicator */}
                <div className="flex justify-end mt-[30px] mb-[20px]">
                  <span className="text-[14px] font-semibold text-[#5D6494]">
                    {filteredQuestions.length} résultat{filteredQuestions.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Questions List */}
                {filteredQuestions.length === 0 ? (
                  <div className="text-center mt-[20px] mb-[40px] flex flex-col items-center">
                    <h2 className="text-[18px] font-bold text-[#2E3271] mb-[12px]">
                      Oups ! Aucun résultat trouvé....
                    </h2>
                    <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-relaxed mb-[20px] max-w-[550px] text-center">
                      Tu ne trouves pas ce que tu cherches ?
                      <br />
                      Envoie nous un message et nous reviendrons vers toi rapidement.
                    </p>
                    <CTAButton href={`${contactUrl}?from=aide`}>
                      Nous contacter
                    </CTAButton>
                  </div>
                ) : (
                  <>
                    <Accordion
                      type="single"
                      collapsible
                      className="space-y-[20px]"
                      value={openSection}
                      onValueChange={setOpenSection}
                    >
                      {paginatedQuestions.map(q => (
                        <HelpQuestionItem
                          key={q.id}
                          questionId={q.id}
                          question={q.question}
                          answer={q.answer}
                          searchTerm={searchTerm}
                        />
                      ))}
                    </Accordion>

                    <Pagination
                      currentPage={currentPage}
                      totalItems={filteredQuestions.length}
                      onPageChange={setCurrentPage}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AidePage({
  initialPageContent,
}: {
  initialPageContent: { surtitre: string; titre: string; description: string };
}) {
  const { contactUrl } = useDashboardUrl();
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[100px] md:pt-[140px] pb-[100px] flex justify-center items-start">
        <div className="w-full max-w-[1152px] mx-auto text-center flex flex-col items-center">
            {/* Header Section */}
            {initialPageContent.surtitre && (
              <div className="uppercase text-[12px] font-bold text-[#7069FA] mb-[10px] tracking-wide text-center">
                {initialPageContent.surtitre}
              </div>
            )}
            <h1 
              className="text-[30px] font-bold text-[#2E3271] mb-2 text-center prose-titles [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: initialPageContent.titre || "Aide" }}
            />
            {initialPageContent.description ? (
              <div 
                className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8 [&_p]:m-0 [&_a]:!text-[#7069FA] hover:[&_a]:!text-[#6660E4] hover:[&_a]:no-underline [&_a]:transition-colors"
                dangerouslySetInnerHTML={{ __html: initialPageContent.description }}
              />
            ) : (
              <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] text-center max-w-[500px] mx-auto leading-relaxed mb-8">
                Retrouve les questions les plus fréquemment posées par nos utilisateurs.
                <br />
                Si tu as d’autres questions,{" "}
                <Link
                  href={`${contactUrl}?from=aide`}
                  className="text-[#7069FA] hover:text-[#6660E4] transition-colors"
                >
                  contacte-nous.
                </Link>
              </p>
            )}

            {/* Search Bar */}
            <div className="w-full max-w-[368px]">
              <SearchBar
                value=""
                onChange={() => {}}
                placeholder="Rechercher par mot-clé"
              />
            </div>

            {/* Separator "ou par catégorie" with 30px margin top and bottom */}
            <div className="relative my-[30px] flex items-center justify-center w-full max-w-[760px]">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#ECE9F1]" />
              </div>
              <div className="relative bg-[#FBFCFE] px-4 text-[14px] font-semibold text-[#D7D4DC]">
                ou par catégorie
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-[24px] w-full max-w-[760px] justify-items-center mb-0">
              {HELP_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="w-full md:w-[172px] h-[88px] rounded-[8px] bg-white flex flex-col items-center justify-between pt-[20px] pb-[15px] border border-[#D7D4DC]"
                >
                  <div className="relative w-[30px] h-[30px] flex items-center justify-center shrink-0">
                    <Image
                      src={cat.icon}
                      alt=""
                      width={30}
                      height={30}
                      className="w-[30px] h-[30px] object-contain"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-[#5D6494] text-center leading-none">
                    {cat.label}
                  </span>
                </div>
              ))}
            </div>
        </div>
      </main>
    }>
      <AideContent initialPageContent={initialPageContent} />
    </Suspense>
  );
}
