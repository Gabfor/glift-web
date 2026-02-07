import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService'; // Adjust import path if needed

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const paymentService = new PaymentService(supabase);
        const details = await paymentService.getSubscriptionDetails(user.email!, user.id, user.user_metadata || user.app_metadata);

        return NextResponse.json(details || { status: 'none' });
    } catch (error: any) {
        console.error("Get subscription details error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
