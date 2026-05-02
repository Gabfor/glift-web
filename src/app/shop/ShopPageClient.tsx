"use client";

import { useState } from "react";
import ShopBannerSliderClient from "@/components/ShopBannerSliderClient";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopGrid from "@/components/shop/ShopGrid";
import Pagination from "@/components/pagination/Pagination";
import OfferCodeModal from "@/components/OfferCodeModal";
import { createClient } from "@/lib/supabaseClient";
import { ShopOffer } from "@/types/shop";

type Props = {
  initialOffers: ShopOffer[];
  sliderConfig: {
    type: string;
    slides: any[];
  };
};

export default function ShopPageClient({ initialOffers, sliderConfig }: Props) {
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(["", "", "", ""]);
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

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
      />

      <div className="max-w-[1152px] mx-auto">
        <ShopFilters
          sortBy={sortBy}
          initialFilters={filters}
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
          onCountChange={setTotalItems}
          initialOffers={currentPage === 1 && filters.every(f => f === "") && sortBy === "relevance" ? initialOffers : undefined}
        />
        {totalItems > 8 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            onPageChange={(page: number) => setCurrentPage(page)}
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
