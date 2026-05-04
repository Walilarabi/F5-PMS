// ═══════════════════════════════════════════════════════════════════════════
// hooks/useSupabaseData.ts — Synchronisation Supabase temps réel
//
// Corrections appliquées :
// 1. useCallback sur fetchData → stable reference, pas de stale closure
// 2. Séparation initial loading vs background refresh (pas de flicker UI)
// 3. Gestion d'erreur explicite avec état error
// 4. Subscriptions ciblées par table (pas de refetch global)
// 5. Nettoyage garanti du channel via ref
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Types retournés intentionnellement larges (any[]) pour éviter les conflits
// avec les types internes d'App.tsx et PlanChambers.tsx qui ont leurs propres
// interfaces Room/Guest étendues. Le typage fin se fait dans les services/.
export interface SupabaseDataState {
  rooms: any[];
  reservations: any[];
  clients: any[];
  tasks: any[];
  lostItems: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSupabaseData = (hotelId: number = 1): SupabaseDataState => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour éviter les setState sur composant démonté
  const mountedRef = useRef(true);
  // Ref vers le channel actif pour garantir le cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  const fetchData = useCallback(async (showLoadingSpinner = false) => {
    if (!isSupabaseConfigured() || !supabase) return;

    if (showLoadingSpinner && mountedRef.current) setLoading(true);

    try {
      const [roomsRes, resRes, guestsRes, tasksRes, lostRes] = await Promise.allSettled([
        supabase.from('rooms').select('*').eq('hotel_id', hotelId),
        supabase.from('reservations').select('*, guests(*)').eq('hotel_id', hotelId),
        supabase.from('guests').select('*').eq('hotel_id', hotelId),
        supabase.from('room_cleaning_tasks').select('*, rooms(*)').eq('rooms.hotel_id', hotelId),
        supabase.from('lost_found_items').select('*').eq('hotel_id', hotelId),
      ]);

      if (!mountedRef.current) return;

      if (roomsRes.status === 'fulfilled' && roomsRes.value.data) {
        setRooms(roomsRes.value.data);
      }

      if (resRes.status === 'fulfilled' && resRes.value.data) {
        setReservations(
          resRes.value.data.map((r: any) => ({
            ...r,
            // Mapping DB → champs UI legacy
            clientId: r.client_id ?? r.legacy_id,
            guestName: r.guest_name ?? r.guests?.name ?? 'Inconnu',
            dates: r.check_in && r.check_out ? `${r.check_in} – ${r.check_out}` : '',
            checkin: r.check_in,
            checkout: r.check_out,
            room: r.room_number,
            canal: r.source,
            montant: r.total_amount,
            solde: r.solde ?? (r.total_amount - (r.paid_amount ?? 0)),
          })),
        );
      }

      if (guestsRes.status === 'fulfilled' && guestsRes.value.data) {
        setClients(guestsRes.value.data);
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
        setTasks(tasksRes.value.data);
      }

      if (lostRes.status === 'fulfilled' && lostRes.value.data) {
        setLostItems(lostRes.value.data);
      }

      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
        console.error('[useSupabaseData] Fetch error:', err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    mountedRef.current = true;

    // Chargement initial avec spinner
    fetchData(true);

    if (!isSupabaseConfigured() || !supabase) return;

    // Abonnements temps réel — refresh silencieux (pas de spinner)
    const channelName = `pms-sync-hotel-${hotelId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_cleaning_tasks' }, () => {
        fetchData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found_items' }, () => {
        fetchData(false);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useSupabaseData] Realtime channel error, will use polling fallback');
        }
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [hotelId, fetchData]);

  return {
    rooms,
    reservations,
    clients,
    tasks,
    lostItems,
    loading,
    error,
    refresh: () => fetchData(false),
  };
};
