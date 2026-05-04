// ═══════════════════════════════════════════════════════════════════════════
// services/configService.ts — Persistance de la configuration hôtel
//
// Stratégie de persistance :
// 1. Supabase (table hotels) si configuré
// 2. localStorage comme fallback (mode démo / offline)
//
// La configuration ne doit JAMAIS rester uniquement en mémoire React :
// un refresh perdrait tout — c'est le bug critique identifié.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Hotel, ServiceResult } from '../types';

const LS_KEY = 'flowtym_hotel_config';

// ─── LECTURE ─────────────────────────────────────────────────────────────────

export async function getHotelConfig(hotelId: string): Promise<ServiceResult<Hotel>> {
  // 1. Essai Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();

      if (!error && data) {
        // Synchronise le cache local
        persistToLocalStorage(data as Hotel);
        return { data: data as Hotel, error: null };
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // 2. Fallback localStorage
  const cached = loadFromLocalStorage(hotelId);
  if (cached) return { data: cached, error: null };

  return { data: null, error: 'Configuration introuvable' };
}

// ─── ÉCRITURE ─────────────────────────────────────────────────────────────────

export async function saveHotelConfig(
  config: Partial<Hotel> & { id: string },
): Promise<ServiceResult<Hotel>> {
  const now = new Date().toISOString();

  // 1. Persiste en localStorage immédiatement (pas de risque de perte)
  const existing = loadFromLocalStorage(config.id);
  const merged = { ...existing, ...config } as Hotel;
  persistToLocalStorage(merged);

  // 2. Synchronise Supabase si disponible
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .update({ ...config, updated_at: now })
        .eq('id', config.id)
        .select()
        .single();

      if (!error && data) {
        persistToLocalStorage(data as Hotel);
        return { data: data as Hotel, error: null };
      }
      if (error) {
        // localStorage déjà sauvegardé — on retourne sans erreur critique
        console.warn('[ConfigService] Supabase sync failed, localStorage used:', error.message);
        return { data: merged, error: null };
      }
    } catch (err) {
      console.warn('[ConfigService] Supabase unavailable, localStorage used:', err);
      return { data: merged, error: null };
    }
  }

  return { data: merged, error: null };
}

// ─── CONFIG SECTIONS (clé/valeur) ────────────────────────────────────────────
// Pour les sections de configuration non mappées sur la table hotels
// (ex : politiques d'annulation, templates, webhooks...)

const SECTION_PREFIX = 'flowtym_config_section_';

export function saveSectionConfig<T>(sectionKey: string, data: T): void {
  try {
    localStorage.setItem(`${SECTION_PREFIX}${sectionKey}`, JSON.stringify(data));
  } catch {
    // localStorage plein ou indisponible — dégradation silencieuse
  }
}

export function loadSectionConfig<T>(sectionKey: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${SECTION_PREFIX}${sectionKey}`);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function clearSectionConfig(sectionKey: string): void {
  try {
    localStorage.removeItem(`${SECTION_PREFIX}${sectionKey}`);
  } catch {
    // silent
  }
}

// ─── HELPERS INTERNES ─────────────────────────────────────────────────────────

function persistToLocalStorage(config: Hotel): void {
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    store[config.id] = config;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    // silent — localStorage peut être désactivé (mode privé strict)
  }
}

function loadFromLocalStorage(hotelId: string): Hotel | null {
  try {
    const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return store[hotelId] ?? null;
  } catch {
    return null;
  }
}
