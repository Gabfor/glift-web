import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let plan: string | null = null;

  if (user) {
    const { data: subRows, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .limit(1);

    if (subscriptionError) {
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }

    plan = subRows?.[0]?.plan ?? null;
  }

  return NextResponse.json({ user, plan });
}
