"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Database } from "@/lib/supabase/types";

type SliderRow = Database["public"]["Tables"]["sliders_admin"]["Row"];

// We define a shape compatible with what ShopCard/Modal expects
export type OfferData = {
  id: string;
  name: string;
  code: string | null;
  modal: string | null;
  condition: string | null;
  start_date: string | null;
  end_date: string | null;
  shop_link: string | null;
  shop_website: string | null;
  brand_image: string | null;
  type: string[] | null;
};

type Slide = {
  image: string;
  alt: string;
  link: string;
  offer?: OfferData; // If present, this slide represents an offer
};

const normalizeSlides = (value: SliderRow["slides"]): Slide[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((slide) => {
    if (typeof slide === "object" && slide !== null && !Array.isArray(slide)) {
      const record = slide as Record<string, unknown>;
      return {
        image: typeof record.image === "string" ? record.image : "",
        alt: typeof record.alt === "string" ? record.alt : "",
        link: typeof record.link === "string" ? record.link : "",
      };
    }

    return { image: "", alt: "", link: "" };
  });
};

type Props = {
  onOfferClick?: (offer: OfferData) => void;
};

export default function ShopBannerSliderClient({ onOfferClick }: Props) {
  const supabase = createClient();
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperClass | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  // on gère maintenant "single" comme valeur de type « slider simple »
  const [type, setType] = useState<"none" | "single" | "double">("none");
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const fetchSliderConfig = async () => {
      // 1. Fetch Admin Slider Config (Priority Slides & Settings)
      const { data: adminConfig } = await supabase
        .from("sliders_admin")
        .select("*")
        .single<SliderRow>();

      if (!adminConfig || !adminConfig.is_active || adminConfig.type === "none") {
        setType("none");
        setSlides([]);
        return;
      }

      // 2. Fetch Relevant Offers (with slider_image)
      // We assume we want enough offers to fill the remaining slots
      // Priority count comes from the manual slides length
      const prioritySlides = normalizeSlides(adminConfig.slides);
      const slotCount = adminConfig.slot_count || 1;
      const slotsNeeded = Math.max(0, slotCount - prioritySlides.length);

      let offerSlides: Slide[] = [];

      if (slotsNeeded > 0) {
        // We select ALL fields relevant for the modal + display
        const { data: offers } = await supabase
          .from("offer_shop")
          .select(`
            id, name, slider_image, image_alt, 
            shop_link, shop_website, 
            code, modal, condition, 
            start_date, end_date, brand_image, type
          `)
          .eq("status", "ON")
          .neq("slider_image", null)
          .limit(slotsNeeded + 2);

        if (offers) {
          offerSlides = offers
            .filter((o) => o.slider_image)
            .map((o) => ({
              image: o.slider_image!,
              alt: o.image_alt || o.name,
              link: o.shop_link || o.shop_website || "",
              offer: {
                id: o.id,
                name: o.name,
                code: o.code,
                modal: o.modal,
                condition: o.condition,
                start_date: o.start_date,
                end_date: o.end_date,
                shop_link: o.shop_link,
                shop_website: o.shop_website,
                brand_image: o.brand_image,
                type: o.type,
              }
            }));
        }
      }

      // 3. Merge: Priority First, then Offers
      const combinedSlides = [...prioritySlides, ...offerSlides].slice(0, slotCount);

      setType(adminConfig.type as "single" | "double");
      setSlides(combinedSlides);
    };

    fetchSliderConfig();
  }, [supabase]);

  // si aucun slider ou type "none", on n'affiche rien
  if (type === "none" || slides.length === 0) return null;

  const isDouble = type === "double";
  const width = isDouble ? 564 : 1152;
  const height = 250;

  // on cache la pagination/play si :
  // - single && slides ≤ 1 (une grande image)
  // - double && slides ≤ 2 (deux petites)
  const hideControls =
    (type === "single" && slides.length <= 1) ||
    (type === "double" && slides.length <= 2);

  const toggleAutoplay = () => {
    if (!swiperRef.current) return;
    if (isPlaying) swiperRef.current.autoplay?.stop();
    else swiperRef.current.autoplay?.start();
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className={`mx-auto mb-12 ${isDouble ? "max-w-[1152px]" : "w-[1152px]"
        }`}
    >
      <Swiper
        modules={[Pagination, Autoplay]}
        // si hideControls, on passe false pour désactiver pagination/autoplay
        autoplay={
          hideControls
            ? false
            : {
              delay: 4000,
              disableOnInteraction: false,
            }
        }
        pagination={
          hideControls
            ? false
            : {
              el: paginationRef.current,
              clickable: true,
            }
        }
        onBeforeInit={(swiper) => {
          swiperRef.current = swiper;
          if (
            swiper.params.pagination &&
            typeof swiper.params.pagination !== "boolean"
          ) {
            swiper.params.pagination.el = paginationRef.current;
          }
        }}
        loop={!hideControls}
        spaceBetween={24}
        slidesPerView={isDouble ? 2 : 1}
        slidesPerGroup={isDouble ? 2 : 1}
        speed={600}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            {slide.offer && onOfferClick ? (
              <div
                onClick={() => onOfferClick(slide.offer!)}
                className="cursor-pointer block relative group"
              >
                <Image
                  src={slide.image}
                  alt={slide.alt || `Slider ${idx + 1}`}
                  width={width}
                  height={height}
                  className="rounded-[20px] object-cover w-full h-[250px] transition-transform duration-500"
                />
              </div>
            ) : (
              <a
                href={slide.link || "#"}
                target={slide.link ? "_blank" : undefined}
                rel={slide.link ? "noopener noreferrer" : undefined}
                className="block relative"
              >
                <Image
                  src={slide.image}
                  alt={slide.alt || `Slider ${idx + 1}`}
                  width={width}
                  height={height}
                  className="rounded-[20px] object-cover w-full h-[250px] transition-transform duration-500"
                />
              </a>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {!hideControls && (
        <>
          <div className="mt-5 flex justify-center">
            <div className="flex items-center justify-center gap-[3px] mr-[6px]">
              <div
                ref={paginationRef}
                className="flex items-center justify-center"
              />
              <button
                onClick={toggleAutoplay}
                className="w-[9px] h-[9px] min-w-[9px] min-h-[9px] flex items-center justify-center transition-opacity"
                aria-label="Toggle autoplay"
              >
                <Image
                  src={isPlaying ? "/icons/pause.svg" : "/icons/play.svg"}
                  alt={isPlaying ? "Pause" : "Play"}
                  width={9}
                  height={9}
                  className="w-[9px] h-[9px] object-none"
                  unoptimized
                />
              </button>
            </div>
          </div>
          <style jsx global>{`
            .swiper-pagination-bullet {
              width: 9px;
              height: 9px;
              background-color: #ece9f1;
              opacity: 1;
              margin: 0 6px;
            }
            .swiper-pagination-bullet-active {
              background-color: #a1a5fd;
            }
          `}</style>
        </>
      )}
    </div>
  );
}
