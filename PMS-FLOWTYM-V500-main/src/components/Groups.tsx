import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  CalendarDays, 
  CircleDollarSign,
  MoreVertical,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  X,
  Check,
  Briefcase,
  Trash2,
  FileText,
  Bed,
  Phone,
  Mail,
  Euro
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── TYPES ───

interface Group {
  id: number;
  name: string;
  contact: string;
  rooms: number;
  arrival: string;
  departure: string;
  participants: string[];
  status: 'confirmed' | 'tentative';
  amount: number;
  notes?: string;
  email?: string;
  phone?: string;
}

interface GroupsProps {
  groups: Group[];
  onUpdateGroup?: (group: Group) => void;
  onAddGroup?: (group: Group) => void;
}

// ─── HELPERS ───

const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const getStatusColor = (status: string) => {
  return status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600';
};

// ─── COMPONENTS ───

export const Groups: React.FC<GroupsProps> = ({ groups, onUpdateGroup, onAddGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Group>>({});
  const [newParticipant, setNewParticipant] = useState('');

  // ─── STATS ───
  const stats = useMemo(() => {
    const total = groups.length;
    const confirmed = groups.filter(g => g.status === 'confirmed').length;
    const totalRevenue = groups.reduce((sum, g) => sum + g.amount, 0);
    const totalRooms = groups.reduce((sum, g) => sum + g.rooms, 0);

    return [
      { label: 'GROUPES ACTIFS', value: total, color: '#8B5CF6' },
      { label: 'CONFIRMÉS', value: confirmed, color: '#10b981' },
      { label: 'CHAMBRES BLOQUÉES', value: totalRooms, color: '#3b82f6' },
      { label: 'CA PRÉVISIONNEL', value: formatCurrency(totalRevenue), color: '#f59e0b' },
    ];
  }, [groups]);

  // ─── FILTERING ───
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const searchStr = `${g.name} ${g.contact} ${g.notes || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groups, searchTerm, statusFilter]);

  // ─── ACTIONS ───
  const handleOpenDetails = (group: Group) => {
    setSelectedGroup(group);
    setEditForm(group);
    setIsEditing(false);
  };

  const handleAddNew = () => {
    const fresh: Group = {
      id: 0,
      name: '',
      contact: '',
      rooms: 1,
      arrival: new Date().toISOString().slice(0, 10),
      departure: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      participants: [],
      status: 'tentative',
      amount: 0,
      notes: ''
    };
    setSelectedGroup(fresh);
    setEditForm(fresh);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name) return;
    
    if (selectedGroup?.id === 0) {
      if (onAddGroup) onAddGroup(editForm as Group);
    } else {
      if (onUpdateGroup) onUpdateGroup(editForm as Group);
    }
    setSelectedGroup(null);
  };

  const handleAddParticipant = () => {
    if (!newParticipant.trim()) return;
    const currentParticipants = editForm.participants || [];
    setEditForm({
      ...editForm,
      participants: [...currentParticipants, newParticipant.trim()]
    });
    setNewParticipant('');
  };

  const removeParticipant = (index: number) => {
    const currentParticipants = [...(editForm.participants || [])];
    currentParticipants.splice(index, 1);
    setEditForm({ ...editForm, participants: currentParticipants });
  };

  return (
    <div className="space-y-6">
      {/* ─── HUD ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ─── SEARCH & ACTIONS ─── */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Rechercher un groupe, contact, notes..." 
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-primary focus:bg-white transition-all text-sm bg-slate-50/50" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-3 rounded-2xl border border-slate-200 outline-none focus:border-primary text-sm font-bold text-slate-500 bg-white min-w-[180px]"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="confirmed">🟢 Confirmés</option>
          <option value="tentative">🟡 Tentatives</option>
        </select>
        <button 
          onClick={handleAddNew}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nouvel Allotement
        </button>
      </div>

      {/* ─── GRID VIEW ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredGroups.map(g => (
          <motion.div 
            key={g.id}
            layoutId={`group-${g.id}`}
            onClick={() => handleOpenDetails(g)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col transition-all group cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${g.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 ${getStatusColor(g.status)}`}>
                  {g.status === 'confirmed' ? <><CheckCircle2 className="w-3 h-3 mr-1.5" /> CONFIRMÉ</> : <><Clock3 className="w-3 h-3 mr-1.5" /> TENTATIVE</>}
                </span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{g.name}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ref #{g.id}</p>
              </div>
              <button className="p-3 text-slate-300 hover:text-primary transition-colors hover:bg-primary-light rounded-2xl bg-slate-50">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Principal</div>
                  <div className="text-sm font-bold text-slate-700">{g.contact}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Période</div>
                  <div className="text-sm font-bold text-slate-700">
                    {new Date(g.arrival).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})} — {new Date(g.departure).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 -mx-8 -mb-8 px-8 py-6 border-t border-slate-100 mt-auto flex justify-between items-center bg-gradient-to-br from-slate-50 to-white">
              <div className="flex gap-8">
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Bed className="w-2.5 h-2.5" /> Chambres
                  </div>
                  <div className="font-black text-slate-700 text-xl">{g.rooms}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" /> Participants
                  </div>
                  <div className="font-black text-slate-700 text-xl">{g.participants.length}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                  <Euro className="w-2.5 h-2.5" /> Total HT
                </div>
                <div className="font-black text-primary text-2xl tracking-tighter">{formatCurrency(g.amount)}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── GROUP DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-end p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGroup(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-slate-50 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary-light rounded-[20px] flex items-center justify-center text-primary shadow-inner border border-primary/10">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      {selectedGroup.id === 0 ? 'Nouveau Allotement' : editForm.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> Allotement Groupe
                      </span>
                      {selectedGroup.id !== 0 && (
                        <>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID #{selectedGroup.id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600 border border-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                
                {/* ── SECTION: INFOS GÉNÉRALES ── */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="w-4 h-4" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Détails de l'Allotement</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom de l'événement / Groupe</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm focus:shadow-md h-14"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Ex: Séminaire IA Avançée"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Principal</label>
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm h-14"
                        value={editForm.contact || ''}
                        onChange={e => setEditForm({...editForm, contact: e.target.value})}
                        placeholder="Nom complet"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone / Email</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.phone || ''}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          placeholder="Tel"
                        />
                        <input 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.email || ''}
                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                          placeholder="Email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Arrivée</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.arrival || ''}
                          onChange={e => setEditForm({...editForm, arrival: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Départ</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.departure || ''}
                          onChange={e => setEditForm({...editForm, departure: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chambres Réservées</label>
                      <div className="relative">
                        <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.rooms || 0}
                          onChange={e => setEditForm({...editForm, rooms: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Budget Total Groupe</label>
                      <div className="relative">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                          value={editForm.amount || 0}
                          onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Statut Commercial</label>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setEditForm({...editForm, status: 'confirmed'})}
                          className={`flex-1 p-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editForm.status === 'confirmed' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirmé
                        </button>
                        <button 
                          onClick={() => setEditForm({...editForm, status: 'tentative'})}
                          className={`flex-1 p-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editForm.status === 'tentative' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          <Clock3 className="w-4 h-4" /> Tentative
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION: ROOMING LIST ── */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Users className="w-4 h-4" />
                      <h3 className="text-[11px] font-black uppercase tracking-widest">Rooming List & Participants</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{editForm.participants?.length || 0} / {editForm.rooms} Chambres</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[32px] p-6 space-y-4 shadow-sm">
                    <div className="flex gap-3">
                      <input 
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:border-primary transition-all"
                        placeholder="Nom du participant..."
                        value={newParticipant}
                        onChange={e => setNewParticipant(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
                      />
                      <button 
                        onClick={handleAddParticipant}
                        className="bg-primary text-white p-3 rounded-xl hover:bg-primary-dark transition-all shadow-md active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                      {editForm.participants?.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liste vide</p>
                        </div>
                      ) : (
                        editForm.participants?.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary text-[10px] font-black">
                                {i + 1}
                              </div>
                              <span className="text-sm font-bold text-slate-700">{p}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tight">
                                  <Bed className="w-3.5 h-3.5" /> Assigner
                               </button>
                               <button 
                                 onClick={() => removeParticipant(i)}
                                 className="p-2 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-all"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION: NOTES ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <FileText className="w-4 h-4" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">Consignes Spéciales</h3>
                  </div>
                  <textarea 
                    className="w-full bg-amber-50/50 border border-amber-100 rounded-[32px] p-6 text-sm font-bold outline-none focus:border-amber-400 transition-all text-amber-900 placeholder:text-amber-200 h-32 resize-none shadow-sm"
                    value={editForm.notes || ''}
                    onChange={e => setEditForm({...editForm, notes: e.target.value})}
                    placeholder="Détails logistiques, demandes plateaux repas, accès salle de réunion..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-slate-200 p-8 flex gap-5">
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all"
                >
                  Fermer
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-5 bg-primary hover:bg-primary-dark text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                  <Check className="w-6 h-6" /> Enregistrer Séminaire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
