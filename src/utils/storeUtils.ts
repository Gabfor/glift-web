import { Database } from "@/lib/supabase/types";
import { StoreProgram } from "@/types/store";
 
type ProgramRow = Database["public"]["Tables"]["program_store"]["Row"];
export type ProgramQueryRow = Pick<
  ProgramRow,
  | "id"
  | "title"
  | "level"
  | "goal"
  | "gender"
  | "sessions"
  | "duration"
  | "description"
  | "image"
  | "image_alt"
  | "partner_image"
  | "partner_image_alt"
  | "partner_link"
  | "link"
  | "downloads"
  | "created_at"
  | "partner_name"
  | "plan"
  | "location"
  | "image_mobile"
>;
 
export const mapProgramRowToCard = (row: ProgramQueryRow): StoreProgram => ({
  id: row.id,
  title: row.title,
  level: row.level ?? "",
  sessions: row.sessions !== null && row.sessions !== undefined ? String(row.sessions) : "",
  duration: row.duration ?? "",
  description: row.description ?? "",
  image: row.image ?? "",
  image_alt: row.image_alt ?? "",
  partner_image: row.partner_image ?? "",
  partner_image_alt: row.partner_image_alt ?? "",
  partner_link: row.partner_link ?? "",
  link: row.link ?? "",
  downloads: row.downloads ?? 0,
  created_at: row.created_at ?? "",
  goal: row.goal ?? "",
  gender: row.gender ?? "",
  partner_name: row.partner_name ?? "",
  plan: (row.plan as "starter" | "premium") ?? "starter",
  location: row.location ?? "",
  image_mobile: row.image_mobile ?? "",
});
 
function extractBlogSlugFromLink(link?: string): string | null {
  if (!link || !link.trim()) return null;
  const match = link.trim().match(/\/blog\/([^/?#]+)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}
 
export async function filterUnpublishedProgramLinks(
  supabase: any,
  programs: StoreProgram[]
): Promise<StoreProgram[]> {
  if (!programs || programs.length === 0) return programs;
 
  const slugs = Array.from(
    new Set(
      programs
        .map((p) => extractBlogSlugFromLink(p.link))
        .filter((s): s is string => Boolean(s))
    )
  );
 
  if (slugs.length === 0) return programs;
 
  try {
    const [{ data: blogPage }, { data: articles }] = await Promise.all([
      supabase
        .from("pages")
        .select("is_published")
        .eq("id", "f9709b0b-b513-4d53-a6ef-d9cda3f0a706")
        .maybeSingle(),
      supabase
        .from("blog_articles")
        .select("url, is_published")
        .in("url", slugs),
    ]);
 
    const isBlogPublished = blogPage ? blogPage.is_published !== false : true;
    const unpublishedSlugs = new Set<string>();
 
    if (Array.isArray(articles)) {
      for (const art of articles) {
        if (art.is_published === false && typeof art.url === "string") {
          unpublishedSlugs.add(art.url);
        }
      }
    }
 
    return programs.map((p) => {
      const slug = extractBlogSlugFromLink(p.link);
      if (!slug) return p;
      if (!isBlogPublished || unpublishedSlugs.has(slug)) {
        return { ...p, link: "" };
      }
      return p;
    });
  } catch {
    return programs;
  }
}
