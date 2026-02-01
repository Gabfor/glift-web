"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import CTAButton from "@/components/CTAButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import AdminSliderSkeleton from "./AdminSliderSkeleton";
import type { Database } from "@/lib/supabase/types";

function SaveIcon({ fill }: { fill: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.7578 0C14.5533 0.000119943 15.3164 0.316404 15.8789 0.878906L19.1211 4.12109C19.6836 4.6836 19.9999 5.4467 20 6.24219V17C20 18.6569 18.6569 20 17 20H3C1.34315 20 0 18.6569 0 17V3C0 1.34315 1.34315 0 3 0H13.7578ZM10 12C8.34315 12 7 13.3431 7 15C7 16.6569 8.34315 18 10 18C11.6569 18 13 16.6569 13 15C13 13.3431 11.6569 12 10 12ZM6 3C5.44772 3 5 3.44772 5 4V7.5C5 8.05228 5.44772 8.5 6 8.5H14C14.5523 8.5 15 8.05228 15 7.5V4C15 3.44772 14.5523 3 14 3H6Z"
        fill={fill}
      />
    </svg>
  );
}

const sliderTypeOptions = [
  { value: "none", label: "Aucun slider" },
  { value: "single", label: "Slider simple" },
  { value: "double", label: "Slider double" },
];

const sliderSimpleOptions = [
  { value: "1", label: "1 slider" },
  { value: "2", label: "2 sliders" },
  { value: "3", label: "3 sliders" },
];

const sliderDoubleOptions = [
  { value: "2", label: "2 sliders" },
  { value: "4", label: "4 sliders" },
  { value: "6", label: "6 sliders" },
];

// Options for Priority Slider Count (1 to 6)
const priorityCountOptions = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} slider${i > 0 ? "s" : ""} prioritaire${i > 0 ? "s" : ""}`,
}));

type SliderRow = Database["public"]["Tables"]["sliders_admin"]["Row"];
type SliderInsert = Database["public"]["Tables"]["sliders_admin"]["Insert"];
type SliderUpdate = Database["public"]["Tables"]["sliders_admin"]["Update"];

type Slide = {
  image: string;
  alt: string;
  link: string;
};

const emptySlide: Slide = { image: "", alt: "", link: "" };

const normalizeSlide = (value: unknown): Slide => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      image: typeof record.image === "string" ? record.image : "",
      alt: typeof record.alt === "string" ? record.alt : "",
      link: typeof record.link === "string" ? record.link : "",
    };
  }

  return { ...emptySlide };
};

export default function AdminSliderPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const showSkeleton = useMinimumVisibility(loading);

  // State
  const [isActive, setIsActive] = useState(true);
  const [type, setType] = useState("none");
  const [slotCount, setSlotCount] = useState("1"); // Total slots
  const [priorityCount, setPriorityCount] = useState("1"); // Priority (Manual) slots
  const [slides, setSlides] = useState<Slide[]>(
    Array.from({ length: 6 }, () => ({ ...emptySlide }))
  );

  // Initial state for change detection
  const [initialIsActive, setInitialIsActive] = useState(true);
  const [initialType, setInitialType] = useState("none");
  const [initialSlotCount, setInitialSlotCount] = useState("1");
  const [initialPriorityCount, setInitialPriorityCount] = useState("1");
  const [initialSlides, setInitialSlides] = useState<Slide[]>(
    Array.from({ length: 6 }, () => ({ ...emptySlide }))
  );

  const fetchSliderConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from("sliders_admin")
      .select("*")
      .maybeSingle<SliderRow>();

    if (error) {
      console.error("Erreur select sliders_admin :", error);
      setLoading(false);
      return;
    }

    if (data) {
      setType(data.type ?? "none");
      setIsActive(data.is_active ?? true);
      setSlotCount(String(data.slot_count ?? 1));

      const slidesValue = Array.isArray(data.slides) ? data.slides : [];
      const normalizedSlides = slidesValue.map(normalizeSlide);
      const paddedSlides = [
        ...normalizedSlides,
        ...Array.from({ length: 6 }, () => ({ ...emptySlide })),
      ].slice(0, 6);

      setSlides(paddedSlides);
      // Priority count comes from the actual saved slides
      setPriorityCount(
        String(normalizedSlides.length > 0 ? normalizedSlides.length : 1)
      );

      // Set initial values
      setInitialType(data.type ?? "none");
      setInitialIsActive(data.is_active ?? true);
      setInitialSlotCount(String(data.slot_count ?? 1));
      setInitialPriorityCount(String(normalizedSlides.length > 0 ? normalizedSlides.length : 1));
      setInitialSlides(paddedSlides);
    } else {
      // Defaults
      setType("none");
      setIsActive(true);
      setSlotCount("1");
      setPriorityCount("1");
      setSlides(Array.from({ length: 6 }, () => ({ ...emptySlide })));

      setInitialType("none");
      setInitialIsActive(true);
      setInitialSlotCount("1");
      setInitialPriorityCount("1");
      setInitialSlides(Array.from({ length: 6 }, () => ({ ...emptySlide })));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchSliderConfig();
  }, [fetchSliderConfig]);

  // Validate Slot Count against Types
  useEffect(() => {
    if (!loading) {
      const simpleValues = sliderSimpleOptions.map((o) => o.value);
      const doubleValues = sliderDoubleOptions.map((o) => o.value);

      const isValid =
        (type === "single" && simpleValues.includes(slotCount)) ||
        (type === "double" && doubleValues.includes(slotCount));

      // Default if invalid
      if (!isValid && type !== "none") {
        setSlotCount(type === "double" ? "2" : "1");
      }
    }
  }, [type, loading]); // Remove slotCount dep to avoid loop, just check on type change

  const handleSave = async () => {
    setLoading(true);

    const effectivePriorityCount = Number(priorityCount);
    // Slice only the priority slides to save
    const trimmedSlides = slides.slice(0, effectivePriorityCount).map(
      (slide) => ({
        image: slide.image || "",
        alt: slide.alt || "",
        link: slide.link || "",
      }),
    );

    const slidesPayload = trimmedSlides as unknown as SliderInsert["slides"];
    const payload: SliderInsert = {
      type,
      slides: slidesPayload,
      is_active: isActive,
      slot_count: Number(slotCount),
    };

    const { data: existing, error } = await supabase
      .from("sliders_admin")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erreur select sliders_admin :", error);
      setLoading(false);
      return;
    }

    const { error: saveError } = existing?.id
      ? await supabase
        .from("sliders_admin")
        .update({ ...payload } as SliderUpdate)
        .eq("id", existing.id)
      : await supabase.from("sliders_admin").insert([payload]);

    if (saveError) {
      console.error("Erreur sauvegarde slider :", saveError);
    } else {
      // Update initial state after save
      setInitialType(type);
      setInitialIsActive(isActive);
      setInitialSlotCount(slotCount);
      setInitialPriorityCount(priorityCount);
      setInitialSlides([...slides]); // Clone 
    }

    setLoading(false);
  };

  const handleSlideChange = (
    index: number,
    key: "image" | "alt" | "link",
    value: string
  ) => {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === index ? { ...slide, [key]: value } : slide
      )
    );
  };

  const getSliderCountOptions = () => {
    if (type === "single") return sliderSimpleOptions;
    if (type === "double") return sliderDoubleOptions;
    return [];
  };

  const hasChanges = useMemo(() => {
    if (loading) return false;
    if (type !== initialType) return true;
    if (isActive !== initialIsActive) return true;
    if (slotCount !== initialSlotCount) return true;
    if (priorityCount !== initialPriorityCount) return true;

    // Check if relevant slides (priority ones) changed
    // We compare up to the MAX of current or initial priority count to cover added/removed slides
    const maxCount = Math.max(Number(priorityCount), Number(initialPriorityCount));
    const currentRelevant = slides.slice(0, maxCount);
    const initialRelevant = initialSlides.slice(0, maxCount);

    return JSON.stringify(currentRelevant) !== JSON.stringify(initialRelevant);
  }, [loading, type, initialType, isActive, initialIsActive, slotCount, initialSlotCount, priorityCount, initialPriorityCount, slides, initialSlides]);

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-3xl">
        <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-10">
          Slider
        </h2>

        {showSkeleton ? (
          <AdminSliderSkeleton />
        ) : (
          <div className="flex flex-col gap-10">
            {/* SLIDER BLOCK */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-[20px]">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase">
                  SLIDER
                </h3>
                <ToggleSwitch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                    Type de slider
                  </label>
                  <AdminDropdown
                    label=""
                    selected={type}
                    onSelect={setType}
                    placeholder="Sélectionnez un type"
                    options={sliderTypeOptions}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                    Nombre de slider
                  </label>
                  <AdminDropdown
                    label=""
                    selected={slotCount}
                    onSelect={setSlotCount}
                    placeholder="Sélectionnez un nombre"
                    options={getSliderCountOptions()}
                  />
                </div>
              </div>
            </div>

            {/* SLIDER PRIORITAIRE BLOCK */}
            {/* Only show if type is selected? Or always? Assuming always visible if enabled or just always visible for config. */}
            {type !== "none" && (
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  SLIDER PRIORITAIRE
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Nombre de slider prioritaire
                    </label>
                    <AdminDropdown
                      label=""
                      selected={priorityCount}
                      onSelect={setPriorityCount}
                      placeholder="1 slider prioritaire"
                      options={priorityCountOptions}
                    />
                  </div>

                  {/* Slides Inputs */}
                  <div className="flex flex-col gap-6">
                    {slides.slice(0, Number(priorityCount)).map((slide, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                            Slider prioritaire {index + 1}
                          </span>
                          <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                            {type === "single"
                              ? "1152px x 250px"
                              : "564px x 250px"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-6">
                          <ImageUploader
                            value={slide.image}
                            onChange={(url) =>
                              handleSlideChange(index, "image", url)
                            }
                          />

                          <AdminTextField
                            label={`Alt slider prioritaire ${index + 1}`}
                            value={slide.alt}
                            onChange={(value) =>
                              handleSlideChange(index, "alt", value)
                            }
                            placeholder={`Alt du slider prioritaire ${index + 1}`}
                            labelClassName="mb-1"
                          />

                          <AdminTextField
                            label={`Lien slider prioritaire ${index + 1}`}
                            value={slide.link}
                            onChange={(value) =>
                              handleSlideChange(index, "link", value)
                            }
                            placeholder={`Lien du slider prioritaire ${index + 1}`}
                            labelClassName="mb-1"
                          />
                        </div>

                        {/* Separator if not last */}
                        {index < Number(priorityCount) - 1 && (
                          <div className="w-full h-[1px] bg-[#D7D4DC] mt-8 mb-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <CTAButton
            onClick={handleSave}
            disabled={!hasChanges || loading}
            loading={loading}
            variant={hasChanges ? "active" : "inactive"}
          >
            <SaveIcon fill={hasChanges ? "white" : "#D7D4DC"} />
            Sauvegarder
          </CTAButton>
        </div>
      </div>
    </main>
  );
}

