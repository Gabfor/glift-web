import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentService } from '@/lib/services/paymentService';
import ComptePageClient from './ComptePageClient';

export default async function ComptePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/connexion');
    }

    const paymentService = new PaymentService(supabase);
    // We can pass user info we already have to save lookups
    const [paymentMethods, profileResponse] = await Promise.all([
        paymentService.getUserPaymentMethods(user.id, user.email, user.app_metadata),
        supabase.from('profiles').select('subscription_plan').eq('id', user.id).single()
    ]);

    const isPremium = profileResponse.data?.subscription_plan === 'premium';

    return <ComptePageClient initialPaymentMethods={paymentMethods} initialIsPremium={isPremium} />;
}
