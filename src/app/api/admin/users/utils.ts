import { createClient } from "@/lib/supabase/server";

type AdminCheckSuccess = { status: 200; user: { id: string } };
type AdminCheckFailure = { status: 401 | 403; error: string };

export const ensureAdmin = async (): Promise<
  AdminCheckSuccess | AdminCheckFailure
> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error("user-fetch-failed");
  }

  if (!user) {
    return { status: 401, error: "not-authenticated" };
  }

  // Option A: verify role in database profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return { status: 403, error: "forbidden" };
  }

  return { status: 200, user: { id: user.id } };
};

export type { AdminCheckSuccess };
