"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProgramStoreActionsBar from "@/app/admin/components/ProgramStoreActionsBar";
import ChevronIcon from "/public/icons/chevron.svg";
import ChevronGreyIcon from "/public/icons/chevron_grey.svg";
import Tooltip from "@/components/Tooltip";
import SearchBar from "@/components/SearchBar";
import { useSupabase } from "@/components/SupabaseProvider";

type Offer = {
  id: number;
  name: string;
  created_at: string;
  start_date: string;
  end_date: string;
  shop: string;
  code: string;
  status: string;
  click_count: number;
};

export default function OfferShopPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showActionsBar, setShowActionsBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const supabase = useSupabase();

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

  const fetchOffers = async () => {
    setLoading(true);

    const session = await requireSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("offer_shop")
      .select(
        `id, name, created_at, start_date, end_date, shop, code, status, click_count`
      )
      .order(sortBy, { ascending: sortDirection === "asc" });

    if (error) console.error("Erreur Supabase:", error);
    else setOffers((data || []) as Offer[]);

    setSelectedIds([]);
    setShowActionsBar(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDirection]);

  // ✅ Correction ici : on utilise (event) et on récupère subscription correctement
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const handleSort = (column: string) => {
    setSortBy(() => column);
    setSortDirection((prev) => (sortBy === column && prev === "asc" ? "desc" : "asc"));
  };

  const toggleCheckbox = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = offers.length > 0 && selectedIds.length === offers.length;
  const toggleAll = () => setSelectedIds(allSelected ? [] : offers.map((o) => o.id));

  const selectedOffer = offers.find((o) => o.id === selectedIds[0]) || null;
  const selectedStatus = selectedOffer?.status ?? null;

  const filteredOffers = offers.filter(
    (offer) =>
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.shop?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setShowActionsBar(false);
    setSelectedIds([]);
    await supabase.from("offer_shop").delete().in("id", selectedIds);
    fetchOffers();
  };

  const handleDuplicate = async () => {
    if (selectedIds.length !== 1) return;
    const idToDuplicate = selectedIds[0];

    const { data, error } = await supabase.from("offer_shop").select("*").eq("id", idToDuplicate).single();
    if (!data || error) return;

    const duplicated: any = { ...data };
    delete duplicated.id;
    duplicated.status = "OFF";
    duplicated.created_at = new Date().toISOString();

    await supabase.from("offer_shop").insert([duplicated]);
    fetchOffers();
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;
    router.push(`/admin/create-offer?id=${selectedIds[0]}`);
  };

  const handleToggleStatus = async () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const current = offers.find((o) => o.id === id);
    if (!current) return;
    const newStatus = current.status === "ON" ? "OFF" : "ON";
    await supabase.from("offer_shop").update({ status: newStatus }).eq("id", id);
    fetchOffers();
  };

  const handleAdd = () => router.push("/admin/create-offer");

  const renderHeaderCell = (label: string, column: string, className = "") => {
    const isActive = sortBy === column;
    const isAscending = sortDirection === "asc";
    const icon = isActive ? ChevronIcon : ChevronGreyIcon;

    return (
      <th
        className={`font-semibold text-[#3A416F] cursor-pointer select-none ${className}`}
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
          Offres Glift Shop
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-[368px]">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une offre" />
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
            entityName="offre"
          />
        ) : (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAdd}
              className="bg-[#2E3271] text-white font-semibold px-6 py-3 rounded-[10px] shadow-lg hover:bg-[#41468f] transition"
            >
              Ajouter une offre
            </button>
          </div>
        )}

        <div className="bg-white rounded-[20px] shadow-[0px_20px_65px_rgba(94,105,140,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#F3F4FA] text-[#3A416F] text-[14px] uppercase">
                <tr>
                  <th className="px-6 py-4">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  {renderHeaderCell("Nom", "name", "px-6 py-4")}
                  {renderHeaderCell("Magasin", "shop", "px-6 py-4")}
                  {renderHeaderCell("Date de début", "start_date", "px-6 py-4")}
                  {renderHeaderCell("Date de fin", "end_date", "px-6 py-4")}
                  {renderHeaderCell("Code", "code", "px-6 py-4")}
                  {renderHeaderCell("Statut", "status", "px-6 py-4")}
                  {renderHeaderCell("Clics", "click_count", "px-6 py-4")}
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[#3A416F] text-[15px]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-[#A1A7C7]">
                      Chargement des offres...
                    </td>
                  </tr>
                ) : filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-[#A1A7C7]">
                      Aucune offre trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => {
                    const isSelected = selectedIds.includes(offer.id);
                    const isStatusOn = offer.status === "ON";

                    return (
                      <tr
                        key={offer.id}
                        className={`border-b border-[#E6E8F1] transition hover:bg-[#F9FAFE] ${
                          isSelected ? "bg-[#EEF1FF]" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCheckbox(offer.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold">{offer.name}</td>
                        <td className="px-6 py-4">{offer.shop || "-"}</td>
                        <td className="px-6 py-4">{new Date(offer.start_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{new Date(offer.end_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-mono text-sm">{offer.code}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isStatusOn
                                ? "bg-[#E5F5EE] text-[#1BAF6B]"
                                : "bg-[#FFEDEC] text-[#F16A5B]"
                            }`}
                          >
                            {isStatusOn ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">{offer.click_count ?? 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tooltip content="Modifier">
                              <button
                                onClick={() => {
                                  setSelectedIds([offer.id]);
                                  handleEdit();
                                }}
                                className="px-3 py-2 rounded-md border border-[#E6E8F1] text-xs font-semibold text-[#3A416F] hover:bg-[#EEF1FF]"
                              >
                                Modifier
                              </button>
                            </Tooltip>
                            <Tooltip content={isStatusOn ? "Désactiver" : "Activer"}>
                              <button
                                onClick={() => {
                                  setSelectedIds([offer.id]);
                                  handleToggleStatus();
                                }}
                                className={`px-3 py-2 rounded-md text-xs font-semibold transition ${
                                  isStatusOn
                                    ? "bg-[#FFEDEC] text-[#F16A5B] hover:bg-[#FFD9D7]"
                                    : "bg-[#E5F5EE] text-[#1BAF6B] hover:bg-[#D2F0E3]"
                                }`}
                              >
                                {isStatusOn ? "Désactiver" : "Activer"}
                              </button>
                            </Tooltip>
                            <Tooltip content="Supprimer">
                              <button
                                onClick={() => {
                                  setSelectedIds([offer.id]);
                                  handleDelete();
                                }}
                                className="px-3 py-2 rounded-md border border-[#E6E8F1] text-xs font-semibold text-[#F16A5B] hover:bg-[#FFEDEC]"
                              >
                                Supprimer
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
