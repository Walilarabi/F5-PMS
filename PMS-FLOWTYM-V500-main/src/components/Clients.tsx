import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  ShieldCheck,
  MoreVertical,
  Target,
  DollarSign,
  Award,
  History as HistoryIcon,
  User,
  Globe,
  Building,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  Hotel,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

// ─── TYPES ───

interface ClientHistory {
  dates: string;
  room: string;
  category: string;
  nights: number;
  amount: number;
  rating?: number;
  comment?: string;
}

interface ClientPreferences {
  floor?: string;
  bedType?: string;
  smoking?: boolean;
  equipment?: string[];
  accessibility?: boolean;
}

interface Client {
  id: number;
  name: string;
  firstName?: string;
  civilite?: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  company?: string;
  tag: string;
  visits: number;
  ca: number;
  status: string;
  room: string;
  checkin: string;
  checkout: string;
  idVerified?: boolean;
  loyalty?: 'Bronze' | 'Argent' | 'Or' | 'Platine';
  preferences?: ClientPreferences;
  allergies?: string;
  specialRequests?: string;
  notes?: string;
  history?: ClientHistory[];
}

interface ClientsProps {
  clients: Client[];
  onUpdateClient?: (client: Client) => void;
  onAddClient?: (client: Client) => void;
}

// ─── CONFIG & HELPERS ───

const LOYALTY_CFG = {
  Platine: { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', min: 10, icon: '💎' },
  Or: { color: '#d97706', bg: '#fef3c7', min: 5, icon: '🥇' },
  Argent: { color: '#6b7280', bg: '#f3f4f6', min: 2, icon: '🥈' },
  Bronze: { color: '#92400e', bg: '#fef9ee', min: 0, icon: '🥉' },
};

const getLoyalty = (visits: number): keyof typeof LOYALTY_CFG => {
  if (visits >= 10) return 'Platine';
  if (visits >= 5) return 'Or';
  if (visits >= 2) return 'Argent';
  return 'Bronze';
};

const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const initials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const suggestRoomCategory = (c: Partial<Client>) => {
  if (!c) return null;
  const hist = c.history || [];
  if (hist.length > 0 && hist[0].category) return hist[0].category;
  const prefs = c.preferences || {};
  if (prefs.floor === 'Élevé') return 'Suite Deluxe';
  return 'Double Classique';
};

// ─── COMPONENTS ───

const StatusPill = ({ text, type }: { text: string, type: 'pa' | 'pb' | 'pv' | 'pg' | 'pp' | 'pr' }) => {
  const styles = {
    pa: "bg-amber-100 text-amber-800 border-amber-200", // Alert
    pb: "bg-blue-100 text-blue-800 border-blue-200",   // Info
    pv: "bg-purple-100 text-purple-800 border-purple-200", // VIP/Premium
    pg: "bg-emerald-100 text-emerald-800 border-emerald-200", // Success
    pp: "bg-slate-100 text-slate-600 border-slate-200",    // Neutral
    pr: "bg-rose-100 text-rose-800 border-rose-200",       // Error/Danger
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border ${styles[type]}`}>
      {text}
    </span>
  );
};

export const Clients: React.FC<ClientsProps> = ({ clients, onUpdateClient, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loyaltyFilter, setLoyaltyFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  // ─── STATS ───
  const stats = useMemo(() => {
    const total = clients.length;
    const vips = clients.filter(c => c.tag === 'VIP').length;
    const verified = clients.filter(c => c.idVerified).length;
    const totalCA = clients.reduce((sum, c) => sum + (c.ca || 0), 0);
    const avgCLV = total ? Math.round(totalCA / total) : 0;
    
    return [
      { label: 'CARDEX TOTAL', value: total, color: '#8B5CF6' },
      { label: 'VIP', value: vips, color: '#f59e0b' },
      { label: 'ID VÉRIFIÉS', value: `${total ? Math.round((verified/total)*100) : 0}%`, color: '#10b981' },
      { label: 'CLV MOYEN', value: formatCurrency(avgCLV), color: '#3b82f6' },
    ];
  }, [clients]);

  // ─── FILTERING ───
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const searchStr = `${c.name} ${c.firstName || ''} ${c.email} ${c.phone} ${c.city || ''} ${c.company || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || searchStr.includes(searchTerm.toLowerCase());
      const matchesTag = !tagFilter || c.tag === tagFilter;
      const matchesLoyalty = !loyaltyFilter || getLoyalty(c.visits) === loyaltyFilter;
      return matchesSearch && matchesTag && matchesLoyalty;
    });
  }, [clients, searchTerm, tagFilter, loyaltyFilter]);

  // ─── ACTIONS ───
  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setEditForm(client);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    const fresh: Client = {
      id: 0,
      name: '',
      email: '',
      phone: '',
      tag: 'Regulier',
      visits: 0,
      ca: 0,
      status: 'pending',
      room: '',
      checkin: '',
      checkout: '',
      history: []
    };
    setSelectedClient(fresh);
    setEditForm(fresh);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name) return; // Simple validation
    
    if (selectedClient?.id === 0) {
      if (onAddClient) onAddClient(editForm as Client);
    } else {
      if (onUpdateClient) onUpdateClient(editForm as Client);
    }
    setSelectedClient(null);
    setIsEditing(false);
  };

  const handleExportExcel = () => {
    const data = filteredClients.map(c => ({
      'Nom': c.name,
      'Email': c.email,
      'Téléphone': c.phone,
      'Ville': c.city || '—',
      'Pays': c.country || 'France',
      'Société': c.company || '—',
      'Segment': c.tag,
      'Visites': c.visits,
      'CA Cumulé': c.ca,
      'Fidélité': getLoyalty(c.visits)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `flowtym_cardex_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ─── HUD ─── */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-[18px] p-3.5 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{s.label}</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ─── FILTERS ─── */}
      <div className="flex gap-2.5">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary focus:bg-white transition-all text-xs bg-slate-50" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary text-xs font-bold text-slate-500 bg-white"
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}
        >
          <option value="">Segments</option>
          <option value="VIP">👑 VIP</option>
          <option value="Affaires">💼 Affaires</option>
          <option value="Famille">👨‍👩‍👧 Famille</option>
          <option value="Regulier">⭐ Régulier</option>
        </select>
        <select 
          className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary text-xs font-bold text-slate-500 bg-white"
          value={loyaltyFilter}
          onChange={e => setLoyaltyFilter(e.target.value)}
        >
          <option value="">Fidélité</option>
          {Object.entries(LOYALTY_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {k}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="px-3 py-2 bg-[#FEF2F2] text-[#9F1239] border border-[#FECDD3] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FEE2E2] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-3 py-2 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#DCFCE7] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <div className="w-px h-8 bg-slate-100 mx-0.5" />
          <button 
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
      </div>

      {/* ─── TABLE VIEW ─── */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase text-[9px] tracking-widest text-slate-400">
              <th className="px-4 py-2 text-left">Client</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Fidélité / Segment</th>
              <th className="px-4 py-2 text-left">Préférences</th>
              <th className="px-4 py-2 text-center">Séjours</th>
              <th className="px-4 py-2 text-right">CLV</th>
              <th className="px-4 py-2 text-center">ID</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map(c => {
              const loyalty = getLoyalty(c.visits);
              const lCfg = LOYALTY_CFG[loyalty];
              return (
                <tr 
                  key={c.id} 
                  className="hover:bg-primary/5 transition-colors group cursor-pointer"
                  onClick={() => handleOpenDetails(c)}
                >
                  <td className="px-4 py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center text-primary text-[9px] font-black">
                        {initials(c.name)}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-[12px] leading-none">{c.name}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {c.city || '—'}{c.company ? ` · ${c.company}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-1">
                    <div className="text-[10px] text-slate-600 font-medium leading-none">{c.email}</div>
                    <div className="text-[8px] text-slate-400 font-bold mt-0.5">{c.phone}</div>
                  </td>
                  <td className="px-4 py-1">
                    <div className="flex flex-col gap-0.5 items-start">
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight flex items-center gap-1" style={{ backgroundColor: lCfg.bg, color: lCfg.color }}>
                        {lCfg.icon} {loyalty}
                      </span>
                      {c.tag && <StatusPill text={c.tag} type={c.tag === 'VIP' ? 'pv' : 'pb'} />}
                    </div>
                  </td>
                  <td className="px-4 py-1">
                    <div className="text-[9px] text-slate-500 font-medium">
                      {c.preferences?.floor ? `Étage ${c.preferences.floor.toLowerCase()}` : '—'}
                    </div>
                    {c.allergies && (
                      <div className="text-[8px] text-rose-500 font-bold mt-0.5 truncate max-w-[90px]">
                        ⚠️ {c.allergies}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-1 text-center font-black text-slate-700 text-[11px]">{c.visits}</td>
                  <td className="px-4 py-1 text-right font-black text-primary text-[11px]">{formatCurrency(c.ca)}</td>
                  <td className="px-4 py-1 text-center">
                    {c.idVerified ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-1 text-right">
                    <button className="p-0.5 text-slate-300 hover:text-primary transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── CLIENT DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-slate-50 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary text-xl font-black shadow-inner">
                    {editForm.name ? initials(editForm.name) : '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                      {selectedClient.id === 0 ? 'Nouveau Client' : `Fiche Cardex · ${editForm.name}`}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {selectedClient.id === 0 ? 'Création de dossier' : `Client ID #${selectedClient.id}`}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                
                {/* ── SECTION: IDENTITÉ ── */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Identité & Contact</h3>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Civilité</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.civilite || 'M.'}
                        onChange={e => setEditForm({...editForm, civilite: e.target.value})}
                      >
                        <option>M.</option>
                        <option>Mme</option>
                        <option>Dr</option>
                      </select>
                    </div>
                    <div className="col-span-4 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom Complet</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Ex: Pierre Bernard"
                      />
                    </div>

                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-11 text-sm font-bold outline-none focus:border-primary transition-all"
                          value={editForm.email || ''}
                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                          placeholder="email@domaine.com"
                        />
                      </div>
                    </div>
                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-11 text-sm font-bold outline-none focus:border-primary transition-all"
                          value={editForm.phone || ''}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          placeholder="+33 6 — —"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ville</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.city || ''}
                        onChange={e => setEditForm({...editForm, city: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pays</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.country || 'France'}
                        onChange={e => setEditForm({...editForm, country: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Société</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.company || ''}
                        onChange={e => setEditForm({...editForm, company: e.target.value})}
                      />
                    </div>

                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Segment</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.tag || ''}
                        onChange={e => setEditForm({...editForm, tag: e.target.value})}
                      >
                         <option value="">— Aucun —</option>
                         <option value="VIP">★ VIP</option>
                         <option value="Affaires">⊞ Affaires</option>
                         <option value="Famille">⌂ Famille</option>
                         <option value="Regulier">◈ Régulier</option>
                         <option value="Loisir">◎ Loisir</option>
                         <option value="Groupe">⊕ Groupe</option>
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fidélité Force</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.loyalty || getLoyalty(editForm.visits || 0)}
                        onChange={e => setEditForm({...editForm, loyalty: e.target.value as any})}
                      >
                         {Object.keys(LOYALTY_CFG).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="col-span-6 mt-2">
                       <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                          <Hotel className="w-4 h-4 text-slate-400" />
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[.05em]">
                             Recommandation d'attribution : <span className="text-primary font-black ml-1">{suggestRoomCategory(editForm)}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION: STATS BAR ── */}
                {selectedClient.id !== 0 && (
                  <div className="grid grid-cols-4 gap-4 p-6 bg-violet-50 rounded-3xl border border-primary/10">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <Target className="w-2.5 h-2.5" /> Séjours
                      </div>
                      <div className="text-2xl font-black text-primary">{editForm.visits}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" /> CA Cumulé
                      </div>
                      <div className="text-xl font-black text-primary">{formatCurrency(editForm.ca || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <Award className="w-2.5 h-2.5" /> Fidélité
                      </div>
                      <div className="text-xs font-black text-primary uppercase mt-2">{getLoyalty(editForm.visits || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                        <Building className="w-2.5 h-2.5" /> Chambre
                      </div>
                      <div className="text-xl font-black text-primary truncate">#{editForm.room || '—'}</div>
                    </div>
                  </div>
                )}

                {/* ── SECTION: PRÉFÉRENCES ── */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Star className="w-4 h-4" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Préférences Séjour</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Étage</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.preferences?.floor || ''}
                        onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, floor: e.target.value}})}
                      >
                        <option value="">Peu importe</option>
                        <option value="Bas">Bas (1-2)</option>
                        <option value="Moyen">Moyen (3-4)</option>
                        <option value="Élevé">Élevé (5+)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Literie</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={editForm.preferences?.bedType || ''}
                        onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, bedType: e.target.value}})}
                      >
                        <option value="">Peu importe</option>
                        <option value="Ferme">Ferme</option>
                        <option value="Moelleux">Moelleux</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fumeur</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        value={String(editForm.preferences?.smoking || false)}
                        onChange={e => setEditForm({...editForm, preferences: {...editForm.preferences, smoking: e.target.value === 'true'}})}
                      >
                        <option value="false">Non-fumeur</option>
                        <option value="true">Fumeur 🚭</option>
                      </select>
                    </div>
                    
                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Allergies / Régimes</label>
                      <div className="relative">
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-11 text-sm font-bold outline-none focus:border-primary transition-all text-rose-600 placeholder:text-rose-200"
                          value={editForm.allergies || ''}
                          onChange={e => setEditForm({...editForm, allergies: e.target.value})}
                          placeholder="Sans gluten, lactose..."
                        />
                      </div>
                    </div>

                    <div className="col-span-3 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes Internes</label>
                      <textarea 
                        className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-amber-400 transition-all text-amber-900 placeholder:text-amber-200 h-24 resize-none"
                        value={editForm.notes || ''}
                        onChange={e => setEditForm({...editForm, notes: e.target.value})}
                        placeholder="Info réservée à l'équipe..."
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION: HISTORY ── */}
                {selectedClient.history && selectedClient.history.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary">
                      <HistoryIcon className="w-4 h-4" />
                      <h3 className="text-[11px] font-black uppercase tracking-widest">Historique Séjours</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedClient.history.map((h, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all cursor-default shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">
                              {h.room}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-800">{h.dates}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {h.category} · {h.nights} Nuits
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-primary">{formatCurrency(h.amount)}</div>
                            <div className="flex gap-0.5 justify-end mt-1">
                               {[1,2,3,4,5].map(s => <Star key={s} className={`w-2.5 h-2.5 ${s <= (h.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-slate-200 p-6 flex gap-4 sticky bottom-0 z-10">
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Enregistrer Fiche
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
