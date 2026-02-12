
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { WebhookService } from "@/lib/services/webhookService";

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
    const webhookService = new WebhookService(supabase);

    try {
        await webhookService.handleEvent(event);
        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error(`Error processing webhook: ${error.message}`);
        return new NextResponse("Webhook handler failed", { status: 500 });
    }
}
