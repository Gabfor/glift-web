import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  : null;

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // Si aucun secret n'est configuré en local, autoriser l'exécution pour les tests
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const providedSecret = headerSecret || querySecret;
  return Boolean(cronSecret && providedSecret === cronSecret);
}

async function lockExtraTrainingsForUser(supabaseAdmin: any, userId: string) {
  try {
    // Récupérer tous les programmes et entraînements de l'utilisateur
    const { data: programs, error: pError } = await supabaseAdmin
      .from("programs")
      .select("id, app, position, trainings(id, app, position, locked)")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (pError || !programs || programs.length === 0) return;

    // Trouver le 1er entraînement visible
    let firstTrainingId: string | null = null;

    for (const program of programs) {
      if (program.app === false) continue;
      const sorted = [...(program.trainings || [])].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
      const first = sorted.find((t: any) => t.app !== false);
      if (first) {
        firstTrainingId = first.id;
        break;
      }
    }

    if (!firstTrainingId && programs[0]?.trainings?.length > 0) {
      const sorted = [...programs[0].trainings].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
      firstTrainingId = sorted[0]?.id || null;
    }

    // Verrouiller les entraînements excédentaires
    for (const program of programs) {
      for (const training of program.trainings || []) {
        const shouldBeLocked = training.id !== firstTrainingId;
        if (training.locked !== shouldBeLocked) {
          await supabaseAdmin
            .from("trainings")
            .update({ locked: shouldBeLocked })
            .eq("id", training.id);
        }
      }
    }
  } catch (e) {
    console.error(`[expire-subscriptions] Erreur lors du verrouillage des entraînements pour ${userId}:`, e);
  }
}

async function processSubscriptionExpirations() {
  const supabaseAdmin = createAdminClient();
  const now = new Date();
  const nowMs = now.getTime();

  // 1. Récupérer tous les profils avec plan Premium (hors administrateurs)
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, subscription_plan, premium_end_at, premium_trial_end_at, premium_trial_started_at, trial, cancellation, is_admin")
    .eq("subscription_plan", "premium");

  if (error) {
    throw new Error(`Erreur récupération profils: ${error.message}`);
  }

  const nonAdminProfiles = (profiles || []).filter((p: any) => p.is_admin !== true);

  const results: {
    userId: string;
    reason: string;
    downgraded: boolean;
  }[] = [];

  for (const profile of nonAdminProfiles) {
    const rawPremiumEnd = profile.premium_end_at;
    const rawTrialEnd = profile.premium_trial_end_at;
    const rawTrialStarted = profile.premium_trial_started_at;

    let isExpired = false;
    let expirationReason = "";

    // Cas 1 : Abonnement payant avec date de fin définie (résilié)
    if (rawPremiumEnd) {
      const premiumEndMs = new Date(rawPremiumEnd).getTime();
      if (premiumEndMs < nowMs) {
        isExpired = true;
        expirationReason = `Abonnement payant expiré le ${rawPremiumEnd}`;
      }
    }
    // Cas 2 : Période d'essai sans date de fin payante
    else {
      let trialEndMs: number | null = null;
      if (rawTrialEnd) {
        trialEndMs = new Date(rawTrialEnd).getTime();
      } else if (rawTrialStarted) {
        trialEndMs = new Date(rawTrialStarted).getTime() + 30 * 24 * 60 * 60 * 1000;
      }

      if (trialEndMs && trialEndMs < nowMs) {
        isExpired = true;
        expirationReason = `Essai de 30 jours expiré le ${new Date(trialEndMs).toISOString()}`;
      }
    }

    if (!isExpired) {
      continue;
    }

    // 2. Vérification de sécurité avec Stripe si Stripe est configuré
    let hasActiveStripeSub = false;

    if (stripe) {
      try {
        // Trouver l'utilisateur dans auth pour récupérer son stripe_customer_id ou email
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const stripeCustomerId = userData?.user?.app_metadata?.stripe_customer_id;
        const email = userData?.user?.email;

        let customerId = stripeCustomerId;
        if (!customerId && email) {
          const customers = await stripe.customers.list({ email, limit: 1 });
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          }
        }

        if (customerId) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 3,
          });

          const premiumPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
          const activeSub = subscriptions.data.find((sub) =>
            sub.items.data.some((item) => item.price.id === premiumPriceId)
          );

          if (activeSub) {
            hasActiveStripeSub = true;
            const subAny = activeSub as any;
            // Mettre à jour la date en BDD au lieu de rétrograder
            const newPeriodEnd = subAny.current_period_end
              ? new Date(subAny.current_period_end * 1000).toISOString()
              : null;
            await supabaseAdmin
              .from("profiles")
              .update({
                premium_end_at: subAny.cancel_at_period_end ? newPeriodEnd : null,
                cancellation: Boolean(subAny.cancel_at_period_end),
                subscription_plan: "premium",
              })
              .eq("id", profile.id);
          }
        }
      } catch (stripeErr) {
        console.error(`[expire-subscriptions] Erreur vérification Stripe pour ${profile.id}:`, stripeErr);
      }
    }

    if (hasActiveStripeSub) {
      results.push({
        userId: profile.id,
        reason: `${expirationReason} (Mais ignoré car abonnement actif détecté sur Stripe)`,
        downgraded: false,
      });
      continue;
    }

    // 3. Rétrogradation effective vers Starter
    const { error: updateProfileErr } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_plan: "starter",
        cancellation: false,
        updated_at: now.toISOString(),
      })
      .eq("id", profile.id);

    if (updateProfileErr) {
      console.error(`[expire-subscriptions] Erreur mise à jour profil ${profile.id}:`, updateProfileErr);
      continue;
    }

    try {
      await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
          user_id: profile.id,
          plan: "starter",
          updated_at: now.toISOString(),
        });
    } catch (_) {}

    // 4. Verrouillage des entraînements excédentaires (règle Starter : 1 max)
    await lockExtraTrainingsForUser(supabaseAdmin, profile.id);

    results.push({
      userId: profile.id,
      reason: expirationReason,
      downgraded: true,
    });
  }

  return {
    timestamp: now.toISOString(),
    checkedCount: nonAdminProfiles.length,
    downgradedCount: results.filter((r) => r.downgraded).length,
    results,
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await processSubscriptionExpirations();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("[expire-subscriptions] Erreur:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
