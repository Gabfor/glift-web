import { SupabaseClient } from "@supabase/supabase-js";

interface CreateProvisionalSessionParams {
    email: string;
    password?: string;
}

export async function createProvisionalSession(
    supabase: SupabaseClient,
    params: CreateProvisionalSessionParams
) {
    const { email, password } = params;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || "",
        });

        if (error) {
            return {
                error: error.message,
                code: error.status,
                status: 400,
            };
        }

        if (data.session) {
            return {
                sessionTokens: data.session,
            };
        }

        return {
            error: "Session creation failed",
            code: "session_creation_failed",
            status: 500,
        };
    } catch (err: any) {
        return {
            error: err.message,
            code: "internal_error",
            status: 500
        };
    }
}
