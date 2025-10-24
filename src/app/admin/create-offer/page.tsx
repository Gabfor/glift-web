import CreateOfferPageClient from "./CreateOfferPageClient";
import { createServerClient } from "@/lib/supabaseServer";
import {
  OfferFormState,
  OfferRow,
  mapOfferRowToForm,
} from "./offerForm";

export const dynamic = "force-dynamic";

export default async function CreateOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  let offerId: string | null = null;
  let initialOffer: OfferFormState | null = null;

  if (idParam) {
    offerId = idParam;

    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("offer_shop")
      .select("*")
      .eq("id", idParam)
      .maybeSingle<OfferRow>();

    if (!error && data) {
      initialOffer = mapOfferRowToForm(data);
    }
  }

  return (
    <CreateOfferPageClient initialOffer={initialOffer} offerId={offerId} />
  );
}
