import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabaseServer";
import AideClient from "./AideClient";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data: pageConfig } = await supabase
    .from("pages")
    .select("titre, description, seo_title, seo_description, noindex, nofollow, canonical_override")
    .eq("id", "eb40db10-0d10-47af-b102-62e2763bef86")
    .single();

  const title = pageConfig?.seo_title || pageConfig?.titre || "Centre d'aide & FAQ";
  const plainTitle = title.replace(/<[^>]*>/g, "").trim();
  const description = pageConfig?.seo_description || pageConfig?.description || "Retrouvez les questions les plus fréquemment posées sur Glift.";
  const plainDescription = description.replace(/<[^>]*>/g, "").trim();

  const robots: any = {};
  if (pageConfig?.noindex) robots.index = false;
  if (pageConfig?.nofollow) robots.follow = false;

  return {
    title: plainTitle,
    description: plainDescription,
    robots: Object.keys(robots).length > 0 ? robots : undefined,
    alternates: {
      canonical: pageConfig?.canonical_override || "/aide",
    },
  };
}

export default async function AidePage() {
  const supabase = await createServerClient();
  const [{ data: pageData }, { data: helpQuestions }] = await Promise.all([
    supabase
      .from("pages")
      .select("surtitre, titre, description, url, is_published")
      .eq("id", "eb40db10-0d10-47af-b102-62e2763bef86")
      .single(),
    supabase
      .from("help_questions")
      .select("*")
      .eq("status", "ON")
      .order("top", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (pageData) {
    if (pageData.is_published === false) {
      notFound();
    }
    if (pageData.url && pageData.url !== "aide") {
      redirect(`/${pageData.url}`);
    }
  }

  const initialPageContent = {
    surtitre: pageData?.surtitre ?? "",
    titre: pageData?.titre || "Aide",
    description: pageData?.description ?? "Retrouvez les questions les plus fréquemment posées par nos utilisateurs.",
  };

  const cleanQuestions = (helpQuestions || []).filter((q: any) => q.question && q.answer);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": cleanQuestions.map((q: any) => ({
      "@type": "Question",
      "name": q.question.replace(/<[^>]*>/g, "").trim(),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer.replace(/<[^>]*>/g, "").trim(),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AideClient initialPageContent={initialPageContent} initialQuestions={helpQuestions || []} />
    </>
  );
}
