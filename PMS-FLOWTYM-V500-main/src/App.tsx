import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Bookmark, 
  Contact, 
  Users, 
  LineChart, 
  Tags, 
  FileText, 
  Sliders,
  Hotel,
  Bell,
  Search,
  X,
  Plus,
  ArrowLeft,
  Settings,
  Layers,
  CheckCircle2,
  Activity,
  XCircle,
  TrendingUp,
  Lock,
  Loader2
} from 'lucide-react';

import { Planning } from './components/Planning';
import { FrontDesk } from './components/FrontDesk';
import { ReservationDetailPanel } from './components/ReservationDetailPanel';
import PlanChambers from './components/PlanChambers';
import { Reservations } from './components/Reservations';
import { Clients } from './components/Clients';
import { Checkin } from './components/Checkin';
import { Simulations } from './components/Simulations';
import { Facturation } from './components/Facturation';
import { Rapports } from './components/Rapports';
import { Tarifs } from './components/Tarifs';
import { Groups } from './components/Groups';
import { AutoRules } from './components/AutoRules';
import { Configuration } from './components/Configuration';
import { Cloture } from './components/Cloture';
import { Housekeeping, Maintenance, Staff, Consignes, ObjetsTrouves, PetiteCaisse, Debiteurs } from './components/OperationsModules';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { Flowboard } from './components/Flowboard';
import { CheckinQR } from './components/CheckinQR';
import { DatePickerModal, HelpShortcutsModal } from './components/ShortcutModals';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Login } from './components/Login';
import { useSupabaseData } from './hooks/useSupabaseData';
import { useReservationStore, type Reservation as StoreReservation } from './store/reservationStore';
import ConformiteFiscale from './components/ConformiteFiscale';
import Prestations from './components/Prestations';

// ==================== UI HELPERS ====================
const toast = (msg: string) => {
  const isError = /erreur|error|échoué|failed|impossible/i.test(msg);
  const isWarn  = /solde|impayé|attention|avertissement|alerte/i.test(msg);
  const accent  = isError ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981';
  const iconBg  = isError ? '#FEF2F2' : isWarn ? '#FFF7ED' : '#ECFDF5';
  const icon    = isError ? '❌'      : isWarn ? '⚠️'      : '✅';
  const [title, ...subs] = msg.split(' · ');
  const sub = subs.join(' · ');

  const t = document.createElement('div');
  t.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:20px', 'z-index:9999',
    'background:white', 'border-radius:16px',
    `border-left:3px solid ${accent}`,
    'box-shadow:0 8px 40px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.04)',
    'padding:12px 14px', 'display:flex', 'align-items:flex-start', 'gap:12px',
    'width:310px', 'pointer-events:auto',
    'animation:toastIn .25s cubic-bezier(.34,1.56,.64,1)',
    'font-family:Inter,system-ui,sans-serif',
  ].join(';');

  t.innerHTML = `
    <div style="width:34px;height:34px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${icon}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:12px;font-weight:700;color:#1E293B;line-height:1.3">${title}</div>
      ${sub ? `<div style="font-size:10px;color:#94A3B8;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sub}</div>` : ''}
    </div>
    <div style="position:absolute;bottom:0;left:3px;right:0;height:2px;background:${accent};border-radius:0 0 16px 0;transform-origin:left;animation:toastProgress 3s linear forwards"></div>
  `;

  // Injection keyframes si besoin
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastIn { from { opacity:0; transform:translateX(32px) scale(.95) } to { opacity:1; transform:translateX(0) scale(1) } }
      @keyframes toastProgress { from { transform:scaleX(1) } to { transform:scaleX(0) } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(32px) scale(.95)'; t.style.transition = 'all .2s ease'; setTimeout(() => t.remove(), 200); }, 3000);
};

// ==================== MOCK DATA ====================
const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_ROOMS = [
  // Étage 1
  ...Array.from({ length: 12 }, (_, i) => ({ num: (101 + i).toString(), type: i % 3 === 0 ? "Suite" : "Double", price: i % 3 === 0 ? 250 : 120, status: "available", floor: 1 })),
  // Étage 2
  ...Array.from({ length: 12 }, (_, i) => ({ num: (201 + i).toString(), type: i % 4 === 0 ? "Suite" : "Twin", price: i % 4 === 0 ? 280 : 130, status: "available", floor: 2 })),
  // Étage 3
  ...Array.from({ length: 12 }, (_, i) => ({ num: (301 + i).toString(), type: "Single", price: 90, status: "available", floor: 3 })),
  // Étage 4
  ...Array.from({ length: 12 }, (_, i) => ({ num: (401 + i).toString(), type: "Double", price: 140, status: "available", floor: 4 })),
  // Étage 5
  ...Array.from({ length: 10 }, (_, i) => ({ num: (501 + i).toString(), type: "Suite", price: 350, status: "available", floor: 5 })),
];

const INITIAL_CLIENTS = [
  { 
    id: 1, name: "Pierre Bernard", email: "pierre.bernard@orange.fr", phone: "+33698765432", 
    visits: 2, ca: 840, tag: "Business", status: "checked_out", room: "101", 
    checkin: "2026-03-23", checkout: "2026-03-27", 
    idVerified: true, city: "Paris", country: "France",
    preferences: { floor: "Moyen", bedType: "Ferme" },
    history: [
      { dates: "23-27 mars 2026", room: "101", category: "Double Standard", nights: 4, amount: 480, rating: 5 }
    ]
  },
  { 
    id: 2, name: "Sophie Dubois", email: "sophie.dubois@yahoo.fr", phone: "+33654321098", 
    visits: 1, ca: 360, tag: "Famille", status: "checked_in", room: "103", 
    checkin: "2026-04-07", checkout: "2026-04-10",
    idVerified: true, city: "Lyon", country: "France",
    allergies: "Sans gluten",
    history: []
  },
  { 
    id: 3, name: "Ali Larabi", email: "ali@flowtym.com", phone: "+33667830249", 
    visits: 12, ca: 4250, tag: "VIP", status: "checked_in", room: "201", 
    checkin: "2026-04-06", checkout: "2026-04-12",
    idVerified: true, city: "Marseille", country: "France", company: "Flowtym Inc.",
    notes: "Partenaire technologique. Toujours offrir un surclassement si possible.",
    history: [
      { dates: "12-15 fév. 2026", room: "501", category: "Suite Royale", nights: 3, amount: 1050, rating: 5 }
    ]
  },
  { 
    id: 4, name: "Marie Martin", email: "marie.martin@gmail.com", phone: "+33612345678", 
    visits: 1, ca: 360, tag: "Regulier", status: "pending", room: "202", 
    checkin: "2026-04-07", checkout: "2026-04-09",
    idVerified: false, city: "Nice", country: "France",
    history: []
  }
];

const INITIAL_GROUPS = [
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
    notes: 'Salle de réunion demandée. Déjeuner inclus.' 
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
    notes: 'Suite nuptiale requise.' 
  },
];

const INITIAL_SIMULATIONS = [
  { id: 'SIM-001', clientName: 'Dupont SA', contact: 'm.dupont@dupont.com', amount: 3450, amountHT: 3105, status: 'devis', conversion: 0, nights: 5, rooms: 3, valid: '2026-05-01', notes: 'Séminaire direction', createdAt: '2026-04-10T10:00:00Z', lines: [], conf: { vat: 10, cityTax: 2.5 } },
  { id: 'SIM-002', clientName: 'Tech Corp', contact: 'b.martin@tech.com', amount: 7200, amountHT: 6480, status: 'proforma', conversion: 60, nights: 8, rooms: 6, valid: '2026-04-20', notes: 'Conférence annuelle', createdAt: '2026-04-12T14:30:00Z', lines: [], conf: { vat: 10, cityTax: 2.5 } },
  { id: 'SIM-003', clientName: 'SNCF Voyages', contact: 'r.petit@sncf.fr', amount: 12600, amountHT: 11340, status: 'converted', conversion: 100, nights: 10, rooms: 10, valid: '2026-04-15', notes: 'Formation managers', createdAt: '2026-04-05T09:15:00Z', lines: [], conf: { vat: 10, cityTax: 2.5 } },
];

const INITIAL_RESERVATIONS = [
  { id: "RES-001", clientId: 1, status: "checked_out", dates: "23 mars – 27 mars 2026", nights: 4, room: "101", canal: "Direct", montant: 480, solde: 0, checkin: "2026-03-23", checkout: "2026-03-27" },
  { id: "RES-002", clientId: 2, status: "checked_in", dates: "07 avr. – 10 avr. 2026", nights: 3, room: "103", canal: "Booking.com", montant: 360, solde: 360, checkin: "2026-04-07", checkout: "2026-04-10" },
  { id: "RES-003", clientId: 3, status: "checked_in", dates: "18 avr. – 25 avr. 2026", nights: 7, room: "201", canal: "Direct", montant: 1750, solde: 1750, checkin: "2026-04-18", checkout: "2026-04-25", cleaning_requested: true, cleaning_date: "2026-04-22" },
  { id: "RES-004", clientId: 4, status: "confirmed", dates: "07 avr. – 09 avr. 2026", nights: 2, room: "102", canal: "Direct", montant: 360, solde: 360, checkin: "2026-04-07", checkout: "2026-04-09", cleaning_requested: false }
];

// ==================== COMPONENTS ====================

const SidebarModal = ({ isOpen, onClose, title, children, footer }) => (
  <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[500]"
        />
      )}
    </AnimatePresence>
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 w-[500px] max-w-full h-full bg-white z-[501] shadow-2xl flex flex-col rounded-l-3xl overflow-hidden"
    >
      <div className="flex border-b p-4 justify-between items-center bg-white sticky top-0 shrink-0">
        <h2 className="text-base font-black text-gray-900 tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-white scrollbar-hide">
        {children}
      </div>
      {footer && (
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-2 sticky bottom-0 shrink-0">
          {footer}
        </div>
      )}
    </motion.div>
  </>
);

const KPICard = ({ label, value, color, delta, icon: Icon }: any) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all cursor-default">
    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start mb-2">
      <span className="text-[9px] font-black text-slate-400 capitalize tracking-widest">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-slate-200" />}
    </div>
    <div className="text-3xl font-black text-slate-800">{value}</div>
    {delta && typeof delta === 'string' && (
      <div className={`text-[10px] font-black mt-3 flex items-center gap-1 ${delta.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
        {delta} <span className="text-slate-400 font-bold">vs N-1</span>
      </div>
    )}
  </div>
);



// ==================== APP MAIN ====================

const INITIAL_ROOMS_PLANCHAMBERS = [
  {
    id: '101',
    name: '101 - Simple Classique',
    number: '101',
    num: '101',
    type: 'Simple',
    category: 'Classique',
    surface: '16m²',
    status: 'Libre',
    guestName: 'Arathew Smith',
    guestEmail: 'arathew.smith@email.com',
    guestPhone: '+33612345678',
    guestId: '1',
    reservationId: 'RES-001',
    externalReservationId: 'BK-998877',
    pax: 2,
    checkIn: '2026-04-15',
    checkOut: '2026-04-19',
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
    num: '102',
    type: 'Double',
    category: 'Classique',
    surface: '33m²',
    status: 'Occupée',
    guestName: 'Claire Martin',
    guestEmail: 'claire.martin@email.com',
    guestPhone: '+33698765432',
    guestId: '2',
    reservationId: 'RES-004',
    externalReservationId: 'EXP-123456',
    pax: 2,
    checkIn: '2026-04-07',
    checkOut: '2026-04-09',
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
    num: '103',
    type: 'Suite',
    category: 'Deluxe',
    surface: '45m²',
    status: 'Propre',
    guestName: 'Sophie Dubois',
    guestId: '2',
    reservationId: 'RES-002',
    pax: 2,
    checkIn: '2026-04-07',
    checkOut: '2026-04-10',
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
    id: '201',
    name: '201 - Suite Royale',
    number: '201',
    num: '201',
    type: 'Suite',
    category: 'Royale',
    surface: '55m²',
    status: 'Occupée',
    guestName: 'Ali Larabi',
    guestId: '3',
    reservationId: 'RES-003',
    pax: 2,
    checkIn: '2026-04-06',
    checkOut: '2026-04-12',
    floor: 2
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('flowboard');
  const [rooms, setRooms] = useState(INITIAL_ROOMS_PLANCHAMBERS);

  // ── Store Zustand : source unique de vérité pour les réservations ──
  const storeReservations = useReservationStore((s) => s.reservations);
  const storeAddReservation = useReservationStore((s) => s.addReservation);
  const storeUpdateReservation = useReservationStore((s) => s.updateReservation);
  const storeSetReservations = useReservationStore((s) => s.setReservations);

  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [simulations, setSimulations] = useState(INITIAL_SIMULATIONS);
  const [roomStatusesState, setRoomStatusesState] = useState<Record<string, string>>({
    "101": 'occupee', "102": 'sale', "103": 'propre', "104": 'encours', "201": 'occupee', 
    "202": 'propre', "203": 'occupee', "204": 'hors-service', "301": 'propre', "302": 'encours',
    "401": 'occupee', "402": 'propre', "403": 'sale', "501": 'hors-service'
  });
  const [selectedResaId, setSelectedResaId] = useState<string | null>(null);
  const [housekeepingTasks, setHousekeepingTasks] = useState<any[]>([]);
  const [toasts, setToasts] = useState<{id: number, msg: string}[]>([]);
  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, msg}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('Mas Provencal Aix');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAlertes, setShowAlertes] = useState(false);

  // Global Toast Listener
  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      if (e.detail?.message) {
        addToast(e.detail.message);
      }
    };
    window.addEventListener('app-toast', handleGlobalToast);
    return () => window.removeEventListener('app-toast', handleGlobalToast);
  }, []);

  // ==================== SUPABASE DATA & REALTIME ====================
  const { 
    rooms: dbRooms, 
    reservations: dbReservations, 
    clients: dbClients, 
    tasks: dbTasks, 
    lostItems: dbLostItems, 
    loading: dbLoading 
  } = useSupabaseData(1);

  // Use DB data if available, fallback to mock for demo/offline
  const activeRooms = dbRooms.length > 0 ? dbRooms : INITIAL_ROOMS_PLANCHAMBERS;

  // ── activeReservations : Supabase prioritaire, sinon le store Zustand (mis à jour en temps réel) ──
  const activeReservations = dbReservations.length > 0 ? dbReservations : storeReservations;

  // Exposer les réservations sur window pour le fallback du ReservationDetailPanel
  (window as any).__flowtymReservations = activeReservations;

  const activeClients = dbClients.length > 0 ? dbClients : INITIAL_CLIENTS;

  // ── Sync Supabase → store Zustand (quand Supabase est configuré et retourne des données) ──
  useEffect(() => {
    if (dbReservations.length > 0) {
      storeSetReservations(dbReservations as any);
    }
  }, [dbReservations]);

  // ==================== AUTH STATE ====================
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsAuthLoading(false);
      return;
    }

    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') toast('Connexion réussie');
      if (_event === 'SIGNED_OUT') toast('Déconnexion effectuée');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (confirm("Souhaitez-vous vraiment vous déconnecter ?")) {
      await supabase.auth.signOut();
    }
  };

  // ==================== MULTI-WINDOW SYSTEM ====================
  const [windows, setWindows] = useState<{id: string, title: string, type: string, data: any, icon: string}[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  const openWindow = (title: string, type: string, data: any, icon: string) => {
    const id = `${type}-${data?.id || Date.now()}`;
    if (windows.find(w => w.id === id)) {
      setActiveWindowId(id);
      return;
    }
    setWindows(prev => [...prev, { id, title, type, data, icon }]);
    setActiveWindowId(id);
  };

  const closeWindow = (id: string) => {
    const nextWindows = windows.filter(w => w.id !== id);
    setWindows(nextWindows);
    if (activeWindowId === id) {
      setActiveWindowId(nextWindows.length > 0 ? nextWindows[nextWindows.length - 1].id : null);
    }
  };

  const switchTab = (id: string | null) => {
    setActiveWindowId(id);
  };

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleAction = (action: string, params?: any) => {
    console.log(`[Shortcut] Action triggered: ${action}`, params);
    
    // Helper to simulate button clicks as requested
    const clickButton = (selector: string) => {
      const btn = document.querySelector(selector) as HTMLElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    };

    switch(action) {
      case 'show-help': setIsHelpOpen(true); break;
      case 'open-datepicker': setIsDatePickerOpen(true); break;
      case 'planning-prev': if (!clickButton('#prevBtn, .btn-prev')) window.dispatchEvent(new CustomEvent('planning-prev')); break;
      case 'planning-next': if (!clickButton('#nextBtn, .btn-next')) window.dispatchEvent(new CustomEvent('planning-next')); break;
      case 'planning-today': if (!clickButton('#todayBtn, .btn-today')) window.dispatchEvent(new CustomEvent('planning-today')); break;
      case 'set-view': 
        if (!clickButton(`[data-view="${params}"], .view-btn[data-view="${params}"]`)) {
          window.dispatchEvent(new CustomEvent('planning-view', { detail: params }));
        }
        break;
      case 'zoom-in': clickButton('#zoomInBtn, .btn-zoom-in'); window.dispatchEvent(new CustomEvent('zoom-in')); break;
      case 'zoom-out': clickButton('#zoomOutBtn, .btn-zoom-out'); window.dispatchEvent(new CustomEvent('zoom-out')); break;
      case 'focus-search': 
        const searchInput = document.querySelector('#searchInput, .search-bar, input[type="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
        else window.dispatchEvent(new CustomEvent('focus-search')); 
        break;
      case 'save': if (!clickButton('#saveBtn, .btn-save')) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Sauvegarde effectuée' } })); break;
      case 'undo': if (!clickButton('#undoBtn, .btn-undo')) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Action annulée' } })); break;
      case 'redo': if (!clickButton('#redoBtn, .btn-redo')) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Action rétablie' } })); break;
      case 'logout': if (!clickButton('#logoutBtn, .btn-logout')) { handleLogout(); } break;
      case 'new-reservation': 
        if (!clickButton('#newReservationBtn, .btn-new-reservation')) {
          setActiveTab('planning');
          setActiveWindowId(null);
          setTimeout(() => {
            if (!clickButton('#newReservationBtn, .btn-new-reservation')) {
              window.dispatchEvent(new CustomEvent('new-reservation'));
            }
          }, 50);
        }
        break;
      case 'edit-selected': if (!clickButton('.edit-reservation-btn, .btn-edit-reservation')) window.dispatchEvent(new CustomEvent('edit-selected')); break;
      case 'check-in': if (!clickButton('.checkin-btn, .btn-checkin')) setActiveTab('checkin'); break;
      case 'check-out': if (!clickButton('.checkout-btn, .btn-checkout')) setActiveTab('checkin'); break;
      case 'generate-report': if (!clickButton('.rapport-item.active, .report-tab.active')) setActiveTab('rapports'); break;
      case 'open-clients': if (!clickButton('.menu-item[data-module="clients"], #clientsBtn')) setActiveTab('clients'); break;
      case 'open-history': clickButton('#clientHistoryBtn, .btn-history'); setActiveTab('clients'); break;
      case 'set-folio': if (!clickButton(`.folio-btn[data-folio="${params}"], [data-folio-action="${params}"]`)) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Folio ${params} activé` } })); break;
      case 'cancel-selected': if (!clickButton('.cancel-reservation-btn, .btn-cancel-reservation')) window.dispatchEvent(new CustomEvent('cancel-selected')); break;
      case 'close-all': 
        if (activeWindowId) {
          closeWindow(activeWindowId);
        } else {
           setIsModalOpen(false);
           setIsDatePickerOpen(false);
           setIsHelpOpen(false);
           setSelectedResaId(null);
           window.dispatchEvent(new CustomEvent('close-all-modals'));
           // Also close vanilla modals if any
           document.querySelectorAll('.modal, .drawer, .overlay, .date-picker-overlay').forEach(el => {
             if ((el as HTMLElement).style.display !== 'none') (el as HTMLElement).style.display = 'none';
           });
        }
        break;
      case 'go-today': if (!clickButton('#todayBtn, .btn-today')) window.dispatchEvent(new CustomEvent('planning-today')); break;
    }
  };

  // ==================== KEYBOARD SHORTCUTS ====================
  // Handled by KeyboardShortcuts component below

  // ==================== CONNECTIVITY.JS INTEGRATION ====================
  useEffect(() => {
    // Les fonctions globales telles que demandées :
    (window as any).refreshPlanning = () => {
      // Force re-render via store Zustand (no-op update)
      storeSetReservations([...storeReservations]);
      console.log("[App] refreshPlanning déclenché via connectivity.js");
    };

    (window as any).refreshToday = () => {
      // Simuler loadRooms() et renderTodayView() en forçant un rerender
      setRooms(prev => [...prev]);
      console.log("[App] refreshToday déclenché via connectivity.js");
    };

    // Écouteurs pour les CustomEvents de connectivity.js :
    const handleCheckinCompleted = (e: any) => {
      const { roomId, reservationId } = e.detail;
      console.log("Checkin completé via connectivity:", { roomId, reservationId });
      // On peut ajouter la logique de mise à jour des états React ici
      setRoomStatusesState(prev => ({ ...prev, [roomId]: 'occupee' }));
    };

    const handleCheckoutCompleted = (e: any) => {
      const { roomId, reservationId } = e.detail;
      console.log("Checkout completé via connectivity:", { roomId, reservationId });
      setRoomStatusesState(prev => ({ ...prev, [roomId]: 'sale' }));
    };

    const handleRoomUpdated = (e: any) => {
      console.log("Chambre modifiée via Supabase Realtime:", e.detail);
      if((window as any).refreshToday) (window as any).refreshToday();
    };

    const handleConfigUpdated = (e: any) => {
      console.log("Configuration modifiée:", e.detail);
    };

    // Attachement des écouteurs
    window.addEventListener('checkin-completed', handleCheckinCompleted);
    window.addEventListener('checkout-completed', handleCheckoutCompleted);
    window.addEventListener('rooms-updated', handleRoomUpdated);
    window.addEventListener('config-updated', handleConfigUpdated);

    return () => {
      window.removeEventListener('checkin-completed', handleCheckinCompleted);
      window.removeEventListener('checkout-completed', handleCheckoutCompleted);
      window.removeEventListener('rooms-updated', handleRoomUpdated);
      window.removeEventListener('config-updated', handleConfigUpdated);
    };
  }, []);
  // =====================================================================

  const handleFinalizeCheckout = (roomId: string, reservationId: string, paymentData: any) => {
    // 1. Sauvegarder la facture et les paiements (Simulation)
    console.log('Saving invoice for', { roomId, reservationId, paymentData });

    // 2. Changer le statut de la chambre
    setRoomStatusesState(prev => ({
      ...prev,
      [roomId]: 'sale'
    }));
    setRooms(prev => prev.map(r => r.num === roomId ? { ...r, status: 'À nettoyer', guestName: null, guestId: null, reservationId: null } : r));

    // 3. Créer une tâche ménage automatique
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      roomNum: roomId,
      type: 'Check-out cleaning',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setHousekeepingTasks(prev => [...prev, newTask]);

    // 4. Mettre à jour la réservation
    storeUpdateReservation(reservationId, { status: 'checked_out' });

    // 5. Notifier l'utilisateur
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Check-out validé · Ch. ${roomId} · Ménage planifié` } }));
  };

  const handleConfirmCheckin = (data: any) => {
    // 1. Update reservation status
    storeUpdateReservation(data.reservationId, { status: 'checked_in' });

    // 2. Update room status and guest info
    setRooms(prev => prev.map(r => {
      if (r.num === data.roomId || r.id === data.roomId) {
        return {
          ...r,
          status: 'Occupée',
          guestName: data.guestName,
          guestEmail: data.email,
          guestPhone: data.phone,
          checkIn: data.arrivalDate,
          checkOut: data.departureDate,
          pax: data.adults + data.children,
          paymentStatus: (data.paymentStatus === 'paid' ? 'Payé' : (data.paymentStatus === 'refused' ? 'Refusé' : 'En attente'))
        };
      }
      return r;
    }));

    // 3. Update room status state
    const roomNum = data.roomId.toString();
    setRoomStatusesState(prev => ({
      ...prev,
      [roomNum]: 'occupee'
    }));

    // 4. Update client if needed
    setClients(prev => prev.map(c => {
      if (c.name === data.guestName) {
        return { ...c, email: data.email, phone: data.phone };
      }
      return c;
    }));

    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Check-in validé · ${data.guestName} · Ch. ${data.roomId}` } }));
  };

  const handleAddReservation = (newRes: any) => {
    const id = `RES-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Normaliser les champs — le formulaire peut envoyer room OU roomNumber, total OU totalTTC
    const normalized = {
      guestName:  newRes.guestName  || newRes.name     || 'Client',
      email:      newRes.email      || '',
      phone:      newRes.phone      || '',
      room:       newRes.room       || newRes.roomNumber || 'N/A',
      checkin:    newRes.checkin    || newRes.checkIn   || '',
      checkout:   newRes.checkout   || newRes.checkOut  || '',
      nights:     newRes.nights     || 0,
      total:      newRes.total      || newRes.totalTTC  || 0,
      canal:      newRes.canal      || newRes.channel   || 'Direct',
      paymentMode:   newRes.paymentMode    || 'Carte bancaire',
      paymentStatus: newRes.paymentStatus  || 'pending',
      guaranteeType:   newRes.guaranteeType   || 'cb',
      guaranteeStatus: newRes.guaranteeStatus || 'pending',
      preauthRule:   newRes.preauthRule   || 'first_night',
      preauthAmount: newRes.preauthAmount || 0,
    };

    // Créer / mettre à jour le client si inconnu
    let clientId = clients.find(c => c.name === normalized.guestName)?.id;
    if (!clientId) {
      clientId = Date.now(); // ID unique pour éviter les collisions
      setClients(prev => [...prev, {
        id: clientId,
        name: normalized.guestName,
        email: normalized.email,
        phone: normalized.phone,
        visits: 1,
        ca: normalized.total,
        tag: 'Regulier',
        status: 'pending',
        room: normalized.room,
        checkin: normalized.checkin,
        checkout: normalized.checkout,
        idVerified: false,
        history: [],
      }]);
    }

    const resEntry: StoreReservation = {
      id,
      clientId,
      guestName:  normalized.guestName,
      status:     'confirmed' as const,
      dates:      `${normalized.checkin} – ${normalized.checkout}`,
      nights:     normalized.nights,
      room:       normalized.room,
      canal:      normalized.canal,
      montant:    normalized.total,
      solde:      normalized.total,
      checkin:    normalized.checkin,
      checkout:   normalized.checkout,
      paymentMode:     normalized.paymentMode,
      paymentStatus:   normalized.paymentStatus,
      guaranteeType:   normalized.guaranteeType,
      guaranteeStatus: normalized.guaranteeStatus,
      preauthRule:     normalized.preauthRule,
      preauthAmount:   normalized.preauthAmount,
    };

    // ← Store Zustand : propagation instantanée vers Planning, Reservations, PlanChambers, Flowboard
    storeAddReservation(resEntry);
  };

  const handleUpdateReservation = (updatedRes: any) => {
    storeUpdateReservation(updatedRes.id, updatedRes);
  };

  const handleUpdateClient = (updatedClient: any) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleAddClient = (newClient: any) => {
    const fresh = { ...newClient, id: clients.length + 1 };
    setClients(prev => [...prev, fresh]);
  };

  const handleUpdateGroup = (updatedGroup: any) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleAddGroup = (newGroup: any) => {
    const fresh = { ...newGroup, id: Date.now() };
    setGroups(prev => [...prev, fresh]);
  };

  const handleUpdateSimulation = (updatedSim: any) => {
    setSimulations(prev => prev.map(s => s.id === updatedSim.id ? updatedSim : s));
  };

  const handleAddSimulation = (newSim: any) => {
    setSimulations(prev => [newSim, ...prev]);
  };
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // ===== 8-GROUP NAVIGATION =====
  const navGroups = [
    {
      id: 'frontdesk', label: 'Front Desk', icon: 'fa-hotel', color: '#8B5CF6',
      tabs: [
        { id: 'flowboard',     label: 'Flowboard',      icon: 'fa-layer-group'  },
        { id: 'planning',      label: 'Planning',      icon: 'fa-calendar-alt' },
        { id: 'plan',          label: 'Vue du Jour',   icon: 'fa-th-large'     },
        { id: 'checkin',       label: 'Arrivées / Départs', icon: 'fa-sign-in-alt' },
      ]
    },
    {
      id: 'reservations', label: 'Réservations', icon: 'fa-calendar-check', color: '#0EA5E9',
      tabs: [
        { id: 'reservations',  label: 'Réservations',  icon: 'fa-bookmark'     },
        { id: 'checkin_qr',    label: 'QR Check-in',   icon: 'fa-qrcode'       },
        { id: 'simulations',   label: 'Simulation',    icon: 'fa-chart-line'   },
        { id: 'groups',        label: 'Groupes',       icon: 'fa-users'        },
      ]
    },
    {
      id: 'clients', label: 'Clients', icon: 'fa-id-card', color: '#10B981',
      tabs: [
        { id: 'clients',       label: 'Fiche client',  icon: 'fa-address-card' },
      ]
    },
    {
      id: 'revenue', label: 'Revenue', icon: 'fa-chart-line', color: '#F59E0B',
      tabs: [
        { id: 'tarifs',      label: 'Tarifs & Yield',      icon: 'fa-tags'   },
        { id: 'prestations', label: 'Prestations',          icon: 'fa-utensils' },
        { id: 'auto_rules',  label: 'Règles automatiques', icon: 'fa-robot'  },
        { id: 'rms',         label: 'Tableau RMS',          icon: 'fa-table'  },
      ]
    },
    {
      id: 'operations', label: 'Opérations', icon: 'fa-tools', color: '#64748B',
      tabs: [
        { id: 'operations_hk',   label: 'Ménage',         icon: 'fa-broom'       },
        { id: 'operations_maint',label: 'Maintenance',    icon: 'fa-wrench'      },
        { id: 'operations_staff',label: 'Personnel',      icon: 'fa-hard-hat'   },
        { id: 'operations_cons', label: 'Consignes',      icon: 'fa-book-open'  },
        { id: 'operations_lost', label: 'Objets trouvés', icon: 'fa-box-open'   },
      ]
    },
    {
      id: 'finance', label: 'Finance', icon: 'fa-euro-sign', color: '#EF4444',
      tabs: [
        { id: 'facturation',   label: 'Facturation',    icon: 'fa-file-invoice'      },
        { id: 'cloture',       label: 'Clôture',        icon: 'fa-lock'              },
        { id: 'finance_caisse',label: 'Caisse',         icon: 'fa-cash-register'     },
        { id: 'finance_debt',  label: 'Impayés',        icon: 'fa-exclamation-circle'},
      ]
    },
    {
      id: 'conformite', label: 'Conformité', icon: 'fa-shield-check', color: '#6366F1',
      tabs: [
        { id: 'conformite_fiscale', label: 'Fiscalité', icon: 'fa-shield-check' },
      ]
    },
    {
      id: 'analyse', label: 'Analyse', icon: 'fa-chart-pie', color: '#8B5CF6',
      tabs: [
        { id: 'rapports',      label: 'Rapports',      icon: 'fa-file-chart-column' },
      ]
    },
    {
      id: 'params', label: 'Paramètres', icon: 'fa-sliders-h', color: '#475569',
      tabs: [
        { id: 'configuration', label: 'Configuration', icon: 'fa-cogs'          },
      ]
    },
  ];

  // Derive active group from activeTab
  const activeGroup = navGroups.find(g => g.tabs.some(t => t.id === activeTab))?.id || 'frontdesk';

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 tracking-widest">Initialisation du noyau...</p>
        </div>
      </div>
    );
  }

  if (!user && isSupabaseConfigured()) {
    return <Login onLoginSuccess={setUser} />;
  }
  const ModuleHeader = ({ label, icon }: { label: string, icon: string }) => (
    <div className="flex items-center justify-between mb-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => { setActiveTab('planning'); setActiveWindowId(null); }}
          className="group flex items-center justify-center bg-white border border-slate-200 w-9 h-9 rounded-xl text-slate-500 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
          title="Retour au Planning"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
              <i className={`fa-solid ${icon} text-sm`} />
           </div>
           <h2 className="text-xl font-black text-slate-800 tracking-tight">{label}</h2>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
      const renderModule = (id: string) => {
        switch (id) {
          case 'flowboard':
          case 'dashboard':
            return (
              <>
                <ModuleHeader label="Flowboard" icon="fa-layer-group" />
                <Flowboard
                  rooms={activeRooms}
                  reservations={activeReservations}
                  clients={activeClients}
                  onOpenReservation={(id) => setSelectedResaId(id)}
                  onAction={handleAction}
                />
              </>
            );
          case 'planning':
            return <Planning
              rooms={activeRooms}
              reservations={activeReservations}
              clients={activeClients}
              roomStatusesState={roomStatusesState}
              setRoomStatusesState={setRoomStatusesState}
              housekeepingTasks={dbTasks.length > 0 ? dbTasks : housekeepingTasks}
              setHousekeepingTasks={setHousekeepingTasks}
              onAddReservation={handleAddReservation}
              onUpdateReservation={handleUpdateReservation}
              onFinalizeCheckout={handleFinalizeCheckout}
              setActiveTab={setActiveTab}
              onOpenWindow={openWindow}
              selectedResaId={selectedResaId}
              setSelectedResaId={setSelectedResaId}
            />;
          case 'plan':
            return (
              <>
                <ModuleHeader label="Vue du Jour" icon="fa-th-large" />
                <PlanChambers
                  roomsProp={activeRooms}
                  setRoomsProp={() => {}}
                  reservations={activeReservations}
                  clients={activeClients}
                  onFinalizeCheckout={handleFinalizeCheckout}
                  onAddReservation={handleAddReservation}
                />
              </>
            );
          case 'reservations':
            return (
              <Reservations 
                reservations={activeReservations} 
                  clients={activeClients} 
                  onOpenReservation={(id) => setSelectedResaId(id)}
                  selectedResaId={selectedResaId}
                  onAddReservation={handleAddReservation}
                />
              );
          case 'checkin_qr':
            return (
              <>
                <ModuleHeader label="Check-in par QR Code" icon="fa-qrcode" />
                <CheckinQR reservations={activeReservations} clients={activeClients} />
              </>
            );
          case 'checkin':
            return (
              <>
                <ModuleHeader label="Arrivées / Départs" icon="fa-sign-in-alt" />
                <Checkin 
                  clients={activeClients} 
                  reservations={activeReservations} 
                  rooms={activeRooms} 
                  onConfirmCheckin={handleConfirmCheckin} 
                  onOpenReservation={(id) => setSelectedResaId(id)}
                />
              </>
            );
          case 'clients':
            return (
              <>
                <ModuleHeader label="Fiches Clients" icon="fa-address-card" />
                <Clients clients={activeClients} onUpdateClient={handleUpdateClient} onAddClient={handleAddClient} />
              </>
            );
          case 'groups':
            return (
              <>
                <ModuleHeader label="Groupes" icon="fa-users" />
                <Groups groups={groups} onUpdateGroup={handleUpdateGroup} onAddGroup={handleAddGroup} />
              </>
            );
          case 'simulations':
            return (
              <>
                <ModuleHeader label="Simulations" icon="fa-chart-line" />
                <Simulations simulations={simulations} onUpdateSimulation={handleUpdateSimulation} onAddSimulation={handleAddSimulation} onConvertToReservation={handleAddReservation} />
              </>
            );
          case 'tarifs':
            return (
              <>
                <ModuleHeader label="Tarifs & Yield" icon="fa-tags" />
                <Tarifs />
              </>
            );
          case 'auto_rules':
            return (
              <>
                <ModuleHeader label="Règles automatiques" icon="fa-robot" />
                <AutoRules />
              </>
            );
          case 'rms':
            return (
              <>
                <ModuleHeader label="Tableau RMS — Pricing Engine" icon="fa-table" />
                <Tarifs />
              </>
            );
          case 'facturation':
            return (
              <>
                <ModuleHeader label="Facturation" icon="fa-file-invoice" />
                <Facturation />
              </>
            );
          case 'cloture':
            return (
              <>
                <ModuleHeader label="Clôture Journalière" icon="fa-lock" />
                <Cloture reservations={activeReservations} clients={clients} rooms={rooms} />
              </>
            );
          case 'rapports':
            return (
              <>
                <ModuleHeader label="Analyse & Rapports" icon="fa-file-chart-column" />
                <Rapports clients={clients} reservations={activeReservations} rooms={rooms} onBack={() => setActiveTab('planning')} />
              </>
            );
          case 'configuration':
            return (
              <>
                <ModuleHeader label="Paramétrage" icon="fa-cogs" />
                <Configuration />
              </>
            );
          case 'prestations':
            return (
              <>
                <ModuleHeader label="Prestations & Consommations" icon="fa-utensils" />
                <Prestations reservations={activeReservations} clients={activeClients} />
              </>
            );
          case 'conformite_fiscale':
            return (
              <>
                <ModuleHeader label="Conformité Fiscale" icon="fa-shield-check" />
                <ConformiteFiscale />
              </>
            );
          case 'operations_hk': return <><ModuleHeader label="Ménage" icon="fa-broom" /><Housekeeping rooms={activeRooms} /></>;
          case 'operations_maint': return <><ModuleHeader label="Maintenance" icon="fa-wrench" /><Maintenance /></>;
          case 'operations_staff': return <><ModuleHeader label="Personnel" icon="fa-hard-hat" /><Staff /></>;
          case 'operations_cons': return <><ModuleHeader label="Consignes" icon="fa-book-open" /><Consignes /></>;
          case 'operations_lost': return <><ModuleHeader label="Objets Trouvés" icon="fa-box-open" /><ObjetsTrouves itemsProp={dbLostItems} /></>;
          case 'finance_caisse': return <><ModuleHeader label="Petite Caisse" icon="fa-cash-register" /><PetiteCaisse /></>;
          case 'finance_debt': return <><ModuleHeader label="Débiteurs" icon="fa-exclamation-circle" /><Debiteurs /></>;
          default:
            return (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100 border-dashed">
                <Hotel className="w-20 h-20 text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">Module en déploiement</h2>
                <p className="text-slate-400 text-sm font-medium">Ce module v2.3 sera actif prochainement.</p>
                <button className="mt-8 bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2 group" onClick={() => setActiveTab('planning')}>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour au planning
                </button>
              </div>
            );
        }
      };
  
      if (activeWindowId) {
        const win = windows.find(w => w.id === activeWindowId);
        if (win) {
          return (
            <div className="animate-[fadeIn_0.2s_ease-out]">
              <ModuleHeader label={win.title} icon={win.icon} />
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl min-h-[500px]">
                 {win.type === 'new-res' && <div>Formulaire Nouvelle Réservation (Mock)</div>}
                 {win.type === 'client' && <div>Fiche Client ID: {win.data.id}</div>}
                 {win.type === 'reservation' && <div>Détails Réservation: {win.data.id}</div>}
                 {!['new-res', 'client', 'reservation'].includes(win.type) && (
                   <div className="text-center py-20 text-slate-300 italic">Contenu de la fenêtre {win.title}</div>
                 )}
              </div>
            </div>
          );
        }
      }
  
      return renderModule(activeTab);
    };

  return (
    <div className="min-h-screen bg-bg font-sans text-gray-900 selection:bg-primary-light selection:text-primary overflow-x-hidden">
      
      {/* ─── TOP HEADER ─── */}
      <header className="h-[72px] bg-primary flex items-center justify-between px-8 sticky top-0 z-[100] shadow-lg shadow-primary/20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl group cursor-pointer hover:rotate-3 transition-transform" onClick={() => setActiveTab('planning')}>
               <Hotel className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">Flowtym <span className="text-primary-light">Pms</span></h1>
              <p className="text-[9px] font-black tracking-[1px] text-white/70 mt-0.5">V2.3 Standard Edition</p>
            </div>
          </div>

          {/* HOTEL SELECTOR */}
          <div className="hidden xl:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20 transition-all group">
             <i className="fa-solid fa-location-dot text-primary-light text-sm" />
             <select 
               className="bg-transparent text-white border-none text-[11px] font-black outline-none cursor-pointer pr-4"
               value={selectedHotel}
               onChange={(e) => setSelectedHotel(e.target.value)}
             >
                <option value="Mas Provencal Aix" className="text-slate-800">Mas Provencal Aix</option>
                <option value="Hôtel Rivage Cannes" className="text-slate-800">Hôtel Rivage Cannes</option>
                <option value="Lyon City Center" className="text-slate-800">Lyon City Center</option>
                <option value="all" className="text-slate-800">--- Rapport Groupe ---</option>
             </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-white tracking-widest">Connecté Api</span>
          </div>
          
          {/* ─── CENTRE ALERTES ─── */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const alertes = [
              ...activeReservations.filter(r => r.checkin === today && r.status === 'confirmed').map(r => ({ type: 'arrival', msg: `Arrivée attendue — Ch.${r.room} (${r.guestName || 'Client'})`, icon: 'fa-plane-arrival', color: '#8B5CF6' })),
              ...activeReservations.filter(r => r.checkout === today && r.status === 'checked_in').map(r => ({ type: 'departure', msg: `Départ prévu — Ch.${r.room} (${r.guestName || 'Client'})`, icon: 'fa-plane-departure', color: '#10B981' })),
              ...activeReservations.filter(r => r.solde > 0 && r.status !== 'cancelled').slice(0, 2).map(r => ({ type: 'payment', msg: `Solde impayé — ${r.id} : ${r.solde} €`, icon: 'fa-circle-exclamation', color: '#EF4444' })),
            ];
            const count = alertes.length;
            return (
              <div className="relative">
                <button
                  onClick={() => setShowAlertes(!showAlertes)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-primary flex items-center justify-center">
                      <span className="text-[9px] font-black text-white leading-none px-0.5">{count > 9 ? '9+' : count}</span>
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {showAlertes && (
                    <>
                      <div className="fixed inset-0 z-[150]" onClick={() => setShowAlertes(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[200]"
                      >
                        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                          <div>
                            <span className="text-[12px] font-bold text-slate-800">Centre d'alertes</span>
                            {count > 0 && <span className="ml-2 bg-rose-100 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded-full">{count} active{count > 1 ? 's' : ''}</span>}
                          </div>
                          <button onClick={() => setShowAlertes(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                          {alertes.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-[11px] font-bold">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              Aucune alerte active
                            </div>
                          ) : alertes.map((a, i) => (
                            <div key={i} className="px-5 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: a.color + '20' }}>
                                <i className={`fa-solid ${a.icon} text-[11px]`} style={{ color: a.color }} />
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-slate-700 leading-snug">{a.msg}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">Aujourd'hui</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {alertes.length > 0 && (
                          <div className="px-5 py-3 border-t border-slate-50">
                            <button onClick={() => { setShowAlertes(false); setActiveTab('flowboard'); }}
                              className="w-full text-center text-[11px] font-semibold text-primary hover:text-violet-800 transition-colors">
                              Voir le Flowboard →
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

          <div className="relative">
            <div 
              className="flex items-center gap-3 border-l border-white/20 pl-6 cursor-pointer group" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-white group-hover:text-primary-light transition-colors">Ali Larabi</div>
                <div className="text-[9px] font-bold text-white/60 tracking-widest">Administrateur</div>
              </div>
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center font-black group-hover:scale-105 transition-transform overflow-hidden">
                AL
              </div>
            </div>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[200] overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-semibold text-slate-400 mb-1">Session active</p>
                    <p className="text-xs font-black text-slate-800">ali.larabi@flowtym.com</p>
                  </div>
                  {[
                    { icon: 'fa-user-circle', label: 'Mon profil', onClick: () => addToast("Accès profil restreint") },
                    { icon: 'fa-language', label: 'Langue (FR/EN)', onClick: () => addToast("Langue : Français") },
                    { icon: 'fa-cog', label: 'Préférences', onClick: () => addToast("Options activées") },
                    { icon: 'fa-key', label: 'Changement mot de passe', onClick: () => addToast("Mail de reset envoyé") },
                    { icon: 'fa-sign-out-alt', label: 'Déconnexion', onClick: handleLogout, color: 'text-rose-500' }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => { item.onClick(); setIsProfileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all text-[14px] font-bold ${item.color || 'text-slate-600'}`}
                    >
                      <i className={`fa-solid ${item.icon} w-5 text-center opacity-40`} />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── NAVIGATION ROW: 8 GROUPES ─── */}
      <nav className="bg-white border-b border-slate-200 sticky top-[72px] z-[90] shadow-sm">
        {/* Primary bar: 8 groups */}
        <div className="flex items-center px-6 gap-2 h-11 overflow-x-auto no-scrollbar">
          {navGroups.map(group => {
            const isGroupActive = activeGroup === group.id;
            return (
              <div key={group.id} className="relative"
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <button
                  onClick={() => { setActiveTab(group.tabs[0].id); }}
                  className={`flex items-center gap-2 px-4 h-9 relative transition-all group whitespace-nowrap min-w-fit rounded-xl font-black text-[13px] ${
                    isGroupActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <i className={`fa-solid ${group.icon} text-[10px] group-hover:scale-110 transition-transform ${
                    isGroupActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-400'
                  }`} />
                  <span className="tracking-wide capitalize">{group.label}</span>
                  {group.tabs.length > 1 && (
                    <i className={`fa-solid fa-chevron-down text-[7px] ml-0.5 transition-transform ${
                      hoveredGroup === group.id ? 'rotate-180' : ''
                    } ${isGroupActive ? 'text-white/50' : 'text-slate-300'}`} />
                  )}
                </button>

                {/* Dropdown sub-tabs */}
                <AnimatePresence>
                  {hoveredGroup === group.id && group.tabs.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 py-2 min-w-[180px] z-[200] overflow-hidden"
                    >
                      {group.tabs.map((tab, idx) => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setHoveredGroup(null); }}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-left text-[13.5px] font-black transition-colors ${
                            activeTab === tab.id
                              ? 'text-primary bg-primary/5'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <i className={`fa-solid ${tab.icon} text-[11px] ${
                            activeTab === tab.id ? 'text-primary' : 'text-slate-300'
                          }`} />
                          {tab.label}
                          {activeTab === tab.id && <i className="fa-solid fa-check ml-auto text-primary text-[10px]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Secondary bar: sub-tabs of active group */}
        {(() => {
          const group = navGroups.find(g => g.id === activeGroup);
          if (!group || group.tabs.length <= 1) return null;
          return (
            <div className="flex items-center px-8 gap-1 h-10 border-t border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar">
              {group.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-black transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white border border-slate-200 text-primary shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[10px]`} />
                  {tab.label}
                </button>
              ))}
            </div>
          );
        })()}
      </nav>

      {/* ─── MAIN HUB ─── */}
      <div className="mx-auto max-w-full px-4 py-8">
        
        <main className="pb-24 min-h-[60vh]">
          {renderContent()}
        </main>
      </div>

      {/* ─── TAB BAR (MULTI-WINDOW) ─── */}
      {(windows.length > 0 || !activeTab.includes('planning')) && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-[400] flex items-center px-6 gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] no-print">
          <button 
            onClick={() => { setActiveTab('planning'); switchTab(null); }}
            className={`flex items-center gap-2.5 px-5 h-10 rounded-2xl text-[12px] font-black transition-all border ${
              activeTab === 'planning' && !activeWindowId 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-primary/30 hover:text-primary'
            }`}
          >
            <i className="fa-solid fa-calendar-alt text-[12px]" />
            <span>Planning</span>
          </button>
          
          <div className="w-[1px] h-6 bg-slate-200 mx-2" />

          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {windows.map(win => (
              <div 
                key={win.id}
                onClick={() => switchTab(win.id)}
                className={`group flex items-center gap-2.5 px-4 h-10 rounded-2xl text-[12px] font-black tracking-widest transition-all border cursor-pointer shrink-0 ${
                  activeWindowId === win.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-slate-300'
                }`}
              >
                <i className={`fa-solid ${win.icon} text-[11px]`} />
                <span>{win.title}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4 border-l border-slate-200 pl-6 ml-4">
             <div className="text-right">
                <div className="text-[9px] font-semibold text-slate-400 leading-none mb-1">Raccourcis</div>
                <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] text-slate-600">
                   <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">F1</span> Aide
                   <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 ml-1">Esc</span> Fermer
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ─── SIDE MODAL ─── */}
      <SidebarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        footer={
          <>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-semibold text-[12px] transition-all" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button id="saveBtn" className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold text-[12px] shadow-lg shadow-primary/20 transition-all" onClick={() => { setIsModalOpen(false); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Données enregistrées · Paramètres mis à jour' } })); }}>Enregistrer</button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
             <Hotel className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-loose">Formulaire dynamique<br/>en cours de rendu v2.3</p>
          </div>
          <div className="space-y-4 px-2">
             {[1,2,3].map(i => (
               <div key={i} className="h-4 bg-slate-50 rounded-full w-full animate-pulse" style={{ animationDelay: `${i*100}ms` }} />
             ))}
          </div>
        </div>
      </SidebarModal>

      <style>{`
        ::-webkit-scrollbar { width: 0px; height: 0px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .scrollbar-hide::-webkit-scrollbar { width: 0; }
        
        main table th:first-child { border-top-left-radius: 1.5rem; }
        main table th:last-child { border-top-right-radius: 1.5rem; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media print {
          header, nav, aside, button, .no-print { display: none !important; }
          .min-h-screen { background: white !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      {/* ─── GLOBAL UTILITIES ─── */}
      <KeyboardShortcuts onAction={handleAction} />
      
      <DatePickerModal 
        isOpen={isDatePickerOpen} 
        onClose={() => setIsDatePickerOpen(false)} 
        onSelect={(date) => window.dispatchEvent(new CustomEvent('planning-goto-date', { detail: date }))} 
      />

      <HelpShortcutsModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

      {/* ─── TOASTS ─── */}
      <div className="fixed top-20 right-5 z-[1000] flex flex-col gap-2 pointer-events-none" style={{ width: 320 }}>
        <AnimatePresence>
          {toasts.map(t => {
            // Détecter le type depuis le message pour choisir l'icône/couleur
            const isError   = /erreur|error|échoué|failed|impossible/i.test(t.msg);
            const isWarn    = /solde|impayé|attention|avertissement|alerte/i.test(t.msg);
            const isSuccess = !isError && !isWarn;
            const accent  = isError ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981';
            const iconBg  = isError ? '#FEF2F2' : isWarn ? '#FFF7ED' : '#ECFDF5';
            const icon    = isError ? '❌' : isWarn ? '⚠️' : '✅';
            // Séparer titre / sous-titre si le message contient " · "
            const [title, ...subs] = t.msg.split(' · ');
            const sub = subs.join(' · ');
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 32, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 32, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto"
                style={{
                  background: 'white',
                  borderRadius: 16,
                  borderLeft: `3px solid ${accent}`,
                  boxShadow: '0 8px 40px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.04)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* Icône */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                }}>
                  {icon}
                </div>
                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>
                    {title}
                  </div>
                  {sub && (
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub}
                    </div>
                  )}
                </div>
                {/* Barre de progression */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 3, ease: 'linear' }}
                  style={{
                    position: 'absolute', bottom: 0, left: 3, right: 0,
                    height: 2, background: accent, borderRadius: '0 0 16px 0',
                    transformOrigin: 'left',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ReservationDetailPanel 
        reservationId={selectedResaId} 
        onClose={() => setSelectedResaId(null)} 
      />
    </div>
  );
}
