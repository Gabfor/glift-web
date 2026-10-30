import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ensureAdmin } from '@/app/api/admin/users/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const adminCheck = await ensureAdmin();
    if (adminCheck.status !== 200) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const targetUserId = searchParams.get('user_id');

    if (!customerId) {
        return NextResponse.json({ error: 'Missing customer_id param' }, { status: 400 });
    }

    const admin = createAdminClient();

    // If targetUserId is provided, update that user; otherwise update the calling admin
    const userIdToUpdate = targetUserId || adminCheck.user.id;

    // Update user metadata
    const { data, error: updateError } = await admin.auth.admin.updateUserById(userIdToUpdate, {
        app_metadata: {
            stripe_customer_id: customerId
        }
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Linked customer ${customerId} to user ${userIdToUpdate}`,
        user: data.user
    });
}
