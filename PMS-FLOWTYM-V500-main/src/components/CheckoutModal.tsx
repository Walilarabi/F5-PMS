import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  ArrowRight, 
  DollarSign, 
  Clock, 
  Plus, 
  Trash2, 
  Zap, 
  Printer, 
  ArrowLeftRight,
  FileText,
  CheckCircle2,
  Home,
  LogOut,
  AlertTriangle,
  Coffee,
  Pizza,
  ArrowLeftRight as TransferIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  rooms: any[];
  reservations: any[];
  clients: any[];
  onFinalize: (roomId: string, reservationId: string, paymentData: any) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  roomId, 
  rooms, 
  reservations, 
  clients, 
  onFinalize 
}) => {
  const [checkoutTab, setCheckoutTab] = useState<'invoice' | 'reservation' | 'cardex'>('invoice');
  const [activeFolio, setActiveFolio] = useState<number>(1);
  const [invoiceLines, setInvoiceLines] = useState<any[]>([]);
  const [soldeError, setSoldeError] = useState<string>('');
  const PRESTATION_FAMILIES = [
    {
      id: 1,
      name: "Hébergement",
      icon: Home,
      prestations: [
        { code: "DBL-CLA", label: "Double Classique", price: 120, tva: 10 },
        { code: "TWN-DLX", label: "Twin Deluxe", price: 150, tva: 10 },
        { code: "STE-PRE", label: "Suite Prestige", price: 250, tva: 20 }
      ]
    },
    {
      id: 2,
      name: "Petit déjeuner",
      icon: Coffee,
      prestations: [
        { code: "PDJ-BUF", label: "Buffet", price: 15, tva: 5.5 },
        { code: "PDJ-COP", label: "Continental", price: 12, tva: 5.5 }
      ]
    },
    {
      id: 3,
      name: "Bar",
      icon: Pizza,
      prestations: [
        { code: "BAR-VIN", label: "Vin", price: 25, tva: 20 },
        { code: "BAR-BIE", label: "Bière", price: 6, tva: 20 }
      ]
    }
  ];

  const [newLineData, setNewLineData] = useState({
    family: PRESTATION_FAMILIES[0].name,
    code: PRESTATION_FAMILIES[0].prestations[0].code,
    qty: 1,
    description: PRESTATION_FAMILIES[0].prestations[0].label,
    amount: PRESTATION_FAMILIES[0].prestations[0].price,
    folio: 1
  });
  const [paymentData, setPaymentData] = useState({
    method: 'CB',
    amount: 0
  });
  const [discount, setDiscount] = useState({ type: 'none', value: 0 });
  const [customDiscountValue, setCustomDiscountValue] = useState(0);
  const [customDiscountType, setCustomDiscountType] = useState<'percent' | 'amount' | 'night'>('percent');
  const [splitPayments, setSplitPayments] = useState<{ id: string, mode: string, amount: number }[]>([]);
  const [thirdParty, setThirdParty] = useState({ type: 'none', details: { name: '', address: '', siret: '', vat: '' } });
  const [thirdPartyFolios, setThirdPartyFolios] = useState<number[]>([3]);
  const [cityTaxTarget, setCityTaxTarget] = useState<'guest' | 'thirdParty'>('guest');
  const [transferTargetRoom, setTransferTargetRoom] = useState('');
  const [selectedLinesForTransfer, setSelectedLinesForTransfer] = useState<string[]>([]);
  
  const reservation = reservations.find(r => (r.room === roomId || r.roomId === roomId) && (r.status === 'checked_in' || r.status === 'In House'));
  const client = clients.find(c => c.id === reservation?.clientId || c.id === reservation?.guestId);
  useEffect(() => {
    if (isOpen && roomId) {
      // Mock initial lines
      const initialLines = [
        { id: 'l1', date: TODAY, code: 'DBL-CLA', family: 'Hébergement', description: `Nuitée - Chambre ${roomId}`, qty: 1, amount: 120, tva: 10, folio: 1 },
        { id: 'l2', date: TODAY, code: 'PDJ-BUF', family: 'Petit déjeuner', description: 'Buffet', qty: 2, amount: 15, tva: 5.5, folio: 1 },
      ];
      setInvoiceLines(initialLines);
      setDiscount({ type: 'none', value: 0 });
      setSplitPayments([]);
      setThirdParty({ type: 'none', details: { name: '', address: '', siret: '', vat: '' } });
      setThirdPartyFolios([3]);
      setCheckoutTab('invoice');
      setActiveFolio(1);
    }
  }, [isOpen, roomId]);

  const getFolioBalance = (folioNum: number) => {
    const lines = invoiceLines.filter(l => l.folio === folioNum);
    const debit = lines.filter(l => l.family !== 'Paiement').reduce((acc, l) => acc + (l.amount * l.qty * (1 + l.tva / 100)), 0);
    const credit = lines.filter(l => l.family === 'Paiement').reduce((acc, l) => acc + l.amount, 0);
    return debit - credit;
  };

  useEffect(() => {
    const balance = getFolioBalance(activeFolio);
    setPaymentData(prev => ({ ...prev, amount: parseFloat(balance.toFixed(2)) }));
  }, [activeFolio, invoiceLines]);

   const calculateTotals = (folioNum?: number) => {
    const linesToCalc = folioNum ? invoiceLines.filter(l => l.folio === folioNum) : invoiceLines;
    
    let subtotalHT = linesToCalc.filter(l => l.family !== 'Paiement').reduce((acc, line) => acc + (line.amount * line.qty), 0);
    
    let discountAmount = 0;
    if (discount.type !== 'none') {
      discountAmount = subtotalHT * (discount.value / 100);
    }

    const discountedHT = subtotalHT - discountAmount;
    
    const tvaAmount = linesToCalc.filter(l => l.family !== 'Paiement').reduce((acc, l) => {
      return acc + (l.amount * l.qty * l.tva / 100);
    }, 0);

    const cityTaxTotal = linesToCalc.filter(l => l.family === 'Taxe séjour').reduce((acc, l) => acc + (l.amount * l.qty), 0) || (folioNum === 1 || !folioNum ? 20 : 0);
    const totalTTC = discountedHT + tvaAmount + cityTaxTotal;
    
    const paidAmount = linesToCalc.filter(l => l.family === 'Paiement').reduce((acc, l) => acc + l.amount, 0);
    const balance = totalTTC - paidAmount;

    return {
      subtotalHT,
      discountAmount,
      tvaAmount,
      cityTaxTotal,
      totalTTC,
      paidAmount,
      balance
    };
  };

  const handleSplitPayment = (mode: string, amount: number) => {
    if (amount <= 0) return;
    const newPaymentLine = {
      id: Math.random().toString(36).substr(2, 9),
      date: TODAY,
      code: 'Rgt',
      family: 'Paiement',
      description: mode,
      qty: 1,
      amount: amount,
      tva: 0,
      folio: activeFolio
    };
    setInvoiceLines([...invoiceLines, newPaymentLine]);
    setSplitPayments([...splitPayments, { id: newPaymentLine.id, mode, amount }]);
  };

  const removeSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter(p => p.id !== id));
    setInvoiceLines(invoiceLines.filter(l => l.id !== id));
  };

  const addInvoiceLine = () => {
    if (!newLineData.description || newLineData.amount <= 0) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Champs requis · Description et montant obligatoires' } }));
      return;
    }
    
    // Find TVA for the selected prestation
    const family = PRESTATION_FAMILIES.find(f => f.name === newLineData.family);
    const prestation = family?.prestations.find(p => p.code === newLineData.code);
    
    const newLine = {
      id: Math.random().toString(36).substr(2, 9),
      date: TODAY,
      code: newLineData.code || 'PREST',
      family: newLineData.family,
      description: newLineData.description,
      qty: newLineData.qty,
      amount: newLineData.amount,
      tva: prestation?.tva || 10,
      folio: activeFolio
    };
    setInvoiceLines([...invoiceLines, newLine]);
    setNewLineData({ 
      ...newLineData, 
      description: family?.prestations[0].label || '', 
      amount: family?.prestations[0].price || 0, 
      code: family?.prestations[0].code || '' 
    });
  };

  const removeInvoiceLine = (id: string) => {
    setInvoiceLines(invoiceLines.filter(l => l.id !== id));
  };

  const updateInvoiceLine = (id: string, updates: any) => {
    setInvoiceLines(invoiceLines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const exportFacturePDF = () => {
    const element = document.getElementById('facturation-content-modal');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `facture_${roomId}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          // Nuclear Sanitize oklch/oklab for html2canvas compatibility
          const sanitizer = (html: string) => html
            .replace(/oklch\([^)]+\)/g, '#8B5CF6')
            .replace(/oklab\([^)]+\)/g, '#8B5CF6');
          
          clonedDoc.head.innerHTML = sanitizer(clonedDoc.head.innerHTML);
          clonedDoc.body.innerHTML = sanitizer(clonedDoc.body.innerHTML);
          
          const styleOverride = clonedDoc.createElement('style');
          styleOverride.innerHTML = `
            * { color-scheme: light !important; }
            .bg-primary { background-color: #8B5CF6 !important; }
            .text-primary { color: #8B5CF6 !important; }
            th { background-color: #8B5CF6 !important; color: #ffffff !important; }
          `;
          clonedDoc.head.appendChild(styleOverride);
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const printInvoice = () => {
    const totals = calculateTotals(activeFolio);
   const globalTotals = calculateTotals();
    const win = window.open('', '_blank');
    if (!win) return;
    
    const isCompany = thirdParty.type !== 'none';

    win.document.write(`
      <html>
        <head>
          <title>Facture Chambre ${roomId}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .hotel-info h1 { margin: 0; font-size: 24px; color: #4A1D6D; }
            .invoice-details { text-align: right; }
            .section { margin-bottom: 30px; }
            .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; }
            .value { font-size: 14px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 2px solid #f1f5f9; padding: 12px; font-size: 10px; text-transform: uppercase; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .total-section { margin-top: 40px; margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { border-top: 2px solid #4A1D6D; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 900; }
            .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hotel-info">
              <h1>FLOWTYM HOTEL</h1>
              <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">Mas Provencal Aix - V2.3 PMS</div>
            </div>
            <div class="invoice-details">
              <div class="label">Facture N°</div>
              <div class="value">FA-${Math.floor(Date.now()/10000)}</div>
              <div class="label" style="margin-top: 10px;">Date</div>
              <div class="value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style="display: flex; gap: 40px;">
            <div class="section" style="flex: 1">
              <div class="label">Client / Guest</div>
              <div class="value">${client?.name || 'Inconnu'}</div>
              <div class="value" style="font-weight: 500">${client?.email || ''}</div>
              <div class="value" style="font-weight: 500">Chambre ${roomId}</div>
            </div>
            ${isCompany ? `
              <div class="section" style="text-align: right">
                <div class="label">Facturé à / Third Party</div>
                <div class="value">${thirdParty.details.name}</div>
                <div class="value" style="font-weight: 500; font-size: 12px;">${thirdParty.details.address}</div>
                <div class="value" style="font-weight: 500; font-size: 12px;">SIRET: ${thirdParty.details.siret}</div>
              </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr><th>Description</th><th>Qté</th><th>PX Unit. HT</th><th>Total HT</th></tr>
            </thead>
            <tbody>
              ${invoiceLines.map(line => `
                <tr>
                  <td>${line.description}</td>
                  <td>${line.qty}</td>
                  <td>${line.amount.toFixed(2)}€</td>
                  <td>${(line.amount * line.qty).toFixed(2)}€</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="label">Sous-total HT</span>
              <span class="value">${totals.subtotalHT.toFixed(2)}€</span>
            </div>
            ${totals.discountAmount > 0 ? `
              <div class="total-row" style="color: #10b981">
                <span class="label">Remise Commerciale</span>
                <span class="value">-${totals.discountAmount.toFixed(2)}€</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span class="label">TVA (10%)</span>
              <span class="value">${totals.tvaAmount.toFixed(2)}€</span>
            </div>
            <div class="total-row">
              <span class="label">Taxe de séjour</span>
              <span class="value">${totals.cityTaxTotal.toFixed(2)}€</span>
            </div>
            <div class="total-row grand-total">
               <span class="label" style="font-size: 12px; color: #4A1D6D">Total TTC</span>
               <span>${totals.totalTTC.toFixed(2)}€</span>
            </div>
          </div>

          <div class="footer">
            Flowtym PMS Infrastructure - 123 Avenue des Palace, 75008 Paris<br/>
            Société par Actions Simplifiée au capital de 1 000 000€ - SIREN 123 456 789<br/>
            Nous vous remercions de votre confiance et espérons vous revoir bientôt.
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 800);
  };

  const sendInvoiceEmail = () => {
    const subject = `Votre facture - Chambre ${roomId}`;
    const body = `Cher(e) ${client?.name},\n\nVeuillez trouver ci-joint votre facture pour votre séjour en chambre ${roomId}.\n\nNous espérons vous revoir très bientôt.\n\nCordialement,\nFlowtym Hotel`;
    window.location.href = `mailto:${client?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleFinalize = () => {
    const globalTotals = calculateTotals();
    if (Math.abs(globalTotals.balance) > 0.01) {
      setSoldeError(`Solde impayé de ${Math.abs(globalTotals.balance).toFixed(2)} € — encaissez avant de finaliser`);
      return;
    }
    setSoldeError('');
    onFinalize(roomId, reservation?.id || '', splitPayments);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Check-out validé · Ch. ${roomId} · Ménage planifié` } }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'F8') {
        e.preventDefault();
        printInvoice();
      }
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleFinalize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, roomId, invoiceLines, splitPayments, thirdParty, discount]);

  const totals = calculateTotals(activeFolio);
  const globalTotals = calculateTotals();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-[1200px] h-[90vh] bg-bg rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
          >
            {/* HEADER */}
            <div className="px-10 py-8 bg-primary flex justify-between items-center text-white relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                    <LogOut className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Check-out</h2>
                    <p className="text-primary-light font-black uppercase text-[10px] tracking-[4px]">Folio Chambre {roomId}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* TABS */}
            <div className="px-10 bg-white border-b border-slate-100 flex gap-8 pt-0">
              {[
                { id: 'invoice', label: 'Facturation', icon: DollarSign },
                { id: 'reservation', label: 'Réservation', icon: FileText },
                { id: 'cardex', label: 'Cardex', icon: User },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setCheckoutTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-2 py-5 relative transition-all group ${checkoutTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${checkoutTab === tab.id ? 'text-primary' : 'text-slate-300'}`} />
                  <span className="text-[11px] font-black uppercase tracking-[2px]">{tab.label}</span>
                  {checkoutTab === tab.id && (
                    <motion.div layoutId="checkoutTabBar" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar bg-slate-50">
              {checkoutTab === 'reservation' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Left Side: Client & Room Info */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" /> Client Info
                         </h4>
                         <div className="space-y-4">
                            <div>
                               <div className="text-lg font-black text-slate-800">{client?.name || 'Arathew Smith'}</div>
                               <div className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1">
                                  <Mail className="w-3 h-3" /> {client?.email || 'a.smith@example.com'}
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                     <Phone className="w-4 h-4" />
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-600">{client?.phone || '+33 6 12 34 56 78'}</div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                     <Users className="w-4 h-4" />
                                  </div>
                                  <div className="text-[11px] font-bold text-slate-600">{reservation?.pax || 2} Adultes</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] flex items-center gap-2">
                            <Home className="w-4 h-4 text-primary" /> Séjour & Détails
                         </h4>
                         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pension</div>
                               <div className="text-[11px] font-bold text-slate-700">Petit-déjeuner inclus</div>
                            </div>
                            <div>
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Tarif</div>
                               <div className="text-[11px] font-bold text-slate-700">Standard Flex</div>
                            </div>
                            <div>
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Canal</div>
                               <div className="text-[11px] font-bold text-slate-700">{reservation?.source || 'Direct / Website'}</div>
                            </div>
                            <div>
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Segment</div>
                               <div className="text-[11px] font-bold text-slate-700">Loisirs</div>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Right Side: Dates & Financial */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[2px] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> Dates & Durée
                         </h4>
                         <div className="flex justify-between items-center">
                            <div className="text-center bg-slate-50 rounded-2xl p-4 flex-1">
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Arrivée</div>
                               <div className="text-[13px] font-black text-slate-800">{reservation?.checkIn || '15 Avr. 2026'}</div>
                            </div>
                            <div className="px-4 text-slate-200">
                               <ArrowRight className="w-5 h-5" />
                            </div>
                            <div className="text-center bg-slate-50 rounded-2xl p-4 flex-1">
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Départ</div>
                               <div className="text-[13px] font-black text-slate-800">{reservation?.checkOut || '19 Avr. 2026'}</div>
                            </div>
                         </div>
                         <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <Clock className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Durée: {reservation?.nights || 4} nuits</span>
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
                         <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] flex items-center gap-2 relative z-10">
                            <DollarSign className="w-4 h-4 text-primary" /> Récapitulatif Financier (Global)
                         </h4>
                         <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                               <span>Prestations Total HT</span>
                               <span className="text-slate-200">{globalTotals.subtotalHT.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                               <span>TVA</span>
                               <span className="text-slate-200">{globalTotals.tvaAmount.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                               <span>Taxe de séjour</span>
                               <span className="text-slate-200">{globalTotals.cityTaxTotal.toFixed(2)}€</span>
                            </div>
                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                               <div>
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total TTC</div>
                                  <div className="text-4xl font-black text-white tracking-tighter">{globalTotals.totalTTC.toFixed(2)}€</div>
                               </div>
                               <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                                  {Math.abs(globalTotals.balance) < 0.01 ? 'Solde Ok' : `Reste: ${globalTotals.balance.toFixed(2)}€`}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                     <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all">
                        <Printer className="w-3.5 h-3.5" /> Bon de commande
                     </button>
                     <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all">
                        <Mail className="w-3.5 h-3.5" /> Envoyer confirmation
                     </button>
                   </div>
                </div>
              )}

              {checkoutTab === 'invoice' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500" id="facturation-content-modal">
                  {/* RECAP HEADER */}
                  <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-wrap gap-8 text-[11px] font-bold text-slate-500 items-center">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Du 15/04/2026 au 19/04/2026 (4 nuits)</div>
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 2 Adultes · 0 Enfant · 🇺🇸 USA</div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {client?.phone || '+33 6 12 34 56 78'}</div>
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Canal : {reservation?.source || 'Booking.com'}</div>
                  </div>

                  {/* FOLIO TABS (ONGLETS) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[24px]">
                      {[1, 2, 3].map(num => (
                        <button
                          key={num}
                          data-folio={num}
                          onClick={() => setActiveFolio(num)}
                          className={`flex items-center gap-2 px-8 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeFolio === num ? 'bg-primary text-white shadow-xl shadow-primary/30 ring-4 ring-primary/10' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                          <FileText className={`w-3.5 h-3.5 ${activeFolio === num ? 'text-white' : 'text-slate-300'}`} />
                          Folio {num}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                       <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Raccourcis: F{activeFolio}+1/2/3</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Prestations (Global)</div>
                          <div className="text-xl font-black text-slate-800 tracking-tight">
                            {globalTotals.totalTTC.toFixed(2)}€
                          </div>
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Réglé (Global)</div>
                        <div className="text-xl font-black text-emerald-600 tracking-tight">
                          {globalTotals.paidAmount.toFixed(2)}€
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solde Global</div>
                        <div className={`text-2xl font-black tracking-tighter ${Math.abs(globalTotals.balance) > 0.01 ? 'text-rose-500' : 'text-emerald-500'}`}>
                           {globalTotals.balance.toFixed(2)}€
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-12 h-12" /></div>
                     </div>
                  </div>

                  {/* MAIN TABLE (MULTI-FOLIO) */}
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[100px]">
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="text-left py-2 px-4 text-[10px] font-semibold text-slate-400">Date</th>
                              <th className="text-left py-2 px-4 text-[10px] font-semibold text-slate-400">Code</th>
                              <th className="text-center py-2 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Qté</th>
                              <th className="text-left py-2 px-4 text-[10px] font-semibold text-slate-400">Libellé</th>
                              <th className={`text-right py-2 px-2 text-[9px] font-black uppercase tracking-widest ${activeFolio === 1 ? 'text-primary' : 'text-slate-400'}`}>Folio 1 (Débit)</th>
                              <th className={`text-right py-2 px-2 text-[9px] font-black uppercase tracking-widest ${activeFolio === 2 ? 'text-primary' : 'text-slate-400'}`}>Folio 2 (Crédit)</th>
                              <th className={`text-right py-2 px-2 text-[9px] font-black uppercase tracking-widest ${activeFolio === 3 ? 'text-primary' : 'text-slate-400'}`}>Folio 3 (TVA)</th>
                              <th className="text-right py-2 px-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</th>
                              <th className="py-2 px-4"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {invoiceLines.map((line) => {
                             const lineTTC = line.family === 'Paiement' ? -line.amount : (line.amount * line.qty * (1 + line.tva / 100));
                             return (
                             <tr key={line.id} className={`group hover:bg-slate-50/50 transition-colors ${line.folio === activeFolio ? 'bg-primary/5' : ''}`}>
                               <td className="py-2 px-4 text-[10px] font-bold text-slate-400">{line.date}</td>
                               <td className="py-2 px-4 text-[10px] font-black text-slate-600">{line.code}</td>
                               <td className="py-2 px-4 text-center text-[10px] font-bold text-slate-500">{line.qty}</td>
                               <td className="py-2 px-4">
                                  <div className="text-[10px] font-black text-slate-700">{line.description}</div>
                                  <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{line.family}</div>
                               </td>
                               <td className="py-2 px-2 text-right font-black text-[10px] text-slate-600">
                                 {line.folio === 1 ? lineTTC.toFixed(2) + '€' : '-'}
                               </td>
                               <td className="py-2 px-2 text-right font-black text-[10px] text-slate-600">
                                 {line.folio === 2 ? lineTTC.toFixed(2) + '€' : '-'}
                               </td>
                               <td className="py-2 px-2 text-right font-black text-[10px] text-slate-600">
                                 {line.folio === 3 ? lineTTC.toFixed(2) + '€' : '-'}
                               </td>
                               <td className={`py-2 px-4 text-right font-black text-[11px] ${lineTTC < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                 {lineTTC.toFixed(2)}€
                               </td>
                               <td className="py-2 px-4 text-right">
                                  <button 
                                     onClick={() => line.family === 'Paiement' ? removeSplitPayment(line.id) : removeInvoiceLine(line.id)}
                                     className="p-1 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                     <Trash2 className="w-3 h-3" />
                                  </button>
                               </td>
                             </tr>
                           )})}
                        </tbody>
                     </table>
                  </div>

                  {/* ADD LINE FORM */}
                  <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
                     <div className="flex-1 min-w-[150px] space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Famille</label>
                        <select 
                          value={newLineData.family}
                          onChange={(e) => {
                            const newFamily = PRESTATION_FAMILIES.find(f => f.name === e.target.value);
                            if (newFamily) {
                              setNewLineData({
                                ...newLineData,
                                family: e.target.value,
                                code: newFamily.prestations[0].code,
                                description: newFamily.prestations[0].label,
                                amount: newFamily.prestations[0].price
                              });
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                        >
                          {PRESTATION_FAMILIES.map(f => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                     </div>
                     <div className="w-48 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prestation</label>
                        <select 
                          value={newLineData.code}
                          onChange={(e) => {
                            const family = PRESTATION_FAMILIES.find(f => f.name === newLineData.family);
                            const presta = family?.prestations.find(p => p.code === e.target.value);
                            if (presta) {
                              setNewLineData({
                                ...newLineData,
                                code: e.target.value,
                                description: presta.label,
                                amount: presta.price
                              });
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                        >
                          {PRESTATION_FAMILIES.find(f => f.name === newLineData.family)?.prestations.map(p => (
                            <option key={p.code} value={p.code}>{p.label} ({p.price}€)</option>
                          ))}
                        </select>
                     </div>
                     <div className="w-20 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qté</label>
                        <input 
                          type="number"
                          value={newLineData.qty}
                          onChange={(e) => setNewLineData({...newLineData, qty: parseInt(e.target.value) || 1})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none" 
                        />
                     </div>
                     <div className="flex-[2] min-w-[200px] space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Libellé</label>
                        <input 
                          placeholder="Libellé de la prestation"
                          value={newLineData.description}
                          onChange={(e) => setNewLineData({...newLineData, description: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none" 
                        />
                     </div>
                     <div className="w-32 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Montant</label>
                        <div className="relative">
                           <input 
                             type="number"
                             value={newLineData.amount}
                             onChange={(e) => setNewLineData({...newLineData, amount: parseFloat(e.target.value) || 0})}
                             className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-8 py-3 text-[11px] font-bold outline-none font-black text-primary" 
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">€</span>
                        </div>
                     </div>
                     <div className="w-32 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Folio</label>
                        <select 
                          value={newLineData.folio}
                          onChange={(e) => setNewLineData({...newLineData, folio: parseInt(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none appearance-none"
                        >
                          <option value={1}>Folio 1</option>
                          <option value={2}>Folio 2</option>
                          <option value={3}>Folio 3</option>
                        </select>
                     </div>
                     <button 
                        onClick={addInvoiceLine}
                        className="w-[56px] h-[56px] bg-primary text-white rounded-[20px] text-xl font-bold hover:scale-105 transition-transform flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0"
                     >
                        <Plus className="w-6 h-6" />
                     </button>
                  </div>

                  {/* QUICK PAYMENT ACTION (Dropdown Menu) */}
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-[28px] p-4 flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                           <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                           <h5 className="text-[13px] font-black uppercase tracking-wide">Mode d'encaissement</h5>
                           <p className="text-[10px] font-bold opacity-60">Saisir un règlement dans le folio actif (F{activeFolio})</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <select 
                          value={paymentData.method}
                          onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                          className="bg-white border border-emerald-200 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[#15803d] outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 appearance-none min-w-[180px]"
                        >
                          <option value="Espèces">💵 Espèces</option>
                          <option value="CB">💳 CB</option>
                          <option value="VAD">📱 VAD</option>
                          <option value="AMEX">💳 AMEX</option>
                          <option value="Virement">🏦 Virement</option>
                          <option value="Chèque">📝 Chèque</option>
                          <option value="Débiteur">📒 Débiteur</option>
                        </select>
                        <div className="relative">
                           <input 
                             type="number" 
                             value={paymentData.amount}
                             onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                             placeholder="0.00"
                             className="w-32 bg-white border border-emerald-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm" 
                           />
                           <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">€</span>
                        </div>
                        <button 
                           onClick={() => handleSplitPayment(paymentData.method, paymentData.amount)}
                           className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                           Encaisser
                        </button>
                     </div>
                  </div>

                  {/* SETTINGS: TIERS-PAYEUR */}
                  <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="tier-payeur-check" 
                          className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary cursor-pointer"
                          checked={thirdParty.type !== 'none'}
                          onChange={(e) => setThirdParty({ ...thirdParty, type: e.target.checked ? 'company' : 'none' })}
                        />
                        <label htmlFor="tier-payeur-check" className="text-sm font-black text-slate-700 cursor-pointer">Facturer au tiers</label>
                      </div>

                      {thirdParty.type !== 'none' && (
                        <div className="flex items-center gap-6 ml-8 animate-in slide-in-from-left-2 duration-300">
                          {[1, 2, 3].map(num => (
                            <label key={num} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary"
                                checked={thirdPartyFolios.includes(num)}
                                onChange={(e) => {
                                  if (e.target.checked) setThirdPartyFolios([...thirdPartyFolios, num]);
                                  else setThirdPartyFolios(thirdPartyFolios.filter(id => id !== num));
                                }}
                              />
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Folio {num}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {thirdParty.type !== 'none' && (
                       <div className="grid grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Nom / Société</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Flowtym Corps"
                                value={thirdParty.details.name}
                                onChange={(e) => setThirdParty({ ...thirdParty, details: { ...thirdParty.details, name: e.target.value } })}
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Adresse</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="123 Avenue des Palace"
                                value={thirdParty.details.address}
                                onChange={(e) => setThirdParty({ ...thirdParty, details: { ...thirdParty.details, address: e.target.value } })}
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">SIRET</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="123 456 789 00012"
                                value={thirdParty.details.siret}
                                onChange={(e) => setThirdParty({ ...thirdParty, details: { ...thirdParty.details, siret: e.target.value } })}
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">TVA Intracom.</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="FR 12 3456789"
                                value={thirdParty.details.vat}
                                onChange={(e) => setThirdParty({ ...thirdParty, details: { ...thirdParty.details, vat: e.target.value } })}
                             />
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {checkoutTab === 'transfer' && (
                <div className="max-w-[800px] mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="p-12 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-10">
                    <div className="text-center space-y-3">
                       <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                          <ArrowLeftRight className="w-8 h-8 text-primary" />
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">Transfert de prestations</h3>
                       <p className="text-sm font-bold text-slate-400">Déplacez des lignes de facturation d'un folio vers une autre chambre occupée.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">1. Sélectionner les lignes</label>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                             {invoiceLines.filter(l => l.family !== 'Paiement').map(line => (
                               <button 
                                 key={line.id}
                                 onClick={() => {
                                    if (selectedLinesForTransfer.includes(line.id)) {
                                       setSelectedLinesForTransfer(prev => prev.filter(id => id !== line.id));
                                    } else {
                                       setSelectedLinesForTransfer(prev => [...prev, line.id]);
                                    }
                                 }}
                                 className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedLinesForTransfer.includes(line.id) ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-slate-100'}`}
                               >
                                  <div className="text-left">
                                     <div className="text-[11px] font-black text-slate-700">{line.description}</div>
                                     <div className="text-[9px] font-bold text-slate-400 uppercase">{line.date}</div>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-[11px] font-black text-slate-800">{(line.total).toFixed(2)}€</div>
                                     {selectedLinesForTransfer.includes(line.id) ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto mt-1" />
                                     ) : (
                                        <Plus className="w-4 h-4 text-slate-200 ml-auto mt-1 group-hover:text-primary transition-colors" />
                                     )}
                                  </div>
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-6">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">2. Chambre de destination</label>
                          <div className="grid grid-cols-3 gap-3">
                             {rooms.filter(r => (r.status === 'occupee' || r.status === 'Occupée') && (r.num !== roomId && r.number !== roomId)).map(room => (
                               <button 
                                 key={room.num || room.number}
                                 onClick={() => setTransferTargetRoom(room.num || room.number)}
                                 className={`py-4 rounded-2xl border font-black text-sm transition-all ${transferTargetRoom === (room.num || room.number) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-primary hover:text-primary'}`}
                               >
                                  {room.num || room.number}
                               </button>
                             ))}
                          </div>
                          
                          <div className="pt-8">
                             <button 
                               disabled={!transferTargetRoom || selectedLinesForTransfer.length === 0}
                               onClick={() => {
                                  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Prestations transférées · ${selectedLinesForTransfer.length} ligne(s) → Ch. ${transferTargetRoom}` } }));
                                  setInvoiceLines(prev => prev.filter(l => !selectedLinesForTransfer.includes(l.id)));
                                  setSelectedLinesForTransfer([]);
                                  setTransferTargetRoom('');
                               }}
                               className="w-full h-16 bg-slate-900 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl font-black text-[12px] uppercase tracking-[4px] shadow-xl hover:bg-black transition-all active:scale-95"
                             >
                                Confirmer le transfert
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {checkoutTab === 'cardex' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-12 gap-8">
                    {/* Guest Information */}
                    <div className="col-span-4 space-y-6">
                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-6 flex items-center justify-center text-slate-300">
                            <User className="w-12 h-12" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight">
                          {client?.name || 'Arathew Smith'}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Client Premium (Gold)</p>
                        <div className="flex justify-center gap-2 mt-6">
                           <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Solvable</div>
                           <div className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/10">VIP</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="flex-1">
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Dernier séjour</div>
                               <div className="text-[11px] font-bold text-slate-600 italic">"Préfère les chambres en étage élevé, allergique aux plumes."</div>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Stats & History */}
                    <div className="col-span-8 space-y-6">
                       <div className="grid grid-cols-3 gap-6">
                          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Nb Séjours</div>
                             <div className="text-2xl font-black text-slate-800">12</div>
                          </div>
                          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Total Dépenses</div>
                             <div className="text-2xl font-black text-slate-800">4,250€</div>
                          </div>
                          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-bold">Note moyenne</div>
                             <div className="text-2xl font-black text-amber-500">4.8/5</div>
                          </div>
                       </div>

                       <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                             <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Historique Récent</h5>
                             <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Voir tout</button>
                          </div>
                          <div className="p-0">
                             {[
                                { date: '12 Feb - 15 Feb 2026', room: 'Suite 501', category: 'Suite Royale', amount: '1,050€' },
                                { date: '20 Jan - 22 Jan 2026', room: 'Room 304', category: 'Double Deluxe', amount: '340€' },
                                { date: '15 Dec - 20 Dec 2025', room: 'Room 101', category: 'Standard', amount: '680€' },
                             ].map((h, i) => (
                               <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50">
                                  <div>
                                     <div className="text-[11px] font-black text-slate-700">{h.date}</div>
                                     <div className="text-[9px] font-bold text-slate-400 uppercase">{h.category}</div>
                                  </div>
                                  <div className="text-[11px] font-black text-slate-800">{h.amount}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-8 bg-white border-t border-slate-100 flex flex-wrap gap-4 items-center">
              <button 
                onClick={onClose}
                className="px-8 h-[56px] bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center gap-2 border border-slate-100 shadow-sm"
              >
                <X className="w-4 h-4" />
                Fermer
              </button>
              
              <div className="flex-1 flex gap-3">
                <button 
                  onClick={exportFacturePDF}
                  className="px-6 h-[56px] bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Visualiser PDF
                </button>
                <button 
                  onClick={printInvoice}
                  className="px-6 h-[56px] bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
                <button 
                  onClick={sendInvoiceEmail}
                  className="px-6 h-[56px] bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer
                </button>
              </div>

              {/* A10 — Bannière solde impayé inline */}
              {soldeError && (
                <div className="solde-error-banner" style={{
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 12, padding: '11px 16px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, flex: 1 }}>
                    {soldeError}
                  </span>
                  <button
                    onClick={() => setSoldeError('')}
                    style={{ fontSize: 14, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: '2px 6px' }}
                  >✕</button>
                </div>
              )}

              <button
                onClick={handleFinalize}
                className="px-12 h-[56px] bg-primary text-white rounded-2xl text-[12px] font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Finaliser</span>
                <CheckCircle2 className="w-5 h-5 relative z-10" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
