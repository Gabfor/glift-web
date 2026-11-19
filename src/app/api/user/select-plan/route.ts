import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type PlanAction = "select" | "cancel" | "update_interval";

async function getAuthenticatedUser(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) return user;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const adminSupabase = createAdminClient();
    const res = await adminSupabase.auth.getUser(token);
    if (res.data?.user) return res.data.user;
  }

  return null;
}

/**
 * Sélection de plan / gestion d'essai sans carte bancaire (utilisé par glift-mobile).
 * Toutes les écritures sensibles sur `profiles` et `user_subscriptions` passent
 * par `createAdminClient()` afin d'empêcher l'auto-attribution de Premium côté client.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action: PlanAction =
      body?.action === "cancel" || body?.action === "update_interval" ? body.action : "select";
    const plan = body?.plan === "premium" ? "premium" : "starter";
    const interval: "monthly" | "yearly" = body?.interval === "yearly" ? "yearly" : "monthly";

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await (admin as any)
      .from("profiles")
      .select(
        "subscription_plan, subscription_interval, trial, premium_trial_started_at, premium_trial_end_at, premium_end_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const now = new Date();
    const trialEndDate = profile?.premium_trial_end_at
      ? new Date(profile.premium_trial_end_at)
      : profile?.premium_trial_started_at
        ? new Date(new Date(profile.premium_trial_started_at).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
    const isTrialActive = Boolean(trialEndDate && trialEndDate > now);
    const hasUsedTrial = Boolean(profile?.trial || profile?.premium_trial_started_at);

    if (action === "cancel") {
      const fallbackEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const endAt = profile?.premium_end_at || (isTrialActive && trialEndDate ? trialEndDate.toISOString() : fallbackEnd);

      const { error: updateErr } = await (admin as any)
        .from("profiles")
        .update({ cancellation: true, premium_end_at: endAt })
        .eq("id", user.id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json({ success: true, status: "cancelled", premium_end_at: endAt });
    }

    if (action === "update_interval") {
      const currentIsYearly = profile?.subscription_interval === "yearly";
      const wasDowngradeToMonthly = !isTrialActive && currentIsYearly && interval === "monthly";

      const updateData = wasDowngradeToMonthly
        ? { subscription_interval: "yearly", pending_subscription_interval: "monthly" }
        : { subscription_interval: interval, pending_subscription_interval: null };

      const { error: updateErr } = await (admin as any)
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

      await (admin as any).from("user_subscriptions").upsert({
        user_id: user.id,
        plan: "premium",
        interval: wasDowngradeToMonthly ? "yearly" : interval,
      });

      return NextResponse.json({ success: true, status: "interval_updated", interval });
    }

    // action === "select"
    if (plan === "premium") {
      if (!hasUsedTrial) {
        const { data: trialSetting } = await admin
          .from("settings")
          .select("value")
          .eq("key", "trial_period_days")
          .maybeSingle();
        const trialDays = trialSetting?.value ? parseInt(trialSetting.value, 10) || 30 : 30;
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

        const { error: updateErr } = await (admin as any)
          .from("profiles")
          .update({
            subscription_plan: "premium",
            subscription_interval: interval,
            premium_trial_started_at: now.toISOString(),
            premium_trial_end_at: trialEnd.toISOString(),
            trial: true,
            cancellation: false,
            premium_end_at: null,
          })
          .eq("id", user.id);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

        await (admin as any).from("user_subscriptions").upsert({
          user_id: user.id,
          plan: "premium",
          interval,
        });

        return NextResponse.json({ success: true, status: "trial_started" });
      }

      if (isTrialActive) {
        const { error: updateErr } = await (admin as any)
          .from("profiles")
          .update({
            subscription_plan: "premium",
            subscription_interval: interval,
            cancellation: false,
            premium_end_at: null,
          })
          .eq("id", user.id);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

        await (admin as any).from("user_subscriptions").upsert({
          user_id: user.id,
          plan: "premium",
          interval,
        });

        return NextResponse.json({ success: true, status: "trial_resumed" });
      }

      return NextResponse.json(
        { error: "Essai gratuit déjà utilisé. Un paiement Stripe est requis." },
        { status: 403 }
      );
    }

    // plan === "starter"
    const { error: updateErr } = await (admin as any)
      .from("profiles")
      .update({ subscription_plan: "starter", cancellation: false })
      .eq("id", user.id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    await (admin as any).from("user_subscriptions").upsert({
      user_id: user.id,
      plan: "starter",
    });

    return NextResponse.json({ success: true, status: "starter" });
  } catch (err: any) {
    console.error("select-plan error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
