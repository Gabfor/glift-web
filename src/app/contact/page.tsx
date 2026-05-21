import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import ContactClient from "./ContactClient";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("pages")
    .select("surtitre, titre, description, url, is_published, content_blocks")
    .eq("id", "c131a31e-4c74-4b53-bdf5-d41a87e5b61b")
    .single();

  if (data) {
    if (data.is_published === false) {
      notFound();
    }
    if (data.url && data.url !== "contact") {
      redirect(`/${data.url}`);
    }
  }

  const blocks = data?.content_blocks || [];
  const textBlock = Array.isArray(blocks) ? (blocks as any[]).find((b: any) => b.type === "description_aide") : null;
  const description_aide = textBlock ? (textBlock as any).texte || "" : "";

  const initialPageContent = {
    surtitre: data?.surtitre ?? "",
    titre: data?.titre || "Contactez-nous",
    description: data?.description ?? "Vous souhaitez nous contacter ? Remplissez le formulaire ci-dessous et nous reviendrons vers vous rapidement.",
    description_aide,
  };

  return <ContactClient initialPageContent={initialPageContent} />;
}
