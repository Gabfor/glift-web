"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export type RingtoneItem = {
  id: string;
  name: string;
  filename: string;
  url: string;
  duration_ms: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  icon_url?: string;
  image_alt?: string;
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
    id: "13",
    name: "Clochettes de Noël",
    filename: "clochettes_noel.mp3",
    url: "/sounds/clochettes_noel.mp3",
    duration_ms: 2500,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T17:45:00Z",
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
    id: "14",
    name: "Frisson d'Halloween",
    filename: "frisson_halloween.mp3",
    url: "/sounds/frisson_halloween.mp3",
    duration_ms: 2400,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T18:00:00Z",
  },
  {
    id: "3",
    name: "Gong",
    filename: "gong.mp3",
    url: "/sounds/gong.mp3",
    duration_ms: 2520,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T10:00:00Z",
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
    id: "12",
    name: "Marimba Vital",
    filename: "marimba_pop.mp3",
    url: "/sounds/marimba_pop.mp3",
    duration_ms: 2200,
    is_active: true,
    is_default: false,
    created_at: "2026-11-07T16:00:00Z",
  },
  {
    id: "2",
    name: "Radar",
    filename: "radar.mp3",
    url: "/sounds/radar.mp3",
    duration_ms: 1567,
    is_active: true,
    is_default: true,
    created_at: "2026-11-07T10:00:00Z",
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
  const router = useRouter();
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
          comparison = (a.name || "").localeCompare(b.name || "", "fr", {
            sensitivity: "base",
          });
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
    router.push("/create-sonnerie");
  };

  const handleOpenEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/create-sonnerie?id=${selectedIds[0]}`);
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
        width: "w-[240px]",
        render: (item) => (
          <Link
            href={`/create-sonnerie?id=${item.id}`}
            className="hover:text-[#3A416F] transition-colors cursor-pointer flex items-center gap-[10px] h-[60px]"
          >
            {item.icon_url && (
              <span className="w-[25px] h-[25px] shrink-0 flex items-center justify-center">
                <img
                  src={item.icon_url}
                  alt={item.image_alt || item.name}
                  width={25}
                  height={25}
                  className="w-[25px] h-[25px] object-contain block"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </span>
            )}
            <span className="truncate leading-[20px]">{item.name}</span>
          </Link>
        ),
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
        <h2 className="text-[24px] sm:text-[30px] font-bold text-[#3A416F] text-center mb-[40px]">
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
    </main>
  );
}
