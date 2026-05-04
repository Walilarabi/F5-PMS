import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'credit_note';
type PaymentMethod = 'cash' | 'card' | 'transfer' | 'ota' | 'check';
type LineSource = 'night_audit' | 'manual' | 'pos' | 'extra';
type AccountType = 'client' | 'company' | 'ota';

interface Account {
  id: string;
  type: AccountType;
  name: string;
  address: string;
  city: string;
  zip: string;
  email: string;
  siret?: string;
  vat_number?: string;
}

interface InvoiceLine {
  id: string;
  folio_id: string;
  date: string;
  product_code: string;
  family: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  source: LineSource;
  locked: boolean; // après émission
}

interface Folio {
  id: string;
  invoice_id: string;
  account_id: string;
  label: string;
  color: string;
  lines: InvoiceLine[];
}

interface Payment {
  id: string;
  invoice_id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  reservation_id: string;
  account_id: string;
  status: InvoiceStatus;
  folios: Folio[];
  payments: Payment[];
  created_at: string;
  issued_at?: string;
  paid_at?: string;
  // Infos réservation liées
  guest_name: string;
  room_id: string;
  checkin: string;
  checkout: string;
  nights: number;
}

// ─── Produits catalogue ────────────────────────────────────────────────────────
const PRODUCTS = [
  { code: 'HEB-DBL', family: 'Hébergement',      name: 'Nuitée Double',          price_ht: 109.09, tva: 10   },
  { code: 'HEB-SUI', family: 'Hébergement',      name: 'Nuitée Suite',            price_ht: 181.82, tva: 10   },
  { code: 'HEB-FAM', family: 'Hébergement',      name: 'Nuitée Famille',          price_ht: 145.45, tva: 10   },
  { code: 'RES-PDJ', family: 'Restauration',     name: 'Petit-déjeuner',          price_ht: 13.27,  tva: 10   },
  { code: 'RES-DMI', family: 'Restauration',     name: 'Demi-pension',            price_ht: 35.51,  tva: 10   },
  { code: 'RES-MIN', family: 'Restauration',     name: 'Minibar',                 price_ht: 8.18,   tva: 10   },
  { code: 'SPA-001', family: 'Spa & Bien-être',  name: 'Soin corps 60min',        price_ht: 76.36,  tva: 20   },
  { code: 'SPA-002', family: 'Spa & Bien-être',  name: 'Massage relaxant',        price_ht: 54.55,  tva: 20   },
  { code: 'PK-001',  family: 'Services',          name: 'Parking / nuit',         price_ht: 13.64,  tva: 20   },
  { code: 'LIN-001', family: 'Services',          name: 'Linge supplémentaire',   price_ht: 9.09,   tva: 20   },
  { code: 'TEL-001', family: 'Services',          name: 'Téléphone international',price_ht: 4.55,   tva: 20   },
  { code: 'TX-SEJ',  family: 'Taxe séjour',       name: 'Taxe de séjour',         price_ht: 1.60,   tva: 0    },
  { code: 'REM-COM', family: 'Remise',            name: 'Remise commerciale',      price_ht: 0,      tva: 0    },
  { code: 'NOS-001', family: 'Pénalité',          name: 'Frais no-show',           price_ht: 109.09, tva: 10   },
  { code: 'CAN-001', family: 'Pénalité',          name: 'Frais annulation',        price_ht: 54.55,  tva: 10   },
];

const PRODUCT_FAMILIES = [...new Set(PRODUCTS.map(p => p.family))];

const METHOD_LABELS: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
  cash:     { label: 'Espèces',  icon: '💵', color: '#059669' },
  card:     { label: 'CB/TPE',   icon: '💳', color: '#2563EB' },
  transfer: { label: 'Virement', icon: '🏦', color: '#7C3AED' },
  ota:      { label: 'OTA',      icon: '🌐', color: '#D97706' },
  check:    { label: 'Chèque',   icon: '📄', color: '#64748B' },
};

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Brouillon',  color: '#64748B', bg: '#F8FAFC' },
  issued:      { label: 'Émise',      color: '#2563EB', bg: '#EFF6FF' },
  paid:        { label: 'Payée',      color: '#059669', bg: '#ECFDF5' },
  cancelled:   { label: 'Annulée',    color: '#DC2626', bg: '#FEF2F2' },
  credit_note: { label: 'Avoir',      color: '#D97706', bg: '#FFF7ED' },
};

const FOLIO_COLORS = ['#8B5CF6', '#2563EB', '#059669', '#D97706'];
const FOLIO_LABELS = ['Folio Chambre', 'Folio Société', 'Folio OTA', 'Folio Extras'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _invoiceSeq = 1000;
const nextInvoiceNumber = () => `FA-${new Date().getFullYear()}-${String(++_invoiceSeq).padStart(4, '0')}`;
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR');
const fmtEuro = (n: number) => n.toFixed(2).replace('.', ',') + ' €';
const TODAY = new Date().toISOString().split('T')[0];

const calcLine = (qty: number, price_ht: number, tva: number): Pick<InvoiceLine, 'total_ht' | 'total_tva' | 'total_ttc'> => {
  const ht  = qty * price_ht;
  const tvaAmt = ht * tva / 100;
  return { total_ht: ht, total_tva: tvaAmt, total_ttc: ht + tvaAmt };
};

// ─── Night Audit Engine ───────────────────────────────────────────────────────
const generateNightAuditLines = (invoice: Invoice): InvoiceLine[] => {
  const lines: InvoiceLine[] = [];
  const roomProduct = PRODUCTS.find(p => p.code === 'HEB-DBL') || PRODUCTS[0];
  const d = new Date(invoice.checkin + 'T00:00:00');
  for (let i = 0; i < invoice.nights; i++) {
    const dateStr = new Date(d.getTime() + i * 86400000).toISOString().split('T')[0];
    const calc = calcLine(1, roomProduct.price_ht, roomProduct.tva);
    lines.push({
      id: uid(), folio_id: invoice.folios[0]?.id || '',
      date: dateStr, product_code: roomProduct.code,
      family: roomProduct.family,
      description: `Nuitée – Ch. ${invoice.room_id} – ${fmtDate(dateStr)}`,
      quantity: 1, unit_price_ht: roomProduct.price_ht,
      tva_rate: roomProduct.tva,
      ...calc, source: 'night_audit', locked: false,
    });
  }
  // Taxe de séjour
  const tx = PRODUCTS.find(p => p.code === 'TX-SEJ')!;
  const txCalc = calcLine(invoice.nights * 2, tx.price_ht, tx.tva);
  lines.push({
    id: uid(), folio_id: invoice.folios[0]?.id || '',
    date: invoice.checkin, product_code: tx.code,
    family: tx.family,
    description: `Taxe de séjour – ${invoice.nights} nuit(s) × 2 pers.`,
    quantity: invoice.nights * 2, unit_price_ht: tx.price_ht,
    tva_rate: tx.tva, ...txCalc, source: 'night_audit', locked: false,
  });
  return lines;
};

// ─── Données mock ─────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', type: 'client', name: 'Pierre Bernard', address: '12 rue de la Paix', city: 'Paris', zip: '75001', email: 'pierre.bernard@email.fr' },
  { id: 'acc2', type: 'company', name: 'SARL Tech Innovation', address: '45 avenue des Champs', city: 'Lyon', zip: '69001', email: 'compta@tech-innovation.fr', siret: '123 456 789 00012', vat_number: 'FR12 123456789' },
  { id: 'acc3', type: 'ota', name: 'Booking.com', address: 'Herengracht 597', city: 'Amsterdam', zip: '1017 CE', email: 'invoicing@booking.com' },
  { id: 'acc4', type: 'client', name: 'Sophie Martin', address: '8 allée des Roses', city: 'Bordeaux', zip: '33000', email: 'sophie.martin@gmail.com' },
];

const buildMockInvoices = (): Invoice[] => {
  const makeInvoice = (guest: string, room: string, ci: string, co: string, status: InvoiceStatus): Invoice => {
    const nights = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
    const acc = MOCK_ACCOUNTS[0];
    const fId1 = uid(); const fId2 = uid();
    const inv: Invoice = {
      id: uid(), invoice_number: nextInvoiceNumber(),
      reservation_id: uid(),
      account_id: acc.id, status,
      guest_name: guest, room_id: room, checkin: ci, checkout: co, nights,
      created_at: ci, issued_at: status !== 'draft' ? ci : undefined,
      folios: [
        { id: fId1, invoice_id: '', account_id: acc.id, label: FOLIO_LABELS[0], color: FOLIO_COLORS[0], lines: [] },
        { id: fId2, invoice_id: '', account_id: acc.id, label: FOLIO_LABELS[1], color: FOLIO_COLORS[1], lines: [] },
      ],
      payments: [],
    };
    const auditLines = generateNightAuditLines(inv);
    inv.folios[0].lines = auditLines.map(l => ({ ...l, folio_id: fId1 }));
    if (status === 'paid') {
      const total = inv.folios[0].lines.reduce((s, l) => s + l.total_ttc, 0);
      inv.payments = [{ id: uid(), invoice_id: inv.id, date: co, amount: total, method: 'card', reference: `CB-${uid()}`, note: '' }];
    }
    return inv;
  };

  return [
    makeInvoice('Pierre Bernard', '101', '2026-04-20', '2026-04-23', 'paid'),
    makeInvoice('Sophie Martin', '205', '2026-04-22', '2026-04-24', 'issued'),
    makeInvoice('Jean Dupont', '312', '2026-04-24', '2026-04-27', 'draft'),
    makeInvoice('Marie Leclerc', '118', '2026-04-25', '2026-04-26', 'draft'),
  ];
};

// ─── Calcul totaux ─────────────────────────────────────────────────────────────
const calcInvoiceTotals = (invoice: Invoice) => {
  const allLines = invoice.folios.flatMap(f => f.lines);
  const totalHT  = allLines.reduce((s, l) => s + l.total_ht, 0);
  const totalTVA = allLines.reduce((s, l) => s + l.total_tva, 0);
  const totalTTC = allLines.reduce((s, l) => s + l.total_ttc, 0);
  const paid     = invoice.payments.reduce((s, p) => s + p.amount, 0);
  // TVA par taux
  const tvaByRate: Record<string, { ht: number; tva: number }> = {};
  allLines.forEach(l => {
    if (!tvaByRate[l.tva_rate]) tvaByRate[l.tva_rate] = { ht: 0, tva: 0 };
    tvaByRate[l.tva_rate].ht  += l.total_ht;
    tvaByRate[l.tva_rate].tva += l.total_tva;
  });
  return { totalHT, totalTVA, totalTTC, paid, balance: totalTTC - paid, tvaByRate };
};

// ─── PDF légal français ────────────────────────────────────────────────────────
const printLegalInvoice = (invoice: Invoice, account: Account) => {
  const t = calcInvoiceTotals(invoice);
  const win = window.open('', '_blank');
  if (!win) return;

  const linesHtml = invoice.folios.flatMap(folio =>
    folio.lines.map(l => `
      <tr>
        <td>${l.date}</td>
        <td>${l.product_code}</td>
        <td>${l.description}</td>
        <td style="text-align:center">${l.quantity}</td>
        <td style="text-align:right">${fmtEuro(l.unit_price_ht)}</td>
        <td style="text-align:center">${l.tva_rate}%</td>
        <td style="text-align:right">${fmtEuro(l.total_ht)}</td>
        <td style="text-align:right">${fmtEuro(l.total_ttc)}</td>
      </tr>`)
  ).join('');

  const tvaHtml = Object.entries(t.tvaByRate).map(([rate, v]) => `
    <tr>
      <td>TVA ${rate}%</td>
      <td style="text-align:right">${fmtEuro(v.ht)}</td>
      <td style="text-align:right">${fmtEuro(v.tva)}</td>
    </tr>`
  ).join('');

  const paymentsHtml = invoice.payments.map(p => `
    <tr>
      <td>${p.date}</td>
      <td>${METHOD_LABELS[p.method].label}</td>
      <td>${p.reference}</td>
      <td style="text-align:right;color:#059669;font-weight:700">${fmtEuro(p.amount)}</td>
    </tr>`
  ).join('');

  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'DM Sans',sans-serif;color:#1e293b;font-size:12px;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:32px;border-bottom:3px solid #8B5CF6}
    .hotel h1{font-size:24px;font-weight:800;color:#4A1D6D;margin:0 0 4px}
    .hotel p{font-size:11px;color:#64748B;line-height:1.8}
    .inv-badge{background:#4A1D6D;color:white;padding:4px 14px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:.08em;margin-bottom:8px;display:inline-block}
    .inv-num{font-size:22px;font-weight:800;color:#4A1D6D}
    .parties{display:flex;gap:40px;margin-bottom:32px}
    .party{flex:1;background:#f8fafc;border-radius:12px;padding:16px}
    .party-label{font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
    .party-name{font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px}
    .party-detail{font-size:11px;color:#64748B;line-height:1.7}
    .sejour{background:#EDE9FE;border-radius:10px;padding:12px 16px;display:flex;gap:32px;margin-bottom:28px;font-size:11px}
    .sejour span{font-weight:700;color:#5B21B6}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11px}
    thead th{background:#4A1D6D;color:white;padding:8px 10px;text-align:left;font-weight:600;font-size:10px}
    tbody tr:nth-child(even){background:#f8fafc}
    td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
    .totals{margin-left:auto;width:300px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
    .total-row{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #f1f5f9;font-size:12px}
    .grand{background:#4A1D6D;color:white;font-weight:800;font-size:14px;padding:12px 14px;display:flex;justify-content:space-between}
    .badge-status{display:inline-block;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:700}
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:9px;color:#94A3B8;text-align:center;line-height:1.9}
    .mention{margin-top:16px;padding:10px 14px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;font-size:10px;color:#92400e}
    @media print{body{padding:20px}.no-print{display:none}}
  </style></head><body>

  <div class="header">
    <div class="hotel">
      <h1>Flowtym Hotel</h1>
      <p>Mas Provencal · 123 Avenue du Palais · 13100 Aix-en-Provence<br>
      SIREN 123 456 789 · SIRET 123 456 789 00012 · TVA FR12 123456789<br>
      Tél : +33 4 42 00 00 00 · contact@flowtym-hotel.fr</p>
    </div>
    <div style="text-align:right">
      <div class="inv-badge">${invoice.status === 'credit_note' ? 'AVOIR' : 'FACTURE'}</div>
      <div class="inv-num">${invoice.invoice_number}</div>
      <div style="margin-top:6px;font-size:11px;color:#64748B">
        Émise le : <strong>${invoice.issued_at ? fmtDate(invoice.issued_at) : fmtDate(TODAY)}</strong><br>
        Créée le : ${fmtDate(invoice.created_at)}
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Hôtel</div>
      <div class="party-name">Flowtym Hotel</div>
      <div class="party-detail">123 Avenue du Palais<br>13100 Aix-en-Provence<br>SIREN 123 456 789</div>
    </div>
    <div class="party">
      <div class="party-label">Facturé à</div>
      <div class="party-name">${account.name}</div>
      <div class="party-detail">
        ${account.address}<br>
        ${account.zip} ${account.city}<br>
        ${account.email}
        ${account.siret ? `<br>SIRET : ${account.siret}` : ''}
        ${account.vat_number ? `<br>N° TVA : ${account.vat_number}` : ''}
      </div>
    </div>
    <div class="party">
      <div class="party-label">Réservation</div>
      <div class="party-name">${invoice.guest_name}</div>
      <div class="party-detail">
        Chambre ${invoice.room_id}<br>
        Arrivée : ${fmtDate(invoice.checkin)}<br>
        Départ : ${fmtDate(invoice.checkout)}<br>
        Durée : ${invoice.nights} nuit(s)
      </div>
    </div>
  </div>

  <table>
    <thead><tr><th>Date</th><th>Code</th><th>Description</th><th style="text-align:center">Qté</th><th style="text-align:right">PU HT</th><th style="text-align:center">TVA</th><th style="text-align:right">Total HT</th><th style="text-align:right">Total TTC</th></tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap">
    <div style="flex:1;min-width:280px">
      <p style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Récapitulatif TVA</p>
      <table style="margin:0">
        <thead><tr><th>Taux</th><th style="text-align:right">Base HT</th><th style="text-align:right">Montant TVA</th></tr></thead>
        <tbody>${tvaHtml}</tbody>
      </table>
      ${invoice.payments.length > 0 ? `
      <p style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-top:16px;margin-bottom:8px">Paiements enregistrés</p>
      <table style="margin:0">
        <thead><tr><th>Date</th><th>Mode</th><th>Référence</th><th style="text-align:right">Montant</th></tr></thead>
        <tbody>${paymentsHtml}</tbody>
      </table>` : ''}
    </div>
    <div class="totals">
      <div class="total-row"><span>Sous-total HT</span><span>${fmtEuro(t.totalHT)}</span></div>
      <div class="total-row"><span>Total TVA</span><span>${fmtEuro(t.totalTVA)}</span></div>
      <div class="grand"><span>TOTAL TTC</span><span>${fmtEuro(t.totalTTC)}</span></div>
      ${t.paid > 0 ? `
      <div class="total-row" style="color:#059669"><span>Déjà réglé</span><span>-${fmtEuro(t.paid)}</span></div>
      <div class="total-row" style="font-weight:700;color:${t.balance > 0.01 ? '#DC2626' : '#059669'}"><span>Solde restant</span><span>${fmtEuro(t.balance)}</span></div>` : ''}
    </div>
  </div>

  ${invoice.status === 'issued' ? `<div class="mention">⚖️ Facture définitive — toute modification requiert l'émission d'un avoir (art. L. 123-22 C. com.). Conservation obligatoire 10 ans.</div>` : ''}

  <div class="footer">
    Flowtym Hotel · SAS au capital de 1 000 000 € · RCS Aix-en-Provence B 123 456 789 · APE 5510Z<br>
    Tél : +33 4 42 00 00 00 · Fax : +33 4 42 00 00 01 · contact@flowtym-hotel.fr · www.flowtym-hotel.fr<br>
    En cas de litige, le tribunal compétent est celui du siège social. — Pénalités de retard : taux BCE + 10 points — Indemnité forfaitaire recouvrement : 40 €<br>
    <em>Merci de votre confiance — Nous espérons vous accueillir à nouveau très prochainement.</em>
  </div>
  <script>window.onload=()=>window.print();</script>
  </body></html>`);
  win.document.close();
};

// ─── Composant InvoiceModal ───────────────────────────────────────────────────
const InvoiceModal: React.FC<{
  invoice: Invoice;
  accounts: Account[];
  onClose: () => void;
  onUpdate: (inv: Invoice) => void;
}> = ({ invoice: initialInvoice, accounts, onClose, onUpdate }) => {
  const [inv, setInv] = useState<Invoice>(initialInvoice);
  const [activeFolioId, setActiveFolioId] = useState(initialInvoice.folios[0]?.id || '');
  const [tab, setTab] = useState<'folios' | 'payments' | 'audit'>('folios');
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [addPayOpen, setAddPayOpen] = useState(false);
  const [newLine, setNewLine] = useState({ product_code: '', qty: 1, unit_price_ht: 0, tva_rate: 10, description: '', date: TODAY, family: '' });
  const [newPay, setNewPay] = useState({ amount: 0, method: 'card' as PaymentMethod, reference: '', note: '', date: TODAY });
  const [issueConfirm, setIssueConfirm] = useState(false);

  const totals = useMemo(() => calcInvoiceTotals(inv), [inv]);
  const account = accounts.find(a => a.id === inv.account_id) || accounts[0];
  const locked = inv.status === 'issued' || inv.status === 'paid';
  const activeFolio = inv.folios.find(f => f.id === activeFolioId);

  const save = useCallback((updated: Invoice) => { setInv(updated); onUpdate(updated); }, [onUpdate]);

  // Ajouter une ligne
  const handleAddLine = () => {
    if (!newLine.description || !activeFolioId) return;
    const calc = calcLine(newLine.qty, newLine.unit_price_ht, newLine.tva_rate);
    const line: InvoiceLine = {
      id: uid(), folio_id: activeFolioId,
      date: newLine.date, product_code: newLine.product_code,
      family: newLine.family, description: newLine.description,
      quantity: newLine.qty, unit_price_ht: newLine.unit_price_ht,
      tva_rate: newLine.tva_rate, ...calc, source: 'manual', locked: false,
    };
    const updated = {
      ...inv,
      folios: inv.folios.map(f => f.id === activeFolioId ? { ...f, lines: [...f.lines, line] } : f),
    };
    save(updated);
    setNewLine({ product_code: '', qty: 1, unit_price_ht: 0, tva_rate: 10, description: '', date: TODAY, family: '' });
    setAddLineOpen(false);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Ligne ajoutée · ${line.description}` } }));
  };

  // Sélectionner un produit
  const selectProduct = (code: string) => {
    const p = PRODUCTS.find(x => x.code === code);
    if (p) setNewLine(prev => ({ ...prev, product_code: p.code, description: p.name, unit_price_ht: p.price_ht, tva_rate: p.tva, family: p.family }));
  };

  // Supprimer ligne
  const deleteLine = (folioId: string, lineId: string) => {
    if (locked) return;
    const updated = {
      ...inv,
      folios: inv.folios.map(f => f.id === folioId ? { ...f, lines: f.lines.filter(l => l.id !== lineId) } : f),
    };
    save(updated);
  };

  // Ajouter paiement
  const handleAddPayment = () => {
    if (newPay.amount <= 0) return;
    const pay: Payment = { id: uid(), invoice_id: inv.id, ...newPay };
    const updated = { ...inv, payments: [...inv.payments, pay] };
    if (Math.abs(calcInvoiceTotals(updated).balance) < 0.01) updated.status = 'paid';
    save(updated);
    setNewPay({ amount: 0, method: 'card', reference: '', note: '', date: TODAY });
    setAddPayOpen(false);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Paiement enregistré · ${fmtEuro(pay.amount)}` } }));
  };

  // Émettre la facture
  const issueInvoice = () => {
    const updated: Invoice = { ...inv, status: 'issued', issued_at: TODAY };
    save(updated);
    setIssueConfirm(false);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Facture émise · ${inv.invoice_number} · Figée définitivement` } }));
  };

  // Générer avoir
  const createCreditNote = () => {
    const creditNote: Invoice = {
      ...inv,
      id: uid(), invoice_number: nextInvoiceNumber().replace('FA-', 'AV-'),
      status: 'credit_note', created_at: TODAY, issued_at: TODAY, payments: [],
      folios: inv.folios.map(f => ({
        ...f, id: uid(),
        lines: f.lines.map(l => ({ ...l, id: uid(), unit_price_ht: -l.unit_price_ht, total_ht: -l.total_ht, total_tva: -l.total_tva, total_ttc: -l.total_ttc })),
      })),
    };
    onUpdate(creditNote);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Avoir généré · ${creditNote.invoice_number}` } }));
  };

  const st = STATUS_CONFIG[inv.status];

  // STYLES
  const FIELD = { width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#F8FAFC' } as const;
  const BTN_PRIMARY = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(139,92,246,.25)' } as const;
  const BTN_GHOST = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as const;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 1100, maxHeight: '92vh', background: 'white', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.25)' }}
      >
        {/* Header modale */}
        <div style={{ background: 'linear-gradient(135deg,#2D1065,#1A3060)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{inv.invoice_number}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>
              {inv.guest_name} · Ch. {inv.room_id} · {fmtDate(inv.checkin)} → {fmtDate(inv.checkout)} · {inv.nights} nuit(s)
            </div>
          </div>
          {/* Badges status + solde */}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: st.bg, color: st.color }}>{st.label}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{fmtEuro(totals.totalTTC)}</div>
            <div style={{ fontSize: 10, color: totals.balance > 0.01 ? '#FCA5A5' : '#86EFAC', fontWeight: 600 }}>
              {totals.balance > 0.01 ? `Solde : ${fmtEuro(totals.balance)}` : '✓ Soldée'}
            </div>
          </div>
          {/* Actions rapides */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => printLegalInvoice(inv, account)} style={BTN_GHOST} title="Imprimer / PDF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
            </button>
            {!locked && (
              <button onClick={() => setIssueConfirm(true)} style={BTN_PRIMARY}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Émettre
              </button>
            )}
            {locked && inv.status !== 'credit_note' && (
              <button onClick={createCreditNote} style={{ ...BTN_GHOST, borderColor: '#FCD34D', color: '#D97706' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
                Générer avoir
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #F1F5F9', padding: '0 24px', flexShrink: 0, background: 'white' }}>
          {[
            { id: 'folios', label: `Folios (${inv.folios.length})` },
            { id: 'payments', label: `Paiements (${inv.payments.length})` },
            { id: 'audit', label: 'Night Audit & Journal' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '12px 18px', border: 'none', background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderBottom: tab === t.id ? '2px solid #8B5CF6' : '2px solid transparent', color: tab === t.id ? '#7C3AED' : '#94A3B8', transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Corps — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── ONGLET FOLIOS ── */}
          {tab === 'folios' && (
            <>
              {/* Navigation folios */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {inv.folios.map(f => {
                  const fTotals = calcInvoiceTotals({ ...inv, folios: [f] });
                  return (
                    <button key={f.id} onClick={() => setActiveFolioId(f.id)}
                      style={{ padding: '8px 16px', borderRadius: 12, border: `2px solid ${activeFolioId === f.id ? f.color : '#E2E8F0'}`, background: activeFolioId === f.id ? f.color + '14' : 'white', color: activeFolioId === f.id ? f.color : '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                      {f.label} · {fmtEuro(fTotals.totalTTC)}
                    </button>
                  );
                })}
                {!locked && inv.folios.length < 4 && (
                  <button onClick={() => {
                    const idx = inv.folios.length;
                    const newFolio: Folio = { id: uid(), invoice_id: inv.id, account_id: inv.account_id, label: FOLIO_LABELS[idx] || `Folio ${idx + 1}`, color: FOLIO_COLORS[idx] || '#64748B', lines: [] };
                    save({ ...inv, folios: [...inv.folios, newFolio] });
                    setActiveFolioId(newFolio.id);
                  }} style={{ ...BTN_GHOST, fontSize: 11 }}>
                    + Folio
                  </button>
                )}
                {/* Bouton ajouter ligne */}
                {!locked && activeFolio && (
                  <button onClick={() => setAddLineOpen(true)} style={{ ...BTN_PRIMARY, marginLeft: 'auto', fontSize: 11 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Ajouter ligne
                  </button>
                )}
              </div>

              {/* Tableau lignes */}
              {activeFolio && (
                <div style={{ border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#FAFBFF' }}>
                        {['Date', 'Code', 'Description', 'Qté', 'PU HT', 'TVA', 'Total HT', 'TTC', 'Source', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: i > 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeFolio.lines.length === 0 ? (
                        <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#CBD5E1', fontStyle: 'italic', fontSize: 12 }}>Aucune ligne — cliquez sur "Ajouter ligne"</td></tr>
                      ) : (
                        activeFolio.lines.map(l => (
                          <tr key={l.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '9px 12px', color: '#64748B', fontSize: 11 }}>{fmtDate(l.date)}</td>
                            <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#EDE9FE', color: '#5B21B6' }}>{l.product_code}</span></td>
                            <td style={{ padding: '9px 12px', fontWeight: 500 }}>{l.description}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#475569' }}>{l.quantity}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>{fmtEuro(l.unit_price_ht)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#64748B', fontSize: 11 }}>{l.tva_rate}%</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>{fmtEuro(l.total_ht)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtEuro(l.total_ttc)}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 100, background: l.source === 'night_audit' ? '#FFF7ED' : '#F0FDF4', color: l.source === 'night_audit' ? '#D97706' : '#059669', fontWeight: 700 }}>
                                {l.source === 'night_audit' ? '🌙 Audit' : '✏️ Manuel'}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              {!locked && (
                                <button onClick={() => deleteLine(activeFolio.id, l.id)} style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {activeFolio.lines.length > 0 && (
                      <tfoot>
                        {(() => {
                          const ft = calcInvoiceTotals({ ...inv, folios: [activeFolio] });
                          return (
                            <>
                              <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                                <td colSpan={6} style={{ padding: '10px 12px', fontWeight: 700, fontSize: 11, color: '#64748B' }}>Sous-total folio</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{fmtEuro(ft.totalHT)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: 13, color: '#8B5CF6' }}>{fmtEuro(ft.totalTTC)}</td>
                                <td colSpan={2} />
                              </tr>
                            </>
                          );
                        })()}
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Ajouter ligne — formulaire inline */}
              <AnimatePresence>
                {addLineOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{ background: '#F5F3FF', borderRadius: 16, padding: 18, border: '1px solid #DDD6FE' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B21B6', marginBottom: 12 }}>Nouvelle ligne — {activeFolio?.label}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 3fr 80px 100px 80px', gap: 10, alignItems: 'end' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Famille</div>
                        <select style={FIELD} value={newLine.family} onChange={e => {
                          setNewLine(prev => ({ ...prev, family: e.target.value, product_code: '', description: '' }));
                        }}>
                          <option value="">— Famille —</option>
                          {PRODUCT_FAMILIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Produit</div>
                        <select style={FIELD} value={newLine.product_code} onChange={e => selectProduct(e.target.value)}>
                          <option value="">— Produit —</option>
                          {PRODUCTS.filter(p => !newLine.family || p.family === newLine.family).map(p => (
                            <option key={p.code} value={p.code}>{p.name} ({fmtEuro(p.price_ht)} HT)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Description</div>
                        <input style={FIELD} type="text" value={newLine.description} onChange={e => setNewLine(prev => ({ ...prev, description: e.target.value }))} placeholder="Description..." />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Qté</div>
                        <input style={FIELD} type="number" min={1} value={newLine.qty} onChange={e => setNewLine(prev => ({ ...prev, qty: +e.target.value || 1 }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>PU HT €</div>
                        <input style={FIELD} type="number" step="0.01" value={newLine.unit_price_ht} onChange={e => setNewLine(prev => ({ ...prev, unit_price_ht: +e.target.value || 0 }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>TVA %</div>
                        <select style={FIELD} value={newLine.tva_rate} onChange={e => setNewLine(prev => ({ ...prev, tva_rate: +e.target.value }))}>
                          {[0, 5.5, 10, 20].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Total TTC : <strong style={{ color: '#8B5CF6', fontSize: 14 }}>{fmtEuro(calcLine(newLine.qty, newLine.unit_price_ht, newLine.tva_rate).total_ttc)}</strong>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button onClick={() => setAddLineOpen(false)} style={BTN_GHOST}>Annuler</button>
                        <button onClick={handleAddLine} style={BTN_PRIMARY}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Totaux globaux */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
                {/* TVA détaillée */}
                <div style={{ background: '#F8FAFC', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Récapitulatif TVA</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr>{['Taux', 'Base HT', 'Montant TVA', 'Total TTC'].map(h => <th key={h} style={{ textAlign: h === 'Taux' ? 'left' : 'right', padding: '6px 8px', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #E2E8F0' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {Object.entries(totals.tvaByRate).map(([rate, v]) => {
                      const vt = v as { ht: number; tva: number };
                      return (
                        <tr key={rate}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{rate}%</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtEuro(vt.ht)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtEuro(vt.tva)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtEuro(vt.ht + vt.tva)}</td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
                {/* Total bloc */}
                <div style={{ background: 'linear-gradient(135deg,#2D1065,#1A3060)', borderRadius: 14, padding: 20, color: 'white' }}>
                  {[
                    { label: 'Sous-total HT', value: totals.totalHT, size: 13 },
                    { label: 'Total TVA', value: totals.totalTVA, size: 13 },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: r.size, color: 'rgba(255,255,255,.7)' }}>
                      <span>{r.label}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmtEuro(r.value)}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,.2)', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800 }}>
                    <span>Total TTC</span>
                    <span style={{ fontFamily: 'monospace' }}>{fmtEuro(totals.totalTTC)}</span>
                  </div>
                  {totals.paid > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#86EFAC', marginTop: 8 }}>
                        <span>Déjà réglé</span><span style={{ fontFamily: 'monospace' }}>-{fmtEuro(totals.paid)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: totals.balance > 0.01 ? '#FCA5A5' : '#86EFAC', marginTop: 6 }}>
                        <span>Solde</span><span style={{ fontFamily: 'monospace' }}>{fmtEuro(totals.balance)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── ONGLET PAIEMENTS ── */}
          {tab === 'payments' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Paiements enregistrés</div>
                <button onClick={() => setAddPayOpen(true)} style={BTN_PRIMARY}>
                  + Encaisser
                </button>
              </div>
              {/* Liste paiements */}
              <div style={{ border: '1px solid #F1F5F9', borderRadius: 16, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#FAFBFF' }}>
                      {['Date', 'Mode', 'Référence', 'Note', 'Montant', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: i > 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inv.payments.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#CBD5E1', fontStyle: 'italic' }}>Aucun paiement enregistré</td></tr>
                    ) : (
                      inv.payments.map(p => {
                        const m = METHOD_LABELS[p.method];
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                            <td style={{ padding: '10px 14px', color: '#64748B' }}>{fmtDate(p.date)}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: m.color + '14', color: m.color }}>
                                {m.icon} {m.label}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>{p.reference || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#94A3B8', fontSize: 11 }}>{p.note || '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#059669', fontSize: 14 }}>{fmtEuro(p.amount)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              {inv.status === 'draft' && (
                                <button onClick={() => save({ ...inv, payments: inv.payments.filter(x => x.id !== p.id) })}
                                  style={{ width: 24, height: 24, borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {inv.payments.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                        <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, color: '#64748B' }}>Total encaissé</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: '#059669' }}>{fmtEuro(totals.paid)}</td>
                        <td />
                      </tr>
                      <tr style={{ background: totals.balance > 0.01 ? '#FEF2F2' : '#ECFDF5' }}>
                        <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, color: totals.balance > 0.01 ? '#DC2626' : '#059669' }}>Solde restant</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: totals.balance > 0.01 ? '#DC2626' : '#059669' }}>{fmtEuro(totals.balance)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {/* Formulaire encaissement */}
              <AnimatePresence>
                {addPayOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 12 }}>Encaisser un paiement</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Date</div>
                        <input style={FIELD} type="date" value={newPay.date} onChange={e => setNewPay(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Mode</div>
                        <select style={FIELD} value={newPay.method} onChange={e => setNewPay(p => ({ ...p, method: e.target.value as PaymentMethod }))}>
                          {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Montant €</div>
                        <input style={FIELD} type="number" step="0.01" value={newPay.amount || ''} placeholder={`Solde : ${fmtEuro(totals.balance)}`} onChange={e => setNewPay(p => ({ ...p, amount: +e.target.value || 0 }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Référence</div>
                        <input style={FIELD} type="text" value={newPay.reference} placeholder="N° transaction..." onChange={e => setNewPay(p => ({ ...p, reference: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                      <button onClick={() => setAddPayOpen(false)} style={BTN_GHOST}>Annuler</button>
                      <button onClick={() => { setNewPay(p => ({ ...p, amount: totals.balance })); }} style={{ ...BTN_GHOST, color: '#059669', borderColor: '#BBF7D0' }}>Solde complet</button>
                      <button onClick={handleAddPayment} style={BTN_PRIMARY}>Encaisser {newPay.amount > 0 ? fmtEuro(newPay.amount) : ''}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* ── ONGLET NIGHT AUDIT ── */}
          {tab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Journal Night Audit</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{inv.nights} nuit(s) · {fmtDate(inv.checkin)} → {fmtDate(inv.checkout)}</div>
                </div>
                {!locked && (
                  <button onClick={() => {
                    const auditLines = generateNightAuditLines(inv).map(l => ({ ...l, folio_id: inv.folios[0]?.id || '' }));
                    save({ ...inv, folios: inv.folios.map((f, i) => i === 0 ? { ...f, lines: [...f.lines.filter(l => l.source !== 'night_audit'), ...auditLines] } : f) });
                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Night audit relancé · ${inv.nights} nuit(s) injectées` } }));
                  }} style={BTN_PRIMARY}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    Relancer le night audit
                  </button>
                )}
              </div>
              {/* Timeline nuits */}
              {Array.from({ length: inv.nights }, (_, i) => {
                const d = new Date(inv.checkin + 'T00:00:00');
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const dayLines = inv.folios.flatMap(f => f.lines.filter(l => l.date === dateStr));
                const dayTotal = dayLines.reduce((s, l) => s + l.total_ttc, 0);
                const isLocked = new Date(dateStr) < new Date(TODAY);
                return (
                  <div key={dateStr} style={{ border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isLocked ? '#F8FAFC' : '#FFFBEB', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: isLocked ? '#E2E8F0' : '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {isLocked ? '🔒' : '🌙'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Nuit du {fmtDate(dateStr)}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>{dayLines.length} ligne(s) · {isLocked ? 'Clôturée' : 'Ouverte'}</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#8B5CF6' }}>{fmtEuro(dayTotal)}</div>
                    </div>
                    {dayLines.length > 0 && (
                      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dayLines.map(l => (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#475569', padding: '4px 0', borderBottom: '1px solid #F8FAFC' }}>
                            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 100, background: '#EDE9FE', color: '#5B21B6', fontWeight: 700 }}>{l.product_code}</span>
                            <span style={{ flex: 1 }}>{l.description}</span>
                            <span style={{ fontFamily: 'monospace', color: '#8B5CF6', fontWeight: 600 }}>{fmtEuro(l.total_ttc)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation émission */}
        <AnimatePresence>
          {issueConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <motion.div initial={{ scale: .9 }} animate={{ scale: 1 }}
                style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 440, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Émettre la facture ?</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
                  Après émission, la facture <strong>{inv.invoice_number}</strong> sera <strong>définitivement figée</strong>.<br/>
                  Toute modification nécessitera un avoir + nouvelle facture (conformité DGFIP).
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setIssueConfirm(false)} style={BTN_GHOST}>Annuler</button>
                  <button onClick={issueInvoice} style={BTN_PRIMARY}>Confirmer l'émission</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ─── Composant principal Facturation ─────────────────────────────────────────
export const Facturation: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(buildMockInvoices);
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newForm, setNewForm] = useState({ guest_name: '', room_id: '', checkin: TODAY, checkout: '', account_id: MOCK_ACCOUNTS[0].id });

  const filtered = useMemo(() => invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (search && !inv.guest_name.toLowerCase().includes(search.toLowerCase()) && !inv.invoice_number.toLowerCase().includes(search.toLowerCase()) && !inv.room_id.includes(search)) return false;
    return true;
  }), [invoices, filterStatus, search]);

  const stats = useMemo(() => ({
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalCA: invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + calcInvoiceTotals(i).totalTTC, 0),
    unpaid: invoices.filter(i => i.status === 'issued').reduce((s, i) => s + calcInvoiceTotals(i).balance, 0),
  }), [invoices]);

  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices(prev => {
      const exists = prev.find(i => i.id === updated.id);
      return exists ? prev.map(i => i.id === updated.id ? updated : i) : [...prev, updated];
    });
    setSelectedInvoice(updated);
  };

  const createInvoice = () => {
    if (!newForm.guest_name || !newForm.room_id || !newForm.checkin || !newForm.checkout) return;
    const nights = Math.round((new Date(newForm.checkout).getTime() - new Date(newForm.checkin).getTime()) / 86400000);
    if (nights <= 0) return;
    const fId = uid();
    const inv: Invoice = {
      id: uid(), invoice_number: nextInvoiceNumber(),
      reservation_id: uid(), account_id: newForm.account_id,
      status: 'draft', guest_name: newForm.guest_name, room_id: newForm.room_id,
      checkin: newForm.checkin, checkout: newForm.checkout, nights,
      created_at: TODAY, folios: [
        { id: fId, invoice_id: '', account_id: newForm.account_id, label: FOLIO_LABELS[0], color: FOLIO_COLORS[0], lines: [] }
      ],
      payments: [],
    };
    const auditLines = generateNightAuditLines(inv).map(l => ({ ...l, folio_id: fId }));
    inv.folios[0].lines = auditLines;
    setInvoices(prev => [inv, ...prev]);
    setNewInvoiceOpen(false);
    setSelectedInvoice(inv);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Facture créée · ${inv.invoice_number} · Night audit injecté` } }));
  };

  const FIELD = { padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#F8FAFC', width: '100%' } as const;
  const BTN_PRIMARY = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(139,92,246,.25)' } as const;
  const BTN_GHOST = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as const;

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── KPI MASQUE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { l: 'Factures totales',  v: stats.total,          c: '#8B5CF6', icon: '📄' },
          { l: 'Brouillons',        v: stats.draft,          c: '#64748B', icon: '✏️' },
          { l: 'Émises',           v: stats.issued,         c: '#2563EB', icon: '📬' },
          { l: 'CA facturé (TTC)',  v: fmtEuro(stats.totalCA), c: '#059669', icon: '💶', isAmount: true },
          { l: 'Solde à encaisser', v: fmtEuro(stats.unpaid), c: stats.unpaid > 0 ? '#DC2626' : '#059669', icon: '⏳', isAmount: true },
        ].map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 18, padding: 18, border: '1px solid #F1F5F9', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.c, borderRadius: '18px 18px 0 0' }} />
            <div style={{ fontSize: 18, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{k.l}</div>
            <div style={{ fontSize: k.isAmount ? 18 : 28, fontWeight: 800, color: k.c, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher facture, client, chambre..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...FIELD, paddingLeft: 34, borderRadius: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Toutes'], ['draft', 'Brouillons'], ['issued', 'Émises'], ['paid', 'Payées'], ['credit_note', 'Avoirs']].map(([id, label]) => (
            <button key={id} onClick={() => setFilterStatus(id)}
              style={{ padding: '8px 14px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterStatus === id ? '#8B5CF6' : '#E2E8F0'}`, background: filterStatus === id ? '#8B5CF6' : 'white', color: filterStatus === id ? 'white' : '#64748B', transition: 'all .15s' }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setNewInvoiceOpen(true)} style={BTN_PRIMARY}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle facture
        </button>
      </div>

      {/* ── NOUVELLE FACTURE ── */}
      <AnimatePresence>
        {newInvoiceOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: '#EDE9FE', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid #DDD6FE' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5B21B6', marginBottom: 14 }}>Créer une nouvelle facture</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 150px 150px 2fr', gap: 12, alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Client *</div>
                <input style={FIELD} type="text" placeholder="Nom du client" value={newForm.guest_name} onChange={e => setNewForm(p => ({ ...p, guest_name: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Chambre *</div>
                <input style={FIELD} type="text" placeholder="101" value={newForm.room_id} onChange={e => setNewForm(p => ({ ...p, room_id: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Arrivée *</div>
                <input style={FIELD} type="date" value={newForm.checkin} onChange={e => setNewForm(p => ({ ...p, checkin: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Départ *</div>
                <input style={FIELD} type="date" min={newForm.checkin} value={newForm.checkout} onChange={e => setNewForm(p => ({ ...p, checkout: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Compte</div>
                <select style={FIELD} value={newForm.account_id} onChange={e => setNewForm(p => ({ ...p, account_id: e.target.value }))}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => setNewInvoiceOpen(false)} style={BTN_GHOST}>Annuler</button>
              <button onClick={createInvoice} style={BTN_PRIMARY}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Créer + Night Audit auto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LISTE FACTURES ── */}
      <div style={{ border: '1px solid #F1F5F9', borderRadius: 20, overflow: 'hidden', background: 'white', boxShadow: '0 1px 8px rgba(0,0,0,.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#FAFBFF' }}>
              {['N° Facture', 'Client', 'Chambre', 'Séjour', 'Nuits', 'Total TTC', 'Payé', 'Solde', 'Statut', 'Actions'].map((h, i) => (
                <th key={i} style={{ padding: '11px 14px', textAlign: i > 4 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center', color: '#CBD5E1' }}>Aucune facture dans ce filtre</td></tr>
            ) : (
              filtered.map(inv => {
                const t = calcInvoiceTotals(inv);
                const st = STATUS_CONFIG[inv.status];
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    onClick={() => setSelectedInvoice(inv)}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#5B21B6', fontSize: 12 }}>{inv.invoice_number}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{inv.guest_name}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 8, background: '#F1F5F9', fontWeight: 700, fontSize: 11 }}>Ch. {inv.room_id}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748B', fontSize: 11 }}>{fmtDate(inv.checkin)} → {fmtDate(inv.checkout)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#475569', fontWeight: 600 }}>{inv.nights}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{fmtEuro(t.totalTTC)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#059669', fontSize: 12 }}>{t.paid > 0 ? fmtEuro(t.paid) : '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {t.balance > 0.01
                        ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#DC2626', fontSize: 12 }}>{fmtEuro(t.balance)}</span>
                        : <span style={{ color: '#059669', fontWeight: 700, fontSize: 11 }}>✓ Soldée</span>
                      }
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedInvoice(inv)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Ouvrir">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button onClick={() => printLegalInvoice(inv, accounts.find(a => a.id === inv.account_id) || accounts[0])}
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Imprimer">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODALE FACTURE ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            accounts={accounts}
            onClose={() => setSelectedInvoice(null)}
            onUpdate={handleUpdateInvoice}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
