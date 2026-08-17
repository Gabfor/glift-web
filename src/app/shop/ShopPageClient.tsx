"use client";

import { useState, useEffect } from "react";
import ShopBannerSliderClient from "@/components/ShopBannerSliderClient";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import Pagination from "@/components/pagination/Pagination";
import OfferCodeModal from "@/components/OfferCodeModal";
import { createClient } from "@/lib/supabaseClient";
import { ShopOffer, ShopProfile } from "@/types/shop";

type Props = {
  initialOffers: ShopOffer[];
  sliderConfig: {
    type: string;
    slides: any[];
    isMobileActive?: boolean;
  };
  initialUserProfile?: ShopProfile | null;
  initialIsAuthenticated?: boolean;
  initialFavorites?: string[];
};

export default function ShopPageClient({
  initialOffers,
  sliderConfig,
  initialUserProfile = null,
  initialIsAuthenticated = false,
  initialFavorites = [],
}: Props) {
  const [sortBy, setSortBy] = useState(() => {
    try {
      return sessionStorage.getItem("glift_shop_sortBy") || "relevance";
    } catch {
      return "relevance";
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      return Number.parseInt(sessionStorage.getItem("glift_shop_page") || "1", 10) || 1;
    } catch {
      return 1;
    }
  });
  const [filters, setFilters] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("glift_shop_filters");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ["", "", "", ""];
  });
  const [favoritesOnly, setFavoritesOnly] = useState(() => {
    try {
      return sessionStorage.getItem("glift_shop_favoritesOnly") === "true";
    } catch {
      return false;
    }
  });
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Save to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem("glift_shop_sortBy", sortBy);
      sessionStorage.setItem("glift_shop_filters", JSON.stringify(filters));
      sessionStorage.setItem("glift_shop_page", currentPage.toString());
      sessionStorage.setItem("glift_shop_favoritesOnly", String(favoritesOnly));
    } catch {
      // ignore
    }
  }, [sortBy, filters, currentPage, favoritesOnly]);

  const handleOfferClick = (offer: ShopOffer) => {
    setSelectedOffer(offer);
    setShowCodeModal(true);
  };

  const handleModalConfirm = async () => {
    if (!selectedOffer) return;

    const supabase = createClient();
    await supabase.rpc("increment_offer_click", {
      offer_id: selectedOffer.id,
    });
  };

  return (
    <>
      <ShopBannerSliderClient 
        onOfferClick={handleOfferClick} 
        initialType={(sliderConfig.type as "none" | "single" | "double") || "none"}
        initialSlides={sliderConfig.slides}
        initialIsMobileActive={sliderConfig.isMobileActive ?? true}
      />

      <div className="max-w-[1152px] mx-auto">
        <ShopFilters
          sortBy={sortBy}
          initialFilters={filters}
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyToggle={() => {
            setFavoritesOnly((prev) => !prev);
            setCurrentPage(1);
          }}
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
          favoritesOnly={favoritesOnly}
          onOfferClick={handleOfferClick}
          onCountChange={setTotalItems}
          initialOffers={currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance" && !favoritesOnly ? initialOffers : undefined}
          initialUserProfile={initialUserProfile}
          initialIsAuthenticated={initialIsAuthenticated}
          initialFavorites={initialFavorites}
        />
        {totalItems > 8 && (
          <div className="hidden md:block">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
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
