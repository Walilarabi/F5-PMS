import React, { useState, useEffect } from 'react';
import { 
  XCircle, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Star, 
  Clock, 
  FileText, 
  DollarSign, 
  User, 
  AlertTriangle, 
  Search, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Pencil,
  Save,
  CreditCard,
  Send,
  History,
  AlertCircle,
  Package,
  Layers,
  Euro,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SourceLogo } from './SourceLogo';
import html2pdf from 'html2pdf.js';
import { JournalDocumentsModal } from './JournalDocumentsModal';
import { supabase } from '../lib/supabase';

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface StayHistory {
  dates: string;
  room: string;
  status: string;
  amount: number;
}

interface ReservationDetailData {
  id: string;
  room: string;
  roomType: string;
  clientName: string;
  email: string;
  phone: string;
  ville: string;
  societe: string;
  isVip: boolean;
  clv: number;
  sejours: number;
  status: string;
  pension: string;
  canal: string;
  pricePerNight: number;
  nights: number;
  totalTtc: number;
  paymentStatus: string;
  preferences: string[];
  notes: string;
  transactions: Transaction[];
  history: StayHistory[];
  incidents: any[];
  lostItems: any[];
  reviews: {
    rating: number;
    comment: string;
    response?: string;
  };
}

interface ReservationDetailPanelProps {
  reservationId: string | null;
  onClose: () => void;
}

export const ReservationDetailPanel: React.FC<ReservationDetailPanelProps> = ({ 
  reservationId, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('reservation');
  const [reservation, setReservation] = useState<ReservationDetailData | null>(null);
  const [notes, setNotes] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [depositPercent, setDepositPercent] = useState('30');

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        setReservation(null);
        return;
      }

      try {
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select(`
            *,
            rooms (num, type),
            guests (name, email, phone, city, company, is_vip, clv, sejours_count)
          `)
          .eq('id', reservationId)
          .single();

        if (resError) throw resError;

        if (resData) {
          const mappedData: ReservationDetailData = {
            id: resData.id,
            room: resData.rooms?.num || 'N/A',
            roomType: resData.rooms?.type || 'N/A',
            clientName: (resData.guests?.name || 'Client Inconnu').replace(/\$/g, ''),
            email: (resData.guests?.email || '').replace(/\$/g, ''),
            phone: (resData.guests?.phone || '').replace(/\$/g, ''),
            ville: resData.guests?.city || '',
            societe: resData.guests?.company || '',
            isVip: resData.guests?.is_vip || false,
            clv: resData.guests?.clv || 0,
            sejours: resData.guests?.sejours_count || 0,
            status: resData.status || 'Confirmée',
            pension: resData.pension || 'Hébergement seul',
            canal: resData.canal || 'Direct',
            pricePerNight: resData.montant ? (resData.montant / 1) : 0, // Simplified
            nights: 1, // Simplified
            totalTtc: resData.montant || 0,
            paymentStatus: resData.payment_status || 'Non payé',
            preferences: resData.preferences || [],
            notes: resData.notes || '',
            transactions: [],
            history: [],
            incidents: [],
            lostItems: [],
            reviews: {
              rating: 5,
              comment: "Pas encore d'avis."
            }
          };
          setReservation(mappedData);
          setNotes(mappedData.notes);
        }
      } catch (error) {
        console.error('Error fetching reservation from Supabase:', error);
        // Fallback : chercher dans le store Zustand via window (réservations en mémoire)
        const storeResas: any[] = (window as any).__flowtymReservations || [];
        const storeResa = storeResas.find((r: any) => r.id === reservationId);

        const mockData: ReservationDetailData = {
          id: reservationId,
          room: storeResa?.room || storeResa?.roomNumber || '—',
          roomType: storeResa?.roomType || 'Double Classique',
          clientName: (storeResa?.guestName || 'Client').replace(/\$/g, ''),
          email: (storeResa?.email || storeResa?.guest_email || '').replace(/\$/g, ''),
          phone: (storeResa?.phone || '').replace(/\$/g, ''),
          ville: storeResa?.city || '',
          societe: storeResa?.company || '',
          isVip: false,
          clv: 0,
          sejours: 1,
          status: storeResa?.status || 'confirmed',
          pension: storeResa?.board || 'Hébergement seul',
          canal: storeResa?.canal || storeResa?.source || 'Direct',
          pricePerNight: storeResa ? (storeResa.montant || 0) / Math.max(storeResa.nights || 1, 1) : 0,
          nights: storeResa?.nights || 1,
          totalTtc: storeResa?.montant || storeResa?.total_amount || 0,
          paymentStatus: storeResa?.paymentStatus || storeResa?.payment_status || 'En attente',
          preferences: storeResa?.preferences || [],
          notes: storeResa?.notes || '',
          transactions: [],
          history: [],
          incidents: [],
          lostItems: [],
          reviews: {
            rating: 5,
            comment: "Pas encore d'avis."
          }
        };
        setReservation(mockData);
        setNotes(mockData.notes);
      }
    };

    fetchReservation();
  }, [reservationId]);

  if (!reservationId || !reservation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white h-full no-print">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm uppercase tracking-widest mb-2">Aucune sélection</h3>
        <p className="text-slate-400 text-xs font-medium max-w-[200px] leading-relaxed italic opacity-70">
          Sélectionnez une réservation pour voir les détails et gérer le dossier.
        </p>
      </div>
    );
  }

  const handleGenerateProforma = (download = true) => {
    if (!reservation) return;
    
    // Create high-fidelity template identical to the user's request
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="max-width:800px; margin:0 auto; padding:40px; font-family:'Inter',sans-serif; color:#1e293b; background:white;">
        <div style="text-align:center; margin-bottom:40px;">
          <h1 style="color:#8B5CF6; font-size:36px; margin:0; font-weight:800; letter-spacing:-1px;">FLOWTYM</h1>
          <p style="color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:2px; margin-top:5px;">Mas Provencal Aix - 13100 Aix-en-Provence</p>
          <h2 style="color:#1e293b; font-size:20px; font-weight:800; margin-top:30px; text-transform:uppercase; letter-spacing:1px;">FACTURE PROFORMA</h2>
          <p style="color:#64748b; font-size:12px; font-weight:700;"><strong>N° PF-86822215</strong> Émise le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div style="background:#f8fafc; padding:24px; border-radius:16px; border:1px solid #e2e8f0; margin-bottom:24px;">
          <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px;">INFORMATIONS CLIENT</h3>
          <p style="font-weight:800; font-size:16px; margin:0; color:#0f172a;"><span class="fi fi-fr" style="width:1.2rem;height:1.2rem;border-radius:2px;margin-right:8px;vertical-align:middle;display:inline-block;"></span>${reservation.clientName}</p>
          <p style="margin:5px 0; font-size:13px; color:#64748b; font-weight:500;">${reservation.email}</p>
          <p style="margin:0; font-size:13px; color:#64748b; font-weight:500;">${reservation.phone}</p>
        </div>

        <div style="background:#f8fafc; padding:24px; border-radius:16px; border:1px solid #e2e8f0; margin-bottom:24px;">
          <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px;">DÉTAILS DU SÉJOUR</h3>
          <table style="width:100%; font-size:12px; font-weight:600; border-spacing:0 8px; border-collapse:separate;">
            <tr>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">ARRIVÉE</span><br>2026-04-07</td>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">DURÉE</span><br>${reservation.nights} Nuits</td>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">CATÉGORIE</span><br>${reservation.roomType}</td>
            </tr>
            <tr>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">DÉPART</span><br>2026-04-10</td>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">PERSONNES</span><br>2 adultes</td>
              <td><span style="color:#64748b; font-size:9px; text-transform:uppercase;">CHAMBRE</span><br>#${reservation.room}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding-top:10px; border-top:1px solid #e2e8f0;">
                <span style="font-weight:700; color:#1e293b;">PENSION</span> Room Only &nbsp; 
                <span style="font-weight:700; color:#1e293b; margin-left:20px;">TARIF</span> Flexible
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom:30px;">
          <h3 style="color:#8B5CF6; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:2px; margin-bottom:15px;">DÉTAIL DES PRESTATIONS</h3>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:12px; text-align:left; font-size:10px; font-weight:800;">Date</th>
                <th style="padding:12px; text-align:center; font-size:10px; font-weight:800;">Qté</th>
                <th style="padding:12px; text-align:left; font-size:10px; font-weight:800;">Description</th>
                <th style="padding:12px; text-align:right; font-size:10px; font-weight:800;">PU HT</th>
                <th style="padding:12px; text-align:right; font-size:10px; font-weight:800;">PU TTC</th>
                <th style="padding:12px; text-align:right; font-size:10px; font-weight:800;">Total</th>
              </tr>
            </thead>
            <tbody style="font-size:11px; font-weight:700;">
              <tr>
                <td style="padding:12px; border-bottom:1px solid #f1f5f9;">07/04/2026</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid #f1f5f9;">${reservation.nights}</td>
                <td style="padding:12px; border-bottom:1px solid #f1f5f9;">Nuitée — Double Classique</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">90.00€</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">99.00€</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">${(reservation.nights * 99).toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding:12px; border-bottom:1px solid #f1f5f9;">07/04/2026</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid #f1f5f9;">6</td>
                <td style="padding:12px; border-bottom:1px solid #f1f5f9;">Taxe de séjour</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">2.50€</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">2.50€</td>
                <td style="padding:12px; text-align:right; border-bottom:1px solid #f1f5f9;">15.00€</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="text-align:right; margin-left:auto; width:280px; padding:20px; background:#f8fafc; border-radius:16px; border:1px solid #e2e8f0;">
          <p style="font-size:11px; margin:5px 0;">Sous-total HT: ${(reservation.totalTtc * 0.9).toFixed(2)}€</p>
          <p style="font-size:11px; margin:5px 0;">TVA (10%): ${(reservation.totalTtc * 0.08).toFixed(2)}€</p>
           <p style="font-size:11px; margin:5px 0;">T. Séjour: 15.00€</p>
           <div style="border-top:1px solid #e2e8f0; margin-top:10px; padding-top:10px;">
             <div style="background:#EDE9FE; border-radius:10px; padding:6px 12px; display:inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
               <span style="font-size:0.65rem; color:#5b21b6; margin-right:6px; font-weight:700;">TOTAL TTC :</span>
               <span style="color:#6d28d9; font-weight:700; font-size:1rem;">${reservation.totalTtc.toFixed(2)}€</span>
             </div>
           </div>
        </div>

        <div style="margin-top:30px; padding:20px; background:#fffbeb; border:1px solid #fef3c7; border-radius:16px; position:relative;">
          <p style="font-size:12px; font-weight:800; color:#b45309; margin-bottom:8px;">☒ CONDITION D'ANNULATION</p>
          <p style="font-size:12px; font-weight:600; color:#d97706; line-height:1.6; margin:0;">
            Flexible — Annulation gratuite jusqu'à 72h avant. Cette facture proforma est valable 7 jours. Tout séjour confirmé fait l'objet d'un acompte de 30% du montant total.
          </p>
        </div>

        <div style="margin-top:50px; font-size:10px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:24px;">
          <p style="font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">Flowtym PMS · Mas Provencal Aix · proforma@flowtym.com · +33 4 00 00 00 00</p>
          <p>Document non contractuel — TVA intracommunautaire FR00 000 000 000 — SIRET 000 000 000 00000</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Proforma_PF-86822215.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    if (download) {
      html2pdf().set(opt).from(element).save();
    } else {
      return html2pdf().set(opt).from(element).outputPdf('blob');
    }
  };

  const handleSendEmail = (withLink = false) => {
    if (!reservation) return;
    const type = withLink ? "avec lien de paiement" : "de confirmation";
    
    let body = `Bonjour ${reservation.clientName},\n\nNous sommes ravis de vous accueillir prochainement au Mas Provencal Aix.\n\nVotre réservation a été enregistrée avec succès.\nDétails du séjour :\n- Dates : 12 avr. – 15 avr. 2024 (3 nuits)\n- Chambre : #${reservation.room} - ${reservation.roomType}\n- Pension : ${reservation.pension}\n- Montant total : ${reservation.totalTtc.toFixed(2)}€\n\n`;

    if (withLink) {
      body += `Pour finaliser votre réservation, merci d'effectuer le paiement de l'acompte (30% soit ${(reservation.totalTtc * 0.3).toFixed(2)}€) via le lien sécurisé ci-dessous :\n🔗 https://pay.flowtym.com/stripe/PF-${reservation.id}\n\n`;
    }

    body += `Vous trouverez ci-joint la facture proforma correspondante.\n\nCordialement,\nL'équipe Flowtym`;

    console.log(`Envoi email ${type} à ${reservation.email}...\n\n${body}`);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Email envoyé · ${reservation.email}` } }));
      if (withLink) setIsPaymentModalOpen(false);
    }, 800);
  };

  // Sub-components for tabs
  const ReservationTab = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 space-y-2">
        <h4 className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest border-b border-[#8B5CF6]/10 pb-1.5 mb-2">INFORMATIONS CLIENT</h4>
        <p className="text-[12px] text-slate-700"><strong>{reservation.clientName}</strong><br/>{reservation.email}<br/>{reservation.phone}</p>
      </div>

      <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-100">
        <h4 className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest border-b border-[#8B5CF6]/10 pb-1.5 mb-2">DÉTAILS DU SÉJOUR</h4>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px]">
          <div><strong className="text-slate-400 text-[9px] uppercase">ARRIVÉE</strong><br/><span className="font-bold text-slate-700">2026-04-07</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">DÉPART</strong><br/><span className="font-bold text-slate-700">2026-04-10</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">Durée</strong><br/><span className="font-bold text-slate-700">{reservation.nights} nuits</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">PERSONNES</strong><br/><span className="font-bold text-slate-700">2 adultes</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">Catégorie</strong><br/><span className="font-bold text-slate-700">{reservation.roomType}</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">Chambre</strong><br/><span className="font-bold text-slate-700">{reservation.room}</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">PENSION</strong><br/><span className="font-bold text-slate-700">Room Only</span></div>
          <div><strong className="text-slate-400 text-[9px] uppercase">TARIF</strong><br/><span className="font-bold text-slate-700">Flexible</span></div>
        </div>
      </div>

      <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-100">
        <h4 className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest border-b border-[#8B5CF6]/10 pb-1.5 mb-2">RÉCAPITULATIF FINANCIER</h4>
        <div className="space-y-0.5 text-[11px] text-slate-600">
           <p>Sous-total HT: {(reservation.totalTtc / 1.1).toFixed(2)}€</p>
           <p>TVA 10%: {(reservation.totalTtc - (reservation.totalTtc / 1.1)).toFixed(2)}€</p>
           <p>Taxe séjour: 15.00€</p>
           <div className="bg-[#EDE9FE] rounded-lg px-2 py-0.5 shadow-sm mt-1.5 inline-block">
             <span className="text-[9px] font-black text-[#5b21b6] mr-1 uppercase tracking-widest">Total TTC :</span>
             <span className="text-[13px] font-black text-[#6d28d9] tracking-tight">{reservation.totalTtc.toFixed(2)} €</span>
           </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md ring-1 ring-slate-100">
        <div className="flex justify-between items-center mb-2">
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">📝 NOTES INTERNES</div>
           <button 
             onClick={() => console.log("Saving notes:", notes)}
             className="px-3 py-1 bg-primary text-white text-[8px] font-black rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
           >
             <Save className="w-2.5 h-2.5" /> Enregistrer
           </button>
        </div>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter une instruction..."
          className="w-full min-h-[60px] bg-transparent text-[11px] font-medium text-slate-600 border-none p-0 focus:ring-0 resize-none placeholder:text-slate-300 placeholder:italic"
        />
      </div>
    </motion.div>
  );

  const FacturationTab = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-4">
         <button 
           onClick={() => handleGenerateProforma(true)}
           className="bg-[#8B5CF6] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
         >
            📄 Facture Proforma
         </button>
         <button 
           onClick={() => setIsPaymentModalOpen(true)}
           className="bg-[#1e293b] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
         >
            ✉️ Envoyer
         </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-center">Qté</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">PU HT</th>
                <th className="px-6 py-3 text-right">PU TTC</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 italic-rows">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-400">12/04/2024</td>
                <td className="px-6 py-4 text-center font-black">{reservation.nights}</td>
                <td className="px-6 py-4 font-bold text-slate-700">Nuitée — {reservation.roomType}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-500">90.00€</td>
                <td className="px-6 py-4 text-right font-bold text-slate-500">99.00€</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">{(reservation.nights * 99).toFixed(2)} €</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-400">12/04/2024</td>
                <td className="px-6 py-4 text-center font-black">6</td>
                <td className="px-6 py-4 font-bold text-slate-700">Taxe de séjour</td>
                <td className="px-6 py-4 text-right font-bold text-slate-500">2.50€</td>
                <td className="px-6 py-4 text-right font-bold text-slate-500">2.50€</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">15.00 €</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col items-end gap-2 text-right">
           <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sous-total HT: {(reservation.totalTtc * 0.9).toFixed(2)}€</div>
           <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">TVA 10%: {(reservation.totalTtc * 0.08).toFixed(2)}€</div>
           <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Taxe séjour: 15.00€</div>
           <div className="bg-[#EDE9FE] rounded-[10px] px-3 py-1.5 shadow-sm mt-3 inline-block">
             <span className="text-[10px] font-black text-[#5b21b6] mr-1.5 uppercase tracking-widest">TOTAL TTC :</span>
             <span className="text-[15px] font-black text-[#6d28d9] tracking-tight">{(reservation.totalTtc + 15).toFixed(2)} €</span>
           </div>
        </div>
      </div>
    </motion.div>
  );

  const CardexTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-12 h-12 rounded-[20px] bg-violet-100 text-violet-600 flex items-center justify-center font-black text-lg">
             {reservation.clientName.charAt(0)}
           </div>
           <div>
             <h3 className="text-base font-black text-slate-800">{reservation.clientName}</h3>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Fidèle · {reservation.sejours} séjours</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nationalité</div>
              <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="fi fi-fr text-lg rounded-sm shadow-sm" style={{ width:'1.2rem', height:'1.2rem' }}></span> Française
              </div>
           </div>
           <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dernière visite</div>
              <div className="text-sm font-bold text-slate-700">Octobre 2025</div>
           </div>
        </div>

        <div className="space-y-4">
           <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 px-2">Préférences & Besoins</div>
           <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] font-bold text-amber-700 italic leading-relaxed">
             "Préfère un étage élevé, loin de l'ascenseur. Allergique aux arachides. Demande souvent des oreillers supplémentaires."
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Historique des séjours</div>
        {reservation.history.map((h, i) => (
          <div key={i} className="flex gap-4 group px-2">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-slate-300 mt-1 shadow-sm group-hover:bg-primary transition-colors" />
              <div className="flex-1 w-[1px] bg-slate-100 my-1" />
            </div>
            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 group-hover:border-primary/20 transition-all shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.dates}</div>
                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Terminé</div>
               </div>
               <div className="flex justify-between items-end">
                  <div>
                     <div className="text-xs font-black text-slate-800 uppercase tracking-tight">Chambre {h.room}</div>
                  </div>
                  <div className="text-sm font-black text-slate-900">{h.amount.toFixed(2)} €</div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const StatusPlaceholder = ({ icon: Icon, title, subtitle, btnLabel }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
    >
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-slate-200" />
      </div>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic text-center">{title}</h4>
      <p className="text-xs font-medium text-slate-300 max-w-[200px] leading-relaxed mb-8 opacity-60 italic text-center mx-auto">{subtitle}</p>
      {btnLabel && (
        <button className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm">
           {btnLabel}
        </button>
      )}
    </motion.div>
  );

  const IncidentsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {reservation.incidents.length === 0 ? (
        <StatusPlaceholder 
           icon={AlertCircle} 
           title="Zéro incident" 
           subtitle="Dossier parfaitement sain. Aucun incident technique ou nuisance signalé sur ce séjour."
           btnLabel="+ Déclarer incident"
        />
      ) : (
        <div className="space-y-3">
           {reservation.incidents.map((inc: any) => (
              <div key={inc.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-slate-800 leading-tight">{inc.title}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{inc.date}</p>
                    </div>
                 </div>
                 <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">Résolu</span>
              </div>
           ))}
        </div>
      )}
    </motion.div>
  );

  const LostTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
       <StatusPlaceholder 
         icon={Package} 
         title="Objets trouvés" 
         subtitle="Rien n'a été oublié dans la chambre ou restitué à ce jour."
         btnLabel="+ Ajouter objet"
       />
    </motion.div>
  );

  const AvisTab = () => (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
       <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
             <Star className="w-20 h-20 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-center gap-1.5 mb-4">
             {[1,2,3,4,5].map(i => (
               <Star key={i} className={`w-4 h-4 ${i <= Math.floor(reservation.reviews.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
             ))}
             <span className="ml-3 text-xs font-black text-slate-800 uppercase tracking-widest">{reservation.reviews.rating}/5.0 EXCEPTIONNEL</span>
          </div>
          <div className="relative z-10">
             <p className="text-sm font-bold text-slate-600 italic leading-relaxed mb-6">"{reservation.reviews.comment}"</p>
             <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100">
                <div className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-1 leading-none">Réponse hôtelier</div>
                <p className="text-[11px] font-bold text-violet-400 italic">"{reservation.reviews.response}"</p>
             </div>
          </div>
       </div>
    </motion.div>
  );

  const tabs = [
    { id: 'reservation', label: 'Réservation', icon: FileText },
    { id: 'facturation', label: 'Facturation', icon: DollarSign },
    { id: 'cardex',      label: 'Cardex',      icon: User },
    { id: 'incidents',   label: 'Incidents',   icon: AlertTriangle },
    { id: 'objets',      label: 'Objets oubliés', icon: Search },
    { id: 'avis',        label: 'Avis',        icon: Star }
  ];

  return (
    <AnimatePresence>
      {reservationId && reservation && (
        <div className="fixed inset-0 z-[500] flex justify-end no-print">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2C2A4A]/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[620px] bg-white shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* ─── HEADER ─── */}
            <div className="bg-[#8B5CF6] shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Layers className="w-32 h-32 rotate-12" />
              </div>

              <div className="flex justify-between items-center p-5 relative z-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                      {reservation.id}
                    </span>
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                      {reservation.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span className="opacity-70 text-sm"><Layers className="w-4 h-4 inline" /></span>
                    CHAMBRE {reservation.room} — {reservation.roomType}
                  </h3>
                  <p className="text-sm font-bold text-white/90 uppercase tracking-wide">
                    {reservation.clientName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                          >
                            <button className="w-full px-4 py-3 text-left text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors edit-reservation-btn">
                              <Pencil className="w-4 h-4" /> Modifier
                            </button>
                            <button className="w-full px-4 py-3 text-left text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                              <Copy className="w-4 h-4" /> Dupliquer
                            </button>
                            <button className="w-full px-4 py-3 text-left text-[11px] font-black uppercase text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors">
                              <Trash2 className="w-4 h-4" /> Annuler
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-white flex items-center justify-center"
                    title="Fermer"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-4 flex flex-wrap gap-1.5 relative z-10">
                <SourceLogo channelName={reservation.canal} className="bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/5" />
                {reservation.isVip && (
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 rounded-full shadow-lg">
                    <Star className="w-2.5 h-2.5 text-white fill-white" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">VIP GOLD</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/50">CLV:</span>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">{reservation.clv.toLocaleString()} €</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                  <span className="text-[7px] font-black uppercase tracking-widest text-white/50">SÉJOURS:</span>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">{reservation.sejours} Dossiers</span>
                </div>

                <button 
                  onClick={() => setIsJournalModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-[#1e293b] hover:bg-black text-white px-2 py-0.5 rounded-full shadow-lg transition-all border border-white/10 group"
                >
                  <History className="w-2.5 h-2.5 group-hover:rotate-[-45deg] transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Journal</span>
                </button>
              </div>
            </div>

      {/* ─── TABS ─── */}
      <div 
        className="flex border-b border-slate-200 shrink-0 bg-white overflow-x-auto no-scrollbar scroll-smooth"
        role="tablist"
        aria-label="Informations de réservation"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`flex-1 min-w-fit px-2 py-3 text-[8px] font-black uppercase tracking-[1px] relative transition-all whitespace-nowrap ${isActive ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <Icon className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-[#8B5CF6] scale-110' : 'text-slate-300'}`} />
                {tab.label}
              </div>
              {isActive && (
                <motion.div 
                  layoutId="resDetailUnderline" 
                  className="absolute bottom-0 left-3 right-3 h-[4px] bg-[#8B5CF6] rounded-t-full shadow-[0_-2px_8_rgba(139,92,246,0.3)]" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'reservation' && <ReservationTab key="reservation" />}
          {activeTab === 'facturation' && <FacturationTab key="facturation" />}
          {activeTab === 'cardex' && <CardexTab key="cardex" />}
          {activeTab === 'incidents' && <IncidentsTab key="incidents" />}
          {activeTab === 'objets' && <LostTab key="lost" />}
          {activeTab === 'avis' && <AvisTab key="avis" />}
        </AnimatePresence>
      </div>
          </motion.div>
        </div>
      )}

      {/* Payment Link Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setIsPaymentModalOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <CreditCard className="w-24 h-24" />
               </div>

               <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Lien de paiement</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Générer une demande d'acompte</p>

               <div className="space-y-6">
                  <div>
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block text-center">Sélectionner un montant</label>
                     <div className="flex justify-between gap-2">
                        {['30', '50', '100'].map(val => (
                          <button
                            key={val}
                            onClick={() => setDepositPercent(val)}
                            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${depositPercent === val ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                          >
                            {val}%
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Montant Acompte</span>
                        <span className="text-lg font-black text-slate-900">
                          {((reservation.totalTtc * parseInt(depositPercent)) / 100).toFixed(2)} €
                        </span>
                     </div>
                     <div className="text-[9px] font-bold text-slate-400 uppercase italic">Calculé sur le total TTC de {reservation.totalTtc.toFixed(2)}€</div>
                  </div>

                  <div className="flex flex-col gap-3">
                     <div className="bg-slate-900 rounded-3xl p-6 text-emerald-400 font-mono text-[10px] leading-relaxed relative mb-2">
                        <div className="absolute top-3 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest">Aperçu du message</div>
                        <div className="whitespace-pre-wrap italic">
                          {`Objet : Réservation confirmée - Lien de paiement\n\nBonjour ${reservation.clientName},\n\nNous sommes ravis de vous accueillir prochainement.\n\nDétails du séjour :\n- Chambre : #${reservation.room}\n- Montant : ${(reservation.totalTtc + (reservation.nights * 2 * 2.5)).toFixed(2)}€\n- Acompte ${depositPercent}% : ${((reservation.totalTtc * parseInt(depositPercent)) / 100).toFixed(2)} €\n\nPour finaliser, payez via :\n🔗 https://pay.flowtym.com/stripe/PF-${reservation.id}`}
                        </div>
                     </div>
                     <button
                       onClick={() => handleSendEmail(true)}
                       className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                     >
                       Générer & Envoyer
                     </button>
                     <button
                       onClick={() => setIsPaymentModalOpen(false)}
                       className="w-full bg-white text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                     >
                       Annuler
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <JournalDocumentsModal 
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        reservationId={reservationId}
        reservationName={reservation.clientName}
      />
    </AnimatePresence>
  );
};
