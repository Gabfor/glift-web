import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import ContactClient from "./ContactClient";

export const revalidate = 60;

export default async function NousContacterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const fromParam = resolvedSearchParams?.from;
  const fromAideInitial = fromParam === "aide" || (Array.isArray(fromParam) && fromParam.includes("aide"));

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
    if (data.url && data.url !== "nous-contacter") {
      redirect(`/${data.url}`);
    }
  }

  const blocks = data?.content_blocks || [];
  const textBlock = Array.isArray(blocks) ? (blocks as any[]).find((b: any) => b.type === "description_aide") : null;
  const description_aide = textBlock ? (textBlock as any).texte || "" : "";

  const initialPageContent = {
    surtitre: data?.surtitre ?? "",
    titre: data?.titre || "Nous contacter",
    description: data?.description ?? "Tu souhaites nous contacter ? Remplis le formulaire ci-dessous et nous reviendrons vers toi rapidement.",
    description_aide,
  };

  return <ContactClient initialPageContent={initialPageContent} fromAideInitial={fromAideInitial} />;
}
