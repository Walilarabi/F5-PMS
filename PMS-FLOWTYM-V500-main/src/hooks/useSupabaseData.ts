import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useSupabaseData = (hotelId: number = 1) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);

    try {
      const { data: roomsData } = await supabase.from('rooms').select('*').eq('hotel_id', hotelId);
      const { data: resData } = await supabase.from('reservations').select('*, guests(*)').eq('hotel_id', hotelId);
      const { data: guestsData } = await supabase.from('guests').select('*').eq('hotel_id', hotelId);
      const { data: tasksData } = await supabase.from('room_cleaning_tasks').select('*, rooms(*)').eq('rooms.hotel_id', hotelId);
      const { data: lostData } = await supabase.from('lost_found_items').select('*').eq('hotel_id', hotelId);

      if (roomsData) setRooms(roomsData);
      if (resData) setReservations(resData.map(r => ({
        ...r,
        clientName: r.guests?.name || 'Inconnu',
        clientId: r.guest_id,
        // Map to existing React props structure
        dates: `${r.start_date} – ${r.end_date}`,
        checkin: r.start_date,
        checkout: r.end_date,
        room: r.rooms?.number || 'Non assignée',
        montant: r.total_amount,
        solde: r.total_amount // Should fetch from invoices but for now...
      })));
      if (guestsData) setClients(guestsData);
      if (tasksData) setTasks(tasksData);
      if (lostData) setLostItems(lostData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!isSupabaseConfigured()) return;

    // Real-time subscriptions
    const channel = supabase.channel('pms-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_cleaning_tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found_items' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  return { rooms, reservations, clients, tasks, lostItems, loading, refresh: fetchData };
};
