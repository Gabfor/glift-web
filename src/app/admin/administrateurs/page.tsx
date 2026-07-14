"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import GliftLoader from "@/components/ui/GliftLoader";
import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at: string | null;
  statut: boolean;
  langue: string;
}

type SortableColumn = "name" | "email" | "created_at" | "last_sign_in_at" | "langue" | "statut";

export default function AdminUsersManagementPage() {
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting states
  const [sortBy, setSortBy] = useState<SortableColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Edit modal states (for editing only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Delete states
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Icons hover states
  const [deleteIcon, setDeleteIcon] = useState("/icons/delete.svg");
  const [editIcon, setEditIcon] = useState("/icons/edit_program_purple.svg");

  // Fetch admin list
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/admins");
      if (!res.ok) {
        throw new Error("Impossible de charger les administrateurs.");
      }
      const data = await res.json();
      setAdmins(data.admins || []);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de la récupération des administrateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAddPage = () => {
    router.push("/create-admin");
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/create-admin?id=${selectedIds[0]}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setActionError("Le nom et l'email sont obligatoires.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      const url = editingAdmin ? `/api/admin/admins/${editingAdmin.id}` : "/api/admin/admins";
      const method = editingAdmin ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'enregistrement.");
      }

      await fetchAdmins();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Erreur de communication avec le serveur.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.includes(currentUser?.id || "")) {
      setError("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    setDeletingIds(selectedIds);
  };

  const executeDelete = async () => {
    try {
      setActionLoading(true);
      setError(null);

      for (const id of deletingIds) {
        const res = await fetch("/api/admin/admins", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Une erreur est survenue lors de la suppression.");
        }
      }

      setAdmins((current) => current.filter((admin) => !deletingIds.includes(admin.id)));
      setSelectedIds([]);
      setDeletingIds([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la suppression de l'administrateur.");
    } finally {
      setActionLoading(false);
    }
  };

  // Checkbox functions
  const toggleCheckbox = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    if (filteredAdmins.length === selectedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAdmins.map((a) => a.id));
    }
  };

  // Sorting function
  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Search filtering
  const filteredAdmins = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(term) ||
        admin.name.toLowerCase().includes(term)
    );
  }, [admins, searchTerm]);

  // Sorting
  const sortedAdmins = useMemo(() => {
    const sorted = [...filteredAdmins];
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortBy === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === "email") {
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
      } else if (sortBy === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortBy === "last_sign_in_at") {
        aVal = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        bVal = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      } else if (sortBy === "langue") {
        aVal = a.langue.toLowerCase();
        bVal = b.langue.toLowerCase();
      } else if (sortBy === "statut") {
        aVal = a.statut ? 1 : 0;
        bVal = b.statut ? 1 : 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal);
      const strB = String(bVal);
      return sortDirection === "asc"
        ? strA.localeCompare(strB, "fr")
        : strB.localeCompare(strA, "fr");
    });
    return sorted;
  }, [filteredAdmins, sortBy, sortDirection]);

  // Header Cell Renderer
  const renderHeaderCell = (label: string, column: SortableColumn, className = "") => {
    const isActive = sortBy === column;
    const isAscending = sortDirection === "asc";
    const icon = isActive ? "/icons/chevron.svg" : "/icons/chevron_grey.svg";

    return (
      <th
        className={`px-4 font-semibold text-[#3A416F] cursor-pointer select-none align-middle ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="relative ml-[3px] mt-[3px] h-[8px] w-[8px]">
            <Image
              src={icon}
              alt=""
              fill
              className="object-contain object-bottom"
              style={{
                transform: isActive
                  ? isAscending
                    ? "rotate(-180deg)"
                    : "rotate(0deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s ease-in-out",
              }}
            />
          </span>
        </div>
      </th>
    );
  };

  const hasSelection = selectedIds.length > 0;
  const hasSingleSelection = selectedIds.length === 1;
  const selectionContainsSelf = selectedIds.includes(currentUser?.id || "");

  if (loading && admins.length === 0) {
    return <GliftLoader isAdmin />;
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl">
        {/* Title */}
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Administrateurs
        </h2>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher par nom ou email"
            />
          </div>
        </div>

        {/* Action Header Panel */}
        <div className="flex justify-end items-center mb-4 gap-4">
          {/* Actions Bar */}
          {hasSelection && (
            <>
              {hasSingleSelection && (
                <Tooltip content="Modifier" delay={0}>
                  <button
                    onClick={handleEdit}
                    onMouseEnter={() => setEditIcon("/icons/edit_program_purple_hover.svg")}
                    onMouseLeave={() => setEditIcon("/icons/edit_program_purple.svg")}
                    aria-label="Modifier l'administrateur"
                  >
                    <Image src={editIcon} alt="Modifier" width={20} height={20} />
                  </button>
                </Tooltip>
              )}

              <Tooltip content="Supprimer" delay={0}>
                <button
                  onClick={selectionContainsSelf ? undefined : handleDeleteSelected}
                  onMouseEnter={() => !selectionContainsSelf && setDeleteIcon("/icons/delete_hover.svg")}
                  onMouseLeave={() => !selectionContainsSelf && setDeleteIcon("/icons/delete.svg")}
                  className={selectionContainsSelf ? "opacity-30 cursor-not-allowed" : ""}
                  aria-label="Supprimer la sélection"
                >
                  <Image src={deleteIcon} alt="Supprimer" width={20} height={20} />
                </button>
              </Tooltip>
            </>
          )}

          {hasSelection && <div className="w-px h-5 bg-[#ECE9F1]" />}

          {/* Plus button — navigates to dedicated creation page */}
          <Tooltip content="Ajouter un administrateur" delay={0}>
            <button
              onClick={openAddPage}
              className="rounded-full transition-colors duration-200 flex items-center justify-center group"
              aria-label="Ajouter un administrateur"
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

        {error && (
          <div className="mb-4 text-center text-sm text-[#EF4F4E] font-semibold">
            {error}
          </div>
        )}

        {/* Admins Table */}
        <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#ECE9F1] h-[60px]">
              <tr>
                <th className="w-[47px] px-4 align-middle">
                  <button onClick={toggleAll} aria-label="Tout sélectionner">
                    <Image
                      src={
                        filteredAdmins.length > 0 && filteredAdmins.length === selectedIds.length
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
                {renderHeaderCell("Prénom", "name")}
                {renderHeaderCell("Email", "email")}
                {renderHeaderCell("Créé le", "created_at")}
                {renderHeaderCell("Dernière connexion", "last_sign_in_at")}
                {renderHeaderCell("Langue", "langue")}
                {renderHeaderCell("Statut", "statut")}
              </tr>
            </thead>
            <tbody>
              {sortedAdmins.map((admin) => {
                const isSelected = selectedIds.includes(admin.id);
                return (
                  <tr key={admin.id} className="border-b border-[#ECE9F1] h-[60px]">
                    <td className="w-[47px] px-4 align-middle">
                      <button
                        onClick={() => toggleCheckbox(admin.id)}
                        aria-label={
                          isSelected
                            ? "Désélectionner l'administrateur"
                            : "Sélectionner l'administrateur"
                        }
                      >
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
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      <button
                        onClick={() => router.push(`/create-admin?id=${admin.id}`)}
                        className="hover:text-[#3A416F] transition-colors text-left font-semibold"
                      >
                        {admin.name}
                      </button>
                      {admin.id === currentUser?.id && (
                        <span className="ml-2 px-2 py-0.5 rounded-[12px] bg-[#DCFAF1] text-[#00D591] text-[11px] font-bold">
                          Vous
                        </span>
                      )}
                    </td>
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      <button
                        onClick={() => router.push(`/create-admin?id=${admin.id}`)}
                        className="hover:text-[#3A416F] transition-colors text-left font-semibold"
                      >
                        {admin.email}
                      </button>
                    </td>
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      {new Date(admin.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      {admin.last_sign_in_at
                        ? new Date(admin.last_sign_in_at).toLocaleString("fr-FR")
                        : "Jamais"}
                    </td>
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      <div className="flex items-center">
                        {admin.langue === "Français" && (
                          <div className="relative w-[24px] h-[16px] rounded-[3px] overflow-hidden border border-[#ECE9F1]">
                            <Image
                              src="/flags/france.svg"
                              alt="Français"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 font-semibold text-[#5D6494] align-middle">
                      {admin.statut ? (
                        <span className="inline-flex h-[20px] items-center justify-center rounded-[25px] text-[10px] font-semibold px-2 bg-[#DCFAF1] text-[#00D591]">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex h-[20px] items-center justify-center rounded-[25px] text-[10px] font-semibold px-2 bg-[#FFE3E3] text-[#EF4F4E]">
                          Inactif
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-[#5D6494] text-[15px]">
                    Aucun administrateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Delete Confirmation Dialog */}
      {deletingIds.length > 0 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-[400px] bg-white rounded-[20px] p-6 shadow-xl border border-[#D7D4DC]">
            <h2 className="text-[18px] font-bold text-[#2E3271] mb-2">
              Confirmer la suppression
            </h2>
            <p className="text-[#5D6494] text-[15px] mb-6">
              Êtes-vous sûr de vouloir supprimer {deletingIds.length > 1 ? "ces comptes administrateurs" : "ce compte administrateur"} ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingIds([])}
                className="h-[45px] px-5 rounded-[5px] font-semibold text-[#5D6494] hover:bg-[#F4F5FE] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={executeDelete}
                disabled={actionLoading}
                className="h-[45px] px-6 rounded-[5px] bg-[#EF4F4E] text-white font-semibold hover:bg-[#BA2524] transition-colors"
              >
                {actionLoading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
