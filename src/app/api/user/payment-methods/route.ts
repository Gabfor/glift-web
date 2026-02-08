import { createAdminClient, createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/paymentService';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const paymentService = new PaymentService(supabase);
        const paymentMethods = await paymentService.getUserPaymentMethods(user.id, user.email, user.app_metadata);

        return NextResponse.json({ data: paymentMethods });

    } catch (error: any) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { paymentMethodId } = body;

        if (!paymentMethodId) {
            return NextResponse.json({ error: 'Missing paymentMethodId' }, { status: 400 });
        }

        // Use Admin Client to allow metadata and profile updates (like premium_end_at)
        const adminSupabase = createAdminClient();
        const paymentService = new PaymentService(adminSupabase);
        await paymentService.setDefaultPaymentMethod(user.id, user.email || '', user.app_metadata, paymentMethodId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error setting default payment method:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use Admin Client to allow metadata updates
        const adminSupabase = createAdminClient();
        const paymentService = new PaymentService(adminSupabase);
        await paymentService.removePaymentMethod(user.id, user.email || '', user.app_metadata, id);

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error("Error deleting payment method:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
