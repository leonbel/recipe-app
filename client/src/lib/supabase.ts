import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnvironment = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export type SupabaseConfigResult =
  | { configured: true; url: string; anonKey: string }
  | { configured: false; missing: Array<"url" | "anonKey"> };

export function resolveSupabaseConfig(environment: SupabaseEnvironment): SupabaseConfigResult {
  const url = (environment.VITE_SUPABASE_URL ?? environment.SUPABASE_URL)?.trim();
  const anonKey = (environment.VITE_SUPABASE_ANON_KEY ?? environment.SUPABASE_ANON_KEY)?.trim();
  const missing: Array<"url" | "anonKey"> = [];

  if (!url) missing.push("url");
  if (!anonKey) missing.push("anonKey");

  if (!url || !anonKey) return { configured: false, missing };
  return { configured: true, url, anonKey };
}

export const supabaseConfig = resolveSupabaseConfig({
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const supabase: SupabaseClient | null = supabaseConfig.configured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
