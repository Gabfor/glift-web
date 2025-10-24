import CreateOfferPageClient from "./CreateOfferPageClient";
import { createServerClient } from "@/lib/supabaseServer";
import {
  OfferFormState,
  OfferRow,
  mapOfferRowToForm,
} from "./offerForm";

export default async function CreateOfferPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const idParam = searchParams?.id;
  let offerId: number | null = null;
  let initialOffer: OfferFormState | null = null;

  if (idParam) {
    const numericId = Number(idParam);

    if (!Number.isNaN(numericId)) {
      offerId = numericId;

      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("offer_shop")
        .select("*")
        .eq("id", numericId)
        .maybeSingle<OfferRow>();

      if (!error && data) {
        initialOffer = mapOfferRowToForm(data);
      }
    }
  }

  return (
    <CreateOfferPageClient initialOffer={initialOffer} offerId={offerId} />
  );
}
