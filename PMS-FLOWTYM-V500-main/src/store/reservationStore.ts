// ═══════════════════════════════════════════════════════════════════════════
// store/reservationStore.ts — State global Zustand pour les réservations
// Source unique de vérité : Planning + Reservations + PlanChambers + Flowboard
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';

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
  // champs optionnels
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
  [key: string]: any; // pour les champs legacy
}

// ─── DONNÉES INITIALES (mock) ─────────────────────────────────────────────────
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-001', clientId: 1, guestName: 'Pierre Bernard',
    status: 'checked_out',
    dates: '23 mars – 27 mars 2026', nights: 4, room: '101',
    canal: 'Direct', montant: 480, solde: 0,
    checkin: '2026-03-23', checkout: '2026-03-27',
  },
  {
    id: 'RES-002', clientId: 2, guestName: 'Sophie Dubois',
    status: 'checked_in',
    dates: '07 avr. – 10 avr. 2026', nights: 3, room: '103',
    canal: 'Booking.com', montant: 360, solde: 360,
    checkin: '2026-04-07', checkout: '2026-04-10',
  },
  {
    id: 'RES-003', clientId: 3, guestName: 'Ali Larabi',
    status: 'checked_in',
    dates: '18 avr. – 25 avr. 2026', nights: 7, room: '201',
    canal: 'Direct', montant: 1750, solde: 1750,
    checkin: '2026-04-18', checkout: '2026-04-25',
    cleaning_requested: true, cleaning_date: '2026-04-22',
  },
  {
    id: 'RES-004', clientId: 4, guestName: 'Marie Martin',
    status: 'confirmed',
    dates: '07 avr. – 09 avr. 2026', nights: 2, room: '102',
    canal: 'Direct', montant: 360, solde: 360,
    checkin: '2026-04-07', checkout: '2026-04-09',
    cleaning_requested: false,
  },
];

// ─── STORE ────────────────────────────────────────────────────────────────────
interface ReservationStore {
  reservations: Reservation[];

  // Initialiser depuis Supabase (remplace tout)
  setReservations: (reservations: Reservation[]) => void;

  // Ajouter une réservation (formulaire → Planning + Réservations en temps réel)
  addReservation: (reservation: Reservation) => void;

  // Mettre à jour une réservation existante
  updateReservation: (id: string, updates: Partial<Reservation>) => void;

  // Supprimer
  removeReservation: (id: string) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: INITIAL_RESERVATIONS,

  setReservations: (reservations) =>
    set({ reservations }),

  addReservation: (reservation) =>
    set((state) => ({
      reservations: [reservation, ...state.reservations],
    })),

  updateReservation: (id, updates) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),
}));
