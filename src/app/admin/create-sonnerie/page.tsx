import CreateSonnerieClient from "./CreateSonnerieClient";

export const dynamic = "force-dynamic";

export default async function CreateSonneriePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const ringtoneId =
    typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  return <CreateSonnerieClient ringtoneId={ringtoneId} />;
}

