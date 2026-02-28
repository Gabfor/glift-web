"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ProgramStoreActionsBar from "@/app/admin/components/ProgramStoreActionsBar";

import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";
import type { Database } from "@/lib/supabase/types";

type ProgramRow = Database["public"]["Tables"]["program_store"]["Row"];
type ProgramInsert = Database["public"]["Tables"]["program_store"]["Insert"];
type ProgramListRow = Pick<
  ProgramRow,
  |
  "id"
  | "title"
  | "created_at"
  | "status"
  | "partner_name"
  | "gender"
  | "level"
  | "duration"
  | "sessions"
  | "downloads"
  | "actifs"
>;

type Program = {
  id: string;
  title: string;
  created_at: string;
  status: string;
  partner_name: string;
  gender: string;
  level: string;
  duration: string;
  sessions: number;
  downloads: number;
  actifs: number;
};

const mapProgramRowToListItem = (row: ProgramListRow): Program => ({
  id: row.id,
  title: row.title,
  created_at: row.created_at ?? "",
  status: row.status ?? "",
  partner_name: row.partner_name ?? "",
  gender: row.gender ?? "",
  level: row.level ?? "",
  duration: row.duration ?? "",
  sessions: row.sessions ?? 0,
  downloads: row.downloads ?? 0,
  actifs: row.actifs ?? 0,
});

type SortableColumn =
  | "created_at"
  | "status"
  | "partner_name"
  | "gender"
  | "level"
  | "duration"
  | "sessions"
  | "downloads"
  | "actifs"
  | "title";

export default function ProgramStorePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortableColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("program_store")
      .select(
        `
        id,
        title,
        created_at,
        status,
        partner_name,
        gender,
        level,
        duration,
        sessions,
        downloads,
        actifs
      `,
      )
      .order(sortBy, { ascending: sortDirection === "asc" })
      .returns<ProgramListRow[]>();

    if (error) {
      console.error("Erreur Supabase:", JSON.stringify(error, null, 2));
    } else {
      const mappedPrograms = (data ?? []).map(mapProgramRowToListItem);
      setPrograms(mappedPrograms);
    }
    setSelectedIds([]);
    setShowActionsBar(false);
    setLoading(false);
  }, [sortBy, sortDirection, supabase]);

  useEffect(() => {
    fetchPrograms();
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const allSelected = programs.length > 0 && selectedIds.length === programs.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(programs.map(p => p.id));
  };

  const selectedProgram = programs.find(p => p.id === selectedIds[0]) || null;
  const selectedStatus = selectedProgram?.status ?? null;

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.partner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setShowActionsBar(false);
    setSelectedIds([]);
    await supabase.from('program_store').delete().in('id', selectedIds);
    fetchPrograms();
  };

  const handleDuplicate = async () => {
    if (selectedIds.length !== 1) return;
    const idToDuplicate = selectedIds[0];
    setShowActionsBar(false);
    setSelectedIds([]);

    const { data, error } = await supabase
      .from("program_store")
      .select("*")
      .eq("id", idToDuplicate)
      .single<ProgramRow>();

    if (error || !data) {
      console.error("Erreur duplication:", error);
      return;
    }

    const { id: _id, ...baseProgram } = data;
    void _id;
    const duplicated: ProgramInsert = {
      ...baseProgram,
      status: "OFF",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      downloads: 0,
      actifs: 0,
    };

    const { error: insertError } = await supabase
      .from("program_store")
      .insert([duplicated]);

    if (insertError) {
      console.error("Erreur insert duplication:", insertError);
    } else {
      fetchPrograms();
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-program?id=${selectedIds[0]}`)
  };

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = programs.find(p => p.id === currentId);
    if (!current) return;

    const newStatus = current.status === 'ON' ? 'OFF' : 'ON';

    setPrograms(prev =>
      prev.map(p =>
        p.id === currentId ? { ...p, status: newStatus } : p
      )
    );
    setShowActionsBar(false);
    setSelectedIds([]);

    const { error } = await supabase
      .from('program_store')
      .update({ status: newStatus })
      .eq('id', currentId);

    if (error) {
      console.error('Erreur update status:', error);
      setPrograms(prev =>
        prev.map(p =>
          p.id === currentId ? { ...p, status: current.status } : p
        )
      );
    }
  };

  const handleAdd = () => router.push("/admin/create-program");

  const getGenderIcon = (gender: string | null) => {
    if (gender === "Homme") return "/icons/homme.svg";
    if (gender === "Femme") return "/icons/femme.svg";
    if (gender === "Tous") return "/icons/mixte.svg";
    return null;
  };

  const renderHeaderCell = (label: string, column: SortableColumn) => {
    const isActive = sortBy === column;
    const isAscending = sortDirection === "asc";
    const icon = isActive ? ChevronIcon : ChevronGreyIcon;

    return (
      <th
        className="px-4 font-semibold text-[#3A416F] cursor-pointer select-none"
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
                transform: isActive ? (isAscending ? "rotate(-180deg)" : "rotate(0deg)") : "rotate(0deg)",
                transition: "transform 0.2s ease"
              }}
            />
          </span>
        </div>
      </th>
    );
  };

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Cartes Glift Store
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher une carte"
            />
          </div>
        </div>

        {showActionsBar ? (
          <ProgramStoreActionsBar
            selectedIds={selectedIds}
            selectedStatus={selectedStatus}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onAdd={handleAdd}
          />
        ) : (
          <div className="flex justify-end mb-4">
            <Tooltip content="Ajouter une carte">
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
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
        ) : programs.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12">
            Aucun programme pour le moment.
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-[8px] bg-white"
            style={{
              boxShadow: '0 3px 6px rgba(93, 100, 148, 0.15)',
            }}
          >
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="px-4 w-[48px]">
                    <button
                      onClick={toggleAll}
                      className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]"
                    >
                      <Image
                        src={
                          allSelected
                            ? "/icons/checkbox_checked.svg"
                            : "/icons/checkbox_unchecked.svg"
                        }
                        alt="Checkbox"
                        width={15}
                        height={15}
                      />
                    </button>
                  </th>
                  {renderHeaderCell("Statut", "status")}
                  {renderHeaderCell("Date", "created_at")}
                  {renderHeaderCell("Sexe", "gender")}
                  {renderHeaderCell("Nom du programme", "title")}
                  {renderHeaderCell("Difficulté", "level")}
                  {renderHeaderCell("Séances", "sessions")}
                  {renderHeaderCell("Durée", "duration")}
                  {renderHeaderCell("Partenaire", "partner_name")}
                  {renderHeaderCell("Downloads", "downloads")}
                  {renderHeaderCell("Actifs", "actifs")}
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((program) => {
                  const isSelected = selectedIds.includes(program.id);
                  const genderIcon = getGenderIcon(program.gender);

                  return (
                    <tr
                      key={program.id}
                      className="border-b border-[#ECE9F1] h-[60px]"
                    >
                      <td className="px-4">
                        <button
                          onClick={() => toggleCheckbox(program.id)}
                          className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]"
                        >
                          <Image
                            src={
                              isSelected
                                ? "/icons/checkbox_checked.svg"
                                : "/icons/checkbox_unchecked.svg"
                            }
                            alt="Checkbox"
                            width={15}
                            height={15}
                          />
                        </button>
                      </td>
                      <td className="px-4">
                        <span
                          className={`inline-flex items-center justify-center rounded-full ${program.status === "ON"
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
                          {program.status}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        {new Date(program.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        {genderIcon ? (
                          <div className="flex items-center justify-center w-full">
                            <Image src={genderIcon} alt={program.gender} width={20} height={20} />
                          </div>
                        ) : (
                          program.gender
                        )}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        <Tooltip content={program.title}>
                          <div className="max-w-[190px] truncate">
                            <Link
                              href={`/admin/create-program?id=${program.id}`}
                              className="hover:text-[#2E3271] transition-colors"
                            >
                              {program.title}
                            </Link>
                          </div>
                        </Tooltip>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">{program.level}</td>
                      <td className="px-4 font-semibold text-[#5D6494] text-center">{program.sessions}</td>
                      <td className="px-4 font-semibold text-[#5D6494] text-center">{program.duration}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{program.partner_name || "-"}</td>
                      <td className="px-4 font-semibold text-[#5D6494] text-center">{program.downloads || 0}</td>
                      <td className="px-4 font-semibold text-[#5D6494] text-center">{program.actifs || 0}</td>
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
