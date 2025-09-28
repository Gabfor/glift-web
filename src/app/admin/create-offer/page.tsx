"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ImageUploader from "@/app/admin/components/ImageUploader";
import AdminDropdown from "@/app/admin/components/AdminDropdown";
import AdminMultiSelectDropdown from "@/components/AdminMultiSelectDropdown";

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

type Offer = {
  start_date: string;
  end_date?: string | null;
  name: string;
  image: string;
  image_alt: string;
  brand_image: string;
  brand_image_alt: string;
  shop: string;
  shop_website: string;
  shop_link: string;
  type: string[];
  code: string;
  gender: string;
  shipping: string;
  modal: string;
  status: string;
  premium: boolean;
  sport: string;
  condition:string;
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

export default function CreateOfferPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [offerId, setOfferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [offer, setOffer] = useState<Omit<Offer, "id">>({
    start_date: "",
    end_date: "",
    name: "",
    image: "",
    image_alt: "",
    brand_image: "",
    brand_image_alt: "",
    shop: "",
    shop_website: "",
    shop_link: "",
    type: [],
    code: "",
    gender: "",
    shipping: "",
    modal: "",
    status: "ON",
    premium: false,
    sport: "",
    condition: "",
  });

  const fetchOffer = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from("offer_shop")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
      } else if (data) {
        setOffer({
          ...data,
          premium: data.premium ?? false,
        });
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const id = searchParams?.get("id");
    if (id) {
      setOfferId(id);
      void fetchOffer(id);
      return;
    }

    setLoading(false);
  }, [fetchOffer, searchParams]);

  const handleSave = async () => {
    setLoading(true);

    const offerToSave = {
      ...offer,
      shipping: offer.shipping.replace(",", "."),
    };

    if (!offer.end_date || !offer.end_date.includes("-")) {
      delete offerToSave.end_date;
    }

    if (offerId) {
      const { error } = await supabase
        .from("offer_shop")
        .update(offerToSave)
        .eq("id", offerId);
      if (error) alert("Erreur : " + error.message);
    } else {
      const { error } = await supabase.from("offer_shop").insert([offerToSave]);
      if (error) alert("Erreur : " + error.message);
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

  return (
    <main className="min-h-screen bg-[#FBFCFE] flex justify-center px-4 pt-[140px] pb-[40px]">
      <div className="w-full max-w-3xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-10">
          {offerId ? "Modifier l’offre" : "Créer une offre"}
        </h2>

        {loading ? (
          <p className="text-center text-[#5D6494]">Chargement...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Date de début */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Date de début</label>
              <div className="flex gap-2">
                {(() => {
                  const [y, m, d] =
                    offer.start_date && offer.start_date.includes("-")
                      ? offer.start_date.split("-")
                      : ["", "", ""];

                  return (
                    <>
                      {/* Jour */}
                      <AdminDropdown
                        className="w-[88px]"
                        label=""
                        placeholder="Jour"
                        selected={d || ""}
                        onSelect={(day) => {
                          setOffer({
                            ...offer,
                            start_date: `${y || ""}-${m || ""}-${day}`,
                          });
                        }}
                        options={days.map((day) => ({ value: day, label: day }))}
                      />

                      {/* Mois */}
                      <AdminDropdown
                        className="w-[154px]"
                        label=""
                        placeholder="Mois"
                        selected={m || ""}
                        onSelect={(month) => {
                          setOffer({
                            ...offer,
                            start_date: `${y || ""}-${month}-${d || ""}`,
                          });
                        }}
                        options={months}
                      />

                      {/* Année */}
                      <AdminDropdown
                        className="w-[111px]"
                        label=""
                        placeholder="Année"
                        selected={y || ""}
                        onSelect={(year) => {
                          setOffer({
                            ...offer,
                            start_date: `${year}-${m || ""}-${d || ""}`,
                          });
                        }}
                        options={years.map((year) => ({ value: year, label: year }))}
                      />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Date de fin */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Date de fin</label>
              <div className="flex gap-2">
                {(() => {
                  const [y, m, d] =
                    offer.end_date && offer.end_date.includes("-")
                      ? offer.end_date.split("-")
                      : ["", "", ""];

                  return (
                    <>
                      {/* Jour */}
                      <AdminDropdown
                        className="w-[83px]"
                        label=""
                        placeholder="Jour"
                        selected={d || ""}
                        onSelect={(day) => {
                          setOffer({
                            ...offer,
                            end_date: `${y || ""}-${m || ""}-${day}`,
                          });
                        }}
                        options={days.map((day) => ({ value: day, label: day }))}
                      />

                      {/* Mois */}
                      <AdminDropdown
                        className="w-[154px]"
                        label=""
                        placeholder="Mois"
                        selected={m || ""}
                        onSelect={(month) => {
                          setOffer({
                            ...offer,
                            end_date: `${y || ""}-${month}-${d || ""}`,
                          });
                        }}
                        options={months}
                      />

                      {/* Année */}
                      <AdminDropdown
                        className="w-[111px]"
                        label=""
                        placeholder="Année"
                        selected={y || ""}
                        onSelect={(year) => {
                          setOffer({
                            ...offer,
                            end_date: `${year}-${m || ""}-${d || ""}`,
                          });
                        }}
                        options={years.map((year) => ({ value: year, label: year }))}
                      />
                    </>
                  );
                })()}
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
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Boutique</label>
              <input
                type="text"
                value={offer.shop}
                onChange={(e) => setOffer({ ...offer, shop: e.target.value })}
                className="input-admin"
                placeholder="Nom de la boutique"
              />
            </div>

            {/* Alt image principale */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Alt image principale</label>
              <input
                type="text"
                value={offer.image_alt}
                onChange={(e) => setOffer({ ...offer, image_alt: e.target.value })}
                className="input-admin"
                placeholder="Alt de l'image principale"
              />
            </div>

            {/* Site internet boutique */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Site internet</label>
              <input
                type="text"
                value={offer.shop_website}
                onChange={(e) => setOffer({ ...offer, shop_website: e.target.value })}
                className="input-admin"
                placeholder="Lien du site internet"
              />
            </div>

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
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Lien de redirection</label>
              <input
                type="text"
                value={offer.shop_link}
                onChange={(e) => setOffer({ ...offer, shop_link: e.target.value })}
                className="input-admin"
                placeholder="Lien de redirection"
              />
            </div>

            {/* Alt image marque */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Alt image marque</label>
              <input
                type="text"
                value={offer.brand_image_alt}
                onChange={(e) => setOffer({ ...offer, brand_image_alt: e.target.value })}
                className="input-admin"
                placeholder="Alt de l'image marque"
              />
            </div>

            <AdminMultiSelectDropdown
              label="Catégories"
              placeholder="Sélectionnez les catégories"
              selected={offer.type}
              onChange={(values: string[]) => setOffer({ ...offer, type: values })}
              options={offerTypes}
            />

            {/* Code de réduction */}
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Code de réduction</label>
              <input
                type="text"
                value={offer.code}
                onChange={(e) => setOffer({ ...offer, code: e.target.value })}
                className="input-admin"
                placeholder="Insérez le code de réduction"
              />
            </div>

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
            <div className="flex flex-col">
              <label className="text-[#3A416F] font-bold mb-1">Frais de livraison</label>
              <input
                type="text"
                value={offer.shipping}
                onChange={(e) => setOffer({ ...offer, shipping: e.target.value })}
                className="input-admin"
                placeholder="Frais de livraison"
              />
            </div>

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
              <label className="text-[#3A416F] font-bold mb-1">Sport</label>
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
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-1 px-4 h-[44px] bg-[#7069FA] hover:bg-[#6660E4] text-white font-semibold rounded-full transition-all duration-300"
              >
                {offerId ? "Mettre à jour" : "Créer l’offre"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
