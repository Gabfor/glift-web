import { createAdminClient, createClient } from '@/lib/supabase/server';
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

        // Use Admin Client for critical subscription updates and to fetch FRESH metadata
        // (The user object from auth.getUser() might have stale metadata from the JWT)
        const adminSupabase = createAdminClient();
        const { data: { user: freshUser }, error: freshUserError } = await adminSupabase.auth.admin.getUserById(user.id);

        if (freshUserError || !freshUser) {
            console.error("Setup-Sub Route: Failed to fetch fresh user data", freshUserError);
            // Fallback to existing user object if admin fetch fails (unlikely)
        }

        const paymentService = new PaymentService(adminSupabase);
        const metadataToUse = freshUser?.app_metadata || user.app_metadata;

        console.log(`Setup-Sub Route: Auth User ID: ${user.id}, Email: ${user.email}`);
        console.log(`Setup-Sub Route: Using metadata subscription_id: ${metadataToUse?.stripe_subscription_id}`);

        const setupData = await paymentService.createSubscriptionSetup(user.email!, user.id, metadataToUse);

        return NextResponse.json(setupData);

    } catch (error: any) {
        console.error("Error setting up subscription:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
