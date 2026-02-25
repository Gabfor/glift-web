import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We explicitly use the service role key here to bypass RLS
// because public non-authenticated users need to be able to vote.
// IMPORTANT: Never expose the SERVICE_ROLE_KEY to the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { questionId, voteType, action = 'add' } = body;

        if (!questionId || (voteType !== 'top' && voteType !== 'flop') || (action !== 'add' && action !== 'remove' && action !== 'switch')) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // First, fetch the current values
        const { data: currentData, error: fetchError } = await supabaseAdmin
            .from('help_questions')
            .select('top, flop')
            .eq('id', questionId)
            .single();

        if (fetchError || !currentData) {
            console.error("Error fetching question to vote on:", fetchError);
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // Calculate new values
        let updateData: any = {};
        if (action === 'add') {
            updateData = voteType === 'top'
                ? { top: currentData.top + 1 }
                : { flop: currentData.flop + 1 };
        } else if (action === 'remove') {
            updateData = voteType === 'top'
                ? { top: Math.max(0, currentData.top - 1) }
                : { flop: Math.max(0, currentData.flop - 1) };
        } else if (action === 'switch') {
            updateData = voteType === 'top'
                ? { top: currentData.top + 1, flop: Math.max(0, currentData.flop - 1) }
                : { flop: currentData.flop + 1, top: Math.max(0, currentData.top - 1) };
        }

        // Update the row
        const { error: updateError } = await supabaseAdmin
            .from('help_questions')
            .update(updateData)
            .eq('id', questionId);

        if (updateError) {
            console.error("Error updating vote:", updateError);
            return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error("Exception in vote route:", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
