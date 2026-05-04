// ═══════════════════════════════════════════════════════════════════════════
// services/reservationService.ts — Couche d'accès DB pour les réservations
//
// RÈGLES :
// - Tous les composants passent par ce service, jamais Supabase directement.
// - Optimistic locking via updated_at pour prévenir l'overbooking.
// - Détection de conflit avant toute création/modification.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { rangesOverlap } from '../lib/dateUtils';
import type { Reservation, ServiceResult, ReservationFilters } from '../types';

const TABLE = 'reservations';

// ─── LECTURE ─────────────────────────────────────────────────────────────────

export async function getReservations(
  hotelId: string,
  filters?: ReservationFilters,
): Promise<ServiceResult<Reservation[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    let query = supabase
      .from(TABLE)
      .select('*, guests(*)')
      .eq('hotel_id', hotelId)
      .order('check_in', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.dateFrom) query = query.gte('check_in', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('check_out', filters.dateTo);
    if (filters?.roomNumber) query = query.eq('room_number', filters.roomNumber);

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    return { data: data as Reservation[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getReservationById(id: string): Promise<ServiceResult<Reservation>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, guests(*)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Reservation, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── DÉTECTION D'OVERBOOKING ──────────────────────────────────────────────────

export async function checkAvailability(
  hotelId: string,
  roomNumber: string,
  checkin: string,
  checkout: string,
  excludeReservationId?: string,
): Promise<{ available: boolean; conflictId?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { available: true };
  }

  try {
    let query = supabase
      .from(TABLE)
      .select('id, check_in, check_out, status')
      .eq('hotel_id', hotelId)
      .eq('room_number', roomNumber)
      .not('status', 'in', '("cancelled","checked_out","no_show")');

    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }

    const { data, error } = await query;
    if (error) return { available: false, error: error.message };

    const conflict = (data || []).find((r: any) =>
      rangesOverlap(checkin, checkout, r.check_in, r.check_out),
    );

    return conflict
      ? { available: false, conflictId: conflict.id }
      : { available: true };
  } catch (err) {
    return { available: false, error: String(err) };
  }
}

// ─── CRÉATION ─────────────────────────────────────────────────────────────────

export async function createReservation(
  payload: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>,
): Promise<ServiceResult<Reservation>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    // Vérification disponibilité avant insertion
    if (payload.hotel_id && payload.room_number) {
      const avail = await checkAvailability(
        payload.hotel_id,
        payload.room_number,
        payload.check_in,
        payload.check_out,
      );
      if (!avail.available) {
        return {
          data: null,
          error: `Overbooking détecté : chambre ${payload.room_number} déjà réservée sur cette période (RES: ${avail.conflictId ?? 'inconnue'})`,
        };
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...payload, created_at: now, updated_at: now })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Reservation, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── MISE À JOUR (avec optimistic locking) ────────────────────────────────────

export async function updateReservation(
  id: string,
  updates: Partial<Reservation>,
  expectedUpdatedAt?: string,
): Promise<ServiceResult<Reservation>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    // Optimistic locking : si le timestamp a changé, quelqu'un d'autre a modifié
    if (expectedUpdatedAt) {
      const { data: current } = await supabase
        .from(TABLE)
        .select('updated_at')
        .eq('id', id)
        .single();

      if (current && current.updated_at !== expectedUpdatedAt) {
        return {
          data: null,
          error: 'Conflit : la réservation a été modifiée par un autre utilisateur. Rechargez et réessayez.',
        };
      }
    }

    // Vérification disponibilité si les dates ou la chambre changent
    if (updates.room_number && (updates.check_in || updates.check_out)) {
      const current = await getReservationById(id);
      if (current.data) {
        const avail = await checkAvailability(
          current.data.hotel_id ?? '',
          updates.room_number,
          updates.check_in ?? current.data.check_in,
          updates.check_out ?? current.data.check_out,
          id,
        );
        if (!avail.available) {
          return {
            data: null,
            error: `Overbooking détecté : chambre ${updates.room_number} déjà réservée sur cette période`,
          };
        }
      }
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Reservation, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── CHECK-IN ────────────────────────────────────────────────────────────────

export async function checkInReservation(
  id: string,
  expectedUpdatedAt?: string,
): Promise<ServiceResult<Reservation>> {
  return updateReservation(
    id,
    { status: 'checked_in', checkin_status: 'completed' },
    expectedUpdatedAt,
  );
}

// ─── CHECK-OUT ───────────────────────────────────────────────────────────────

export async function checkOutReservation(
  id: string,
  expectedUpdatedAt?: string,
): Promise<ServiceResult<Reservation>> {
  return updateReservation(
    id,
    { status: 'checked_out' },
    expectedUpdatedAt,
  );
}

// ─── ANNULATION ───────────────────────────────────────────────────────────────

export async function cancelReservation(
  id: string,
  reason?: string,
  expectedUpdatedAt?: string,
): Promise<ServiceResult<Reservation>> {
  return updateReservation(
    id,
    {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    },
    expectedUpdatedAt,
  );
}

// ─── SUPPRESSION ──────────────────────────────────────────────────────────────

export async function deleteReservation(id: string): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
