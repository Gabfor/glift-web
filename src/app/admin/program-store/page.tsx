"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProgramStoreActionsBar from "@/app/admin/components/ProgramStoreActionsBar";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";

type Program = {
  id: number;
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

export default function ProgramStorePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  const requireSession = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      router.replace(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return null;
    }
    return session;
  };

  const fetchPrograms = async () => {
    setLoading(true);

    const session = await requireSession();
    if (!session) return; // redirigé

    const { data, error } = await supabase
      .from("program_store")
      .select(`
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
      `)
      .order(sortBy, { ascending: sortDirection === "asc" });

    if (error) {
      console.error("Erreur Supabase:", error);
      setPrograms([]);
    } else {
      setPrograms((data || []) as Program[]);
    }

    setSelectedIds([]);
    setShowActionsBar(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDirection]);

  // ✅ Correction: utiliser (event, session) et se désabonner proprement
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const toggleCheckbox = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = programs.length > 0 && selectedIds.length === programs.length;
  const toggleAll = () => setSelectedIds(allSelected ? [] : programs.map((p) => p.id));

  const selectedProgram = programs.find((p) => p.id === selectedIds[0]) || null;
  const selectedStatus = selectedProgram?.status ?? null;

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setShowActionsBar(false);
    setSelectedIds([]);
    await supabase.from("program_store").delete().in("id", selectedIds);
    fetchPrograms();
  };

  const handleDuplicate = async () => {
    if (selectedIds.length !== 1) return;
    const idToDuplicate = selectedIds[0];

    const { data, error } = await supabase.from("program_store").select("*").eq("id", idToDuplicate).single();
    if (error || !data) {
      console.error("Erreur duplication:", error);
      return;
    }

    const duplicated = { ...data };
    delete (duplicated as any).id;
    (duplicated as any).status = "OFF";
    (duplicated as any).created_at = new Date().toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from("program_store")
      .insert([duplicated])
      .select()
      .single();

    if (insertError) {
      console.error("Erreur insert duplication:", insertError);
    } else if (inserted) {
      setPrograms((prev) => [inserted as Program, ...prev]);
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-program?id=${selectedIds[0]}`);
  };

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = programs.find((p) => p.id === currentId);
    if (!current) return;
    const newStatus = current.status === "ON" ? "OFF" : "ON";

    // optimistic
    setPrograms((prev) => prev.map((p) => (p.id === currentId ? { ...p, status: newStatus } : p)));
    setShowActionsBar(false);
    setSelectedIds([]);

    const { error } = await supabase.from("program_store").update({ status: newStatus }).eq("id", currentId);
    if (error) {
      console.error("Erreur update status:", error);
      // rollback
      setPrograms((prev) => prev.map((p) => (p.id === currentId ? { ...p, status: current.status } : p)));
    }
  };

  const handleAdd = () => router.push("/admin/create-program");

  const renderHeaderCell = (label: string, column: string) => {
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
                transition: "transform 0.2s ease",
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
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une carte" />
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
          <div className="flex justify-end mb-4 relative group">
            <Tooltip content="Ajouter une carte">
              <button
                onClick={handleAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
              >
                <Image src="/icons/plus.svg" alt="Ajouter" width={20} height={20} className="block group-hover:hidden" />
                <Image src="/icons/plus_hover.svg" alt="Ajouter" width={20} height={20} className="hidden group-hover:block" />
              </button>
            </Tooltip>
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)] p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
              <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
              <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12">Aucun programme pour le moment.</div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] bg-white" style={{ boxShadow: "0 3px 6px rgba(93, 100, 148, 0.15)" }}>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="px-4">
                    <button onClick={toggleAll} className="flex items-center justify-center h-[60px]">
                      <Image
                        src={allSelected ? "/icons/checkbox_checked.svg" : "/icons/checkbox_unchecked.svg"}
                        alt="Checkbox"
                        width={15}
                        height={15}
                      />
                    </button>
                  </th>
                  {renderHeaderCell("Statut", "status")}
                  {renderHeaderCell("Date de création", "created_at")}
                  {renderHeaderCell("Partenaire", "partner_name")}
                  {renderHeaderCell("Genre", "gender")}
                  {renderHeaderCell("Niveau", "level")}
                  {renderHeaderCell("Durée", "duration")}
                  {renderHeaderCell("Séances", "sessions")}
                  {renderHeaderCell("Téléchargements", "downloads")}
                  {renderHeaderCell("Actifs", "actifs")}
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr key={p.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="px-4">
                        <button onClick={() => toggleCheckbox(p.id)} className="flex items-center justify-center h-[60px]">
                          <Image
                            src={isSelected ? "/icons/checkbox_checked.svg" : "/icons/checkbox_unchecked.svg"}
                            alt="Checkbox"
                            width={15}
                            height={15}
                          />
                        </button>
                      </td>
                      <td className="px-4">
                        <span
                          className={`inline-flex items-center justify-center rounded-full ${
                            p.status === "ON" ? "bg-[#DCFAF1] text-[#00D591]" : "bg-[#FEF7D0] text-[#DCBC04]"
                          }`}
                          style={{ width: "40px", height: "20px", fontSize: "10px", fontWeight: 600 }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.partner_name}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.gender}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.level}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.duration}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.sessions}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.downloads}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{p.actifs}</td>
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
