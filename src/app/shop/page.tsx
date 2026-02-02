"use client";

import { useEffect, useState } from "react";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import Pagination from "@/components/pagination/Pagination";
import dynamic from "next/dynamic";
import OfferCodeModal from "@/components/OfferCodeModal";
import { createClient } from "@/lib/supabaseClient";

const ShopBannerSlider = dynamic<{ onOfferClick?: (offer: any) => void }>(
  () => import("@/components/ShopBannerSliderClient"),
  {
    ssr: false,
  }
);

export default function ShopPage() {
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [filters, setFilters] = useState(["", "", "", ""]);

  // Modal Management
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Offer Interaction Handler
  const handleOfferClick = async (offer: any) => {
    // 1. Analytics
    try {
      const supabase = createClient();
      await supabase.rpc("increment_offer_click", { offer_id: offer.id });
    } catch (error) {
      console.error("Erreur lors de l'incrémentation :", error);
    }

    // 2. Decide: Modal vs Link
    if (offer.modal === "Avec code" || offer.modal === "Sans code") {
      setSelectedOffer(offer);
      setShowCodeModal(true);
    } else if (offer.shop_link) {
      window.open(offer.shop_link, "_blank");
    } else if (offer.shop_website) {
      // Fallback if no specific product link
      window.open(offer.shop_website, "_blank");
    }
  };

  const handleModalConfirm = () => {
    setShowCodeModal(false);
    if (selectedOffer?.shop_link) {
      window.open(selectedOffer.shop_link, "_blank");
    } else if (selectedOffer?.shop_website) {
      window.open(selectedOffer.shop_website, "_blank");
    }
    setSelectedOffer(null);
  };

  // ✅ Compter les offres filtrées
  useEffect(() => {
    const fetchTotalCount = async () => {
      setLoadingCount(true);
      const supabase = createClient();

      let query = supabase
        .from("offer_shop")
        .select("*", { count: "exact", head: true })
        .eq("status", "ON");

      if (filters[0]) {
        query = query.or(`gender.eq.${filters[0]},gender.eq.Tous`);
      }
      if (filters[1]) query = query.filter("type", "cs", JSON.stringify([filters[1]]));
      if (filters[2]) query = query.filter("sport", "cs", JSON.stringify([filters[2]]));
      if (filters[3]) query = query.eq("shop", filters[3]);

      const { count, error } = await query;

      if (error) {
        console.error(
          "Erreur lors du comptage des programmes :",
          JSON.stringify(error, null, 2)
        );
        setTotalPrograms(0);
      } else {
        setTotalPrograms(count || 0);
      }

      setLoadingCount(false);
    };

    fetchTotalCount();
  }, [sortBy, filters]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <ShopHeader />
      </div>

      <ShopBannerSlider onOfferClick={handleOfferClick} />

      <div className="max-w-[1152px] mx-auto">
        <ShopFilters
          sortBy={sortBy}
          onSortChange={(value) => {
            setSortBy(value);
            setCurrentPage(1);
          }}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />
        <ShopGrid
          sortBy={sortBy}
          currentPage={currentPage}
          filters={filters}
          onOfferClick={handleOfferClick}
        />
        {!loadingCount && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalPrograms}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {showCodeModal && selectedOffer && (
        <OfferCodeModal
          name={selectedOffer.name}
          brandImage={selectedOffer.brand_image}
          code={selectedOffer.code}
          link={selectedOffer.shop_link || ""}
          shopWebsite={selectedOffer.shop_website || ""}
          modal={(selectedOffer.modal || "Sans code") as "Avec code" | "Sans code"}
          condition={selectedOffer.condition}
          endDate={selectedOffer.end_date}
          onCancel={() => {
            setShowCodeModal(false);
            setSelectedOffer(null);
          }}
          onConfirm={handleModalConfirm}
        />
      )}
    </main>
  );
}
