// ═══════════════════════════════════════════════════════════════════════════
// services/guestService.ts — Couche d'accès DB pour les clients/guests
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Guest, LostFoundItem, ServiceResult } from '../types';

const TABLE = 'guests';

// ─── LECTURE ─────────────────────────────────────────────────────────────────

export async function getGuests(hotelId: string): Promise<ServiceResult<Guest[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('blacklisted', false)
      .order('last_name');

    if (error) return { data: null, error: error.message };
    return { data: data as Guest[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getGuestById(id: string): Promise<ServiceResult<Guest>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Guest, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function searchGuests(
  hotelId: string,
  query: string,
): Promise<ServiceResult<Guest[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('hotel_id', hotelId)
      .or(`last_name.ilike.%${query}%,first_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (error) return { data: null, error: error.message };
    return { data: data as Guest[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── CRÉATION / MISE À JOUR ───────────────────────────────────────────────────

export async function upsertGuest(
  guest: Partial<Guest> & { last_name: string; hotel_id: string },
): Promise<ServiceResult<Guest>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const now = new Date().toISOString();
    const payload = guest.id
      ? { ...guest, updated_at: now }
      : { ...guest, created_at: now, updated_at: now };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Guest, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateGuestStats(
  guestId: string,
  additionalAmount: number,
): Promise<ServiceResult<Guest>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    // Incrémente total_stays et total_spent via RPC pour éviter les race conditions
    const { data, error } = await supabase.rpc('increment_guest_stats', {
      p_guest_id: guestId,
      p_amount: additionalAmount,
    });

    if (error) {
      // Fallback si la fonction RPC n'existe pas encore
      const current = await getGuestById(guestId);
      if (!current.data) return { data: null, error: 'Guest introuvable' };

      const { data: updated, error: updateError } = await supabase
        .from(TABLE)
        .update({
          total_stays: (current.data.total_stays ?? 0) + 1,
          total_spent: (current.data.total_spent ?? 0) + additionalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guestId)
        .select()
        .single();

      if (updateError) return { data: null, error: updateError.message };
      return { data: updated as Guest, error: null };
    }

    return { data: data as Guest, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── OBJETS TROUVÉS ───────────────────────────────────────────────────────────

export async function getLostFoundItems(hotelId: string): Promise<ServiceResult<LostFoundItem[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('found_date', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as LostFoundItem[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateLostFoundItemStatus(
  itemId: string,
  status: LostFoundItem['status'],
): Promise<ServiceResult<LostFoundItem>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from('lost_found_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as LostFoundItem, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
