
import { createClient } from "@supabase/supabase-js";

// Hardcoded for one-off script execution
const SUPABASE_URL = "https://wzdkuqxjcqrwrouobpxo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZGt1cXhqY3Fyd3JvdW9icHhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI4NjgzNCwiZXhwIjoyMDYxODYyODM0fQ.tD_c1jKmx7JPLDzEkoqblnBEeASzS2Chxh_vkRLjFDY";

// Init Supabase Admin
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const email = "thea@glift.com";
    console.log(`Fixing user ${email}...`);

    // 1. Find User
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error("User not found!");
        return;
    }
    console.log(`Found user ${user.id}`);

    // 2. Update Metadata
    const customerId = "cus_TxIuXamx5ar642";
    console.log(`Updating metadata with ${customerId}...`);
    await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { stripe_customer_id: customerId }
    });

    // 3. Update Profile
    console.log("Updating profile to premium...");
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30); // Valid for 30 days as a fallback

    const { error: updateError, data } = await supabase.from("profiles").update({
        // stripe_customer_id: customerId, // ERROR: Column does not exist in profiles
        subscription_plan: 'premium',
        premium_end_at: future.toISOString(),
        updated_at: now.toISOString()
    }).eq("id", user.id).select();

    if (updateError) {
        console.error("Update FAILED:", updateError);
    } else {
        console.log("Update SUCCESS:", data);
    }

    console.log("Done!");
}

main().catch(console.error);
