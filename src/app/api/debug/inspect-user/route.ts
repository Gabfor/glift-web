import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const adminSupabase = createAdminClient();

        // List recent users to find the new ID
        const { data: { users }, error: userError } = await adminSupabase.auth.admin.listUsers({
            page: 1,
            perPage: 5,
            sortBy: { property: 'created_at', direction: 'desc' }
        });

        return NextResponse.json({
            users: users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })),
            error: userError
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
