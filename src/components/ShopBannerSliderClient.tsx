"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ShopBannerSliderClient() {
  const supabase = createClient();
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperClass | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  // on gère maintenant "single" comme valeur de type « slider simple »
  const [type, setType] = useState<"none" | "single" | "double">("none");
  const [slides, setSlides] = useState<
    { image: string; alt: string; link: string }[]
  >([]);

  useEffect(() => {
    const fetchSliderConfig = async () => {
      const { data } = await supabase
        .from("sliders_admin")
        .select("*")
        .single();
      if (data && data.type !== "none") {
        setType(data.type as "single" | "double");
        setSlides(data.slides || []);
      }
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
      className={`mx-auto mb-12 ${
        isDouble ? "max-w-[1152px]" : "w-[1152px]"
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
            <a
              href={slide.link || "#"}
              target={slide.link ? "_blank" : undefined}
              rel={slide.link ? "noopener noreferrer" : undefined}
            >
              <Image
                src={slide.image}
                alt={slide.alt || `Slider ${idx + 1}`}
                width={width}
                height={height}
                className="rounded-[20px] object-cover w-full h-[250px] transition-transform duration-500"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Pagination + pause/play uniquement si hideControls === false */}
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
