import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
});

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient();

        // 1. Get all users from Auth (to get emails)
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        const results = [];

        for (const user of users) {
            let customerId = null;

            // Try fetch by email
            if (user.email) {
                const customers = await stripe.customers.list({ email: user.email, limit: 1 });
                if (customers.data.length > 0) customerId = customers.data[0].id;
            }

            if (customerId) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    status: 'all',
                    limit: 1,
                });

                const activeSub = subscriptions.data.find(sub => ['active', 'trialing', 'past_due'].includes(sub.status));

                if (activeSub) {
                    const trialEnd = activeSub.trial_end ? new Date(activeSub.trial_end * 1000).toISOString() : null;
                    const cancellation = activeSub.cancel_at_period_end;

                    await supabase.from('profiles').update({
                        premium_trial_end_at: trialEnd,
                        cancellation: cancellation
                    } as any).eq('id', user.id);

                    results.push({ email: user.email, trialEnd, cancellation, status: 'synced' });
                } else {
                    results.push({ email: user.email, status: 'no_active_sub' });
                }
            } else {
                results.push({ email: user.email, status: 'no_customer' });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
