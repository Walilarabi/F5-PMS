import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Eye,
  EyeOff,
  Plus,
  Table,
  Circle,
  Square,
  X,
  CreditCard,
  User,
  Clock,
  ArrowRight,
  RefreshCw,
  Trash2,
  TrendingUp,
  Home,
  DollarSign,
  Zap,
  Sparkles,
  Bath,
  Activity,
  LogIn,
  LogOut,
  Upload,
  Layers,
  LayoutGrid,
  Edit2,
  Check,
  Link,
  Mail,
  FileText,
  Printer,
  ArrowLeftRight,
  MessageCircle,
  AtSign,
  Phone,
  Tag,
  Crown,
  Bolt,
  Heart,
  Flag,
  ChevronDown,
  Keyboard,
  Target,
  Users,
  XCircle,
  CheckCircle2,
  Percent,
  Briefcase,
  Building,
  Globe,
  History,
  DoorOpen,
  Info,
  Smartphone,
  Baby,
  Coffee,
  Hash,
  StickyNote,
  ShieldCheck,
  Building2,
  Receipt,
  AlertTriangle,
  Star,
  Send,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CHANNELS } from '../constants/channels';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { CheckoutModal } from './CheckoutModal';
import { CheckinModal } from './CheckinModal';
import { getReservationStyle, adjustColor, getContrastColor } from '../lib/colorUtils';

interface Event {
  id: string;
  name: string;
  location: string;
  start: string;
  end: string;
  impact: 'Faible' | 'Moyen' | 'Elevé';
  description: string;
  source: string;
}

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
// Fix timezone : toISOString() retourne UTC ce qui peut donner J-1 ou J+1 selon la timezone locale
const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const CHANNEL_COLORS: Record<string, string> = CHANNELS.reduce((acc, c) => ({ ...acc, [c.name]: c.color }), {});

const getReservationColor = (channel: string) => CHANNEL_COLORS[channel] || '#e2e8f0';

import { ReservationDetailPanel } from './ReservationDetailPanel';
import ReservationFormModal from './ReservationFormModal';
import { SourceLogo } from './SourceLogo';

const CATEGORY_LEVELS: Record<string, number> = {
  "Single": 1,
  "Double": 2,
  "Suite": 3
};

const getCategoryLevel = (category: string) => CATEGORY_LEVELS[category] || 0;

const RATE_PLANS = [
  { partenaire: "Booking.com", typeChambre: "Double", pension: "RO", annulation: "flexible", prix: 99, plan: "RACK-RO-FLEX" },
  { partenaire: "Booking.com", typeChambre: "Double", pension: "RO", annulation: "non_remboursable", prix: 89, plan: "RACK-RO-NANR" },
  { partenaire: "Booking.com", typeChambre: "Double", pension: "BB", annulation: "flexible", prix: 115, plan: "OTA-BB-FLEX-2P" },
  { partenaire: "Expedia", typeChambre: "Double", pension: "RO", annulation: "flexible", prix: 105, plan: "EXP-RO-FLEX" },
  { partenaire: "Expedia", typeChambre: "Double", pension: "BB", annulation: "flexible", prix: 125, plan: "EXP-BB-FLEX-2P" },
  { partenaire: "Direct", typeChambre: "Double", pension: "RO", annulation: "flexible", prix: 120, plan: "DIRECT-RO-FLEX" },
  { partenaire: "Agoda", typeChambre: "Double", pension: "RO", annulation: "flexible", prix: 95, plan: "AGD-RO-FLEX" },
  { partenaire: "Airbnb", typeChambre: "Double", pension: "RO", annulation: "flexible", prix: 130, plan: "ABB-RO-FLEX" },
  { partenaire: "Direct", typeChambre: "Single", pension: "RO", annulation: "flexible", prix: 85, plan: "DIRECT-SGL-FLEX" },
  { partenaire: "Direct", typeChambre: "Suite", pension: "RO", annulation: "flexible", prix: 280, plan: "DIRECT-SUI-FLEX" },
];

const KPICard = ({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon?: any }) => (
  <div className="bg-white rounded-[18px] p-3 border border-slate-200 shadow-sm relative overflow-hidden group flex-1">
    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start">
      <span className="text-[8px] font-black tracking-widest text-slate-400 capitalize">{label}</span>
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-300 transition-colors" />}
    </div>
    <div className="text-xl font-black text-slate-800 mt-1">{value}</div>
  </div>
);

interface PlanningProps {
  rooms: any[];
  reservations: any[];
  clients: any[];
  roomStatusesState: Record<string, string>;
  setRoomStatusesState: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  housekeepingTasks: any[];
  setHousekeepingTasks: React.Dispatch<React.SetStateAction<any[]>>;
  onAddReservation?: (res: any) => void;
  onUpdateReservation?: (res: any) => void;
  onFinalizeCheckout?: (roomId: string, reservationId: string, paymentData: any) => void;
  setActiveTab?: (tab: string) => void;
  onOpenWindow?: (title: string, type: string, data: any, icon: string) => void;
  selectedResaId: string | null;
  setSelectedResaId: (id: string | null) => void;
}

export const Planning: React.FC<PlanningProps> = ({ 
  rooms, 
  reservations, 
  clients, 
  roomStatusesState,
  setRoomStatusesState,
  housekeepingTasks,
  setHousekeepingTasks,
  onAddReservation, 
  onUpdateReservation, 
  onFinalizeCheckout,
  setActiveTab,
  onOpenWindow,
  selectedResaId,
  setSelectedResaId
}) => {
  type RoomStatusType = 'occupee' | 'propre' | 'encours' | 'sale' | 'hors-service';

  // Simulated cleanliness/occupancy status
  const roomStatuses: Record<string, RoomStatusType> = {
    "101": 'occupee', "102": 'sale', "103": 'propre', "104": 'encours', "201": 'sale', 
    "202": 'propre', "203": 'occupee', "204": 'hors-service', "301": 'propre', "302": 'encours',
    "401": 'occupee', "402": 'propre', "403": 'sale', "501": 'hors-service'
  };

  const [viewDays, setViewDays] = useState(30);
  const [viewType, setViewType] = useState<'planner' | 'calendar'>('planner');
  const [baseDate, setBaseDate] = useState(() => {
    // Fix timezone : construire la date depuis les composantes locales
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [canalFilter, setCanalFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState<string | number>('all');
  const [isFloorDropdownOpen, setIsFloorDropdownOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isKPIVisible, setIsKPIVisible] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [channelColors, setChannelColors] = useState<Record<string, string>>(CHANNEL_COLORS);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedResaTab, setSelectedResaTab] = useState<'reservation' | 'facturation' | 'cardex' | 'incidents_tab' | 'lost_tab' | 'reviews_tab'>('reservation');
  const [billingLines] = useState<any[]>([
    { id: 1, date: '2024-04-15', qty: 1, description: 'Chambre 101 - Nuitée', pu_ht: 120, tva: 10, total_ttc: 132 },
    { id: 3, date: '2024-04-15', qty: 2, description: 'Petit-déjeuner Buffet', pu_ht: 15, tva: 10, total_ttc: 33 }
  ]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const searchLower = searchTerm.toLowerCase();
      
      // 1. Filter by basic room info
      const matchesRoom = 
        room.num.toString().toLowerCase().includes(searchLower) ||
        room.type.toLowerCase().includes(searchLower);
      
      if (matchesRoom && searchTerm) return true;

      // 2. Filter by linked reservations/clients
      const roomReservations = reservations.filter(res => res.room === room.num);
      const matchesResa = roomReservations.some(res => {
        const client = clients.find(c => c.id === res.clientId);
        const guestName = client?.name || res.guestName || "";
        const checkin = res.checkin || "";
        const checkout = res.checkout || "";
        const datesText = res.dates || "";

        return guestName.toLowerCase().includes(searchLower) ||
               checkin.toLowerCase().includes(searchLower) ||
               checkout.toLowerCase().includes(searchLower) ||
               datesText.toLowerCase().includes(searchLower);
      });

      if (matchesResa && searchTerm) return true;

      // 3. Combined type and floor filters
      const matchesType = !typeFilter || room.type === typeFilter;
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter;

      if (!searchTerm) {
        return matchesType && matchesFloor;
      }

      return (matchesRoom || matchesResa) && matchesType && matchesFloor;
    });
  }, [rooms, reservations, clients, searchTerm, typeFilter, floorFilter]);

  
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutRoomId, setCheckoutRoomId] = useState('');
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinResId, setCheckinResId] = useState('');


  const printInvoice = (roomNum: string) => {
    console.log('Simulation impression facture chambre', roomNum);
  };

  const sendEmail = () => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Email envoyé · Confirmation de réservation transmise' } }));
  };

  const arrivalsToday = useMemo(() => 
    reservations.filter(res => res.checkin === TODAY && res.status !== 'checked_in' && res.status !== 'checked_out'),
    [reservations]
  );

  const departuresToday = useMemo(() => 
    reservations.filter(res => res.checkout === TODAY && res.status === 'checked_in'),
    [reservations]
  );

  const handleFinalizeCheckin = (data: any) => {
    const resa = reservations.find(r => r.id === checkinResId);
    
    // Update room status
    setRoomStatusesState(prev => ({
      ...prev,
      [data.roomId]: 'occupee'
    }));

    // Update reservation status if it exists, or handle if needed
    if (resa && onUpdateReservation) {
      onUpdateReservation({ 
        ...resa, 
        status: 'checked_in', 
        room: data.roomId,
        paymentStatus: data.paymentStatus,
        remarks: data.notes
      });
    }

    setIsCheckinModalOpen(false);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Check-in validé · ${data.guestName} · Ch. ${data.roomId}` } }));
  };
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [overlapSelection, setOverlapSelection] = useState<{
    resas: any[];
    date: string;
    room: string;
  } | null>(null);

  const [draggedResaId, setDraggedResaId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ room: string; date: string } | null>(null);
  const [upgradeRequest, setUpgradeRequest] = useState<{ resa: any; targetRoom: any } | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: Event; x: number; y: number } | null>(null);

  const [eventOverlapSelection, setEventOverlapSelection] = useState<{
    events: Event[];
    date: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollThumbWidth, setScrollThumbWidth] = useState(20);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const progress = scrollWidth > clientWidth ? (scrollLeft / (scrollWidth - clientWidth)) * 100 : 0;
      setScrollProgress(progress);
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const initialScroll = scrollRef.current?.scrollLeft || 0;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (scrollRef.current && trackRef.current) {
        const deltaX = moveEvent.pageX - startX;
        const { scrollWidth, clientWidth } = scrollRef.current;
        const trackWidth = trackRef.current.clientWidth;
        const scrollAmount = (deltaX / trackWidth) * scrollWidth;
        scrollRef.current.scrollLeft = initialScroll + scrollAmount;
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    const handleCloseAll = () => {
      setIsBookingModalOpen(false);
      setIsHelpModalOpen(false);
      setSelectedResaId(null);
      setIsEventModalOpen(false);
      setOverlapSelection(null);
      setEventOverlapSelection(null);
    };

    const handlePrev = () => setBaseDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - viewDays); return d; });
    const handleNext = () => setBaseDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + viewDays); return d; });
    const handleToday = () => { const now = new Date(); setBaseDate(new Date(now.getFullYear(), now.getMonth(), now.getDate())); };
    const handleGotoDate = (e: any) => {
      if (e.detail instanceof Date) setBaseDate(e.detail);
    };
    const handleView = (e: any) => {
      const days = e.detail === 'week' ? 7 : (e.detail === '15days' ? 15 : 30);
      setViewDays(days);
    };
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
    const handleFocusSearch = () => searchInputRef.current?.focus();
    const handleNewReservation = () => {
      setNewResForm({
        ...newResForm,
        guestName: '',
        email: '',
        phone: '',
        adults: 2,
        children: 0,
        company: '',
        checkIn: TODAY,
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        category: '',
        roomNumber: '',
        board: '',
        rateType: '',
        ratePlan: '',
        ratePerNight: 0,
        channel: '',
        vatRate: 10,
        notes: '',
        linkType: 'Acompte 30%',
        processor: 'Stripe',
        sendConfirmation: true
      });
      setIsBookingModalOpen(true);
    };
    const handleEditSelected = () => {
      if (selectedResaId) {
        // Just trigger the detail panel opening (state is already set)
        console.log(`Editing reservation ${selectedResaId}`);
      } else {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Aucune réservation sélectionnée · Cliquez sur une réservation' } }));
      }
    };
    const handleCancelResa = () => {
      if (selectedResaId) {
        if ((window as any).__flowtymConfirm ? (window as any).__flowtymConfirm(`Annuler la réservation ${selectedResaId} ?`) : true) {
          window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Réservation annulée · ${selectedResaId}` } }));
          setSelectedResaId(null);
        }
      }
    };

    window.addEventListener('close-all-modals', handleCloseAll);
    window.addEventListener('planning-prev', handlePrev);
    window.addEventListener('planning-next', handleNext);
    window.addEventListener('planning-today', handleToday);
    window.addEventListener('planning-goto-date', handleGotoDate);
    window.addEventListener('planning-view', handleView);
    window.addEventListener('zoom-in', handleZoomIn);
    window.addEventListener('zoom-out', handleZoomOut);
    window.addEventListener('focus-search', handleFocusSearch);
    window.addEventListener('new-reservation', handleNewReservation);
    window.addEventListener('edit-selected', handleEditSelected);
    window.addEventListener('cancel-selected', handleCancelResa);

    return () => {
      window.removeEventListener('close-all-modals', handleCloseAll);
      window.removeEventListener('planning-prev', handlePrev);
      window.removeEventListener('planning-next', handleNext);
      window.removeEventListener('planning-today', handleToday);
      window.removeEventListener('planning-goto-date', handleGotoDate);
      window.removeEventListener('planning-view', handleView);
      window.removeEventListener('zoom-in', handleZoomIn);
      window.removeEventListener('zoom-out', handleZoomOut);
      window.removeEventListener('focus-search', handleFocusSearch);
      window.removeEventListener('new-reservation', handleNewReservation);
      window.removeEventListener('edit-selected', handleEditSelected);
      window.removeEventListener('cancel-selected', handleCancelResa);
    };
  }, [viewDays, selectedResaId]);

  useEffect(() => {
    const updateThumb = () => {
      if (scrollRef.current) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        const width = scrollWidth > 0 ? Math.max(10, (clientWidth / scrollWidth) * 100) : 100;
        setScrollThumbWidth(width);
      }
    };
    updateThumb();
    window.addEventListener('resize', updateThumb);
    return () => window.removeEventListener('resize', updateThumb);
  }, []);

  const [newResForm, setNewResForm] = useState({
    guestName: '',
    email: '',
    phone: '',
    adults: 2,
    children: 0,
    company: '',
    checkIn: TODAY,
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    category: '',
    roomNumber: '',
    board: '',
    rateType: '',
    ratePlan: '',
    ratePerNight: 0,
    channel: '',
    vatRate: 10,
    paymentMode: 'Carte bancaire',
    paymentStatus: 'En attente',
    guaranteeType: 'aucune',
    notes: '',
    linkType: 'Acompte 30%',
    processor: 'Stripe',
    linkValidity: 48,
    sendConfirmation: true
  });

  useEffect(() => {
    if (newResForm.channel && newResForm.category && newResForm.board && newResForm.rateType) {
      const matchingPlan = RATE_PLANS.find(p => 
        p.partenaire === newResForm.channel && 
        p.typeChambre === (newResForm.category === 'Double Classique' ? 'Double' : newResForm.category) && 
        (p.pension === (newResForm.board === 'Room Only' ? 'RO' : newResForm.board === 'Petit-déjeuner' ? 'BB' : newResForm.board === 'Demi-pension' ? 'HB' : newResForm.board)) && 
        (p.annulation === (newResForm.rateType === 'Flexible' ? 'flexible' : newResForm.rateType === 'Non-Remboursable' ? 'non_remboursable' : newResForm.rateType))
      );
      
      if (matchingPlan) {
        setNewResForm(prev => ({
          ...prev,
          ratePlan: matchingPlan.plan,
          ratePerNight: matchingPlan.prix
        }));
      } else {
        setNewResForm(prev => ({
          ...prev,
          ratePlan: 'Aucun plan trouvé',
          ratePerNight: 0
        }));
      }
    }
  }, [newResForm.channel, newResForm.category, newResForm.board, newResForm.rateType]);

  const handleResaDrop = (targetRoom: string, targetDate: string) => {
    if (!draggedResaId) return;
    
    const resa = reservations.find(r => r.id === draggedResaId);
    if (!resa) return;

    // RULE: Drag and drop only allowed on same check-in date
    if (targetDate !== resa.checkin) {
      alert("⚠️ Le changement de dates n'est pas autorisé via glisser-déposer.\nCette option doit être faite via la modification de la réservation.");
      setDraggedResaId(null);
      setDragOverCell(null);
      return;
    }

    const currentRoom = rooms.find(r => r.num === resa.room);
    const targetRoomObj = rooms.find(r => r.num === targetRoom);

    // RULE: Check category change
    if (currentRoom && targetRoomObj && currentRoom.type !== targetRoomObj.type) {
      setUpgradeRequest({ resa, targetRoom: targetRoomObj });
      return;
    }

    // Standard drop (same category, same date)
    const updatedResa = {
      ...resa,
      room: targetRoom
    };

    if (onUpdateReservation) {
      onUpdateReservation(updatedResa);
    }
    setDraggedResaId(null);
    setDragOverCell(null);
  };

  const confirmUpgrade = (facturer: boolean) => {
    if (!upgradeRequest) return;
    const { resa, targetRoom } = upgradeRequest;

    const updatedResa = {
      ...resa,
      room: targetRoom.num,
      notes: facturer ? (resa.notes || '') + '\n[AUTO] Surclassement facturé.' : resa.notes
    };

    if (onUpdateReservation) {
      onUpdateReservation(updatedResa);
    }
    setUpgradeRequest(null);
    setDraggedResaId(null);
    setDragOverCell(null);
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
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Mode Masculine (Hiver)',
      location: 'Paris Centre',
      start: '2026-01-20',
      end: '2026-01-25',
      impact: 'Moyen',
      description: 'Semaine de la mode Homme (Fashion Week).',
      source: 'fhcm.paris'
    }
  ]);

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    location: '',
    start: TODAY,
    end: TODAY,
    impact: 'Moyen',
    description: '',
    source: ''
  });

  const selectedResa = reservations.find(r => r.id === selectedResaId);
  const selectedClient = selectedResa ? clients.find(c => c.id === selectedResa.clientId) : null;

  const roomTypes = [...new Set(rooms.map(r => r.type))];

  const statusConfig: Record<RoomStatusType, { label: string, bg: string, border: string, text: string, icon: React.ElementType }> = {
    occupee: { label: 'Occupée', bg: '#eff6ff', border: '#60a5fa', text: '#1e3a8a', icon: User },
    propre: { label: 'Propre / Libre', bg: '#ecfdf5', border: '#34d399', text: '#065f46', icon: Sparkles },
    encours: { label: 'En cours', bg: '#fffbeb', border: '#fbbf24', text: '#92400e', icon: Clock },
    sale: { label: 'À nettoyer', bg: '#fef2f2', border: '#f87171', text: '#991b1b', icon: Bath },
    'hors-service': { label: 'Hors service', bg: '#f8fafc', border: '#94a3b8', text: '#475569', icon: X }
  };

  const canalStats = [
    { label: 'Direct', color: '#8B5CF6', count: reservations.filter(r => r.canal === 'Direct').length },
    { label: 'Booking', color: '#003580', count: reservations.filter(r => r.canal === 'Booking' || r.canal === 'Booking.com').length },
    { label: 'Expedia', color: '#f59e0b', count: reservations.filter(r => r.canal === 'Expedia').length },
    { label: 'Airbnb', color: '#ff5a5f', count: reservations.filter(r => r.canal === 'Airbnb').length },
  ];
  const totalCanal = canalStats.reduce((acc, c) => acc + c.count, 0);

  const dates = Array.from({ length: viewDays }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const periodLabel = viewType === 'calendar' 
    ? baseDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()
    : `${dates[0].toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} → ${dates[dates.length - 1].toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const getReservationsForRoom = (roomNum: string, dateStr: string) => {
    return reservations.filter(r => {
       if (r.status === 'Annulee') return false;
       return r.room === roomNum && r.checkin <= dateStr && r.checkout > dateStr;
    });
  };

  return (
    <div className="space-y-4">
      {/* ─── KPI HEADER — 3 cartes groupées ─── */}
      <AnimatePresence>
        {isKPIVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="flex gap-3 overflow-hidden"
          >
            {/* Carte 1 — Performance revenue */}
            <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm overflow-hidden flex-1">
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#8B5CF6,#6D28D9)' }} />
              <div className="px-3 pt-2 pb-1">
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Revenue</span>
              </div>
              <div className="flex divide-x divide-slate-100">
                {[
                  { label: 'TO%', value: '78%', color: '#8B5CF6', icon: TrendingUp },
                  { label: 'ADR', value: '142€', color: '#10b981', icon: DollarSign },
                  { label: 'RevPAR', value: '111€', color: '#3b82f6', icon: Activity },
                ].map(k => (
                  <div key={k.label} className="flex-1 px-3 pb-3 pt-1 group">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.label}</span>
                      <k.icon className="w-3 h-3 text-slate-200 group-hover:text-slate-300 transition-colors" />
                    </div>
                    <div className="text-lg font-black" style={{ color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carte 2 — Occupation */}
            <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm overflow-hidden flex-1">
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#6366f1,#ef4444)' }} />
              <div className="px-3 pt-2 pb-1">
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Occupation</span>
              </div>
              <div className="flex divide-x divide-slate-100">
                {[
                  { label: 'Ch. Libres', value: '12/48', color: '#f59e0b', icon: Home },
                  { label: 'Arrivées',   value: '8',      color: '#6366f1', icon: LogIn },
                  { label: 'Départs',    value: '14',     color: '#ef4444', icon: LogOut },
                ].map(k => (
                  <div key={k.label} className="flex-1 px-3 pb-3 pt-1 group">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{k.label}</span>
                      <k.icon className="w-3 h-3 text-slate-200 group-hover:text-slate-300 transition-colors" />
                    </div>
                    <div className="text-lg font-black" style={{ color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carte 3 — Canaux */}
            <div className="bg-white rounded-[18px] border border-slate-200 shadow-sm overflow-hidden flex-1 min-w-[160px]">
              <div className="h-1 w-full bg-slate-100" />
              <div className="px-3 pt-2 pb-1">
                <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Canaux de résa</span>
              </div>
              <div className="px-3 pb-3 space-y-1.5">
                {canalStats.map(c => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-[8px] font-black text-slate-500 capitalize tracking-tighter">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full rounded-full" style={{ backgroundColor: c.color, width: `${totalCanal ? (c.count / totalCanal) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-slate-800 w-3 text-right">{c.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CONTROLS & FILTERS ─── */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
           {[7, 15, 30].map(d => (
             <button 
               key={d}
               data-view={d === 7 ? 'week' : d === 15 ? '15days' : 'month'}
               disabled={viewType === 'calendar'}
               onClick={() => {
                 if (d === 30) {
                   // Vue Mois : partir de aujourd'hui, 30 jours glissants
                   const today = new Date();
                   today.setHours(0, 0, 0, 0);
                   setBaseDate(today);
                   setViewDays(30);
                 } else {
                   setViewDays(d);
                 }
               }}
               className={`px-4 py-1.5 rounded-lg text-[11px] font-black capitalize tracking-widest transition-all ${(d === 30 ? viewDays >= 28 : viewDays === d) ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${viewType === 'calendar' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {d === 7 ? 'Semaine' : d === 15 ? '15J' : 'Mois'}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
           {[
             { id: 'planner', icon: LayoutGrid, label: 'Gantt' },
             { id: 'calendar', icon: Calendar, label: 'Calendrier' }
           ].map(v => (
             <button 
               key={v.id}
               onClick={() => setViewType(v.id as any)}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black capitalize tracking-widest transition-all ${viewType === v.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <v.icon className="w-3 h-3" />
               <span className="hidden sm:inline">{v.label}</span>
             </button>
           ))}
        </div>

        <div className="flex items-center gap-1">
          <button 
            id="prevBtn"
            onClick={() => {
              const d = new Date(baseDate);
              if (viewType === 'calendar') {
                d.setMonth(d.getMonth() - 1);
              } else {
                // Toutes les vues : reculer de viewDays jours
                d.setDate(d.getDate() - viewDays);
              }
              setBaseDate(d);
            }} 
            className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            id="todayBtn"
            onClick={() => setBaseDate(new Date())} 
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Aujourd'hui"
          >
            <Target className="w-4 h-4" />
          </button>
          <button 
            id="nextBtn"
            onClick={() => {
              const d = new Date(baseDate);
              if (viewType === 'calendar') {
                d.setMonth(d.getMonth() + 1);
              } else {
                // Toutes les vues : avancer de viewDays jours
                d.setDate(d.getDate() + viewDays);
              }
              setBaseDate(d);
            }} 
            className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="relative flex items-center gap-2 ml-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600">
               <Calendar className="w-3 h-3 text-primary" />
               <input 
                 type="date" 
                 value={baseDate.toISOString().slice(0, 10)}
                 onChange={(e) => setBaseDate(new Date(e.target.value))}
                 className="bg-transparent outline-none border-none cursor-pointer"
               />
            </div>
            <div className="text-[11px] font-black text-blue-600 tracking-tight bg-blue-50/50 px-4 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 shadow-sm">
              <RefreshCw className="w-3 h-3 animate-spin-slow" />
              {periodLabel}
            </div>
          </div>
        </div>

          <button 
            onClick={() => setIsColorModalOpen(true)}
            className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" />

        <div className="flex-1 flex items-center gap-2 min-w-[300px] justify-end">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
              <input 
                ref={searchInputRef}
                placeholder="Nom, chambre, dates..." 
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

          <select 
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[9px] font-black capitalize tracking-tight text-slate-500 outline-none hover:border-slate-200 focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all cursor-pointer"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">Tous types</option>
            <option value="Double">Double</option>
            <option value="Single">Single</option>
            <option value="Suite">Suite</option>
          </select>

          <select 
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[9px] font-black tracking-tight text-slate-500 outline-none hover:border-slate-200 transition-colors cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tous Statuts</option>
            <option value="Confirmee">Confirmée</option>
            <option value="Option">Option</option>
            <option value="Checking">Arrivé</option>
            <option value="Checkout">Parti</option>
          </select>

          <select 
            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[9px] font-black tracking-tight text-slate-500 outline-none hover:border-slate-200 transition-colors cursor-pointer"
            value={canalFilter}
            onChange={e => setCanalFilter(e.target.value)}
          >
            <option value="">Tous Canaux</option>
            <option value="Direct">Direct</option>
            <option value="Booking">Booking.com</option>
            <option value="Expedia">Expedia</option>
            <option value="Airbnb">Airbnb</option>
          </select>

          <button 
            onClick={() => setIsKPIVisible(!isKPIVisible)}
            className={`p-2 rounded-lg border transition-all ${isKPIVisible ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            title={isKPIVisible ? "Masquer KPIs" : "Afficher KPIs"}
          >
            {isKPIVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className={`p-2 rounded-lg border transition-all ${isSidebarVisible ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
            title={isSidebarVisible ? "Masquer Liste Chambres" : "Afficher Liste Chambres"}
          >
            <Table className="w-4 h-4" />
          </button>

          <button 
            onClick={() => {
              setNewResForm({
                ...newResForm,
                guestName: '',
                email: '',
                phone: '',
                checkIn: TODAY,
                checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                roomNumber: ''
              });
              setIsBookingModalOpen(true);
            }}
            id="newReservationBtn"
            className="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/30 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ─── LEGENDS ─── */}
      <div className="flex items-center justify-between px-4">
         <div className="flex items-center gap-6">
            {[
              { label: 'Direct', color: '#8B5CF6' },
              { label: 'Booking', color: '#003580' },
              { label: 'Expedia', color: '#f59e0b' },
              { label: 'Airbnb', color: '#ff5a5f' },
              { label: 'Walk-in', color: '#10b981' },
            ].map((lg, i) => (
              <div key={i} className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: lg.color }} />
                 <span className="text-[10px] font-bold text-slate-500">{lg.label}</span>
              </div>
            ))}
         </div>

         <div className="flex items-center gap-6">
            {[
               { label: 'Arrivée', color: '#10b981', icon: 'circle' },
               { label: 'Séjour', color: '#3b82f6', icon: 'outline' },
               { label: 'Départ', color: '#f59e0b', icon: 'circle' },
               { label: 'Fictive', color: '#6366f1', icon: 'diamond' },
            ].map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                 {st.icon === 'circle' ? (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                 ) : st.icon === 'outline' ? (
                    <div className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: st.color }} />
                 ) : (
                    <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: st.color }} />
                 )}
                 <span className="text-[10px] font-bold text-slate-500">{st.label}</span>
              </div>
            ))}
         </div>
      </div>

      {/* ─── GRID & SIDEBAR ─── */}
      <div className="flex gap-4 items-start h-[calc(100vh-180px)] planning-wrapper">
        {/* MAIN PLANNING AREA */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
          {viewType === 'planner' ? (
            <>
              <div 
                 className="flex-1 overflow-auto no-scrollbar scroll-smooth planning-body-scroll pb-10" 
                 ref={scrollRef}
                 onScroll={handleScroll}
              >
              <table 
                className="w-full border-collapse transition-all duration-300 origin-top-left"
                style={{ 
                  tableLayout: viewDays >= 30 ? 'fixed' : 'auto',
                  width: '100%',
                  minWidth: viewDays === 7
                    ? '100%'
                    : viewDays === 15
                    ? `${Math.max(viewDays * 64, 800)}px`
                    : '100%',
                  transform: `scale(${zoomLevel})`
                }}
              >
               <thead className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
              {/* ─── TOP STATS ROWS ─── */}
              <tr className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <td className="sticky left-0 z-40 bg-[#f4f6fa] border-r border-slate-200 px-4 py-2 font-black text-[9px] text-slate-500 tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary opacity-60" />
                      <span>TO %</span>
                    </div>
                </td>
                {dates.map((d, i) => {
                  const occupied = rooms.filter(room => getReservationsForRoom(room.num, formatDate(d)).length > 0).length;
                  const occupancy = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;
                  return (
                    <td key={i} className="text-center font-medium border-r border-slate-100 py-2 bg-white" style={{ color: '#10b981', fontSize: '0.72rem' }}>
                        {occupancy}%
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-white border-b border-slate-100 sticky top-[33px] z-30">
                <td className="sticky left-0 z-40 bg-[#f4f6fa] border-r border-slate-200 px-4 py-2 font-black text-[9px] text-slate-500 tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-primary opacity-60" />
                      <span>Ch. libres</span>
                    </div>
                </td>
                {dates.map((d, i) => {
                  const occupied = rooms.filter(room => getReservationsForRoom(room.num, formatDate(d)).length > 0).length;
                  const available = rooms.length - occupied;
                  return (
                    <td key={i} className="text-center font-medium border-r border-slate-100 py-2 bg-white" style={{ color: '#3b82f6', fontSize: '0.72rem' }}>
                        {available}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-white border-b border-slate-100 sticky top-[66px] z-30">
                <td className="sticky left-0 z-40 bg-[#f4f6fa] border-r border-slate-200 px-4 py-2 font-black text-[9px] text-slate-500 tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-primary opacity-60" />
                      <span>ADR</span>
                    </div>
                </td>
                {dates.map((_, i) => (
                  <td key={i} className="text-center font-medium border-r border-slate-100 py-2 bg-white" style={{ color: '#8b5cf6', fontSize: '0.72rem' }}>120€</td>
                ))}
              </tr>

            <tr className="bg-white border-b border-slate-100 sticky top-[99px] z-30">
               <td 
                 onClick={() => setIsEventModalOpen(true)}
                 className="sticky left-0 z-40 bg-[#f4f6fa] border-r border-slate-200 px-4 py-2 font-black text-[9px] text-slate-500 tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
               >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary opacity-60" />
                    <span>Événements</span>
                  </div>
               </td>
               {dates.map((d, i) => {
                 const dateStr = formatDate(d);
                 const isToday = dateStr === TODAY;
                 const dayEvents = events.filter(e => e.start <= dateStr && e.end >= dateStr);
                 const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                 
                 const sortedEvents = [...dayEvents].sort((a, b) => {
                   const weight = { 'Elevé': 3, 'Moyen': 2, 'Faible': 1 };
                   return weight[b.impact as keyof typeof weight] - weight[a.impact as keyof typeof weight];
                 });
                 const topEvent = sortedEvents[0];
                 
                 const eventStyles = {
                   'Elevé': { bg: '#fff0f0', border: '#fecaca', text: '#991b1b', bubble: '#ef4444' },
                   'Moyen': { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', bubble: '#f97316' },
                   'Faible': { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', bubble: '#3b82f6' }
                 };
                 const currentStyle = topEvent ? eventStyles[topEvent.impact as keyof typeof eventStyles] : null;

                 return (
                   <td 
                     key={i} 
                     className="px-0.5 py-0.5 border-r border-slate-100 min-h-[32px] relative cursor-pointer hover:bg-slate-50 transition-colors"
                     style={{
                       overflow: 'hidden',
                       backgroundColor: isWeekend ? '#eff6ff' : '#ffffff',
                       fontSize: '0.7rem',
                       ...(viewDays < 30 ? { minWidth: '100px' } : {})
                     }}
                     onMouseEnter={(e) => {
                       if (topEvent) {
                         setHoveredEvent({ event: topEvent, x: e.clientX, y: e.clientY });
                       }
                     }}
                     onMouseLeave={() => setHoveredEvent(null)}
                     onClick={() => {
                       if (dayEvents.length > 1) {
                         setEventOverlapSelection({ events: dayEvents, date: dateStr });
                       } else {
                         setIsEventModalOpen(true);
                       }
                     }}
                   >
                      {topEvent && currentStyle && (
                        <div 
                          className="text-[8px] font-black p-1 rounded border-l-[3px] truncate text-center transition-all shadow-sm"
                          style={{ 
                            backgroundColor: currentStyle.bg, 
                            color: currentStyle.text, 
                            borderColor: currentStyle.border 
                          }}
                        >
                          {topEvent.name}
                        </div>
                      )}
                      {dayEvents.length > 1 && currentStyle && (
                        <div 
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white rounded-full flex items-center justify-center text-[7px] font-black border border-white z-20 shadow-sm"
                          style={{ backgroundColor: currentStyle.bubble }}
                        >
                          +{dayEvents.length - 1}
                        </div>
                      )}
                      {isToday && dayEvents.length === 0 && (
                        <div className="bg-slate-100 text-slate-400 text-[8px] font-black p-1 rounded border border-slate-200 truncate text-center opacity-50">
                          Ménage, Staff
                        </div>
                      )}
                   </td>
                 );
               })}
            </tr>

            <tr className="bg-white border-b border-slate-200 sticky top-[139px] z-30 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]">
              <th className="sticky left-0 z-40 bg-white border-r border-slate-100 px-4 py-2 text-left align-middle"
                style={{ width: '140px', minWidth: '140px' }}>
                 <div className="relative">
                   <div 
                     onClick={() => setIsFloorDropdownOpen(!isFloorDropdownOpen)}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full cursor-pointer hover:bg-slate-100 transition-all group shadow-sm active:scale-95 w-fit"
                   >
                     <Layers className="w-3.5 h-3.5 text-primary" />
                     <span className="text-[10px] font-black text-[#2C2A4A] tracking-tight whitespace-nowrap">
                       {floorFilter === 'all' ? 'Tous' : `Et. ${floorFilter}`}
                     </span>
                     <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${isFloorDropdownOpen ? 'rotate-180' : ''}`} />
                   </div>

                   <AnimatePresence>
                     {isFloorDropdownOpen && (
                       <>
                         <div className="fixed inset-0 z-[500]" onClick={() => setIsFloorDropdownOpen(false)} />
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95, y: 5 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95, y: 5 }}
                           className="absolute top-full left-0 mt-2 min-w-[150px] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[501] overflow-hidden"
                         >
                           <div className="px-4 py-1.5 text-[8px] font-black text-slate-400 border-b border-slate-50 mb-1">Étage</div>
                           <div 
                             onClick={() => { setFloorFilter('all'); setIsFloorDropdownOpen(false); }}
                             className={`px-4 py-2.5 text-[10px] font-black cursor-pointer transition-colors flex items-center justify-between ${floorFilter === 'all' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                           >
                             <span>📍 Tous les étages</span>
                             {floorFilter === 'all' && <Check className="w-3 h-3" />}
                           </div>
                           {[1, 2, 3, 4, 5].map(f => (
                             <div 
                               key={f}
                               onClick={() => { setFloorFilter(f); setIsFloorDropdownOpen(false); }}
                               className={`px-4 py-2.5 text-[10px] font-black cursor-pointer transition-colors flex items-center justify-between ${floorFilter === f ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                             >
                               <span>🏢 Étage {f}</span>
                               {floorFilter === f && <Check className="w-3 h-3" />}
                             </div>
                           ))}
                         </motion.div>
                       </>
                     )}
                   </AnimatePresence>
                 </div>
              </th>
              {dates.map((d, i) => {
                const isToday = formatDate(d) === TODAY;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <th key={i} className={`px-1.5 py-1 text-center border-r border-slate-100 transition-colors bg-white ${isToday ? 'bg-amber-50/20' : isWeekend ? 'bg-blue-50/20' : ''}`}
                    style={{
                      backgroundColor: isToday ? '#fffbeb' : isWeekend ? '#eff6ff' : '#ffffff',
                      ...(viewDays < 30 ? { minWidth: viewDays >= 15 ? '64px' : '100px' } : {}),
                      overflow: 'hidden',
                    }}>
                    <div className="flex flex-col items-center justify-center gap-0.5">
                       <span className={`font-bold tracking-tight ${isToday ? 'text-amber-600' : isWeekend ? 'text-blue-500' : 'text-slate-400'} ${viewDays >= 30 ? 'text-[9px]' : 'text-[10px]'}`}>
                          {DAYS_SHORT[d.getDay()]}
                       </span>
                       <span className={`font-black leading-none ${isToday ? 'text-amber-700' : isWeekend ? 'text-blue-700' : 'text-slate-800'} ${viewDays >= 30 ? 'text-[11px]' : 'text-[13px]'}`}>
                          {d.getDate()}{viewDays < 30 ? ` ${MONTHS_SHORT[d.getMonth()]}` : ''}
                       </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRooms.map((room, idx) => (
              <tr key={room.num} className={`group ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-50/20`}>
                <td className={`sticky left-0 z-10 bg-inherit border-r border-slate-200 px-4 ${idx === 0 ? 'pt-2 pb-1' : 'py-1'} group-hover:bg-slate-50/50 transition-colors`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-black text-slate-800 text-[11px] leading-tight flex items-center gap-1.5">
                      Ch. {room.num}
                    </div>
                    <div 
                      className="w-2 h-2 rounded-full border border-white shadow-sm" 
                      style={{ backgroundColor: statusConfig[roomStatusesState[room.num] || (parseInt(room.num) % 2 === 0 ? 'propre' : 'sale')].border }} 
                      title={statusConfig[roomStatusesState[room.num] || (parseInt(room.num) % 2 === 0 ? 'propre' : 'sale')].label} 
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-black tracking-tighter flex items-center justify-between">
                    <span>{room.type}</span>
                    <span className="text-slate-800 font-black">{room.price}€</span>
                  </div>
                  <div className="text-[7px] font-black text-slate-300 tracking-tighter mt-0.5">
                    Étage {room.floor}
                  </div>
                </td>
                {(() => {
                  const cells = [];
                  let skipCount = 0;
                  
                  for (let i = 0; i < dates.length; i++) {
                    if (skipCount > 0) {
                      skipCount--;
                      continue;
                    }
                    
                    const d = dates[i];
                    const dateStr = formatDate(d);
                    const isToday = dateStr === TODAY;
                    const resas = getReservationsForRoom(room.num, dateStr).filter(r => !canalFilter || r.canal.includes(canalFilter));
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                    // Search for a reservation starting today or continuing from the left edge of the view
                    const startingResa = resas.find(r => r.checkin === dateStr || i === 0);

                    if (startingResa) {
                      let duration = 0;
                      for (let j = i; j < dates.length; j++) {
                        const currentStr = formatDate(dates[j]);
                        if (startingResa.checkin <= currentStr && startingResa.checkout > currentStr) {
                          duration++;
                        } else {
                          break;
                        }
                      }

                      if (duration > 0) {
                        const style = getReservationStyle(channelColors[startingResa.canal] || '#e2e8f0');
                        const isDragging = draggedResaId === startingResa.id;

                        cells.push(
                          <td 
                            key={i} 
                            colSpan={duration}
                            draggable
                            onDragStart={(e) => {
                              setDraggedResaId(startingResa.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedResaId(null);
                              setDragOverCell(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverCell({ room: room.num, date: dateStr });
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleResaDrop(room.num, dateStr);
                            }}
                            className={`p-0.5 border-r border-slate-100 relative h-8 cursor-move hover:shadow-inner transition-all ${isDragging ? 'opacity-40 animate-pulse scale-95 z-50' : ''} ${selectedResaId === startingResa.id ? 'ring-2 ring-primary ring-inset z-20 shadow-lg' : ''} ${isToday ? 'bg-amber-50/30' : isWeekend ? 'bg-blue-50/20' : ''} ${idx === 0 ? 'pt-1.5' : ''}`}
                            style={{ 
                              backgroundColor: style.backgroundColor,
                              borderLeft: style.borderLeft,
                              boxShadow: dragOverCell?.room === room.num && dragOverCell?.date === dateStr ? 'inset 0 0 0 2px #4A1D6D' : (selectedResaId === startingResa.id ? '0 10px 15px -1px rgba(139, 92, 246, 0.4)' : 'none')
                            }}
                            onClick={() => {
                              setSelectedResaId(startingResa.id);
                            }}
                          >
                             <div className="flex flex-col h-full justify-center px-2 py-1">
                                <div className="flex items-center">
                                   {startingResa.checkin === dateStr && (
                                     <i className="fa-solid fa-sign-in-alt text-emerald-500 mr-1.5 text-[10px]" title="Arrivée" />
                                   )}
                                   {startingResa.checkout === (dates[i + duration] ? formatDate(dates[i + duration]) : '') && (
                                     <i className="fa-solid fa-sign-out-alt text-orange-500 mr-1.5 text-[10px]" title="Départ" />
                                   )}
                                   {startingResa.cleaning_requested && startingResa.cleaning_date === dateStr && (
                                     <i className="fa-solid fa-broom text-blue-500 mr-1.5 text-[10px]" title="Ménage" />
                                   )}
                                   <span 
                                     className="text-[9px] font-black truncate"
                                     style={{ color: style.color }}
                                   >
                                   {clients.find(c => c.id === startingResa.clientId)?.name || startingResa.guestName || 'Client inconnu'}
                                   </span>
                                </div>
                                <span 
                                  className="text-[7px] font-bold opacity-60 truncate"
                                  style={{ color: style.color }}
                                >
                                  {startingResa.checkin} → {startingResa.checkout}
                                </span>
                             </div>
                             {resas.length > 1 && (
                               <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[7px] font-black border border-white z-20 shadow-sm">
                                 +{resas.length - 1}
                               </div>
                             )}
                          </td>
                        );
                        skipCount = duration - 1;
                        continue;
                      }
                    }

                    cells.push(
                        <td 
                          key={i} 
                          className={`p-0.5 border-r border-slate-100 relative h-8 cursor-pointer hover:bg-slate-100 transition-all ${isToday ? 'bg-amber-50/30' : isWeekend ? 'bg-blue-50/20' : ''} ${idx === 0 ? 'pt-1.5' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverCell({ room: room.num, date: dateStr });
                        }}
                        onDragEnter={() => setDragOverCell({ room: room.num, date: dateStr })}
                        onDragLeave={() => setDragOverCell(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleResaDrop(room.num, dateStr);
                        }}
                        style={{
                          backgroundColor: dragOverCell?.room === room.num && dragOverCell?.date === dateStr ? 'rgba(74, 29, 109, 0.1)' : undefined,
                          outline: dragOverCell?.room === room.num && dragOverCell?.date === dateStr ? '2px dashed #4A1D6D' : 'none',
                          outlineOffset: '-2px'
                        }}
                        onClick={() => {
                          setNewResForm({
                            ...newResForm,
                            guestName: '',
                            email: '',
                            phone: '',
                            checkIn: dateStr,
                            checkOut: new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0],
                            roomNumber: room.num
                          });
                          setIsBookingModalOpen(true);
                        }}
                      />
                    );
                  }
                  return cells;
                })()}
              </tr>
            ))}

            {/* ─── ROOM TYPE AVAILABILITY ─── */}
            {roomTypes.map(type => (
              <tr key={type} className="bg-slate-50/30 font-semibold italic">
                <td className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 px-4 py-2 text-[10px] text-slate-500">
                   {type}
                </td>
                {dates.map((d, i) => {
                  const isToday = formatDate(d) === TODAY;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const roomsOfType = rooms.filter(r => r.type === type);
                  const occupiedOfType = roomsOfType.filter(room => getReservationsForRoom(room.num, formatDate(d)).length > 0).length;
                  const available = roomsOfType.length - occupiedOfType;
                  return (
                    <td key={i} className={`text-center text-[10px] font-black border-r border-slate-100 py-2 ${isToday ? 'bg-amber-50/30 text-amber-700' : isWeekend ? 'bg-blue-50/20 text-blue-700' : 'text-slate-400'}`}>
                       {available}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CUSTOM HORIZONTAL SCROLLBAR (Visible at the bottom) */}
      <div className="bg-[#f8fafc] border-t border-slate-200 p-4 z-[45] sticky bottom-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] horizontal-scroll-container">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div 
              ref={trackRef}
              className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden group relative cursor-pointer horizontal-scroll-bar"
              onClick={(e) => {
                if (scrollRef.current && trackRef.current) {
                  const rect = trackRef.current.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  scrollRef.current.scrollLeft = percentage * scrollRef.current.scrollWidth - scrollRef.current.clientWidth / 2;
                }
              }}
          >
            <div 
              ref={thumbRef}
              onMouseDown={startDrag}
              className="absolute inset-y-0 h-full bg-[#4A1D6D] hover:bg-[#7B2D8E] rounded-full transition-colors cursor-grab active:cursor-grabbing shadow-sm scroll-thumb" 
              style={{ 
                width: `${scrollThumbWidth}%`,
                left: `${scrollProgress * (1 - scrollThumbWidth / 100)}%`
              }}
            />
          </div>
          
          <div className="w-full flex justify-between mt-3 px-1">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black tracking-widest">Live Sync</span>
                </div>
                <div className="h-3 w-px bg-slate-200 mx-1" />
                <span className="text-[9px] font-black tracking-[2px]">{periodLabel.split('→')[0]}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-[#4A1D6D] tracking-[4px] leading-none mb-1 opacity-60">
                  Planning Horizontal Control
                </div>
                <div className="w-16 h-0.5 bg-primary/10 rounded-full" />
              </div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[9px] font-black tracking-[2px]">{periodLabel.split('→')[1]}</span>
                <div className="h-3 w-px bg-slate-200 mx-1" />
                <div className="flex items-center gap-1.5 text-primary">
                  <Table className="w-3 h-3" />
                  <span className="text-[9px] font-black tracking-widest">{rooms.length} Ch.</span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </>
      ) : (
        <CalendarView 
           baseDate={baseDate}
           reservations={reservations}
           rooms={rooms}
           clients={clients}
           formatDate={formatDate}
           setSelectedResaId={setSelectedResaId}
        />
      )}
    </div>

      {/* RIGHT SIDEBAR - ROOM LIST & PRICES */}
      <AnimatePresence mode="wait">
        {isSidebarVisible && (
          <motion.div 
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 288, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="hidden lg:block flex-shrink-0 space-y-4 overflow-hidden"
          >
            <div className="w-72">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-black tracking-widest text-slate-400">Liste des Chambres</h3>
                    <Table className="w-4 h-4 text-slate-300" />
                 </div>

                 {/* MINI STATUS LEGEND */}
                 <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 border-b border-slate-50 pb-4">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.border }} />
                        <span className="text-[8px] font-black text-slate-400 tracking-tighter">{config.label.split(' / ')[0]}</span>
                      </div>
                    ))}
                 </div>
                 
                <div className="space-y-3">
                    {filteredRooms.map(room => {
                      const statusKey = roomStatusesState[room.num] || (parseInt(room.num) % 2 === 0 ? 'propre' : 'sale');
                      const config = statusConfig[statusKey];
                      const StatusIcon = config.icon;
                      
                      return (
                        <div 
                          key={room.num} 
                          className="flex items-center justify-between p-3 rounded-xl group transition-all border-l-4 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          style={{ 
                            backgroundColor: config.bg, 
                            borderColor: config.border,
                            color: config.text
                          }}
                          onClick={() => {
                            const arrival = formatDate(baseDate);
                            const departure = new Date(baseDate.getTime() + 86400000).toISOString().split('T')[0];
                            setNewResForm({
                              ...newResForm,
                              guestName: '',
                              email: '',
                              phone: '',
                              checkIn: arrival,
                              checkOut: departure,
                              roomNumber: room.num,
                              category: room.type
                            });
                            setIsBookingModalOpen(true);
                          }}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-[11px] font-black shadow-sm border border-white/30 backdrop-blur-sm">
                                 {room.num}
                              </div>
                              <div>
                                <div className="text-[11px] font-black tracking-tight">{room.type}</div>
                                <div className="text-[9px] font-bold flex items-center gap-1.5 opacity-80">
                                   <StatusIcon className="w-2.5 h-2.5" />
                                   <span>{config.label}</span>
                                </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[12px] font-black">{room.price}€</div>
                              <div className="text-[8px] font-bold tracking-widest opacity-60">/ Nuit</div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
      
                 <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 tracking-widest">
                       <span>Total Chambres</span>
                       <span className="text-slate-800">{rooms.length}</span>
                    </div>
                 </div>
              </div>
      
              {/* SMALL STAT CARD */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-4">
                 <div className="text-[9px] font-black text-slate-400 tracking-widest mb-1">Rappel Hygiène</div>
                 <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                   {rooms.filter(r => (roomStatusesState[r.num] || 'propre') === 'sale').length} chambres en attente de ménage.
                 </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
     </div>

     <CheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        reservation={reservations.find(r => r.id === checkinResId)}
        rooms={rooms}
        clients={clients}
        onConfirm={handleFinalizeCheckin}
      />
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        roomId={checkoutRoomId}
        rooms={rooms}
        reservations={reservations}
        clients={clients}
        onFinalize={(rid, resid, pay) => {
          if (onFinalizeCheckout) onFinalizeCheckout(rid, resid, pay);
          setIsCheckoutModalOpen(false);
        }}
      />

      <ReservationFormModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        source="planning"
        availableRooms={rooms.map(r => ({ number: r.num, type: r.type, price: r.price || 99 }))}
        onSave={(data) => {
          if (onAddReservation) {
            onAddReservation({
              guestName: data.guestName,
              email: data.email,
              phone: data.phone,
              nationality: data.nationalityLabel,
              checkin: data.checkIn,
              checkout: data.checkOut,
              room: data.roomNumber,
              nights: data.nights,
              total: data.totalTTC,
              canal: data.channel,
              paymentMode: data.paymentMode,
              paymentStatus: data.paymentStatus,
              guaranteeType: data.guaranteeType,
              guaranteeStatus: data.guaranteeStatus,
              preauthRule: data.preauthRule,
              preauthAmount: data.preauthAmount,
            });
          }
          setIsBookingModalOpen(false);
        }}
      />

      {/* ─── OVERLAP MODAL ─── */}
      <AnimatePresence>
        {eventOverlapSelection && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#2C2A4A]/60 backdrop-blur-sm" 
               onClick={() => setEventOverlapSelection(null)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#2C2A4A] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary-light" strokeWidth={3} />
                  <h3 className="text-sm font-black tracking-tight uppercase">Événements Ville — {eventOverlapSelection.date}</h3>
                </div>
                <button onClick={() => setEventOverlapSelection(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                   <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                 {eventOverlapSelection.events.map(ev => {
                    const style = {
                      'Elevé': { bg: '#fff0f0', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
                      'Moyen': { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#f97316' },
                      'Faible': { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' }
                    }[ev.impact as 'Elevé' | 'Moyen' | 'Faible'] || { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' };

                    return (
                      <div 
                        key={ev.id} 
                        className="p-3 rounded-[20px] border transition-all"
                        style={{ backgroundColor: style.bg, borderColor: style.border }}
                      >
                         <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase" style={{ color: style.text }}>{ev.impact} Impact</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                         </div>
                         <div className="text-xs font-black" style={{ color: style.text }}>{ev.name}</div>
                         <div className="text-[9px] font-bold opacity-70 mt-0.5" style={{ color: style.text }}>{ev.location} • {ev.source}</div>
                         <div 
                           className="mt-2 text-[9px] font-medium leading-relaxed italic border-l-2 pl-2 opacity-60"
                           style={{ color: style.text, borderColor: style.dot }}
                         >
                           {ev.description}
                         </div>
                      </div>
                    );
                 })}
              </div>
            </motion.div>
          </div>
        )}

        {overlapSelection && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
               onClick={() => setOverlapSelection(null)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[450px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                     <Table className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-base font-black tracking-tight uppercase">Conflits / Chevauchements</h3>
                     <p className="text-[9px] font-black opacity-60 uppercase tracking-widest leading-none mt-1">Chambre {overlapSelection.room} - {overlapSelection.date}</p>
                   </div>
                </div>
                <button onClick={() => setOverlapSelection(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                   <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Sparkles className="w-3 h-3 text-amber-500" /> {overlapSelection.resas.length} Réservations trouvées
                </div>

                <div className="space-y-2">
                   {overlapSelection.resas.map(r => {
                     const client = clients.find(c => c.id === r.clientId);
                     const isVip = client?.badges?.vip;
                     const isPrio = client?.badges?.prioritaire;
                     const color = (isVip && isPrio) ? '#ef4444' : (isVip || isPrio) ? '#f59e0b' : '#3b82f6';
                     
                     return (
                       <button 
                         key={r.id}
                         onClick={() => {
                           setSelectedResaId(r.id);
                           setOverlapSelection(null);
                         }}
                         className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary transition-all group hover:bg-white hover:shadow-lg shadow-primary/5"
                       >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: color }}>
                               {isVip && isPrio ? '🔴' : (isVip || isPrio) ? '🟠' : '🔵'}
                            </div>
                            <div className="text-left">
                               <div className="text-sm font-black text-slate-800">{client?.name || 'Inconnu'}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase">{r.checkin} → {r.checkout}</div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-sm font-black text-primary">{r.total}€</div>
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100">{r.status}</div>
                         </div>
                       </button>
                     );
                   })}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button 
                   onClick={() => setOverlapSelection(null)}
                   className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                 >
                   Fermer
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EVENTS MODAL ─── */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
               onClick={() => setIsEventModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[900px] bg-white rounded-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200"
            >
              <div className="px-8 py-5 bg-primary text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                     <Zap className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black tracking-tight leading-tight uppercase">Console Événementielle</h3>
                     <p className="text-[9px] font-black opacity-60 uppercase tracking-[2px]">Gestion des pics d'activité</p>
                   </div>
                </div>
                <button onClick={() => setIsEventModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white">
                   <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-white">
                {/* Form Add Event */}
                <div className="bg-slate-50 rounded-[28px] p-8 border border-slate-100 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Saisie Manuelle</h4>
                    <div className="flex items-center gap-2">
                       <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                          <Upload className="w-3.5 h-3.5 text-slate-400" /> Importer RMS
                       </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Désignation Événement*</label>
                      <input 
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all" 
                        placeholder="Ex: Fashion Week, Salon Auto..."
                        value={newEvent.name}
                        onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lieux publics impactés</label>
                      <input 
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-800 outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all" 
                        placeholder="Ex: Parc des Expos, centre ville" 
                        value={newEvent.location}
                        onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Début*</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all" 
                          value={newEvent.start}
                          onChange={e => setNewEvent({...newEvent, start: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all" 
                          value={newEvent.end}
                          onChange={e => setNewEvent({...newEvent, end: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                          value={newEvent.impact}
                          onChange={e => setNewEvent({...newEvent, impact: e.target.value as any})}
                        >
                          <option value="Faible">Faible</option>
                          <option value="Moyen">Moyen</option>
                          <option value="Elevé">Elevé</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptif</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all min-h-[80px]" 
                      placeholder="Description de l'événement"
                      value={newEvent.description}
                      onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 mb-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source (Site Web)</label>
                    <input 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all" 
                      placeholder="Ex: maison-objet.com" 
                      value={newEvent.source}
                      onChange={e => setNewEvent({...newEvent, source: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const evt: Event = { ...newEvent as Event, id: Date.now().toString() };
                        setEvents([evt, ...events]);
                        setNewEvent({
                          name: '',
                          location: '',
                          start: TODAY,
                          end: TODAY,
                          impact: 'Moyen',
                          description: '',
                          source: ''
                        });
                      }}
                      className="px-8 py-3.5 bg-primary text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer"
                    >
                      Enregistrer l'événement
                    </button>
                    <button 
                      onClick={() => setIsEventModalOpen(false)}
                      className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </div>

                {/* Table List Events */}
                <div className="overflow-hidden border border-slate-100 rounded-3xl mb-8">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Événement</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lieu</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptif</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {events.map(evt => (
                        <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="text-[12px] font-black text-slate-800">{evt.name}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{evt.start} - {evt.end}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                              <div className="w-1 h-1 rounded-full bg-slate-300" /> {evt.location}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="bg-orange-100/50 border border-orange-200 px-3 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                               <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                               <span className="text-[10px] font-black text-orange-700 uppercase">{evt.impact}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 max-w-[200px]">
                            <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{evt.description}</p>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-[10px] font-black text-blue-500 hover:underline cursor-pointer">{evt.source}</div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-blue-500 transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ─── HELP MODAL (SHORTCUTS) ─── */}
      {/* ─── COLOR CONFIG MODAL ─── */}
      <AnimatePresence>
        {isColorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsColorModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-[#4A1D6D] p-8 text-white relative">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <Sparkles className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight leading-tight uppercase">Configuration Couleurs</h3>
                     <p className="text-[10px] font-black opacity-60 uppercase tracking-[3px]">Personnalisez vos canaux</p>
                   </div>
                </div>
                <button onClick={() => setIsColorModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors">
                   <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 bg-slate-50">
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(channelColors).map(([channel, color]) => (
                    <div key={channel} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary transition-all">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{channel}</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            value={color}
                            onChange={(e) => {
                              setChannelColors(prev => ({ ...prev, [channel]: e.target.value }));
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <span className="text-xs font-mono font-bold text-slate-500">{(color as string).toUpperCase()}</span>
                        </div>
                      </div>
                      <div 
                        className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm border"
                        style={{ 
                          backgroundColor: color as string,
                          color: getContrastColor(color as string),
                          borderLeft: `3px solid ${adjustColor(color as string, -30)}`
                        }}
                      >
                        Aperçu
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <Activity className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="text-[11px] font-black text-blue-800 uppercase tracking-widest mb-1">Impact visuel</h4>
                    <p className="text-[10px] font-medium text-blue-600/80 leading-relaxed">
                      Les couleurs modifiées sont appliquées instantanément à tout le planning. L'interface calcule automatiquement le contraste idéal pour garantir la lisibilité du texte.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                  onClick={() => {
                    setChannelColors(CHANNEL_COLORS);
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-200 transition-all"
                 >
                   Reset
                 </button>
                 <button 
                  onClick={() => setIsColorModalOpen(false)}
                  className="px-8 py-3 bg-[#4A1D6D] text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-[#3d185a] transition-all shadow-lg"
                 >
                   Enregistrer
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE CONFIRMATION SURCLASSEMENT */}
      <AnimatePresence>
        {upgradeRequest && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => { setUpgradeRequest(null); setDraggedResaId(null); setDragOverCell(null); }}
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
             >
               <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <ArrowLeftRight className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Changement de catégorie</h3>
                  <p className="text-slate-500 text-sm font-medium px-4">
                    Vous déplacez la réservation de <strong>Ch. {upgradeRequest.resa.room}</strong> vers <strong>Ch. {upgradeRequest.targetRoom.num}</strong> ({upgradeRequest.targetRoom.type}).
                    <br/><br/>
                    Comment souhaitez-vous procéder ?
                  </p>
               </div>
               <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => confirmUpgrade(false)}
                    className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Ignorer (Geste commercial)
                  </button>
                  <button 
                    onClick={() => confirmUpgrade(true)}
                    className="px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    Facturer le surclassement
                  </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPOVER EVENEMENT AU SURVOL */}
      <AnimatePresence>
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-[1000] pointer-events-none"
            style={{ left: hoveredEvent.x + 15, top: hoveredEvent.y + 15 }}
          >
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-200 w-64 space-y-3">
               <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    hoveredEvent.event.impact === 'Elevé' ? 'bg-red-100 text-red-600' : 
                    hoveredEvent.event.impact === 'Moyen' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    Impact {hoveredEvent.event.impact}
                  </span>
                  <Sparkles className="w-4 h-4 text-primary opacity-30" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-800 leading-tight">{hoveredEvent.event.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{hoveredEvent.event.description}</p>
               </div>
               <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                     <Activity className="w-3 h-3 text-slate-400" />
                     <span className="text-[9px] font-bold text-slate-400 lowercase">{hoveredEvent.event.source}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{hoveredEvent.event.location}</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-[#4A1D6D] p-8 text-white relative">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <Keyboard className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black tracking-tight leading-tight uppercase">Raccourcis clavier</h3>
                     <p className="text-[10px] font-black opacity-60 uppercase tracking-[3px]">Flowtym PMS - Boostez votre productivité</p>
                   </div>
                </div>
                <button onClick={() => setIsHelpModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors">
                   <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-3 gap-8 bg-slate-50 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* PLANNING */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[2px] border-b border-primary/10 pb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Planning
                  </h4>
                  <div className="space-y-2">
                    <ShortcutItem kbd="F2" label="Période précédente" />
                    <ShortcutItem kbd="F3" label="Période suivante" />
                    <ShortcutItem kbd="F4" label="Période personnalisée" />
                    <ShortcutItem kbd="F5" label="Vue semaine" />
                    <ShortcutItem kbd="F6" label="Vue 15 jours" />
                    <ShortcutItem kbd="F7" label="Vue mois" />
                    <ShortcutItem kbd="T" label="Aujourd'hui" />
                    <ShortcutItem kbd="N" label="Nouvelle réservation" />
                    <ShortcutItem kbd="E" label="Éditer réservation" />
                    <ShortcutItem kbd="Suppr" label="Annuler réservation" />
                    <ShortcutItem kbd="Ctrl + D" label="Dupliquer" />
                    <ShortcutItem kbd="Ctrl+Shift+P" label="Imprimer" />
                    <ShortcutItem kbd="Ctrl + G" label="Focus recherche" />
                    <ShortcutItem kbd="Ctrl + +" label="Zoom avant" />
                    <ShortcutItem kbd="Ctrl + -" label="Zoom arrière" />
                  </div>
                </div>

                {/* CLIENTS & CHECK */}
                <div className="space-y-4">
                   <h4 className="text-[11px] font-black text-[#10b981] uppercase tracking-[2px] border-b border-[#10b981]/10 pb-2 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Clients & Opérations
                  </h4>
                  <div className="space-y-2">
                    <ShortcutItem kbd="A" label="Liste clients" color="#10b981" />
                    <ShortcutItem kbd="Ctrl+Alt+C" label="Nouveau client" color="#10b981" />
                    <ShortcutItem kbd="Ctrl+Alt+R" label="Rechercher client" color="#10b981" />
                    <ShortcutItem kbd="F9" label="Historique client" color="#10b981" />
                    <div className="pt-4" />
                    <ShortcutItem kbd="I" label="Check-in" color="#3b82f6" />
                    <ShortcutItem kbd="O" label="Check-out" color="#f59e0b" />
                    <ShortcutItem kbd="Ctrl+Shift+I" label="Scan ID" color="#3b82f6" />
                    <ShortcutItem kbd="Ctrl+Alt+I" label="Check-in groupé" color="#3b82f6" />
                  </div>
                </div>

                {/* REPORTS & GENERAL */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-[#f59e0b] uppercase tracking-[2px] border-b border-[#f59e0b]/10 pb-2 flex items-center gap-2">
                    <Bolt className="w-3.5 h-3.5" /> Général & Rapports
                  </h4>
                  <div className="space-y-2">
                    <ShortcutItem kbd="R" label="Générer rapport" color="#f59e0b" />
                    <ShortcutItem kbd="F7" label="Rapport financier" color="#f59e0b" />
                    <ShortcutItem kbd="F8" label="Rapport opérationnel" color="#f59e0b" />
                    <div className="pt-4" />
                    <ShortcutItem kbd="Esc" label="Fermer modale" color="#64748b" />
                    <ShortcutItem kbd="Ctrl + S" label="Sauvegarder" color="#64748b" />
                    <ShortcutItem kbd="Ctrl + Z" label="Annuler" color="#64748b" />
                    <ShortcutItem kbd="Ctrl + Y" label="Rétablir" color="#64748b" />
                    <ShortcutItem kbd="Ctrl+Alt+Q" label="Déconnexion" color="#ef4444" />
                    <ShortcutItem kbd="Ctrl+Alt+M" label="Sélecteur module" color="#8b5cf6" />
                    <ShortcutItem kbd="Ctrl+H / F1" label="Afficher l'aide" color="#8b5cf6" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border-t border-slate-100 flex justify-center">
                 <button 
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-12 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-slate-800 transition-all shadow-lg"
                 >
                   Compris
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShortcutItem = ({ kbd, label, color = '#8B5CF6' }: { kbd: string, label: string, color?: string }) => (
  <div className="flex items-center justify-between group py-1">
    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-tight">{label}</span>
    <kbd className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[9px] font-black text-slate-800 shadow-sm min-w-[40px] text-center" style={{ borderLeft: `3px solid ${color}` }}>
      {kbd}
    </kbd>
  </div>
);

const CalendarView: React.FC<{
  baseDate: Date;
  reservations: any[];
  rooms: any[];
  clients: any[];
  formatDate: (d: Date) => string;
  setSelectedResaId: (id: string | null) => void;
}> = ({ baseDate, reservations, rooms, clients, formatDate, setSelectedResaId }) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDate - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const calendarDays = getDaysInMonth(baseDate);
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
        {weekdays.map(w => (
          <div key={w} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-primary/40">
            {w}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto no-scrollbar">
        <div className="grid grid-cols-7 h-full min-h-[600px]">
          {calendarDays.map((day, idx) => {
            const dateStr = formatDate(day.date);
            const dayResas = reservations.filter(r => r.checkin <= dateStr && r.checkout > dateStr);
            const arrivals = reservations.filter(r => r.checkin === dateStr);
            const departures = reservations.filter(r => r.checkout === dateStr);
            const occupancy = rooms.length > 0 ? Math.round((dayResas.length / rooms.length) * 100) : 0;
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            return (
              <div 
                key={idx} 
                className={`min-h-[140px] p-3 border-r border-b border-slate-100 transition-all hover:bg-slate-50/80 relative group ${!day.isCurrentMonth ? 'bg-slate-50/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-sm font-black tracking-tight ${day.isCurrentMonth ? 'text-slate-800' : 'text-slate-200'} ${isToday ? 'bg-primary text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-primary/30 scale-110' : ''}`}>
                    {day.date.getDate()}
                  </span>
                  {day.isCurrentMonth && (
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${occupancy > 80 ? 'bg-rose-100 text-rose-600' : occupancy > 50 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {occupancy}% TO
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 h-24 overflow-hidden">
                   {dayResas.slice(0, 3).map(r => {
                      const client = clients.find(c => c.id === r.clientId);
                      return (
                        <div 
                          key={r.id}
                          className="px-2 py-1 rounded-lg text-[9px] font-bold truncate bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer hover:border-primary hover:text-primary transition-all active:scale-95"
                          onClick={(e) => { e.stopPropagation(); setSelectedResaId(r.id); }}
                        >
                          {client?.name || 'Inconnu'} <span className="opacity-50 font-medium">({r.room})</span>
                        </div>
                      );
                   })}
                   {dayResas.length > 3 && (
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">
                        + {dayResas.length - 3} autres
                      </div>
                   )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-1.5">
                      {arrivals.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100">
                           <LogIn className="w-2.5 h-2.5" /> {arrivals.length}
                        </div>
                      )}
                      {departures.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black border border-rose-100">
                           <LogOut className="w-2.5 h-2.5" /> {departures.length}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
