"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import LegalAdminActionsBar from "@/app/admin/components/LegalAdminActionsBar";
import PagesTableSkeleton from "./PagesTableSkeleton";


type PageData = {
  id: string;
  titre: string;
  is_published: boolean;
  updated_at: string;
  langue: string;
};

type SortableColumn = "is_published" | "titre" | "langue";

export default function AdminPagesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("titre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");


  const fetchPages = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("pages")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setPages(data as PageData[]);
    } else {
      console.warn("Table pages n'existe peut-être pas :", error?.message);
      setPages([]);
    }
    setSelectedIds([]);
    setIsLoading(false);
  }, [supabase]);


  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = pages.find((p) => p.id === currentId);
    if (!current) return;
    
    const newStatus = !current.is_published;

    setPages((prev) =>
      prev.map((p) =>
        p.id === currentId ? { ...p, is_published: newStatus } : p
      )
    );
    setShowActionsBar(false);
    setSelectedIds([]);

    const { error } = await (supabase as any)
      .from("pages")
      .update({ is_published: newStatus })
      .eq("id", currentId);

    if (error) {
      console.error("Erreur update status:", error);
      setPages((prev) =>
        prev.map((p) =>
          p.id === currentId ? { ...p, is_published: current.is_published } : p
        )
      );
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-page?id=${selectedIds[0]}`);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Etes-vous sûr de vouloir supprimer ${selectedIds.length} page(s) ?`)) return;
    
    const { error } = await (supabase as any)
      .from("pages")
      .delete()
      .in("id", selectedIds);

    if (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur: ${error.message}`);
    } else {
      await fetchPages();
    }
  };

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
    if (pages.length === selectedIds.length && pages.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pages.map((a) => a.id));
    }
  };

  const handleAdd = () => {
    router.push("/admin/create-page");
  };

  const sortedPages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    const filtered = pages.filter((p) => {
      return !term || p.titre?.toLowerCase().includes(term);
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "is_published":
          comparison = (a.is_published === b.is_published) ? 0 : a.is_published ? -1 : 1;
          break;
        case "titre":
          comparison = a.titre.localeCompare(b.titre);
          break;
        case "langue":
          comparison = a.langue.localeCompare(b.langue);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [pages, searchTerm, sortBy, sortDirection]);

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
        <div className={`flex items-center gap-1 whitespace-nowrap ${extraClass?.includes("justify-center") ? "justify-center" : ""}`}>
          {label}
          <span className="relative w-[8px] h-[8px] ml-[3px] mt-[3px] shrink-0">
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

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Pages
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              placeholder="Rechercher une page"
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>

        {showActionsBar ? (
          <LegalAdminActionsBar
            selectedIds={selectedIds}
            selectedStatus={pages.find(p => p.id === selectedIds[0])?.is_published ?? null}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4">
            <Tooltip content="Ajouter une page" delay={0}>
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter une page"
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

        {isLoading ? (
          <PagesTableSkeleton />
        ) : sortedPages.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12 bg-white rounded-[8px] shadow-[0_3px_6px_rgba(93,100,148,0.15)] overflow-hidden">

            <table className="min-w-full text-left text-sm opacity-50">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="w-[47px] px-4">
                    <div className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                      <Image src="/icons/checkbox_unchecked.svg" alt="Checkbox" width={15} height={15} style={{ marginTop: "5px" }} />
                    </div>
                  </th>
                  {renderHeaderCell("Statut", "is_published", "w-[82px]")}
                  {renderHeaderCell("Titre", "titre", "w-auto")}
                  {renderHeaderCell("Langue", "langue", "w-[120px] px-3")}
                </tr>
              </thead>
            </table>
            <div className="py-12">
              Pour le moment nous n&apos;avons pas de pages créées.
            </div>
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
                          pages.length === selectedIds.length && pages.length > 0
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
                  {renderHeaderCell("Statut", "is_published", "w-[82px]")}
                  {renderHeaderCell("Titre", "titre", "w-auto")}
                  {renderHeaderCell("Langue", "langue", "w-[120px] px-3")}
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((a) => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <tr key={a.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="w-[47px] px-4 align-middle">
                        <button onClick={() => toggleCheckbox(a.id)}>
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
                          className={`inline-flex items-center justify-center rounded-full uppercase ${a.is_published
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
                          {a.is_published ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        <Link href={`/admin/create-page?id=${a.id}`} className="truncate max-w-[400px] block hover:text-[#2E3271] transition-colors cursor-pointer">
                          {a.titre}
                        </Link>
                      </td>
                      <td className="w-[120px] px-4">
                        <div className="flex items-center">
                          <Image src="/flags/france.svg" alt="Français" width={20} height={15} className="object-contain" />
                        </div>
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
