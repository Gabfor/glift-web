"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import { AdminTextField } from "@/app/admin/components/AdminTextField";
import AdminMultiSelectDropdown from "@/components/AdminMultiSelectDropdown";
import CTAButton from "@/components/CTAButton";
import GliftLoader from "@/components/ui/GliftLoader";
import useMinimumVisibility from "@/hooks/useMinimumVisibility";
import {
  OfferFormState,
  OfferRow,
  buildOfferPayload,
  emptyOffer,
  mapOfferRowToForm,
  normalizeOfferId,
} from "./offerForm";

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const months = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

const getDateParts = (value: string): [string, string, string] => {
  if (value && value.includes("-")) {
    const [year = "", month = "", day = ""] = value.split("-");
    return [year, month, day];
  }
  return ["", "", ""];
};

const offerTypes = [
  { value: "Accessoires", label: "Accessoires" },
  { value: "Bien-être", label: "Bien-être" },
  { value: "Chaussures", label: "Chaussures" },
  { value: "Compléments", label: "Compléments" },
  { value: "Nutrition", label: "Nutrition" },
  { value: "Technologie", label: "Technologie" },
  { value: "Vêtements", label: "Vêtements" },
];

type CreateOfferPageClientProps = {
  initialOffer: OfferFormState | null;
  offerId: string | null;
};

export default function CreateOfferPageClient({
  initialOffer,
  offerId,
}: CreateOfferPageClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [offer, setOffer] = useState<OfferFormState>(initialOffer ?? emptyOffer);
  const [loading, setLoading] = useState(
    () => Boolean(offerId) && !initialOffer,
  );
  const showLoader = useMinimumVisibility(loading);

  const fetchOffer = useCallback(
    async (id: string) => {
      setLoading(true);
      const normalizedId = normalizeOfferId(id);

      if (normalizedId === null) {
        console.error("Identifiant d’offre invalide:", id);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("offer_shop")
        .select("*")
        .eq("id", normalizedId)
        .maybeSingle<OfferRow>();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        setOffer(mapOfferRowToForm(data));
      }
      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    if (initialOffer) {
      setOffer(initialOffer);
      setLoading(false);
      return;
    }

    if (offerId) {
      void fetchOffer(offerId);
      return;
    }

    setOffer(emptyOffer);
    setLoading(false);
  }, [initialOffer, offerId, fetchOffer]);

  const handleSave = async () => {
    setLoading(true);

    const offerPayload = buildOfferPayload(offer);

    if (offerId) {
      const normalizedId = normalizeOfferId(offerId);

      if (normalizedId === null) {
        alert("Erreur : identifiant d’offre invalide.");
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from("offer_shop")
        .update(offerPayload)
        .eq("id", normalizedId);
      if (error) {
        alert("Erreur : " + error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/admin/offer-shop");
      return;
    }

    const { error } = await supabase
      .from("offer_shop")
      .insert([offerPayload]);

    if (error) {
      alert("Erreur : " + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/admin/offer-shop");
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = offer.condition.substring(0, start);
    const after = offer.condition.substring(end);

    const newText = before + text + after;

    setOffer({ ...offer, condition: newText });

    // Repositionner le curseur après insertion
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    });
  };

  const [startYear, startMonth, startDay] = getDateParts(offer.start_date);
  const [endYear, endMonth, endDay] = getDateParts(offer.end_date);

  return (
    <>
      {showLoader && <GliftLoader />}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
        <div className="w-full max-w-3xl">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {offerId ? "Modifier l’offre" : "Créer une offre"}
          </h2>

          {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Date de début */}
                <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Date de début</label>
              <div className="flex gap-2">
                <>
                  {/* Jour */}
                  <AdminDropdown
                    className="w-[88px]"
                    label=""
                    placeholder="Jour"
                    selected={startDay || ""}
                    onSelect={(day) => {
                      setOffer({
                        ...offer,
                        start_date: `${startYear || ""}-${startMonth || ""}-${day}`,
                      });
                    }}
                    options={days.map((day) => ({ value: day, label: day }))}
                    allowTyping
                    digitsOnly
                    inputLength={2}
                    padWithZero
                  />

                  {/* Mois */}
                  <AdminDropdown
                    className="w-[154px]"
                    label=""
                    placeholder="Mois"
                    selected={startMonth || ""}
                    onSelect={(month) => {
                      setOffer({
                        ...offer,
                        start_date: `${startYear || ""}-${month}-${startDay || ""}`,
                      });
                    }}
                    options={months}
                    allowTyping
                    digitsOnly
                    inputLength={2}
                    padWithZero
                    sortStrategy="month"
                  />

                  {/* Année */}
                  <AdminDropdown
                    className="w-[111px]"
                    label=""
                    placeholder="Année"
                    selected={startYear || ""}
                    onSelect={(year) => {
                      setOffer({
                        ...offer,
                        start_date: `${year}-${startMonth || ""}-${startDay || ""}`,
                      });
                    }}
                    options={years.map((year) => ({ value: year, label: year }))}
                    allowTyping
                    digitsOnly
                    inputLength={4}
                    sortStrategy="year-desc"
                  />
                </>
              </div>
            </div>

            {/* Date de fin */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Date de fin</label>
              <div className="flex gap-2">
                <>
                  {/* Jour */}
                  <AdminDropdown
                    className="w-[83px]"
                    label=""
                    placeholder="Jour"
                    selected={endDay || ""}
                    onSelect={(day) => {
                      setOffer({
                        ...offer,
                        end_date: `${endYear || ""}-${endMonth || ""}-${day}`,
                      });
                    }}
                    options={days.map((day) => ({ value: day, label: day }))}
                    allowTyping
                    digitsOnly
                    inputLength={2}
                    padWithZero
                  />

                  {/* Mois */}
                  <AdminDropdown
                    className="w-[154px]"
                    label=""
                    placeholder="Mois"
                    selected={endMonth || ""}
                    onSelect={(month) => {
                      setOffer({
                        ...offer,
                        end_date: `${endYear || ""}-${month}-${endDay || ""}`,
                      });
                    }}
                    options={months}
                    allowTyping
                    digitsOnly
                    inputLength={2}
                    padWithZero
                    sortStrategy="month"
                  />

                  {/* Année */}
                  <AdminDropdown
                    className="w-[111px]"
                    label=""
                    placeholder="Année"
                    selected={endYear || ""}
                    onSelect={(year) => {
                      setOffer({
                        ...offer,
                        end_date: `${year}-${endMonth || ""}-${endDay || ""}`,
                      });
                    }}
                    options={years.map((year) => ({ value: year, label: year }))}
                    allowTyping
                    digitsOnly
                    inputLength={4}
                    sortStrategy="year-desc"
                  />
                </>
              </div>
            </div>

          {/* Titre avec compteur */}
          <div className="flex flex-col">
            <div className="flex justify-between mb-[5px]">
              <span className="text-[16px] text-[#3A416F] font-bold">Titre</span>
              <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                {offer.name.length}/52
              </span>
            </div>
            <input
              type="text"
              placeholder="Titre de l’offre"
              value={offer.name}
              onChange={(e) => setOffer({ ...offer, name: e.target.value })}
              className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                         border border-[#D7D4DC] hover:border-[#C2BFC6]
                         focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                         transition-all duration-150"
            />
          </div>

          {/* Image principale avec taille */}
          <div className="flex flex-col">
            <div className="flex justify-between mb-[5px]">
              <span className="text-[16px] text-[#3A416F] font-bold">Image principale</span>
              <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">270px x 180px</span>
            </div>
            <ImageUploader
              value={offer.image}
              onChange={(url) => setOffer({ ...offer, image: url })}
            />
          </div>

            {/* Boutique */}
            <AdminTextField
              label="Boutique"
              value={offer.shop}
              onChange={(value) => setOffer({ ...offer, shop: value })}
              placeholder="Nom de la boutique"
              labelClassName="mb-1"
            />

            {/* Alt image principale */}
            <AdminTextField
              label="Alt image principale"
              value={offer.image_alt}
              onChange={(value) => setOffer({ ...offer, image_alt: value })}
              placeholder="Alt de l'image principale"
              labelClassName="mb-1"
            />

            {/* Site internet boutique */}
            <AdminTextField
              label="Site internet"
              value={offer.shop_website}
              onChange={(value) => setOffer({ ...offer, shop_website: value })}
              placeholder="Lien du site internet"
              labelClassName="mb-1"
            />

          {/* Image partenaire avec taille */}
          <div className="flex flex-col">
            <div className="flex justify-between mb-[5px]">
              <span className="text-[16px] text-[#3A416F] font-bold">Image partenaire</span>
              <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">70px x 70px</span>
            </div>
            <ImageUploader
              value={offer.brand_image}
              onChange={(url) => setOffer({ ...offer, brand_image: url })}
            />
          </div>

            {/* Lien de redirection */}
            <AdminTextField
              label="Lien de redirection"
              value={offer.shop_link}
              onChange={(value) => setOffer({ ...offer, shop_link: value })}
              placeholder="Lien de redirection"
              labelClassName="mb-1"
            />

            {/* Alt image marque */}
            <AdminTextField
              label="Alt image marque"
              value={offer.brand_image_alt}
              onChange={(value) => setOffer({ ...offer, brand_image_alt: value })}
              placeholder="Alt de l'image marque"
              labelClassName="mb-1"
            />

            <AdminMultiSelectDropdown
              label="Catégories"
              placeholder="Sélectionnez les catégories"
              selected={offer.type}
              onChange={(values: string[]) => setOffer({ ...offer, type: values })}
              options={offerTypes}
            />

            {/* Code de réduction */}
            <AdminTextField
              label="Code de réduction"
              value={offer.code}
              onChange={(value) => setOffer({ ...offer, code: value })}
              placeholder="Insérez le code de réduction"
              labelClassName="mb-1"
            />

            {/* Sexe */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Sexe</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le sexe"
                selected={offer.gender}
                onSelect={(value) => setOffer({ ...offer, gender: value })}
                options={[
                  { value: "Tous", label: "Tous" },
                  { value: "Homme", label: "Homme" },
                  { value: "Femme", label: "Femme" },
                ]}
              />
            </div>

            {/* Livraison */}
            <AdminTextField
              label="Frais de livraison"
              value={offer.shipping}
              onChange={(value) => setOffer({ ...offer, shipping: value })}
              placeholder="Frais de livraison"
              labelClassName="mb-1"
            />

            {/* Modal */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Type de modal</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le type de modal"
                selected={offer.modal}
                onSelect={(value) => setOffer({ ...offer, modal: value })}
                options={[
                  { value: "Avec code", label: "Avec code" },
                  { value: "Sans code", label: "Sans code" },
                ]}
              />
            </div>

            {/* Statut */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Statut</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le statut"
                selected={offer.status}
                onSelect={(value) => setOffer({ ...offer, status: value })}
                options={[
                  { value: "ON", label: "ON" },
                  { value: "OFF", label: "OFF" },
                ]}
              />
            </div>

            {/* Premium */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Offre Premium</label>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez le type d'offre"
                selected={offer.premium ? "Oui" : "Non"}
                onSelect={(value) => setOffer({ ...offer, premium: value === "Oui" })}
                options={[
                  { value: "Oui", label: "Oui" },
                  { value: "Non", label: "Non" },
                ]}
              />
            </div>

            {/* Sport */}
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <label className="text-[#3A416F] font-bold">Sport</label>
                {offer.sport && (
                  <button
                    type="button"
                    onClick={() => setOffer({ ...offer, sport: "" })}
                    className="text-[12px] mt-[3px] text-[#7069FA] font-semibold hover:text-[#6660E4]"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <AdminDropdown
                label=""
                placeholder="Sélectionnez un sport"
                selected={offer.sport}
                onSelect={(value) => setOffer({ ...offer, sport: value })}
                options={[
                  { value: "Boxe", label: "Boxe" },
                  { value: "Musculation", label: "Musculation" },
                  { value: "Running", label: "Running" },
                  { value: "Yoga", label: "Yoga" },
                ]}
              />
            </div>

            {/* Conditions avec insertion dynamique */}
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <label className="text-[#3A416F] font-bold">Description</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => insertAtCursor("{date}")}
                    className="px-2 py-[2px] text-[12px] font-semibold border border-[#3A416F] text-[#3A416F] rounded-full hover:bg-[#3A416F] hover:text-[#fff] transition"
                  >
                    Date de fin
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor("{site}")}
                    className="px-2 py-[2px] text-[12px] font-semibold border border-[#3A416F] text-[#3A416F] rounded-full hover:bg-[#3A416F] hover:text-[#fff] transition"
                  >
                    Site web
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={offer.condition}
                onChange={(e) => setOffer({ ...offer, condition: e.target.value })}
                className="w-full h-[100px] text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494]
                          border border-[#D7D4DC] hover:border-[#C2BFC6]
                          focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                          transition-all duration-150"
                placeholder="Conditions de l’offre"
              />
            </div>

            {/* Bouton */}
            <div className="md:col-span-2 mt-6 flex justify-center">
              <CTAButton onClick={handleSave}>
                {offerId ? "Mettre à jour" : "Créer l’offre"}
              </CTAButton>
            </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
