// ═══════════════════════════════════════════════════════════════════════════
// store/reservationStore.ts — State global Zustand pour les réservations
// Source unique de vérité : Planning + Reservations + PlanChambers + Flowboard
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { MOCK_RESERVATIONS } from '../mocks';

// ─── TYPE ─────────────────────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  clientId?: number;
  guestName?: string;
  status: 'confirmed' | 'pending' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  dates: string;
  nights: number;
  room: string;
  canal: string;
  montant: number;
  solde: number;
  checkin: string;
  checkout: string;
  // Optimistic locking : timestamp de la dernière modification DB connue
  _updatedAt?: string;
  // Champs optionnels
  email?: string;
  phone?: string;
  nationality?: string;
  paymentMode?: string;
  paymentStatus?: string;
  guaranteeType?: string;
  guaranteeStatus?: string;
  preauthRule?: string;
  preauthAmount?: number;
  cleaning_requested?: boolean;
  cleaning_date?: string;
  [key: string]: any;
}

// ─── STORE ────────────────────────────────────────────────────────────────────
interface ReservationStore {
  reservations: Reservation[];

  // Initialiser depuis Supabase (remplace tout le state)
  setReservations: (reservations: Reservation[]) => void;

  // CRUD
  addReservation: (reservation: Reservation) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  removeReservation: (id: string) => void;

  // Helpers métier
  getById: (id: string) => Reservation | undefined;
  getByRoom: (roomNumber: string) => Reservation[];
  getActiveForDate: (date: string) => Reservation[];
  hasConflict: (room: string, checkin: string, checkout: string, excludeId?: string) => boolean;
}

export const useReservationStore = create<ReservationStore>((set, get) => ({
  // Données initiales depuis le fichier mocks centralisé
  reservations: MOCK_RESERVATIONS as Reservation[],

  setReservations: (reservations) => set({ reservations }),

  addReservation: (reservation) =>
    set((state) => ({
      reservations: [reservation, ...state.reservations],
    })),

  updateReservation: (id, updates) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
    })),

  removeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),

  // ─── HELPERS MÉTIER ─────────────────────────────────────────────────────────

  getById: (id) => get().reservations.find((r) => r.id === id),

  getByRoom: (roomNumber) =>
    get().reservations.filter(
      (r) => r.room === roomNumber && r.status !== 'cancelled' && r.status !== 'checked_out',
    ),

  getActiveForDate: (date) =>
    get().reservations.filter((r) => {
      if (r.status === 'cancelled' || r.status === 'checked_out') return false;
      return r.checkin <= date && r.checkout > date;
    }),

  // Détection de conflit en mémoire (avant appel API)
  // checkout est exclusif (convention hôtelière : départ le matin du checkout)
  hasConflict: (room, checkin, checkout, excludeId) =>
    get().reservations.some((r) => {
      if (excludeId && r.id === excludeId) return false;
      if (r.room !== room) return false;
      if (r.status === 'cancelled' || r.status === 'checked_out' || r.status === 'no_show') return false;
      return checkin < r.checkout && r.checkin < checkout;
    }),
}));
