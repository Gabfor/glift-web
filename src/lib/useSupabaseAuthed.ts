'use client';
import { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import { ensureClientSession } from '@/lib/ensureClientSession';

export function useSupabaseAuthed() {
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let abort = false;
    (async () => {
      try { await ensureClientSession(supabase); }
      finally { if (!abort) setReady(true); }
    })();
    return () => { abort = true; };
  }, [supabase]);

  return { supabase, ready };
}
