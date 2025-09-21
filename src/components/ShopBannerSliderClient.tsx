"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Banner = {
  id: number;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  order?: number | null;
  status?: "ON" | "OFF" | null;
};

export default function ShopBannerSliderClient() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_slider")
      .select("*")
      .eq("status", "ON")
      .order("order", { ascending: true });

    if (error) {
      console.error("[ShopBannerSlider] fetch error:", error);
      setBanners([]);
    } else {
      setBanners((data || []) as Banner[]);
    }
    setLoading(false);
  }, [supabase]);

  // 1) initial
  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // 2) si la session est restaurée / changée, on relance (utile si RLS côté table)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchBanners();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, fetchBanners]);

  if (loading) {
    return (
      <div className="w-full h-[160px] rounded-[8px] bg-[#ECE9F1] animate-pulse" aria-label="Chargement du slider" />
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-[8px]">
      {/* Slider minimal (une seule slide visible si tu n’as pas de carousel) */}
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.link_url || "#"}
          className="block w-full relative"
          style={{ minHeight: 160 }}
        >
          <Image
            src={b.image_url}
            alt={b.title || ""}
            fill
            className="object-cover"
            sizes="(max-width: 1152px) 100vw, 1152px"
            unoptimized
          />
          {(b.title || b.subtitle) && (
            <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/40 to-transparent">
              <div className="text-white">
                {b.title && <div className="text-lg font-bold">{b.title}</div>}
                {b.subtitle && <div className="text-sm font-medium opacity-90">{b.subtitle}</div>}
              </div>
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
