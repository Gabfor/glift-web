"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import SearchBar from "@/components/SearchBar";
import UserAdminActionsBar from "@/app/admin/components/UserAdminActionsBar";
import AdminUserEditor from "./AdminUserEditor";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import ExportIcon from "/public/icons/export.svg";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  name: string | null;
  subscription_plan: string | null;
  premium_trial_started_at: string | null;
  gender: string | null;
  birth_date: string | null;
  email_verified: boolean | null;
  grace_expires_at: string | null;
  email_confirmed_at: string | null;
  country: string | null;
  experience: string | null;
  main_goal: string | null;
  training_place: string | null;
  weekly_sessions: string | null;
  supplements: string | null;
};

const MS_IN_DAY = 86_400_000;
const TRIAL_DURATION_DAYS = 30;
const GRACE_PERIOD_DAYS = 7;

const SUBSCRIPTION_LABELS: Record<string, string> = {
  premium: "Premium",
  basic: "Starter",
};

const normalizePlan = (plan: string | null) => {
  if (!plan) {
    return "basic";
  }

  const lower = plan.toLowerCase();
  if (lower === "premium") {
    return "premium";
  }

  return "basic";
};

const formatSubscription = (plan: string | null) =>
  SUBSCRIPTION_LABELS[normalizePlan(plan)] ?? "Starter";

const formatDays = (days: number) => {
  if (days <= 0) {
    return "0 jour";
  }

  return `${days} jour${days > 1 ? "s" : ""}`;
};

const formatSeniority = (createdAt: string | null | undefined) => {
  if (!createdAt) {
    return "—";
  }

  const timestamp = Date.parse(createdAt);

  if (Number.isNaN(timestamp)) {
    return "—";
  }

  const diffDays = Math.floor((Date.now() - timestamp) / MS_IN_DAY);

  return formatDays(Math.max(diffDays, 0));
};

const isWithinDays = (date: string | null | undefined, days: number) => {
  if (!date) {
    return false;
  }

  const timestamp = Date.parse(date);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= days * MS_IN_DAY;
};

const isInTrial = (user: AdminUser) => {
  if (normalizePlan(user.subscription_plan) !== "premium") {
    return false;
  }

  return isWithinDays(user.premium_trial_started_at, TRIAL_DURATION_DAYS);
};

const calculateAge = (birthDate: string | null | undefined) => {
  if (!birthDate) {
    return null;
  }

  const parsed = Date.parse(birthDate);

  if (Number.isNaN(parsed)) {
    return null;
  }

  const birth = new Date(parsed);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const computeStatus = (user: AdminUser) => {
  if (user.email_verified) {
    return "Validé";
  }

  return isWithinDays(user.created_at, GRACE_PERIOD_DAYS)
    ? "En attente"
    : "A supprimer";
};

const formatDate = (date: string | null | undefined) => {
  if (!date) {
    return "";
  }

  const timestamp = Date.parse(date);

  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Date(timestamp).toLocaleDateString("fr-FR");
};

const formatDateTime = (date: string | null | undefined) => {
  if (!date) {
    return "";
  }

  const timestamp = Date.parse(date);

  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Date(timestamp).toLocaleString("fr-FR");
};

const formatTrialEndDate = (user: AdminUser) => {
  if (!user.premium_trial_started_at) {
    return "";
  }

  const startTimestamp = Date.parse(user.premium_trial_started_at);

  if (Number.isNaN(startTimestamp)) {
    return "";
  }

  const endTimestamp = startTimestamp + TRIAL_DURATION_DAYS * MS_IN_DAY;

  return new Date(endTimestamp).toLocaleDateString("fr-FR");
};

const calculateProfileCompletion = (user: AdminUser) => {
  const normalizedName = user.name?.trim() ?? "";
  const completionEntries = [
    Boolean(user.gender),
    normalizedName.length > 0,
    Boolean(user.birth_date),
    Boolean(user.country),
    Boolean(user.experience),
    Boolean(user.main_goal),
    Boolean(user.training_place),
    Boolean(user.weekly_sessions),
    user.supplements !== null && user.supplements !== undefined
      ? user.supplements.trim().length > 0
      : false,
    Boolean(user.email),
  ];

  if (completionEntries.length === 0) {
    return 0;
  }

  const completed = completionEntries.filter(Boolean).length;

  return Math.round((completed / completionEntries.length) * 100);
};

const escapeCsvValue = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const escapedValue = stringValue.replace(/"/g, '""');

  return `"${escapedValue}"`;
};

const STATUS_BADGE_BASE_CLASS =
  "inline-flex h-[20px] items-center justify-center rounded-[25px] text-[10px] font-semibold px-2";

const statusClassName = (status: string) => {
  switch (status) {
    case "Validé":
      return "bg-[#DCFAF1] text-[#00D591]";
    case "En attente":
      return "bg-[#FEF7D0] text-[#DCBC04]";
    default:
      return "bg-[#FFE3E3] text-[#EF4F4E]";
  }
};

type SortableColumn =
  | "created_at"
  | "name"
  | "email"
  | "trial"
  | "subscription"
  | "seniority"
  | "gender"
  | "age"
  | "status";

export default function AdminUsersPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const editingUserId = searchParams?.get("id") ?? null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortableColumn>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    "desc",
  );

  useEffect(() => {
    setShowActionsBar(!editingUserId && selectedIds.length > 0);
  }, [editingUserId, selectedIds]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Erreur lors du chargement des utilisateurs", payload);
        setError("Impossible de récupérer la liste des utilisateurs.");
        setLoading(false);
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { users?: Partial<AdminUser>[] }
        | null;

      const normalized = ((payload?.users ?? []) as Partial<AdminUser>[]).map(
        (user) => ({
          id: user.id ?? "",
          email: user.email ?? "",
          created_at: user.created_at ?? new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at ?? null,
          name: user.name ?? null,
          subscription_plan: normalizePlan(user.subscription_plan ?? null),
          premium_trial_started_at: user.premium_trial_started_at ?? null,
          gender: user.gender ?? null,
          birth_date: user.birth_date ?? null,
          email_verified: user.email_verified ?? false,
          grace_expires_at: user.grace_expires_at ?? null,
          email_confirmed_at: user.email_confirmed_at ?? null,
          country: user.country ?? null,
          experience: user.experience ?? null,
          main_goal: user.main_goal ?? null,
          training_place: user.training_place ?? null,
          weekly_sessions: user.weekly_sessions ?? null,
          supplements: user.supplements ?? null,
        }),
      );

      setUsers(normalized);
      setSelectedIds([]);
      setLoading(false);
    } catch (rpcError) {
      console.error("Erreur lors du chargement des utilisateurs", rpcError);
      setError("Impossible de récupérer la liste des utilisateurs.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const toggleCheckbox = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleAll = () => {
    if (users.length === selectedIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((user) => user.id));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error("Suppression impossible", payload ?? response.statusText);
        setError(
          payload?.error ??
            "Une erreur est survenue lors de la suppression des utilisateurs.",
        );
        return;
      }

      setUsers((current) =>
        current.filter((user) => !selectedIds.includes(user.id)),
      );
      setSelectedIds([]);
      setError(null);
    } catch (deleteError) {
      console.error("Suppression impossible", deleteError);
      setError("Une erreur est survenue lors de la suppression des utilisateurs.");
    }
  };

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) {
      return;
    }

    const userId = selectedIds[0];
    const targetUser = users.find((user) => user.id === userId);

    if (!targetUser) {
      return;
    }

    if (targetUser.email_verified) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, verified: true }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        console.error(
          "Mise à jour du statut impossible",
          payload ?? response.statusText,
        );

        if (response.status === 401 || response.status === 403) {
          setError("Vous n'avez pas la permission de mettre à jour ce statut.");
        } else {
          setError("Impossible de mettre à jour le statut de l'utilisateur.");
        }

        return;
      }
    } catch (statusError) {
      console.error("Mise à jour du statut impossible", statusError);
      setError("Impossible de mettre à jour le statut de l'utilisateur.");
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, email_verified: true } : user,
      ),
    );
    setError(null);
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      return;
    }

    const userId = selectedIds[0];

    const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
    nextParams.set("id", userId);

    const query = nextParams.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  };

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return users;
    }

    return users.filter((user) =>
      user.email.toLowerCase().includes(normalizedTerm),
    );
  }, [users, searchTerm]);

  const handleSort = (column: SortableColumn) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  };

  const sortedUsers = useMemo(() => {
    const getSortValue = (user: AdminUser): string | number => {
      switch (sortBy) {
        case "name":
          return user.name?.toLowerCase() ?? "";
        case "email":
          return user.email.toLowerCase();
        case "trial":
          return isInTrial(user) ? 1 : 0;
        case "subscription":
          return formatSubscription(user.subscription_plan).toLowerCase();
        case "seniority":
        case "created_at": {
          const timestamp = Date.parse(user.created_at);
          return Number.isNaN(timestamp) ? 0 : timestamp;
        }
        case "gender":
          return user.gender?.toLowerCase() ?? "";
        case "age":
          return calculateAge(user.birth_date) ?? -1;
        case "status":
          return computeStatus(user).toLowerCase();
        default:
          return 0;
      }
    };

    const sorted = [...filteredUsers];

    sorted.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue);
      const bString = String(bValue);
      const comparison = aString.localeCompare(bString, "fr", {
        sensitivity: "base",
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredUsers, sortBy, sortDirection]);

  const handleExport = useCallback(() => {
    if (sortedUsers.length === 0) {
      return;
    }

    const headers = [
      "Date de création",
      "Date de connexion",
      "Prénom",
      "Sexe",
      "Email",
      "Date de naissance",
      "Âge",
      "Statut",
      "Date fin de validation",
      "Date de validation",
      "Abonnement",
      "Période d'essai",
      "Date fin période d'essai",
      "% remplissage profil",
      "Pays",
      "Années",
      "Objectif",
      "Lieu",
      "Séances",
      "Compléments",
    ];

    const rows = sortedUsers.map((user) => {
      const trialActive = isInTrial(user);
      const age = calculateAge(user.birth_date);
      const status = computeStatus(user);
      const profileCompletion = `${calculateProfileCompletion(user)}%`;

      return [
        formatDateTime(user.created_at),
        formatDateTime(user.last_sign_in_at),
        user.name ?? "",
        user.gender ?? "",
        user.email,
        formatDate(user.birth_date),
        typeof age === "number" ? age : "",
        status,
        formatDate(user.grace_expires_at),
        formatDateTime(user.email_confirmed_at),
        formatSubscription(user.subscription_plan),
        trialActive ? "Oui" : "Non",
        formatTrialEndDate(user),
        profileCompletion,
        user.country ?? "",
        user.experience ?? "",
        user.main_goal ?? "",
        user.training_place ?? "",
        user.weekly_sessions ?? "",
        user.supplements ?? "",
      ]
        .map(escapeCsvValue)
        .join(";");
    });

    const csvContent = [headers.map(escapeCsvValue).join(";"), ...rows].join("\r\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSuffix = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `utilisateurs-${dateSuffix}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedUsers]);

  const isExportDisabled = sortedUsers.length === 0;

  const renderHeaderCell = (
    label: string,
    column: SortableColumn,
    className = "",
  ) => {
    const isActive = sortBy === column;
    const isAscending = sortDirection === "asc";
    const icon = isActive ? ChevronIcon : ChevronGreyIcon;

    return (
      <th
        className={`px-4 font-semibold text-[#3A416F] cursor-pointer select-none ${className}`}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className="relative ml-[3px] mt-[3px] h-[8px] w-[8px]">
            <Image
              src={icon}
              alt=""
              fill
              style={{
                objectFit: "contain",
                transform: isActive
                  ? isAscending
                    ? "rotate(-180deg)"
                    : "rotate(0deg)"
                  : "rotate(0deg)",
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
        {editingUserId ? (
          <AdminUserEditor
            userId={editingUserId}
            onClose={() => {
              const nextParams = new URLSearchParams(
                searchParams?.toString() ?? "",
              );
              nextParams.delete("id");
              const query = nextParams.toString();
              router.push(query ? `/admin/users?${query}` : "/admin/users");
            }}
          />
        ) : (
          <>
            <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
              Utilisateurs
            </h2>

            <div className="flex justify-center mb-[10px]">
              <div className="w-[368px]">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Rechercher par email"
                />
              </div>
            </div>

            <div className="flex justify-end mb-[6px] min-h-[40px]">
              {showActionsBar && (
                <UserAdminActionsBar
                  selectedIds={selectedIds}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  onEdit={handleEdit}
                />
              )}
            </div>

            {error && (
              <div className="mb-4 text-center text-sm text-[#EF4F4E] font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
                <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
                <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[#ECE9F1] h-[60px]">
                      <tr>
                        <th className="w-[47px] px-4">
                          <button onClick={toggleAll} aria-label="Tout sélectionner">
                            <Image
                              src={
                                users.length > 0 && users.length === selectedIds.length
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
                        {renderHeaderCell("Période de test", "trial")}
                        {renderHeaderCell("Abonnement", "subscription")}
                        {renderHeaderCell("Ancienneté", "seniority")}
                        {renderHeaderCell("Sexe", "gender")}
                        {renderHeaderCell("Age", "age")}
                        {renderHeaderCell("Statut", "status")}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const trialActive = isInTrial(user);
                  const age = calculateAge(user.birth_date);
                  const status = computeStatus(user);

                  const genderLower = user.gender?.toLowerCase() ?? "";
                  const genderIcon =
                    genderLower === "homme"
                      ? "/icons/homme.svg"
                      : genderLower === "femme"
                      ? "/icons/femme.svg"
                      : null;

                  return (
                    <tr key={user.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="w-[47px] px-4 align-middle">
                        <button
                          onClick={() => toggleCheckbox(user.id)}
                          aria-label={
                            isSelected
                              ? "Désélectionner l'utilisateur"
                              : "Sélectionner l'utilisateur"
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
                        {user.name ?? "—"}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {user.email}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {trialActive ? "Oui" : "Non"}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {formatSubscription(user.subscription_plan)}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {formatSeniority(user.created_at)}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {genderIcon ? (
                          <div className="relative h-5 w-5">
                            <Image src={genderIcon} alt={user.gender ?? "Sexe"} fill />
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] align-middle">
                        {typeof age === "number" ? `${age} ans` : "—"}
                      </td>
                      <td className="px-4 align-middle">
                        <span
                          className={`${STATUS_BADGE_BASE_CLASS} ${statusClassName(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      </tr>
                    );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex items-center justify-end gap-[20px]">
                  <button
                    type="button"
                    className={`h-10 border border-[#D7D4DC] rounded-[5px] px-3 py-2 flex items-center justify-between text-[16px] font-semibold text-[#3A416F] bg-white transition ${
                      isExportDisabled
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:border-[#C2BFC6]"
                    }`}
                    onClick={handleExport}
                    disabled={isExportDisabled}
                  >
                    <div className="flex items-center gap-2 pr-[10px]">
                      <Image src={ExportIcon} alt="" width={10} height={13} />
                      <span>Export</span>
                    </div>
                    <Image src={ChevronIcon} alt="" width={8.73} height={6.13} />
                  </button>
                  <span className="text-[14px] font-semibold text-[#5D6494]">
                    {`${sortedUsers.length} résultats`}
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
