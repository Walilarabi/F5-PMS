import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Euro, ShoppingCart, Coffee, Utensils, Wine, Sparkles, Package, Shirt, X, Check } from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Prestation {
  id: string;
  reservationId: string;
  room: string;
  guestName: string;
  family: string;
  label: string;
  quantity: number;
  unitPrice: number;
  discount: number; // % de remise
  date: string;
}

interface PrestationsProps {
  reservations?: any[];
  clients?: any[];
}

// ─── FAMILLES ────────────────────────────────────────────────────────────────
const FAMILIES = [
  { id: 'hebergement', label: 'Hébergement', icon: '🏨', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'pdj',         label: 'Petit-déjeuner', icon: '☕', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'restaurant',  label: 'Restaurant', icon: '🍽️', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'bar',         label: 'Bar', icon: '🍷', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'spa',         label: 'Spa & Bien-être', icon: '✨', color: '#10B981', bg: '#ECFDF5' },
  { id: 'room_service',label: 'Room Service', icon: '🛎️', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'blanchisserie',label: 'Blanchisserie', icon: '👔', color: '#64748B', bg: '#F8FAFC' },
  { id: 'autre',       label: 'Autre', icon: '📦', color: '#94A3B8', bg: '#F1F5F9' },
];

const FAMILY_PRESETS: Record<string, { label: string; price: number }[]> = {
  pdj:          [{ label: 'Petit-déjeuner adulte', price: 18 }, { label: 'Petit-déjeuner enfant', price: 9 }],
  restaurant:   [{ label: 'Menu du jour', price: 32 }, { label: 'À la carte', price: 45 }, { label: 'Menu gastronomique', price: 68 }],
  bar:          [{ label: 'Bouteille de vin', price: 35 }, { label: 'Cocktail', price: 14 }, { label: 'Plateau apéritif', price: 22 }],
  spa:          [{ label: 'Massage 60min', price: 85 }, { label: 'Soin du visage', price: 65 }, { label: 'Accès piscine', price: 25 }],
  room_service: [{ label: 'Petit-déjeuner en chambre', price: 24 }, { label: 'Dîner en chambre', price: 48 }, { label: 'Collation nuit', price: 18 }],
  blanchisserie:[{ label: 'Pressing chemise', price: 8 }, { label: 'Nettoyage costume', price: 22 }, { label: 'Lavage express', price: 15 }],
};

// ─── DONNÉES MOCK INITIALES ───────────────────────────────────────────────────
const INITIAL_PRESTATIONS: Prestation[] = [
  { id: 'P001', reservationId: 'RES-001', room: '101', guestName: 'Pierre Bernard', family: 'pdj', label: 'Petit-déjeuner adulte', quantity: 2, unitPrice: 18, discount: 0, date: '2026-04-23' },
  { id: 'P002', reservationId: 'RES-003', room: '201', guestName: 'Ali Larabi', family: 'spa', label: 'Massage 60min', quantity: 1, unitPrice: 85, discount: 10, date: '2026-04-20' },
  { id: 'P003', reservationId: 'RES-003', room: '201', guestName: 'Ali Larabi', family: 'bar', label: 'Bouteille de vin', quantity: 2, unitPrice: 35, discount: 0, date: '2026-04-21' },
  { id: 'P004', reservationId: 'RES-002', room: '103', guestName: 'Sophie Dubois', family: 'room_service', label: 'Petit-déjeuner en chambre', quantity: 2, unitPrice: 24, discount: 0, date: '2026-04-08' },
  { id: 'P005', reservationId: 'RES-004', room: '102', guestName: 'Marie Martin', family: 'restaurant', label: 'Menu gastronomique', quantity: 2, unitPrice: 68, discount: 0, date: '2026-04-07' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
const fmtD = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function Prestations({ reservations = [], clients = [] }: PrestationsProps) {
  const [prestations, setPrestations] = useState<Prestation[]>(INITIAL_PRESTATIONS);
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    reservationId: '',
    room: '',
    guestName: '',
    family: 'pdj',
    label: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  // Réservations actives pour le sélecteur
  const activeResas = useMemo(() => {
    const fromStore = reservations.filter(r => r.status !== 'cancelled' && r.status !== 'checked_out');
    return fromStore.length > 0 ? fromStore : [
      { id: 'RES-001', room: '101', guestName: 'Pierre Bernard' },
      { id: 'RES-002', room: '103', guestName: 'Sophie Dubois' },
      { id: 'RES-003', room: '201', guestName: 'Ali Larabi' },
      { id: 'RES-004', room: '102', guestName: 'Marie Martin' },
    ];
  }, [reservations]);

  // Filtrage
  const filtered = useMemo(() => {
    return prestations.filter(p => {
      const q = search.toLowerCase();
      const matchQ = !q || p.label.toLowerCase().includes(q) || p.guestName.toLowerCase().includes(q) || p.room.includes(q);
      const matchF = familyFilter === 'all' || p.family === familyFilter;
      return matchQ && matchF;
    });
  }, [prestations, search, familyFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = prestations.reduce((s, p) => s + p.quantity * p.unitPrice * (1 - p.discount / 100), 0);
    const byFamily: Record<string, number> = {};
    FAMILIES.forEach(f => { byFamily[f.id] = 0; });
    prestations.forEach(p => {
      byFamily[p.family] = (byFamily[p.family] || 0) + p.quantity * p.unitPrice * (1 - p.discount / 100);
    });
    return { total, byFamily, count: prestations.length };
  }, [prestations]);

  const ttc = form.quantity * form.unitPrice * (1 - form.discount / 100);

  const openNew = () => {
    setEditId(null);
    setForm({ reservationId: '', room: '', guestName: '', family: 'pdj', label: '', quantity: 1, unitPrice: 0, discount: 0, date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (p: Prestation) => {
    setEditId(p.id);
    setForm({ reservationId: p.reservationId, room: p.room, guestName: p.guestName, family: p.family, label: p.label, quantity: p.quantity, unitPrice: p.unitPrice, discount: p.discount, date: p.date });
    setShowModal(true);
  };

  const save = () => {
    if (!form.label || !form.unitPrice) return;
    if (editId) {
      setPrestations(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
    } else {
      const newP: Prestation = { id: 'P' + Date.now(), ...form };
      setPrestations(prev => [newP, ...prev]);
    }
    setShowModal(false);
  };

  const remove = (id: string) => {
    if (!confirm('Supprimer cette prestation ?')) return;
    setPrestations(prev => prev.filter(p => p.id !== id));
  };

  const selectResa = (id: string) => {
    const r = activeResas.find(r => r.id === id);
    if (r) {
      set('reservationId', r.id);
      set('room', r.room || '');
      set('guestName', r.guestName || (clients.find((c: any) => c.id === r.clientId)?.name || ''));
    }
  };

  const getFam = (id: string) => FAMILIES.find(f => f.id === id) || FAMILIES[7];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -m-4 overflow-hidden bg-slate-50">

      {/* ─── HEADER ─── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900">Prestations & Consommations</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Facturation des extras par chambre</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="relative ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Client, chambre, prestation…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56" />
        </div>
        <select value={familyFilter} onChange={e => setFamilyFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-primary">
          <option value="all">Toutes familles</option>
          {FAMILIES.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
        </select>

        <button onClick={openNew}
          className="ml-auto bg-primary hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Ajouter prestation
        </button>
      </div>

      {/* ─── KPI ROW ─── */}
      <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-100 shrink-0">
          <Euro className="w-4 h-4 text-violet-500" />
          <div>
            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total extras</div>
            <div className="text-[15px] font-black text-slate-900">{fmt(kpis.total)}</div>
          </div>
        </div>
        {FAMILIES.slice(0, 6).map(f => (
          <button key={f.id} onClick={() => setFamilyFilter(familyFilter === f.id ? 'all' : f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition-all border ${
              familyFilter === f.id ? 'border-transparent text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
            style={familyFilter === f.id ? { background: f.color } : { background: f.bg }}>
            <span>{f.icon}</span>
            <span style={familyFilter === f.id ? {} : { color: f.color }}>{fmt(kpis.byFamily[f.id] || 0)}</span>
          </button>
        ))}
      </div>

      {/* ─── TABLEAU ─── */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Chambre / Client</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Famille</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Désignation</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Qté</th>
              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">P.U.</th>
              <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Remise</th>
              <th className="px-5 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Total TTC</th>
              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map(p => {
              const fam = getFam(p.family);
              const total = p.quantity * p.unitPrice * (1 - p.discount / 100);
              return (
                <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-5 py-2 text-slate-400 text-[10px] font-bold">{fmtD(p.date)}</td>
                  <td className="px-5 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-[9px] font-black border border-violet-200">
                        {p.room}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-[11px]">{p.guestName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{p.reservationId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black" style={{ background: fam.bg, color: fam.color }}>
                      {fam.icon} {fam.label}
                    </span>
                  </td>
                  <td className="px-5 py-2 font-bold text-slate-700">{p.label}</td>
                  <td className="px-4 py-2 text-center font-black text-slate-800">{p.quantity}</td>
                  <td className="px-4 py-2 text-right text-slate-600 font-bold">{fmt(p.unitPrice)}</td>
                  <td className="px-4 py-2 text-center">
                    {p.discount > 0
                      ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black">-{p.discount}%</span>
                      : <span className="text-slate-300 text-[9px]">—</span>}
                  </td>
                  <td className="px-5 py-2 text-right">
                    <div className="inline-block bg-violet-50 rounded-lg px-3 py-1">
                      <span className="font-black text-violet-700 text-[11px]">{fmt(total)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-400 transition-all shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => remove(p.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 transition-all shadow-sm">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-16 text-center text-slate-400 text-xs font-bold italic">Aucune prestation trouvée</td></tr>
            )}
          </tbody>
          {/* Ligne total */}
          {filtered.length > 0 && (
            <tfoot className="bg-violet-50 border-t-2 border-violet-200">
              <tr>
                <td colSpan={7} className="px-5 py-2 text-[10px] font-black text-violet-700 uppercase tracking-widest">
                  Total — {filtered.length} prestation{filtered.length > 1 ? 's' : ''}
                </td>
                <td className="px-5 py-2 text-right">
                  <span className="font-black text-violet-800 text-[13px]">
                    {fmt(filtered.reduce((s, p) => s + p.quantity * p.unitPrice * (1 - p.discount / 100), 0))}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ─── MODALE AJOUT / ÉDITION ─── */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden">

            {/* Header modale */}
            <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-black text-white">{editId ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Réservation */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Réservation</label>
                <select value={form.reservationId} onChange={e => selectResa(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10">
                  <option value="">Sélectionner une réservation…</option>
                  {activeResas.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.id} — Ch.{r.room} — {r.guestName || ''}</option>
                  ))}
                </select>
              </div>

              {/* Famille */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Famille de prestation</label>
                <div className="grid grid-cols-4 gap-2">
                  {FAMILIES.map(f => (
                    <button key={f.id} onClick={() => { set('family', f.id); set('label', ''); set('unitPrice', 0); }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                        form.family === f.id ? 'border-transparent text-white' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                      style={form.family === f.id ? { background: f.color } : { background: f.bg }}>
                      <span className="text-base">{f.icon}</span>
                      <span style={form.family === f.id ? {} : { color: f.color }}>{f.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              {FAMILY_PRESETS[form.family] && (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sélection rapide</label>
                  <div className="flex flex-wrap gap-2">
                    {FAMILY_PRESETS[form.family].map(p => (
                      <button key={p.label} onClick={() => { set('label', p.label); set('unitPrice', p.price); }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          form.label === p.label ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200'
                        }`}>
                        {p.label} — {p.price} €
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Désignation */}
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Désignation</label>
                <input type="text" value={form.label} onChange={e => set('label', e.target.value)} placeholder="Libellé de la prestation…"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>

              {/* Qté / Prix / Remise / Date */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Qté</label>
                  <input type="number" min={1} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary text-center font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">P.U. (€)</label>
                  <input type="number" min={0} step={0.5} value={form.unitPrice} onChange={e => set('unitPrice', Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Remise (%)</label>
                  <input type="number" min={0} max={100} value={form.discount} onChange={e => set('discount', Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary text-center" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary" />
                </div>
              </div>

              {/* Total calculé */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-[11px] font-black text-violet-700 uppercase tracking-widest">Total TTC</span>
                <span className="text-xl font-black text-violet-800">{fmt(ttc)}</span>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                Annuler
              </button>
              <button onClick={save} disabled={!form.label || !form.unitPrice}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <Check className="w-4 h-4" /> {editId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
