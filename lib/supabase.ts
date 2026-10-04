import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase publishable keys are safe for browser use when RLS is configured.
// Keep the legacy anon key as a fallback so existing deployments continue to work.
const key = publishableKey || anonKey;

export const supabase = url && key ? createClient(url, key) : null;
