// ═══════════════════════════════════════════════════════════════════════════
// types/index.ts — Types unifiés Flowtym PMS
// Source unique de vérité pour tous les types métier (alignés sur le schéma DB)
// ═══════════════════════════════════════════════════════════════════════════

// ─── HÔTEL ────────────────────────────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  city?: string;
  address?: string;
  zip?: string;
  country: string;
  phone?: string;
  email?: string;
  siret?: string;
  tva_number?: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  city_tax_rate: number;
  active: boolean;
  created_at: string;
}

// ─── CHAMBRE ──────────────────────────────────────────────────────────────────
export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'dirty'
  | 'cleaning'
  | 'maintenance'
  | 'out_of_order';

export interface Room {
  id: string;
  hotel_id: string;
  number: string;
  type?: string;
  category?: string;
  floor: number;
  surface_m2?: number;
  max_occupancy: number;
  base_price?: number;
  status: RoomStatus;
  amenities: string[];
  notes?: string;
  active: boolean;
  created_at: string;
}

// ─── CLIENT / GUEST ───────────────────────────────────────────────────────────
export type LoyaltyLevel = 'Standard' | 'Silver' | 'Gold' | 'Platinum' | 'VIP';
export type GuestSegment = 'Leisure' | 'Business' | 'Group' | 'Tour' | 'Corporate';

export interface Guest {
  id: string;
  hotel_id?: string;
  legacy_id?: number;
  first_name?: string;
  last_name: string;
  email?: string;
  phone?: string;
  country: string;
  nationality?: string;
  passport?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  zip?: string;
  language: string;
  segment: GuestSegment;
  loyalty_level: LoyaltyLevel;
  total_spent: number;
  total_stays: number;
  id_verified: boolean;
  gdpr_consent: boolean;
  gdpr_date?: string;
  blacklisted: boolean;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// ─── RÉSERVATION ──────────────────────────────────────────────────────────────
export type ReservationStatus =
  | 'confirmed'
  | 'pending'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'expired' | 'refunded';
export type GuaranteeType = 'cb' | 'virement' | 'especes' | 'cheque' | 'none';
export type CancellationPolicy =
  | 'flexible'
  | 'modere'
  | 'stricte'
  | 'non_remboursable';

export interface Reservation {
  id: string;
  reference?: string;
  hotel_id?: string;
  room_id?: string;
  room_number?: string;
  guest_id?: string;
  client_id?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  group_id?: string;
  rate_plan_id?: string;
  check_in: string;
  check_out: string;
  nights: number;
  status: ReservationStatus;
  checkin_status: 'pending' | 'completed';
  adults: number;
  children: number;
  pax?: number;
  total_amount: number;
  paid_amount: number;
  solde?: number;
  city_tax: number;
  source: string;
  segment: string;
  external_id?: string;
  payment_mode: string;
  payment_status: PaymentStatus;
  guarantee_type: GuaranteeType;
  guarantee_status: string;
  cancellation_policy: CancellationPolicy;
  cancelled_at?: string;
  cancellation_reason?: string;
  no_show_at?: string;
  cleaning_requested: boolean;
  cleaning_date?: string;
  notes?: string;
  special_requests?: string;
  room_type?: string;
  room_category?: string;
  created_at: string;
  updated_at: string;
  // Champs legacy UI (mappés depuis la DB pour rétrocompatibilité)
  room?: string;
  canal?: string;
  montant?: number;
  checkin?: string;
  checkout?: string;
  dates?: string;
  clientId?: number;
  guestName?: string;
  [key: string]: any;
}

// ─── PAIEMENT ─────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  reservation_id: string;
  hotel_id?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference?: string;
  transaction_id?: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  payment_type: 'deposit' | 'settlement' | 'refund' | 'credit_note';
  notes?: string;
  created_by?: string;
  created_at: string;
}

// ─── FACTURE ──────────────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  reservation_id?: string;
  hotel_id?: string;
  invoice_number: string;
  invoice_type: 'invoice' | 'proforma' | 'credit_note' | 'avoir';
  guest_name?: string;
  guest_email?: string;
  guest_siret?: string;
  issue_date: string;
  due_date?: string;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

// ─── PRESTATION ───────────────────────────────────────────────────────────────
export interface Prestation {
  id: string;
  reservation_id: string;
  room_id?: string;
  hotel_id?: string;
  family: string;
  code?: string;
  label: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  total_amount?: number;
  tva_rate: number;
  tva_amount?: number;
  prestation_date: string;
  status: 'active' | 'cancelled' | 'invoiced';
  notes?: string;
  created_at: string;
}

// ─── TÂCHE MÉNAGE ─────────────────────────────────────────────────────────────
export type CleaningTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'inspected'
  | 'blocked';
export type CleaningTaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type CleaningTaskType =
  | 'checkout_cleaning'
  | 'stayover_cleaning'
  | 'deep_cleaning'
  | 'inspection'
  | 'maintenance';

export interface CleaningTask {
  id: string;
  room_id: string;
  hotel_id?: string;
  task_type: CleaningTaskType;
  status: CleaningTaskStatus;
  priority: CleaningTaskPriority;
  assigned_to?: string;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  rooms?: Partial<Room>;
}

// ─── OBJETS TROUVÉS ───────────────────────────────────────────────────────────
export interface LostFoundItem {
  id: string;
  hotel_id: string;
  room_number?: string;
  description: string;
  found_by?: string;
  found_date: string;
  status: 'found' | 'claimed' | 'donated' | 'disposed';
  guest_name?: string;
  notes?: string;
  created_at: string;
}

// ─── PLAN TARIFAIRE ───────────────────────────────────────────────────────────
export interface RatePlan {
  id: string;
  hotel_id: string;
  name: string;
  code?: string;
  description?: string;
  discount_pct: number;
  cancellation_policy: string;
  min_stay: number;
  active: boolean;
  created_at: string;
}

// ─── SERVICE LAYER ────────────────────────────────────────────────────────────
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  dateFrom?: string;
  dateTo?: string;
  roomNumber?: string;
  guestName?: string;
}

// ─── MOCK UI TYPES (non-DB) ───────────────────────────────────────────────────
export interface MockClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  visits: number;
  ca: number;
  tag: string;
  status: string;
  room: string;
  checkin: string;
  checkout: string;
  idVerified: boolean;
  city: string;
  country: string;
  company?: string;
  allergies?: string;
  notes?: string;
  preferences?: Record<string, string>;
  history: Array<{
    dates: string;
    room: string;
    category: string;
    nights: number;
    amount: number;
    rating: number;
  }>;
}

export interface MockGroup {
  id: number;
  name: string;
  contact: string;
  rooms: number;
  arrival: string;
  departure: string;
  participants: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  amount: number;
  notes: string;
}

export interface MockSimulation {
  id: string;
  clientName: string;
  contact: string;
  amount: number;
  amountHT: number;
  status: 'devis' | 'proforma' | 'converted';
  conversion: number;
  nights: number;
  rooms: number;
  valid: string;
  notes: string;
  createdAt: string;
  lines: any[];
  conf: { vat: number; cityTax: number };
}

export interface MockRoom {
  num: string;
  type: string;
  price: number;
  status: string;
  floor: number;
}
