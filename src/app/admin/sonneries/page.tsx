"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";
import SonneriesAdminActionsBar from "@/app/admin/components/SonneriesAdminActionsBar";
import AdminTable, {
  AdminTableColumn,
  AdminStatusBadge,
  AdminStarToggle,
} from "@/app/admin/components/AdminTable";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
import CTAButton from "@/components/CTAButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

export type RingtoneItem = {
  id: string;
  name: string;
  filename: string;
  url: string;
  duration_ms: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
};

type SortableColumn =
  | "is_active"
  | "name"
  | "filename"
  | "duration_ms"
  | "is_default"
  | "created_at";

const DEFAULT_RINGTONES: RingtoneItem[] = [
  {
    id: "1",
    name: "Bip",
    filename: "bip.mp3",
    url: "/sounds/bip.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "2",
    name: "Radar",
    filename: "radar.mp3",
    url: "/sounds/radar.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: true,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "3",
    name: "Gong",
    filename: "gong.mp3",
    url: "/sounds/gong.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "4",
    name: "Cloche",
    filename: "bell.mp3",
    url: "/sounds/bell.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T10:00:00Z",
  },
  {
    id: "5",
    name: "Arpège Succès",
    filename: "chime_asc.mp3",
    url: "/sounds/chime_asc.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "6",
    name: "Bip Sport",
    filename: "bip_sport.mp3",
    url: "/sounds/bip_sport.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "7",
    name: "Cloche Zen",
    filename: "cloche_zen.mp3",
    url: "/sounds/cloche_zen.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "8",
    name: "Gong Énergique",
    filename: "gong_court.mp3",
    url: "/sounds/gong_court.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "9",
    name: "Compte à Rebours",
    filename: "countdown_ding.mp3",
    url: "/sounds/countdown_ding.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "10",
    name: "Bol de Cristal",
    filename: "crystal_bowl.mp3",
    url: "/sounds/crystal_bowl.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "11",
    name: "Buzzer Clean",
    filename: "buzzer_clean.mp3",
    url: "/sounds/buzzer_clean.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "12",
    name: "Marimba Vital",
    filename: "marimba_pop.mp3",
    url: "/sounds/marimba_pop.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
];

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0,0 s";
  const seconds = (ms / 1000).toFixed(1).replace(".", ",");
  return `${seconds} s`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminSonneriesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [ringtones, setRingtones] = useState<RingtoneItem[]>(DEFAULT_RINGTONES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Audio preview state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingRingtone, setEditingRingtone] = useState<RingtoneItem | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFileName, setFormFileName] = useState("");
  const [formDurationMs, setFormDurationMs] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchRingtones = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ringtones");
      if (res.ok) {
        const data = await res.json();
        if (data.ringtones && Array.isArray(data.ringtones) && data.ringtones.length > 0) {
          setRingtones(data.ringtones);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Erreur fetch /api/admin/ringtones:", e);
    }

    try {
      const { data, error } = await (supabase as any)
        .from("ringtones")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        setRingtones(data as RingtoneItem[]);
      } else {
        setRingtones(DEFAULT_RINGTONES);
      }
    } catch (e) {
      console.warn("Table ringtones non disponible, utilisation du fallback:", e);
      setRingtones(DEFAULT_RINGTONES);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRingtones();
  }, [fetchRingtones]);

  const toggleSelectAll = () => {
    if (selectedIds.length === ringtones.length && ringtones.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ringtones.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePlayToggle = (ringtone: RingtoneItem) => {
    if (playingId === ringtone.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(ringtone.url);
    audioRef.current = audio;
    audio.play().catch((err) => {
      console.error("Erreur de lecture audio:", err);
      setPlayingId(null);
    });

    audio.onended = () => {
      setPlayingId(null);
    };

    setPlayingId(ringtone.id);
  };

  const handleToggleDefault = async (id: string) => {
    const target = ringtones.find((r) => r.id === id);
    if (!target) return;

    const newDefaultState = !target.is_default;

    // Optimistic update
    setRingtones((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, is_default: newDefaultState };
        }
        if (newDefaultState) {
          return { ...r, is_default: false };
        }
        return r;
      })
    );

    try {
      await fetch("/api/admin/ringtones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_default",
          id,
          is_default: newDefaultState,
        }),
      });
    } catch (e) {
      console.warn("Mise à jour par défaut API:", e);
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

  const sortedRingtones = useMemo(() => {
    const filtered = ringtones.filter((r) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.filename.toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "is_active":
          comparison = a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1;
          break;
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "filename":
          comparison = (a.filename || "").localeCompare(b.filename || "");
          break;
        case "duration_ms":
          comparison = a.duration_ms - b.duration_ms;
          break;
        case "is_default":
          comparison = a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1;
          break;
        case "created_at":
          comparison = (a.created_at || "").localeCompare(b.created_at || "");
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [ringtones, searchTerm, sortBy, sortDirection]);

  // Actions Bar handlers
  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const currentId = selectedIds[0];
    const current = ringtones.find((r) => r.id === currentId);
    if (!current) return;

    const newStatus = !current.is_active;

    setRingtones((prev) =>
      prev.map((r) => (r.id === currentId ? { ...r, is_active: newStatus } : r))
    );
    setSelectedIds([]);

    try {
      await fetch("/api/admin/ringtones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          id: currentId,
          is_active: newStatus,
        }),
      });
    } catch (e) {
      console.warn("Mise à jour statut API:", e);
    }
  };

  const handleOpenAdd = () => {
    setEditingRingtone(null);
    setFormName("");
    setFormFile(null);
    setFormFileName("");
    setFormDurationMs(0);
    setFormIsActive(true);
    setFormIsDefault(false);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    const ringtone = ringtones.find((r) => r.id === selectedIds[0]);
    if (!ringtone) return;

    setEditingRingtone(ringtone);
    setFormName(ringtone.name);
    setFormFile(null);
    setFormFileName(ringtone.filename);
    setFormDurationMs(ringtone.duration_ms);
    setFormIsActive(ringtone.is_active);
    setFormIsDefault(ringtone.is_default);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormFile(file);
    setFormFileName(file.name);
    setFormError(null);

    // Auto-detect duration from audio file
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      const durationMs = Math.round(audio.duration * 1000);
      setFormDurationMs(durationMs);
      URL.revokeObjectURL(audio.src);
    };
  };

  const handleSaveRingtone = async () => {
    if (!formName.trim()) {
      setFormError("Veuillez saisir un nom pour la sonnerie.");
      return;
    }

    if (!editingRingtone && !formFile) {
      setFormError("Veuillez sélectionner un fichier audio MP3.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      let finalUrl = editingRingtone?.url || "";
      let finalFilename = editingRingtone?.filename || formFileName;
      let finalDuration = formDurationMs || editingRingtone?.duration_ms || 1500;

      if (formFile) {
        finalFilename = formFile.name;
        try {
          const fileExt = formFile.name.split(".").pop();
          const cleanFileName = `${Date.now()}_${formName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await (supabase as any)
            .storage
            .from("ringtones")
            .upload(cleanFileName, formFile);

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = (supabase as any)
              .storage
              .from("ringtones")
              .getPublicUrl(cleanFileName);
            finalUrl = publicUrlData.publicUrl;
          } else {
            finalUrl = URL.createObjectURL(formFile);
          }
        } catch {
          finalUrl = URL.createObjectURL(formFile);
        }
      }

      if (editingRingtone) {
        const updatedItem: RingtoneItem = {
          ...editingRingtone,
          name: formName.trim(),
          filename: finalFilename,
          url: finalUrl,
          duration_ms: finalDuration,
          is_active: formIsActive,
          is_default: formIsDefault,
        };

        setRingtones((prev) =>
          prev.map((r) => {
            if (r.id === editingRingtone.id) return updatedItem;
            if (formIsDefault && r.is_default) return { ...r, is_default: false };
            return r;
          })
        );

        try {
          await fetch("/api/admin/ringtones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save", ringtone: updatedItem }),
          });
        } catch (e) {
          console.warn("Sauvegarde API:", e);
        }
      } else {
        const newItem: RingtoneItem = {
          id: String(Date.now()),
          name: formName.trim(),
          filename: finalFilename,
          url: finalUrl,
          duration_ms: finalDuration,
          is_active: formIsActive,
          is_default: formIsDefault,
          created_at: new Date().toISOString(),
        };

        setRingtones((prev) => {
          const list = formIsDefault
            ? prev.map((r) => (r.is_default ? { ...r, is_default: false } : r))
            : prev;
          return [newItem, ...list];
        });

        try {
          await fetch("/api/admin/ringtones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save", ringtone: newItem }),
          });
        } catch (e) {
          console.warn("Ajout API:", e);
        }
      }

      setIsAddEditModalOpen(false);
      setSelectedIds([]);
    } catch (e: any) {
      setFormError(e?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;

    setRingtones((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    const deletedIds = [...selectedIds];
    setSelectedIds([]);
    setIsDeleteModalOpen(false);

    try {
      await fetch("/api/admin/ringtones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids: deletedIds }),
      });
    } catch (e) {
      console.warn("Suppression API:", e);
    }
  };

  const columns: AdminTableColumn<RingtoneItem>[] = useMemo(
    () => [
      {
        key: "is_active",
        label: "Statut",
        width: "w-[100px]",
        render: (item) => <AdminStatusBadge isActive={item.is_active} />,
      },
      {
        key: "ecoute",
        label: "Ecoute",
        width: "w-[80px]",
        sortable: false,
        render: (item) => {
          const isPlaying = playingId === item.id;
          return (
            <button
              type="button"
              onClick={() => handlePlayToggle(item)}
              className="w-[22px] h-[22px] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title={isPlaying ? "Mettre en pause" : "Écouter"}
            >
              <Image
                src={isPlaying ? "/icons/timer_pause.svg" : "/icons/timer_play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                width={20}
                height={20}
                className="object-contain"
              />
            </button>
          );
        },
      },
      {
        key: "name",
        label: "Sonnerie",
        width: "w-[140px]",
        render: (item) => item.name,
      },
      {
        key: "filename",
        label: "Fichier",
        width: "w-[180px]",
        render: (item) => item.filename,
      },
      {
        key: "duration_ms",
        label: "Durée",
        width: "w-[120px]",
        render: (item) => (
          <span className="font-semibold text-[#3A416F] tabular-nums">
            {formatDuration(item.duration_ms)}
          </span>
        ),
      },
      {
        key: "is_default",
        label: "Par défaut",
        width: "w-[130px]",
        align: "center",
        render: (item) => (
          <AdminStarToggle
            isFeatured={item.is_default}
            onToggle={() => handleToggleDefault(item.id)}
            title={
              item.is_default
                ? "Sonnerie par défaut"
                : "Définir comme sonnerie par défaut"
            }
          />
        ),
      },
      {
        key: "created_at",
        label: "Date d'ajout",
        width: "w-[130px]",
        render: (item) => formatDate(item.created_at),
      },
    ],
    [playingId]
  );

  const showActionsBar = selectedIds.length > 0;
  const singleSelectedRingtone =
    selectedIds.length === 1 ? ringtones.find((r) => r.id === selectedIds[0]) : null;

  return (
    <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl relative z-10">
        <h2 className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Sonneries
        </h2>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              placeholder="Rechercher une sonnerie"
              value={searchTerm}
              onChange={setSearchTerm}
              isAdmin={true}
            />
          </div>
        </div>

        {/* Action Bar (Top Right) */}
        {showActionsBar ? (
          <SonneriesAdminActionsBar
            selectedIds={selectedIds}
            selectedStatus={singleSelectedRingtone?.is_active ?? null}
            onDelete={() => setIsDeleteModalOpen(true)}
            onEdit={handleOpenEdit}
            onToggleStatus={handleToggleStatus}
            onAdd={handleOpenAdd}
          />
        ) : (
          <div className="flex justify-end mb-4">
            <Tooltip content="Ajouter une sonnerie" delay={0}>
              <button
                onClick={handleOpenAdd}
                className="rounded-full transition-colors duration-200 flex items-center justify-center group"
                aria-label="Ajouter une sonnerie"
              >
                <Image
                  src="/icons/admin_plus.svg"
                  alt="Ajouter"
                  width={20}
                  height={20}
                  className="block group-hover:hidden"
                />
                <Image
                  src="/icons/admin_plus_hover.svg"
                  alt="Ajouter"
                  width={20}
                  height={20}
                  className="hidden group-hover:block"
                />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Table partagée Admin */}
        <AdminTable
          columns={columns}
          data={sortedRingtones}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(col) => handleSort(col as SortableColumn)}
          getItemId={(item) => item.id}
          emptyMessage={
            searchTerm.trim()
              ? "Aucune sonnerie ne correspond à votre recherche."
              : "Aucune sonnerie configurée."
          }
        />
      </div>

      {/* Modal Suppression */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title="Supprimer la sonnerie"
        variant="warning"
        messageTitle="Êtes-vous sûr de vouloir supprimer cette sonnerie ?"
        messageDescription="Cette action est irréversible. Les utilisateurs utilisant actuellement cette sonnerie repasseront automatiquement sur la sonnerie par défaut."
        confirmLabel="Supprimer"
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Modal Ajout / Modification */}
      <Modal
        open={isAddEditModalOpen}
        title={editingRingtone ? "Modifier la sonnerie" : "Ajouter une sonnerie"}
        onClose={() => setIsAddEditModalOpen(false)}
        className="max-w-[480px]"
      >
        <div className="flex flex-col gap-5 pt-2">
          {formError && (
            <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4F4E] text-[13px] font-medium">
              {formError}
            </div>
          )}

          {/* Nom de la sonnerie */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#3A416F]">
              Nom de la sonnerie
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Radar, Bip, Gong..."
              className="h-[45px] w-full text-[15px] font-medium placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] focus:outline-none focus:ring-2 focus:ring-[#5D6494]"
            />
          </div>

          {/* Fichier Audio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-bold text-[#3A416F]">
              Fichier audio (MP3)
            </label>
            <div className="relative border border-dashed border-[#D7D4DC] hover:border-[#7069FA] rounded-[10px] p-4 text-center cursor-pointer transition-colors bg-[#FAFAFC]">
              <input
                type="file"
                accept="audio/mp3,audio/mpeg,audio/wav"
                onChange={handleAudioFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7069FA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span className="text-[13px] font-semibold text-[#5D6494]">
                  {formFileName ? formFileName : "Choisir un fichier audio (.mp3)"}
                </span>
                {formDurationMs > 0 && (
                  <span className="text-[11px] font-bold text-[#00D591]">
                    Durée détectée : {formatDuration(formDurationMs)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#ECE9F1]">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#3A416F]">
                Activer la sonnerie (ON)
              </span>
              <ToggleSwitch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[14px] font-bold text-[#3A416F] block">
                  Sonnerie par défaut
                </span>
                <span className="text-[12px] text-[#C2BFC6] font-medium">
                  Attribuée automatiquement aux nouveaux utilisateurs
                </span>
              </div>
              <ToggleSwitch
                checked={formIsDefault}
                onCheckedChange={setFormIsDefault}
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#ECE9F1]">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-[14px] font-semibold text-[#5D6494] hover:text-[#3A416F] transition-colors"
            >
              Annuler
            </button>
            <CTAButton
              onClick={handleSaveRingtone}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? "Enregistrement..." : editingRingtone ? "Enregistrer" : "Ajouter"}
            </CTAButton>
          </div>
        </div>
      </Modal>
    </main>
  );
}
