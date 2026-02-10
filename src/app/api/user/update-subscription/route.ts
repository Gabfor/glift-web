import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan } = await request.json();

        if (!plan || (plan !== 'premium' && plan !== 'starter')) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        try {
            // Use Admin Client to allow metadata and profile updates (like premium_end_at)
            const adminSupabase = createAdminClient();
            const paymentService = new PaymentService(adminSupabase);
            const result = await paymentService.updateSubscription(
                user.email!,
                user.id,
                user.user_metadata,
                plan
            );

            // Update local profile to reflect change immediately if possible, or wait for webhook
            if (result.status === 'updated' || result.status === 'created' || result.status === 'already_premium' || result.status === 'reactivated') {
                // Use admin client to bypass RLS
                await adminSupabase.from('profiles').update({ subscription_plan: 'premium' }).eq('id', user.id);
            } else if (result.status === 'canceled_at_period_end') {
                // Do not change status immediately if canceling at period end
                // Or maybe set a flag? 
            } else if (result.status === 'already_starter') {
                await adminSupabase.from('profiles').update({ subscription_plan: 'starter' }).eq('id', user.id);
            }

            return NextResponse.json(result);
        } catch (err: any) {
            console.error('Update subscription error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Update subscription error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
