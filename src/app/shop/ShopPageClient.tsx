"use client";

import { useState, useEffect } from "react";
import ShopBannerSliderClient from "@/components/ShopBannerSliderClient";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import LoadMore from "@/components/pagination/LoadMore";
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
  const [sortBy, setSortBy] = useState("relevance");
  const [visibleCount, setVisibleCount] = useState(12);
  const [filters, setFilters] = useState<string[]>(["", "", "", ""]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [isRestored, setIsRestored] = useState(false);

  // Restore from sessionStorage on mount after hydration
  useEffect(() => {
    try {
      const savedSort = sessionStorage.getItem("glift_shop_sortBy");
      if (savedSort) setSortBy(savedSort);

      const savedCount = sessionStorage.getItem("glift_shop_visibleCount");
      if (savedCount) {
        const c = Number.parseInt(savedCount, 10);
        if (c) setVisibleCount(c);
      }

      const savedFilters = sessionStorage.getItem("glift_shop_filters");
      if (savedFilters) setFilters(JSON.parse(savedFilters));

      const savedFavs = sessionStorage.getItem("glift_shop_favoritesOnly");
      if (savedFavs === "true") setFavoritesOnly(true);
    } catch {
      // ignore
    } finally {
      setIsRestored(true);
    }
  }, []);

  // Save to sessionStorage on every change (only after initial restore)
  useEffect(() => {
    if (!isRestored) return;
    try {
      sessionStorage.setItem("glift_shop_sortBy", sortBy);
      sessionStorage.setItem("glift_shop_filters", JSON.stringify(filters));
      sessionStorage.setItem("glift_shop_visibleCount", visibleCount.toString());
      sessionStorage.setItem("glift_shop_favoritesOnly", String(favoritesOnly));
    } catch {
      // ignore
    }
  }, [sortBy, filters, visibleCount, favoritesOnly, isRestored]);

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
          initialUserProfile={initialUserProfile}
          onFavoritesOnlyToggle={() => {
            setFavoritesOnly((prev) => !prev);
            setVisibleCount(12);
          }}
          onSortChange={(value: string) => {
            setSortBy(value);
            setVisibleCount(12);
          }}
          onFiltersChange={(newFilters: string[]) => {
            setFilters(newFilters);
            setVisibleCount(12);
          }}
        />
        <ShopGrid
          sortBy={sortBy}
          visibleCount={visibleCount}
          filters={filters}
          favoritesOnly={favoritesOnly}
          onOfferClick={handleOfferClick}
          onCountChange={setTotalItems}
          initialOffers={visibleCount === 12 && filters.every(f => f === "") && sortBy === "relevance" && !favoritesOnly ? initialOffers : undefined}
          initialUserProfile={initialUserProfile}
          initialIsAuthenticated={initialIsAuthenticated}
          initialFavorites={initialFavorites}
          onResetFavorites={() => {
            setFavoritesOnly(false);
            setVisibleCount(12);
          }}
          onResetFilters={() => {
            setFilters(["", "", "", ""]);
            setVisibleCount(12);
          }}
        />
        <LoadMore
          currentCount={Math.min(visibleCount, totalItems)}
          totalCount={totalItems}
          onLoadMore={() => setVisibleCount((prev) => prev + 12)}
          label="offres"
        />
      </div>

      {showCodeModal && selectedOffer && (
        <OfferCodeModal
          name={selectedOffer.name}
          description={selectedOffer.description}
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
