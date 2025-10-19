"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import SearchBar from "@/components/SearchBar";
import { createClientComponentClient } from "@/lib/supabase/client";

import UserAdminActionsBar from "@/app/admin/components/UserAdminActionsBar";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  name: string | null;
  subscription_plan: string | null;
  premium_trial_started_at: string | null;
  gender: string | null;
  birth_date: string | null;
  email_verified: boolean | null;
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

const statusClassName = (status: string) => {
  switch (status) {
    case "Validé":
      return "text-[#00D591]";
    case "En attente":
      return "text-[#F59E0B]";
    default:
      return "text-[#EF4F4E]";
  }
};

export default function AdminUsersPage() {
  const supabase = createClientComponentClient();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    setShowActionsBar(selectedIds.length > 0);
  }, [selectedIds]);

  useEffect(() => {
    if (editingUserId && !selectedIds.includes(editingUserId)) {
      setEditingUserId(null);
    }
  }, [editingUserId, selectedIds]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("admin.list_users");

    if (rpcError) {
      console.error("Erreur lors du chargement des utilisateurs", rpcError);
      setError("Impossible de récupérer la liste des utilisateurs.");
      setLoading(false);
      return;
    }

    const normalized = ((data ?? []) as Partial<AdminUser>[]).map((user) => ({
      id: user.id ?? "",
      email: user.email ?? "",
      created_at: user.created_at ?? new Date().toISOString(),
      name: user.name ?? null,
      subscription_plan: normalizePlan(user.subscription_plan ?? null),
      premium_trial_started_at: user.premium_trial_started_at ?? null,
      gender: user.gender ?? null,
      birth_date: user.birth_date ?? null,
      email_verified: user.email_verified ?? false,
    }));

    setUsers(normalized);
    setSelectedIds([]);
    setEditingUserId(null);
    setLoading(false);
  }, [supabase]);

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
     setEditingUserId(null);
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

    const nextStatus = !targetUser.email_verified;

    const { error: statusError } = await supabase.rpc(
      "admin.set_user_email_verification",
      {
        target_user: userId,
        verified: nextStatus,
      },
    );

    if (statusError) {
      console.error("Mise à jour du statut impossible", statusError);
      setError("Impossible de mettre à jour le statut de l'utilisateur.");
      return;
    }

   setUsers((current) =>
     current.map((user) =>
       user.id === userId ? { ...user, email_verified: nextStatus } : user,
     ),
   );
    setError(null);
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      return;
    }

    setEditingUserId(selectedIds[0]);
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

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [users, editingUserId],
  );

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[40px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[32px]">
          Utilisateurs
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher par email"
            />
          </div>
        </div>

        {showActionsBar ? (
          <UserAdminActionsBar
            selectedIds={selectedIds}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEdit}
          />
        ) : (
          <div className="h-6" />
        )}

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
                  <th className="px-4 font-semibold text-[#3A416F]">Prénom</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Email</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Période de test</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Abonnement</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Ancienneté</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Sexe</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Age</th>
                  <th className="px-4 font-semibold text-[#3A416F]">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
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
                      <td className={`px-4 font-semibold align-middle ${statusClassName(status)}`}>
                        {status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editingUser && (
          <div className="mt-6 rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2E3271]">
                Détails de l&apos;utilisateur
              </h3>
              <button
                onClick={() => setEditingUserId(null)}
                className="text-sm font-semibold text-[#7069FA] hover:text-[#3A416F]"
              >
                Fermer
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Prénom
                </p>
                <p className="text-sm font-semibold text-[#3A416F]">
                  {editingUser.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Email
                </p>
                <p className="text-sm font-semibold text-[#3A416F]">
                  {editingUser.email}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Abonnement
                </p>
                <p className="text-sm font-semibold text-[#3A416F]">
                  {formatSubscription(editingUser.subscription_plan)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Période de test
                </p>
                <p className="text-sm font-semibold text-[#3A416F]">
                  {isInTrial(editingUser) ? "Oui" : "Non"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Ancienneté
                </p>
                <p className="text-sm font-semibold text-[#3A416F]">
                  {formatSeniority(editingUser.created_at)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-[#A7A5B2]">
                  Statut
                </p>
                <p
                  className={`text-sm font-semibold ${statusClassName(
                    computeStatus(editingUser),
                  )}`}
                >
                  {computeStatus(editingUser)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
