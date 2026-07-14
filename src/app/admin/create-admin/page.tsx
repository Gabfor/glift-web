import CreateAdminClient from "./CreateAdminClient";

export const dynamic = "force-dynamic";

export default async function CreateAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const adminId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  return <CreateAdminClient adminId={adminId} />;
}
