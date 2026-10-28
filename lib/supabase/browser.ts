import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function hasSupabaseBrowserConfig() {
  return Boolean(getSupabaseConfig());
}

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Konfigurasi Supabase belum lengkap.");
  return createBrowserClient(config.url, config.key);
}
