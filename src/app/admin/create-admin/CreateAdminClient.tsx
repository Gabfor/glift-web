"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";

type Props = {
  adminId: string | null;
};

const inputClass =
  "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";

export default function CreateAdminClient({ adminId }: Props) {
  const router = useRouter();

  // Form states
  const [statut, setStatut] = useState(false);
  const [langue, setLangue] = useState("Français");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Initial state for dirty detection in edit mode
  const [initialState, setInitialState] = useState({ prenom: "", email: "", statut: false, langue: "Français" });

  const isDirty = useMemo(() => {
    if (!adminId) return true; // always submittable in create mode
    return (
      prenom !== initialState.prenom ||
      email !== initialState.email ||
      statut !== initialState.statut ||
      langue !== initialState.langue
    );
  }, [adminId, prenom, email, statut, langue, initialState]);

  // Load existing admin data in edit mode
  useEffect(() => {
    if (!adminId) return;

    const fetchAdmin = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/admins");
        if (!res.ok) throw new Error("Impossible de charger les données.");
        const data = await res.json();
        const admin = (data.admins ?? []).find((a: any) => a.id === adminId);
        if (admin) {
          setPrenom(admin.name ?? "");
          setEmail(admin.email ?? "");
          setStatut(admin.statut ?? false);
          setLangue(admin.langue ?? "Français");
          setInitialState({
            prenom: admin.name ?? "",
            email: admin.email ?? "",
            statut: admin.statut ?? false,
            langue: admin.langue ?? "Français",
          });
        }
      } catch (err) {
        console.error("[CreateAdminClient] fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAdmin();
  }, [adminId]);

  const isFormValid = useMemo(() => {
    return prenom.trim() !== "" && email.trim() !== "";
  }, [prenom, email]);

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    setActionError(null);

    try {
      if (adminId) {
        // Edit mode — PATCH
        const res = await fetch(`/api/admin/admins/${adminId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prenom.trim(),
            email: email.trim(),
            statut,
            langue,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Une erreur est survenue.");
        }
      } else {
        // Create mode — POST
        const res = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prenom.trim(),
            email: email.trim(),
            statut,
            langue,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Une erreur est survenue.");
        }
      }

      router.push("/administrateurs");
    } catch (err: any) {
      console.error("[CreateAdminClient] handleSave error:", err);
      setActionError(err.message || "Une erreur est survenue.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex items-center justify-center">
        <div className="text-center text-[#5D6494] font-semibold">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full">
        <BackLink href="/administrateurs" className="mb-6">
          Administrateurs
        </BackLink>

        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {adminId ? "Modifier l'administrateur" : "Créer un administrateur"}
          </h2>

          <div className="flex flex-col gap-8 w-full">
            {/* STATUT & LANGUE */}
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                  <AdminDropdown
                    label=""
                    placeholder="Sélectionnez"
                    selected={statut ? "ON" : "OFF"}
                    onSelect={(value) => setStatut(value === "ON")}
                    options={[
                      { value: "ON", label: "ON" },
                      { value: "OFF", label: "OFF" },
                    ]}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Langue</label>
                  <AdminDropdown
                    label=""
                    placeholder="Sélectionnez la langue"
                    selected={langue}
                    onSelect={(value) => setLangue(value)}
                    options={[
                      { value: "Français", label: "Français", iconSrc: "/flags/france.svg" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* PRÉNOM & EMAIL */}
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Prénom</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Email</label>
                  <input
                    type="email"
                    placeholder="john.doe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {actionError && (
              <p className="text-center text-[14px] text-red-500 font-semibold -mt-4">
                {actionError}
              </p>
            )}

            {/* Submit button */}
            <div className="flex justify-center mt-2">
              <CTAButton
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || !isDirty || isSaving}
                variant={isFormValid && isDirty && !isSaving ? "active" : "inactive"}
                className="font-semibold"
              >
                {isSaving
                  ? adminId ? "Enregistrement..." : "Création en cours..."
                  : adminId ? "Enregistrer les modifications" : "Ajouter l'administrateur"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
