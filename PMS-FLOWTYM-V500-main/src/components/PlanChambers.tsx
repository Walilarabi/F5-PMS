import React, { useState, useMemo, useEffect } from 'react';
import { CHANNELS } from '../constants/channels';
import { SourceLogo } from './SourceLogo';
import { ReservationDetailPanel } from './ReservationDetailPanel';
import { 
  TrendingUp,
  DollarSign,
  Percent,
  Hash,
  Maximize2,
  BarChart3,
  XCircle,
  Search, 
  Filter, 
  MoreHorizontal, 
  MoreVertical,
  LogIn, 
  LogOut, 
  ArrowLeftRight, 
  ArrowLeft,
  FileText, 
  Mail, 
  Phone, 
  StickyNote, 
  History, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  AtSign,
  MessageCircle,
  Clock,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Check,
  Info,
  ChevronDown,
  Printer,
  Download,
  Bell,
  Camera,
  Calendar,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  Pencil,
  Plus,
  Minus,
  Globe,
  DoorOpen,
  Layers,
  Building2,
  PhoneCall,
  Eye,
  EyeOff,
  CreditCard,
  Wallet,
  Banknote,
  Receipt,
  Package,
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  Coffee,
  Utensils,
  Wine,
  Shirt,
  Car,
  Trash2,
  Brush,
  Droplets,
  Loader2,
  Tag,
  Bed,
  Crown,
  Bolt,
  Flag,
  Heart,
  Smartphone,
  Link,
  Send,
  ArrowRight,
  Table,
  Baby,
  Building,
  Terminal,
  Monitor,
  MousePointer,
  Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckoutModal } from './CheckoutModal';
import { CheckinModal } from './CheckinModal';
import { getContrastColor, adjustColor } from '../lib/colorUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Clients } from './Clients';
import ReservationFormModal from './ReservationFormModal';

// Types
type RoomStatus = 'Libre' | 'Occupée' | 'Propre' | 'Sale' | 'À nettoyer' | 'En cours' | 'Bloquée' | 'Départ' | 'Ménage demandé' | 'Recouche' | 'Vérifiée';

type PaymentStatus = 'Payé' | 'En attente' | 'Refusé' | 'Impayé' | 'Partiel';

interface RoomBadges {
  vip?: boolean;
  prioritaire?: boolean;
  nouveau?: boolean;
  fidele?: boolean;
  incident?: boolean;
}

interface Room {
  id: string;
  name: string;
  number: string;
  type: string;
  category: string;
  surface: string;
  status: RoomStatus;
  guestName: string | null;
  guestEmail?: string;
  guestPhone?: string;
  guestId: string | null;
  reservationId: string | null;
  externalReservationId: string | null;
  pax: number | null;
  checkIn: string | null;
  checkOut: string | null;
  fta: string | null;
  source: string | null;
  remarks: string | null;
  assignedTo: string | null;
  cleaningTime: string;
  paymentStatus?: PaymentStatus;
  view_desc: string;
  bathroom: string;
  equipments: string[];
  bedding: string;
  floor: number;
  badges?: RoomBadges;
}

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  preferences: string;
  totalSpent: number;
  internalNotes: string;
  history: { date: string, room: string, amount: number }[];
}

interface Reservation {
  id: string;
  roomId: string;
  guestId: string;
  status: string;
  amount: number;
  options: string[];
  history: { date: string, action: string, user: string }[];
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amountHT: number;
  tva: number;
  amountTTC: number;
  paymentMethod: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StaffMember {
  id: string;
  name: string;
  role: 'housekeeper' | 'admin' | 'receptionist';
  status: 'present' | 'absent';
}

interface Incident {
  id: string;
  roomId: string;
  roomName: string;
  type: string;
  description: string;
  date: string;
  priority: 'Basse' | 'Moyenne' | 'Haute';
  status: 'Ouvert' | 'Assigné' | 'Résolu';
  assignedTo?: string;
}

interface Prestation {
  id: string;
  date: string;
  roomName: string;
  description: string;
  amount: number;
}

interface PaymentRecord {
  id: string;
  date: string;
  roomName: string;
  guestName: string;
  amount: number;
  method: string;
}

interface InvoiceRecord {
  id: string;
  date: string;
  roomName: string;
  guestName: string;
  amount: number;
  number: string;
}

interface LostItem {
  id: string;
  roomId: string;
  roomName: string;
  description: string;
  dateFound: string;
  status: 'Trouvé' | 'Restitué' | 'Archivé';
  founderName: string;
  returnedDate?: string;
  notes?: string;
}

interface RoomReview {
  id: string;
  roomId: string;
  roomName: string;
  guestName: string;
  rating: number;
  comment: string;
  date: string;
  source: string;
}

// Mock Data
const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Marie L.', role: 'housekeeper', status: 'present' },
  { id: 's2', name: 'Nathalie B.', role: 'housekeeper', status: 'present' },
  { id: 's3', name: 'Jean D.', role: 'housekeeper', status: 'present' },
  { id: 's4', name: 'Sophie V.', role: 'housekeeper', status: 'absent' },
];
const MOCK_GUESTS: Record<string, Guest> = {
  'g1': {
    id: 'g1',
    name: 'Arathew Smith',
    email: 'a.smith@example.com',
    phone: '+33 6 12 34 56 78',
    address: '123 Main St, London, UK',
    preferences: 'Quiet room, high floor',
    totalSpent: 1250,
    internalNotes: 'Regular guest, likes extra pillows',
    history: [
      { date: '2024-01-10', room: '101', amount: 450 },
      { date: '2023-11-05', room: '204', amount: 800 }
    ]
  },
  'g2': {
    id: 'g2',
    name: 'Claire Martin',
    email: 'claire.m@provider.fr',
    phone: '+33 7 88 99 00 11',
    address: '45 Rue de la Paix, Paris, France',
    preferences: 'Gluten free breakfast',
    totalSpent: 2100,
    internalNotes: 'Corporate account - Flowtym',
    history: [
      { date: '2024-03-15', room: '102', amount: 600 }
    ]
  }
};

const MOCK_RESERVATIONS: Record<string, Reservation> = {
  'res1': {
    id: 'res1',
    roomId: '101',
    guestId: 'g1',
    status: 'Confirmed',
    amount: 450,
    options: ['Breakfast', 'Late Checkout'],
    history: [
      { date: '2024-04-10 10:00', action: 'Booking Created', user: 'System' },
      { date: '2024-04-12 14:30', action: 'Late Checkout Added', user: 'Marie L.' }
    ]
  },
  'res2': {
    id: 'res2',
    roomId: '102',
    guestId: 'g2',
    status: 'In House',
    amount: 1200,
    options: ['Breakfast', 'Parking'],
    history: [
      { date: '2024-04-01 09:00', action: 'Booking Created', user: 'Expedia' }
    ]
  }
};

const MOCK_INCIDENTS: Incident[] = [
  { id: 'inc1', roomId: '102', roomName: '102', type: 'Maintenance', description: 'Fuite chasse d\'eau', date: '2024-04-15 10:30', priority: 'Haute', status: 'Ouvert' },
  { id: 'inc2', roomId: '104', roomName: '104', type: 'Equipement', description: 'Ampoule grillée chevet', date: '2024-04-15 14:15', priority: 'Moyenne', status: 'Ouvert' },
  { id: 'inc3', roomId: '105', roomName: '105', type: 'Wifi', description: 'Pas de connexion', date: '2024-04-14 20:00', priority: 'Basse', status: 'Assigné', assignedTo: 'Jean D.' },
];

const MOCK_PRESTATIONS: Prestation[] = [
  { id: 'p1', date: '2024-04-15', roomName: '101', description: 'Hébergement', amount: 120 },
  { id: 'p2', date: '2024-04-15', roomName: '101', description: 'Petit déjeuner (x2)', amount: 30 },
  { id: 'p3', date: '2024-04-15', roomName: '102', description: 'Minibar', amount: 12.50 },
];

const MOCK_PAYMENTS_ALL: PaymentRecord[] = [
  { id: 'pay1', date: '2024-04-15', roomName: '101', guestName: 'Arathew Smith', amount: 150, method: 'CB' },
  { id: 'pay2', date: '2024-04-15', roomName: '102', guestName: 'Claire Martin', amount: 50, method: 'Espèces' },
];

const MOCK_INVOICES: InvoiceRecord[] = [
  { id: 'inv1', date: '2024-04-15', roomName: '101', guestName: 'Arathew Smith', amount: 150, number: 'FACT-2024-001' },
];

const MOCK_LOST_ITEMS: LostItem[] = [
  { id: 'lost1', roomId: '101', roomName: '101', description: 'Chargeur iPhone blanc', dateFound: '2024-04-10', status: 'Trouvé', founderName: 'Marie L.' },
  { id: 'lost2', roomId: '204', roomName: '204', description: 'Lunettes de soleil Ray-Ban', dateFound: '2024-04-12', status: 'Trouvé', founderName: 'Nathalie B.' },
  { id: 'lost3', roomId: '105', roomName: '105', description: 'Peluche ourson', dateFound: '2024-04-05', status: 'Restitué', founderName: 'Jean D.', returnedDate: '2024-04-06' },
];

const MOCK_REVIEWS: RoomReview[] = [
  { id: 'rev1', roomId: '101', roomName: '101', guestName: 'Arathew Smith', rating: 5, comment: 'Chambre magnifique, propreté irréprochable.', date: '2024-04-15', source: 'Direct' },
  { id: 'rev2', roomId: '102', roomName: '102', guestName: 'Claire Martin', rating: 4, comment: 'Très bon séjour, personnel accueillant.', date: '2024-04-12', source: 'Booking.com' },
];

const TYPOLOGY_CODES: Record<string, string> = {
  'Simple': 'SGL',
  'Double': 'DBL',
  'Twin': 'TWN',
  'Familiale': 'FAM',
  'Triple': 'TPL',
  'Quadruple': 'QUA',
  'Quintuple': 'QUI',
  'Suite': 'STE'
};

const CATEGORY_CODES: Record<string, string> = {
  'Classique': 'CLA',
  'Deluxe': 'DLX',
  'Supérieur': 'SUP',
  'Executive': 'EXE',
  'Présidentielle': 'PRE',
  'Standard': 'STD'
};

const getTypologyIcon = (type: string) => {
  switch (type) {
    case 'Double':
    case 'Twin':
    case 'Simple':
      return <Bed className="w-3 h-3" />;
    case 'Familiale':
    case 'Quadruple':
    case 'Quintuple':
      return <Users className="w-3 h-3" />;
    case 'Triple':
      return <User className="w-3 h-3" />;
    case 'Suite':
      return <Crown className="w-3 h-3" />;
    default:
      return <Bed className="w-3 h-3" />;
  }
};

const INITIAL_ROOMS: Room[] = [
  {
    id: '101',
    name: '101 - Simple Classique',
    number: '101',
    type: 'Simple',
    category: 'Classique',
    surface: '16m²',
    status: 'Libre',
    guestName: 'Arathew Smith',
    guestEmail: 'arathew.smith@email.com',
    guestPhone: '+33612345678',
    guestId: 'g1',
    reservationId: 'res1',
    externalReservationId: 'BK-998877',
    pax: 2,
    checkIn: '15 avr.',
    checkOut: 'Arrived',
    fta: 'ETA',
    source: 'Booking.com',
    remarks: 'Vue mer',
    assignedTo: null,
    cleaningTime: '20 min',
    paymentStatus: 'Payé',
    view_desc: 'Vue Rue / Maywhe',
    bathroom: 'Douche',
    equipments: ['Clim', 'Bureau', 'Wifi', 'TV'],
    bedding: '160x200',
    floor: 1,
    badges: { vip: true, fidele: true }
  },
  {
    id: '102',
    name: '102 - Double Classique',
    number: '102',
    type: 'Double',
    category: 'Classique',
    surface: '33m²',
    status: 'Occupée',
    guestName: 'Claire Martin',
    guestEmail: 'claire.martin@email.com',
    guestPhone: '+33698765432',
    guestId: 'g2',
    reservationId: 'res2',
    externalReservationId: 'EXP-123456',
    pax: 2,
    checkIn: '14 avr.',
    checkOut: '17 avr.',
    fta: '15:00',
    source: 'Direct',
    remarks: null,
    assignedTo: 'Nathalie B.',
    cleaningTime: '35 min',
    paymentStatus: 'Partiel',
    view_desc: 'Vue Cour',
    bathroom: 'Baignoire',
    equipments: ['Clim', 'Bureau', 'Wifi', 'TV', 'Mini-bar'],
    bedding: '2x 90x200',
    floor: 1,
    badges: { prioritaire: true, incident: true }
  },
  {
    id: '103',
    name: '103 - Suite Deluxe',
    number: '103',
    type: 'Suite',
    category: 'Deluxe',
    surface: '45m²',
    status: 'Propre',
    guestName: null,
    guestId: null,
    reservationId: null,
    externalReservationId: null,
    pax: null,
    checkIn: null,
    checkOut: null,
    fta: null,
    source: 'Airbnb',
    remarks: 'VIP Guest',
    assignedTo: null,
    cleaningTime: '50 min',
    paymentStatus: 'En attente',
    view_desc: 'Vue Jardin',
    bathroom: 'Douche + Baignoire',
    equipments: ['Clim', 'Bureau', 'Wifi', 'TV', 'Mini-bar', 'Cafetière'],
    bedding: '180x200 + 2x 90x200',
    floor: 1,
    badges: { vip: true }
  },
  {
    id: '104',
    name: '104 - Simple Classique',
    number: '104',
    type: 'Simple',
    category: 'Classique',
    surface: '15m²',
    status: 'Sale',
    guestName: 'Marc Lefevre',
    guestId: null,
    reservationId: null,
    externalReservationId: 'AIR-445566',
    pax: 1,
    checkIn: '26 fév.',
    checkOut: '1 mars',
    fta: '14:00',
    source: 'Expedia',
    remarks: 'Départ tardif',
    assignedTo: 'Marie L.',
    cleaningTime: '25 min',
    paymentStatus: 'Refusé',
    view_desc: 'Vue Rue',
    bathroom: 'Douche',
    equipments: ['Clim', 'Bureau', 'Wifi', 'TV'],
    bedding: '90x200',
    floor: 1,
    badges: { nouveau: true, prioritaire: true }
  },
  {
    id: '105',
    name: '105 - Double Classique',
    number: '105',
    type: 'Double',
    category: 'Classique',
    surface: '25m²',
    status: 'À nettoyer',
    guestName: 'David Leblanc',
    guestId: null,
    reservationId: null,
    externalReservationId: null,
    pax: 1,
    checkIn: '28 fév.',
    checkOut: '3 mars',
    fta: '12:00',
    source: 'Agoda',
    remarks: 'Recouche',
    assignedTo: 'Marie L.',
    cleaningTime: '30 min',
    paymentStatus: 'Payé',
    view_desc: 'Vue Cour',
    bathroom: 'Douche',
    equipments: ['Clim', 'Bureau', 'Wifi', 'TV'],
    bedding: '140x190',
    floor: 1
  }
];

const STATUS_COLORS: Record<string, { bg: string, text: string, dot: string }> = {
  'Libre': { bg: 'bg-status-libre-bg', text: 'text-status-libre-text', dot: 'bg-status-libre-text' },
  'Occupée': { bg: 'bg-status-occupee-bg', text: 'text-status-occupee-text', dot: 'bg-status-occupee-text' },
  'Propre': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-700' },
  'Sale': { bg: 'bg-status-sale-bg', text: 'text-status-sale-text', dot: 'bg-status-sale-text' },
  'À nettoyer': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-700' },
  'En cours': { bg: 'bg-[#ffedd5]', text: 'text-[#c2410c]', dot: 'bg-[#c2410c]' },
  'Bloquée': { bg: 'bg-status-grey-bg', text: 'text-status-grey-text', dot: 'bg-status-grey-text' },
  'Départ': { bg: 'bg-status-occupee-bg', text: 'text-status-occupee-text', dot: 'bg-status-occupee-text' },
  'Ménage demandé': { bg: 'bg-status-nettoyage-bg', text: 'text-status-nettoyage-text', dot: 'bg-status-nettoyage-text' },
  'Recouche': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-700' },
  'Vérifiée': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-700' },
};

// Mock Hotel Settings (in a real app, this would come from a database)
const HOTEL_SETTINGS = {
  logo_url: 'https://picsum.photos/seed/hotel-logo/100/100', // Mock hotel logo
  name: 'Flowtym Hotel'
};

const BadgeIcons = ({ badges }: { badges?: RoomBadges }) => {
  if (!badges) return null;
  return (
    <div className="flex items-center gap-1.5 px-2">
      {badges.vip && <Crown className="w-3.5 h-3.5 text-amber-500" title="VIP" />}
      {badges.prioritaire && <Bolt className="w-3.5 h-3.5 text-orange-500" title="Prioritaire" />}
      {badges.nouveau && <Sparkles className="w-3.5 h-3.5 text-emerald-500" title="Nouveau client" />}
      {badges.fidele && <Heart className="w-3.5 h-3.5 text-rose-500" title="Fidèle" />}
      {badges.incident && <Flag className="w-3.5 h-3.5 text-rose-600" title="Incident" />}
    </div>
  );
};

const PaymentBadge = ({ status }: { status?: PaymentStatus }) => {
  if (!status) return <div className="flex items-center justify-center text-primary/20" title="Inconnu"><AlertCircle className="w-3.5 h-3.5" /></div>;
  
  const styles: Record<string, string> = {
    'Payé': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'En attente': 'bg-amber-100 text-amber-700 border-amber-200',
    'Refusé': 'bg-rose-100 text-rose-700 border-rose-200',
    'Impayé': 'bg-rose-100 text-rose-700 border-rose-200',
    'Partiel': 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="flex justify-center">
      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black whitespace-nowrap uppercase tracking-tight border shadow-sm ${status ? styles[status] : ''}`}>
        {status}
      </span>
    </div>
  );
};

interface PlanChambersProps {
  roomsProp?: Room[];
  setRoomsProp?: React.Dispatch<React.SetStateAction<Room[]>>;
  reservations?: any[];
  clients?: any[];
  onFinalizeCheckout?: (roomId: string, reservationId: string, paymentData: any) => void;
  onAddReservation?: (res: any) => void;
}

export default function PlanChambers({ 
  roomsProp, 
  setRoomsProp, 
  reservations = [], 
  clients = [], 
  onFinalizeCheckout,
  onAddReservation,
}: PlanChambersProps) {
  const [rooms, setRooms] = useState<Room[]>(roomsProp || INITIAL_ROOMS);
  
  useEffect(() => {
    if (roomsProp) setRooms(roomsProp);
  }, [roomsProp]);

  // If setRoomsProp is provided, we should use it to sync back
  const updateRooms = (newRooms: Room[] | ((prev: Room[]) => Room[])) => {
    if (setRoomsProp) {
      setRoomsProp(newRooms);
    } else {
      setRooms(newRooms);
    }
  };
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [lostItems, setLostItems] = useState<LostItem[]>(MOCK_LOST_ITEMS);
  const [reviews, setReviews] = useState<RoomReview[]>(MOCK_REVIEWS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Toutes');
  const [filterType, setFilterType] = useState<string>('Tous les types');
  const [filterSource, setFilterSource] = useState<string>('Toutes les sources');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showKPIs, setShowKPIs] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [isGlobalMenuOpen, setIsGlobalMenuOpen] = useState(false);
  const [isBackMenuOpen, setIsBackMenuOpen] = useState(false);
  const [isTraitementMenuOpen, setIsTraitementMenuOpen] = useState(false);
  const [isHousekeepingMenuOpen, setIsHousekeepingMenuOpen] = useState(false);
  const [isIncidentsMenuOpen, setIsIncidentsMenuOpen] = useState(false);
  const [globalActionData, setGlobalActionData] = useState<any>(null);
  const [dateEditData, setDateEditData] = useState<{ type: 'checkIn' | 'checkOut', date: string } | null>(null);
  const [sideModalData, setSideModalData] = useState<{ room: Room, tab: 'reservation' | 'facturation' | 'cardex' | 'incidents_tab' | 'lost_tab' | 'reviews_tab' } | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [billingLines, setBillingLines] = useState<any[]>([
    { id: 1, date: '2024-04-15', qty: 1, description: 'Chambre 101 - Nuitée', pu_ht: 120, tva: 10, total_ttc: 132 },
    { id: 2, date: '2024-04-15', qty: 2, description: 'Petit-déjeuner Buffet', pu_ht: 15, tva: 10, total_ttc: 33 }
  ]);
  const [payments, setPayments] = useState<any[]>([
    { id: 1, date: '2024-04-15', method: 'CB', amount: 100 }
  ]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'chambre' | 'client' | 'structure'>('chambre');
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [filterCheckIn, setFilterCheckIn] = useState(false);
  const [filterCheckOut, setFilterCheckOut] = useState(false);
  const highlightTarget = currentView === 'client' ? 'guest' : 'room';
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [selectedRoomForBadges, setSelectedRoomForBadges] = useState<Room | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeNotifications, setActiveNotifications] = useState<{id: string, message: string, type: 'info' | 'incident'}[]>([]);

  // States for Communication Modal
  const [isCommModalOpen, setIsCommModalOpen] = useState(false);
  const [commData, setCommData] = useState({
    roomId: '',
    roomNumber: '',
    guestName: '',
    email: '',
    phone: '',
    template: 'confirmation',
    message: '',
    channel: 'email' as 'email' | 'whatsapp'
  });

  const EMAIL_TEMPLATES = useMemo(() => ({
    confirmation: "Bonjour {nom},\n\nNous avons le plaisir de vous confirmer votre réservation pour les dates du {dates}.\nChambre : {chambre}\n\nCordialement,\nL'équipe de la Réception",
    rappel: "Cher(e) {nom},\n\nNous avons hâte de vous accueillir très bientôt dans la chambre {chambre}.\n\nA bientôt !\nL'équipe de la Réception",
    paiement: "Monsieur/Madame {nom},\n\nConcernant votre séjour (chambre {chambre}), un solde reste à régler pour valider votre réservation.\n\nMerci de nous contacter.\nL'équipe de la Réception",
    facture: "Bonjour {nom},\n\nVeuillez trouver ci-joint votre facture pour votre séjour en chambre {chambre}.\n\nL'équipe de la Réception",
    satisfaction: "Bonjour {nom},\n\nVotre séjour s'est terminé récemment. Nous espérons que tout s'est bien passé.\nPartagez votre avis avec nous !\n\nL'équipe de la Réception",
    offre: "Offre Spéciale pour {nom} !\n\nRevenez nous voir prochainement et bénéficiez de -10% sur votre chambre {chambre}.\n\nL'équipe de la Réception",
    modification: "Bonjour {nom},\n\nVotre réservation a bien été modifiée.\n\nL'équipe de la Réception",
    annulation: "Confirmation d'annulation pour {nom}.\n\nVotre réservation pour la chambre {chambre} a été annulée. Nous espérons vous revoir bientôt.\n\nL'équipe de la Réception"
  }), []);

  const fillTemplate = (templateKey: string, room: Room) => {
    let text = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES] || "";
    return text.replace(/{nom}/g, room.guestName || '')
               .replace(/{dates}/g, `${room.checkIn || ''} au ${room.checkOut || ''}`)
               .replace(/{chambre}/g, room.number);
  };

  const openCommunication = (room: Room) => {
    if (!room.guestName) {
      addToast("Pas de client associé à cette chambre", "error");
      return;
    }
    const template = 'confirmation';
    const message = fillTemplate(template, room);
    setCommData({
      roomId: room.id,
      roomNumber: room.number,
      guestName: room.guestName || '',
      email: room.guestEmail || '',
      phone: room.guestPhone || '',
      template,
      message,
      channel: 'email'
    });
    setIsCommModalOpen(true);
  };

  // States for Relogement Modal
  const [isRelogementModalOpen, setIsRelogementModalOpen] = useState(false);
  const [relogementData, setRelogementData] = useState<{
    sourceRoom: Room | null,
    targetRoomId: string,
    billingOption: 'none' | 'charge' | 'ignore'
  }>({
    sourceRoom: null,
    targetRoomId: '',
    billingOption: 'none'
  });

  const openRelogement = (room: Room) => {
    if (!room.guestName) {
      addToast("Impossible de déloger une chambre vide", "error");
      return;
    }
    setRelogementData({
      sourceRoom: room,
      targetRoomId: '',
      billingOption: 'none'
    });
    setIsRelogementModalOpen(true);
  };

  // Simulation of real-time notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      const id = Date.now().toString();
      setActiveNotifications(prev => [...prev, { id, message: "Chambre 102 terminée par Maria", type: 'info' }]);
      setTimeout(() => setActiveNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    }, 3000);

    const timer2 = setTimeout(() => {
      const id = (Date.now() + 1).toString();
      setActiveNotifications(prev => [...prev, { id, message: "Fuite signalée en 201", type: 'incident' }]);
      setTimeout(() => setActiveNotifications(prev => prev.filter(n => n.id !== id)), 8000);
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);
  const [newResForm, setNewResForm] = useState({
    guestName: '',
    email: '',
    phone: '',
    adults: 2,
    children: 0,
    company: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    category: 'Classique',
    roomNumber: '',
    board: 'Room Only',
    rateType: 'Flexible',
    ratePerNight: 99,
    channel: 'Direct',
    scanIdRequired: true,
    clientKnown: false,
    vatRate: 10,
    paymentMode: 'CB',
    paymentStatus: 'En attente',
    guaranteeType: 'aucune',
    notes: '',
    processor: 'Stripe',
    linkType: 'Acompte 30%',
    linkValidity: 48
  });
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', date: new Date().toISOString().split('T')[0], category: 'Ménage', description: 'Achat produits entretien', amountHT: 45.50, tva: 20, amountTTC: 54.60, paymentMethod: 'Espèces' },
    { id: '2', date: new Date().toISOString().split('T')[0], category: 'Maintenance', description: 'Réparation robinet 102', amountHT: 30.00, tva: 10, amountTTC: 33.00, paymentMethod: 'CB' }
  ]);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Ménage',
    tva: 20,
    paymentMethod: 'Espèces',
    description: '',
    amountHT: 0
  });

  // Simulation of Realtime
  useEffect(() => {
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('rooms_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
          console.log('Change received!', payload);
          // Update local state based on payload
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleDayNav = (direction: 'prev' | 'next' | 'today') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (direction === 'today') {
      setSelectedDate(today);
    } else {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
      
      if (direction === 'prev' && newDate < today) {
        addToast("Impossible de naviguer avant aujourd'hui", "info");
        return;
      }
      
      setSelectedDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const sources = useMemo(() => {
    const allSources = rooms.map(r => r.source).filter(Boolean) as string[];
    return ['Toutes les sources', ...Array.from(new Set(allSources))];
  }, [rooms]);

  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckinListOpen, setIsCheckinListOpen] = useState(false);
  const [isCheckoutListOpen, setIsCheckoutListOpen] = useState(false);
  const [checkinResId, setCheckinResId] = useState<string | null>(null);

  const TODAY = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const arrivalsToday = useMemo(() => 
    reservations.filter((res: any) => res.checkin === TODAY && res.status !== 'checked_in' && res.status !== 'checked_out'),
    [reservations, TODAY]
  );

  const departuresToday = useMemo(() => 
    rooms.filter(room => room.status === 'Occupée' || room.status === 'Départ'),
    [rooms]
  );

  const clientList = useMemo(() => {
    return Object.values(MOCK_GUESTS).map((g, idx) => ({
      id: idx + 1,
      name: g.name,
      email: g.email,
      phone: g.phone,
      tag: (g.internalNotes || '').includes('VIP') ? 'VIP' : 'Regulier',
      visits: g.history?.length || 0,
      ca: g.totalSpent || 0,
      status: 'active',
      room: '',
      checkin: '',
      checkout: '',
      history: g.history?.map(h => ({
        dates: h.date,
        room: h.room,
        category: 'Standard',
        nights: 1,
        amount: h.amount
      }))
    }));
  }, []);

  const [checkinForm, setCheckinForm] = useState({
    guestName: '',
    roomId: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    needsIdScan: true
  });

  const [checkoutData, setCheckoutData] = useState<{
    roomId: string;
    paymentMethod: string;
    amount: number;
    guestName: string;
  } | null>(null);

  const handleCheckinSubmit = (data: any) => {
    setRooms(prev => prev.map(r => {
      if (r.id === data.roomId) {
        return {
          ...r,
          status: 'Occupée' as RoomStatus,
          guestName: data.guestName,
          guestEmail: data.email,
          guestPhone: data.phone,
          checkIn: data.arrivalDate,
          checkOut: data.departureDate,
          pax: data.adults + data.children,
          paymentStatus: (data.paymentStatus === 'paid' ? 'Payé' : (data.paymentStatus === 'refused' ? 'Refusé' : 'En attente')) as PaymentStatus,
          remarks: data.notes
        };
      }
      return r;
    }));
    
    addToast(`Check-in réussi pour ${data.guestName}`, "success");
    setIsCheckinModalOpen(false);
  };

  const handleCheckoutSubmit = () => {
    if (!checkoutData) return;
    
    setRooms(prev => prev.map(r => {
      if (r.id === checkoutData.roomId) {
        return {
          ...r,
          status: 'À nettoyer' as RoomStatus,
          guestName: '',
          checkIn: '',
          checkOut: '',
          paymentStatus: 'Payé' as PaymentStatus
        };
      }
      return r;
    }));
    
    addToast(`Check-out validé pour la chambre ${rooms.find(r => r.id === checkoutData.roomId)?.number}. Facture payée par ${checkoutData.paymentMethod}.`, "success");
    setIsCheckoutModalOpen(false);
    setCheckoutData(null);
  };

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aPriority = (a.badges?.vip ? 2 : 0) + (a.badges?.prioritaire ? 1 : 0);
      const bPriority = (b.badges?.vip ? 2 : 0) + (b.badges?.prioritaire ? 1 : 0);
      return bPriority - aPriority;
    });
  }, [rooms]);

  const isSameDay = (dateStr: string | null, date: Date) => {
    if (!dateStr) return false;
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '');
    return dateStr.includes(day.toString()) && dateStr.toLowerCase().includes(month.toLowerCase());
  };

  const filteredRooms = useMemo(() => {
    return sortedRooms.filter(room => {
      const matchesSearch = 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (room.checkIn?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (room.checkOut?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesFilter = filterStatus === 'Toutes' || 
        (filterStatus === 'Occupée' && room.status === 'Occupée') ||
        (filterStatus === 'Libre' && room.status === 'Libre') ||
        (filterStatus === 'À nettoyer' && (room.status === 'À nettoyer' || room.status === 'Sale' || room.status === 'Ménage demandé')) ||
        (filterStatus === 'En cours' && room.status === 'En cours') ||
        (filterStatus === 'Propre' && room.status === 'Propre') ||
        (filterStatus === 'Départ' && room.status === 'Départ');
      
      const matchesType = filterType === 'Tous les types' || room.type === filterType;

      const matchesSource = filterSource === 'Toutes les sources' || room.source === filterSource;

      // Matching Channel Category
      let matchesCategory = true;
      if (filterCategory) {
        const channel = CHANNELS.find(c => 
          room.source?.toLowerCase().includes(c.name.toLowerCase()) || 
          room.source?.toLowerCase().includes(c.code.toLowerCase()) ||
          (room.externalReservationId && room.externalReservationId.toLowerCase().includes(c.code.toLowerCase()))
        ) || CHANNELS.find(c => c.code === 'DIRECT');
        matchesCategory = channel?.type === filterCategory;
      }

      const matchesCheckIn = !filterCheckIn || isSameDay(room.checkIn, selectedDate);
      const matchesCheckOut = !filterCheckOut || isSameDay(room.checkOut, selectedDate);
      
      return matchesSearch && matchesFilter && matchesType && matchesSource && matchesCheckIn && matchesCheckOut;
    });
  }, [rooms, searchTerm, filterStatus, filterType, filterSource, filterCheckIn, filterCheckOut, selectedDate]);

  const handleAction = (action: string, room: Room) => {
    if (action === 'broom') {
      if (room.status === 'À nettoyer') {
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: 'En cours' } : r));
        addToast(`Chambre ${room.name} : Nettoyage démarré`, 'success');
        return;
      }
      if (room.status === 'Occupée') {
        setSelectedRoom(room);
        setActiveModal('confirm-broom-occupied');
        return;
      }
      if (room.status === 'Ménage demandé' || room.status === 'Recouche') {
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: 'En cours' } : r));
        addToast(`Chambre ${room.name} : Nettoyage démarré`, 'success');
        return;
      }
      addToast(`Action non disponible pour le statut actuel`, 'info');
      return;
    }
    if (action === 'check-out') {
      if (room.status === 'Libre' || room.status === 'À nettoyer' || room.status === 'Sale' || room.status === 'Propre') {
        addToast("Impossible de faire un check-out : la chambre n'est pas occupée", "error");
        return;
      }
      setSelectedRoom(room);
      setActiveModal('check-out');
      return;
    }
    if (action === 'edit-checkin' || action === 'edit-checkout') {
      setSelectedRoom(room);
      setDateEditData({
        type: action === 'edit-checkin' ? 'checkIn' : 'checkOut',
        date: (action === 'edit-checkin' ? room.checkIn : room.checkOut) || new Date().toISOString().split('T')[0]
      });
      setActiveModal('edit-date');
      return;
    }
    if (action === 'side-modal-res') {
      setSideModalData({ room, tab: 'reservation' });
      return;
    }
    if (action === 'side-modal-guest') {
      setSideModalData({ room, tab: 'cardex' });
      const guest = room.guestId ? MOCK_GUESTS[room.guestId] : null;
      if (guest) setEditingGuest({ ...guest });
      return;
    }
    if (action === 'email' || action === 'communication') {
      openCommunication(room);
      return;
    }
    if (action === 'move') {
      openRelogement(room);
      return;
    }
    setSelectedRoom(room);
    setActiveModal(action);
  };

  const handleGlobalAction = (action: string) => {
    if (selectedRoomIds.size === 0) {
      addToast('Veuillez sélectionner au moins une chambre', 'error');
      return;
    }
    setActiveModal(`global-${action}`);
    setIsGlobalMenuOpen(false);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRoomIds.size === filteredRooms.length) {
      setSelectedRoomIds(new Set());
    } else {
      setSelectedRoomIds(new Set(filteredRooms.map(r => r.id)));
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedRoom(null);
    setGlobalActionData(null);
  };

  const confirmAction = async () => {
    // Simulation of API call
    await new Promise(resolve => setTimeout(resolve, 800));

    if (activeModal === 'edit-date' && selectedRoom && dateEditData) {
      setRooms(prev => prev.map(r => 
        r.id === selectedRoom.id ? { ...r, [dateEditData.type]: dateEditData.date } : r
      ));
      addToast(`Date de ${dateEditData.type === 'checkIn' ? 'début' : 'fin'} mise à jour pour ${selectedRoom.name}`, 'success');
    } else if (activeModal?.startsWith('global-')) {
      const action = activeModal.replace('global-', '');
      
      if (action === 'assign') {
        const staff = MOCK_STAFF.find(s => s.id === globalActionData);
        setRooms(prev => prev.map(r => 
          selectedRoomIds.has(r.id) ? { ...r, assignedTo: staff?.name || null, status: r.status === 'À nettoyer' ? 'En cours' : r.status } : r
        ));
        addToast(`${selectedRoomIds.size} chambres assignées à ${staff?.name}`, 'success');
      } else if (action === 'status') {
        setRooms(prev => prev.map(r => 
          selectedRoomIds.has(r.id) ? { ...r, status: globalActionData as RoomStatus } : r
        ));
        addToast(`Statut mis à jour pour ${selectedRoomIds.size} chambres`, 'success');
      } else if (action === 'checkout') {
        setRooms(prev => prev.map(r => 
          selectedRoomIds.has(r.id) 
          ? { ...r, status: 'À nettoyer', guestName: null, pax: null, checkIn: null, checkOut: null } 
          : r
        ));
        addToast(`Départ groupé effectué pour ${selectedRoomIds.size} chambres`, 'success');
      } else if (action === 'broom-mass') {
        setRooms(prev => prev.map(r => 
          selectedRoomIds.has(r.id) ? { ...r, status: 'Ménage demandé' } : r
        ));
        addToast(`Ménage demandé pour ${selectedRoomIds.size} chambres`, 'success');
      } else {
        addToast(`Action globale "${action}" effectuée pour ${selectedRoomIds.size} chambres`, 'success');
      }
      setSelectedRoomIds(new Set());
    } else if (selectedRoom && activeModal) {
      if (activeModal === 'check-out') {
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id 
          ? { ...r, status: 'À nettoyer', guestName: null, pax: null, checkIn: null, checkOut: null } 
          : r
        ));
        addToast(`Check-out effectué pour la chambre ${selectedRoom.name}. Statut: À nettoyer`, 'success');
      } else if (activeModal === 'check-in') {
        addToast(`Check-in réussi pour ${selectedRoom.guestName || 'le client'}`, 'success');
      } else if (activeModal === 'email') {
        addToast(`Email envoyé avec succès`, 'info');
      } else if (activeModal === 'broom') {
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id ? { ...r, status: 'Ménage demandé' } : r
        ));
        addToast(`Ménage demandé pour la chambre ${selectedRoom.name}`, 'success');
      } else if (activeModal === 'cancel-broom') {
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id ? { ...r, status: 'Occupée' } : r
        ));
        addToast(`Demande de ménage annulée pour la chambre ${selectedRoom.name}`, 'info');
      } else if (activeModal === 'validate-cleaning') {
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id ? { ...r, status: 'Propre' } : r
        ));
        addToast(`Ménage validé pour la chambre ${selectedRoom.name}`, 'success');
      } else if (activeModal === 'start-cleaning') {
        // Assign a default housekeeper if none assigned
        const defaultHousekeeper = MOCK_STAFF.find(s => s.role === 'housekeeper' && s.status === 'present')?.name || 'Marie L.';
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id ? { ...r, status: 'En cours', assignedTo: r.assignedTo || defaultHousekeeper } : r
        ));
        addToast(`Prise en charge de la chambre ${selectedRoom.name} par ${selectedRoom.assignedTo || defaultHousekeeper}`, 'success');
      } else if (activeModal === 'assign' && globalActionData) {
        const staff = MOCK_STAFF.find(s => s.id === globalActionData);
        setRooms(prev => prev.map(r => 
          r.id === selectedRoom.id ? { ...r, assignedTo: staff?.name || null, status: r.status === 'À nettoyer' ? 'En cours' : r.status } : r
        ));
        addToast(`Chambre ${selectedRoom.name} assignée à ${staff?.name}`, 'success');
      } else {
        addToast(`Action "${activeModal}" effectuée`, 'success');
      }
    }

    closeModal();
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amountHT) {
      addToast('Veuillez remplir la description et le montant', 'error');
      return;
    }
    const amountTTC = Number(newExpense.amountHT) * (1 + (newExpense.tva || 0) / 100);
    const expense: Expense = {
      id: Math.random().toString(36).substring(2, 9),
      date: newExpense.date || new Date().toISOString().split('T')[0],
      category: newExpense.category || 'Autre',
      description: newExpense.description,
      amountHT: Number(newExpense.amountHT),
      tva: Number(newExpense.tva),
      amountTTC: Number(amountTTC.toFixed(2)),
      paymentMethod: newExpense.paymentMethod || 'Espèces'
    };
    setExpenses(prev => [expense, ...prev]);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: 'Ménage',
      tva: 20,
      paymentMethod: 'Espèces',
      description: '',
      amountHT: 0
    });
    addToast('Dépense enregistrée', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addToast('Dépense supprimée', 'info');
  };

  // Operational Calculations for KPI Block
  const kpiStats = useMemo(() => {
    // Simulated arrival data for critical indicator
    const criticalArrivalsCount = rooms.filter(r => r.checkIn === '15 avr.' && r.fta && r.fta !== 'ETA' && parseInt(r.fta) < 15).length;
    const notReadyRooms = rooms.filter(r => ['À nettoyer', 'En cours', 'Sale', 'Recouche'].includes(r.status));
    const notReadyCount = notReadyRooms.length;
    const cleaningDelay = 22; // Simulated
    const atRiskRevenue = notReadyRooms.length * 145; // Simulated potential loss
    
    return {
      arrivalCount: rooms.filter(r => r.checkIn === '15 avr.').length,
      departureCount: rooms.filter(r => r.checkOut === '15 avr.').length,
      criticalArrivalsCount,
      notReadyCount,
      cleaningDelay,
      atRiskRevenue,
      vendableRooms: rooms.filter(r => r.status === 'Libre' || r.status === 'Propre').length,
      potentialGain: rooms.filter(r => r.status === 'Libre').length * 45,
      revparDiff: 12.50,
      blockedRevenue: Math.floor(notReadyCount * 189 * 0.4)
    };
  }, [rooms]);

  // Assistant Intelligent Logic
  const assistantData = useMemo(() => {
    const riskyArrivals = rooms.filter(r => 
      r.checkIn === '15 avr.' && 
      !['Propre', 'Libre', 'Vérifiée'].includes(r.status)
    );

    const housekeepingLoad = MOCK_STAFF
      .filter(s => s.role === 'housekeeper' && s.status === 'present')
      .map(s => ({
        ...s,
        load: rooms.filter(r => r.assignedTo === s.name).length
      }))
      .sort((a, b) => a.load - b.load);

    const busiest = [...housekeepingLoad].sort((a, b) => b.load - a.load)[0];
    const leastBusy = housekeepingLoad[0];
    const firstRisky = riskyArrivals[0];
    const cleanRatio = Math.round((rooms.filter(r => ['Propre', 'Libre', 'Vérifiée'].includes(r.status)).length / rooms.length) * 100);

    return {
      risks: riskyArrivals,
      busiest,
      recommendation: firstRisky && leastBusy ? {
        room: firstRisky.number,
        staff: leastBusy.name
      } : null,
      impact: riskyArrivals.length * 189,
      upcomingArrivals2h: rooms.filter(r => r.checkIn === '15 avr.' && r.fta && parseInt(r.fta) <= 17).length,
      globalScore: cleanRatio
    };
  }, [rooms]);

  const handleAssistantAssign = () => {
    if (!assistantData.recommendation) {
      addToast("Aucune chambre critique à assigner", "info");
      return;
    }
    const { room, staff } = assistantData.recommendation;
    setRooms(prev => prev.map(r => r.number === room ? { ...r, assignedTo: staff, status: 'En cours' } : r));
    addToast(`Chambre ${room} assignée à ${staff}`, 'success');
  };

  const handleAssistantView = () => {
    if (assistantData.risks.length === 0) {
      setSearchTerm('');
      addToast("Filtre réinitialisé", "info");
      return;
    }
    // Search by room numbers of risky rooms
    const searchStr = assistantData.risks[0].number; // Focus on the first critical one for simplicity in UI search
    setSearchTerm(searchStr);
    addToast(`Affichage de la chambre critique ${searchStr}`, 'info');
  };

  const handleAssistantNotify = () => {
    if (assistantData.risks.length === 0) {
      addToast("Aucun risque pour notification", "info");
      return;
    }
    assistantData.risks.forEach(r => {
      console.log(`Notification envoyée : Urgent - Chambre ${r.number} doit être prête rapidement`);
    });
    addToast("Notifications envoyées au housekeeping", "success");
  };

  const handleAssistantPrioritize = () => {
    if (assistantData.risks.length === 0) {
      addToast("Aucune chambre à prioriser", "info");
      return;
    }
    const targetRoomNumber = assistantData.risks[0].number;
    setRooms(prev => prev.map(r => r.number === targetRoomNumber ? { 
      ...r, 
      badges: { ...r.badges, prioritaire: true } 
    } : r));
    addToast(`Chambre ${targetRoomNumber} marquée comme prioritaire`, 'success');
  };

  const handleAssistantSmartAction = () => {
    if (assistantData.risks.length === 0) {
      addToast("Situation sous contrôle : aucune action requise", "info");
      return;
    }
    handleAssistantAssign();
    handleAssistantNotify();
    addToast("⚡ Assistant : Problème traité (Assignation + Alerte)", "success");
  };

  const handleMenuAction = (menu: string, action: string) => {
    setIsBackMenuOpen(false);
    setIsTraitementMenuOpen(false);
    setIsHousekeepingMenuOpen(false);
    setIsIncidentsMenuOpen(false);
    
    if (action === 'housekeeping-assign-auto') {
      const cleanupRooms = rooms.filter(r => r.status === 'À nettoyer');
      if (cleanupRooms.length === 0) {
        addToast("Aucune chambre 'À nettoyer' pour l'instant", "info");
        return;
      }
      const presentStaff = MOCK_STAFF.filter(s => s.role === 'housekeeper' && s.status === 'present');
      if (presentStaff.length === 0) {
        addToast("Aucun personnel de ménage présent", "error");
        return;
      }
      addToast(`${cleanupRooms.length} chambres assignées automatiquement`, 'success');
      return;
    }

    if (action === 'incidents-list') {
      setActiveReport('all-incidents');
      return;
    }

    // Switch to report view if it's a listing action
    if (['acompte', 'debiteurs', 'histo-resa', 'histo-annul', 'histo-noshow', 'prestations', 'reglements', 'factures', 'housekeeping-tasks', 'housekeeping-stats', 'all-incidents'].includes(action)) {
      setActiveReport(action);
    } else {
      addToast(`Action "${action}" du menu ${menu} sélectionnée`, 'info');
    }
  };

  const handleExport = (type: string, format: 'pdf' | 'excel' | 'csv' = 'csv') => {
    setIsExportMenuOpen(false);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `export_${type.toLowerCase().replace(/\s+/g, '_')}_${dateStr}.${format === 'excel' ? 'xlsx' : format}`;
    
    let data: any[] = [];
    let headers: string[] = [];
    let title = "";

    if (type === 'Clients in house' || type === 'in-house') {
      title = "Clients en résidence";
      headers = ["ID", "Client", "Chambre", "Catégorie", "Arrivée", "Départ"];
      data = rooms.filter(r => r.guestName).map(r => [r.id, r.guestName || "N/A", r.number, r.category, r.checkIn || "N/A", r.checkOut || "N/A"]);
    } else if (type === 'Arrivées' || type === 'arrivals') {
      title = "Arrivées du jour";
      headers = ["ID", "Client", "Chambre", "Arrivée"];
      data = rooms.filter(r => r.checkIn && isSameDay(r.checkIn, selectedDate)).map(r => [r.id, r.guestName || "N/A", r.number, r.checkIn]);
    } else if (type === 'Départs' || type === 'departures') {
      title = "Départs du jour";
      headers = ["ID", "Client", "Chambre", "Départ"];
      data = rooms.filter(r => r.checkOut && isSameDay(r.checkOut, selectedDate)).map(r => [r.id, r.guestName || "N/A", r.number, r.checkOut]);
    } else if (type === 'Incidents' || type === 'incidents') {
      title = "Incidents signalés";
      headers = ["ID", "Chambre", "Type", "Priorité", "Status"];
      data = incidents.filter(i => i.status !== 'Résolu').map(i => [i.id, i.roomName, i.type, i.priority, i.status]);
    } else if (type === 'Par femme de chambre' || type === 'housekeeping') {
      title = "Planning Gouvernante";
      headers = ["Chambre", "Status", "Commentaire", "Catégorie"];
      data = rooms.map(r => [r.number, r.status, "", r.category]);
    }

    if (format === 'excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
      XLSX.writeFile(workbook, filename);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(title, 14, 15);
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 20,
        styles: { fontSize: 8, font: 'helvetica' },
        headStyles: { fillColor: [74, 29, 109], textColor: [255, 255, 255] }
      });
      doc.save(filename);
    } else {
      let content = headers.join(",") + "\n";
      content += data.map(row => row.join(",")).join("\n");
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    
    addToast(`Export ${format.toUpperCase()} généré : ${filename}`, 'success');
  };

  const calculateResTotals = () => {
    const start = new Date(newResForm.checkIn);
    const end = new Date(newResForm.checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    
    const subtotalHT = nights * newResForm.ratePerNight;
    const tva = subtotalHT * (newResForm.vatRate / 100);
    const stayTax = nights * (newResForm.adults + newResForm.children) * 2.5;
    const totalTTC = subtotalHT + tva + stayTax;
    
    return { nights, subtotalHT, tva, stayTax, totalTTC };
  };

  const totals = calculateResTotals();

  // Simulation de connectivité Channel Manager
  useEffect(() => {
    // Calcul simulé basé sur les sélections
    const basePrices: Record<string, number> = {
      'Double Classique': 80,
      'Twin Deluxe': 110,
      'Suite Premium': 180
    };
    
    const boardPrices: Record<string, number> = {
      'Room Only': 0,
      'Petit-déjeuner': 15,
      'Demi-pension': 40
    };
    
    const base = basePrices[newResForm.category] || 80;
    const board = boardPrices[newResForm.board] || 0;
    const rateMultiplier = newResForm.rateType === 'Non-Remboursable' ? 0.9 : 1;
    
    const finalRate = (base + board) * rateMultiplier;
    
    if (newResForm.ratePerNight !== finalRate) {
      setNewResForm(prev => ({ ...prev, ratePerNight: finalRate }));
    }
  }, [newResForm.category, newResForm.board, newResForm.rateType]);

  const [isLinkGenerated, setIsLinkGenerated] = useState(false);

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[#F9F9FC]">
      <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-[1px] shadow-satin rounded-[24px] overflow-hidden border border-[#E2E2EA]">
        {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 min-w-[280px] ${
                toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                'bg-blue-50 border-blue-100 text-blue-800'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
               toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-500" /> :
               <Info className="w-5 h-5 text-blue-500" />}
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 1. KPI Zone (2 lignes, masquables) */}
      <div className="px-6 py-2 bg-white/80 border-b border-[#E2E2EA] relative">
        <div className="flex justify-between items-center mb-1">
          <div className="text-[9px] font-bold text-[#64748b] uppercase tracking-[2px]">Indicateurs de Performance</div>
          <button 
            onClick={() => setShowKPIs(!showKPIs)}
            className="text-[#4A1D6D] cursor-pointer transition-all hover:scale-110 hover:opacity-80 p-0.5 flex items-center gap-1.5"
            title={showKPIs ? "Masquer les KPI" : "Afficher les KPI"}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider">{showKPIs ? 'Masquer' : 'Afficher'}</span>
            {showKPIs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showKPIs && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pb-2">
                {/* 0. FLOWTYM ASSISTANT (Intelligence Card) */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#F8F9FD] border border-primary/10 rounded-[18px] p-3 mb-2 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-[8px] font-black text-primary/40 uppercase tracking-widest leading-none mb-0.5">Flowtym Assistant</div>
                        <div className="text-[12px] font-black text-[#2C2A4A] flex items-center gap-1.5">
                          {assistantData.risks.length > 0 ? (
                            <><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Risque détecté</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Contrôlé</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-[#E2E2EA] shadow-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${assistantData.globalScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                      <span className="text-[9px] font-black text-[#2C2A4A]">Hôtel : {assistantData.globalScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1.5">
                      <div className="bg-white/60 rounded-lg p-2 border border-white">
                        <ul className="space-y-1">
                          {assistantData.risks.length > 0 ? (
                            assistantData.risks.slice(0, 2).map((risk, i) => (
                              <li key={i} className="text-[10px] font-bold text-[#2C2A4A]/70 flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-rose-400" />
                                Chambre {risk.number} encore {risk.status.toUpperCase()}
                              </li>
                            ))
                          ) : (
                            <li className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                              <Check className="w-3 h-3" /> Prêtes
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px]">
                        <div className="font-bold text-[#2C2A4A] flex items-center gap-1">
                          <span className="opacity-40">💡 Reco :</span>
                          {assistantData.recommendation 
                            ? `Assigner ch. ${assistantData.recommendation.room} à ${assistantData.recommendation.staff}`
                            : "Aucune action"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {assistantData.risks.length > 0 && (
                        <button 
                          onClick={handleAssistantSmartAction}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-emerald-500"
                        >
                          <Bolt className="w-3 h-3 fill-white" /> Résoudre
                        </button>
                      )}
                      <button 
                        onClick={handleAssistantAssign}
                        className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Assigner
                      </button>
                      <button 
                        onClick={handleAssistantView}
                        className="px-3 py-1.5 bg-white border border-[#E2E2EA] text-[#2C2A4A] text-[10px] font-bold rounded-lg hover:bg-[#F9F9FC] transition-all"
                      >
                        Voir
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* 1. LIGNE PRIORITAIRE (Situation Temps Réel) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-[18px] flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-rose-200 animate-pulse">🔴</div>
                    <div>
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Arrivées &lt; 2H</div>
                      <div className="text-[14px] font-black text-rose-900 leading-none">{kpiStats.criticalArrivalsCount} Chambres</div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-[18px] flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-amber-200">⚠️</div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Non Prêtes</div>
                      <div className="text-[14px] font-black text-amber-900 leading-none">{kpiStats.notReadyCount} Chambres</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-[18px] flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-200">⏱️</div>
                    <div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Retard Ménage</div>
                      <div className="text-[14px] font-black text-blue-900 leading-none">{kpiStats.cleaningDelay} MIN</div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-[18px] flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-emerald-200">💸</div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">À Risque</div>
                      <div className="text-[14px] font-black text-emerald-900 leading-none">{kpiStats.atRiskRevenue} €</div>
                    </div>
                  </div>
                </div>

                {/* 2. KPI Financiers (Actionnables) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: "TO %", value: "75.4%", trend: "+8.3%", trendUp: true, icon: <Percent className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600", showProgress: true, subInfo: `${kpiStats.vendableRooms} chambres encore vendables aujourd’hui` },
                      { label: "ADR", value: "€189.00", trend: "+2.1%", trendUp: true, icon: <TrendingUp className="w-5 h-5" />, color: "bg-blue-50 text-blue-600", subInfo: `potentiel +${kpiStats.potentialGain}€ sur dernières chambres` },
                      { label: "REVPAR", value: "€142.50", trend: "+5.1%", trendUp: true, icon: <BarChart3 className="w-5 h-5" />, color: "bg-indigo-50 text-indigo-600", subInfo: `+${kpiStats.revparDiff}€ vs objectif du jour` },
                      { label: "Revenu Total", value: "€28 450", trend: "-1.2%", trendUp: false, icon: <Banknote className="w-5 h-5" />, color: "bg-amber-50 text-amber-600", subInfo: `${kpiStats.blockedRevenue}€ bloqués (chambres non prêtes)` },
                    ].map((kpi, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={kpi.label}
                        className="bg-white p-3 rounded-[16px] border border-[#E2E2EA] shadow-sm flex flex-col group hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider mb-1">{kpi.label}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[1.1rem] font-black text-[#2C2A4A] tracking-tight">{kpi.value}</span>
                              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${kpi.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
                              </span>
                            </div>
                          </div>
                          <div className={`p-2 rounded-xl ${kpi.color} group-hover:scale-110 transition-transform`}>
                            {kpi.icon}
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-[#2C2A4A]/50 mt-1 leading-tight">{kpi.subInfo}</div>
                        {kpi.showProgress && (
                          <div className="w-full bg-[#E2E2EA] h-1.5 rounded-full overflow-hidden mt-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: kpi.value }}
                              className="bg-primary h-full rounded-full"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                {/* 3. KPI Opérationnels (Enrichis) */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E2EA]/50">
                  {[
                    { label: "Arrivées", value: kpiStats.arrivalCount.toString(), icon: <LogIn className="w-3.5 h-3.5" />, color: "text-blue-500" },
                    { label: "Départs", value: kpiStats.departureCount.toString(), icon: <LogOut className="w-3.5 h-3.5" />, color: "text-rose-500" },
                    { label: "À nettoyer", value: rooms.filter(r => r.status === 'À nettoyer').length.toString(), icon: <Trash2 className="w-3.5 h-3.5" />, color: "text-amber-500", customLabel: `${rooms.filter(r => r.status === 'À nettoyer').length} à nettoyer | ${kpiStats.criticalArrivalsCount} critiques (arrivées < 2h)` },
                    { label: "En cours", value: rooms.filter(r => r.status === 'En cours').length.toString(), icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-blue-400", customLabel: `${rooms.filter(r => r.status === 'En cours').length} en cours | 2 en retard` },
                    { label: "Propre", value: rooms.filter(r => r.status === 'Propre').length.toString(), icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "text-emerald-400", customLabel: `${rooms.filter(r => r.status === 'Propre').length} prêtes | ${rooms.filter(r => r.status === 'Propre' || r.status === 'Libre').length} disponibles immédiatement` },
                    { label: "Propreté", value: "94%", icon: <Percent className="w-3.5 h-3.5" />, color: "text-[#4A1D6D]" },
                  ].map((kpi, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (i + 4) * 0.03 }}
                      key={kpi.label}
                      className="bg-white px-3 py-2 rounded-[14px] border border-[#E2E2EA] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-center min-w-[130px] flex-1 group hover:border-primary/10 transition-all h-[56px]"
                    >
                      <div className="flex items-center gap-1.5 opacity-50 mb-0.5">
                        <span className={kpi.color}>{kpi.icon}</span>
                        <span className="text-[8px] font-bold text-[#2C2A4A] uppercase tracking-wider">{kpi.customLabel || kpi.label}</span>
                      </div>
                      <div className="text-[0.95rem] font-bold text-[#2C2A4A] leading-none">{kpi.value}</div>
                    </motion.div>
                  ))}
                </div>

                {/* 4. PHRASE DYNAMIQUE D'AIDE À LA DÉCISION */}
                <div className="mt-1 bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center gap-3">
                  <div className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </div>
                  <p className="text-[11px] font-bold text-primary italic">
                    <span className="mr-1">⚠️</span> {kpiStats.notReadyCount} chambres doivent être prêtes avant 15:00 pour éviter perte de revenu
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Barre d'Actions (Back, Traitement, Caisse, Housekeeping, Incidents, Actions, Export) */}
      <div className="px-6 py-3 border-b border-[#E2E2EA] bg-white flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Back Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsBackMenuOpen(!isBackMenuOpen)}
              className="px-4 py-2 bg-white border border-[#E2E2EA] text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBackMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isBackMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsBackMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-20 overflow-hidden">
                    <button onClick={() => setIsClientsModalOpen(true)} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><User className="w-4 h-4 text-primary" /> Clients</button>
                    <button onClick={() => handleMenuAction('Back', 'acompte')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Wallet className="w-4 h-4 text-primary" /> Arrhes / Acomptes</button>
                    <button onClick={() => handleMenuAction('Back', 'debiteurs')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Users className="w-4 h-4 text-primary" /> Débiteurs</button>
                    <div className="h-px bg-[#E2E2EA] my-2 mx-4" />
                    <button onClick={() => handleMenuAction('Back', 'histo-resa')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><CalendarCheck className="w-4 h-4 text-emerald-600" /> Historique Réservations</button>
                    <button onClick={() => handleMenuAction('Back', 'histo-annul')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><CalendarX className="w-4 h-4 text-rose-600" /> Historique Annulations</button>
                    <button onClick={() => handleMenuAction('Back', 'histo-noshow')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><UserX className="w-4 h-4 text-amber-600" /> Historique No Show</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Traitement Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsTraitementMenuOpen(!isTraitementMenuOpen)}
              className="px-4 py-2 bg-white border border-[#E2E2EA] text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Traitement <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTraitementMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isTraitementMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsTraitementMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-20 overflow-hidden">
                    <button onClick={() => handleMenuAction('Traitement', 'prestations')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Utensils className="w-4 h-4 text-primary" /> Prestations du Jour</button>
                    <button onClick={() => handleMenuAction('Traitement', 'reglements')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Banknote className="w-4 h-4 text-emerald-600" /> Règlements du Jour</button>
                    <button onClick={() => handleMenuAction('Traitement', 'factures')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><FileText className="w-4 h-4 text-blue-600" /> Factures</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Petite Caisse */}
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2 bg-white border border-[#E2E2EA] rounded-xl text-primary hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 text-xs font-bold relative group"
          >
            <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform" /> Petite Caisse
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">3</span>
          </button>

          {/* Housekeeping Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsHousekeepingMenuOpen(!isHousekeepingMenuOpen)}
              className="px-4 py-2 bg-white border border-[#E2E2EA] text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Brush className="w-3.5 h-3.5" /> Housekeeping <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHousekeepingMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isHousekeepingMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsHousekeepingMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-20 overflow-hidden">
                    <button onClick={() => {}} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Layers className="w-4 h-4 text-primary" /> Tâches du jour</button>
                    <button onClick={() => {}} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><TrendingUp className="w-4 h-4 text-blue-600" /> Productivité</button>
                    <button onClick={() => {}} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><AlertCircle className="w-4 h-4 text-rose-600" /> Incidents signalés</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Incidents Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsIncidentsMenuOpen(!isIncidentsMenuOpen)}
              className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" /> Incidents <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{incidents.filter(i => i.status !== 'Résolu').length}</span> <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isIncidentsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isIncidentsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsIncidentsMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-20 overflow-hidden">
                    {incidents.filter(i => i.status !== 'Résolu').slice(0, 3).map(inc => (
                      <button key={inc.id} onClick={() => handleMenuAction('Incidents', 'incidents-list')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3">
                        <AlertCircle className={`w-4 h-4 ${inc.priority === 'Haute' ? 'text-rose-600' : inc.priority === 'Moyenne' ? 'text-amber-600' : 'text-blue-600'}`} /> 
                        <div className="flex flex-col">
                          <span>{inc.type} Ch. {inc.roomName}</span>
                          <span className="text-[10px] opacity-50 font-medium truncate w-40">{inc.description}</span>
                        </div>
                      </button>
                    ))}
                    <div className="h-px bg-[#E2E2EA] my-2 mx-4" />
                    <button onClick={() => handleMenuAction('Incidents', 'incidents-list')} className="w-full px-4 py-2 text-center text-[10px] font-black uppercase text-primary hover:underline">Voir tous les incidents</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Actions (Bulk) Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsGlobalMenuOpen(!isGlobalMenuOpen)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" /> Actions <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isGlobalMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isGlobalMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsGlobalMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-20 overflow-hidden">
                    <button onClick={() => handleGlobalAction('assign')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><User className="w-4 h-4 text-primary" /> Assigner</button>
                    <button onClick={() => handleGlobalAction('broom-mass')} className="w-full px-4 py-2.5 text-left text-sm text-[#2C2A4A] font-semibold hover:bg-[#F9F9FC] flex items-center gap-3"><Sparkles className="w-4 h-4 text-primary" /> Ménage</button>
                    <button onClick={() => handleGlobalAction('checkout')} className="w-full px-4 py-2.5 text-left text-sm text-rose-600 font-semibold hover:bg-rose-50 flex items-center gap-3"><LogOut className="w-4 h-4" /> Départs</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1" />

        {/* Export Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="px-4 py-2 bg-white border border-[#E2E2EA] text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-64 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-30 overflow-hidden">
                  {[
                    { label: 'Clients in house', icon: <Users className="w-4 h-4" /> },
                    { label: 'Arrivées', icon: <CalendarPlus className="w-4 h-4" /> },
                    { label: 'Départs', icon: <CalendarMinus className="w-4 h-4" /> },
                    { label: 'Par femme de chambre', icon: <UserCheck className="w-4 h-4" /> },
                    { label: 'Incidents', icon: <AlertCircle className="w-4 h-4" /> },
                  ].map((opt) => (
                    <div key={opt.label} className="px-4 py-2 hover:bg-[#F9F9FC] group relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-[#F9F9FC] rounded-lg text-primary group-hover:bg-primary/10 transition-colors">{opt.icon}</div>
                          <span className="text-sm font-bold text-[#2C2A4A]">{opt.label}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-10">
                        <button 
                          onClick={() => handleExport(opt.label, 'pdf')}
                          className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </button>
                        <button 
                          onClick={() => handleExport(opt.label, 'excel')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 flex items-center gap-1.5"
                        >
                          <Table className="w-3 h-3" /> Excel
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Barre de Navigation (Date, Filtres, Vue) */}
      <div className="px-6 py-3 border-b border-[#E2E2EA] bg-[#F9F9FC]/50 flex flex-wrap items-center gap-4">
        {/* Day Navigation */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-[#E2E2EA] shadow-sm">
          <button onClick={() => handleDayNav('prev')} className="p-2 hover:bg-[#F9F9FC] rounded-xl text-[#2C2A4A]/60 hover:text-[#2C2A4A] transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <div className="px-3 flex items-center gap-2 min-w-[140px] justify-center">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-[#2C2A4A] tracking-wide">{formatDate(selectedDate)}</span>
          </div>
          <button onClick={() => handleDayNav('next')} className="p-2 hover:bg-[#F9F9FC] rounded-xl text-[#2C2A4A]/60 hover:text-[#2C2A4A] transition-all"><ChevronRight className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-[#E2E2EA] mx-1" />
          <button 
            onClick={() => handleDayNav('today')}
            className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95 group"
            title="Aujourd'hui"
          >
            <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2C2A4A]/40" />
            <input 
              type="text" 
              placeholder="Nom, chambre, dates..." 
              className="pl-9 pr-3 py-1.5 bg-white border border-[#E2E2EA] rounded-full text-xs focus:ring-2 focus:ring-primary/20 outline-none w-full transition-all shadow-sm placeholder:text-[#2C2A4A]/30 text-[#2C2A4A] font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="px-3 py-1.5 bg-white border border-[#E2E2EA] rounded-full text-xs font-bold text-[#2C2A4A] outline-none shadow-sm h-[34px]" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option>Tous les types</option>
            <option>Simple</option><option>Double</option><option>Twin</option><option>Suite</option>
          </select>

          <select className="px-3 py-1.5 bg-white border border-[#E2E2EA] rounded-full text-xs font-bold text-[#2C2A4A] outline-none shadow-sm h-[34px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Toutes">Tous statuts</option>
            <option>Occupée</option><option>Libre</option><option>À nettoyer</option>
          </select>

          <select 
            className="px-3 py-1.5 bg-white border border-[#E2E2EA] rounded-full text-xs font-bold text-[#2C2A4A] outline-none shadow-sm h-[34px]" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tous les canaux</option>
            <option value="OTA">OTA (Booking, Expedia, etc.)</option>
            <option value="WHOLESALER">Wholesalers / Bedbanks</option>
            <option value="TO">Tour Operators</option>
            <option value="GDS">GDS (Amadeus, Sabre)</option>
            <option value="META">Meta Search</option>
            <option value="DIRECT">Direct</option>
          </select>

          <select className="px-3 py-1.5 bg-white border border-[#E2E2EA] rounded-full text-xs font-bold text-[#2C2A4A] outline-none shadow-sm h-[34px]" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="Toutes les sources">Sources</option>
            {sources.filter(s => s !== 'Toutes les sources').map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>

          <div className="flex items-center gap-3 ml-2">
            <div className="relative">
              <button 
                id="checkinBtn"
                onClick={() => {
                  setIsCheckinListOpen(!isCheckinListOpen);
                  setIsCheckoutListOpen(false);
                }}
                className={`bg-[#10b981] text-white border-none py-2 px-[18px] rounded-[40px] cursor-pointer font-medium text-xs flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm active:scale-95 ${isCheckinListOpen ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
              >
                <LogIn className="w-4 h-4" /> Check-in
              </button>
              
              <AnimatePresence>
                {isCheckinListOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsCheckinListOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[101] overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivées du Jour ({arrivalsToday.length})</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {arrivalsToday.length === 0 ? (
                          <div className="p-8 text-center text-slate-300 italic text-xs">Aucune arrivée attendue</div>
                        ) : (
                          arrivalsToday.map(res => {
                            const client = clients.find(c => c.id === res.clientId);
                            return (
                              <button
                                key={res.id}
                                onClick={() => {
                                  setCheckinResId(res.id);
                                  setIsCheckinModalOpen(true);
                                  setIsCheckinListOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                              >
                                <div>
                                  <div className="text-xs font-black text-slate-800 group-hover:text-emerald-700">{client?.name || res.guestName}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                    Chambre {res.room} · <SourceLogo channelName={res.source} externalId={res.externalId || ''} />
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-emerald-300" />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                id="checkoutBtn"
                onClick={() => {
                  setIsCheckoutListOpen(!isCheckoutListOpen);
                  setIsCheckinListOpen(false);
                }}
                className={`bg-[#ef4444] text-white border-none py-2 px-[18px] rounded-[40px] cursor-pointer font-medium text-xs flex items-center gap-2 hover:bg-rose-600 transition-all shadow-sm active:scale-95 ${isCheckoutListOpen ? 'ring-2 ring-rose-500 ring-offset-2' : ''}`}
              >
                <LogOut className="w-4 h-4" /> Check-out
              </button>

              <AnimatePresence>
                {isCheckoutListOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsCheckoutListOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 top-full mt-2 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[101] overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Départs potentiels ({departuresToday.length})</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {departuresToday.length === 0 ? (
                          <div className="p-8 text-center text-slate-300 italic text-xs">Aucun départ possible</div>
                        ) : (
                          departuresToday.map(room => (
                            <button
                              key={room.id}
                              onClick={() => {
                                setSelectedRoom(room);
                                setActiveModal('check-out');
                                setIsCheckoutListOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-rose-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                            >
                              <div>
                                <div className="text-xs font-black text-slate-800 group-hover:text-rose-700">{room.guestName}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Chambre {room.number} · {room.status}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-rose-300" />
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><XCircle className="w-4 h-4" /></button>
          )}
        </div>

        <div className="flex-1" />

        {/* View Switcher Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="px-4 py-2 bg-white border border-[#E2E2EA] text-primary rounded-xl text-xs font-bold hover:bg-primary/5 transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            {currentView === 'chambre' ? <DoorOpen className="w-3.5 h-3.5" /> : currentView === 'client' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            Vue: {currentView.charAt(0).toUpperCase() + currentView.slice(1)} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isViewMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isViewMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsViewMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-48 bg-white border border-[#E2E2EA] rounded-[24px] shadow-2xl py-3 z-30 overflow-hidden">
                  {[
                    { id: 'chambre', label: 'Chambre', icon: <DoorOpen className="w-4 h-4" /> },
                    { id: 'client', label: 'Client', icon: <User className="w-4 h-4" /> },
                    { id: 'structure', label: 'Structure', icon: <Building2 className="w-4 h-4" /> },
                  ].map((v) => (
                    <button key={v.id} onClick={() => { setCurrentView(v.id as any); setIsViewMenuOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm font-semibold flex items-center gap-3 transition-colors ${currentView === v.id ? 'bg-primary/5 text-primary' : 'text-[#2C2A4A] hover:bg-[#F9F9FC]'}`}>
                      <div className={`p-1.5 rounded-lg ${currentView === v.id ? 'bg-primary/10 text-primary' : 'bg-[#F9F9FC] text-[#2C2A4A]/40'}`}>{v.icon}</div> {v.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* New Reservation Button */}
        <button 
          onClick={() => setIsNewResModalOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white relative">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary shadow-md text-white">
                {currentView === 'chambre' && (
                  <>
                    <th className="px-2 py-1.5 w-10 first:rounded-tl-[24px] text-center" title="Sélection">
                      <input 
                        type="checkbox" 
                        className="rounded border-white/40 text-primary focus:ring-white cursor-pointer w-3.5 h-3.5" 
                        checked={selectedRoomIds.size === filteredRooms.length && filteredRooms.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '60px' }} title="Chambre"><div className="flex items-center justify-center text-white"><DoorOpen className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '70px' }} title="Type / Catégorie"><div className="flex items-center justify-center text-white"><Tag className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '90px' }} title="Statut Propreté / Occupation"><div className="flex items-center justify-center text-white"><Info className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '70px' }} title="Badges"><div className="flex items-center justify-center text-white"><Flag className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '130px' }} title="Nom du Client"><div className="flex items-center justify-center text-white"><User className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '50px' }} title="Nombre de Personnes"><div className="flex items-center justify-center text-white"><Users className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '100px' }} title="Date d'Arrivée"><div className="flex items-center justify-center text-white"><CalendarPlus className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '100px' }} title="Date de Départ"><div className="flex items-center justify-center text-white"><CalendarMinus className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '90px' }} title="Statut du Paiement"><div className="flex items-center justify-center text-white"><CreditCard className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '80px' }} title="Source de Réservation"><div className="flex items-center justify-center text-white"><Globe className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center" style={{ width: '130px' }} title="Personnel Assigné"><div className="flex items-center justify-center text-white"><UserCheck className="w-3.5 h-3.5" /></div></th>
                    <th className="px-2 py-1.5 text-center last:rounded-tr-[24px]" style={{ width: '100px' }} title="Actions de Gestion"><div className="flex items-center justify-center text-white"><MoreVertical className="w-3.5 h-3.5" /></div></th>
                  </>
                )}
                {currentView === 'client' && (
                  <>
                    <th className="px-6 py-3 text-left first:rounded-tl-[24px]" style={{ width: '220px' }}><div className="flex items-center text-white gap-2" title="Client"><User className="w-4 h-4" /> Client</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '100px' }}><div className="flex items-center justify-center text-white gap-2" title="Chambre"><DoorOpen className="w-4 h-4" /> Chambre</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '140px' }}><div className="flex items-center justify-center text-white gap-2" title="Arrivée"><CalendarPlus className="w-4 h-4" /> Arrivée</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '140px' }}><div className="flex items-center justify-center text-white gap-2" title="Départ"><CalendarMinus className="w-4 h-4" /> Départ</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '120px' }}><div className="flex items-center justify-center text-white gap-2" title="Canal"><Globe className="w-4 h-4" /> Canal</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '140px' }}><div className="flex items-center justify-center text-white gap-2" title="Paiement"><CreditCard className="w-4 h-4" /> Paiement</div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '140px' }}><div className="flex items-center justify-center text-white gap-2" title="Statut"><Info className="w-4 h-4" /> Statut</div></th>
                    <th className="px-4 py-3 text-center last:rounded-tr-[24px]" style={{ width: '100px' }}><div className="flex items-center justify-center text-white" title="Actions"><MoreVertical className="w-4 h-4" /></div></th>
                  </>
                )}
                {currentView === 'structure' && (
                  <>
                    <th className="px-6 py-3 text-center first:rounded-tl-[24px]" style={{ width: '80px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Numéro de Chambre"><Hash className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">N°</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '100px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Type"><Bed className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Type</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '120px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Catégorie"><Tag className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Cat.</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '100px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Surface"><Maximize2 className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">M²</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '140px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Vue"><Eye className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Vue</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '160px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Salle de bain"><Droplets className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Bain</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '220px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Équipements"><Smartphone className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Équip.</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '160px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Literie"><Bed className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Lit</span></div></th>
                    <th className="px-4 py-3 text-center" style={{ width: '90px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Étage"><Layers className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Ét.</span></div></th>
                    <th className="px-4 py-3 text-center last:rounded-tr-[24px]" style={{ width: '130px' }}><div className="flex flex-col items-center justify-center text-white gap-1" title="Statut"><Info className="w-4 h-4" /><span className="text-[10px] font-semibold opacity-80">Statut</span></div></th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E2EA]">
              {(currentView === 'client' 
                ? [...filteredRooms].sort((a,b) => (a.guestName || '').localeCompare(b.guestName || '')) 
                : filteredRooms
              ).map((room, idx) => {
                const isArrival = isSameDay(room.checkIn, selectedDate);
                const isDeparture = isSameDay(room.checkOut, selectedDate);
                
                return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={room.id} 
                    className={`group transition-all duration-300 ${idx % 2 === 0 ? 'bg-[#F9F9FC]' : 'bg-[#F3F3F8]'} ${isArrival ? 'bg-emerald-50/40 relative z-[1]' : isDeparture ? 'bg-orange-50/40 relative z-[1]' : ''} hover:bg-white hover:shadow-md hover:scale-[1.005] z-0 relative`}
                  >
                    {currentView === 'chambre' && (
                      <>
                        <td className="px-2 py-1.5">
                      <input 
                        type="checkbox" 
                        className="rounded border-primary/20 text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5" 
                        checked={selectedRoomIds.has(room.id)}
                        onChange={() => toggleRoomSelection(room.id)}
                      />
                    </td>
                    <td className={`px-2 py-1.5 transition-all ${highlightTarget === 'room' ? (isDeparture ? 'bg-orange-50 border-l-4 border-orange-400' : isArrival ? 'bg-emerald-50 border-l-4 border-emerald-400' : '') : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleAction('side-modal-res', room)}
                          className="text-[13px] font-bold text-text-main hover:underline text-left decoration-primary/30 underline-offset-4"
                        >
                          {room.number}
                        </button>
                        {isDeparture && <LogOut className="w-2.5 h-2.5 text-orange-600" title="Départ aujourd'hui" />}
                        {isArrival && <LogIn className="w-2.5 h-2.5 text-emerald-600" title="Arrivée aujourd'hui" />}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div 
                        className="flex items-center gap-1 text-[9px] font-bold text-text-main/60 bg-[#F9F9FC] px-1.5 py-0.5 rounded-md border border-[#E2E2EA] cursor-help"
                        title={`${room.type} ${room.category}`}
                      >
                        {getTypologyIcon(room.type)}
                        <span>{TYPOLOGY_CODES[room.type] || room.type.substring(0, 3).toUpperCase()}/{CATEGORY_CODES[room.category] || room.category.substring(0, 3).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm border border-white/40 whitespace-nowrap ${STATUS_COLORS[room.status].bg} ${STATUS_COLORS[room.status].text}`}>
                        {room.status === 'Sale' ? (
                          <Droplets className="w-2.5 h-2.5" />
                        ) : room.status === 'À nettoyer' ? (
                          <Brush className="w-2.5 h-2.5" />
                        ) : room.status === 'En cours' ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : room.status === 'Propre' ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <div className={`w-1 h-1 rounded-full ${STATUS_COLORS[room.status].dot} animate-pulse`} />
                        )}
                        {room.status}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button 
                        onClick={() => { setSelectedRoomForBadges(room); setIsBadgeModalOpen(true); }}
                        className="flex justify-center hover:scale-110 transition-transform cursor-pointer mx-auto group/badge"
                        title="Gérer les badges"
                      >
                        {room.badges && (room.badges.vip || room.badges.prioritaire || room.badges.nouveau || room.badges.fidele || room.badges.incident) ? (
                          <BadgeIcons badges={room.badges} />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-[#E2E2EA] flex items-center justify-center text-[#2C2A4A]/20 group-hover/badge:border-primary/40 group-hover/badge:text-primary transition-all">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    </td>
                    <td className={`px-2 py-1.5 transition-all ${highlightTarget === 'guest' ? (isDeparture ? 'bg-orange-50 border-l-4 border-orange-400' : isArrival ? 'bg-emerald-50 border-l-4 border-emerald-400' : '') : ''}`}>
                      {room.guestName ? (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleAction('side-modal-guest', room)}
                            className="text-[13px] font-bold text-text-main hover:underline decoration-primary/30 underline-offset-4"
                          >
                            {room.guestName}
                          </button>
                          {highlightTarget === 'guest' && isDeparture && <LogOut className="w-2.5 h-2.5 text-orange-600" />}
                          {highlightTarget === 'guest' && isArrival && <LogIn className="w-2.5 h-2.5 text-emerald-600" />}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-main/30 italic">Libre</span>
                      )}
                    </td>
                  <td className="px-2 py-1.5 text-center">
                    {room.pax && (
                      <div className="inline-flex items-center gap-1 text-text-main font-bold bg-white/50 px-1.5 py-0.5 rounded-md border border-[#E2E2EA]">
                        <Users className="w-2.5 h-2.5 text-primary/40" />
                        <span className="text-[11px]">{room.pax}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {room.checkIn && (
                      <button 
                        onClick={() => handleAction('edit-checkin', room)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-text-main hover:text-primary transition-colors group/date"
                      >
                        <Calendar className="w-3 h-3 text-primary/40 group-hover/date:text-primary" />
                        {room.checkIn}
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {room.checkOut && (
                      <button 
                        onClick={() => handleAction('edit-checkout', room)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-text-main hover:text-primary transition-colors group/date"
                      >
                        <Calendar className="w-3 h-3 text-primary/40 group-hover/date:text-primary" />
                        {room.checkOut}
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <PaymentBadge status={room.paymentStatus} />
                  </td>
                  <td className="p-4">
                    <SourceLogo channelName={room.source} externalId={room.externalReservationId} />
                  </td>
                  <td className="p-4">
                    {room.status === 'Propre' ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold">Validé</span>
                      </div>
                    ) : room.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                          {room.assignedTo.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-text-main">{room.assignedTo}</span>
                          {(room.status === 'En cours' || room.status === 'Ménage demandé') && (
                            <button 
                              onClick={() => handleAction('validate-cleaning', room)}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5 group/val"
                            >
                              <CheckCircle2 className="w-3 h-3 group-hover/val:scale-110 transition-transform" /> Valider
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-text-main/30">—</span>
                        {room.status === 'À nettoyer' && (
                          <button 
                            onClick={() => handleAction('assign', room)}
                            className="text-[10px] font-bold text-primary/40 hover:text-primary uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Assigner
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleAction('check-in', room)}
                        title="Check-in"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction('check-out', room)}
                        title="Check-out"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-rose-600 hover:bg-rose-50 transition-all hover:scale-110"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction('email', room)}
                        title="Email"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction('move', room)}
                        title="Délogement"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (room.status === 'À nettoyer') handleAction('start-cleaning', room);
                          else if (room.status === 'En cours' || room.status === 'Ménage demandé') handleAction('validate-cleaning', room);
                          else handleAction('broom', room);
                        }}
                        title={
                          room.status === 'À nettoyer' ? "Prendre en charge" :
                          room.status === 'En cours' ? "Valider le ménage" :
                          room.status === 'Ménage demandé' ? "Annuler la demande" : "Demander ménage"
                        }
                        className={`w-8 h-8 flex items-center justify-center border rounded-xl transition-all hover:scale-110 ${
                          room.status === 'Ménage demandé' ? 'bg-primary text-white border-primary shadow-md' : 
                          room.status === 'En cours' ? 'bg-orange-500 text-white border-orange-500 shadow-md' :
                          room.status === 'Propre' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md opacity-50 cursor-not-allowed' :
                          'border-primary/10 text-primary hover:bg-primary/10'
                        }`}
                        disabled={room.status === 'Propre'}
                      >
                        {room.status === 'En cours' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : room.status === 'Propre' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => { setSelectedRoomForBadges(room); setIsBadgeModalOpen(true); }}
                        title="Gérer les badges"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction('more', room)}
                        title="Plus d'actions"
                        className="w-8 h-8 flex items-center justify-center border border-primary/10 rounded-xl text-primary hover:bg-primary/10 transition-all hover:scale-110"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </>
              )}
              {currentView === 'client' && (
                <>
                  <td className={`px-6 py-4 transition-all ${highlightTarget === 'guest' ? (isDeparture ? 'bg-orange-50 border-l-4 border-orange-400' : isArrival ? 'bg-emerald-50 border-l-4 border-emerald-400' : '') : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center text-xs font-black shadow-inner overflow-hidden flex-shrink-0 ${room.guestName ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-400'}`}>
                        {room.guestName ? room.guestName.charAt(0) : '?'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAction('side-modal-guest', room)} className="text-[11px] font-black text-[#2C2A4A] tracking-tight truncate hover:underline decoration-primary/30">
                          {room.guestName || '—'}
                        </button>
                        {highlightTarget === 'guest' && isDeparture && <LogOut className="w-3 h-3 text-orange-600" />}
                        {highlightTarget === 'guest' && isArrival && <LogIn className="w-3 h-3 text-emerald-600" />}
                        <BadgeIcons badges={room.badges} />
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-4 text-center font-bold text-xs text-[#2C2A4A] transition-all ${highlightTarget === 'room' ? (isDeparture ? 'bg-orange-50 border-l-4 border-orange-400' : isArrival ? 'bg-emerald-50 border-l-4 border-emerald-400' : '') : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      {room.number}
                      {highlightTarget === 'room' && isDeparture && <LogOut className="w-3 h-3 text-orange-600" />}
                      {highlightTarget === 'room' && isArrival && <LogIn className="w-3 h-3 text-emerald-600" />}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-[10px] font-black text-[#2C2A4A]/60">{room.checkIn || '—'}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-black text-[#2C2A4A]/60">{room.checkOut || '—'}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center"><SourceLogo channelName={room.source} externalId={room.externalReservationId || ''} /></div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center"><PaymentBadge status={room.paymentStatus} /></div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-black/5 ${STATUS_COLORS[room.status].bg} ${STATUS_COLORS[room.status].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[room.status].dot} animate-pulse`} />
                        {room.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-100 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleAction('side-modal-guest', room)} className="p-1.5 hover:bg-primary/5 text-primary rounded-lg transition-colors border border-transparent hover:border-primary/10 shadow-sm" title="Voir client">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAction('side-modal-guest', room)} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors border border-transparent hover:border-amber-100 shadow-sm" title="Modifier client">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </>
              )}
              {currentView === 'structure' && (
                <>
                  <td className={`px-6 py-4 text-center font-bold text-xs text-[#2C2A4A] transition-all ${highlightTarget === 'room' ? (isDeparture ? 'bg-orange-50 border-l-4 border-orange-400' : isArrival ? 'bg-emerald-50 border-l-4 border-emerald-400' : '') : ''}`}>
                    <div className="flex items-center justify-center gap-2">
                      {room.number}
                      {highlightTarget === 'room' && isDeparture && <LogOut className="w-3 h-3 text-orange-600" />}
                      {highlightTarget === 'room' && isArrival && <LogIn className="w-3 h-3 text-emerald-600" />}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-[10px] font-bold text-[#2C2A4A]/60 uppercase tracking-wider">{TYPOLOGY_CODES[room.type] || room.type}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-bold text-[#2C2A4A]/60 uppercase tracking-wider">{CATEGORY_CODES[room.category] || room.category}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-black text-[#2C2A4A]">{room.surface}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-medium text-[#2C2A4A]/70">{room.view_desc}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-medium text-[#2C2A4A]/70">{room.bathroom}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {room.equipments.map(eq => (
                        <span key={eq} className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500">{eq}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-[10px] font-medium text-[#2C2A4A]/70">{room.bedding}</td>
                  <td className="px-4 py-4 text-center text-[10px] font-black text-[#2C2A4A]">{room.floor}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-black/5 ${STATUS_COLORS[room.status].bg} ${STATUS_COLORS[room.status].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[room.status].dot} animate-pulse`} />
                        {room.status}
                      </span>
                    </div>
                  </td>
                </>
              )}
            </motion.tr>
          );
        })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <footer className="px-6 py-4 border-t border-[#E2E2EA] flex items-center justify-between bg-white/80">
          <div className="text-xs font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Affichage de <span className="text-[#2C2A4A]">1 - {filteredRooms.length}</span> sur <span className="text-[#2C2A4A]">{rooms.length}</span> chambres</div>
          <div className="flex items-center gap-1.5">
            <button className="w-9 h-9 flex items-center justify-center border border-[#E2E2EA] rounded-xl text-[#2C2A4A]/40 hover:bg-[#F9F9FC] transition-all disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-xl text-xs font-bold shadow-md">1</button>
            <button className="w-9 h-9 flex items-center justify-center border border-[#E2E2EA] rounded-xl text-xs font-bold text-[#2C2A4A] hover:bg-[#F9F9FC] transition-all">2</button>
            <button className="w-9 h-9 flex items-center justify-center border border-[#E2E2EA] rounded-xl text-[#2C2A4A]/40 hover:bg-[#F9F9FC] transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
      
      <AnimatePresence>
        {isClientsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsClientsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-6xl h-[85vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-[#E2E2EA]">
              <div className="p-6 border-b border-[#E2E2EA] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Users className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-primary tracking-tight">Gestion des Clients (Cardex)</h3>
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mt-0.5">Flowtym PMS Database</p>
                  </div>
                </div>
                <button onClick={() => setIsClientsModalOpen(false)} className="p-2 text-primary/40 hover:bg-primary/10 rounded-full transition-all group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform" /></button>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <Clients clients={clientList as any} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Check-in Modal */}
      <CheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        reservation={reservations.find(r => r.id === checkinResId)}
        rooms={rooms}
        clients={Object.values(MOCK_GUESTS)}
        onConfirm={handleCheckinSubmit}
      />

      {/* Side Modal (Reservation / Facturation / Cardex) */}
      {/* Report Overlay (Table Overlay) */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-10 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto"
              onClick={() => setActiveReport(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full h-full max-w-6xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#E2E2EA] flex flex-col pointer-events-auto"
            >
              <div className="p-6 md:p-8 border-b border-[#E2E2EA] flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    {activeReport.includes('histo') ? <History className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary tracking-tight capitalize">
                      {activeReport.replace('-', ' ').replace('histo', 'Historique')}
                    </h3>
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mt-0.5">Flowtym PMS Operations</p>
                  </div>
                </div>
                <button onClick={() => setActiveReport(null)} className="p-2 text-primary/40 hover:bg-primary/10 rounded-full transition-all group">
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 md:p-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9F9FC] border-y border-[#E2E2EA]">
                      <th className="px-4 py-3 text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest">Détails</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest text-center">Date</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest text-right">Montant</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E2EA]">
                    {activeReport === 'all-incidents' ? (
                      incidents.map(inc => (
                        <tr key={inc.id} className="hover:bg-[#F9F9FC] transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase ${inc.priority === 'Haute' ? 'bg-rose-500' : inc.priority === 'Moyenne' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                {inc.roomName}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#2C2A4A]">{inc.type}</p>
                                <p className="text-[10px] text-[#2C2A4A]/40">Chambre {inc.roomName} - {inc.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-[11px] font-bold text-[#2C2A4A]">{inc.date}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs font-bold text-[#2C2A4A]">{inc.priority}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${inc.status === 'Résolu' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                               {inc.status}
                             </span>
                          </td>
                        </tr>
                      ))
                    ) : activeReport === 'prestations' ? (
                      MOCK_PRESTATIONS.map(p => (
                        <tr key={p.id} className="hover:bg-[#F9F9FC] transition-colors group">
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-xs font-bold text-[#2C2A4A]">{p.description}</p>
                              <p className="text-[10px] text-[#2C2A4A]/40">Chambre {p.roomName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-[11px] font-bold text-[#2C2A4A]">{p.date}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs font-bold text-emerald-600">{p.amount.toFixed(2)} €</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase">Validé</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-[#F9F9FC] transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#B795D6]/10 rounded-full flex items-center justify-center text-primary font-bold text-xs uppercase">
                                {['AS', 'BL', 'JR', 'MC', 'PK'][i % 5]}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#2C2A4A]">Détail #{12344 + i}</p>
                                <p className="text-[10px] text-[#2C2A4A]/40">Donnée simulée pour {activeReport}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-[11px] font-bold text-[#2C2A4A]">15 Avril 2026</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs font-bold text-emerald-600">{(Math.random() * 500).toFixed(2)} €</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${i % 3 === 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                               {i % 3 === 0 ? 'Annulé' : 'Validé'}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-[#F9F9FC] border-t border-[#E2E2EA] flex items-center justify-between">
                <button className="px-6 py-2 bg-white border border-[#E2E2EA] rounded-xl text-xs font-bold text-primary hover:bg-white/80 transition-all flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5" /> Imprimer Rapport
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest">Total: 4 250.00 €</span>
                  <button onClick={() => setActiveReport(null)} className="px-8 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Fermer</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReservationDetailPanel 
        reservationId={sideModalData?.room?.reservationId || null} 
        onClose={() => setSideModalData(null)} 
      />

      {/* Modals */}
      <AnimatePresence mode="wait">
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-[#E2E2EA]"
            >
              <div className="p-8 border-b border-[#E2E2EA] flex items-center justify-between bg-white">
                <h3 className="text-xl font-bold text-primary tracking-tight capitalize">
                  {activeModal.replace('global-', 'Global: ').replace('-', ' ')} {selectedRoom ? `- ${selectedRoom.name}` : `(${selectedRoomIds.size} sélectionnées)`}
                </h3>
                <button onClick={closeModal} className="p-2 text-primary/40 hover:bg-primary/10 rounded-full transition-all group">
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {/* Individual Actions */}
                {activeModal === 'check-in' && selectedRoom && (
                  <div className="space-y-6">
                    <div className="p-5 bg-white/50 rounded-2xl border border-white/60 flex items-center gap-4 shadow-sm">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{selectedRoom.guestName || 'Nouveau Client'}</p>
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-wider mt-0.5">Scan ID requis pour finaliser</p>
                      </div>
                    </div>
                    <button 
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Scanner ID <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <CheckoutModal
                  isOpen={activeModal === 'check-out' && selectedRoom !== null}
                  onClose={() => setActiveModal(null)}
                  roomId={selectedRoom?.num || selectedRoom?.number || ''}
                  rooms={rooms}
                  reservations={reservations}
                  clients={clients}
                  onFinalize={(rid, resid, pay) => {
                    if (onFinalizeCheckout) onFinalizeCheckout(rid, resid, pay);
                    setActiveModal(null);
                  }}
                />

                {activeModal === 'email' && selectedRoom && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] ml-1">Template</label>
                      <select className="w-full p-4 bg-white/60 border border-white/40 rounded-2xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all appearance-none">
                        <option>Confirmation de séjour</option>
                        <option>Facture finale</option>
                        <option>Questionnaire satisfaction</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] ml-1">Message</label>
                      <textarea 
                        placeholder="Votre message..." 
                        className="w-full p-4 bg-white/60 border border-white/40 rounded-2xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all min-h-[120px] resize-none"
                      />
                    </div>
                    <button 
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Envoyer <Mail className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {activeModal === 'edit-date' && selectedRoom && dateEditData && (
                  <div className="space-y-8">
                    <div className="p-6 bg-white/50 border border-white/60 rounded-[24px] shadow-sm">
                      <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] mb-4 block ml-1">
                        Modifier {dateEditData.type === 'checkIn' ? 'Arrivée' : 'Départ'}
                      </label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="date" 
                          className="flex-1 p-4 bg-white/60 border border-white/40 rounded-2xl text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all"
                          value={dateEditData.date.includes('avr') ? '2026-04-15' : dateEditData.date}
                          onChange={(e) => setDateEditData({ ...dateEditData, date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          addToast('Date reculée de 1 jour', 'info');
                        }}
                        className="p-4 bg-white/50 border border-white/40 rounded-2xl text-xs font-bold text-primary uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Minus className="w-4 h-4" /> Reculer
                      </button>
                      <button 
                        onClick={() => {
                          addToast('Date avancée de 1 jour', 'info');
                        }}
                        className="p-4 bg-white/50 border border-white/40 rounded-2xl text-xs font-bold text-primary uppercase tracking-wider hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Avancer
                      </button>
                    </div>

                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-0.5" />
                      <p className="text-xs font-bold text-primary/60 leading-relaxed">
                        {dateEditData.type === 'checkOut' ? 'La prolongation recalculera automatiquement le montant du séjour.' : 'Le planning sera mis à jour immédiatement pour cette réservation.'}
                      </p>
                    </div>

                    <button 
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                      Valider la modification
                    </button>
                  </div>
                )}

                {activeModal === 'cancel-broom' && selectedRoom && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-white/50 text-primary/40 rounded-full flex items-center justify-center mx-auto border border-white/60">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <p className="text-primary font-medium">Annuler la demande de ménage pour la chambre <strong className="text-primary font-bold">{selectedRoom.name}</strong> ?</p>
                    <div className="flex gap-4">
                      <button onClick={closeModal} className="flex-1 py-4 bg-white border border-white/40 rounded-2xl text-sm font-bold text-primary/60 hover:text-primary transition-all shadow-sm">Retour</button>
                      <button 
                        onClick={confirmAction}
                        className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'validate-cleaning' && selectedRoom && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <p className="text-primary font-medium">Confirmez-vous que le ménage est terminé pour la chambre <strong className="text-primary font-bold">{selectedRoom.name}</strong> ? Elle passera en statut "Propre".</p>
                    <div className="flex gap-4">
                      <button onClick={closeModal} className="flex-1 py-4 bg-white border border-white/40 rounded-2xl text-sm font-bold text-primary/60 hover:text-primary transition-all shadow-sm">Annuler</button>
                      <button 
                        onClick={confirmAction}
                        className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'start-cleaning' && selectedRoom && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
                      <Brush className="w-10 h-10" />
                    </div>
                    <p className="text-primary font-medium">Prendre en charge le ménage de la chambre <strong className="text-primary font-bold">{selectedRoom.name}</strong> ? Elle passera en statut "En cours".</p>
                    <div className="flex gap-4">
                      <button onClick={closeModal} className="flex-1 py-4 bg-white border border-white/40 rounded-2xl text-sm font-bold text-primary/60 hover:text-primary transition-all shadow-sm">Annuler</button>
                      <button 
                        onClick={confirmAction}
                        className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        Démarrer
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'assign' && selectedRoom && (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] ml-1">Assigner une gouvernante à la chambre {selectedRoom.name} :</p>
                    <div className="grid grid-cols-1 gap-3">
                      {MOCK_STAFF.filter(s => s.role === 'housekeeper' && s.status === 'present').map(staff => (
                        <button 
                          key={staff.id}
                          onClick={() => setGlobalActionData(staff.id)}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            globalActionData === staff.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-white/50 border-white/40 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                              {staff.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-primary">{staff.name}</p>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Présente aujourd'hui</p>
                            </div>
                          </div>
                          {globalActionData === staff.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={!globalActionData}
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Confirmer l'assignation
                    </button>
                  </div>
                )}

                {/* Global Actions */}
                {activeModal === 'global-assign' && (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] ml-1">Sélectionnez une gouvernante pour les {selectedRoomIds.size} chambres :</p>
                    <div className="grid grid-cols-1 gap-3">
                      {MOCK_STAFF.filter(s => s.role === 'housekeeper' && s.status === 'present').map(staff => (
                        <button 
                          key={staff.id}
                          onClick={() => setGlobalActionData(staff.id)}
                          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            globalActionData === staff.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-white/50 border-white/40 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                              {staff.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-primary">{staff.name}</p>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Présente aujourd'hui</p>
                            </div>
                          </div>
                          {globalActionData === staff.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={!globalActionData}
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Confirmer l'assignation
                    </button>
                  </div>
                )}

                {activeModal === 'global-status' && (
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[2px] ml-1">Nouveau statut pour les {selectedRoomIds.size} chambres :</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(STATUS_COLORS).map((status) => (
                        <button 
                          key={status}
                          onClick={() => setGlobalActionData(status)}
                          className={`p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            globalActionData === status ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white/50 border-white/40 hover:bg-white text-primary'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={!globalActionData}
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Mettre à jour les statuts
                    </button>
                  </div>
                )}

                {activeModal === 'global-checkout' && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
                      <LogOut className="w-10 h-10" />
                    </div>
                    <p className="text-primary font-medium">Confirmer le départ groupé de <strong className="text-primary font-bold">{selectedRoomIds.size} chambres</strong> ? Elles passeront toutes en statut "À nettoyer".</p>
                    <div className="flex gap-4">
                      <button onClick={closeModal} className="flex-1 py-4 bg-white border border-white/40 rounded-2xl text-sm font-bold text-primary/60 hover:text-primary transition-all shadow-sm">Annuler</button>
                      <button 
                        onClick={confirmAction}
                        className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'confirm-broom-occupied' && selectedRoom && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/10 shadow-inner">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-primary">Recouche Ch. {selectedRoom.name}</h4>
                      <p className="text-primary/60 text-sm mt-2">La chambre est occupée. Voulez-vous envoyer une demande de ménage (Recouche) à l'équipe ?</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={closeModal} className="flex-1 py-4 bg-white border border-white/40 rounded-2xl text-sm font-bold text-primary/60 hover:text-primary transition-all shadow-sm">Annuler</button>
                      <button 
                        onClick={() => {
                          setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'Ménage demandé' } : r));
                          addToast(`Demande de recouche envoyée pour la ${selectedRoom.name}`, 'success');
                          closeModal();
                        }}
                        className="flex-1 py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}
                {!['check-in', 'check-out', 'email', 'edit-date', 'cancel-broom', 'validate-cleaning', 'global-assign', 'global-status', 'global-checkout', 'confirm-broom-occupied'].includes(activeModal) && (
                  <div className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/5 text-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/10 shadow-inner">
                      <StickyNote className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-primary font-bold text-lg">Action: {activeModal.replace('global-', 'Global ').replace('-', ' ')}</p>
                      <p className="text-primary/40 italic font-medium">L'interface pour cette action est en cours de développement.</p>
                    </div>
                    <button 
                      onClick={confirmAction}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-soft text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                    >
                      Simuler l'action
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Modal (Petite Caisse) */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute inset-0 bg-[#2C2A4A]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-5 py-3 border-b border-[#E2E2EA] flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-primary">Petite Caisse</h2>
                    <p className="text-[9px] font-medium text-primary/40 uppercase tracking-wider">Enregistrement des dépenses</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: New Expense Form */}
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Nouvelle dépense
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">Date</label>
                      <input 
                        type="date" 
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="w-full px-3 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">Catégorie</label>
                      <select 
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        className="w-full px-3 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        {['Ménage', 'Maintenance', 'Blanchisserie', 'Fournitures', 'Boissons', 'Alimentation', 'Transport', 'Taxis', 'Autre'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">Description</label>
                      <textarea 
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Détails de la dépense..."
                        className="w-full px-3 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">Montant HT</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={newExpense.amountHT || ''}
                            onChange={(e) => setNewExpense({...newExpense, amountHT: Number(e.target.value)})}
                            className="w-full pl-3 pr-8 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 font-bold text-xs">€</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">TVA</label>
                        <select 
                          value={newExpense.tva}
                          onChange={(e) => setNewExpense({...newExpense, tva: Number(e.target.value)})}
                          className="w-full px-3 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value={20}>20%</option>
                          <option value={10}>10%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary/40 uppercase tracking-wider ml-0.5">Mode de paiement</label>
                      <select 
                        value={newExpense.paymentMethod}
                        onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value})}
                        className="w-full px-3 py-1.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        {['Espèces', 'CB', 'Virement', 'Chèque', 'Prélèvement'].map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={handleAddExpense}
                      className="w-full py-3 bg-gradient-to-r from-primary to-primary-soft text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2"
                    >
                      Enregistrer la dépense
                    </button>
                  </div>
                </div>

                {/* Right: Expenses List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Dépenses récentes
                    </h3>
                    <button className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1.5">
                      <Download className="w-3 h-3" /> Exporter CSV
                    </button>
                  </div>

                  <div className="bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/50 border-b border-[#E2E2EA]">
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider">Catégorie</th>
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider text-right">Montant TTC</th>
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider">Mode</th>
                          <th className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase tracking-wider text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E2EA]">
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-primary/30 italic text-xs">Aucune dépense enregistrée</td>
                          </tr>
                        ) : (
                          expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-white transition-colors group">
                              <td className="px-3 py-2 text-[10px] font-medium text-primary/60">{new Date(expense.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</td>
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 bg-primary/5 text-primary text-[9px] font-bold rounded-md border border-primary/10">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[10px] font-bold text-primary truncate max-w-[120px]">{expense.description}</td>
                              <td className="px-3 py-2 text-[10px] font-black text-primary text-right">{expense.amountTTC.toFixed(2)} €</td>
                              <td className="px-3 py-2 text-[9px] font-bold text-primary/40 uppercase">{expense.paymentMethod}</td>
                              <td className="px-3 py-2 text-center">
                                <button 
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600 transition-all opacity-0 group-hover:opacity-100 mx-auto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total aujourd'hui</p>
                      <p className="text-xl font-black text-emerald-700">
                        {expenses
                          .filter(e => e.date === new Date().toISOString().split('T')[0])
                          .reduce((acc, curr) => acc + curr.amountTTC, 0)
                          .toFixed(2)} €
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-wider">Total du mois</p>
                      <p className="text-xl font-black text-primary">
                        {expenses
                          .reduce((acc, curr) => acc + curr.amountTTC, 0)
                          .toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Reservation Modal */}
      <ReservationFormModal
        isOpen={isNewResModalOpen}
        onClose={() => setIsNewResModalOpen(false)}
        source="today"
        availableRooms={rooms.map(r => ({ number: r.num, type: r.type, price: (r as any).price || 99 }))}
        onSave={(data) => {
          if (onAddReservation) {
            onAddReservation({
              guestName:       data.guestName,
              email:           data.email,
              phone:           data.phone,
              nationality:     data.nationalityLabel,
              checkin:         data.checkIn,
              checkout:        data.checkOut,
              room:            data.roomNumber,
              nights:          data.nights,
              total:           data.totalTTC,
              canal:           data.channel,
              paymentMode:     data.paymentMode,
              paymentStatus:   data.paymentStatus,
              guaranteeType:   data.guaranteeType,
              guaranteeStatus: data.guaranteeStatus,
              preauthRule:     data.preauthRule,
              preauthAmount:   data.preauthAmount,
            });
          }
          setIsNewResModalOpen(false);
        }}
      />

      </div>
      {/* Badge Management Modal */}
      <AnimatePresence>
        {isBadgeModalOpen && selectedRoomForBadges && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsBadgeModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[360px] bg-white rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#F1F5F9] flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#2C2A4A] tracking-tight">Gérer les badges</h3>
                    <p className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-widest leading-none">Chambre {selectedRoomForBadges.number}</p>
                  </div>
                </div>
                <button onClick={() => setIsBadgeModalOpen(false)} className="p-1.5 hover:bg-[#F9F9FC] rounded-lg transition-colors">
                  <X className="w-4 h-4 text-[#2C2A4A]/40" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {[
                  { id: 'vip', label: 'VIP', icon: <Crown className="w-3.5 h-3.5" />, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { id: 'prioritaire', label: 'Prioritaire', icon: <Bolt className="w-3.5 h-3.5" />, color: 'text-orange-500', bg: 'bg-orange-50' },
                  { id: 'nouveau', label: 'Nouveau client', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { id: 'fidele', label: 'Fidèle', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { id: 'incident', label: 'Incident', icon: <Flag className="w-3.5 h-3.5" />, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      const updatedBadges = { 
                        ...(selectedRoomForBadges.badges || {}), 
                        [option.id]: !((selectedRoomForBadges.badges as any)?.[option.id])
                      };
                      const updatedRoom = { ...selectedRoomForBadges, badges: updatedBadges };
                      setSelectedRoomForBadges(updatedRoom);
                      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                      (selectedRoomForBadges.badges as any)?.[option.id] 
                        ? 'bg-primary/5 border-primary/20 shadow-sm' 
                        : 'bg-white border-[#E2E2EA] hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${option.bg} ${option.color}`}>
                        {option.icon}
                      </div>
                      <span className="text-sm font-bold text-[#2C2A4A]">{option.label}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      (selectedRoomForBadges.badges as any)?.[option.id]
                        ? 'bg-primary border-primary'
                        : 'border-[#E2E2EA]'
                    }`}>
                      {(selectedRoomForBadges.badges as any)?.[option.id] && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 bg-[#F9F9FC] border-t border-[#F1F5F9] flex gap-2">
                <button 
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#E2E2EA] text-[#2C2A4A] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    addToast("Badges mis à jour");
                    setIsBadgeModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Communication Modal */}
      <AnimatePresence>
        {isCommModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCommModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[550px] bg-white rounded-[24px] shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F1F5F9] flex justify-between items-center bg-primary text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Communication Client</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Chambre {commData.roomNumber}</p>
                  </div>
                </div>
                <button onClick={() => setIsCommModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Client</label>
                    <div className="px-4 py-2.5 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl text-sm font-bold text-[#2C2A4A]">
                      {commData.guestName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Canal d'envoi</label>
                    <div className="flex p-1 bg-[#F9F9FC] border border-[#E2E2EA] rounded-xl h-[42px]">
                      <button 
                        onClick={() => setCommData(prev => ({ ...prev, channel: 'email' }))}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${commData.channel === 'email' ? 'bg-white shadow-sm text-primary' : 'text-[#2C2A4A]/40 hover:bg-white/50'}`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                      <button 
                        onClick={() => setCommData(prev => ({ ...prev, channel: 'whatsapp' }))}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${commData.channel === 'whatsapp' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#2C2A4A]/40 hover:bg-white/50'}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Email</label>
                    <div className="relative group">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C2A4A]/30 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="email" 
                        value={commData.email}
                        onChange={(e) => setCommData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E2EA] rounded-xl text-sm font-bold text-[#2C2A4A] outline-none focus:border-primary/30 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">WhatsApp / Tel</label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2C2A4A]/30 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        type="tel" 
                        value={commData.phone}
                        onChange={(e) => setCommData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E2EA] rounded-xl text-sm font-bold text-[#2C2A4A] outline-none focus:border-emerald-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Modèle de message</label>
                  <select 
                    value={commData.template}
                    onChange={(e) => {
                      const newTemplate = e.target.value;
                      const room = rooms.find(r => r.id === commData.roomId);
                      if (room) {
                        setCommData(prev => ({ 
                          ...prev, 
                          template: newTemplate,
                          message: fillTemplate(newTemplate, room)
                        }));
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-[#E2E2EA] rounded-xl text-sm font-bold text-[#2C2A4A] outline-none focus:border-primary/30 transition-all"
                  >
                    <option value="confirmation">📅 Confirmation de séjour</option>
                    <option value="rappel">⏰ Rappel Arrivée</option>
                    <option value="paiement">💰 Demande de Paiement</option>
                    <option value="facture">📄 Envoi de Facture</option>
                    <option value="satisfaction">⭐ Questionnaire de Satisfaction</option>
                    <option value="offre">🎁 Offre Spéciale</option>
                    <option value="modification">✏️ Modification de Réservation</option>
                    <option value="annulation">❌ Confirmation d'Annulation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Contenu du message</label>
                  <textarea 
                    value={commData.message}
                    onChange={(e) => setCommData(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 bg-[#F9F9FC] border border-[#E2E2EA] rounded-2xl text-sm font-semibold text-[#2C2A4A] outline-none focus:border-primary/30 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F9F9FC] border-t border-[#F1F5F9] flex justify-between items-center gap-3">
                <button 
                  onClick={() => {
                    const win = window.open('', '_blank');
                    win?.document.write(`<html><head><title>Message pour ${commData.guestName}</title><style>body{font-family:Inter,sans-serif;padding:40px;line-height:1.6;}</style></head><body><h2 style="color:#4A1D6D">Message Client - Flowtym</h2><hr/><pre style="white-space:pre-wrap;font-family:inherit;font-size:16px">${commData.message}</pre></body></html>`);
                    win?.print();
                  }}
                  className="px-5 py-2.5 bg-white border border-[#E2E2EA] text-[#2C2A4A] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsCommModalOpen(false)}
                    className="px-5 py-2.5 border border-[#E2E2EA] text-[#2C2A4A] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#F9F9FC] transition-all"
                  >
                    Fermer
                  </button>
                  <button 
                    onClick={() => {
                      if (commData.channel === 'email') {
                        if (!commData.email) return addToast("Email requis", "error");
                        addToast(`📧 Email envoyé à ${commData.email}`, "success");
                      } else {
                        if (!commData.phone) return addToast("Téléphone requis", "error");
                        const cleanPhone = commData.phone.replace(/\D/g, '');
                        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(commData.message)}`, '_blank');
                        addToast("📱 Ouverture de WhatsApp Web", "success");
                      }
                      setIsCommModalOpen(false);
                    }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
                      commData.channel === 'whatsapp' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white' 
                        : 'bg-primary hover:opacity-90 shadow-primary/20 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" /> {commData.channel === 'email' ? 'Envoyer Email' : 'WhatsApp'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Relogement Modal */}
      <AnimatePresence>
        {isRelogementModalOpen && relogementData.sourceRoom && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsRelogementModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[800px] bg-white rounded-[24px] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#F1F5F9] flex justify-between items-center bg-primary text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Délogement - Changement de chambre</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">PMS FLOWTYM - OPÉRATIONS</p>
                  </div>
                </div>
                <button onClick={() => setIsRelogementModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 grid grid-cols-2 gap-6">
                {/* Source Column */}
                <div className="space-y-4 bg-[#F9F9FC] p-5 rounded-[20px] border border-[#E2E2EA]">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase text-primary tracking-wider border-b border-primary/10 pb-2 mb-4">
                    <DoorOpen className="w-4 h-4" /> Chambre Source
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Chambre</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-black text-[#2C2A4A]">{relogementData.sourceRoom.number}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Catégorie</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-[11px] font-bold text-[#2C2A4A]">{relogementData.sourceRoom.category}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Client</label>
                    <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-bold text-[#2C2A4A]">{relogementData.sourceRoom.guestName}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Arrivée</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-bold text-[#2C2A4A]">{relogementData.sourceRoom.checkIn}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Départ</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-bold text-[#2C2A4A]">{relogementData.sourceRoom.checkOut}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Adultes</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-bold text-[#2C2A4A]">{relogementData.sourceRoom.pax || 1}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Enfants</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-sm font-bold text-[#2C2A4A]">0</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Source</label>
                      <div className="px-3 py-2 bg-[#E2E8F0] rounded-xl text-[10px] font-bold text-[#2C2A4A]">{relogementData.sourceRoom.source}</div>
                    </div>
                  </div>
                </div>

                {/* Destination Column */}
                <div className="space-y-4 bg-[#F9F9FC] p-5 rounded-[20px] border border-[#E2E2EA]">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase text-primary tracking-wider border-b border-primary/10 pb-2 mb-4">
                    <Building2 className="w-4 h-4" /> Chambre Destination
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#2C2A4A]/40 uppercase tracking-wider">Sélectionner une chambre libre</label>
                    <select 
                      value={relogementData.targetRoomId}
                      onChange={(e) => setRelogementData(prev => ({ ...prev, targetRoomId: e.target.value, billingOption: 'none' }))}
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E2EA] rounded-xl text-sm font-bold text-[#2C2A4A] outline-none focus:border-primary/30 transition-all"
                    >
                      <option value="">-- Choisir une chambre --</option>
                      {rooms
                        .filter(r => (r.status === 'Libre' || r.status === 'Propre') && r.id !== relogementData.sourceRoom?.id)
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            Ch.{r.number} - {r.category} ({r.type})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <AnimatePresence>
                    {relogementData.targetRoomId && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-white rounded-xl border border-[#E2E2EA] space-y-2 mt-4"
                      >
                        {(() => {
                          const target = rooms.find(r => r.id === relogementData.targetRoomId);
                          if (!target) return null;
                          return (
                            <>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-[#2C2A4A]/60 uppercase tracking-wider">Catégorie :</span>
                                <span className="font-black text-primary">{target.category}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-[#2C2A4A]/60 uppercase tracking-wider">Surface :</span>
                                <span className="font-black text-[#2C2A4A]">{target.surface}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-[#2C2A4A]/60 uppercase tracking-wider">Vue :</span>
                                <span className="font-black text-[#2C2A4A]">{target.view_desc}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-[#2C2A4A]/60 uppercase tracking-wider">Équipements :</span>
                                <span className="font-bold text-primary/70">{target.equipments.slice(0, 3).join(', ')}</span>
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Alert Zone */}
              <AnimatePresence>
                {(() => {
                  if (!relogementData.targetRoomId) return null;
                  const target = rooms.find(r => r.id === relogementData.targetRoomId);
                  if (target && target.category !== relogementData.sourceRoom.category) {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mx-6 mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <p className="text-xs font-bold text-orange-800">
                            Changement de catégorie : <strong>{relogementData.sourceRoom.category}</strong> → <strong>{target.category}</strong>.
                            <br/>Voulez-vous facturer la différence tarifaire ?
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setRelogementData(prev => ({ ...prev, billingOption: 'charge' }))}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${relogementData.billingOption === 'charge' ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-100'}`}
                          >
                            💰 Facturer la différence
                          </button>
                          <button 
                            onClick={() => setRelogementData(prev => ({ ...prev, billingOption: 'ignore' }))}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${relogementData.billingOption === 'ignore' ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-100'}`}
                          >
                            🚫 Ignorer la différence
                          </button>
                        </div>
                      </motion.div>
                    );
                  }
                  return null;
                })()}
              </AnimatePresence>

              {/* Footer */}
              <div className="px-6 py-4 bg-[#F9F9FC] border-t border-[#F1F5F9] flex justify-end gap-3">
                <button 
                  onClick={() => setIsRelogementModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-[#E2E2EA] text-[#2C2A4A] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-all"
                >
                  Quitter
                </button>
                <button 
                  onClick={async () => {
                    if (!relogementData.targetRoomId) return addToast("Sélectionnez une chambre destination", "error");
                    const targetRoom = rooms.find(r => r.id === relogementData.targetRoomId);
                    if (!targetRoom) return;

                    // Condition check if category mismatch
                    if (targetRoom.category !== relogementData.sourceRoom?.category && relogementData.billingOption === 'none') {
                      return addToast("Veuillez choisir une option de facturation", "error");
                    }

                    // Process relogement
                    const sourceId = relogementData.sourceRoom?.id;
                    const targetId = relogementData.targetRoomId;
                    
                    setRooms(prev => prev.map(r => {
                      if (r.id === sourceId) {
                        return { ...r, guestName: null, guestId: null, reservationId: null, checkIn: null, checkOut: null, status: 'À nettoyer' };
                      }
                      if (r.id === targetId) {
                        return { 
                          ...r, 
                          guestName: relogementData.sourceRoom?.guestName || null,
                          guestId: relogementData.sourceRoom?.guestId || null,
                          reservationId: relogementData.sourceRoom?.reservationId || null,
                          checkIn: relogementData.sourceRoom?.checkIn || null,
                          checkOut: relogementData.sourceRoom?.checkOut || null,
                          status: 'Occupée'
                        };
                      }
                      return r;
                    }));

                    if (relogementData.billingOption === 'charge') {
                      addToast("Supplément tarifaire ajouté à la facture", "success");
                    }
                    addToast(`✅ Client déplacé vers la chambre ${targetRoom.number}`, "success");
                    setIsRelogementModalOpen(false);
                  }}
                  className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                >
                  Valider le délogement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border-l-[6px] flex items-center gap-4 min-w-[300px] backdrop-blur-md ${
                notif.type === 'incident' 
                  ? 'bg-rose-50/90 border-rose-500 text-rose-900' 
                  : 'bg-white/90 border-primary text-primary-dark'
              }`}
            >
              <div className={`p-2 rounded-xl ${notif.type === 'incident' ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                {notif.type === 'incident' ? <AlertCircle className="w-5 h-5" /> : <Brush className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-black tracking-tight">{notif.message}</p>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">À l'instant</p>
              </div>
              <button 
                onClick={() => setActiveNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
