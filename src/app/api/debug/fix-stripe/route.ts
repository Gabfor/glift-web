import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
        return NextResponse.json({ error: 'Missing customer_id param' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Update user metadata
    const { data, error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: {
            stripe_customer_id: customerId
        }
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Linked customer ${customerId} to user ${user.email}`,
        user: data.user
    });
}
