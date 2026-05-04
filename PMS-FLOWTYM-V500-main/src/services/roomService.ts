// ═══════════════════════════════════════════════════════════════════════════
// services/roomService.ts — Couche d'accès DB pour les chambres
// ═══════════════════════════════════════════════════════════════════════════

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Room, RoomStatus, CleaningTask, CleaningTaskType, ServiceResult } from '../types';

const TABLE = 'rooms';

// ─── LECTURE ─────────────────────────────────────────────────────────────────

export async function getRooms(hotelId: string): Promise<ServiceResult<Room[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('active', true)
      .order('number');

    if (error) return { data: null, error: error.message };
    return { data: data as Room[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function getRoomByNumber(
  hotelId: string,
  number: string,
): Promise<ServiceResult<Room>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('number', number)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Room, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── MISE À JOUR DU STATUT ───────────────────────────────────────────────────

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
): Promise<ServiceResult<Room>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Room, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ─── TÂCHES DE MÉNAGE ────────────────────────────────────────────────────────

export async function getCleaningTasks(hotelId: string): Promise<ServiceResult<CleaningTask[]>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from('room_cleaning_tasks')
      .select('*, rooms(*)')
      .eq('rooms.hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data as CleaningTask[], error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function createCleaningTask(payload: {
  room_id: string;
  hotel_id?: string;
  task_type: CleaningTaskType;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_date?: string;
  notes?: string;
}): Promise<ServiceResult<CleaningTask>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const { data, error } = await supabase
      .from('room_cleaning_tasks')
      .insert({ status: 'pending', priority: 'normal', ...payload })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CleaningTask, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

export async function updateCleaningTaskStatus(
  taskId: string,
  status: CleaningTask['status'],
): Promise<ServiceResult<CleaningTask>> {
  if (!isSupabaseConfigured() || !supabase) return { data: null, error: 'Supabase non configuré' };

  try {
    const updates: any = { status };
    if (status === 'in_progress') updates.started_at = new Date().toISOString();
    if (status === 'done' || status === 'inspected') updates.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('room_cleaning_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CleaningTask, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}
