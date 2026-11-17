import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PaymentService } from '@/lib/services/paymentService';
import { SettingsService } from '@/lib/services/settingsService';
import ComptePageClient from './ComptePageClient';
import { COMPTE_PAGE_ID } from '@/app/admin/create-page/pageForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const supabase = await createClient();
    const { data: pageConfig } = await supabase
        .from('pages')
        .select('titre, description, seo_title, seo_description, noindex, nofollow, canonical_override')
        .eq('id', COMPTE_PAGE_ID)
        .single();

    if (!pageConfig) return { title: 'Mon compte' };

    const title = pageConfig.seo_title || pageConfig.titre || 'Mon compte';
    const plainTitle = title.replace(/<[^>]*>/g, '').trim();
    const description = pageConfig.seo_description || pageConfig.description || 'Mettez à jour votre profil, modifiez vos informations ou votre abonnement.';
    const plainDescription = description.replace(/<[^>]*>/g, '').trim();

    const robots: any = {};
    if (pageConfig.noindex) robots.index = false;
    if (pageConfig.nofollow) robots.follow = false;

    return {
        title: plainTitle,
        description: plainDescription,
        robots: Object.keys(robots).length > 0 ? robots : undefined,
        alternates: {
            canonical: pageConfig.canonical_override || '/compte',
        },
    };
}

export default async function ComptePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/connexion');
    }

    const { data: pageData } = await supabase
        .from('pages')
        .select('surtitre, titre, description, url, is_published')
        .eq('id', COMPTE_PAGE_ID)
        .single();

    if (pageData) {
        if (pageData.is_published === false) {
            redirect('/');
        }
        if (pageData.url && pageData.url !== 'compte') {
            redirect(`/${pageData.url}`);
        }
    }

    const paymentService = new PaymentService(supabase);
    const settingsService = new SettingsService(supabase);
    // We can pass user info we already have to save lookups
    const [paymentMethods, profileResponse, rawSettings, subscriptionDetails] = await Promise.all([
        paymentService.getUserPaymentMethods(user.id, user.email, user.app_metadata),
        supabase.from('profiles').select('subscription_plan').eq('id', user.id).single(),
        settingsService.getSettings().catch(() => ({} as Record<string, string>)),
        paymentService.getSubscriptionDetails(user.id, user.email || "", user.app_metadata).catch(() => null),
    ]);

    const isPremium = profileResponse.data?.subscription_plan === 'premium';

    const initialSettings = {
        premiumMonthlyPrice: rawSettings["premium_monthly_price"] || "3,99",
        premiumYearlyPrice: rawSettings["premium_yearly_price"] || "39,99",
        premiumMonthlyEnabled: rawSettings["premium_monthly_enabled"] !== "NON",
        premiumYearlyEnabled: rawSettings["premium_yearly_enabled"] === "OUI",
        starterMaxTrainings: rawSettings["starter_max_trainings"] ? parseInt(rawSettings["starter_max_trainings"], 10) : 1,
        starterMaxExercises: rawSettings["starter_max_exercises"] ? parseInt(rawSettings["starter_max_exercises"], 10) : 10,
        trialDays: rawSettings["trial_period_days"] ? parseInt(rawSettings["trial_period_days"], 10) : 30,
    };

    const initialPageContent = {
        surtitre: pageData?.surtitre ?? '',
        titre: pageData?.titre || '<p>Bienvenue dans votre compte</p>',
        description: pageData?.description ?? '<p>Mettez à jour votre profil, modifiez vos informations ou votre abonnement.</p>',
    };

    return (
        <ComptePageClient
            initialPaymentMethods={paymentMethods}
            initialIsPremium={isPremium}
            initialPageContent={initialPageContent}
            initialSettings={initialSettings}
            initialSubscriptionDetails={subscriptionDetails}
        />
    );
}

