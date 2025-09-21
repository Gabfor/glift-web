"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import ImageUploader from "@/app/admin/components/ImageUploader";
import { useRouter } from "next/navigation";

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
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("none");
  const [count, setCount] = useState("1");
  const [slides, setSlides] = useState(
    Array.from({ length: 6 }, () => ({ image: "", alt: "", link: "" }))
  );

  const requireSession = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      router.replace(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return null;
    }
    return session;
  };

  const fetchSliderConfig = async () => {
    const session = await requireSession();
    if (!session) return;

    const { data, error } = await supabase.from("sliders_admin").select("*").single();
    if (error) {
      console.error("Erreur select sliders_admin :", error);
    }
    if (data) {
      setType(data.type || "none");
      setCount(String(data.slide_count || data.slides?.length || "1"));
      setSlides(
        [...(data.slides || []), {}, {}, {}, {}, {}, {}]
          .slice(0, 6)
          .map((s: any) => ({
            image: s.image || "",
            alt: s.alt || "",
            link: s.link || "",
          }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSliderConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const session = await requireSession();
    if (!session) return;

    const trimmedSlides = slides.slice(0, Number(count)).map((s) => ({
      image: s.image || "",
      alt: s.alt || "",
      link: s.link || "",
    }));

    const payload = {
      type,
      slide_count: Number(count),
      slides: trimmedSlides,
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
      ? await supabase.from("sliders_admin").update(payload).eq("id", existing.id)
      : await supabase.from("sliders_admin").insert(payload);

    if (saveError) {
      console.error("Erreur sauvegarde slider :", saveError);
      setLoading(false);
      return;
    }

    // Retour boutique
    window.location.href = "/shop";
  };

  const handleSlideChange = (index: number, key: "image" | "alt" | "link", value: string) => {
    const updated = [...slides];
    (updated[index] as any)[key] = value;
    setSlides(updated);
  };

  const getSliderCountOptions = () => {
    if (type === "single") return sliderSimpleOptions;
    if (type === "double") return sliderDoubleOptions;
    return [];
    };

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-3xl">
        <h2 className="text-[30px] font-bold text-[#2E3271] text-center mb-10">Slider</h2>

        {loading ? (
          <p className="text-center text-[#5D6494]">Chargement...</p>
        ) : (
          <>
            {/* Choix du type & nombre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Type de slider</label>
                <AdminDropdown
                  label=""
                  selected={type}
                  onSelect={setType}
                  placeholder="Sélectionnez un type"
                  options={sliderTypeOptions}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nombre de slider</label>
                <AdminDropdown
                  label=""
                  selected={count}
                  onSelect={setCount}
                  placeholder="Sélectionnez un nombre"
                  options={getSliderCountOptions()}
                />
              </div>
            </div>

            {/* Slides */}
            <div className="flex flex-col gap-6">
              {slides.slice(0, Number(count)).map((slide, index) => (
                <div key={index} className="flex flex-col gap-6">
                  <div className="flex justify-between">
                    <span className="text-[16px] text-[#3A416F] font-bold">Slider {index + 1}</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                      {type === "single" ? "1152px x 250px" : "564px x 250px"}
                    </span>
                  </div>

                  <ImageUploader
                    value={slide.image}
                    onChange={(url) => handleSlideChange(index, "image", url)}
                  />

                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Alt slider {index + 1}</label>
                    <input
                      type="text"
                      placeholder={`Alt slider ${index + 1}`}
                      value={slide.alt}
                      onChange={(e) => handleSlideChange(index, "alt", e.target.value)}
                      className="input-admin"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Lien slider {index + 1}</label>
                    <input
                      type="text"
                      placeholder={`Lien slider ${index + 1}`}
                      value={slide.link}
                      onChange={(e) => handleSlideChange(index, "link", e.target.value)}
                      className="input-admin"
                    />
                  </div>

                  <div className="h-px bg-[#ECE9F1]" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`
                  inline-flex h-[44px] items-center justify-center rounded-[25px] px-[15px] text-[16px] font-bold
                  ${loading ? "bg-[#F2F1F6] text-[#D7D4DC] cursor-not-allowed" : "bg-[#7069FA] text-white hover:bg-[#6660E4]"}
                `}
              >
                {loading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
