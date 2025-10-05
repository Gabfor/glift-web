"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import CTAButton from "@/components/CTAButton";
import GliftLoader from "@/components/ui/GliftLoader";

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

export default function AdminSliderPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("none");
  const [count, setCount] = useState("1");
  const [slides, setSlides] = useState(
    Array.from({ length: 6 }, () => ({ image: "", alt: "", link: "" }))
  );

  const fetchSliderConfig = useCallback(async () => {
    const { data } = await supabase.from("sliders_admin").select("*").single();
    if (data) {
      setType(data.type || "none");
      setCount(String(data.slide_count || data.slides?.length || "1"));
      setSlides(
        [...(data.slides || []), {}, {}, {}, {}, {}, {}]
          .slice(0, 6)
          .map((slide) => ({
            image: slide.image || "",
            alt: slide.alt || "",
            link: slide.link || "",
          }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchSliderConfig();
  }, [fetchSliderConfig]);

  useEffect(() => {
    if (!loading) {
      const simpleValues = sliderSimpleOptions.map((o) => o.value);
      const doubleValues = sliderDoubleOptions.map((o) => o.value);

      const isValid =
        (type === "single" && simpleValues.includes(count)) ||
        (type === "double" && doubleValues.includes(count));

      if (!isValid) {
        setCount(type === "double" ? "2" : "1");
      }
    }
  }, [type, loading, count]);

  const handleSave = async () => {
    setLoading(true);

    const trimmedSlides = slides.slice(0, Number(count)).map((slide) => ({
      image: slide.image || "",
      alt: slide.alt || "",
      link: slide.link || "",
    }));

    const payload = {
      type,
      slide_count: Number(count),
      slides: trimmedSlides,
    };

    console.log("Payload envoyé à Supabase :", payload);

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
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("sliders_admin").insert(payload);

    if (saveError) {
      console.error("Erreur sauvegarde slider :", saveError);
    } else {
      window.location.href = "/shop";
    }

    setLoading(false);
  };

  const handleSlideChange = (
    index: number,
    key: "image" | "alt" | "link",
    value: string
  ) => {
    const updated = [...slides];
    updated[index][key] = value;
    setSlides(updated);
  };

  const getSliderCountOptions = () => {
    if (type === "single") return sliderSimpleOptions;
    if (type === "double") return sliderDoubleOptions;
    return [];
  };

  return (
    <>
      {loading && <GliftLoader />}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
        <div className="w-full max-w-3xl">
          <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-10">
            Slider
          </h2>

        {!loading && (
          <>
            {type !== "none" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-6 w-full mx-auto">
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
                      selected={count}
                      onSelect={setCount}
                      placeholder="Sélectionnez un nombre"
                      options={getSliderCountOptions()}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {slides.slice(0, Number(count)).map((slide, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex justify-between">
                        <span className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                          Slider {index + 1}
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
                          label={`Alt slider ${index + 1}`}
                          value={slide.alt}
                          onChange={(value) =>
                            handleSlideChange(index, "alt", value)
                          }
                          placeholder={`Alt slider ${index + 1}`}
                        />

                        <AdminTextField
                          label={`Lien slider ${index + 1}`}
                          value={slide.link}
                          onChange={(value) =>
                            handleSlideChange(index, "link", value)
                          }
                          placeholder={`Lien slider ${index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "none" && (
              <div className="flex flex-col gap-6 w-full max-w-md mx-auto mb-6">
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
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex justify-center">
          <CTAButton onClick={handleSave} disabled={loading} loading={loading}>
            Enregistrer
          </CTAButton>
        </div>
      </div>
    </main>
  </>
  );
}
