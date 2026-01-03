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
import { COUNTRIES, getCountryFlagIcon } from "@/components/account/constants";
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
const years = Array.from({ length: 10 }, (_, i) => (currentYear - 1 + i).toString());

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showLoader = useMinimumVisibility(loading);
  const shouldRefreshOnShowRef = useRef(Boolean(offerId) && !initialOffer);

  const performOfferRefresh = useCallback(
    async (id: string) => {
      setErrorMessage(null);
      const normalizedId = normalizeOfferId(id);

      if (normalizedId === null) {
        setErrorMessage("Identifiant d’offre invalide.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("offer_shop")
          .select("*")
          .filter("id", "eq", normalizedId)
          .maybeSingle<OfferRow>();

        if (error) {
          setErrorMessage(
            error.message ||
            "Une erreur est survenue lors du chargement de l’offre.",
          );
          setLoading(false);
          return;
        }

        if (data) {
          setOffer(mapOfferRowToForm(data));
        }
      } catch (unknownError) {
        setErrorMessage(
          unknownError instanceof Error
            ? unknownError.message
            : "Une erreur inattendue est survenue.",
        );
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  const handleLoaderShow = useCallback(() => {
    if (!shouldRefreshOnShowRef.current || !offerId) {
      return;
    }

    shouldRefreshOnShowRef.current = false;
    void performOfferRefresh(offerId);
  }, [offerId, performOfferRefresh]);

  const requestOfferRefresh = useCallback(
    (id: string | null) => {
      if (!id) {
        shouldRefreshOnShowRef.current = false;
        return;
      }

      shouldRefreshOnShowRef.current = true;
      setLoading(true);
      if (showLoader) {
        handleLoaderShow();
      }
    },
    [handleLoaderShow, showLoader],
  );

  useEffect(() => {
    if (initialOffer) {
      setOffer(initialOffer);
      setErrorMessage(null);
      setLoading(false);
      shouldRefreshOnShowRef.current = false;
      return;
    }

    if (offerId) {
      requestOfferRefresh(offerId);
      return;
    }

    setOffer(emptyOffer);
    setErrorMessage(null);
    setLoading(false);
    shouldRefreshOnShowRef.current = false;
  }, [initialOffer, offerId, requestOfferRefresh]);

  const handleSave = async () => {
    shouldRefreshOnShowRef.current = false;
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
        .filter("id", "eq", normalizedId);
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
      {showLoader && <GliftLoader onShow={handleLoaderShow} />}
      <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
        <div className="w-full max-w-3xl">
          <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
            {offerId ? "Modifier l’offre" : "Créer une offre"}
          </h2>

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-[30px]">
              {/* STATUT DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Statut de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Statut */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1">
                      Statut
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le statut"
                      selected={offer.status}
                      onSelect={(value) =>
                        setOffer({ ...offer, status: value })
                      }
                      options={[
                        { value: "ON", label: "ON" },
                        { value: "OFF", label: "OFF" },
                      ]}
                    />
                  </div>
                  {/* Boostée */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1">
                      Boostée
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez"
                      selected={offer.boost}
                      onSelect={(value) => setOffer({ ...offer, boost: value })}
                      options={[
                        { value: "OUI", label: "OUI" },
                        { value: "NON", label: "NON" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* DATES DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Dates de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Date de début */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1">
                      Date de début
                    </label>
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
                              start_date: `${startYear || ""}-${startMonth || ""
                                }-${day}`,
                            });
                          }}
                          options={days.map((day) => ({
                            value: day,
                            label: day,
                          }))}
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
                              start_date: `${startYear || ""}-${month}-${startDay || ""
                                }`,
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
                              start_date: `${year}-${startMonth || ""}-${startDay || ""
                                }`,
                            });
                          }}
                          options={years.map((year) => ({
                            value: year,
                            label: year,
                          }))}
                          allowTyping
                          digitsOnly
                          inputLength={4}
                          sortStrategy="none"
                        />
                      </>
                    </div>
                  </div>

                  {/* Date de fin */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1">
                      Date de fin
                    </label>
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
                              end_date: `${endYear || ""}-${endMonth || ""
                                }-${day}`,
                            });
                          }}
                          options={days.map((day) => ({
                            value: day,
                            label: day,
                          }))}
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
                              end_date: `${endYear || ""}-${month}-${endDay || ""
                                }`,
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
                              end_date: `${year}-${endMonth || ""}-${endDay || ""
                                }`,
                            });
                          }}
                          options={years.map((year) => ({
                            value: year,
                            label: year,
                          }))}
                          allowTyping
                          digitsOnly
                          inputLength={4}
                          sortStrategy="none"
                        />
                      </>
                    </div>
                  </div>
                </div>
              </div>

              {/* TITRES ET DESCRIPTION DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Titres et description de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Titre avec compteur */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">
                        Titre
                      </span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        {offer.name.length}/52
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Titre de l’offre"
                      value={offer.name}
                      onChange={(e) =>
                        setOffer({ ...offer, name: e.target.value })
                      }
                      className="h-[45px] w-full text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] rounded-[5px] bg-white text-[#5D6494]
                                 border border-[#D7D4DC] hover:border-[#C2BFC6]
                                 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                                 transition-all duration-150"
                    />
                  </div>

                  {/* Conditions avec insertion dynamique (Description) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-1">
                      <label className="text-[#3A416F] font-bold">
                        Description
                      </label>
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
                      onChange={(e) =>
                        setOffer({ ...offer, condition: e.target.value })
                      }
                      className="w-full h-[100px] text-[16px] font-semibold placeholder-[#D7D4DC] px-[15px] py-[10px] rounded-[5px] bg-white text-[#5D6494]
                                border border-[#D7D4DC] hover:border-[#C2BFC6]
                                focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A1A5FD]
                                transition-all duration-150"
                      placeholder="Description de l’offre"
                    />
                  </div>
                </div>
              </div>

              {/* IMAGES DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Images de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Image principale (Site) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">
                        Image principale (Site)
                      </span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        540px x 360px
                      </span>
                    </div>
                    <ImageUploader
                      value={offer.image}
                      onChange={(url) => setOffer({ ...offer, image: url })}
                    />
                  </div>

                  {/* Alt image principale */}
                  <AdminTextField
                    label="Alt image principale"
                    value={offer.image_alt}
                    onChange={(value) =>
                      setOffer({ ...offer, image_alt: value })
                    }
                    placeholder="Alt de l'image principale"
                    labelClassName="mb-1"
                  />

                  {/* Image principale (Mobile) */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">
                        Image principale (Mobile)
                      </span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        350px x 180px
                      </span>
                    </div>
                    <ImageUploader
                      value={offer.image_mobile}
                      onChange={(url) =>
                        setOffer({ ...offer, image_mobile: url })
                      }
                    />
                  </div>

                  {/* Placeholder for grid alignment if needed */}
                  <div className="hidden md:block"></div>

                  {/* Image de la marque */}
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-[5px]">
                      <span className="text-[16px] text-[#3A416F] font-bold">
                        Image de la marque
                      </span>
                      <span className="text-[12px] text-[#C2BFC6] font-semibold mt-[3px]">
                        140px x 140px
                      </span>
                    </div>
                    <ImageUploader
                      value={offer.brand_image}
                      onChange={(url) =>
                        setOffer({ ...offer, brand_image: url })
                      }
                    />
                  </div>

                  {/* Alt image marque */}
                  <AdminTextField
                    label="Alt image marque"
                    value={offer.brand_image_alt}
                    onChange={(value) =>
                      setOffer({ ...offer, brand_image_alt: value })
                    }
                    placeholder="Alt de l'image marque"
                    labelClassName="mb-1"
                  />
                </div>
              </div>

              {/* DÉTAILS DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Détails de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Sexe */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1 text-[16px]">
                      Sexe
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le sexe"
                      selected={offer.gender}
                      onSelect={(value) =>
                        setOffer({ ...offer, gender: value })
                      }
                      options={[
                        { value: "Tous", label: "Tous" },
                        { value: "Homme", label: "Homme" },
                        { value: "Femme", label: "Femme" },
                      ]}
                    />
                  </div>

                  {/* Catégorie */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1 text-[16px]">
                      Catégorie
                    </label>
                    <AdminMultiSelectDropdown
                      label=""
                      placeholder="Sélectionnez la catégorie"
                      selected={offer.type}
                      onChange={(values: string[]) =>
                        setOffer({ ...offer, type: values })
                      }
                      options={offerTypes}
                    />
                  </div>

                  {/* Pays */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1 text-[16px]">
                      Pays
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez un pays"
                      selected={offer.pays}
                      onSelect={(value) => setOffer({ ...offer, pays: value })}
                      options={[
                        { value: "Tous", label: "Tous", iconSrc: "/flags/europe.svg" },
                        ...COUNTRIES.map((c) => ({
                          value: c,
                          label: c,
                          iconSrc: getCountryFlagIcon(c),
                        })),
                      ]}
                    />
                  </div>

                  {/* Sport */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1 text-[16px]">
                      Sport
                    </label>
                    <AdminMultiSelectDropdown
                      label=""
                      placeholder="Sélectionnez un sport"
                      selected={offer.sport}
                      onChange={(values: string[]) =>
                        setOffer({ ...offer, sport: values })
                      }
                      options={[
                        { value: "Boxe", label: "Boxe" },
                        { value: "Musculation", label: "Musculation" },
                        { value: "Running", label: "Running" },
                        { value: "Yoga", label: "Yoga" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* INFORMATIONS DE L'OFFRE */}
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold text-[#D7D4DC] uppercase mb-[20px]">
                  Informations de l’offre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[30px]">
                  {/* Type de modale */}
                  <div className="flex flex-col">
                    <label className="text-[#3A416F] font-bold mb-1">
                      Type de modale
                    </label>
                    <AdminDropdown
                      label=""
                      placeholder="Sélectionnez le type de modale"
                      selected={offer.modal}
                      onSelect={(value) => setOffer({ ...offer, modal: value })}
                      options={[
                        { value: "Avec code", label: "Avec code" },
                        { value: "Sans code", label: "Sans code" },
                      ]}
                    />
                  </div>

                  {/* Code de réduction */}
                  <AdminTextField
                    label="Code de réduction"
                    value={offer.code}
                    onChange={(value) => setOffer({ ...offer, code: value })}
                    placeholder="Insérez le code de réduction"
                    labelClassName="mb-1"
                  />

                  {/* Boutique */}
                  <AdminTextField
                    label="Boutique"
                    value={offer.shop}
                    onChange={(value) => setOffer({ ...offer, shop: value })}
                    placeholder="Nom de la boutique"
                    labelClassName="mb-1"
                  />

                  {/* Site internet */}
                  <AdminTextField
                    label="Site internet"
                    value={offer.shop_website}
                    onChange={(value) =>
                      setOffer({ ...offer, shop_website: value })
                    }
                    placeholder="Lien du site internet"
                    labelClassName="mb-1"
                  />

                  {/* Lien de redirection */}
                  <AdminTextField
                    label="Lien de redirection"
                    value={offer.shop_link}
                    onChange={(value) =>
                      setOffer({ ...offer, shop_link: value })
                    }
                    placeholder="Lien de redirection"
                    labelClassName="mb-1"
                  />

                  {/* Frais de livraison */}
                  <AdminTextField
                    label="Frais de livraison"
                    value={offer.shipping}
                    onChange={(value) =>
                      setOffer({ ...offer, shipping: value })
                    }
                    placeholder="Frais de livraison"
                    labelClassName="mb-1"
                  />
                </div>
              </div>

              {/* BOUTON */}
              <div className="mt-10 flex justify-center">
                <CTAButton onClick={handleSave}>
                  {offerId ? "Mettre à jour" : "Créer la carte"}
                </CTAButton>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
