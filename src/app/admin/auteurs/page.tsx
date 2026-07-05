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
import AuteursAdminActionsBar from "@/app/admin/components/AuteursAdminActionsBar";
import AuteursTableSkeleton from "./AuteursTableSkeleton";

type Author = {
  id: string;
  statut: boolean; // true = ON, false = OFF
  name: string;
  role: string;
  articlesCount: number;
  language: string; // e.g. "FR"
};

type SortableColumn = "statut" | "name" | "role" | "language";

const fallbackAuthors: Author[] = [
  {
    id: "1",
    statut: true,
    name: "Gabriel Fort",
    role: "Fondateur de Glift",
    articlesCount: 38,
    language: "FR",
  },
];

export default function AdminAuteursPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchAuthors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("auteurs")
        .select("*")
        .order("nom", { ascending: true });

      if (!error && data) {
        if (data.length === 0) {
          setAuthors(fallbackAuthors);
        } else {
          const mapped = await Promise.all(
            data.map(async (item: any) => {
              const authorFullName = `${item.prenom} ${item.nom}`;
              
              // Count articles for this author
              const { count } = await supabase
                .from("blog_articles")
                .select("*", { count: "exact", head: true })
                .eq("auteur", authorFullName);

              return {
                id: item.id,
                statut: !!item.statut,
                name: authorFullName,
                role: item.poste_actuel || "",
                articlesCount: count || 0,
                language: item.langue === "Français" ? "FR" : item.langue || "FR",
              };
            })
          );
          setAuthors(mapped);
        }
      } else {
        console.warn("Could not fetch from auteurs table, using fallback:", error?.message);
        setAuthors(fallbackAuthors);
      }
    } catch (err) {
      console.error("Error fetching authors:", err);
      setAuthors(fallbackAuthors);
    }
    setSelectedIds([]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchAuthors();
  }, [fetchAuthors]);

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = authors.find((a) => a.id === currentId);
    if (!current) return;

    const newStatus = !current.statut;

    setAuthors((prev) =>
      prev.map((a) => (a.id === currentId ? { ...a, statut: newStatus } : a))
    );
    setSelectedIds([]);
    setShowActionsBar(false);

    if (currentId !== "1") {
      const { error } = await (supabase as any)
        .from("auteurs")
        .update({ statut: newStatus })
        .eq("id", currentId);

      if (error) {
        console.error("Error updating status in Supabase:", error);
        alert("Erreur lors de la mise à jour du statut dans Supabase: " + error.message);
        void fetchAuthors();
      }
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-auteur?id=${selectedIds[0]}`);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} auteur(s) ?`)) return;

    const idsToDelete = selectedIds.filter((id) => id !== "1");
    if (idsToDelete.length > 0) {
      const { error } = await (supabase as any)
        .from("auteurs")
        .delete()
        .in("id", idsToDelete);

      if (error) {
        console.error("Error deleting from Supabase:", error);
        alert("Erreur lors de la suppression dans Supabase: " + error.message);
        return;
      }
    }

    setAuthors((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
    setSelectedIds([]);
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
    if (authors.length === selectedIds.length && authors.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(authors.map((a) => a.id));
    }
  };

  const handleAdd = () => {
    router.push("/admin/create-auteur");
  };

  const sortedAuthors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = authors.filter((a) => {
      return (
        !term ||
        a.name?.toLowerCase().includes(term) ||
        a.role?.toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "statut":
          comparison = a.statut === b.statut ? 0 : a.statut ? -1 : 1;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "language":
          comparison = a.language.localeCompare(b.language);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [authors, searchTerm, sortBy, sortDirection]);

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
        <div className={`flex items-center gap-1 whitespace-nowrap ${extraClass?.includes("justify-center") ? "justify-center" : ""} ${extraClass?.includes("justify-end") ? "justify-end" : ""}`}>
          {label}
          <span className="relative w-[8px] h-[8px] ml-[3px] mt-[3px] shrink-0">
            <Image
              src={icon}
              alt=""
              fill
              style={{
                objectFit: "contain",
                transform: isActive && isAscending ? "rotate(-180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
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
          Auteurs
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              placeholder="Rechercher un auteur"
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>

        {showActionsBar ? (
          <AuteursAdminActionsBar
            selectedIds={selectedIds}
            selectedStatus={authors.find((a) => a.id === selectedIds[0])?.statut ?? null}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4">
            <Tooltip content="Ajouter un auteur" delay={0}>
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter un auteur"
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
          <AuteursTableSkeleton />
        ) : sortedAuthors.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12 bg-white rounded-[8px] shadow-[0_3px_6px_rgba(93,100,148,0.15)] overflow-hidden">
            <table className="min-w-full text-left text-sm opacity-50">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="w-[47px] px-4">
                    <div className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                      <Image
                        src="/icons/checkbox_unchecked.svg"
                        alt="Checkbox"
                        width={15}
                        height={15}
                        style={{ marginTop: "5px" }}
                      />
                    </div>
                  </th>
                  {renderHeaderCell("Statut", "statut", "w-[82px]")}
                  {renderHeaderCell("Auteur", "name", "w-[200px]")}
                  {renderHeaderCell("Poste actuel", "role", "w-auto")}
                  <th className="w-[180px] px-4 font-semibold text-[#3A416F] text-right">
                    Nombre d&apos;articles
                  </th>
                  {renderHeaderCell("Langue", "language", "w-[120px] px-4 text-right justify-end")}
                </tr>
              </thead>
            </table>
            <div className="py-12">
              Aucun auteur trouvé.
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
                          authors.length === selectedIds.length && authors.length > 0
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
                  {renderHeaderCell("Statut", "statut", "w-[82px]")}
                  {renderHeaderCell("Auteur", "name", "w-[200px]")}
                  {renderHeaderCell("Poste actuel", "role", "w-auto")}
                  <th className="w-[180px] px-4 font-semibold text-[#3A416F] text-right">
                    Nombre d&apos;articles
                  </th>
                  {renderHeaderCell("Langue", "language", "w-[120px] px-4 text-right justify-end")}
                </tr>
              </thead>
              <tbody>
                {sortedAuthors.map((a) => {
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
                          className={`inline-flex items-center justify-center rounded-full uppercase ${
                            a.statut
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
                          {a.statut ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle w-[200px]">
                        <Link
                          href={`/admin/create-auteur?id=${a.id}`}
                          className="truncate max-w-[180px] block hover:text-[#2E3271] transition-colors cursor-pointer"
                        >
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        <span className="truncate max-w-[300px] block text-[#5D6494]">
                          {a.role}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle text-right w-[180px]">
                        {a.articlesCount}
                      </td>
                      <td className="w-[120px] px-4 align-middle">
                        <div className="flex items-center justify-end">
                          {a.language === "FR" ? (
                            <Image
                              src="/flags/france.svg"
                              alt="Français"
                              width={20}
                              height={15}
                              className="object-contain"
                            />
                          ) : (
                            <span>{a.language}</span>
                          )}
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
