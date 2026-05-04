// ═══════════════════════════════════════════════════════════════════════════
// mocks/index.ts — Source unique de toutes les données de démonstration
// À utiliser quand Supabase n'est pas configuré (mode offline/démo).
// Ne jamais dupliquer ces données dans d'autres fichiers.
// ═══════════════════════════════════════════════════════════════════════════

import type { MockClient, MockGroup, MockRoom, MockSimulation } from '../types';

// ─── TYPE RÉSERVATION MOCK (UI) ───────────────────────────────────────────────
export interface MockReservation {
  id: string;
  clientId: number;
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
  email?: string;
  phone?: string;
  nationality?: string;
  paymentMode?: string;
  paymentStatus?: string;
  guaranteeType?: string;
  guaranteeStatus?: string;
  cleaning_requested?: boolean;
  cleaning_date?: string;
  [key: string]: any;
}

// ─── RÉSERVATIONS ────────────────────────────────────────────────────────────
export const MOCK_RESERVATIONS: MockReservation[] = [
  {
    id: 'RES-001',
    clientId: 1,
    guestName: 'Pierre Bernard',
    status: 'checked_out',
    dates: '23 mars – 27 mars 2026',
    nights: 4,
    room: '101',
    canal: 'Direct',
    montant: 480,
    solde: 0,
    checkin: '2026-03-23',
    checkout: '2026-03-27',
  },
  {
    id: 'RES-002',
    clientId: 2,
    guestName: 'Sophie Dubois',
    status: 'checked_in',
    dates: '07 avr. – 10 avr. 2026',
    nights: 3,
    room: '103',
    canal: 'Booking.com',
    montant: 360,
    solde: 360,
    checkin: '2026-04-07',
    checkout: '2026-04-10',
  },
  {
    id: 'RES-003',
    clientId: 3,
    guestName: 'Ali Larabi',
    status: 'checked_in',
    dates: '18 avr. – 25 avr. 2026',
    nights: 7,
    room: '201',
    canal: 'Direct',
    montant: 1750,
    solde: 1750,
    checkin: '2026-04-18',
    checkout: '2026-04-25',
    cleaning_requested: true,
    cleaning_date: '2026-04-22',
  },
  {
    id: 'RES-004',
    clientId: 4,
    guestName: 'Marie Martin',
    status: 'confirmed',
    dates: '07 avr. – 09 avr. 2026',
    nights: 2,
    room: '102',
    canal: 'Direct',
    montant: 360,
    solde: 360,
    checkin: '2026-04-07',
    checkout: '2026-04-09',
    cleaning_requested: false,
  },
];

// ─── CHAMBRES ────────────────────────────────────────────────────────────────
export const MOCK_ROOMS: MockRoom[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    num: (101 + i).toString(),
    type: i % 3 === 0 ? 'Suite' : 'Double',
    price: i % 3 === 0 ? 250 : 120,
    status: 'available',
    floor: 1,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    num: (201 + i).toString(),
    type: i % 4 === 0 ? 'Suite' : 'Twin',
    price: i % 4 === 0 ? 280 : 130,
    status: 'available',
    floor: 2,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    num: (301 + i).toString(),
    type: 'Single',
    price: 90,
    status: 'available',
    floor: 3,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    num: (401 + i).toString(),
    type: 'Double',
    price: 140,
    status: 'available',
    floor: 4,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    num: (501 + i).toString(),
    type: 'Suite',
    price: 350,
    status: 'available',
    floor: 5,
  })),
];

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
export const MOCK_CLIENTS: MockClient[] = [
  {
    id: 1,
    name: 'Pierre Bernard',
    email: 'pierre.bernard@orange.fr',
    phone: '+33698765432',
    visits: 2,
    ca: 840,
    tag: 'Business',
    status: 'checked_out',
    room: '101',
    checkin: '2026-03-23',
    checkout: '2026-03-27',
    idVerified: true,
    city: 'Paris',
    country: 'France',
    preferences: { floor: 'Moyen', bedType: 'Ferme' },
    history: [
      { dates: '23-27 mars 2026', room: '101', category: 'Double Standard', nights: 4, amount: 480, rating: 5 },
    ],
  },
  {
    id: 2,
    name: 'Sophie Dubois',
    email: 'sophie.dubois@yahoo.fr',
    phone: '+33654321098',
    visits: 1,
    ca: 360,
    tag: 'Famille',
    status: 'checked_in',
    room: '103',
    checkin: '2026-04-07',
    checkout: '2026-04-10',
    idVerified: true,
    city: 'Lyon',
    country: 'France',
    allergies: 'Sans gluten',
    history: [],
  },
  {
    id: 3,
    name: 'Ali Larabi',
    email: 'ali@flowtym.com',
    phone: '+33667830249',
    visits: 12,
    ca: 4250,
    tag: 'VIP',
    status: 'checked_in',
    room: '201',
    checkin: '2026-04-06',
    checkout: '2026-04-12',
    idVerified: true,
    city: 'Marseille',
    country: 'France',
    company: 'Flowtym Inc.',
    notes: 'Partenaire technologique. Toujours offrir un surclassement si possible.',
    history: [
      { dates: '12-15 fév. 2026', room: '501', category: 'Suite Royale', nights: 3, amount: 1050, rating: 5 },
    ],
  },
  {
    id: 4,
    name: 'Marie Martin',
    email: 'marie.martin@gmail.com',
    phone: '+33612345678',
    visits: 1,
    ca: 360,
    tag: 'Regulier',
    status: 'pending',
    room: '202',
    checkin: '2026-04-07',
    checkout: '2026-04-09',
    idVerified: false,
    city: 'Nice',
    country: 'France',
    history: [],
  },
];

// ─── GROUPES ─────────────────────────────────────────────────────────────────
export const MOCK_GROUPS: MockGroup[] = [
  {
    id: 1,
    name: 'Séminaire Tech 2026',
    contact: 'Marc Dupuis',
    rooms: 8,
    arrival: '2026-05-15',
    departure: '2026-05-17',
    participants: ['Lucas Martin', 'Sophie Leroi', 'Ali Kassem', 'Marie Blanc', 'Tom Duval', 'Julie Moulin', 'Pierre Faure', 'Nadia Cohn'],
    status: 'confirmed',
    amount: 5600,
    notes: 'Salle de réunion demandée. Déjeuner inclus.',
  },
  {
    id: 2,
    name: 'Mariage Dupont-Lebrun',
    contact: 'Claire Dupont',
    rooms: 12,
    arrival: '2026-06-20',
    departure: '2026-06-22',
    participants: ['Famille Dupont (6)', 'Famille Lebrun (6)'],
    status: 'tentative',
    amount: 8400,
    notes: 'Suite nuptiale requise.',
  },
];

// ─── SIMULATIONS ─────────────────────────────────────────────────────────────
export const MOCK_SIMULATIONS: MockSimulation[] = [
  {
    id: 'SIM-001',
    clientName: 'Dupont SA',
    contact: 'm.dupont@dupont.com',
    amount: 3450,
    amountHT: 3105,
    status: 'devis',
    conversion: 0,
    nights: 5,
    rooms: 3,
    valid: '2026-05-01',
    notes: 'Séminaire direction',
    createdAt: '2026-04-10T10:00:00Z',
    lines: [],
    conf: { vat: 10, cityTax: 2.5 },
  },
  {
    id: 'SIM-002',
    clientName: 'Tech Corp',
    contact: 'b.martin@tech.com',
    amount: 7200,
    amountHT: 6480,
    status: 'proforma',
    conversion: 60,
    nights: 8,
    rooms: 6,
    valid: '2026-04-20',
    notes: 'Conférence annuelle',
    createdAt: '2026-04-12T14:30:00Z',
    lines: [],
    conf: { vat: 10, cityTax: 2.5 },
  },
  {
    id: 'SIM-003',
    clientName: 'SNCF Voyages',
    contact: 'r.petit@sncf.fr',
    amount: 12600,
    amountHT: 11340,
    status: 'converted',
    conversion: 100,
    nights: 10,
    rooms: 10,
    valid: '2026-04-15',
    notes: 'Formation managers',
    createdAt: '2026-04-05T09:15:00Z',
    lines: [],
    conf: { vat: 10, cityTax: 2.5 },
  },
];
