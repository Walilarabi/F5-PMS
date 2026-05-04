import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Pencil, 
  Copy, 
  Trash2, 
  Printer, 
  Mail, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2, 
  TrendingUp,
  CreditCard,
  Activity,
  MoreVertical,
  BarChart2,
  User,
  Info,
  History,
  AlertCircle,
  Package,
  Star,
  Euro,
  Calendar,
  FileText,
  Search as SearchIcon,
  X,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { CHANNELS } from '../constants/channels';
import { getContrastColor, adjustColor } from '../lib/colorUtils';

import { SourceLogo } from './SourceLogo';
import { Flowboard } from './Flowboard';
import { CheckinQR } from './CheckinQR';
import ReservationFormModal from './ReservationFormModal';

interface Reservation {
  id: string;
  clientId: number;
  guestName?: string;
  status: 'confirmed' | 'pending' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  dates: string;
  nights: number;
  room: string;
  roomType?: string;
  roomCategory?: string;
  canal: string;
  montant: number;
  solde: number;
  checkin: string;
  checkout: string;
  type?: string;
  pax?: number;
  adults?: number;
  children?: number;
  cancelPolicy?: 'flexible' | 'modere' | 'stricte' | 'non_remboursable';
  paymentStatus?: 'paid' | 'pending' | 'expired' | 'reminder_sent';
  expiresIn?: string;
  reminders?: number;
  clv?: number;
  sejours?: number;
  preferences?: string;
}

interface ReservationsProps {
  reservations: Reservation[];
  clients: any[];
  onOpenReservation?: (id: string) => void;
  selectedResaId?: string | null;
  onAddReservation?: (res: any) => void;
}

const MiniKPICard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-[20px] px-5 py-3 flex items-center gap-3.5 transition-all hover:border-primary/30 hover:shadow-md group cursor-default shadow-sm">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all" style={{ background: `${color}18` }}>
       <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 leading-none mb-1 uppercase tracking-widest">{label}</div>
      <div className="text-[20px] font-black text-slate-800 leading-tight">{value}</div>
    </div>
  </div>
);

const ActionMenu = ({ onEdit, onDuplicate, onCancel }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors group"
      >
        <MoreVertical className="w-4 h-4 group-hover:text-primary transition-colors" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 py-1 overflow-hidden"
            >
              <button 
                className="w-full px-3 py-2 text-left text-[9px] font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit?.(); setIsOpen(false); }}
              >
                <Pencil className="w-3 h-3" /> Modifier
              </button>
              <button 
                className="w-full px-3 py-2 text-left text-[9px] font-black text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDuplicate?.(); setIsOpen(false); }}
              >
                <Copy className="w-3 h-3" /> Dupliquer
              </button>
              <button 
                className="w-full px-3 py-2 text-left text-[9px] font-black text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                onClick={(e) => { e.stopPropagation(); onCancel?.(); setIsOpen(false); }}
              >
                <Trash2 className="w-3 h-3" /> Annuler
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Reservations: React.FC<ReservationsProps> = ({ 
  reservations: initialReservations, 
  clients,
  onOpenReservation,
  selectedResaId,
  onAddReservation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [canalFilter, setCanalFilter] = useState('all');
  
  const [showKPIs, setShowKPIs] = useState(true);
  const [showPayments, setShowPayments] = useState(true);
  const [printResa, setPrintResa] = useState<Reservation | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailType, setEmailType] = useState<'standard' | 'payment'>('standard');
  const [depositPercent, setDepositPercent] = useState('30');
  const [showLogsResaId, setShowLogsResaId] = useState<string | null>(null);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [selectedResaIdForAction, setSelectedResaIdForAction] = useState<string | null>(null);

  // ── Modale relance paiement ──
  const [reminderModal, setReminderModal] = useState<{ resa: Reservation; clientName: string } | null>(null);
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');

  const openReminderModal = (r: Reservation) => {
    const client = clients.find(c => c.id === r.clientId);
    const name = client?.name || r.guestName || 'Client';
    setReminderModal({ resa: r, clientName: name });
    setReminderEmail(client?.email || `${name.toLowerCase().replace(' ', '.')}@example.com`);
    setReminderMessage(`Bonjour ${name},\n\nNous n'avons pas encore reçu votre paiement de ${r.montant} € pour votre séjour du ${r.checkin} au ${r.checkout}.\n\nMerci de régler via le lien ci-dessous.\n\nCordialement,\nL'équipe Mas Provencal Aix`);
  };

  const sendReminder = () => {
    if (!reminderModal) return;
    // Simulation envoi
    const ref = 'FLTM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const link = `https://pay.flowtym.com/stripe/${ref}?amount=${reminderModal.resa.montant}`;
    alert(`✅ Lien de paiement envoyé à ${reminderEmail}\n\n${link}`);
    setReminderModal(null);
  };

  const reservationLogs = [
    { reservation_id: "RES-001", user: "Admin", action: "CREATE", old_values: null, new_values: { client: "Sophie Dubois", room: "201" }, created_at: "2026-04-10 09:30:00" },
    { reservation_id: "RES-001", user: "Admin", action: "UPDATE", old_values: { room: "200" }, new_values: { room: "201" }, created_at: "2026-04-11 14:20:00" },
    { reservation_id: "RES-002", user: "Réception", action: "CREATE", old_values: null, new_values: { client: "Marc Lefevre", room: "102" }, created_at: "2026-04-12 08:15:00" }
  ];

  const handlePrintSingle = (r: Reservation) => {
    const client = clients.find(c => c.id === r.clientId);
    const clientName = client?.name || r.guestName || 'Client';
    const paxCount = r.pax || r.adults || 2;
    const roomLabel = [r.room, r.roomType, r.roomCategory].filter(Boolean).join(' – ');
    const cancelLabel: Record<string, string> = {
      flexible: 'Flexible (annulation gratuite 72h avant)',
      modere: 'Modérée (annulation gratuite 48h avant)',
      stricte: 'Stricte (annulation 7j avant)',
      non_remboursable: 'Non remboursable',
    };
    const htVal = (r.montant / 1.1).toFixed(2);
    const tvaVal = (r.montant - r.montant / 1.1).toFixed(2);
    const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : iso;
    const printContent = `
      <div style="max-width:800px; margin:0 auto; padding:20px; font-family:'Inter',sans-serif; color:#1e293b;">
        <div style="text-align:center; margin-bottom:30px;">
          <h1 style="color:#8B5CF6; margin:0; font-weight:800;">Mas Provencal Aix</h1>
          <p style="margin:5px 0;">13100 Aix-en-Provence, France</p>
          <div style="background:#8B5CF6; color:white; display:inline-block; padding:4px 16px; border-radius:40px; font-size:12px; font-weight:700; margin-top:10px;">✓ Réservation confirmée</div>
        </div>
        <h2 style="font-weight:800; font-size:20px; margin-bottom:10px;">Bonjour ${clientName} !</h2>
        <p style="font-size:13px; color:#64748b; margin-bottom:20px;">Nous sommes ravis de vous accueillir. Votre réservation a bien été enregistrée.</p>
        <div style="background:#f8fafc; padding:20px; border-radius:16px; margin:20px 0; border:1px solid #e2e8f0;">
          <h3 style="color:#8B5CF6; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">DÉTAILS DU SÉJOUR</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; font-size:12px;">
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">RÉF. DOSSIER</strong><br><span style="font-weight:700;">${r.id}</span></div>
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">CHAMBRE</strong><br><span style="font-weight:700;">${roomLabel}</span></div>
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">ARRIVÉE</strong><br><span style="font-weight:700;">${fmtD(r.checkin)}</span></div>
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">DÉPART</strong><br><span style="font-weight:700;">${fmtD(r.checkout)}</span></div>
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">DURÉE</strong><br><span style="font-weight:700;">${r.nights} nuit${r.nights > 1 ? 's' : ''}</span></div>
            <div><strong style="color:#64748b; font-size:9px; text-transform:uppercase;">PERSONNES</strong><br><span style="font-weight:700;">${paxCount} personne${paxCount > 1 ? 's' : ''}</span></div>
          </div>
        </div>
        <div style="margin-top:30px;">
          <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #e2e8f0;">
            <thead><tr style="background:#f1f5f9;"><th style="padding:10px; text-align:left;">Description</th><th style="padding:10px; text-align:right;">HT</th><th style="padding:10px; text-align:right;">TTC</th></tr></thead>
            <tbody>
              <tr><td style="padding:10px; border-bottom:1px solid #f1f5f9;">Séjour — ${roomLabel} (${r.nights} nuit${r.nights > 1 ? 's' : ''})</td><td style="padding:10px; text-align:right; border-bottom:1px solid #f1f5f9;">${htVal} €</td><td style="padding:10px; text-align:right; border-bottom:1px solid #f1f5f9;">${r.montant.toFixed(2)} €</td></tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px; text-align:right; font-size:12px;">
          <p style="margin:4px 0; color:#64748b;">Sous-total HT : ${htVal} €</p>
          <p style="margin:4px 0; color:#64748b;">TVA 10% : ${tvaVal} €</p>
          <div style="border-top:1px solid #e2e8f0; margin-top:10px; padding-top:10px;">
            <div style="background:#EDE9FE; border-radius:10px; padding:6px 12px; display:inline-block;">
              <span style="font-size:0.65rem; color:#5b21b6; margin-right:6px; font-weight:700;">TOTAL TTC :</span>
              <span style="color:#6d28d9; font-weight:700; font-size:1rem;">${r.montant.toFixed(2)} €</span>
            </div>
          </div>
        </div>
        <div style="margin-top:16px; font-size:11px; color:#64748b; background:#f8fafc; border-radius:10px; padding:12px;">
          <strong>Conditions d'annulation :</strong> ${cancelLabel[r.cancelPolicy || 'flexible'] || 'Flexible'}
        </div>
        <div style="margin-top:30px; font-size:10px; color:#64748b; text-align:center; border-top:1px solid #e2e8f0; padding-top:20px;">
          Flowtym PMS · Mas Provencal Aix · contact@flowtym.com · +33 4 00 00 00 00<br>
          SIRET 000 000 000 00000 — TVA FR 00 000 000 000
        </div>
      </div>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<html><head><title>Réservation ${r.id}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"></head><body style="margin:0; padding:20px;">${printContent}</body></html>`);
      win.document.close();
      setTimeout(() => { win.print(); }, 500);
    }
  };

  const handleGenerateProforma = (r: Reservation) => {
    const client = clients.find(c => c.id === r.clientId);
    const clientName = client?.name || r.guestName || 'Client';
    const clientEmail = client?.email || '';
    const clientPhone = client?.phone || '';
    const paxCount = r.pax || r.adults || 2;
    const roomLabel = [r.room, r.roomType, r.roomCategory].filter(Boolean).join(' – ');
    const cancelLabel: Record<string, string> = {
      flexible: "Flexible — Annulation gratuite jusqu'à 72h avant l'arrivée.",
      modere: "Modérée — Annulation gratuite jusqu'à 48h avant l'arrivée.",
      stricte: "Stricte — Annulation gratuite jusqu'à 7 jours avant l'arrivée.",
      non_remboursable: "Non remboursable — Aucun remboursement en cas d'annulation.",
    };
    const pfNum = `PF-${r.id}-${new Date().getFullYear()}`;
    const htTotal = (r.montant / 1.1).toFixed(2);
    const tvaTotal = (r.montant - r.montant / 1.1).toFixed(2);
    const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : iso;
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="max-width:800px; margin:0 auto; padding:40px; font-family:'Inter',sans-serif; color:#1e293b; background:white;">
        <div style="text-align:center; margin-bottom:40px;">
          <h1 style="color:#8B5CF6; font-size:36px; margin:0; font-weight:800; letter-spacing:-1px;">FLOWTYM</h1>
          <p style="color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:2px; margin-top:5px;">Mas Provencal Aix — 13100 Aix-en-Provence</p>
          <h2 style="color:#1e293b; font-size:20px; font-weight:800; margin-top:30px; text-transform:uppercase; letter-spacing:1px;">FACTURE PROFORMA</h2>
          <p style="color:#64748b; font-size:12px; font-weight:700;">N° ${pfNum} — Émise le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
          <div style="background:#f8fafc; padding:24px; border-radius:16px; border:1px solid #e2e8f0;">
            <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">INFORMATIONS CLIENT</h3>
            <p style="font-weight:800; font-size:16px; margin:0 0 4px; color:#0f172a;">${clientName}</p>
            ${clientEmail ? `<p style="margin:2px 0; font-size:12px; color:#64748b;">${clientEmail}</p>` : ''}
            ${clientPhone ? `<p style="margin:2px 0; font-size:12px; color:#64748b;">${clientPhone}</p>` : ''}
          </div>
          <div style="background:#f8fafc; padding:24px; border-radius:16px; border:1px solid #e2e8f0;">
            <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">DÉTAILS DU SÉJOUR</h3>
            <table style="width:100%; font-size:12px; font-weight:600; border-spacing:0 6px; border-collapse:separate;">
              <tr><td style="color:#64748b; font-size:9px; text-transform:uppercase;">Arrivée</td><td style="font-weight:700;">${fmtD(r.checkin)}</td></tr>
              <tr><td style="color:#64748b; font-size:9px; text-transform:uppercase;">Départ</td><td style="font-weight:700;">${fmtD(r.checkout)}</td></tr>
              <tr><td style="color:#64748b; font-size:9px; text-transform:uppercase;">Durée</td><td style="font-weight:700;">${r.nights} nuit${r.nights > 1 ? 's' : ''}</td></tr>
              <tr><td style="color:#64748b; font-size:9px; text-transform:uppercase;">Chambre</td><td style="font-weight:700;">${roomLabel}</td></tr>
              <tr><td style="color:#64748b; font-size:9px; text-transform:uppercase;">Personnes</td><td style="font-weight:700;">${paxCount}</td></tr>
            </table>
          </div>
        </div>
        <div style="margin-bottom:30px;">
          <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px;">DÉTAIL DES PRESTATIONS</h3>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:12px; text-align:left; font-size:10px; font-weight:800;">Description</th>
                <th style="padding:12px; text-align:center; font-size:10px; font-weight:800;">Qté</th>
                <th style="padding:12px; text-align:right; font-size:10px; font-weight:800;">PU HT</th>
                <th style="padding:12px; text-align:right; font-size:10px; font-weight:800;">Total TTC</th>
              </tr>
            </thead>
            <tbody style="font-size:11px; font-weight:700;">
              <tr>
                <td style="padding:12px; border-bottom:1px solid #f1f5f9;">Hébergement — ${roomLabel}</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid #f1f5f9;">${r.nights} nuit${r.nights > 1 ? 's' : ''}</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">${(r.montant / 1.1 / r.nights).toFixed(2)} €</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">${r.montant.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="text-align:right; margin-left:auto; width:280px; padding:20px; background:#f8fafc; border-radius:16px; border:1px solid #e2e8f0;">
          <p style="font-size:11px; margin:5px 0; color:#64748b;">Sous-total HT : ${htTotal} €</p>
          <p style="font-size:11px; margin:5px 0; color:#64748b;">TVA 10% : ${tvaTotal} €</p>
          <div style="border-top:1px solid #e2e8f0; margin-top:10px; padding-top:10px;">
            <div style="background:#EDE9FE; border-radius:10px; padding:6px 12px; display:inline-block;">
              <span style="font-size:0.65rem; color:#5b21b6; margin-right:6px; font-weight:700;">TOTAL TTC :</span>
              <span style="color:#6d28d9; font-weight:700; font-size:1rem;">${r.montant.toFixed(2)} €</span>
            </div>
          </div>
        </div>
        <div style="margin-top:24px; padding:16px; background:#fffbeb; border:1px solid #fef3c7; border-radius:12px;">
          <p style="font-size:11px; font-weight:800; color:#b45309; margin-bottom:6px;">CONDITIONS D'ANNULATION</p>
          <p style="font-size:11px; color:#d97706; line-height:1.6; margin:0;">${cancelLabel[r.cancelPolicy || 'flexible']}</p>
        </div>
        <div style="margin-top:40px; font-size:10px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:24px;">
          <p style="font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Flowtym PMS · Mas Provencal Aix · proforma@flowtym.com · +33 4 00 00 00 00</p>
          <p>Document non contractuel — TVA intracommunautaire FR00 000 000 000 — SIRET 000 000 000 00000</p>
        </div>
      </div>
    `;
    const opt = {
      margin: 0,
      filename: `Proforma_${pfNum}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
// @ts-ignore
    html2pdf().set(opt).from(element).save();
  };


  const handleSendEmail = () => {
    const r = filteredReservations.find(resa => resa.id === selectedResaIdForAction);
    if (!r) return;
    const client = clients.find(c => c.id === r.clientId);
    const clientName = client?.name || 'Client';

    const object = emailType === 'standard' ? `Confirmation de votre réservation ${r.id}` : `Action requise : Paiement de votre réservation ${r.id}`;
    
    alert(`✉️ Email ${emailType === 'payment' ? 'avec lien (' + depositPercent + '%)' : 'confirmation'} envoyé avec succès à ${client?.email || 'client'} !`);
    setIsEmailModalOpen(false);
  };

  // Enrich initial reservations
  const enrichedReservations = initialReservations.map((r, i) => ({
    ...r,
    // roomType et category simulés si absents
    roomType: r.roomType || ['Simple', 'Double', 'Double Supérieure', 'Suite', 'Twin', 'Familiale'][i % 6],
    roomCategory: r.roomCategory || ['Classique', 'Classique', 'Deluxe', 'Deluxe', 'Classique', 'Standard'][i % 6],
    // pax simulé si absent
    pax: r.pax || r.adults || [1, 2, 2, 3, 2, 4][i % 6],
    // condition d'annulation simulée si absente
    cancelPolicy: r.cancelPolicy || (['flexible', 'flexible', 'modere', 'stricte', 'non_remboursable', 'flexible'] as const)[i % 6],
    clv: Math.floor(Math.random() * 5000) + 500,
    sejours: Math.floor(Math.random() * 15) + 1,
    preferences: r.id === "RES-001" ? "Étage élevé" : r.id === "RES-003" ? "Sans gluten" : ""
  }));

  const paymentsInProgress: Reservation[] = [
    {
      id: "RES-005", clientId: 2, status: "pending", dates: "12 avr. – 15 avr. 2026", nights: 3, room: "DUMMY_D_CLASSIC", canal: "Direct", montant: 360, solde: 360, checkin: "2026-04-12", checkout: "2026-04-15", paymentStatus: 'expired', expiresIn: 'Expire'
    },
    {
      id: "RES-004", clientId: 1, status: "pending", dates: "15 avr. – 17 avr. 2026", nights: 2, room: "102", canal: "Direct", montant: 360, solde: 360, checkin: "2026-04-15", checkout: "2026-04-17", paymentStatus: 'pending', expiresIn: '0h 35m'
    },
    {
      id: "RES-006", clientId: 4, status: "pending", dates: "20 avr. – 23 avr. 2026", nights: 3, room: "102", canal: "Direct", montant: 360, solde: 360, checkin: "2026-04-20", checkout: "2026-04-23", paymentStatus: 'reminder_sent', expiresIn: '1j 4h', reminders: 1
    }
  ];

  const filteredReservations = enrichedReservations.filter(r => {
    const client = clients.find(c => c.id === r.clientId);
    const displayName = client?.name || r.guestName || '';
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCanal = canalFilter === 'all' || r.canal === canalFilter;
    return matchesSearch && matchesStatus && matchesCanal;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cancelled': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-600 uppercase tracking-wider">Annulée</span>;
      case 'checked_in': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-600 uppercase tracking-wider">Checkin</span>;
      case 'no_show': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-800 text-white uppercase tracking-wider">No-Show</span>;
      case 'paid': return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-600 uppercase tracking-wider">Payé</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary/10 text-primary uppercase tracking-wider">Confirmée</span>;
    }
  };

  const handleExportExcel = () => {
    const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : iso;
    const cancelLabels: Record<string, string> = {
      flexible: 'Flexible', modere: 'Modérée', stricte: 'Stricte', non_remboursable: 'Non remboursable',
    };
    const data = filteredReservations.map(r => {
      const client = clients.find(c => c.id === r.clientId);
      const clientName = client?.name || r.guestName || 'N/A';
      const roomFull = [r.room, r.roomType, r.roomCategory].filter(Boolean).join(' – ');
      return {
        'Référence':        r.id,
        'Statut':           r.status,
        'Client':           clientName,
        'Email':            client?.email || '',
        'Personnes':        r.pax || r.adults || 2,
        'Check-in':         fmtD(r.checkin),
        'Check-out':        fmtD(r.checkout),
        'Nuits':            r.nights,
        'Montant TTC (€)':  r.montant.toFixed(2),
        'Solde (€)':        r.solde.toFixed(2),
        'Annulation':       cancelLabels[r.cancelPolicy || 'flexible'],
        'Canal':            r.canal,
        'Chambre':          roomFull || r.room,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    // Largeur automatique des colonnes
    const cols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
    ws['!cols'] = cols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Réservations');
    XLSX.writeFile(wb, `flowtym_reservations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    // Générer un PDF de la liste des réservations
    const fmtD = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : iso;
    const cancelLabels: Record<string, string> = {
      flexible: 'Flexible', modere: 'Modérée', stricte: 'Stricte', non_remboursable: 'Non remb.',
    };
    const rows = filteredReservations.map(r => {
      const client = clients.find(c => c.id === r.clientId);
      const name = client?.name || r.guestName || '—';
      const room = [r.room, r.roomType].filter(Boolean).join(' – ');
      const pmt = r.solde === 0 ? '✅ Payé' : r.paymentStatus === 'expired' ? '❌ Expiré' : '⏳ En attente';
      return `<tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 8px; font-weight:700; color:#8B5CF6; font-family:monospace;">${r.id}</td>
        <td style="padding:6px 8px;">${name}</td>
        <td style="padding:6px 8px; text-align:center;">${r.pax || 2}</td>
        <td style="padding:6px 8px;">${fmtD(r.checkin)}</td>
        <td style="padding:6px 8px;">${fmtD(r.checkout)}</td>
        <td style="padding:6px 8px; text-align:center;">${r.nights}</td>
        <td style="padding:6px 8px; text-align:right; font-weight:700;">${r.montant.toFixed(2)} €</td>
        <td style="padding:6px 8px;">${cancelLabels[r.cancelPolicy || 'flexible']}</td>
        <td style="padding:6px 8px;">${r.canal}</td>
        <td style="padding:6px 8px;">${room}</td>
        <td style="padding:6px 8px;">${pmt}</td>
      </tr>`;
    }).join('');
    const html = `
      <html><head><title>Réservations – Flowtym PMS</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body{font-family:'Inter',sans-serif;padding:24px;color:#1e293b} table{width:100%;border-collapse:collapse;font-size:11px} th{background:#8B5CF6;color:#fff;padding:8px;text-align:left;font-weight:700} @media print{@page{size:A4 landscape;margin:15mm}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div><h1 style="color:#8B5CF6;margin:0;font-size:22px;font-weight:800;">Mas Provencal Aix</h1>
        <p style="color:#64748b;margin:4px 0 0;font-size:12px;">Liste des réservations — ${new Date().toLocaleDateString('fr-FR')}</p></div>
        <div style="text-align:right;font-size:11px;color:#94a3b8;">${filteredReservations.length} dossier${filteredReservations.length > 1 ? 's' : ''}</div>
      </div>
      <table>
        <thead><tr><th>Référence</th><th>Client</th><th>Pers.</th><th>Check-in</th><th>Check-out</th><th>Nuits</th><th>Montant</th><th>Annulation</th><th>Canal</th><th>Chambre</th><th>Paiement</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px;">
        Flowtym PMS · Mas Provencal Aix · SIRET 000 000 000 00000 — Document généré le ${new Date().toLocaleString('fr-FR')}
      </div>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 600);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-140px)] -m-4 overflow-hidden bg-slate-50 ${printResa ? 'printing-single' : ''}`}>
      {/* ─── PRINT VIEW (Single Reservation) ─── */}
      {printResa && (
        <div className="print-only p-12 bg-white text-slate-900 font-sans min-h-screen">
          <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-10">
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tighter uppercase mb-2">FLOWTYM PMS</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Confirmation de Réservation</p>
            </div>
            <div className="text-right">
              <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl inline-block shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest text-center">N° Dossier</span>
                <span className="text-xl font-mono font-black text-slate-800">{printResa.id}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-16 mb-12">
            <div>
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[2px] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full" /> Informations Client
              </h3>
              <div className="space-y-3 pl-3">
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {clients.find(c => c.id === printResa.clientId)?.name || 'Client Inconnu'}
                </p>
                <div className="flex flex-col gap-1 mt-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">ID Client: #{printResa.clientId}</p>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Origine: {printResa.canal}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[2px] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full" /> Détails du Séjour
              </h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <div className="flex justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Chambre</span>
                  <span className="text-xs font-black text-slate-800">#{printResa.room}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Arrivée</span>
                  <span className="text-xs font-black text-slate-800">{printResa.checkin}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Départ</span>
                  <span className="text-xs font-black text-slate-800">{printResa.checkout}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Durée</span>
                  <span className="text-xs font-black text-slate-800">{printResa.nights} Nuits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-10 mb-12 border-2 border-slate-50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Euro className="w-40 h-40" />
            </div>
            
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-8">Récapitulatif Financier</h3>
            
            <div className="grid grid-cols-2 gap-8 items-end">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Base HT</span>
                  <span className="text-sm font-bold text-slate-800">{(printResa.montant / 1.1).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">TVA (10%)</span>
                  <span className="text-sm font-bold text-slate-800">{(printResa.montant - (printResa.montant / 1.1)).toFixed(2)} €</span>
                </div>
                <div className="pt-6 border-t-2 border-slate-50 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total TTC</span>
                  <span className="text-3xl font-black text-primary underline decoration-primary/20 decoration-8 underline-offset-4">{printResa.montant.toFixed(2)} €</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-[32px] text-white">
                 <span className="text-[10px] font-black uppercase tracking-[3px] opacity-40 mb-3">Statut du dossier</span>
                 <div className={`text-sm font-black uppercase tracking-widest px-6 py-2 rounded-full border-2 ${printResa.solde <= 0 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/30 text-rose-400 bg-rose-500/5'}`}>
                    {printResa.solde <= 0 ? '✓ Dossier Soldé' : `! Solde: ${printResa.solde.toFixed(2)} €`}
                 </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-10 mt-auto grid grid-cols-2 gap-10">
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4">Conditions générales</p>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-sm italic">
                Cette confirmation fait office de justificatif de réservation. Toute annulation doit être effectuée conformément aux conditions en vigueur sur votre canal de réservation ({printResa.canal}).
              </p>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-200 uppercase tracking-[2px] italic mb-1">Généré via Flowtym PMS Engine</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Édition du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN UI (List & Filters) ─── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${printResa ? 'no-print' : ''}`}>
      {/* ─── HEADER ─── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 no-print shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="group flex items-center justify-center bg-white border border-slate-200 w-9 h-9 rounded-xl text-slate-500 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                  <Bookmark className="w-4 h-4" />
               </div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Réservations</h2>
            </div>
          </div>

          <AnimatePresence>
            {showKPIs && (
              <motion.div 
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap border-l border-slate-100 ml-2 pl-6"
              >
                <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest leading-none border border-primary/20">
                  {filteredReservations.length} dossiers
                </div>
                <MiniKPICard label="Confirmées" value={initialReservations.filter(r => r.status === 'confirmed').length} icon={CheckCircle2} color="#8B5CF6" />
                <MiniKPICard label="Check-in" value={initialReservations.filter(r => r.status === 'checked_in').length} icon={Activity} color="#10B981" />
                <MiniKPICard label="CA Total" value={`${initialReservations.reduce((sum, r) => sum + r.montant, 0).toLocaleString()} €`} icon={TrendingUp} color="#6366f1" />
                <MiniKPICard label="En attente" value={initialReservations.filter(r => r.solde > 0).length} icon={CreditCard} color="#F59E0B" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleExportPDF}
            className="px-3 py-2 bg-[#FEF2F2] text-[#9F1239] border border-[#FECDD3] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FEE2E2] transition-all flex items-center gap-1.5 group shadow-sm active:scale-95"
            title="Exporter la liste en PDF (impression)"
          >
            {/* Icône PDF officielle */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#DCFCE7] transition-all flex items-center gap-1.5 group shadow-sm active:scale-95"
            title="Exporter en Excel (.xlsx)"
          >
            {/* Icône Excel officielle */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="16" y2="17"/>
              <line x1="10" y1="9" x2="14" y2="9"/>
            </svg>
            Excel
          </button>
          <div className="w-px h-6 bg-slate-100 mx-0.5" />
          <button 
            onClick={() => setShowKPIs(!showKPIs)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border ${showKPIs ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-200 text-slate-400 hover:border-primary hover:text-primary'}`}
            title={showKPIs ? "Masquer KPI" : "Afficher KPI"}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 no-print shrink-0">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Nom, chambre, canal..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous statuts</option>
            <option value="confirmed">Confirmée</option>
            <option value="checked_in">Checkin</option>
          </select>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all"
            value={canalFilter}
            onChange={e => setCanalFilter(e.target.value)}
          >
            <option value="all">Tous canaux</option>
            <option value="Direct">Direct</option>
            <option value="Booking.com">Booking.com</option>
          </select>
          <button onClick={() => setIsNewResModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 group">
            <Plus className="w-4 h-4" />
            Nouvelle réservation
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT: TWO COLUMNS LAYOUT ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: LIST (2/3) */}
        <div className="flex-[2] flex flex-col overflow-hidden bg-white border-r border-slate-200">
          
          {/* PAYMENT SECTION (Collapsible) */}
          <div className="shrink-0 bg-white overflow-hidden border-b border-slate-200">
            <button 
              onClick={() => setShowPayments(!showPayments)}
              className="w-full h-14 px-8 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors no-print"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-[2px] text-primary leading-none mb-1">Suivi des paiements</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{paymentsInProgress.length} dossiers avec solde débiteur</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[9px] font-black">{paymentsInProgress.length} ATTEINTES</span>
                 {showPayments ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {showPayments && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-200"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-4 py-1.5">Réservation</th>
                          <th className="px-4 py-1.5">Client</th>
                          <th className="px-4 py-1.5 text-right">Montant</th>
                          <th className="px-4 py-1.5 text-center">Paiement</th>
                          <th className="px-4 py-1.5">Expire</th>
                          <th className="px-4 py-1.5">Chambre</th>
                          <th className="px-4 py-1.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 italic-rows">
                        {paymentsInProgress.map(r => {
                          const clientName = clients.find(c => c.id === r.clientId)?.name || r.guestName || '—';
                          return (
                            <tr 
                              key={r.id} 
                              onClick={() => onOpenReservation?.(r.id)}
                              className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedResaId === r.id ? 'bg-primary/5' : ''}`}
                            >
                              <td className="px-4 py-1 font-mono font-bold text-slate-400">{r.id}</td>
                              <td className="px-4 py-1 font-bold text-slate-700">{clientName}</td>
                              <td className="px-4 py-1 text-right font-black text-slate-900">{r.montant} €</td>
                              <td className="px-4 py-1 text-center">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${r.paymentStatus === 'expired' ? 'bg-rose-50 text-rose-500' : r.paymentStatus === 'reminder_sent' ? 'bg-violet-50 text-violet-500' : 'bg-amber-50 text-amber-600'}`}>
                                  {r.paymentStatus === 'expired' ? '⚠️ Lien expiré' : r.paymentStatus === 'reminder_sent' ? '📧 Relancé' : '⏳ Attente'}
                                </span>
                              </td>
                              <td className="px-4 py-1 font-bold text-slate-500">{r.expiresIn}</td>
                              <td className="px-4 py-1">
                                <span className="text-[10px] font-black text-slate-400">{r.room}</span>
                              </td>
                              <td className="px-4 py-1 text-center" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => openReminderModal(r)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white border border-violet-200 hover:border-violet-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                  title="Envoyer une relance de paiement"
                                >
                                  <i className="fa-solid fa-paper-plane" style={{ fontSize: 10 }} />
                                  Relancer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ALL RESERVATIONS SECTION */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-11 px-6 flex items-center border-b border-slate-200 bg-white">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">📋 TOUTES LES RÉSERVATIONS</span>
              <span className="ml-3 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{filteredReservations.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs text-left" style={{ minWidth: 960 }}>
                <thead className="bg-slate-50/50 sticky top-0 z-20 text-[9px] font-black text-slate-400 tracking-widest border-b border-slate-100 uppercase">
                  <tr>
                    <th className="px-3 py-2">Référence</th>
                    <th className="px-3 py-2 text-center">Statut</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2 text-center">Pers.</th>
                    <th className="px-3 py-2">Check-in</th>
                    <th className="px-3 py-2">Check-out</th>
                    <th className="px-3 py-2 text-center">Nuits</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2 text-center">Annulation</th>
                    <th className="px-3 py-2">Canal</th>
                    <th className="px-3 py-2">Chambre</th>
                    <th className="px-3 py-2 text-right no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.map(r => {
                    const client = clients.find(c => c.id === r.clientId);
                    const displayName = client?.name || r.guestName || '—';
                    // Initiales pour l'avatar
                    const initials = displayName.split(' ').map((w: string) => w[0]).slice(0,2).join('').toUpperCase();
                    // Couleur avatar déterministe selon le nom
                    const avatarColors = [
                      ['#EDE9FE','#5B21B6'],['#ECFDF5','#065F46'],['#EFF6FF','#1D4ED8'],
                      ['#FFF7ED','#9A3412'],['#FDF4FF','#6D28D9'],['#F0FDF4','#15803D'],
                    ];
                    const avatarPair = avatarColors[displayName.charCodeAt(0) % avatarColors.length];
                    const [avatarBg, avatarFg] = avatarPair;
                    // Format dates JJ/MM/AAAA
                    const fmtDate = (iso: string) => {
                      if (!iso) return '—';
                      const d = new Date(iso);
                      if (isNaN(d.getTime())) return iso;
                      return d.toLocaleDateString('fr-FR');
                    };
                    // Badge statut réservation
                    const statusBadge = () => {
                      const map: Record<string, { bg: string; text: string; label: string }> = {
                        confirmed:   { bg: '#d1fae5', text: '#065f46', label: 'Confirmée' },
                        pending:     { bg: '#ffedd5', text: '#9a3412', label: 'En attente' },
                        cancelled:   { bg: '#fee2e2', text: '#991b1b', label: 'Annulée' },
                        checked_in:  { bg: '#dbeafe', text: '#1e40af', label: 'Check-in' },
                        checked_out: { bg: '#f1f5f9', text: '#475569', label: 'Check-out' },
                        no_show:     { bg: '#1e293b', text: '#ffffff', label: 'No-Show' },
                      };
                      const cfg = map[r.status] || { bg: '#f1f5f9', text: '#64748b', label: r.status };
                      return (
                        <span style={{ background: cfg.bg, color: cfg.text }} className="px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap">
                          {cfg.label}
                        </span>
                      );
                    };
                    // Badge paiement collé au montant
                    const payBadge = () => {
                      const isPaid = r.solde === 0;
                      const isRefused = r.paymentStatus === 'expired';
                      const isCancelled = r.status === 'cancelled';
                      if (isCancelled) return <span className="ml-1 text-[8px]" style={{ color: '#94a3b8' }}>⚪</span>;
                      if (isRefused)   return <span className="ml-1 text-[8px]" style={{ color: '#ef4444' }}>🔴</span>;
                      if (isPaid)      return <span className="ml-1 text-[8px]" style={{ color: '#10b981' }}>🟢</span>;
                      return             <span className="ml-1 text-[8px]" style={{ color: '#f59e0b' }}>🟠</span>;
                    };
                    return (
                      <tr
                        key={r.id}
                        onClick={() => onOpenReservation?.(r.id)}
                        className={`hover:bg-primary/5 cursor-pointer transition-colors group ${selectedResaId === r.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                      >
                        {/* Référence */}
                        <td className="px-3 py-1.5">
                          <span className="font-mono font-black text-primary text-[11px]">{r.id}</span>
                        </td>
                        {/* Statut */}
                        <td className="px-3 py-1.5 text-center">{statusBadge()}</td>
                        {/* Client — avatar + nom + email */}
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${avatarBg}, ${avatarFg}22)`,
                              border: `1.5px solid ${avatarFg}33`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 800, color: avatarFg, flexShrink: 0,
                              letterSpacing: '.02em',
                            }}>
                              {initials || '?'}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 text-[12px] leading-none">{displayName}</div>
                              {(client?.email || r.email) && (
                                <div className="text-[9px] text-slate-400 mt-0.5 leading-none">{client?.email || r.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* 5. Nombre de personnes */}
                        <td className="px-3 py-1.5 text-center">
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-slate-600">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {r.pax || r.adults || 2}
                          </span>
                        </td>
                        {/* Check-in */}
                        <td className="px-3 py-1.5">
                          <span className="text-[11px] font-bold text-slate-600">{fmtDate(r.checkin)}</span>
                        </td>
                        {/* Check-out */}
                        <td className="px-3 py-1.5">
                          <span className="text-[11px] font-bold text-slate-600">{fmtDate(r.checkout)}</span>
                        </td>
                        {/* Nuitées */}
                        <td className="px-3 py-1.5 text-center">
                          <span className="text-[11px] font-black text-slate-700">{r.nights}</span>
                        </td>
                        {/* Montant + badge paiement */}
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <span className="font-black text-slate-900 text-[12px]">{r.montant.toFixed(2)} €</span>
                            {payBadge()}
                          </div>
                          {r.solde > 0 && (
                            <div className="text-[8px] font-bold text-amber-500 text-right">Solde : {r.solde.toFixed(2)} €</div>
                          )}
                        </td>
                        {/* 6. Conditions d'annulation */}
                        {(() => {
                          const cancelCfg: Record<string, { bg: string; text: string; label: string }> = {
                            flexible:         { bg: '#d1fae5', text: '#065f46', label: 'Flexible' },
                            modere:           { bg: '#ffedd5', text: '#9a3412', label: 'Modérée' },
                            stricte:          { bg: '#fee2e2', text: '#991b1b', label: 'Stricte' },
                            non_remboursable: { bg: '#fca5a5', text: '#7f1d1d', label: 'Non remb.' },
                          };
                          const cfg = cancelCfg[r.cancelPolicy || 'flexible'];
                          return (
                            <td className="px-3 py-1.5 text-center">
                              <span style={{ background: cfg.bg, color: cfg.text }} className="px-2 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap">
                                {cfg.label}
                              </span>
                            </td>
                          );
                        })()}
                        {/* Canal */}
                        <td className="px-3 py-1.5">
                          <div className="scale-90 origin-left"><SourceLogo channelName={r.canal} /></div>
                        </td>
                        {/* Chambre — room badge */}
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: 32, height: 24, borderRadius: 7, padding: '0 6px',
                              background: '#F1F5F9', border: '1px solid #E2E8F0',
                              fontSize: 10, fontWeight: 800, color: '#334155',
                              fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                            }}>
                              {r.room || '—'}
                            </div>
                            {r.roomType && (
                              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap hidden xl:inline">
                                {r.roomType}{r.roomCategory ? ` ${r.roomCategory}` : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-1.5 no-print" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handlePrintSingle(r)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              title="Imprimer"
                            ><Printer className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => handleGenerateProforma(r)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white transition-all shadow-sm"
                              title="Proforma PDF"
                            ><FileText className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => { setSelectedResaIdForAction(r.id); setIsEmailModalOpen(true); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Envoyer email"
                            ><Mail className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => { /* Dupliquer */ alert(`Duplication de ${r.id}`); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white transition-all shadow-sm"
                              title="Dupliquer"
                            ><Copy className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => { setSelectedResaIdForAction(r.id); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                              title="Modifier"
                            ><Pencil className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => { if (confirm(`Annuler ${r.id} ?`)) alert(`${r.id} annulée`); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Annuler la réservation"
                            ><Trash2 className="w-2.5 h-2.5" /></button>
                            <button
                              onClick={() => setShowLogsResaId(r.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              title="Logs des modifications"
                            ><History className="w-2.5 h-2.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                {filteredReservations.length === 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '56px 24px', textAlign: 'center',
                  }}>
                    {/* Icône avec halo */}
                    <div style={{ position: 'relative', marginBottom: 24 }}>
                      <div style={{
                        position: 'absolute', inset: -12, borderRadius: 32,
                        background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent)',
                      }} />
                      <div style={{
                        width: 72, height: 72, borderRadius: 22,
                        background: 'linear-gradient(135deg, #EDE9FE, #E0E7FF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 30, position: 'relative',
                        boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
                      }}>
                        📅
                      </div>
                    </div>
                    {/* Texte */}
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>
                      Aucune réservation trouvée
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24, maxWidth: 300, lineHeight: 1.6 }}>
                      {searchTerm
                        ? `Aucun résultat pour « ${searchTerm} ». Essayez d'ajuster vos filtres ou votre recherche.`
                        : 'Commencez par créer votre première réservation ou ajustez les filtres actifs.'}
                    </div>
                    {/* CTA */}
                    {!searchTerm && (
                      <button
                        onClick={() => setIsNewResModalOpen(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '10px 22px',
                          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                          color: 'white', border: 'none', borderRadius: 12,
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Nouvelle réservation
                      </button>
                    )}
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '9px 20px',
                          background: '#F1F5F9', color: '#475569',
                          border: '1px solid #E2E8F0', borderRadius: 12,
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        ✕ Effacer la recherche
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS (1/3) - NOW EMPTY AS IT USES GLOBAL SIDEBAR */}
    </div>
  </div>

      {/* ─── MODALE RELANCE PAIEMENT ─── */}
      <AnimatePresence>
        {reminderModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 no-print">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setReminderModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-paper-plane text-white text-sm" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Relance de paiement</h3>
                </div>
                <button onClick={() => setReminderModal(null)} className="w-8 h-8 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Infos client + montant */}
                <div className="flex gap-3">
                  <div className="flex-1 bg-violet-50 rounded-2xl p-4 border border-violet-100">
                    <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-1">Client</div>
                    <div className="font-black text-slate-900 text-sm">{reminderModal.clientName}</div>
                  </div>
                  <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Montant impayé</div>
                    <div className="font-black text-amber-700 text-sm">{reminderModal.resa.montant.toFixed(2)} €</div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email du client</label>
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={e => setReminderEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all font-medium"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    value={reminderMessage}
                    onChange={e => setReminderMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Prévisualisation lien */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-[11px] font-mono text-emerald-700">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Lien généré</span>
                  https://pay.flowtym.com/stripe/FLTM-XXXX?amount={reminderModal.resa.montant}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setReminderModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={sendReminder}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-paper-plane text-xs" />
                    Envoyer le lien
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── EMAIL MODAL ─── */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 no-print">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsEmailModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">✉️ Envoi au client</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Sélectionner le mode d'envoi et prévisualiser</p>

               <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setEmailType('standard')}
                    className={`flex-1 p-4 rounded-2xl text-left transition-all border ${emailType === 'standard' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className={`text-[8px] font-black uppercase mb-1 ${emailType === 'standard' ? 'text-white/60' : 'text-slate-400'}`}>Option 1</div>
                    <div className="text-xs font-black">Confirmation simple</div>
                  </button>

                  <button
                    onClick={() => setEmailType('payment')}
                    className={`flex-1 p-4 rounded-2xl text-left transition-all border ${emailType === 'payment' ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <div className={`text-[8px] font-black uppercase mb-1 ${emailType === 'payment' ? 'text-white/60' : 'text-slate-400'}`}>Option 2</div>
                    <div className="text-xs font-black">Lien de paiement</div>
                  </button>
               </div>

               {emailType === 'payment' && (
                 <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Montant de l'acompte</label>
                    <div className="flex gap-2">
                       {['30', '50', '100'].map(val => (
                         <button 
                           key={val}
                           onClick={() => setDepositPercent(val)}
                           className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${depositPercent === val ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                         >
                           {val}%
                         </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="flex-1 overflow-y-auto min-h-[300px] bg-slate-100 rounded-3xl p-8 font-sans text-[13px] leading-relaxed border border-slate-200">
                  {(() => {
                    const r = filteredReservations.find(resa => resa.id === selectedResaIdForAction);
                    if (!r) return "Sélectionnez une réservation...";
                    const client = clients.find(c => c.id === r.clientId);
                    const clientName = client?.name || 'Sophie Dubois';
                    const depositAmount = (r.montant * parseInt(depositPercent) / 100).toFixed(2);
                    
                    return (
                      <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200/50">
                         <div className="text-center mb-8">
                            <h2 className="text-[#8B5CF6] text-xl font-black m-0">Mas Provencal Aix</h2>
                            <p className="text-[10px] font-bold text-slate-400 m-1 uppercase tracking-widest leading-none">13100 Aix-en-Provence, France</p>
                            <div className="bg-[#8B5CF6] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-4 inline-block">✓ Réservation confirmée</div>
                         </div>

                         <div className="space-y-4 text-slate-600">
                            <p><strong>Bonjour ${clientName} !</strong></p>
                            <p>Nous sommes ravis de vous accueillir prochainement. Votre réservation a été enregistrée avec succès — retrouvez tous les détails ci-dessous.</p>
                            
                            <div className="bg-slate-50 p-6 rounded-[20px] border border-slate-100">
                               <h4 className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest mb-4">Détails du séjour</h4>
                               <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
                                  <div><strong>RÉF. PROFORMA</strong><br/><span className="font-bold text-slate-800">PF-86822215</span></div>
                                  <div><strong>CHAMBRE</strong><br/><span className="font-bold text-slate-800">${r.roomType || 'Double Classique'}</span></div>
                                  <div><strong>ARRIVÉE</strong><br/><span className="font-bold text-slate-800">mardi ${r.checkin}</span></div>
                                  <div><strong>DÉPART</strong><br/><span className="font-bold text-slate-800">vendredi ${r.checkout}</span></div>
                                  <div><strong>NUITS</strong><br/><span className="font-bold text-slate-800">${r.nights}</span></div>
                                  <div><strong>TOTAL</strong><br/><span className="font-bold text-slate-800">${r.montant.toFixed(2)}€</span></div>
                               </div>
                            </div>

                            {emailType === 'payment' && (
                              <div className="space-y-4">
                                <p className="font-bold text-slate-800">Pour finaliser votre réservation, merci d'effectuer le paiement de l'acompte (${depositPercent}%) de ${depositAmount}€ via le lien ci-dessous :</p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-primary font-bold break-all">
                                   https://pay.flowtym.com/stripe/PF-86822215
                                </div>
                              </div>
                            )}

                            <p className="text-[12px] opacity-70 italic">Pièce jointe : Facture proforma.</p>
                            <p>Cordialement,<br/><strong>L'équipe Flowtym</strong></p>
                         </div>
                      </div>
                    );
                  })()}
               </div>

               <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="flex-1 bg-white text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex-[2] bg-[#8B5CF6] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl"
                  >
                    Confirmer l'envoi
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── LOGS MODAL ─── */}
      <AnimatePresence>
        {showLogsResaId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowLogsResaId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" />
                    Logs de modification
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dossier {showLogsResaId}</p>
                </div>
                <button 
                  onClick={() => setShowLogsResaId(null)} 
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {reservationLogs.filter(l => l.reservation_id === showLogsResaId).map((log, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-primary/20 hover:bg-white transition-all text-left">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-[2px] ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 italic">{log.created_at}</span>
                    </div>
                    <div className="text-[12px] font-black text-slate-800 mb-4 flex items-center gap-2">
                       <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[10px]">👤</div>
                       Modifié par {log.user}
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      {Object.entries(log.new_values).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-xl bg-white/50 border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{key}</span>
                          <div className="flex items-center gap-3">
                            {log.old_values && (log.old_values as any)[key] !== undefined && (
                              <>
                                <span className="text-[11px] font-bold text-rose-300 line-through">{(log.old_values as any)[key]}</span>
                                <ArrowRight className="w-3 h-3 text-slate-200" />
                              </>
                            )}
                            <span className="text-[11px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">{JSON.stringify(val)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        .italic-rows td { vertical-align: middle; }

        .print-only { display: none; }
        
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          
          body, html { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
          }
          
          #root { display: block !important; }
          
          .flex-1 { height: auto !important; overflow: visible !important; }
          .flex-col { height: auto !important; overflow: visible !important; }
          
          .printing-single .main-list-container { display: none !important; }
          
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #E2E8F0 !important; padding: 10px !important; }
          
          @page {
            margin: 20mm;
          }
        }
      `}</style>

      {/* ─── FORMULAIRE NOUVELLE RÉSERVATION ─── */}
      <ReservationFormModal
        isOpen={isNewResModalOpen}
        onClose={() => setIsNewResModalOpen(false)}
        source="reservations"
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
          setIsNewResModalOpen(false);
        }}
      />
    </div>
  );
};

const Layers = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
