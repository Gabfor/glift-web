
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
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

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
                const invoice = event.data.object as any;
                const subscriptionId = typeof invoice.subscription === 'string'
                    ? invoice.subscription
                    : invoice.subscription?.id;

                const customerId = typeof invoice.customer === 'string'
                    ? invoice.customer
                    : invoice.customer?.id;

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
                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : (subscription.customer as Stripe.Customer | Stripe.DeletedCustomer)?.id;

                const { data: { users }, error } = await supabase.auth.admin.listUsers();
                if (error) throw error;

                const user = users.find(u => u.app_metadata?.stripe_customer_id === customerId);

                if (user) {
                    // Mark plan as null or expired in user_subscriptions (if used)
                    await supabase.from("user_subscriptions").update({
                        plan: null,
                        updated_at: new Date().toISOString(),
                    }).eq("user_id", user.id);

                    // Update profiles table as requested
                    await supabase.from("profiles").update({
                        subscription_plan: 'basic',
                        cancellation: false,
                        updated_at: new Date().toISOString(),
                    } as any).eq("id", user.id);
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
