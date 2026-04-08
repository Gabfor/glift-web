"use client";

import { useEffect, useState } from "react";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import Pagination from "@/components/pagination/Pagination";
import ShopBannerSliderClient from "@/components/ShopBannerSliderClient";
import OfferCodeModal from "@/components/OfferCodeModal";
import { createClient } from "@/lib/supabaseClient";
import { ShopOffer } from "@/types/shop";

interface ShopPageClientProps {
  initialOffers: ShopOffer[];
  initialTotalCount: number;
  sliderConfig: {
    type: "none" | "single" | "double";
    slides: any[];
  };
}

export default function ShopPageClient({
  initialOffers,
  initialTotalCount,
  sliderConfig,
}: ShopPageClientProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(initialTotalCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [filters, setFilters] = useState(["", "", "", ""]);

  // Modal Management
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Offer Interaction Handler
  const handleOfferClick = async (offer: ShopOffer) => {
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
    // Skip initial fetch since it's provided by SSR
    if (currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance") {
      return;
    }

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
  }, [sortBy, filters, currentPage]);

  return (
    <>
      <ShopBannerSliderClient 
        onOfferClick={handleOfferClick} 
        initialType={sliderConfig.type}
        initialSlides={sliderConfig.slides}
      />

      <div className="max-w-[1152px] mx-auto">
        <ShopFilters
          sortBy={sortBy}
          onSortChange={(value: string) => {
            setSortBy(value);
            setCurrentPage(1);
          }}
          onFiltersChange={(newFilters: string[]) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
        />
        <ShopGrid
          sortBy={sortBy}
          currentPage={currentPage}
          filters={filters}
          onOfferClick={handleOfferClick}
          initialOffers={currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance" ? initialOffers : undefined}
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
    </>
  );
}
