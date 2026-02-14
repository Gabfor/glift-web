const Stripe = require('stripe');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

async function checkSubscriptions() {
    console.log("Fetching latest subscriptions...");
    const subs = await stripe.subscriptions.list({ limit: 5 });

    for (const sub of subs.data) {
        console.log(`Sub ID: ${sub.id}`);
        console.log(`  Status: ${sub.status}`);
        console.log(`  Current Period End: ${sub.current_period_end} (${new Date(sub.current_period_end * 1000).toISOString()})`);
        console.log(`  Trial End: ${sub.trial_end} (${sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'null'})`);
        console.log(`  Cancel At Period End: ${sub.cancel_at_period_end}`);
        console.log(`  Created: ${new Date(sub.created * 1000).toISOString()}`);
        console.log("---");
    }
}

checkSubscriptions();
