"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import SearchBar from "@/components/SearchBar";
import { Accordion } from "@/components/ui/accordion";
import HelpQuestionItem from "@/components/aide/HelpQuestionItem";
import GliftLoader from "@/components/ui/GliftLoader";
import DropdownFilter from "@/components/filters/DropdownFilter";

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

function AideContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const q = searchParams.get('q');

  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openSection, setOpenSection] = useState<string>("");

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

  // Extract unique categories from all live questions for the dropdown
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    questions.forEach(q => {
      if (q.categories) {
        q.categories.forEach(c => cats.add(c));
      }
    });
    return Array.from(cats).sort().map(cat => ({ value: cat, label: cat }));
  }, [questions]);

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
        (q.categories && q.categories.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchTerm, selectedCategory, isLogged]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">

        {/* Header Section */}
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">
          Aide
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] mb-[30px]">
          Retrouvez les questions les plus fréquemment posées par nos utilisateurs.
          <br />
          Si vous avez d’autres questions,{" "}
          <Link
            href="/contact?from=aide"
            className="text-[#7069FA] hover:text-[#6660E4] transition-colors"
          >
            contactez-nous.
          </Link>
        </p>

        {/* Search Bar */}
        <div className="mb-[40px] w-full max-w-[500px]">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par mot-clé"
          />
        </div>

        {loading ? (
          <div className="mt-10"><GliftLoader /></div>
        ) : (
          <div className="w-full max-w-[760px] text-left">
            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="mb-[30px] flex justify-start z-20 relative">
                <DropdownFilter
                  label="Catégorie"
                  placeholder="Toutes les catégories"
                  options={allCategories}
                  allOptions={allCategories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
              </div>
            )}

            {/* Questions List */}
            {filteredQuestions.length === 0 ? (
              <div className="text-center text-[#5D6494] font-semibold mt-10">
                Aucun résultat trouvé
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="space-y-[20px]"
                value={openSection}
                onValueChange={setOpenSection}
              >
                {filteredQuestions.map(q => (
                  <HelpQuestionItem
                    key={q.id}
                    questionId={q.id}
                    question={q.question}
                    answer={q.answer}
                  />
                ))}
              </Accordion>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AidePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px] flex justify-center items-start">
        <GliftLoader />
      </main>
    }>
      <AideContent />
    </Suspense>
  );
}
