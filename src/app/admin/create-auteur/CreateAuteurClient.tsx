"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import CTAButton from "@/components/CTAButton";
import BackLink from "@/components/BackLink";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { TrashHoverIcon, TrashIcon } from "@/components/icons/TrashIcons";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function hexToRgba(hex: string, opacityPercent: number = 100): string {
  let cleanHex = (hex || "#FBFCFE").replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) {
    cleanHex = "FBFCFE";
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const alpha = Math.min(100, Math.max(0, isNaN(opacityPercent) ? 65 : opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type SocialLink = {
  platform: string;
  url: string;
};

type Props = {
  auteurId: string | null;
};

const platformOptions = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter (X)" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Site Web" },
];

export default function CreateAuteurClient({ auteurId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Site gradient settings configured in Admin
  const siteSettings = useSiteSettings();
  const color1 = siteSettings.gradientColor1 || "#F6E9F9";
  const opacity1 = siteSettings.gradientOpacity1 ?? 65;
  const color2 = siteSettings.gradientColor2 || "#E4ECFF";
  const opacity2 = siteSettings.gradientOpacity2 ?? 65;
  const color3 = siteSettings.gradientColor3 || "#F0EBFF";
  const opacity3 = siteSettings.gradientOpacity3 ?? 80;

  const rgba1 = hexToRgba(color1, opacity1);
  const rgba2 = hexToRgba(color2, opacity2);
  const rgba3 = hexToRgba(color3, opacity3);
  const adminGradient = `linear-gradient(115deg, ${rgba1} 0%, ${rgba3} 45%, ${rgba2} 100%)`;

  // Reproduced shiny iridescent gradient for the 26px circle
  const shinyCircleGradient = useMemo(() => {
    return [
      "radial-gradient(circle at 68% 28%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 35%, rgba(255, 255, 255, 0) 80%)",
      "linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(214, 248, 250, 0.8) 30%, rgba(255, 255, 255, 0.95) 46%, rgba(255, 213, 236, 0.75) 60%, rgba(228, 215, 252, 0.5) 80%, rgba(255, 255, 255, 0) 100%)",
      "linear-gradient(75deg, rgba(251, 207, 232, 0.5) 10%, rgba(255, 255, 255, 0.6) 45%, rgba(207, 250, 254, 0.6) 75%, rgba(224, 231, 255, 0.4) 100%)",
      "radial-gradient(circle at 30% 85%, rgba(255, 214, 234, 0.6) 0%, rgba(237, 216, 253, 0.2) 70%, transparent 100%)",
      "linear-gradient(135deg, #edd9f8 0%, #fcddec 25%, #e8e8fc 55%, #d5f8fb 80%, #f5e8ff 100%)",
    ].join(", ");
  }, []);

  // Form states
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [posteActuel, setPosteActuel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageMobile, setImageMobile] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [experience, setExperience] = useState("");
  const [expertise, setExpertise] = useState("");
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [description, setDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: "", url: "" },
  ]);
  const [statut, setStatut] = useState(true);
  const [langue, setLangue] = useState("Français");
  const [isShiny, setIsShiny] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    status: false,
    infos: true,
    images: true,
    content: true,
    social: true,
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

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial state for change detection (isDirty)
  const [initialAuthorState, setInitialAuthorState] = useState({
    prenom: "",
    nom: "",
    poste_actuel: "",
    image_url: "",
    image_mobile: "",
    image_alt: "",
    experience: "",
    expertise: "",
    description_courte: "",
    description: "",
    liens_sociaux: [{ platform: "", url: "" }] as SocialLink[],
    statut: true,
    langue: "Français",
    is_shiny: false,
  });

  const currentAuthorState = useMemo(() => ({
    prenom,
    nom,
    poste_actuel: posteActuel,
    image_url: imageUrl,
    image_mobile: imageMobile,
    image_alt: imageAlt,
    experience,
    expertise,
    description_courte: descriptionCourte,
    description,
    liens_sociaux: socialLinks,
    statut,
    langue,
    is_shiny: isShiny,
  }), [
    prenom,
    nom,
    posteActuel,
    imageUrl,
    imageMobile,
    imageAlt,
    experience,
    expertise,
    descriptionCourte,
    description,
    socialLinks,
    statut,
    langue,
    isShiny,
  ]);

  const isDirty = useMemo(() => {
    return JSON.stringify(currentAuthorState) !== JSON.stringify(initialAuthorState);
  }, [currentAuthorState, initialAuthorState]);

  // Fetch author data in edit mode
  useEffect(() => {
    if (!auteurId) return;

    const fetchAuthor = async () => {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from("auteurs")
        .select("*")
        .eq("id", auteurId)
        .single();

      if (data && !error) {
        const loadedState = {
          prenom: data.prenom || "",
          nom: data.nom || "",
          poste_actuel: data.poste_actuel || "",
          image_url: data.image_url || "",
          image_mobile: data.image_mobile || "",
          image_alt: data.image_alt || "",
          experience: data.experience || "",
          expertise: data.expertise || "",
          description_courte: data.description_courte || "",
          description: data.description || "",
          liens_sociaux: (Array.isArray(data.liens_sociaux) && data.liens_sociaux.length > 0)
            ? (data.liens_sociaux as SocialLink[])
            : [{ platform: "", url: "" }],
          statut: data.statut !== undefined ? data.statut : true,
          langue: data.langue || "Français",
          is_shiny: Boolean(data.is_shiny),
        };

        setPrenom(loadedState.prenom);
        setNom(loadedState.nom);
        setPosteActuel(loadedState.poste_actuel);
        setImageUrl(loadedState.image_url);
        setImageMobile(loadedState.image_mobile);
        setImageAlt(loadedState.image_alt);
        setExperience(loadedState.experience);
        setExpertise(loadedState.expertise);
        setDescriptionCourte(loadedState.description_courte);
        setDescription(loadedState.description);
        setSocialLinks(loadedState.liens_sociaux);
        setStatut(loadedState.statut);
        setLangue(loadedState.langue);
        setIsShiny(loadedState.is_shiny);

        setInitialAuthorState(loadedState);
      } else {
        console.error("Erreur lors du chargement de l'auteur :", error);
      }
      setIsLoading(false);
    };

    void fetchAuthor();
  }, [auteurId, supabase]);

  const handleSocialChange = (index: number, key: keyof SocialLink, value: string) => {
    setSocialLinks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item))
    );
  };

  const handleAddSocial = () => {
    setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  };

  const handleRemoveSocial = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const isFormValid = useMemo(() => {
    return prenom.trim() !== "" && nom.trim() !== "";
  }, [prenom, nom]);

  const handleSave = async () => {
    setIsSaving(true);

    const payload: Record<string, any> = {
      prenom,
      nom,
      poste_actuel: posteActuel,
      image_url: imageUrl || null,
      image_mobile: imageMobile || null,
      image_alt: imageAlt,
      experience,
      expertise,
      description_courte: descriptionCourte,
      description,
      liens_sociaux: socialLinks.filter((link) => link.platform || link.url),
      statut,
      langue,
      is_shiny: isShiny,
      updated_at: new Date().toISOString(),
    };

    try {
      let error;
      if (auteurId) {
        const { error: updateError } = await (supabase as any)
          .from("auteurs")
          .update(payload)
          .eq("id", auteurId);
        error = updateError;
        if (error && (error.message?.includes("is_shiny") || error.code === "42703")) {
          delete payload.is_shiny;
          const { error: retryError } = await (supabase as any)
            .from("auteurs")
            .update(payload)
            .eq("id", auteurId);
          error = retryError;
        }
        if (error && (error.message?.includes("image_mobile") || error.code === "42703")) {
          delete payload.image_mobile;
          const { error: retryError } = await (supabase as any)
            .from("auteurs")
            .update(payload)
            .eq("id", auteurId);
          error = retryError;
        }
      } else {
        const insertPayload: Record<string, any> = {
          ...payload,
          created_at: new Date().toISOString(),
        };
        const { error: insertError } = await (supabase as any).from("auteurs").insert([
          insertPayload,
        ]);
        error = insertError;
        if (error && (error.message?.includes("is_shiny") || error.code === "42703")) {
          delete insertPayload.is_shiny;
          const { error: retryError } = await (supabase as any).from("auteurs").insert([
            insertPayload,
          ]);
          error = retryError;
        }
        if (error && (error.message?.includes("image_mobile") || error.code === "42703")) {
          delete insertPayload.image_mobile;
          const { error: retryError } = await (supabase as any).from("auteurs").insert([
            insertPayload,
          ]);
          error = retryError;
        }
      }

      if (error) throw error;

      setInitialAuthorState(currentAuthorState);
      router.push("/admin/auteurs");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#5D6494] transition-all duration-150 truncate";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px] flex items-center justify-center">
        <div className="text-center text-[#5D6494] font-semibold">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pt-[100px] md:pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full relative z-10">
        <BackLink href="/admin/auteurs" className="mb-6">
          Auteurs
        </BackLink>
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col">
          <h2 className="text-[24px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {auteurId ? "Modifier l'auteur" : "Ajouter un auteur"}
          </h2>

          <div className="flex flex-col gap-8 w-full">
            {/* SECTION 0: STATUT DE L'AUTEUR */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("status")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Statut de l'auteur
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[10px]">
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Statut</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={statut ? "ON" : "OFF"}
                      onSelect={(value) => setStatut(value === "ON")}
                      options={[
                        { value: "ON", label: "ON" },
                        { value: "OFF", label: "OFF" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Langue</label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez la langue"
                      selected={langue}
                      onSelect={(value) => setLangue(value)}
                      options={[
                        { value: "Français", label: "Français", iconSrc: "/flags/france.svg" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 1: INFOS DE L'AUTEUR */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("infos")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Infos de l'auteur
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
                <div className="flex flex-col gap-5 mt-[10px]">
                  {/* Prénom & Nom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Prénom</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Nom</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Poste actuel */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Poste actuel</label>
                    <input
                      type="text"
                      placeholder="Poste actuel"
                      value={posteActuel}
                      onChange={(e) => setPosteActuel(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: IMAGES */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("images")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Images
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.images ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.images ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.images && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[10px]">
                  {/* Image de profil (Site) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image de profil (Site)</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        1080px x 720px
                      </span>
                    </div>
                    <ImageUploader
                      value={imageUrl}
                      onChange={setImageUrl}
                      placeholder="Importer un fichier"
                      bucket="author-images"
                      basePath="auteurs"
                    />
                  </div>

                  {/* Alt image de profil */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Alt image de profil
                    </label>
                    <input
                      type="text"
                      placeholder="Alt de l'image de profil"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Image de profil (Mobile) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">Image de profil (Mobile)</span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        1080px x 540px
                      </span>
                    </div>
                    <ImageUploader
                      value={imageMobile}
                      onChange={setImageMobile}
                      placeholder="Importer un fichier"
                      bucket="author-images"
                      basePath="auteurs"
                    />
                  </div>

                  {/* Effet Shiny */}
                  <div className="flex flex-col justify-end">
                    <div className="h-[45px] flex items-center gap-[12px]">
                      <div
                        className="w-[26px] h-[26px] rounded-full border border-[#3A416F] shrink-0 overflow-hidden relative transition-all duration-300"
                        style={{
                          background: isShiny ? shinyCircleGradient : adminGradient,
                        }}
                      />
                      <span className="text-[16px] text-[#3A416F] font-bold select-none">
                        Effet Shiny
                      </span>
                      <ToggleSwitch
                        checked={isShiny}
                        onCheckedChange={setIsShiny}
                        isAdmin={true}
                        className="ml-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: CONTENU */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("content")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Contenu
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.content ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.content ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.content && (
                <div className="flex flex-col gap-5 mt-[10px]">
                  {/* Expérience */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Expérience</label>
                    <input
                      type="text"
                      placeholder="Poste actuel"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Expertise */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Expertise</label>
                    <input
                      type="text"
                      placeholder="Poste actuel"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {/* Description courte */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                      Description courte
                    </label>
                    <RichTextEditor
                      value={descriptionCourte}
                      onChange={setDescriptionCourte}
                      minHeight="120px"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col">
                    <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">Description</label>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      minHeight="250px"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: LIENS SOCIAUX */}
            <div className="flex flex-col">
              <div
                onClick={() => toggleSection("social")}
                className="flex justify-between items-center cursor-pointer group mb-[10px]"
              >
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                  Liens sociaux
                </h3>
                <div className="relative w-[18px] h-[18px]">
                  <Image
                    src="/icons/chevron_bloc.svg"
                    alt="Chevron"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.social ? "rotate-180" : ""
                    } group-hover:hidden`}
                  />
                  <Image
                    src="/icons/chevron_bloc_hover.svg"
                    alt="Chevron Hover"
                    fill
                    className={`object-contain transition-transform duration-200 ${
                      !collapsedSections.social ? "rotate-180" : ""
                    } hidden group-hover:block`}
                  />
                </div>
              </div>

              {!collapsedSections.social && (
                <div className="flex flex-col gap-5 mt-[10px]">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end relative group">
                      <div className="flex flex-col">
                        {index === 0 && (
                          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">
                            Réseau social
                          </label>
                        )}
                        <AdminDropdown
                          label=""
                          placeholder="Sélectionnez un réseau"
                          selected={link.platform}
                          onSelect={(value) => handleSocialChange(index, "platform", value)}
                          options={platformOptions}
                        />
                      </div>
                      <div className="flex flex-col">
                        {index === 0 && (
                          <label className="text-[16px] text-[#3A416F] font-bold mb-[5px]">URL</label>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Insérez une URL"
                            value={link.url}
                            onChange={(e) => handleSocialChange(index, "url", e.target.value)}
                            className={inputClass}
                          />
                          {socialLinks.length > 1 && (
                            <button
                              onClick={() => handleRemoveSocial(index)}
                              className="relative w-[20px] h-[20px] transition duration-300 ease-in-out shrink-0"
                              type="button"
                              aria-label="Supprimer"
                            >
                              <div className="relative w-full h-full">
                                <TrashIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-100 hover:opacity-0" />
                                <TrashHoverIcon className="absolute top-0 left-0 h-full w-full transition-opacity duration-300 ease-in-out opacity-0 hover:opacity-100" />
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Ajouter un réseau button */}
                  <button
                    onClick={handleAddSocial}
                    className="w-full h-[45px] border border-dashed border-[#D7D4DC] rounded-[5px] bg-white flex items-center justify-center gap-2 hover:border-[#C2BFC6] transition-all duration-150 group"
                    type="button"
                  >
                    <div className="relative w-[16px] h-[16px]">
                      <Image src="/icons/plus_grey.svg" alt="Ajouter" fill className="object-contain" />
                    </div>
                    <span className="text-[16px] font-semibold text-[#D7D4DC] transition-colors">
                      Ajouter un réseau
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="flex justify-center mt-10">
              <CTAButton
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || !isDirty || isSaving}
                variant={isFormValid && isDirty && !isSaving ? "active" : "inactive"}
                className="font-semibold"
              >
                {isSaving ? "Sauvegarde en cours..." : auteurId ? "Mettre à jour" : "Créer l'auteur"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
