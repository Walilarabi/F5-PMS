import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  History, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Loader2, 
  ChevronDown, 
  ArrowRight,
  TrendingUp,
  LogIn,
  LogOut,
  Euro,
  Receipt,
  Printer,
  Search,
  Activity,
  Banknote,
  Percent,
  LayoutGrid,
  Mail,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ClotureProps {
  reservations: any[];
  clients: any[];
  rooms: any[];
}

interface MonthlyStat {
  to: number;
  pm: number;
  revpar: number;
  caHT: number;
  caTTC: number;
}

export const Cloture: React.FC<ClotureProps> = ({ reservations, clients, rooms }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'error' | 'loading' }[]>([]);
  const [canClose, setCanClose] = useState(false);
  const [closingStep, setClosingStep] = useState<number>(0);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('all');
  const [reportsGenerated, setReportsGenerated] = useState(false);
  
  // New State for Caisse & Verification
  const [cashInitial, setCashInitial] = useState(500);
  const [cashFinal, setCashFinal] = useState(0);
  const [unpaidInvoicesCount, setUnpaidInvoicesCount] = useState(0);

  // Derived Values
  const cashTotalReceipts = useMemo(() => {
    // Current "receipts" simulated from payments made today
    return 4850 + 420; // 5270 in mock logic
  }, []);

  const cashDiscrepancy = useMemo(() => {
    if (cashFinal === 0) return 0;
    return cashFinal - (cashInitial + cashTotalReceipts);
  }, [cashFinal, cashInitial, cashTotalReceipts]);

  // Mock data for history
  const historyData = useMemo(() => ({
    '2026': {
      1: { to: 65, pm: 138, revpar: 89.7, caHT: 42000, caTTC: 46200 },
      2: { to: 68, pm: 142, revpar: 96.5, caHT: 44500, caTTC: 48950 },
      3: { to: 72, pm: 145, revpar: 104.4, caHT: 47200, caTTC: 51920 },
      4: { to: 75, pm: 148, revpar: 111.0, caHT: 49800, caTTC: 54780 },
      5: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      6: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      7: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      8: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      9: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      10: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      11: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
      12: { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 },
    }
  }), []);

  // Pre-closing checks
  useEffect(() => {
    if (activeTab === 'today') {
      const runChecks = () => {
        const activeRes = reservations.filter(r => r.status === 'checked_in');
        const unpaid = reservations.filter(r => r.solde > 0 && r.status === 'checked_out');
        
        setUnpaidInvoicesCount(unpaid.length);

        if (activeRes.length === 0 && unpaid.length === 0) {
          setCanClose(true);
          setLogs([{ id: '1', msg: '✓ Tous les départs effectués.', type: 'success' }, { id: '2', msg: '✓ Tous les folios sont soldés.', type: 'success' }]);
        } else {
          setCanClose(false);
          const newLogs = [];
          if (activeRes.length > 0) {
            newLogs.push({ id: '1', msg: `⚠ ${activeRes.length} clients encore en séjour.`, type: 'info' });
          }
          if (unpaid.length > 0) {
            newLogs.push({ id: '2', msg: `⚠ ${unpaid.length} factures non soldées détectées.`, type: 'error' });
          }
          setLogs(newLogs);
        }
      };
      runChecks();
    }
  }, [activeTab, reservations]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'loading' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), msg, type }]);
  };

  const startCloture = async () => {
    if (isClosing) return;
    setIsClosing(true);
    setClosingStep(1);
    setProgress(10);
    setLogs([]);
    setReportsGenerated(false);

    addLog("Initialisation de la séquence de clôture...", "loading");
    await new Promise(r => setTimeout(r, 1000));
    
    addLog("Collecte des prestations du jour...", "loading");
    setProgress(30);
    await new Promise(r => setTimeout(r, 1200));
    addLog("✓ 42 prestations d'hébergement capturées", "success");
    addLog("✓ 18 prestations de restauration capturées", "success");
    
    addLog("Calcul des règlements par mode...", "loading");
    setProgress(55);
    await new Promise(r => setTimeout(r, 1500));
    addLog("✓ Règlements CB : 4 850€ traités", "success");
    addLog("✓ Règlements Espèces : 420€ traités", "success");
    
    addLog("Vérification des dépenses de caisse...", "loading");
    setProgress(75);
    await new Promise(r => setTimeout(r, 1000));
    addLog("✓ Dépense : Leroy Merlin (350€) vérifiée", "success");
    
    addLog("Sauvegarde automatique de la base (Cloud Backup)...", "loading");
    setProgress(80);
    await new Promise(r => setTimeout(r, 1200));
    addLog("✓ Archive SQL v2.3 générée et stockée.", "success");

    addLog("Génération des rapports d'audit (PDF)...", "loading");
    setProgress(90);
    await new Promise(r => setTimeout(r, 1500));
    
    addLog("Envoi automatique des rapports à la direction...", "loading");
    setProgress(95);
    await new Promise(r => setTimeout(r, 1000));
    addLog("✓ Email groupé envoyé avec succès.", "success");

    setProgress(100);
    addLog("Clôture v2.3 finalisée avec succès.", "success");
    setIsClosing(false);
    setReportsGenerated(true);
  };

  const generatePDFReport = (type: 'prestations' | 'reglements' | 'especes' | 'taxe_sejour') => {
    const hotelName = "FLOWTYM - MAS PROVENCAL AIX";
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const userName = "Ali LARABI";

    let title = "";
    let content = "";

    if (type === 'prestations') {
      title = "Main courante des prestations";
      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
          <thead style="background: #F8FAFC;">
            <tr>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">HURE</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">CH.</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">CLIENT</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">LIBELLÉ PRESTATION</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">MONTANT HT</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">TVA</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">MONTANT TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">08:15</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">101</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Pierre Bernard</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Petit-déjeuner Buffet</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">25.00 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">2.50 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">27.50 €</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">14:30</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">103</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Sophie Dubois</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Location Chambre (Double)</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">109.09 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">10.91 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">120.00 €</td>
            </tr>
            <tr style="background: #F1F5F9; font-weight: bold;">
              <td colspan="4" style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">TOTAUX DU JOUR</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">4 850.00 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">485.00 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">5 335.00 €</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (type === 'reglements') {
      title = "Main courante des règlements";
      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
          <thead style="background: #F8FAFC;">
            <tr>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">DATE/HEURE</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">CLIENT / DOSSIER</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">MODE DE PAIEMENT</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">RÉFÉRENCE</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">MONTANT ENCAISSÉ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">18/04 09:12</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Ali Larabi (RES-003)</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Carte Bancaire (Stripe)</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">ch_3Mv6...</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">1 500.00 €</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">18/04 11:20</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Pierre Bernard (RES-001)</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Espèces</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">—</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">120.00 €</td>
            </tr>
            <tr style="background: #F1F5F9; font-weight: bold;">
              <td colspan="4" style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">TOTAL ENCAISSEMENTS DU JOUR</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">5 330.00 €</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (type === 'especes') {
      title = "Encaissements et dépenses en espèces";
      content = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
          <div>
            <h4 style="font-size: 10px; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #64748B; padding-bottom: 5px;">Encaissements Espèces</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px;">
              <thead>
                <tr style="background: #F8FAFC;">
                  <th style="padding: 8px; border: 1px solid #E2E8F0; text-align: left;">SOURCE</th>
                  <th style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">MONTANT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">Règlements Clients</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">420.00 €</td>
                </tr>
                <tr>
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">Ventes Bar (Cash)</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">45.00 €</td>
                </tr>
                <tr style="font-weight: bold; background: #ECFDF5;">
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">TOTAL ENTRÉES</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">465.00 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 style="font-size: 10px; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #64748B; padding-bottom: 5px;">Dépenses de Caisse</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px;">
              <thead>
                <tr style="background: #F8FAFC;">
                  <th style="padding: 8px; border: 1px solid #E2E8F0; text-align: left;">LIBELLÉ / MAGASIN</th>
                  <th style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">MONTANT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">Leroy Merlin (Réparations)</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">350.00 €</td>
                </tr>
                <tr>
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">Boulangerie (Petit Déj Appoint)</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">12.50 €</td>
                </tr>
                <tr style="font-weight: bold; background: #FEF2F2;">
                  <td style="padding: 6px; border: 1px solid #E2E8F0;">TOTAL SORTIES</td>
                  <td style="padding: 6px; border: 1px solid #E2E8F0; text-align: right;">362.50 €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style="margin-top: 40px; padding: 20px; background: #F1F5F9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="text-transform: uppercase; font-weight: 900; font-size: 12px; color: #475569;">Montant net à remettre en banque (Cash)</div>
          <div style="font-size: 24px; font-weight: 900; color: #4A1D6D;">102.50 €</div>
        </div>
      `;
    } else if (type === 'taxe_sejour') {
      title = "Rapport de la Taxe de Séjour";
      content = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
          <thead style="background: #F8FAFC;">
            <tr>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">CHAMBRE</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: left;">CLIENT</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">NUITS</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">TAUX UNITAIRE</th>
              <th style="padding: 10px; border: 1px solid #E2E8F0; text-align: right;">MONTANT COLLECTÉ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">101</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Pierre Bernard</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center;">4</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">2.50 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">10.00 €</td>
            </tr>
             <tr>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">103</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0;">Sophie Dubois</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center;">3</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">2.50 €</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">7.50 €</td>
            </tr>
            <tr style="background: #F1F5F9; font-weight: bold;">
              <td colspan="4" style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">TOTAL TAXE DE SÉJOUR DU JOUR</td>
              <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: right;">17.50 €</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const htmlString = `
      <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #1E293B;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #4A1D6D;">${hotelName}</h1>
            <p style="margin: 2px 0; font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 2px;">Rapport d'Audit Journalier</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #1E293B;">SESSION : ${userName}</p>
            <p style="margin: 2px 0; font-size: 10px; font-weight: 500; color: #64748B;">ÉDITÉ LE ${dateStr} À ${timeStr}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #E2E8F0;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">${title}</h2>
        </div>

        ${content}

        <div style="position: fixed; bottom: 20px; left: 40px; right: 40px; border-top: 1px solid #E2E8F0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94A3B8; font-weight: bold; text-transform: uppercase;">
          <div>Flowtym PMS - v2.3 Digital Core</div>
          <div>Page 1 / 1 — Imprimé le ${dateStr}</div>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlString;
    
    const opt = {
      margin: 0,
      filename: `RAPPORT_${type.toUpperCase()}_${now.toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          const sanitizer = (html: string) => html
            .replace(/oklch\([^)]+\)/g, '#8B5CF6')
            .replace(/oklab\([^)]+\)/g, '#8B5CF6');
          clonedDoc.head.innerHTML = sanitizer(clonedDoc.head.innerHTML);
          clonedDoc.body.innerHTML = sanitizer(clonedDoc.body.innerHTML);
          
          const styleOverride = clonedDoc.createElement('style');
          styleOverride.innerHTML = `
            * { color-scheme: light !important; }
            .bg-primary { background-color: #8B5CF6 !important; }
            th { background-color: #8B5CF6 !important; color: #ffffff !important; }
          `;
          clonedDoc.head.appendChild(styleOverride);
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const renderHistoryTable = () => {
    if (month === 'all') {
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2.5 text-left">Mois</th>
              <th className="px-4 py-2.5 text-center">TO% Moyen</th>
              <th className="px-4 py-2.5 text-center">PM Moyen HT</th>
              <th className="px-4 py-2.5 text-center">RevPAR Moyen HT</th>
              <th className="px-4 py-2.5 text-right">CA Moyen HT</th>
              <th className="px-4 py-2.5 text-right">CA Moyen TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {months.map((m, i) => {
              // @ts-ignore
              const data = historyData[year]?.[i + 1] || { to: 0, pm: 0, revpar: 0, caHT: 0, caTTC: 0 };
              const isFuture = i + 1 > 4; // Mock future months
              return (
                <tr key={m} className={`hover:bg-slate-50 transition-colors group ${isFuture ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5 font-black text-slate-700 text-[11px]">{m}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-600 text-[11px]">{data.to}%</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-600 text-[11px]">{data.pm}€</td>
                  <td className="px-4 py-2.5 text-center font-bold text-slate-600 text-[11px]">{data.revpar}€</td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-900 group-hover:text-primary transition-colors text-[11px]">{data.caHT.toLocaleString()}€</td>
                  <td className="px-4 py-2.5 text-right font-black text-emerald-600 text-[11px]">{data.caTTC.toLocaleString()}€</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else {
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      return (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-center">Statut</th>
              <th className="px-4 py-2 text-center">TO%</th>
              <th className="px-4 py-2 text-center">PM HT</th>
              <th className="px-4 py-2 text-center">RevPAR HT</th>
              <th className="px-4 py-2 text-right">CA HT</th>
              <th className="px-4 py-2 text-right">CA TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(parseInt(year), parseInt(month) - 1, day);
              const isTodayOrPast = dateObj <= new Date();
              const mData = {
                to: Math.floor(Math.random() * 20) + 60,
                pm: Math.floor(Math.random() * 40) + 120,
                caHT: Math.floor(Math.random() * 2000) + 3000
              };
              return (
                <tr key={day} className={`hover:bg-slate-50 transition-colors group ${!isTodayOrPast ? 'opacity-30' : ''}`}>
                  <td className="px-4 py-2 font-black text-slate-700 text-[10px]">{day.toString().padStart(2, '0')}/{month.padStart(2, '0')}/{year}</td>
                  <td className="px-4 py-2 text-center">
                    {isTodayOrPast ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100 italic">Clôturé</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-200">En attente</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-slate-600 text-[10px]">{isTodayOrPast ? mData.to : 0}%</td>
                  <td className="px-4 py-2 text-center font-bold text-slate-600 text-[10px]">{isTodayOrPast ? mData.pm : 0}€</td>
                  <td className="px-4 py-2 text-center font-bold text-slate-600 text-[10px]">{isTodayOrPast ? Math.floor(mData.pm * mData.to / 100) : 0}€</td>
                  <td className="px-4 py-2 text-right font-black text-slate-900 group-hover:text-primary transition-colors text-[10px]">{isTodayOrPast ? mData.caHT.toLocaleString() : 0}€</td>
                  <td className="px-4 py-2 text-right font-black text-emerald-600 text-[10px]">{isTodayOrPast ? Math.floor(mData.caHT * 1.1).toLocaleString() : 0}€</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Lock className="w-7 h-7 text-primary" /> Clôture & Sauvegarde
          </h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Audit journalier et archivage des données financières</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 gap-1">
          <button 
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'today' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Lock className="w-3.5 h-3.5" /> Clôture du jour
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <History className="w-3.5 h-3.5" /> Historique
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'today' ? (
          <motion.div 
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick date search bar within Today tab */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Search className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Accès rapide archive :</span>
              </div>
              <input 
                type="date" 
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-primary transition-all"
              />
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Consulter</button>
            </div>

      <div className="bg-white rounded-[40px] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
               {/* Decorative background logo */}
               <div className="absolute -top-20 -right-20 opacity-[0.03] rotate-12">
                 <Lock className="w-80 h-80 text-primary" />
               </div>

               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${canClose ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} shadow-sm`}>
                          {canClose ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                       </div>
                       <div>
                          <h3 className="text-lg font-black text-slate-800">Clôture du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{canClose ? 'Prêt à valider' : 'Conditions non remplies'}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression de l'audit interne</span>
                          <span className="text-lg font-black text-primary italic">{progress}%</span>
                       </div>
                       <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                          />
                       </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-6 space-y-2 h-[220px] overflow-y-auto scrollbar-hide font-mono text-[11px]">
                       {logs.map((log) => (
                         <div key={log.id} className="flex gap-3 py-1 items-start group">
                            {log.type === 'loading' ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin mt-0.5" /> : (log.type === 'success' || log.type === 'error') ? (log.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5" />) : <Activity className="w-3.5 h-3.5 text-slate-300 mt-0.5" />}
                            <span className={`${log.type === 'success' ? 'text-emerald-700 font-bold' : log.type === 'error' ? 'text-rose-600 font-bold' : log.type === 'info' ? 'text-slate-500' : 'text-primary'} tracking-tight`}>{log.msg}</span>
                         </div>
                       ))}
                       {isClosing && (
                         <div className="flex gap-3 py-1 items-center italic text-primary animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Séquence d'audit v2.3 en cours...</span>
                         </div>
                       )}
                    </div>

                    {/* Pre-closing situations summary */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className={`p-4 rounded-2xl border transition-all ${unpaidInvoicesCount > 0 ? 'bg-rose-50 border-rose-100 shadow-sm shadow-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-center">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Factures ouvertes</div>
                             <div className={`p-1.5 rounded-lg ${unpaidInvoicesCount > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                <FileText className="w-3 h-3" />
                             </div>
                          </div>
                          <div className={`text-2xl font-black mt-1 ${unpaidInvoicesCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{unpaidInvoicesCount}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Bloquant pour clôture</div>
                       </div>
                       <div className={`p-4 rounded-2xl border transition-all ${Math.abs(cashDiscrepancy) > 0 ? 'bg-amber-50 border-amber-100 shadow-sm shadow-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-center">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Écart de caisse</div>
                             <div className={`p-1.5 rounded-lg ${Math.abs(cashDiscrepancy) > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                <AlertTriangle className="w-3 h-3" />
                             </div>
                          </div>
                          <div className={`text-2xl font-black mt-1 ${Math.abs(cashDiscrepancy) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{cashDiscrepancy.toFixed(2)}€</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Audit manuel requis</div>
                       </div>
                    </div>

                    <div className="bg-white border-2 border-slate-100 rounded-3xl p-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Euro className="w-3.5 h-3.5 text-primary" /> Fermeture de caisse réception
                       </h4>
                       <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                          <div>
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Montant initial</label>
                             <div className="relative">
                                < Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <input 
                                  type="number" 
                                  value={cashInitial} 
                                  onChange={(e) => setCashInitial(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-8 pr-4 text-xs font-black outline-none focus:bg-white focus:border-primary transition-all"
                                />
                             </div>
                          </div>
                          <div>
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total encaissements</label>
                             <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-black text-slate-500 flex items-center gap-2">
                                <Euro className="w-3 h-3 text-slate-300" /> {cashTotalReceipts.toLocaleString()} €
                             </div>
                          </div>
                          <div className="col-span-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Montant final (Compté)</label>
                             <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
                                <input 
                                  type="number" 
                                  placeholder="Saisir le total"
                                  value={cashFinal || ''}
                                  onChange={(e) => setCashFinal(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-8 pr-4 text-xs font-black outline-none focus:bg-white focus:border-primary transition-all"
                                />
                             </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Écart</label>
                            <div className={`bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-black flex items-center justify-between ${cashDiscrepancy < 0 ? 'text-rose-500' : cashDiscrepancy > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                               <span>{cashDiscrepancy.toFixed(2)} €</span>
                               {cashDiscrepancy !== 0 && <AlertTriangle className="w-3 h-3" />}
                            </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                       <button className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Consulter Folios</button>
                       <button 
                         onClick={startCloture}
                         disabled={!canClose || isClosing}
                         className={`px-12 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 transition-all flex items-center gap-3 ${(!canClose || isClosing) ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-primary-dark hover:scale-105 active:scale-95'}`}
                       >
                          {isClosing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                          {isClosing ? 'Clôture en cours...' : 'Lancer la clôture'}
                       </button>
                    </div>
                  </div>

                  <div className="w-full md:w-80 space-y-4">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" /> Dossiers d'audit
                       </h4>
                       <div className="space-y-2">
                          {[
                            { id: 'prestations', label: 'Main courante Prestations', icon: <Receipt className="w-3.5 h-3.5" /> },
                            { id: 'reglements', label: 'Main courante Règlements', icon: < Euro className="w-3.5 h-3.5" /> },
                            { id: 'especes', label: 'Encaissements & Dépenses', icon: <Banknote className="w-3.5 h-3.5" /> },
                            { id: 'taxe_sejour', label: 'Rapport Taxe de Séjour', icon: <Landmark className="w-3.5 h-3.5" /> }
                          ].map(rep => (
                            <button 
                              key={rep.id}
                              onClick={() => generatePDFReport(rep.id as any)}
                              disabled={!reportsGenerated}
                              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${reportsGenerated ? 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary shadow-sm' : 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed'}`}
                            >
                               <div className={`${reportsGenerated ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-400'} p-2 rounded-lg`}>{rep.icon}</div>
                               <span className="text-[9px] font-black uppercase tracking-tight text-left leading-tight">{rep.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="p-6 rounded-[32px] bg-slate-50/30 border-2 border-slate-100 border-dashed text-center flex flex-col items-center">
                       <ShieldCheck className="w-8 h-8 text-slate-300 mb-2" />
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-loose">Archivage v2.3 Digital Core<br/>Cloud Backup : Actif</p>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[40px] p-6 border border-slate-200 shadow-sm">
               <div className="flex flex-wrap gap-8 items-end mb-6 pb-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Année fiscale</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                       <select 
                         value={year}
                         onChange={(e) => setYear(e.target.value)}
                         className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-3 text-xs font-black outline-none focus:bg-white focus:border-primary transition-all appearance-none min-w-[140px]"
                       >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mois de reporting</label>
                    <div className="relative">
                       <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                       <select 
                         value={month}
                         onChange={(e) => setMonth(e.target.value)}
                         className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-3 text-xs font-black outline-none focus:bg-white focus:border-primary transition-all appearance-none min-w-[200px]"
                       >
                          <option value="all">Résumé Annuel</option>
                          {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => (
                            <option key={m} value={(i + 1).toString()}>{m}</option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex-1" />

                  <div className="flex gap-3">
                    <button className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100 shadow-sm">
                       <Printer className="w-4 h-4" /> Imprimer
                    </button>
                    <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 border border-emerald-500">
                       <Download className="w-4 h-4" /> Export Excel
                    </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                 {renderHistoryTable()}
               </div>

               <div className="mt-4 grid grid-cols-4 gap-4 p-5 bg-slate-50/50 rounded-[32px] border border-slate-100">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TO% Période</div>
                    <div className="text-xl font-black text-slate-800 tracking-tighter">72.4%</div>
                    <div className="text-[9px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">↑ +4.2% <span className="text-slate-300 font-medium">vs N-1</span></div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prix Moyen HT</div>
                    <div className="text-xl font-black text-slate-800 tracking-tighter">146.50€</div>
                    <div className="text-[9px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">↑ +2.1% <span className="text-slate-300 font-medium">vs N-1</span></div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">RevPAR HT</div>
                    <div className="text-xl font-black text-slate-800 tracking-tighter">106.10€</div>
                    <div className="text-[9px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">↑ +6.3% <span className="text-slate-300 font-medium">vs N-1</span></div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CA Total TTC</div>
                    <div className="text-xl font-black text-primary tracking-tighter">211 870€</div>
                    <div className="text-[9px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">↑ +8.5% <span className="text-slate-300 font-medium">vs N-1</span></div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center p-8 text-slate-400 italic text-[10px] font-bold uppercase tracking-[4px] opacity-30">
        Flowtym Digital Compliance · Audit System v2.3 · Data Secured via AI Studio Build
      </div>
    </div>
  );
};
