import { NextResponse } from "next/server";
import Stripe from "stripe";

// Utilisation de la clé secrète depuis les variables d'environnement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Dans un vrai cas, on créerait ou récupérerait un Customer Stripe ici
        // const customer = await stripe.customers.create({ email });

        // Pour un essai gratuit, on veut juste valider la carte (SetupIntent)
        // Coût : 0€ immédiat
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ["card"],
            // complet : customer: customer.id,
        });

        return NextResponse.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
        console.error("Internal Error:", error);
        return NextResponse.json(
            { error: `Internal Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
