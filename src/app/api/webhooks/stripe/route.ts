
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!webhookSecret) return new NextResponse("Missing webhook secret", { status: 500 });
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;
                const customerId = invoice.customer as string;

                // Find user by stripe_customer_id in metadata
                // Note: querying by metadata is slow/complex in standard auth, simpler if we stored it in profiles.
                // For now, let's assume we can query user_subscriptions if we add stripe_subscription_id there, OR query users
                // Since we put it in app_metadata, we have to search users.

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (user) {
                    // Extend subscription
                    // invoice.lines.data[0].period.end
                    const periodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();

                    await supabase.from("user_subscriptions").update({
                        end_date: periodEnd,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);
                }
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (user) {
                    // Mark plan as null or expired
                    await supabase.from("user_subscriptions").update({
                        plan: null, // or "expired"
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);
                }
                break;
            }
        }
    } catch (error: any) {
        console.error(`Error processing webhook: ${error.message}`);
        return new NextResponse("Webhook handler failed", { status: 500 });
    }

    return NextResponse.json({ received: true });
}
