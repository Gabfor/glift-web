"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

import SearchBar from "@/components/SearchBar";
import Tooltip from "@/components/Tooltip";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import HelpAdminActionsBar from "@/app/admin/components/HelpAdminActionsBar";

type HelpQuestion = {
  id: string;
  question: string;
  answer: string;
  categories: string[];
  status: string;
  top: number;
  flop: number;
  created_at: string;
};

type SortableColumn = "status" | "question" | "answer" | "top" | "flop";

export default function AdminContentHelpPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("question");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("help_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setQuestions(data as HelpQuestion[]);
    } else {
      console.error("Erreur lors de la récupération des aides:", error);
    }
    setLoading(false);
    setSelectedIds([]);
  }, [supabase]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const toggleCheckbox = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (questions.length === selectedIds.length && questions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Etes-vous sûr de vouloir supprimer ${selectedIds.length} question(s) ?`)) return;

    setLoading(true);
    const { error } = await supabase
      .from("help_questions")
      .delete()
      .in("id", selectedIds);

    if (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur: ${error.message}`);
      setLoading(false);
    } else {
      await fetchQuestions();
    }
  };

  const sortedAndFilteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Filtre
    const filtered = questions.filter((q) => {
      if (!term) return true;
      return q.question.toLowerCase().includes(term);
    });

    // Tri
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "question":
          comparison = a.question.localeCompare(b.question);
          break;
        case "answer":
          comparison = a.answer.localeCompare(b.answer);
          break;
        case "top":
          comparison = a.top - b.top;
          break;
        case "flop":
          comparison = a.flop - b.flop;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  }, [questions, searchTerm, sortBy, sortDirection]);

  const renderHeaderCell = (
    label: string | React.ReactNode,
    column: SortableColumn,
    extraClass?: string
  ) => {
    const isActive = sortBy === column;
    const isAscending = sortDirection === "asc";
    const icon = isActive ? ChevronIcon : ChevronGreyIcon;

    return (
      <th
        className={`px-4 font-semibold text-[#3A416F] cursor-pointer select-none ${extraClass || ""}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="relative w-[8px] h-[8px] ml-[3px] mt-[3px]">
            <Image
              src={icon}
              alt=""
              fill
              style={{
                objectFit: "contain",
                transform: isActive && isAscending ? "rotate(-180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease"
              }}
            />
          </span>
        </div>
      </th>
    );
  };

  const handleAdd = () => router.push("/admin/create-help");

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Aide
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              placeholder="Rechercher une question"
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>

        {showActionsBar ? (
          <HelpAdminActionsBar
            selectedIds={selectedIds}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4 relative z-10 w-full">
            <Tooltip content="Ajouter une question" delay={0}>
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter une question"
              >
                <Image
                  src="/icons/plus.svg"
                  alt="Ajouter"
                  width={20}
                  height={20}
                  className="block group-hover:hidden"
                />
                <Image
                  src="/icons/plus_hover.svg"
                  alt="Ajouter"
                  width={20}
                  height={20}
                  className="hidden group-hover:block"
                />
              </button>
            </Tooltip>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
          </div>
        ) : sortedAndFilteredQuestions.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12">
            Aucune question pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="w-[47px] px-4">
                    <button onClick={toggleAll}>
                      <Image
                        src={
                          questions.length === selectedIds.length && questions.length > 0
                            ? "/icons/checkbox_checked.svg"
                            : "/icons/checkbox_unchecked.svg"
                        }
                        alt="Checkbox"
                        width={15}
                        height={15}
                        style={{ marginTop: "5px" }}
                      />
                    </button>
                  </th>
                  {renderHeaderCell("Statut", "status", "w-[82px]")}
                  {renderHeaderCell("Questions", "question", "w-auto")}
                  {renderHeaderCell("Réponses", "answer", "w-auto")}
                  {renderHeaderCell(
                    <div className="flex justify-center w-[20px]">
                      <Image src="/icons/oui_vert.svg" alt="Top" width={20} height={20} />
                    </div>,
                    "top",
                    "w-[80px]"
                  )}
                  {renderHeaderCell(
                    <div className="flex justify-center w-[20px]">
                      <Image src="/icons/non_rouge.svg" alt="Flop" width={20} height={20} />
                    </div>,
                    "flop",
                    "w-[80px]"
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredQuestions.map((q) => {
                  const isSelected = selectedIds.includes(q.id);
                  return (
                    <tr key={q.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="w-[47px] px-4 align-middle">
                        <button onClick={() => toggleCheckbox(q.id)}>
                          <Image
                            src={
                              isSelected
                                ? "/icons/checkbox_checked.svg"
                                : "/icons/checkbox_unchecked.svg"
                            }
                            alt="checkbox"
                            width={15}
                            height={15}
                            style={{ marginTop: "5px" }}
                          />
                        </button>
                      </td>
                      <td className="w-[82px] px-4 align-middle">
                        <span
                          className={`inline-flex items-center justify-center rounded-full uppercase ${q.status === "ON"
                            ? "bg-[#DCFAF1] text-[#00D591]"
                            : "bg-[#FEF7D0] text-[#DCBC04]"
                            }`}
                          style={{
                            width: "40px",
                            height: "20px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        <Link href={`/admin/create-help?id=${q.id}`} className="truncate max-w-[400px] block hover:text-[#2E3271] transition-colors cursor-pointer">
                          {q.question}
                        </Link>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        <Link href={`/admin/create-help?id=${q.id}`} className="truncate max-w-[400px] block hover:text-[#2E3271] transition-colors cursor-pointer">
                          {q.answer.replace(/<[^>]+>/g, '')}
                        </Link>
                      </td>
                      <td className="w-[80px] px-4 font-semibold text-[#5D6494] text-center align-middle">
                        {q.top}
                      </td>
                      <td className="w-[80px] px-4 font-semibold text-[#5D6494] text-center align-middle">
                        {q.flop}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
