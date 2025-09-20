'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

export default function VerifyEmailBanner() {
  const { user } = useUser();
  if (!user?.id) return null;
  const supabase = createClient();

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        if (!cancelled) {
          setShow(false);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single();

      if (!cancelled) {
        setShow(!error && data ? data.email_verified === false : false);
        setLoading(false);
      }

      // Realtime : cache automatiquement le bandeau dès que le profil passe à verified
      const channel = supabase
        .channel('profiles-email-verified')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            const next = (payload.new as any)?.email_verified;
            if (typeof next === 'boolean') setShow(!next);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  if (loading || !show) return null;

  const handleResend = async () => {
    try {
      setResending(true);
      await fetch('/api/auth/resend-verification', { method: 'POST' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full bg-transparent flex justify-center px-4 pt-2">
      <div className="w-[1152px] max-w-full">
        <div className="relative rounded-[8px] px-5 py-4 bg-[#E3F9E5]" role="status" aria-live="polite">
          <span className="absolute left-0 top-0 h-full w-[6px] bg-[#57AE5B] rounded-l-[8px]" />
          <p className="text-[#245B2C] text-[15px] font-bold mb-1">
            Merci pour votre inscription&nbsp;!
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[#245B2C] text-[14px] font-semibold leading-relaxed">
              Pour finaliser votre inscription, confirmez votre email en cliquant sur le lien reçu.
              Ce bandeau restera visible tant que votre compte n’est pas validé.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex h-[34px] items-center rounded-[18px] px-4 text-[14px] font-bold bg-[#7069FA] text-white hover:bg-[#6660E4] disabled:opacity-60"
            >
              {resending ? 'Renvoi…' : 'Renvoyer l’email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}