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
          />
        ) : (
          <div className="flex justify-end mb-4 relative group">
            <Tooltip content="Ajouter une offre">
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
          <div className="p-4 bg-white shadow rounded animate-pulse space-y-3">
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
            <div className="h-[48px] w-full bg-[#ECE9F1] rounded-[5px]" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center text-[#5D6494] mt-12">Aucune offre pour le moment.</div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#ECE9F1] h-[60px]">
                <tr>
                  <th className="px-4 w-[48px]">
                    <button onClick={toggleAll} className="flex items-center justify-center h-[60px]">
                      <Image
                        src={allSelected ? "/icons/checkbox_checked.svg" : "/icons/checkbox_unchecked.svg"}
                        alt="Checkbox"
                        width={15}
                        height={15}
                      />
                    </button>
                  </th>
                  {renderHeaderCell("Statut", "status", "w-[60px] px-3")}
                  {renderHeaderCell("Début", "start_date", "w-[94px] px-3")}
                  {renderHeaderCell("Fin", "end_date", "w-[94px] px-3")}
                  {renderHeaderCell("Nom de l'offre", "name", "px-3")}
                  {renderHeaderCell("Code", "code", "w-[100px] px-3")}
                  {renderHeaderCell("Boutique", "shop", "w-[78px] px-3")}
                  {renderHeaderCell("Utilisation", "click_count", "w-[85px] px-3")}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const isSelected = selectedIds.includes(offer.id);
                  return (
                    <tr key={offer.id} className="border-b border-[#ECE9F1] h-[60px]">
                      <td className="px-4">
                        <button onClick={() => toggleCheckbox(offer.id)} className="flex items-center justify-center h-[60px]">
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
                            offer.status === "ON" ? "bg-[#DCFAF1] text-[#00D591]" : "bg-[#FEF7D0] text-[#DCBC04]"
                          }`}
                          style={{ width: "40px", height: "20px", fontSize: "10px", fontWeight: 600 }}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        {new Date(offer.start_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494]">
                        {offer.end_date && !isNaN(new Date(offer.end_date).getTime())
                          ? new Date(offer.end_date).toLocaleDateString("fr-FR")
                          : "Aucune"}
                      </td>
                      <td className="px-4 font-semibold text-[#5D6494] max-w-[190px] truncate">{offer.name}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{offer.code}</td>
                      <td className="px-4 font-semibold text-[#5D6494]">{offer.shop}</td>
                      <td className="px-4 font-semibold text-[#5D6494] text-center">{offer.click_count ?? 0}</td>
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
