import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Send,
  ArrowRight,
  TrendingUp,
  Percent,
  Euro,
  User,
  Mail,
  Zap,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Archive,
  Copy,
  ExternalLink,
  Phone,
  Calendar,
  AlertTriangle,
  GripVertical,
  Settings,
  List,
  Coins,
  ShieldCheck,
  Tag,
  Lock,
  Utensils,
  Repeat,
  Printer,
  X,
  Check,
  Sliders,
  Tags,
  LayoutGrid,
  DoorOpen,
  Info,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── CONSTANTS ───

const TODAY = new Date().toISOString().slice(0, 10);

const SIM_RATE_PLANS: Record<string, Record<string, Record<string, number>>> = {
  room_only: {
    'double-classique': { non_refundable: 79,  flexible: 99  },
    'twin-classique':   { non_refundable: 75,  flexible: 95  },
    'double-deluxe':    { non_refundable: 115, flexible: 145 },
    'suite':            { non_refundable: 199, flexible: 249 },
    'single':           { non_refundable: 59,  flexible: 75  },
  },
  bed_breakfast: {
    'double-classique': { non_refundable: 95,  flexible: 115 },
    'twin-classique':   { non_refundable: 89,  flexible: 109 },
    'double-deluxe':    { non_refundable: 135, flexible: 165 },
    'suite':            { non_refundable: 229, flexible: 279 },
    'single':           { non_refundable: 72,  flexible: 88  },
  },
};

const SIM_ROOM_TYPES = [
  { value: 'double-classique', label: 'Double Classique' },
  { value: 'twin-classique',   label: 'Twin Classique' },
  { value: 'double-deluxe',    label: 'Double Deluxe' },
  { value: 'suite',            label: 'Suite' },
  { value: 'single',           label: 'Single' },
];

const STATUS_CFG: Record<string, { lbl: string; cls: string }> = {
  draft:    { lbl: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  sent:     { lbl: 'Envoyé',    cls: 'bg-blue-100 text-blue-600' },
  accepted: { lbl: 'Accepté',   cls: 'bg-emerald-100 text-emerald-600' },
  expired:  { lbl: 'Expiré',    cls: 'bg-rose-100 text-rose-600' },
  converted:{ lbl: 'Converti',  cls: 'bg-emerald-500 text-white' },
  devis:    { lbl: 'Devis',     cls: 'bg-amber-100 text-amber-600' },
  proforma: { lbl: 'Proforma',  cls: 'bg-indigo-100 text-indigo-600' },
};

// ─── TYPES ───

interface SimLine {
  id: number;
  roomType: string;
  quantity: number;
  arrival: string;
  departure: string;
  nights?: number;
}

interface Simulation {
  id: string;
  clientName: string;
  contact: string;
  phone?: string;
  amount: number;
  amountHT: number;
  status: string;
  conversion: number;
  nights: number;
  rooms: number;
  valid: string;
  notes?: string;
  message?: string;
  lines: SimLine[];
  conf: any;
  createdAt: string;
  isGroup?: boolean;
  promo?: any;
}

interface SimulationsProps {
  simulations: Simulation[];
  onUpdateSimulation?: (sim: Simulation) => void;
  onAddSimulation?: (sim: Simulation) => void;
  onConvertToReservation?: (resa: any) => void;
}

// ─── HELPERS ───

const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val);

export const Simulations: React.FC<SimulationsProps> = ({ 
  simulations, 
  onUpdateSimulation, 
  onAddSimulation,
  onConvertToReservation 
}) => {
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Builder State
  const [simLines, setSimLines] = useState<SimLine[]>([]);
  const [simIdEdit, setSimIdEdit] = useState<string | null>(null);
  const [builderConf, setBuilderConf] = useState({
    rateOpt: 'room_only',
    cancelOpt: 'non_refundable',
    promoVal: '',
    vat: 10,
    cityTax: 2.5,
    groupThr: 5,
    validity: 7,
    expirationDate: '',
    status: 'draft',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    message: 'Bonjour,\n\nVeuillez trouver ci-joint notre proposition de séjour.\nAu plaisir de vous accueillir bientôt,\nL\'équipe Flowtym',
    notes: ''
  });

  // ─── INIT BUILDER ───
  const startNewSim = () => {
    setSimIdEdit(null);
    const arrival = '2026-07-10';
    const nights = 5;
    const depDate = new Date(arrival);
    depDate.setDate(depDate.getDate() + nights);
    const departure = depDate.toISOString().slice(0, 10);
    
    setSimLines([{ id: Date.now(), roomType: 'double-classique', quantity: 1, arrival, departure, nights }]);
    setBuilderConf({
      ...builderConf,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      status: 'draft',
      promoVal: '',
      expirationDate: ''
    });
    setView('builder');
  };

  const editSim = (sim: Simulation) => {
    setSimIdEdit(sim.id);
    const linesWithNights = sim.lines.map(l => {
      const start = new Date(l.arrival).getTime();
      const end = new Date(l.departure).getTime();
      const nights = Math.max(0, Math.round((end - start) / 86400000));
      return { ...l, nights };
    });
    setSimLines(linesWithNights.length > 0 ? linesWithNights : [{ id: Date.now(), roomType: 'double-classique', quantity: 1, arrival: '2026-07-10', departure: '2026-07-15', nights: 5 }]);
    setBuilderConf({
      rateOpt: sim.conf?.rateOpt || 'room_only',
      cancelOpt: sim.conf?.cancelOpt || 'non_refundable',
      promoVal: sim.conf?.promoVal || '',
      vat: sim.conf?.vat || 10,
      cityTax: sim.conf?.cityTax || 2.5,
      groupThr: sim.conf?.groupThr || 5,
      validity: sim.conf?.validity || 7,
      expirationDate: sim.valid || '',
      status: sim.status,
      clientName: sim.clientName,
      clientEmail: sim.contact,
      clientPhone: sim.phone || '',
      message: sim.message || builderConf.message,
      notes: sim.notes || ''
    });
    setView('builder');
  };

  const updateLineDates = (idx: number, type: 'arrival' | 'departure' | 'nights', value: string | number) => {
    const nl = [...simLines];
    const line = { ...nl[idx] };
    
    if (type === 'arrival') {
      line.arrival = value as string;
      if (line.nights !== undefined) {
        const d = new Date(line.arrival);
        d.setDate(d.getDate() + line.nights);
        line.departure = d.toISOString().slice(0, 10);
      }
    } else if (type === 'departure') {
      line.departure = value as string;
      const start = new Date(line.arrival).getTime();
      const end = new Date(line.departure).getTime();
      line.nights = Math.max(0, Math.round((end - start) / 86400000));
    } else if (type === 'nights') {
      line.nights = Math.max(0, parseInt(value as string) || 0);
      const d = new Date(line.arrival);
      d.setDate(d.getDate() + line.nights);
      line.departure = d.toISOString().slice(0, 10);
    }
    
    nl[idx] = line;
    setSimLines(nl);
  };

  // ─── CALCULATIONS ───
  const builderResults = useMemo(() => {
    let subtotal = 0;
    let totalNights = 0;
    let totalRooms = 0;

    simLines.forEach(l => {
      const start = new Date(l.arrival).getTime();
      const end = new Date(l.departure).getTime();
      const autoNights = Math.max(0, Math.round((end - start) / 86400000));
      const nights = l.nights !== undefined ? l.nights : autoNights;
      if (nights <= 0 && l.nights === undefined) return;
      
      const rate = SIM_RATE_PLANS[builderConf.rateOpt]?.[l.roomType]?.[builderConf.cancelOpt] || 79;
      subtotal += rate * l.quantity * nights;
      totalNights += nights * l.quantity;
      totalRooms += l.quantity;
    });

    let promoAmt = 0;
    let promoLabel = '';
    if (builderConf.promoVal === '-5') { promoAmt = subtotal * 0.05; promoLabel = '−5% appliqué'; subtotal *= 0.95; }
    else if (builderConf.promoVal === '-10') { promoAmt = subtotal * 0.10; promoLabel = '−10% appliqué'; subtotal *= 0.90; }
    else if (builderConf.promoVal === '-15') { promoAmt = subtotal * 0.15; promoLabel = '−15% appliqué'; subtotal *= 0.85; }
    else if (builderConf.promoVal === '-20') { promoAmt = subtotal * 0.20; promoLabel = '−20% appliqué'; subtotal *= 0.80; }
    else if (builderConf.promoVal === '1_night') {
      if (totalNights > 0) { promoAmt = subtotal / totalNights; subtotal -= promoAmt; promoLabel = '1 nuit offerte'; }
    } else if (builderConf.promoVal === '1_room') {
      if (totalRooms > 0) { promoAmt = subtotal / totalRooms; subtotal -= promoAmt; promoLabel = '1 chambre offerte'; }
    }

    const vatAmt = subtotal * (builderConf.vat / 100);
    const cityTaxAmt = builderConf.cityTax * totalNights;
    const total = subtotal + vatAmt + cityTaxAmt;
    const isGroup = totalRooms >= builderConf.groupThr;

    return {
      subtotal,
      vatAmt,
      cityTaxAmt,
      total,
      totalNights,
      totalRooms,
      isGroup,
      promoAmt,
      promoLabel
    };
  }, [simLines, builderConf]);

  // ─── LIST STATS ───
  const listStats = useMemo(() => {
    const totalRevenue = simulations.reduce((sum, s) => sum + s.amount, 0);
    const converted = simulations.filter(s => s.status === 'converted' || s.status === 'accepted').length;
    const conversionRate = simulations.length > 0 ? Math.round((converted / simulations.length) * 100) : 0;
    
    return [
      { label: 'DEVIS EN COURS', value: simulations.filter(s => s.status === 'devis' || s.status === 'draft').length, color: '#f59e0b' },
      { label: 'ENVOYÉS', value: simulations.filter(s => s.status === 'sent' || s.status === 'proforma').length, color: '#3b82f6' },
      { label: 'ACCEPTÉS', value: converted, color: '#10b981' },
      { label: 'CA DEVIS', value: formatCurrency(totalRevenue), color: '#8B5CF6' },
      { label: 'TAUX CONVERSION', value: `${conversionRate}%`, color: '#f43f5e' }
    ];
  }, [simulations]);

  const filteredSims = useMemo(() => {
    return simulations.filter(s => {
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesStatus;
    });
  }, [simulations, statusFilter]);

  // ─── BUILDER ACTIONS ───
  const saveSim = () => {
    if (!builderConf.clientName.trim()) return;
    
    let validUntilStr = '';
    if (builderConf.expirationDate) {
      validUntilStr = builderConf.expirationDate;
    } else {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + builderConf.validity);
      validUntilStr = validUntil.toISOString().slice(0, 10);
    }

    const newSim: Simulation = {
      id: simIdEdit || `SIM-${Date.now()}`,
      clientName: builderConf.clientName,
      contact: builderConf.clientEmail,
      phone: builderConf.clientPhone,
      amount: builderResults.total,
      amountHT: builderResults.subtotal / (1 + builderConf.vat / 100),
      status: builderConf.status,
      conversion: builderConf.status === 'accepted' ? 100 : 0,
      nights: builderResults.totalNights,
      rooms: builderResults.totalRooms,
      valid: validUntilStr,
      notes: builderConf.notes,
      message: builderConf.message,
      lines: JSON.parse(JSON.stringify(simLines)),
      conf: JSON.parse(JSON.stringify({ ...builderConf })),
      promo: { label: builderResults.promoLabel, amount: builderResults.promoAmt, type: builderConf.promoVal },
      createdAt: new Date().toISOString(),
      isGroup: builderResults.isGroup
    };

    if (simIdEdit) {
      if (onUpdateSimulation) onUpdateSimulation(newSim);
    } else {
      if (onAddSimulation) onAddSimulation(newSim);
    }
    setView('list');
  };

  const duplicateSim = (sim: Simulation) => {
    const copy = {
      ...JSON.parse(JSON.stringify(sim)),
      id: `SIM-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'draft',
      conversion: 0,
      clientName: `${sim.clientName} (copie)`
    };
    if (onAddSimulation) onAddSimulation(copy);
  };

  const convertToResa = (sim: Simulation) => {
    if (!onConvertToReservation) return;
    if (sim.lines && sim.lines.length > 0) {
      const line = sim.lines[0];
      const nights = Math.max(1, Math.round((new Date(line.departure).getTime() - new Date(line.arrival).getTime()) / 86400000));
      
      onConvertToReservation({
        guestName: sim.clientName,
        email: sim.contact,
        phone: sim.phone,
        total: sim.amount,
        checkin: line.arrival,
        checkout: line.departure,
        nights,
        room: '101',
        canal: 'Direct',
      });

      if (onUpdateSimulation) {
        onUpdateSimulation({ ...sim, status: 'converted', conversion: 100 });
      }
    }
  };

  // ─── PDF EXPORT ───
  const handleExportPDF = () => {
    const d = builderResults;
    const conf = builderConf;
    const name = conf.clientName || 'Client';
    const id = simIdEdit || `SIM-${Date.now()}`;
    const isProforma = builderConf.status === 'proforma';
    const title = isProforma ? 'FACTURE PROFORMA' : 'PROPOSITION COMMERCIALE';
    
    // Calculate validity date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + conf.validity);
    const validStr = validUntil.toLocaleDateString('fr-FR');
    
    const f2 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + '€';
    
    const pdfWin = window.open('', '_blank', 'width=900,height=1000');
    if (!pdfWin) return;

    pdfWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title} - ${name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 40px 50px; 
            color: #111827; 
            background: white;
            line-height: 1.4;
          }
          .doc-type {
            font-size: 10px;
            font-weight: 900;
            color: ${isProforma ? '#4F46E5' : '#7C3AED'};
            letter-spacing: 0.3em;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid ${isProforma ? '#4F46E5' : '#7C3AED'};
            padding-bottom: 20px;
          }
          .logo-side { display: flex; flex-direction: column; gap: 8px; }
          .logo-container { 
            background: ${isProforma ? '#4F46E5' : '#7C3AED'}; 
            color: white; 
            padding: 6px 12px; 
            border-radius: 6px; 
            font-weight: 900; 
            font-size: 16px;
            display: inline-block;
          }
          .hotel-info { font-size: 11px; color: #6B7280; font-weight: 500; }
          .ref-box { text-align: right; }
          .ref-label { color: #9CA3AF; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
          .ref-val { font-weight: 900; font-size: 20px; margin-top: 4px; color: #111827; }
          
          .grid-info { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin: 40px 0; }
          .info-block h4 { font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
          .client-name { font-weight: 900; font-size: 18px; color: #111827; margin-bottom: 5px; }
          .client-detail { color: #4B5563; font-size: 13px; font-weight: 500; margin-bottom: 2px; }
          
          .alert-group { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            color: #92400E; 
            background: #FFFBEB;
            padding: 12px 20px;
            border-radius: 12px;
            border: 1px solid #FEF3C7;
            font-size: 12px; 
            font-weight: 700;
            margin-bottom: 30px;
          }
          
          .section-title { font-weight: 900; font-size: 18px; margin-bottom: 20px; color: #111827; display: flex; align-items: center; gap: 10px; }
          .section-title::after { content: ''; flex: 1; height: 1px; background: #F3F4F6; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { 
            text-align: left; 
            color: #6B7280; 
            font-size: 10px; 
            font-weight: 900; 
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 15px;
            border-bottom: 2px solid #F3F4F6;
          }
          td { padding: 15px; font-size: 13px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
          .cell-bold { font-weight: 700; color: #111827; }
          .text-right { text-align: right; }
          
          .config-info { 
            display: flex;
            gap: 20px;
            background: #F9FAFB;
            padding: 15px 25px;
            border-radius: 15px;
            font-size: 11px; 
            color: #6B7280; 
            font-weight: 700;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .recap-container { width: 320px; margin-left: auto; }
          .recap-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; font-weight: 600; }
          .recap-label { color: #6B7280; }
          .recap-val { color: #111827; }
          .promo-row { color: #059669; }
          
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-top: 15px; 
            padding: 20px 0; 
            border-top: 2px solid ${isProforma ? '#4F46E5' : '#7C3AED'};
            font-weight: 900;
            font-size: 26px;
            color: ${isProforma ? '#4F46E5' : '#4338CA'};
          }
          
          .message-box { margin-top: 40px; padding: 25px; background: #F8FAFC; border-radius: 20px; border: 1px solid #F1F5F9; }
          .message-box h4 { font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; margin-bottom: 12px; }
          .message { font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap; font-weight: 500; }

          .footer { 
            margin-top: 80px; 
            padding-top: 30px; 
            border-top: 1px solid #F3F4F6; 
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 40px;
            font-size: 10px; 
            color: #9CA3AF; 
          }
          .signature-box { border: 1px dashed #E2E8F0; padding: 40px; border-radius: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="doc-type">${title}</div>
        <div class="header">
          <div class="logo-side">
            <div class="logo-container">FLOWTYM PMS</div>
            <div class="hotel-info">
              Mas Provencal Aix · 12 rue de la Paix, 13100 Aix-en-Provence<br/>
              SIRET : 841 234 567 00018 · TVA Intracom : FR 12 841234567
            </div>
          </div>
          <div class="ref-box">
            <div class="ref-label">Référence Document</div>
            <div class="ref-val">${id}</div>
            <div style="font-size: 11px; color:#9CA3AF; font-weight:700; margin-top:5px; text-transform: uppercase">Émis le ${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div class="grid-info">
          <div class="info-block">
            <h4>Bénéficiaire</h4>
            <div class="client-name">${name}</div>
            ${builderConf.clientEmail ? `<div class="client-detail">${builderConf.clientEmail}</div>` : ''}
            ${builderConf.clientPhone ? `<div class="client-detail">${builderConf.clientPhone}</div>` : ''}
          </div>
          <div class="info-block" style="text-align: right">
            <h4>Détails de Validité</h4>
            <div style="font-weight: 800; font-size: 14px; color: #111827">Valable ${builderConf.validity} jours</div>
            <div style="font-size: 13px; font-weight: 600; color: #6B7280; margin-top:4px">Proposition Commerciale / Proforma</div>
          </div>
        </div>
        
        ${d.isGroup ? `
          <div class="alert-group">
            <span style="font-size:18px">⚠️</span> 
            <span>CONDIITIONS GROUPE : Cette proposition est soumise aux conditions générales de vente "Groupes & Séminaires".</span>
          </div>
        ` : ''}
        
        <div class="section-title">Prestations de séjour</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40%">Désignation</th>
              <th class="text-right">Qté</th>
              <th class="text-right">Période</th>
              <th class="text-right">Nuits</th>
              <th class="text-right">Tarif Unit.</th>
              <th class="text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            ${simLines.map(l => {
              const start = new Date(l.arrival).getTime();
              const end = new Date(l.departure).getTime();
              const nights = Math.max(0, Math.round((end - start) / 86400000));
              const rate = SIM_RATE_PLANS[builderConf.rateOpt]?.[l.roomType]?.[builderConf.cancelOpt] || 79;
              const typeLabel = SIM_ROOM_TYPES.find(rt => rt.value === l.roomType)?.label || l.roomType;
              return `
                <tr>
                  <td class="cell-bold">${typeLabel}</td>
                  <td class="text-right cell-bold">${l.quantity}</td>
                  <td class="text-right">${l.arrival.split('-').reverse().join('/')} - ${l.departure.split('-').reverse().join('/')}</td>
                  <td class="text-right">${nights}</td>
                  <td class="text-right">${rate}€</td>
                  <td class="text-right cell-bold">${(rate * l.quantity * nights).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="config-info">
          <span>Plan : ${builderConf.rateOpt === 'room_only' ? 'Hébergement seul' : 'Chambre et Petit-Déjeuner'}</span>
          <span>Annulation : ${builderConf.cancelOpt === 'non_refundable' ? 'Strict (Non remboursable)' : 'Flexible (Gratuit 48h)'}</span>
        </div>
        
        <div class="recap-container">
          ${d.promoAmt > 0 ? `
            <div class="recap-row promo-row">
              <span class="recap-label promo-row">🎁 Remise ${d.promoLabel}</span>
              <span class="recap-val">-${f2(d.promoAmt)}</span>
            </div>
          ` : ''}
          <div class="recap-row">
            <span class="recap-label">Montant Hors Taxes</span>
            <span class="recap-val">${f2(d.subtotal)}</span>
          </div>
          <div class="recap-row">
            <span class="recap-label">TVA Collectée (${builderConf.vat}%)</span>
            <span class="recap-val">${f2(d.vatAmt)}</span>
          </div>
          <div class="recap-row" style="margin-bottom: 10px">
            <span class="recap-label">Taxe de séjour forfaitaire</span>
            <span class="recap-val">${f2(d.cityTaxAmt)}</span>
          </div>
          
          <div class="total-row">
            <span>NET À PAYER</span>
            <span>${f2(d.total)}</span>
          </div>
        </div>
        
        ${builderConf.message ? `
          <div class="message-box">
            <h4>Commentaires & Instructions</h4>
            <div class="message">${builderConf.message}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>
            <strong>Coordonnées bancaires</strong><br/>
            IBAN : FR76 3000 2005 1201 2345 6789 012<br/>
            BIC : AGRIBFR2X<br/>
            Banque : Crédit Agricole Alpes Provence
          </div>
          <div class="signature-box">
             <div style="font-size: 9px; font-weight: 800; color: #E2E8F0; margin-bottom: 20px">CADRE RÉSERVÉ À L'ACCEPTATION</div>
             <div style="font-size: 10px; color: #94A3B8">Bon pour accord le : ____ / ____ / ________<br/>Signature et cachet commercial</div>
          </div>
        </div>
      </body>
      </html>
    `);
    
    pdfWin.document.close();
    setTimeout(() => {
      pdfWin.print();
    }, 500);
  };

  return (
    <div className="space-y-4 min-h-screen pb-10 max-w-full overflow-x-hidden">
      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
             <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Simulation & Offres</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {view === 'list' ? 'Moteur de devis professionnel' : 'Nouveau devis · Moteur de calcul'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setView('list')}
             className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${view === 'list' ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600'}`}
           >
             <FileText className="w-3.5 h-3.5" /> Mes devis
           </button>
           <button 
             onClick={startNewSim}
             className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'builder' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-primary text-white hover:bg-primary-dark'}`}
           >
             <Plus className="w-3.5 h-3.5" /> Nouveau devis
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* ─── HUD ─── (Compact) */}
            <div className="grid grid-cols-5 gap-3">
              {listStats.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.color }} />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</span>
                  <div className="text-lg font-black text-slate-800 mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            {/* ─── LIST VIEW ─── */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xs">
                {filteredSims.length === 0 ? (
                  <div className="p-16 text-center space-y-4">
                     <Archive className="w-12 h-12 text-slate-100 mx-auto" />
                     <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Aucun devis trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredSims.map(s => {
                      const cfg = STATUS_CFG[s.status] || { lbl: s.status, cls: 'bg-slate-50 text-slate-400' };
                      const isExpired = new Date(s.valid) < new Date() && s.status !== 'converted';
                      return (
                        <div key={s.id} className="p-5 hover:bg-slate-50 transition-all flex items-center group cursor-default">
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-black text-slate-800 text-sm">{s.clientName}</span>
                                {s.isGroup && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[7px] font-black uppercase tracking-widest">Groupe</span>}
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isExpired ? 'bg-rose-100 text-rose-600' : cfg.cls}`}>
                                  {isExpired ? 'Expiré' : cfg.lbl}
                                </span>
                             </div>
                             <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                <span className="flex items-center gap-1 opacity-60"><Mail className="w-2.5 h-2.5" /> {s.contact || '—'}</span>
                                <span className="flex items-center gap-1 opacity-60"><Calendar className="w-2.5 h-2.5" /> Exp. {new Date(s.valid).toLocaleDateString('fr-FR')}</span>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-black">#{s.id}</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-6 px-6">
                             <div className="text-center">
                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Rooms</div>
                                <div className="font-black text-slate-500 text-xs">{s.rooms}</div>
                             </div>
                             <div className="text-center">
                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Nights</div>
                                <div className="font-black text-slate-500 text-xs">{s.nights}</div>
                             </div>
                             <div className="text-right min-w-[100px]">
                                <div className="text-base font-black text-slate-900 leading-none mb-0.5">{formatCurrency(s.amount)}</div>
                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">HT: {formatCurrency(s.amountHT)}</div>
                             </div>
                          </div>

                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => editSim(s)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm"><Calculator className="w-3.5 h-3.5" /></button>
                             <button onClick={() => duplicateSim(s)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm"><Copy className="w-3.5 h-3.5" /></button>
                             {s.status !== 'converted' && (
                               <button onClick={() => convertToResa(s)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"><ExternalLink className="w-3.5 h-3.5" /></button>
                             )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="builder"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-4"
          >
            {/* ─── SECTION 1: GLOBAL CONFIG ─── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm overflow-hidden">
               <div className="flex items-center gap-2 mb-5">
                  <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-500 shadow-inner">
                    <Sliders className="w-3 h-3" />
                  </div>
                  <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">Configuration globale de l'offre</h3>
               </div>

               <div className="flex flex-wrap items-end gap-5">
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Tarification</label>
                     <div className="relative">
                        <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all appearance-none"
                          value={builderConf.rateOpt}
                          onChange={e => setBuilderConf({...builderConf, rateOpt: e.target.value})}
                        >
                          <option value="room_only">Hébergement seul (RO)</option>
                          <option value="bed_breakfast">Chambre & Petit-Déj (BB)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                     </div>
                  </div>

                  <div className="flex-1 min-w-[180px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Annulation</label>
                     <div className="relative">
                        <History className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 pointer-events-none" />
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all appearance-none"
                          value={builderConf.cancelOpt}
                          onChange={e => setBuilderConf({...builderConf, cancelOpt: e.target.value})}
                        >
                          <option value="non_refundable">Strict (Non remboursable)</option>
                          <option value="flexible">Flexible (Gratuit 48h)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                     </div>
                  </div>

                  <div className="flex-1 min-w-[180px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Promotion / Remise</label>
                     <div className="relative">
                        <Tags className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                        <select 
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all appearance-none"
                          value={builderConf.promoVal}
                          onChange={e => setBuilderConf({...builderConf, promoVal: e.target.value})}
                        >
                          <option value="">Standard (Aucune)</option>
                          <option value="-5">Remise Spéciale −5%</option>
                          <option value="-10">Early Bird −10%</option>
                          <option value="-15">Tarif Séminaire −15%</option>
                          <option value="-20">Accord Cadre −20%</option>
                          <option value="1_night">1 nuit offerte (Bonus)</option>
                          <option value="1_room">1 chambre offerte (Bonus)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
                     </div>
                  </div>

                  <div className="w-[80px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">TVA %</label>
                     <input 
                        type="number" step="0.5"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all text-center"
                        value={isNaN(builderConf.vat) ? '' : builderConf.vat}
                        onChange={e => setBuilderConf({...builderConf, vat: e.target.value === '' ? NaN : parseFloat(e.target.value)})}
                      />
                  </div>

                  <div className="w-[100px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">T. Séjour €</label>
                     <input 
                        type="number" step="0.1"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all text-center"
                        value={isNaN(builderConf.cityTax) ? '' : builderConf.cityTax}
                        onChange={e => setBuilderConf({...builderConf, cityTax: e.target.value === '' ? NaN : parseFloat(e.target.value)})}
                      />
                  </div>

                  <div className="w-[100px] space-y-1.5">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 text-center block">Seuil Groupe</label>
                     <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-[10px] font-black text-slate-700 outline-none focus:bg-white focus:border-primary transition-all text-center"
                        value={isNaN(builderConf.groupThr) ? '' : builderConf.groupThr}
                        onChange={e => setBuilderConf({...builderConf, groupThr: e.target.value === '' ? NaN : parseInt(e.target.value)})}
                      />
                  </div>
               </div>
            </div>

            {/* ─── SECTION 2: ROOM LINES ─── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
               <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-500 shadow-inner">
                      <LayoutGrid className="w-3 h-3" />
                    </div>
                    <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">Lignes de l'offre</h3>
                  </div>
                  <button 
                    onClick={() => setSimLines([...simLines, { id: Date.now(), roomType: 'double-classique', quantity: 1, arrival: '2026-07-10', departure: '2026-07-15', nights: 5 }])}
                    className="bg-primary hover:bg-primary-dark text-white px-3.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-md shadow-primary/10"
                  >
                    + Ajouter une chambre
                  </button>
               </div>

               <div className="space-y-2 mb-5">
                  {simLines.map((l, idx) => {
                    const start = new Date(l.arrival).getTime();
                    const end = new Date(l.departure).getTime();
                    const nights = Math.max(0, Math.round((end - start) / 86400000));
                    const rate = SIM_RATE_PLANS[builderConf.rateOpt]?.[l.roomType]?.[builderConf.cancelOpt] || 79;
                    const lineTotal = rate * l.quantity * nights;

                    return (
                      <div key={l.id} className="flex items-center gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-1.5 px-3 shadow-xs group transition-all hover:bg-white hover:shadow-md">
                         <div className="p-1 text-slate-200 group-hover:text-slate-400">
                           <GripVertical className="w-3 h-3" />
                         </div>
                         
                         <div className="flex-1 relative flex items-center gap-2 h-8">
                            <DoorOpen className="w-3 h-3 text-slate-400" />
                            <select 
                               className="flex-1 bg-transparent text-[10px] font-bold text-slate-700 outline-none"
                               value={l.roomType}
                               onChange={e => {
                                 const nl = [...simLines];
                                 nl[idx].roomType = e.target.value;
                                 setSimLines(nl);
                               }}
                             >
                               {SIM_ROOM_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                             </select>
                         </div>

                         <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-100 h-8">
                             <span className="text-[7px] font-black text-slate-300 uppercase">Qté</span>
                             <input 
                                type="number" min="1"
                                className="w-6 border-none bg-transparent text-[10px] font-black text-slate-800 text-center outline-none"
                                value={l.quantity}
                                onChange={e => {
                                  const nl = [...simLines];
                                  nl[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                  setSimLines(nl);
                                }}
                             />
                         </div>

                         <div className="flex items-center gap-3 px-3 py-1 bg-white rounded-lg border border-slate-100 h-8">
                             <div className="flex items-center gap-1.5">
                               <span className="text-[7px] font-black text-slate-300 uppercase">Arrivée</span>
                               <input type="date" className="bg-transparent text-[9px] font-bold text-slate-500 outline-none p-0 cursor-pointer" value={l.arrival} onChange={e => updateLineDates(idx, 'arrival', e.target.value)} />
                             </div>
                             <div className="w-px h-3 bg-slate-100" />
                             <div className="flex items-center gap-1.5">
                               <span className="text-[7px] font-black text-slate-300 uppercase">Nuits</span>
                               <input type="number" min="0" className="w-6 border-none bg-transparent text-[9px] font-bold text-slate-500 text-center outline-none" value={l.nights ?? nights} onChange={e => updateLineDates(idx, 'nights', e.target.value)} />
                             </div>
                             <div className="w-px h-3 bg-slate-100" />
                             <div className="flex items-center gap-1.5">
                               <span className="text-[7px] font-black text-slate-300 uppercase">Départ</span>
                               <input type="date" className="bg-transparent text-[9px] font-bold text-slate-500 outline-none p-0 cursor-pointer" value={l.departure} onChange={e => updateLineDates(idx, 'departure', e.target.value)} />
                             </div>
                             <Calendar className="w-3 h-3 text-slate-300" />
                         </div>

                         <div className="text-right min-w-[120px] px-2 h-8 flex flex-col justify-center">
                            <div className="text-[10px] font-black text-primary leading-tight">{rate.toLocaleString('fr-FR')}€/nuit</div>
                            <div className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">{nights}n x {l.quantity}ch = {lineTotal.toLocaleString('fr-FR')}€</div>
                         </div>

                         <button 
                            onClick={() => setSimLines(simLines.filter(lx => lx.id !== l.id))}
                            className="p-1.5 border border-rose-50 bg-rose-50/30 text-rose-300 hover:text-rose-500 hover:border-rose-200 transition-all rounded-lg"
                         >
                            <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    );
                  })}
               </div>

               <div className="bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                 <Info className="w-3 h-3" /> {builderResults.isGroup ? 'Type de séjour : Groupe' : 'Type de séjour : Individuel'} ({builderResults.totalRooms} chambres / seuil groupe: {builderConf.groupThr})
               </div>
            </div>

            {/* ─── SECTION 3: BOTTOM PANELS ─── */}
            <div className="grid grid-cols-2 gap-4">
               {/* Left: Financial Recap */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 pb-2 flex items-center gap-2">
                    <div className="w-5 h-5 bg-amber-50 rounded flex items-center justify-center text-amber-500 shadow-inner">
                      <Euro className="w-3 h-3" />
                    </div>
                    <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">Récapitulatif Financier</h3>
                  </div>
                  
                  <div className="flex-1 p-5 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Sous-total Hébergement (HT)</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.subtotal)}</span>
                     </div>
                     {builderResults.promoAmt > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 bg-emerald-50 -mx-5 px-5 py-1.5 border-y border-emerald-100">
                           <span>{builderResults.promoLabel}</span>
                           <span>-{formatCurrency(builderResults.promoAmt)}</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Volume de TVA ({builderConf.vat}%)</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.vatAmt)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Taxe de séjour forfaitaire</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.cityTaxAmt)}</span>
                     </div>
                  </div>

                  <div className="px-5 py-3.5 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                     <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">TOTAL À PAYER TTC</span>
                     <span className="text-lg font-black text-primary tracking-tighter">{formatCurrency(builderResults.total)}</span>
                  </div>
                  <div className="px-5 py-2 bg-white text-[8px] font-bold text-slate-300 uppercase tracking-widest italic border-t border-slate-50">
                    Calcul automatisé · {builderResults.totalRooms} ch. · {builderResults.totalNights} nuits
                  </div>
               </div>

               {/* Right: Client & Proposal */}
               <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-indigo-50 rounded flex items-center justify-center text-indigo-500 shadow-inner">
                      <User className="w-3 h-3" />
                    </div>
                    <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">Détails du destinataire</h3>
                  </div>

                     <div className="grid grid-cols-1 gap-2.5">
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Date d'expiration</label>
                           <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all cursor-pointer" value={builderConf.expirationDate} onChange={e=>setBuilderConf({...builderConf, expirationDate: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Nom / Société</label>
                           <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientName} onChange={e=>setBuilderConf({...builderConf, clientName: e.target.value})} placeholder="Nom du client" />
                        </div>
                     <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                           <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientEmail} onChange={e=>setBuilderConf({...builderConf, clientEmail: e.target.value})} placeholder="client@email.com" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
                           <input className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientPhone} onChange={e=>setBuilderConf({...builderConf, clientPhone: e.target.value})} placeholder="+33..." />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Validité de l'offre</label>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.validity} onChange={e=>setBuilderConf({...builderConf, validity: parseInt(e.target.value)||7})}>
                              <option value="3">3 jours (Express)</option>
                              <option value="7">7 jours (Standard)</option>
                              <option value="14">14 jours (Confort)</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Type de Document</label>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.status} onChange={e=>setBuilderConf({...builderConf, status: e.target.value})}>
                              <option value="draft">Brouillon interne</option>
                              <option value="sent">Devis Commercial</option>
                              <option value="proforma">Facture Proforma</option>
                              <option value="accepted">Proposition Validée</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Instruction / Message</label>
                        <textarea className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-[10px] font-medium outline-none focus:bg-white focus:border-primary transition-all h-16 resize-none" value={builderConf.message} onChange={e=>setBuilderConf({...builderConf, message: e.target.value})} placeholder="Paiement 50% à la réservation..." />
                     </div>
                  </div>
               </div>
            </div>
            {/* ─── SECTION 3: BOTTOM PANELS ─── */}
            <div className="grid grid-cols-2 gap-4">
               {/* Left: Financial Recap */}
               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 pb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shadow-inner">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Récapitulatif financier</h3>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-4">
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>Sous-total HT</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.subtotal)}</span>
                     </div>
                     {builderResults.promoAmt > 0 && (
                        <div className="flex justify-between items-center text-xs font-black text-emerald-500 bg-emerald-50 -mx-6 px-6 py-2">
                           <span>{builderResults.promoLabel}</span>
                           <span>-{formatCurrency(builderResults.promoAmt)}</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>TVA ({builderConf.vat}%)</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.vatAmt)}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>Taxe séjour</span>
                        <span className="text-slate-900">{formatCurrency(builderResults.cityTaxAmt)}</span>
                     </div>
                  </div>

                  <div className="px-6 py-4 bg-primary-light flex justify-between items-center">
                     <span className="text-sm font-black text-slate-800 uppercase tracking-widest">TOTAL TTC</span>
                     <span className="text-xl font-black text-primary tracking-tighter">{formatCurrency(builderResults.total)}</span>
                  </div>
                  <div className="px-6 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic border-t border-slate-50">
                    {builderResults.totalRooms} chambres · {builderResults.totalNights} nuits · CA HT {formatCurrency(builderResults.subtotal / (1 + builderConf.vat / 100))}
                  </div>
               </div>

               {/* Right: Client & Proposal */}
               <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shadow-inner">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Client & Proposition</h3>
                  </div>

                     <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Date d'expiration de l'offre</label>
                           <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all cursor-pointer" value={builderConf.expirationDate} onChange={e=>setBuilderConf({...builderConf, expirationDate: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nom Client / Société</label>
                           <input className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientName} onChange={e=>setBuilderConf({...builderConf, clientName: e.target.value})} placeholder="Sophie Laurent / Flowtym Corp" />
                        </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                        <input className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientEmail} onChange={e=>setBuilderConf({...builderConf, clientEmail: e.target.value})} placeholder="client@email.com" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
                        <input className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.clientPhone} onChange={e=>setBuilderConf({...builderConf, clientPhone: e.target.value})} placeholder="+33 6 12 34 56 78" />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Validité de l'offre</label>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.validity} onChange={e=>setBuilderConf({...builderConf, validity: parseInt(e.target.value)||7})}>
                              <option value="3">3 jours</option>
                              <option value="7">7 jours</option>
                              <option value="14">14 jours</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Statut initial</label>
                           <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.status} onChange={e=>setBuilderConf({...builderConf, status: e.target.value})}>
                              <option value="draft">Brouillon</option>
                              <option value="sent">Envoyé</option>
                              <option value="accepted">Accepté</option>
                           </select>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Message d'accompagnement</label>
                        <textarea className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs font-medium outline-none focus:bg-white focus:border-primary transition-all h-20 resize-none" value={builderConf.message} onChange={e=>setBuilderConf({...builderConf, message: e.target.value})} />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Notes internes</label>
                        <input className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" value={builderConf.notes} onChange={e=>setBuilderConf({...builderConf, notes: e.target.value})} placeholder="Notes (non visibles par le client)..." />
                     </div>
                  </div>
               </div>
            </div>

            {/* ─── FOOTER FIXED ─── */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-lg flex justify-between items-center">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total TTC : <span className="font-black text-slate-800 ml-1">{formatCurrency(builderResults.total)}</span> · <span>{builderResults.totalRooms} ch.</span> · <span>{builderResults.totalNights} nuits</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={()=>setView('list')} className="px-6 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Annuler</button>
                  <button onClick={handleExportPDF} className="px-6 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2"><Printer className="w-3.5 h-3.5" /> PDF</button>
                  <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Envoyer email</button>
                  <button onClick={saveSim} className="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2"><Check className="w-4 h-4" /> Enregistrer devis</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
