import CreateAuteurClient from "./CreateAuteurClient";

export const dynamic = "force-dynamic";

export default async function CreateAuteurPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const auteurId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  return <CreateAuteurClient auteurId={auteurId} />;
}
