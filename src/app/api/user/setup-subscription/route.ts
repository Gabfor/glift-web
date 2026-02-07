import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const paymentService = new PaymentService(supabase);
        const setupData = await paymentService.createSubscriptionSetup(user.email!, user.id, user.app_metadata);

        return NextResponse.json(setupData);

    } catch (error: any) {
        console.error("Error setting up subscription:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
