import CreateAdminClient, { AdminFormInitialState } from "./CreateAdminClient";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureAdmin } from "@/app/api/admin/users/utils";

export const dynamic = "force-dynamic";

export default async function CreateAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const idParam = resolvedSearchParams?.id;
  const adminId = typeof idParam === "string" && idParam.trim() !== "" ? idParam : null;

  let initialAdmin: AdminFormInitialState | null = null;
  if (adminId) {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status === 200) {
      const adminClient = createAdminClient();
      const [profileRes, userRes] = await Promise.all([
        (adminClient as any)
          .from("profiles")
          .select("id, name, statut, langue")
          .eq("id", adminId)
          .maybeSingle(),
        adminClient.auth.admin.getUserById(adminId),
      ]);

      const profile = profileRes.data;
      const authUser = userRes.data?.user;
      if (profile || authUser) {
        initialAdmin = {
          prenom: profile?.name ?? "",
          email: authUser?.email ?? "",
          statut: profile?.statut ?? false,
          langue: profile?.langue ?? "Français",
        };
      }
    }
  }

  return <CreateAdminClient adminId={adminId} initialAdmin={initialAdmin} />;
}
