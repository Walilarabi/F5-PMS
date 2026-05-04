// ═══════════════════════════════════════════════════════════════════════════
// lib/supabase.ts — Client Supabase avec guard de configuration
//
// Le client est null si Supabase n'est pas configuré.
// Toujours vérifier isSupabaseConfigured() avant d'appeler supabase.
// Les services/ gèrent ce cas et retournent une erreur lisible.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const PLACEHOLDER_VALUES = new Set([
  'YOUR_SUPABASE_URL',
  'your-project-url',
  'https://your-project.supabase.co',
]);

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (PLACEHOLDER_VALUES.has(supabaseUrl)) return false;
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

// Typage strict : SupabaseClient ou null selon la configuration
export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (error) {
    console.error('[Supabase] Échec d\'initialisation du client:', error);
    return null;
  }
})();
