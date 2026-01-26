"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase/client";
import ProgramAdminActionsBar from "@/app/admin/components/ProgramAdminActionsBar";
import type { Database } from "@/lib/supabase/types";

import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";

type ProgramRow = {
  id: string;
  name: string;
  created_at: string;
  vignettes: number;
};

type Program = ProgramRow & {
  linked: boolean;
  gender: string | null;
  partner_name: string | null;
};

type ProgramsAdminRow = Database["public"]["Tables"]["programs_admin"]["Row"];
type ProgramsAdminInsert = Database["public"]["Tables"]["programs_admin"]["Insert"];

type SortableColumn = "created_at" | "name" | "linked" | "id" | "vignettes" | "gender" | "partner_name";

export default function AdminProgramPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [sortBy, setSortBy] = useState<SortableColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    const { data: rawPrograms, error } = await supabase.rpc(
      "programs_admin_with_count",
    );
    if (error) {
      console.error("Erreur Supabase (programs):", error);
      setLoading(false);
      return;
    }

    const { data: linkedRows, error: linkedError } = await supabase
      .from("program_store")
      .select("linked_program_id, gender, partner_name");

    if (linkedError) {
      console.error("Erreur Supabase (linked ids):", linkedError);
      setLoading(false);
      return;
    }

    const linkedMap = new Map();
    linkedRows?.forEach((row) => {
      if (row.linked_program_id) {
        linkedMap.set(row.linked_program_id, {
          gender: row.gender,
          partner_name: row.partner_name,
        });
      }
    });

    const withLinked: Program[] = ((rawPrograms ?? []) as ProgramRow[]).map((program) => ({
      ...program,
      linked: linkedMap.has(program.id),
      gender: linkedMap.get(program.id)?.gender ?? null,
      partner_name: linkedMap.get(program.id)?.partner_name ?? null,
    }));

    const sorted = [...withLinked].sort((a, b) => {
      if (sortBy === "created_at") {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      }

      if (sortBy === "linked") {
        return sortDirection === "asc"
          ? Number(!a.linked) - Number(!b.linked)
          : Number(!b.linked) - Number(!a.linked);
      }

      if (sortBy === "gender") {
        const ag = a.gender || "";
        const bg = b.gender || "";
        return sortDirection === "asc"
          ? ag.localeCompare(bg)
          : bg.localeCompare(ag);
      }

      if (sortBy === "partner_name") {
        const ap = a.partner_name || "";
        const bp = b.partner_name || "";
        return sortDirection === "asc"
          ? ap.localeCompare(bp)
          : bp.localeCompare(ap);
      }

      if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (sortBy === "vignettes") {
        return sortDirection === "asc"
          ? a.vignettes - b.vignettes
          : b.vignettes - a.vignettes;
      }

      return sortDirection === "asc"
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id);
    });

    setPrograms(sorted);
    setSelectedIds([]);
    setShowActionsBar(false);
    setLoading(false);
  }, [sortBy, sortDirection, supabase]);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

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
    if (programs.length === selectedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(programs.map((p) => p.id));
    }
  };

  const handleAdd = () => router.push("/admin/entrainements");

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    console.log("Tentative de suppression des programmes avec les IDs :", selectedIds);

    // Vérifie les IDs réellement présents dans programs_admin
    const { data: realPrograms, error: checkError } = await supabase
      .from("programs_admin")
      .select("id");

    if (checkError || !realPrograms) {
      console.error("Erreur lors de la vérification des IDs :", checkError);
      return;
    }

    const validIds = realPrograms.map((p) => p.id);
    const idsToDelete = selectedIds.filter((id) => validIds.includes(id));

    if (idsToDelete.length === 0) {
      console.warn("Aucun ID valide à supprimer.");
      return;
    }

    const { data, error, status } = await supabase
      .from("programs_admin")
      .delete()
      .in("id", idsToDelete);

    console.log("DELETE status:", status);
    console.log("DELETE data:", data);
    console.log("DELETE error:", error);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      alert("Une erreur est survenue lors de la suppression.");
    } else {
      console.log("Suppression réussie, rechargement des programmes.");
      fetchPrograms();
    }
  };

  const handleDuplicate = async () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];

    const { data, error } = await supabase
      .from("programs_admin")
      .select("*")
      .eq("id", id)
      .single<ProgramsAdminRow>();

    if (!data || error) return;

    const { id: _id, ...baseProgram } = data;
    void _id;
    const duplicated: ProgramsAdminInsert = {
      ...baseProgram,
      created_at: new Date().toISOString(),
      name: `${data.name} (copie)`,
    };

    await supabase.from("programs_admin").insert(duplicated);
    fetchPrograms();
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/entrainements?id=${selectedIds[0]}&edit=1`);
  };

  const handleCopyId = async (id: string) => {
    if (copiedId === id) return; // empêche le spam
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1000); // visible 1 seconde
  };

  const getGenderIcon = (gender: string | null) => {
    if (gender === "Homme") return "/icons/homme.svg";
    if (gender === "Femme") return "/icons/femme.svg";
    if (gender === "Tous") return "/icons/mixte.svg";
    return null;
  };

  const renderHeaderCell = (
    label: string,
    column: SortableColumn,
    extraClass?: string,
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
                transition: "transform 0.2s ease",
              }}
            />
          </span>
        </div>
      </th>
    );
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.partner_name && p.partner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Programmes Glift Store
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher un programme"
            />
          </div>
        </div>

        {showActionsBar ? (
          <ProgramAdminActionsBar
            selectedIds={selectedIds}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onEdit={handleEdit}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4">
            <Tooltip content="Ajouter un programme" delay={0}>
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter un programme"
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
        ) : (
          <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="w-[47px] px-4">
                    <button onClick={toggleAll}>
                      <Image
                        src={
                          programs.length === selectedIds.length
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
                  {renderHeaderCell("Lié", "linked", "w-[82px]")}
                  {renderHeaderCell("Date", "created_at", "w-[75px]")}
                  {renderHeaderCell("Sexe", "gender", "w-[65px]")}
                  {renderHeaderCell("Nom du programme", "name", "truncate max-w-[200px]")}
                  {renderHeaderCell("Partenaire", "partner_name", "w-[120px]")}
                  {renderHeaderCell("Vignettes", "vignettes", "text-right w-[110px]")}
                  {renderHeaderCell("ID du programme", "id", "text-left w-[330px]")}
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.map((program) => {
                  const isSelected = selectedIds.includes(program.id);
                  const genderIcon = getGenderIcon(program.gender);
                  return (
                    <tr key={program.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="w-[47px] px-4 align-middle">
                        <button onClick={() => toggleCheckbox(program.id)}>
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
                          className={`inline-flex items-center justify-center rounded-full ${program.linked
                            ? "bg-[#DCFAF1] text-[#00D591]"
                            : "bg-[#FFE3E3] text-[#EF4F4E]"
                            }`}
                          style={{
                            width: "40px",
                            height: "20px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {program.linked ? "OUI" : "NON"}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {new Date(program.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle w-[65px]">
                        {genderIcon && (
                          <div className="flex items-center justify-center">
                            <Image src={genderIcon} alt={program.gender || ""} width={20} height={20} />
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 font-semibold text-[#5D6494] align-middle truncate max-w-[200px] cursor-pointer hover:text-[#2E3271] transition-colors"
                        onClick={() =>
                          router.push(`/admin/entrainements?id=${program.id}&edit=1`)
                        }
                      >
                        {program.name}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle w-[120px] truncate">
                        {program.partner_name || "-"}
                      </td>
                      <td className="w-[110px] px-4 font-semibold text-[#5D6494] text-right align-middle">
                        {program.vignettes}
                      </td>
                      <td className="w-[330px] px-4 font-semibold text-[#5D6494] text-left align-middle">
                        <div className="flex items-center gap-2">
                          <span className="truncate w-[280px]">{program.id}</span>
                          <Tooltip
                            content="Copié !"
                            delay={0}
                            forceVisible={copiedId === program.id}
                            disableHover
                          >
                            <button
                              onClick={() => handleCopyId(program.id)}
                              className="relative w-[20px] h-[20px]"
                            >
                              <Image
                                src={
                                  copiedId === program.id
                                    ? "/icons/check.svg"
                                    : hoveredId === program.id
                                      ? "/icons/copy_hover.svg"
                                      : "/icons/copy.svg"
                                }
                                alt="Copier"
                                width={20}
                                height={20}
                                onMouseEnter={() => setHoveredId(program.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`transition-opacity duration-200 ${copiedId === program.id ? "animate-fade" : ""
                                  }`}
                              />
                            </button>
                          </Tooltip>
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
      <style jsx>{`
        .fade {
          opacity: 0;
          transition: opacity 0.4s ease-in-out;
        }
        .fade.visible {
          opacity: 1;
        }
        .animate-fade {
          animation: fadeInOut 1s ease-in-out;
        }
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translate(-50%, -5px);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          90% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -5px);
          }
        }
      `}</style>
    </main>
  );
}
