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
import BlogAdminActionsBar from "@/app/admin/components/BlogAdminActionsBar";

type BlogArticle = {
  id: string;
  titre: string;
  is_published: boolean;
  is_featured: boolean;
  top: number;
  flop: number;
  created_at: string;
  langue?: string;
};

type SortableColumn = "is_published" | "is_featured" | "titre" | "langue" | "top" | "flop" | "id";

export default function AdminContentBlogPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("titre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredFeaturedId, setHoveredFeaturedId] = useState<string | null>(null);

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setArticles(data as BlogArticle[]);
    } else {
      // Table doesn't exist yet or other error, this is expected as per user notes.
      console.warn("La table blog_articles n'existe peut-être pas encore :", error?.message);
      setArticles([]);
    }
    setLoading(false);
    setSelectedIds([]);
  }, [supabase]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

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
    if (articles.length === selectedIds.length && articles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(articles.map((a) => a.id));
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-blog-article?id=${selectedIds[0]}`);
  };

  const handleReset = async () => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    const { error } = await (supabase
      .from("blog_articles") as any)
      .update({ top: 0, flop: 0 })
      .in("id", selectedIds);

    if (error) {
      console.error("Erreur lors de la remise à zéro:", error);
      alert(`Erreur: ${error.message}`);
    } else {
      await fetchArticles();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Etes-vous sûr de vouloir supprimer ${selectedIds.length} article(s) ?`)) return;

    setLoading(true);
    const { error } = await supabase
      .from("blog_articles")
      .delete()
      .in("id", selectedIds);

    if (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur: ${error.message}`);
      setLoading(false);
    } else {
      await fetchArticles();
    }
  };

  const handleCopyId = async (id: string) => {
    if (copiedId === id) return;
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const sortedAndFilteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // Filtre
    const filtered = articles.filter((a) => {
      if (!term) return true;
      return a.titre?.toLowerCase().includes(term);
    });

    // Tri
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "is_published":
          comparison = (a.is_published === b.is_published) ? 0 : a.is_published ? -1 : 1;
          break;
        case "is_featured":
          comparison = (a.is_featured === b.is_featured) ? 0 : a.is_featured ? -1 : 1;
          break;
        case "titre":
          comparison = (a.titre || "").localeCompare(b.titre || "");
          break;
        case "langue":
          const langueA = a.langue || "Français";
          const langueB = b.langue || "Français";
          comparison = langueA.localeCompare(langueB);
          break;
        case "top":
          comparison = (a.top || 0) - (b.top || 0);
          break;
        case "flop":
          comparison = (a.flop || 0) - (b.flop || 0);
          break;
        case "id":
          comparison = (a.id || "").localeCompare(b.id || "");
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [articles, searchTerm, sortBy, sortDirection]);

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

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = articles.find((a) => a.id === currentId);
    if (!current) return;

    const newStatus = !current.is_published;

    setArticles((prev) =>
      prev.map((a) =>
        a.id === currentId ? { ...a, is_published: newStatus } : a
      )
    );
    setShowActionsBar(false);
    setSelectedIds([]);

    const { error } = await (supabase.from("blog_articles") as any)
      .update({ is_published: newStatus })
      .eq("id", currentId);

    if (error) {
      console.error("Erreur update status:", error);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === currentId ? { ...a, is_published: current.is_published } : a
        )
      );
    }
  };
  
  const handleToggleFeatured = async (id: string, current: boolean) => {
    const newStatus = !current;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_featured: newStatus } : a))
    );

    const { error } = await (supabase.from("blog_articles") as any)
      .update({ is_featured: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Erreur update featured:", error);
      // Rollback
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_featured: current } : a))
      );
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleAdd = () => router.push("/admin/create-blog-article");

  const selectedArticle = articles.find(a => a.id === selectedIds[0]) || null;
  const selectedStatus = selectedArticle?.is_published ?? null;

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Blog
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              placeholder="Rechercher un article"
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>

        {showActionsBar ? (
          <BlogAdminActionsBar
            selectedIds={selectedIds}
            selectedStatus={selectedStatus}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4 relative z-10 w-full">
            <Tooltip content="Ajouter un article" delay={0}>
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter un article"
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
        ) : sortedAndFilteredArticles.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12 bg-white rounded-[8px] shadow-[0_3px_6px_rgba(93,100,148,0.15)] overflow-hidden">
            <table className="min-w-full text-left text-sm opacity-50">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="px-4 w-[48px]">
                    <div className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                      <Image src="/icons/checkbox_unchecked.svg" alt="Checkbox" width={15} height={15} />
                    </div>
                  </th>
                  {renderHeaderCell("Statut", "is_published", "w-[82px]")}
                  {renderHeaderCell("Titre", "titre", "w-auto")}
                  {renderHeaderCell("Mis en avant", "is_featured", "w-[160px] text-center justify-center")}
                  {renderHeaderCell("ID de l'article", "id", "w-[330px]")}
                  {renderHeaderCell("Langue", "langue", "w-[80px] px-3")}
                </tr>
              </thead>
            </table>
            <div className="py-12">
              Pour le moment nous n&apos;avons pas d&apos;articles de créer.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="px-4 w-[48px]">
                    <button onClick={toggleAll} className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                      <Image
                        src={
                          articles.length === selectedIds.length && articles.length > 0
                            ? "/icons/checkbox_checked.svg"
                            : "/icons/checkbox_unchecked.svg"
                        }
                        alt="Checkbox"
                        width={15}
                        height={15}
                      />
                    </button>
                  </th>
                  {renderHeaderCell("Statut", "is_published", "w-[82px]")}
                  {renderHeaderCell("Titre", "titre", "w-auto")}
                  {renderHeaderCell("Mis en avant", "is_featured", "w-[160px] text-center justify-center")}
                  {renderHeaderCell("ID de l'article", "id", "w-[330px]")}
                  {renderHeaderCell("Langue", "langue", "w-[80px] px-3")}
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredArticles.map((a) => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <tr key={a.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="px-4">
                        <button onClick={() => toggleCheckbox(a.id)} className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                          <Image
                            src={
                              isSelected
                                ? "/icons/checkbox_checked.svg"
                                : "/icons/checkbox_unchecked.svg"
                            }
                            alt="checkbox"
                            width={15}
                            height={15}
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
                        <Link href={`/admin/create-blog-article?id=${a.id}`} className="truncate max-w-[400px] block hover:text-[#2E3271] transition-colors cursor-pointer">
                          {a.titre}
                        </Link>
                      </td>
                      <td className="px-4 align-middle">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleToggleFeatured(a.id, a.is_featured)}
                            onMouseEnter={() => setHoveredFeaturedId(a.id)}
                            onMouseLeave={() => setHoveredFeaturedId(null)}
                            className="relative w-[20px] h-[20px] flex items-center justify-center transition-opacity"
                            title={a.is_featured ? "Retirer de la mise en avant" : "Mettre en avant"}
                          >
                            <Image
                              src={
                                hoveredFeaturedId === a.id && !a.is_featured
                                  ? "/icons/coeur_hover.svg"
                                  : a.is_featured
                                    ? "/icons/coeur_red.svg"
                                    : "/icons/coeur_grey.svg"
                              }
                              alt="Featured"
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </button>
                        </div>
                      </td>
                      <td className="w-[330px] px-4 font-semibold text-[#5D6494] text-left align-middle">
                        <div className="flex items-center gap-2">
                          <span className="truncate w-[280px]">{a.id}</span>
                          <Tooltip
                            content="Copié !"
                            delay={0}
                            forceVisible={copiedId === a.id}
                            disableHover
                          >
                            <button
                              onClick={() => handleCopyId(a.id)}
                              className="relative w-[20px] h-[20px]"
                            >
                              <Image
                                src={
                                  copiedId === a.id
                                    ? "/icons/check.svg"
                                    : hoveredId === a.id
                                      ? "/icons/copy_hover.svg"
                                      : "/icons/copy.svg"
                                }
                                alt="Copier"
                                width={20}
                                height={20}
                                onMouseEnter={() => setHoveredId(a.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`transition-opacity duration-200 ${copiedId === a.id ? "animate-fade" : ""
                                  }`}
                              />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center justify-center">
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
