import { createClient } from "@supabase/supabase-js";

// Only initialise Supabase when credentials are present.
// The rest of the app uses file-based storage (admin-data.ts) so Supabase
// is optional — importing this file won't crash if env vars are missing.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
