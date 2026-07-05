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
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter (X)" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Site Web" },
];

export default function CreateAuteurClient({ auteurId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Form states
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [posteActuel, setPosteActuel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setPosteActuel(data.poste_actuel || "");
        setImageUrl(data.image_url || "");
        setImageAlt(data.image_alt || "");
        setExperience(data.experience || "");
        setExpertise(data.expertise || "");
        setDescriptionCourte(data.description_courte || "");
        setDescription(data.description || "");
        setStatut(data.statut !== undefined ? data.statut : true);
        setLangue(data.langue || "Français");

        if (Array.isArray(data.liens_sociaux) && data.liens_sociaux.length > 0) {
          setSocialLinks(data.liens_sociaux as SocialLink[]);
        }
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

    const payload = {
      prenom,
      nom,
      poste_actuel: posteActuel,
      image_url: imageUrl || null,
      image_alt: imageAlt,
      experience,
      expertise,
      description_courte: descriptionCourte,
      description,
      liens_sociaux: socialLinks.filter((link) => link.platform || link.url),
      statut,
      langue,
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
      } else {
        const { error: insertError } = await (supabase as any).from("auteurs").insert([
          {
            ...payload,
            created_at: new Date().toISOString(),
          },
        ]);
        error = insertError;
      }

      if (error) throw error;

      router.push("/admin/auteurs");
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494] border border-[#D7D4DC] hover:border-[#C2BFC6] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD] transition-all duration-150";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex items-center justify-center">
        <div className="text-center text-[#5D6494] font-semibold">Chargement...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px]">
      <div className="max-w-[1152px] mx-auto w-full">
        <BackLink href="/admin/auteurs" className="mb-6">
          Auteurs
        </BackLink>
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 flex flex-col">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {auteurId ? "Modifier l'auteur" : "Ajouter un auteur"}
          </h2>

          <div className="flex flex-col gap-8 w-full">
            {/* STATUT DE L'AUTEUR */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                Statut de l'auteur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>

            {/* SECTION 1: INFOS DE L'AUTEUR */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                Infos de l'auteur
              </h3>

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

              {/* Image de profil & Alt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <div className="flex justify-between mb-[5px]">
                    <span className="text-[16px] text-[#3A416F] font-bold">Image de profil</span>
                    <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                      270px x 270px
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
              </div>

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

            {/* SECTION 2: LIENS SOCIAUX */}
            <div className="flex flex-col gap-5">
              <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase tracking-wide">
                Liens sociaux
              </h3>

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

            {/* Action button */}
            <div className="flex justify-center mt-10">
              <CTAButton
                type="button"
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
                loading={isSaving}
              >
                {auteurId ? "Sauvegarder" : "Ajouter l'auteur"}
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
