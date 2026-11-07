"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { RingtoneItem } from "@/app/api/admin/ringtones/route";
import { createClient } from "@/lib/supabaseClient";

type Props = {
  ringtoneId: string | null;
};

const inputClass =
  "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5D6494] transition-all duration-150 truncate";

export default function CreateSonnerieClient({ ringtoneId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [statut, setStatut] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [durationMs, setDurationMs] = useState(2200);

  // Image states
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(ringtoneId));
  const [actionError, setActionError] = useState<string | null>(null);

  // Accordion collapsed state matching other admin create pages: only one open at a time
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    status: false,
    infos: true,
    image: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const isCurrentlyCollapsed = prev[section];
      const nextState: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        nextState[key] = true;
      });
      if (isCurrentlyCollapsed) {
        nextState[section] = false;
      }
      return nextState;
    });
  };

  // Image preview URL (local blob when selected, or remote URL when saved)
  const previewImageUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return imageUrl || null;
  }, [imageFile, imageUrl]);

  // Initial state for dirty detection in edit mode
  const [initialState, setInitialState] = useState({
    name: "",
    statut: true,
    isDefault: false,
    fileName: "",
    imageUrl: "",
    imageAlt: "",
  });

  const isDirty = useMemo(() => {
    if (!ringtoneId) return true; // always dirty in create mode
    return (
      name !== initialState.name ||
      statut !== initialState.statut ||
      isDefault !== initialState.isDefault ||
      fileName !== initialState.fileName ||
      imageUrl !== initialState.imageUrl ||
      imageAlt !== initialState.imageAlt ||
      file !== null ||
      imageFile !== null
    );
  }, [ringtoneId, name, statut, isDefault, fileName, imageUrl, imageAlt, file, imageFile, initialState]);

  // Load existing ringtone data in edit mode
  useEffect(() => {
    if (!ringtoneId) return;

    const fetchRingtone = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/ringtones");
        if (!res.ok) throw new Error("Impossible de charger les données.");
        const data = await res.json();
        const found = (data.ringtones ?? []).find(
          (r: RingtoneItem) => r.id === ringtoneId
        );
        if (found) {
          setName(found.name ?? "");
          setStatut(found.is_active ?? true);
          setIsDefault(found.is_default ?? false);
          setFileName(found.filename ?? "");
          setFileUrl(found.url ?? "");
          setDurationMs(found.duration_ms ?? 2200);
          setImageUrl(found.icon_url ?? "");
          setImageFileName(found.icon_url ? found.icon_url.split("/").pop() || "" : "");
          setImageAlt(found.image_alt ?? "");
          setInitialState({
            name: found.name ?? "",
            statut: found.is_active ?? true,
            isDefault: found.is_default ?? false,
            fileName: found.filename ?? "",
            imageUrl: found.icon_url ?? "",
            imageAlt: found.image_alt ?? "",
          });
        }
      } catch (err) {
        console.error("[CreateSonnerieClient] fetch error:", err);
        setActionError("Impossible de récupérer les détails de la sonnerie.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRingtone();
  }, [ringtoneId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileName(selected.name);
    setActionError(null);

    // Auto-detect duration from audio file
    const audio = new Audio();
    audio.src = URL.createObjectURL(selected);
    audio.onloadedmetadata = () => {
      const detectedMs = Math.round(audio.duration * 1000);
      setDurationMs(detectedMs || 2200);
      URL.revokeObjectURL(audio.src);
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setImageFile(selected);
    setImageFileName(selected.name);
    setActionError(null);
  };

  const isFormValid = useMemo(() => {
    if (name.trim() === "") return false;
    if (!ringtoneId && !file && !fileName) return false;
    return true;
  }, [name, ringtoneId, file, fileName]);

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    setActionError(null);

    try {
      let finalUrl = fileUrl;
      let finalFilename = fileName;

      // If user uploaded a new audio file, upload to storage via admin API
      if (file) {
        finalFilename = file.name;
        try {
          const uploadForm = new FormData();
          uploadForm.append("file", file);
          uploadForm.append("type", "sound");
          const uploadRes = await fetch("/api/admin/ringtones/upload", {
            method: "POST",
            body: uploadForm,
          });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (uploadJson.publicUrl) {
              finalUrl = uploadJson.publicUrl;
            }
          } else {
            finalUrl = `/sounds/${file.name}`;
          }
        } catch {
          finalUrl = `/sounds/${file.name}`;
        }
      }

      // If user uploaded a new SVG / image icon
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);
        uploadForm.append("type", "icon");
        const uploadRes = await fetch("/api/admin/ringtones/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.publicUrl) {
            finalImageUrl = uploadJson.publicUrl;
          } else {
            throw new Error("L'upload de l'image n'a pas retourné d'URL.");
          }
        } else {
          const uploadJson = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadJson.error || "Erreur lors de l'enregistrement de l'image.");
        }
      }

      const ringtoneItem: RingtoneItem = {
        id: ringtoneId || Date.now().toString(),
        name: name.trim(),
        filename: finalFilename,
        url: finalUrl || `/sounds/${finalFilename}`,
        duration_ms: durationMs || 2200,
        is_active: statut,
        is_default: isDefault,
        created_at: new Date().toISOString(),
        icon_url: finalImageUrl || undefined,
        image_alt: imageAlt.trim() || undefined,
      };

      const res = await fetch("/api/admin/ringtones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          ringtone: ringtoneItem,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Une erreur est survenue lors de l'enregistrement."
        );
      }

      router.push("/sonneries");
    } catch (err: any) {
      console.error("[CreateSonnerieClient] handleSave error:", err);
      setActionError(err.message || "Une erreur est survenue.");
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px] flex items-center justify-center">
        <div className="text-center text-[#5D6494] font-semibold">
          Chargement...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full relative z-10">
        <BackLink href="/sonneries" className="mb-6">
          Sonneries
        </BackLink>

        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col">
          <h2 className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {ringtoneId ? "Modifier la sonnerie" : "Ajouter une sonnerie"}
          </h2>

          <div className="flex flex-col gap-8 w-full">
            {/* SECTION 0: STATUT DE LA SONNERIE */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("status")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Statut de la sonnerie
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.status ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.status ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.status && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Statut
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={statut ? "ON" : "OFF"}
                      onSelect={(value) => setStatut(value === "ON")}
                      options={[
                        { value: "ON", label: "ON" },
                        { value: "OFF", label: "OFF" },
                      ]}
                      sortStrategy="none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Par défaut
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={isDefault ? "OUI" : "NON"}
                      onSelect={(value) => setIsDefault(value === "OUI")}
                      options={[
                        { value: "NON", label: "NON" },
                        { value: "OUI", label: "OUI" },
                      ]}
                      sortStrategy="none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 1: INFOS DE LA SONNERIE */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("infos")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Infos de la sonnerie
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.infos ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.infos ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.infos && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Nom
                    </label>
                    <input
                      type="text"
                      placeholder="Sonnerie"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Fichier
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[45px] w-full px-[15px] rounded-[5px] bg-white cursor-pointer
                                 border border-dashed border-[#D7D4DC] hover:border-[#C2BFC6]
                                 focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#5D6494]
                                 transition-all duration-150 flex items-center justify-between"
                    >
                      <span
                        className={`text-[16px] font-semibold truncate ${
                          fileName ? "text-[#3A416F]" : "text-[#D7D4DC]"
                        }`}
                      >
                        {fileName || "Importer un fichier"}
                      </span>
                      <Image
                        src={fileName ? "/icons/success.svg" : "/icons/upload.svg"}
                        alt="Upload Icon"
                        width={22}
                        height={22}
                        className="shrink-0"
                      />
                    </div>
                    <input
                      type="file"
                      accept="audio/mp3,audio/mpeg,audio/wav"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: IMAGE DE LA SONNERIE */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("image")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Image de la sonnerie
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.image ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.image ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.image && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-[10px]">
                  {/* Champ Image */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-baseline mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image</span>
                      {imageFileName || imageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImageFileName("");
                            setImageUrl("");
                            if (imageInputRef.current) {
                              imageInputRef.current.value = "";
                            }
                          }}
                          className="text-[12px] mt-[3px] text-[#5D6494] font-semibold hover:text-[#3A416F] transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                          25px x 25px
                        </span>
                      )}
                    </div>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="h-[45px] w-full px-[15px] rounded-[5px] bg-white cursor-pointer
                                 border border-dashed border-[#D7D4DC] hover:border-[#C2BFC6]
                                 focus-within:border-transparent focus-within:ring-2 focus-within:ring-[#5D6494]
                                 transition-all duration-150 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-[10px] min-w-0">
                        {previewImageUrl && (
                          <div className="w-[25px] h-[25px] shrink-0 flex items-center justify-center">
                            <img
                              src={previewImageUrl}
                              alt="Aperçu"
                              className="w-[25px] h-[25px] object-contain"
                            />
                          </div>
                        )}
                        <span
                          className={`text-[16px] font-semibold truncate ${
                            imageFileName || imageUrl ? "text-[#3A416F]" : "text-[#D7D4DC]"
                          }`}
                        >
                          {imageFileName || (imageUrl ? imageUrl.split("/").pop() : "Importer un fichier")}
                        </span>
                      </div>
                      <Image
                        src={imageFileName || imageUrl ? "/icons/success.svg" : "/icons/upload.svg"}
                        alt="Upload Icon"
                        width={22}
                        height={22}
                        className="shrink-0 ml-2"
                      />
                    </div>
                    <input
                      type="file"
                      accept=".svg,image/svg+xml,image/png,image/webp"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      onClick={(e) => {
                        (e.target as HTMLInputElement).value = "";
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Champ Alt image */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Alt image
                    </label>
                    <input
                      type="text"
                      placeholder="Sonnerie"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {actionError && (
              <div className="w-full max-w-3xl mx-auto -mt-2 mb-4">
                <ErrorMessage title="Erreur" description={actionError} />
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-center mt-6">
              <CTAButton
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || !isDirty || isSaving}
                variant={isFormValid && isDirty && !isSaving ? "active" : "inactive"}
                isAdmin={true}
                className="min-w-[200px]"
              >
                {isSaving
                  ? "Enregistrement..."
                  : ringtoneId
                    ? "Modifier la sonnerie"
                    : "Ajouter la sonnerie"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

