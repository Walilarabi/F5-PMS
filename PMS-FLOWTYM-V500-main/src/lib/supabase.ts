import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseUrl === 'your-project-url') return false;
  
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

// Initialize Supabase only if configured to avoid "supabaseUrl is required" error
export const supabase = (() => {
  if (isSupabaseConfigured()) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }
  return null;
})() as any; // Cast to any to avoid breaking types where it's used with guards
