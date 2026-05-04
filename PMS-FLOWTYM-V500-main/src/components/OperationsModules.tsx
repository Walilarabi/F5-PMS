import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Room { num?: string; id?: string; status?: string; type?: string; floor?: number; }

// ─── Shared primitives ───────────────────────────────────────────────────────
const IC = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const SC = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-primary bg-white";

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${color}`}>{label}</span>
);

const KPI = ({ label, value, icon, color }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
      <i className={`fa-solid ${icon} text-slate-300`} /> {label}
    </div>
    <div className="text-2xl font-black text-slate-800">{value}</div>
  </div>
);

// ─── 1. HOUSEKEEPING / MÉNAGE ────────────────────────────────────────────────
export const Housekeeping: React.FC<{ rooms?: Room[] }> = ({ rooms = [] }) => {
  const statuses = ['À nettoyer', 'En cours', 'Propre', 'Bloquée', 'Inspection'];
  const colorMap: Record<string, string> = {
    'À nettoyer': 'bg-rose-100 text-rose-700', 'En cours': 'bg-amber-100 text-amber-700',
    'Propre': 'bg-emerald-100 text-emerald-700', 'Bloquée': 'bg-slate-100 text-slate-500',
    'Inspection': 'bg-blue-100 text-blue-700',
  };
  const [tasks, setTasks] = useState([
    { id: '1', room: '101', type: 'Départ', status: 'À nettoyer', assignedTo: 'Nathalie B.', priority: 'Haute',    floor: 1, estimatedTime: '35 min', startedAt: null,   notes: 'Client VIP - Attention particulière' },
    { id: '2', room: '102', type: 'Recouche', status: 'En cours',  assignedTo: 'Maria G.',    priority: 'Normale',  floor: 1, estimatedTime: '20 min', startedAt: '09:15', notes: '' },
    { id: '3', room: '201', type: 'Départ', status: 'Propre',    assignedTo: 'Julie M.',    priority: 'Haute',    floor: 2, estimatedTime: '45 min', startedAt: '08:00', notes: 'Suite — lit bébé à retirer' },
    { id: '4', room: '203', type: 'Recouche', status: 'À nettoyer', assignedTo: null,         priority: 'Normale',  floor: 2, estimatedTime: '20 min', startedAt: null,   notes: '' },
    { id: '5', room: '301', type: 'Départ', status: 'Inspection', assignedTo: 'Nathalie B.', priority: 'Haute',    floor: 3, estimatedTime: '40 min', startedAt: '08:30', notes: '' },
    { id: '6', room: '103', type: 'Recouche', status: 'À nettoyer', assignedTo: 'Maria G.',    priority: 'Basse',    floor: 1, estimatedTime: '15 min', startedAt: null,   notes: '' },
  ]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStaff, setFilterStaff]   = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const staff = ['Nathalie B.', 'Maria G.', 'Julie M.', 'Sarah T.'];

  const filtered = tasks.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterStaff  || t.assignedTo === filterStaff)
  );

  const updateStatus = (id: string, status: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

  const counts = statuses.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s).length }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map(s => (
          <div key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} className={`bg-white rounded-2xl border p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${filterStatus === s ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s}</div>
            <div className="text-2xl font-black text-slate-800">{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)} className={SC + ' max-w-[180px]'}>
          <option value="">Tout le personnel</option>
          {staff.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={SC + ' max-w-[180px]'}>
          <option value="">Tous statuts</option>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setFilterStatus('') || setFilterStaff('')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline">Reset</button>
        <div className="ml-auto flex gap-1.5">
          <button className="bg-primary hover:bg-[#7b4be8] text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5">
            <i className="fa-solid fa-plus" /> Nouveau
          </button>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
            <i className="fa-solid fa-print" /> Imprimer
          </button>
        </div>
      </div>

      {/* Task grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(task => (
          <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => { setSelected(task); setModalOpen(true); }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <span className="text-[15px] font-black text-slate-600">{task.room}</span>
                </div>
                <div>
                  <div className="font-black text-slate-800 text-[13px]">ch.{task.room} — E{task.floor}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{task.type}</div>
                </div>
              </div>
              <Badge label={task.status} color={colorMap[task.status] || 'bg-slate-100 text-slate-500'} />
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-center gap-2 text-slate-500">
                <i className="fa-solid fa-user-tie w-4 text-slate-300" />
                {task.assignedTo ? <span className="font-bold text-slate-700">{task.assignedTo}</span> : <span className="italic text-slate-400">Non assigné</span>}
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <i className="fa-solid fa-clock w-4 text-slate-300" />
                <span className="font-semibold">{task.estimatedTime}</span>
                {task.startedAt && <span className="text-slate-400">· Démarré à {task.startedAt}</span>}
              </div>
              {task.notes && <div className="flex items-start gap-2 text-slate-500"><i className="fa-solid fa-note-sticky w-4 text-slate-300 mt-0.5" /><span className="italic">{task.notes}</span></div>}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              {task.status === 'À nettoyer' && (
                <button onClick={e => { e.stopPropagation(); updateStatus(task.id, 'En cours'); }} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors">
                  <i className="fa-solid fa-play mr-1" /> Démarrer
                </button>
              )}
              {task.status === 'En cours' && (
                <button onClick={e => { e.stopPropagation(); updateStatus(task.id, 'Inspection'); }} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors">
                  <i className="fa-solid fa-search mr-1" /> Inspection
                </button>
              )}
              {task.status === 'Inspection' && (
                <button onClick={e => { e.stopPropagation(); updateStatus(task.id, 'Propre'); }} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors">
                  <i className="fa-solid fa-check mr-1" /> Valider
                </button>
              )}
              <select value={task.assignedTo || ''} onClick={e => e.stopPropagation()}
                onChange={e => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignedTo: e.target.value } : t)); }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none">
                <option value="">Assigner à…</option>
                {staff.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center text-slate-300">
            <i className="fa-solid fa-broom text-5xl mb-4 block" />
            <p className="font-bold text-slate-400">Aucune tâche pour ces filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── 2. MAINTENANCE ──────────────────────────────────────────────────────────
export const Maintenance: React.FC = () => {
  const [incidents, setIncidents] = useState([
    { id: '1', room: '102', type: 'Plomberie',   desc: 'Robinet salle de bain qui fuit',       status: 'Ouvert',     priority: 'Haute',   assignedTo: 'Paul R.',   created: '2026-04-20 09:00', cost: null },
    { id: '2', room: '201', type: 'Électricité', desc: 'Prises USB ne fonctionnent pas',        status: 'En cours',   priority: 'Normale', assignedTo: 'Marc D.',   created: '2026-04-19 14:30', cost: null },
    { id: '3', room: '305', type: 'Climatisation',desc: 'Bruit anormal en fonctionnement',      status: 'Résolu',     priority: 'Normale', assignedTo: 'Paul R.',   created: '2026-04-18 11:00', cost: 85  },
    { id: '4', room: 'Hall', type: 'Serrurerie', desc: 'Porte coulissante entrée grince',       status: 'Programmé',  priority: 'Basse',   assignedTo: null,        created: '2026-04-17 16:45', cost: null },
    { id: '5', room: '103', type: 'Peinture',    desc: 'Marque sur le mur côté lit — à retoucher', status: 'Ouvert', priority: 'Basse',   assignedTo: null,        created: '2026-04-21 08:20', cost: null },
  ]);
  const [filterStatus, setFilterStatus] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ room: '', type: 'Plomberie', desc: '', priority: 'Normale', assignedTo: '' });

  const statusColor: Record<string, string> = {
    'Ouvert': 'bg-rose-100 text-rose-700', 'En cours': 'bg-amber-100 text-amber-700',
    'Résolu': 'bg-emerald-100 text-emerald-700', 'Programmé': 'bg-blue-100 text-blue-700',
  };
  const filtered = filterStatus ? incidents.filter(i => i.status === filterStatus) : incidents;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Ouvert', 'En cours', 'Programmé', 'Résolu'].map(s => (
          <div key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} className={`bg-white rounded-2xl border p-3.5 shadow-sm cursor-pointer hover:shadow-md transition-all ${filterStatus === s ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'}`}>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{s}</div>
            <div className="text-2xl font-black text-slate-800">{incidents.filter(i => i.status === s).length}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={SC + ' max-w-[180px]'}>
          <option value="">Tous statuts</option>
          {['Ouvert', 'En cours', 'Programmé', 'Résolu'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => setAddOpen(true)} className="ml-auto bg-primary hover:bg-[#7b4be8] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <i className="fa-solid fa-plus" /> Signaler un incident
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr>{['Chambre', 'Type', 'Description', 'Priorité', 'Assigné', 'Statut', 'Créé le', 'Coût', ''].map(h => (
              <th key={h} className="px-3 py-2 text-[10px] font-semibold text-slate-400">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(inc => (
              <tr key={inc.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-3 py-1.5 font-black text-slate-800 text-[12px]">Ch. {inc.room}</td>
                <td className="px-3 py-1.5"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{inc.type}</span></td>
                <td className="px-3 py-1.5 text-slate-600 font-semibold max-w-[200px] text-[12px]">{inc.desc}</td>
                <td className="px-3 py-1.5"><Badge label={inc.priority} color={inc.priority === 'Haute' ? 'bg-rose-50 text-rose-600' : inc.priority === 'Normale' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'} /></td>
                <td className="px-3 py-1.5 font-semibold text-slate-700 text-[12px]">{inc.assignedTo || <span className="italic text-slate-300">Non assigné</span>}</td>
                <td className="px-3 py-1.5"><Badge label={inc.status} color={statusColor[inc.status]} /></td>
                <td className="px-3 py-1.5 text-[10px] text-slate-400 font-bold">{inc.created}</td>
                <td className="px-3 py-1.5 font-black text-emerald-600 text-[12px]">{inc.cost ? `${inc.cost}€` : '—'}</td>
                <td className="px-3 py-1.5 text-right">
                  <select value={inc.status} onChange={e => setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, status: e.target.value } : i))}
                    className="bg-transparent border-none text-[10px] font-bold text-slate-500 outline-none cursor-pointer">
                    {['Ouvert', 'En cours', 'Programmé', 'Résolu'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto p-8 space-y-4">
                <h3 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-wrench text-primary" /> Signaler un incident</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Chambre</label><input type="text" value={form.room} onChange={e => setForm(f => ({...f, room: e.target.value}))} className={IC} placeholder="Ex: 101, Hall, Lobby..." /></div>
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Type</label><select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={SC}>{['Plomberie','Électricité','Climatisation','Serrurerie','Peinture','Mobilier','Autre'].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Priorité</label><select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className={SC}>{['Basse','Normale','Haute'].map(p => <option key={p}>{p}</option>)}</select></div>
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Assigné à</label><input type="text" value={form.assignedTo} onChange={e => setForm(f => ({...f, assignedTo: e.target.value}))} className={IC} placeholder="Paul R., Marc D..." /></div>
                </div>
                <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Description</label><textarea value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} className={IC + ' h-20 resize-none'} /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setAddOpen(false)} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <button onClick={() => { if (!form.room || !form.desc) return; setIncidents(prev => [...prev, { id: Date.now().toString(), ...form, status: 'Ouvert', created: new Date().toLocaleString('fr-FR').slice(0,16), cost: null }]); setAddOpen(false); setForm({ room: '', type: 'Plomberie', desc: '', priority: 'Normale', assignedTo: '' }); }} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white bg-primary hover:bg-[#7b4be8] shadow-lg transition-all"><i className="fa-solid fa-save mr-1.5" />Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 3. STAFF / PERSONNEL ────────────────────────────────────────────────────
export const Staff: React.FC = () => {
  const [staff, setStaff] = useState([
    { id: '1', name: 'Nathalie Bernard', role: 'Gouvernante',      dept: 'Ménage',      shift: '06:00–14:00', status: 'Présent',  phone: '+33 6 12 34 56 78', comment: 'Chef d\'équipe ménage' },
    { id: '2', name: 'Maria Garcia',      role: 'Femme de chambre', dept: 'Ménage',      shift: '08:00–16:00', status: 'Présent',  phone: '+33 6 98 76 54 32', comment: '' },
    { id: '3', name: 'Paul Renard',        role: 'Technicien',       dept: 'Maintenance', shift: '07:00–15:00', status: 'Présent',  phone: '+33 6 55 44 33 22', comment: '' },
    { id: '4', name: 'Sophie Leblanc',    role: 'Réceptionniste',   dept: 'Réception',   shift: '06:00–14:00', status: 'Présent',  phone: '+33 6 11 22 33 44', comment: '' },
    { id: '5', name: 'Marc Durant',        role: 'Réceptionniste',   dept: 'Réception',   shift: '14:00–22:00', status: 'Absent',   phone: '+33 6 77 88 99 00', comment: 'Absent — Maladie' },
    { id: '6', name: 'Julie Martin',       role: 'F&B',              dept: 'Restaurant',  shift: '12:00–20:00', status: 'En pause', phone: '+33 6 33 44 55 66', comment: '' },
    { id: '7', name: 'Ali Kassem',         role: 'Chef de rang',     dept: 'Restaurant',  shift: '18:00–02:00', status: 'Planifié',phone: '+33 6 99 00 11 22', comment: '' },
  ]);
  const depts = [...new Set(staff.map(s => s.dept))];
  const [filterDept, setFilterDept] = useState('');
  const statColors: Record<string, string> = {
    'Présent': 'bg-emerald-100 text-emerald-700', 'Absent': 'bg-rose-100 text-rose-700',
    'En pause': 'bg-amber-100 text-amber-700', 'Planifié': 'bg-blue-100 text-blue-700',
  };
  const filtered = filterDept ? staff.filter(s => s.dept === filterDept) : staff;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'Effectif total', v: staff.length, i: 'fa-users' }, { l: 'Présents', v: staff.filter(s => s.status === 'Présent').length, i: 'fa-check-circle' }, { l: 'Absents', v: staff.filter(s => s.status === 'Absent').length, i: 'fa-times-circle' }, { l: 'En pause', v: staff.filter(s => s.status === 'En pause').length, i: 'fa-coffee' }].map(k => (
          <KPI key={k.l} label={k.l} value={k.v} icon={k.i} color={k.i.includes('check') ? '#10B981' : k.i.includes('times') ? '#EF4444' : '#8B5CF6'} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {depts.map(d => (
          <button key={d} onClick={() => setFilterDept(filterDept === d ? '' : d)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${filterDept === d ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{d}</button>
        ))}
        <button onClick={() => setFilterDept('')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline ml-2">Tous</button>
        <button className="ml-auto bg-primary hover:bg-[#7b4be8] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <i className="fa-solid fa-plus" /> Ajouter un employé
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-violet-200 rounded-2xl flex items-center justify-center font-black text-primary text-[13px]">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-black text-slate-800 text-[13px]">{s.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.role}</div>
                </div>
              </div>
              <Badge label={s.status} color={statColors[s.status] || 'bg-slate-100 text-slate-500'} />
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex items-center gap-2 text-slate-500"><i className="fa-solid fa-building w-4 text-slate-300" /><span className="font-semibold">{s.dept}</span></div>
              <div className="flex items-center gap-2 text-slate-500"><i className="fa-solid fa-clock w-4 text-slate-300" /><span className="font-semibold">{s.shift}</span></div>
              <div className="flex items-center gap-2 text-slate-500"><i className="fa-solid fa-phone w-4 text-slate-300" /><span>{s.phone}</span></div>
              {s.comment && <div className="flex items-start gap-2 text-slate-500"><i className="fa-solid fa-note-sticky w-4 text-slate-300 mt-0.5" /><span className="italic text-slate-400">{s.comment}</span></div>}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <select value={s.status} onChange={e => setStaff(prev => prev.map(ss => ss.id === s.id ? { ...ss, status: e.target.value } : ss))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold outline-none text-slate-600">
                {['Présent', 'En pause', 'Absent', 'Planifié'].map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 4. CAHIER DE CONSIGNES ──────────────────────────────────────────────────
export const Consignes: React.FC = () => {
  const [consignes, setConsignes] = useState([
    { id: '1', date: '2026-04-21 06:30', author: 'Sophie L.',  shift: 'Matin',  priority: 'Haute',   content: 'Client VIP M. Larabi (ch.201) — arrivée prévue 15h. Bouquet de fleurs en chambre et surclassement validé.', done: false, tags: ['VIP', 'Arrivée'] },
    { id: '2', date: '2026-04-21 07:15', author: 'Marc D.',    shift: 'Nuit',   priority: 'Normale', content: 'Ch.102 — Client Mme Martin a demandé oreillers fermes supplémentaires. À préparer avant check-in.', done: false, tags: ['Chambre'] },
    { id: '3', date: '2026-04-20 22:00', author: 'Ali K.',     shift: 'Soir',   priority: 'Haute',   content: 'Incident Booking.com — surréservation pour le week-end du 24-26 avril. Contacter le client Tech Corp en priorité.', done: true,  tags: ['Urgent', 'OTA'] },
    { id: '4', date: '2026-04-20 14:30', author: 'Sophie L.',  shift: 'Après-midi', priority: 'Basse', content: 'Livraison fleuriste prévue vendredi 8h — espace réception à dégager.', done: false, tags: ['Logistique'] },
    { id: '5', date: '2026-04-19 23:00', author: 'Marc D.',    shift: 'Nuit',   priority: 'Normale', content: 'Groupe mariage Dupont-Lebrun — liste des chambres attribuées envoyée au prestataire externe par email.', done: true,  tags: ['Groupe'] },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ content: '', priority: 'Normale', shift: 'Matin', tags: '' });
  const [filterPriority, setFilterPriority] = useState('');

  const filtered = filterPriority ? consignes.filter(c => c.priority === filterPriority) : consignes;
  const priorityColor: Record<string, string> = { 'Haute': 'bg-rose-100 text-rose-700', 'Normale': 'bg-blue-100 text-blue-700', 'Basse': 'bg-slate-100 text-slate-500' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {['Haute', 'Normale', 'Basse'].map(p => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${filterPriority === p ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{p}</button>
          ))}
        </div>
        <button onClick={() => setAddOpen(true)} className="ml-auto bg-primary hover:bg-[#7b4be8] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <i className="fa-solid fa-plus" /> Nouvelle consigne
        </button>
      </div>
      <div className="space-y-4">
        {filtered.map(c => (
          <motion.div key={c.id} layout className={`bg-white rounded-2xl border p-3.5 shadow-sm transition-all ${c.done ? 'opacity-60 border-slate-100' : 'border-slate-200 hover:shadow-md'}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => setConsignes(prev => prev.map(cc => cc.id === c.id ? { ...cc, done: !cc.done } : cc))} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all shrink-0 ${c.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-primary'}`}>
                {c.done && <i className="fa-solid fa-check text-white text-[9px]" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <Badge label={c.priority} color={priorityColor[c.priority]} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{c.shift}</span>
                  {c.tags.map(tag => <span key={tag} className="text-[9px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-md font-bold">{tag}</span>)}
                  <span className="ml-auto text-[10px] text-slate-400 font-bold">{c.date} — <span className="text-slate-600">{c.author}</span></span>
                </div>
                <p className={`text-[12px] font-semibold leading-snug ${c.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{c.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto p-8 space-y-4">
                <h3 className="text-[15px] font-black text-slate-800"><i className="fa-solid fa-book-open text-primary mr-2" />Nouvelle consigne</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Priorité</label><select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className={SC}><option>Basse</option><option>Normale</option><option>Haute</option></select></div>
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Vacation</label><select value={form.shift} onChange={e => setForm(f => ({...f, shift: e.target.value}))} className={SC}><option>Matin</option><option>Après-midi</option><option>Soir</option><option>Nuit</option></select></div>
                </div>
                <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Tags (séparés par virgule)</label><input type="text" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} className={IC} placeholder="VIP, Urgence, OTA..." /></div>
                <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Contenu de la consigne *</label><textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} className={IC + ' h-28 resize-none'} placeholder="Décrivez la consigne en détail..." /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setAddOpen(false)} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <button onClick={() => { if (!form.content) return; setConsignes(prev => [{ id: Date.now().toString(), date: new Date().toLocaleString('fr-FR').slice(0,16), author: 'Moi', shift: form.shift, priority: form.priority, content: form.content, done: false, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }, ...prev]); setAddOpen(false); setForm({ content: '', priority: 'Normale', shift: 'Matin', tags: '' }); }} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white bg-primary hover:bg-[#7b4be8] shadow-lg transition-all"><i className="fa-solid fa-save mr-1.5" />Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 5. OBJETS TROUVÉS ───────────────────────────────────────────────────────
export const ObjetsTrouves: React.FC<{ itemsProp?: any[] }> = ({ itemsProp = [] }) => {
  const [items, setItems] = useState(itemsProp.length > 0 ? itemsProp : [
    { id: '1', desc: 'Chargeur iPhone blanc',   room: '101', foundAt: '2026-04-20', foundBy: 'Nathalie B.', status: 'En cours',  owner: null,       claimedAt: null  },
    { id: '2', desc: 'Lunettes de soleil Ray-Ban', room: '203', foundAt: '2026-04-19', foundBy: 'Maria G.', status: 'Restitué', owner: 'M. Dupont', claimedAt: '2026-04-20' },
    { id: '3', desc: 'Livre « Dune »',          room: '305', foundAt: '2026-04-18', foundBy: 'Julie M.', status: 'En cours',  owner: null,       claimedAt: null  },
    { id: '4', desc: 'Montre Casio noire',       room: 'Piscine', foundAt: '2026-04-17', foundBy: 'Paul R.', status: 'Envoyé', owner: 'Mme Leclerc', claimedAt: '2026-04-18' },
    { id: '5', desc: 'Peluche lapin rose',       room: '102', foundAt: '2026-04-21', foundBy: 'Sophie L.', status: 'En cours', owner: null, claimedAt: null },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ desc: '', room: '', foundBy: '' });
  const statusColor: Record<string, string> = { 'En cours': 'bg-amber-100 text-amber-700', 'Restitué': 'bg-emerald-100 text-emerald-700', 'Envoyé': 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {['En cours', 'Restitué', 'Envoyé'].map(s => (
          <KPI key={s} label={s} value={items.filter(i => i.status === s).length} icon={s === 'En cours' ? 'fa-hourglass-half' : s === 'Restitué' ? 'fa-handshake' : 'fa-paper-plane'} color={s === 'En cours' ? '#F59E0B' : s === 'Restitué' ? '#10B981' : '#0EA5E9'} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <h4 className="font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-box-open text-primary" /> Registre des objets trouvés</h4>
        <button onClick={() => setAddOpen(true)} className="ml-auto bg-primary hover:bg-[#7b4be8] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
          <i className="fa-solid fa-plus" /> Enregistrer un objet
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
            {['#', 'Description', 'Chambre', 'Trouvé le', 'Trouvé par', 'Propriétaire', 'Statut', 'Action'].map(h => <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-400">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, i) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-black text-slate-400 text-[11px]">#{String(i + 1).padStart(3, '0')}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{item.desc}</td>
                <td className="px-4 py-3 text-slate-500">Ch. {item.room}</td>
                <td className="px-4 py-3 text-[11px] font-bold text-slate-400">{item.foundAt}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{item.foundBy}</td>
                <td className="px-4 py-3">{item.owner ? <span className="font-bold text-slate-800">{item.owner}</span> : <span className="italic text-slate-300">Inconnu</span>}</td>
                <td className="px-4 py-3"><Badge label={item.status} color={statusColor[item.status]} /></td>
                <td className="px-4 py-3">
                  {item.status === 'En cours' && (
                    <button onClick={() => { const owner = window.prompt('Nom du propriétaire :'); if (owner) setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'Restitué', owner, claimedAt: new Date().toISOString().slice(0, 10) } : it)); }} className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                      <i className="fa-solid fa-handshake mr-1" /> Restituer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto p-8 space-y-4">
                <h3 className="text-[15px] font-black text-slate-800"><i className="fa-solid fa-box-open text-primary mr-2" />Enregistrer un objet trouvé</h3>
                <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Description *</label><input type="text" value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} className={IC} placeholder="Chargeur, lunettes, sac..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Chambre / Lieu</label><input type="text" value={form.room} onChange={e => setForm(f => ({...f, room: e.target.value}))} className={IC} placeholder="101, Piscine..." /></div>
                  <div><label className="text-[11px] font-semibold text-slate-400 block mb-1">Trouvé par</label><input type="text" value={form.foundBy} onChange={e => setForm(f => ({...f, foundBy: e.target.value}))} className={IC} placeholder="Prénom N." /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setAddOpen(false)} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <button onClick={() => { if (!form.desc) return; setItems(prev => [...prev, { id: Date.now().toString(), desc: form.desc, room: form.room || '?', foundAt: new Date().toISOString().slice(0, 10), foundBy: form.foundBy || 'Staff', status: 'En cours', owner: null, claimedAt: null }]); setAddOpen(false); setForm({ desc: '', room: '', foundBy: '' }); }} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white bg-primary hover:bg-[#7b4be8] shadow-lg transition-all"><i className="fa-solid fa-save mr-1.5" />Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 6. PETITE CAISSE ────────────────────────────────────────────────────────
export const PetiteCaisse: React.FC = () => {
  const [transactions, setTransactions] = useState([
    { id: '1', date: '2026-04-21 08:00', desc: 'Fond de caisse ouverture',       type: 'credit', amount: 200,  cat: 'Fond de caisse', by: 'Sophie L.', supplier: 'Interne', receipt: null  },
    { id: '2', date: '2026-04-21 09:30', desc: 'Achat produits ménage',          type: 'debit',  amount: 43.50, cat: 'Ménage',         by: 'Nathalie B.', supplier: 'CORA', receipt: 'https://placeholder.com/receipt1.pdf' },
    { id: '3', date: '2026-04-21 11:00', desc: 'Café + croissants équipe',        type: 'debit',  amount: 18.20, cat: 'Alimentation',   by: 'Sophie L.', supplier: 'Boulangerie Ange', receipt: null  },
    { id: '4', date: '2026-04-20 15:00', desc: 'Remboursement taxi client VIP',   type: 'debit',  amount: 35.00, cat: 'Transport',      by: 'Marc D.', supplier: 'G7 Taxi', receipt: null    },
  ]);

  const [cashControls, setCashControls] = useState<any[]>([
    { id: '1', type: 'open', datetime: '2026-04-21 08:00', giver: 'Admin', taker: 'Sophie L.', initial_amount: 200, signature: 'data:image/png;base64,...' }
  ]);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ desc: '', type: 'debit', amount: '', cat: 'Ménage', by: '', supplier: '', receipt: null as File | null });
  const [controlType, setControlType] = useState<'none' | 'open' | 'close'>('none');
  const [controlForm, setControlForm] = useState({ giver: '', taker: '', amount: '' });
  const [activeSubTab, setActiveSubTab] = useState<'movements' | 'control'>('movements');

  // New states for Cash Control
  const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [fdcAmount, setFdcAmount] = useState(100.00);
  const [staffCollections, setStaffCollections] = useState<any[]>([]);

  useEffect(() => {
    if (activeSubTab === 'control') {
      loadStaffPayments();
    }
  }, [activeSubTab]);

  const loadStaffPayments = async () => {
    // Current date range (today)
    const today = new Date().toISOString().split('T')[0];
    const { data: payments } = await supabase
      .from('reservations') // In our schema, we should probably have a 'payments' table, but using reservations/invoices for now or mock
      .select('*, guests(*)')
      .gte('created_at', today);
    
    // Grouping by staff (mocking staff names for now as per user requested code)
    const mockStaff = [
      { name: 'Sophie L.', amount: 450.50, period: "Aujourd'hui" },
      { name: 'Nathalie B.', amount: 125.00, period: "Aujourd'hui" }
    ];
    setStaffCollections(mockStaff);
  };

  const totalPhysical = Object.entries(counts).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * (count as number)), 0);
  const ecart = totalPhysical - fdcAmount;

  const saveCashCount = async () => {
    const data = {
      hotel_id: 1, // Default or context-based
      counts,
      total_caisse: totalPhysical,
      fdc: fdcAmount,
      ecart: ecart,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('cash_counts').insert([data]);
    if (error) {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Erreur sauvegarde · ' + error.message } }));
    } else {
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Comptage sauvegardé · Caisse mise à jour' } }));
    }
  };

  const signatureRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const balance = transactions.reduce((acc, t) => t.type === 'credit' ? acc + t.amount : acc - t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);
  const cats = ['Ménage', 'Maintenance', 'Blanchisserie', 'Fournitures', 'Boissons', 'Alimentation', 'Transport', 'Fond de caisse', 'Autre'];

  const initSignature = () => {
    const canvas = signatureRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1e293b';
      }
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = signatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = ('touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = signatureRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleValidateControl = () => {
    const signature = signatureRef.current?.toDataURL();
    const newControl = {
      id: Date.now().toString(),
      type: controlType,
      datetime: new Date().toLocaleString('fr-FR').slice(0, 16),
      ...controlForm,
      initial_amount: parseFloat(controlForm.amount),
      signature
    };
    setCashControls(prev => [newControl, ...prev]);
    if (controlType === 'open') {
        setTransactions(prev => [...prev, { 
            id: 'init-' + Date.now(), 
            date: newControl.datetime, 
            desc: 'Fond de caisse ouverture', 
            type: 'credit', 
            amount: parseFloat(controlForm.amount), 
            cat: 'Fond de caisse', 
            by: controlForm.taker, 
            supplier: 'Interne', 
            receipt: null 
        }]);
    }
    setControlType('none');
    setControlForm({ giver: '', taker: '', amount: '' });
  };

  return (
    <div className="space-y-6">
      {/* KPIs & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI label="Solde actuel" value={`${balance.toFixed(2)}€`} icon="fa-wallet" color={balance > 50 ? '#10B981' : '#EF4444'} />
        <KPI label="Total sorties" value={`${totalOut.toFixed(2)}€`} icon="fa-arrow-up" color="#EF4444" />
        <div className="col-span-2 bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-slate-200">
           <div>
              <div className="text-[10px] font-black tracking-[3px] text-slate-400 mb-1">Contrôle de Caisse</div>
              <div className="text-white font-bold text-sm">Session actuelle: <span className="text-emerald-400 font-black">Ouverte</span></div>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => { setControlType('open'); setTimeout(initSignature, 100); }} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Ouverture</button>
              <button 
                onClick={() => { setControlType('close'); setTimeout(initSignature, 100); }}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Fermeture</button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveSubTab('movements')}
              className={`text-[11px] font-black tracking-widest pb-1 transition-all border-b-2 ${activeSubTab === 'movements' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Historique des flux
            </button>
            <button 
              onClick={() => setActiveSubTab('control')}
              className={`text-[11px] font-black tracking-widest pb-1 transition-all border-b-2 ${activeSubTab === 'control' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Contrôle physique
            </button>
          </div>
          {activeSubTab === 'movements' && (
            <button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-[#7b4be8] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              <i className="fa-solid fa-plus" /> Saisir une dépense
            </button>
          )}
          {activeSubTab === 'control' && (
            <button onClick={saveCashCount} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
              <i className="fa-solid fa-save" /> Sauvegarder le comptage
            </button>
          )}
        </div>
        
        {activeSubTab === 'movements' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/30 border-b border-slate-100">
                <tr>
                    {['Date', 'Catégorie', 'Fournisseur', 'Description', 'Sortie', 'Entrée', 'Justif.', 'Solde'].map(h => (
                        <th key={h} className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...transactions].reverse().reduce((acc: any[], t, i) => {
                  const runningBalance = transactions.slice(0, transactions.length - i).reduce((sum, tx) => tx.type === 'credit' ? sum + tx.amount : sum - tx.amount, 0);
                  acc.push({ ...t, runningBalance });
                  return acc;
                }, []).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-2.5 text-[11px] font-bold text-slate-400 whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-2.5">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                            {t.cat}
                        </span>
                    </td>
                    <td className="px-6 py-2.5 font-black text-slate-700">{t.supplier}</td>
                    <td className="px-6 py-2.5 font-semibold text-slate-500 max-w-[200px] truncate">{t.desc}</td>
                    <td className="px-6 py-2.5 font-black text-rose-600">{t.type === 'debit' ? `-${t.amount.toFixed(2)}€` : ''}</td>
                    <td className="px-6 py-2.5 font-black text-emerald-600">{t.type === 'credit' ? `+${t.amount.toFixed(2)}€` : ''}</td>
                    <td className="px-6 py-2.5">
                        {t.receipt ? (
                            <button className="text-primary hover:text-primary-dark transition-colors flex items-center gap-1 font-black text-[10px] uppercase">
                                <i className="fa-solid fa-paperclip" /> Voir
                            </button>
                        ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-6 py-2.5 font-black ${t.runningBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>{t.runningBalance.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* BANKNOTE COUNTING */}
               <div className="space-y-4">
                  <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-calculator text-primary" /> Décompte des espèces
                  </div>
                  <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-6">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                          <th className="pb-3">Dénomination</th>
                          <th className="pb-3 text-center">Quantité</th>
                          <th className="pb-3 text-right">Total (€)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {denominations.map(denom => (
                          <tr key={denom} className="hover:bg-white/50 transition-colors">
                            <td className="py-1.5 text-slate-600">
                               {denom >= 1 ? `${denom},00 €` : `${(denom * 100).toFixed(0)} cts`}
                            </td>
                            <td className="py-1.5 text-center">
                               <input 
                                 type="number" 
                                 min="0"
                                 className="w-16 h-7 text-center bg-white border border-slate-200 rounded-lg font-black text-slate-800 focus:border-primary outline-none"
                                 value={counts[denom] || ''}
                                 onChange={e => setCounts(prev => ({...prev, [denom]: parseInt(e.target.value) || 0}))}
                               />
                            </td>
                            <td className="py-1.5 text-right font-black text-slate-900">
                               {((counts[denom] || 0) * denom).toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200/50 font-black text-slate-900 border-t-2 border-slate-100">
                          <td colSpan={2} className="py-4 pl-4 uppercase tracking-[2px] text-[11px]">Total Physique</td>
                          <td className="py-4 pr-4 text-right text-base underline decoration-primary decoration-4 underline-offset-4">{totalPhysical.toFixed(2)} €</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
               </div>

               {/* TOTALS & STAFF */}
               <div className="space-y-8">
                  {/* FDC & ECART */}
                  <div className="space-y-4">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                       <i className="fa-solid fa-piggy-bank text-primary" /> Synthèse de Caisse
                    </div>
                    <div className="bg-white rounded-[32px] border border-slate-200 p-6 space-y-6 shadow-sm">
                       <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Fond de caisse (Théorique)</div>
                            <input 
                              type="number"
                              className="text-lg font-black text-slate-800 bg-transparent border-none p-0 w-32 focus:ring-0"
                              value={fdcAmount}
                              onChange={e => setFdcAmount(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300">€</div>
                       </div>

                       <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${Math.abs(ecart) < 0.01 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                          <div>
                             <div className={`text-[10px] font-black uppercase tracking-[3px] mb-1 ${Math.abs(ecart) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>Écart de caisse</div>
                             <div className={`text-3xl font-black ${Math.abs(ecart) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {ecart >= 0 ? '+' : ''}{ecart.toFixed(2)} €
                             </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${Math.abs(ecart) < 0.01 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                             {Math.abs(ecart) < 0.01 ? '✓ Équilibré' : (ecart > 0 ? '⚠ Excédent' : '✖ Manquant')}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* STAFF COLLECTIONS */}
                  <div className="space-y-4">
                    <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                       <i className="fa-solid fa-users text-primary" /> Recettes par collaborateur
                    </div>
                    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                       <table className="w-full text-left text-[12px]">
                          <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                               {['Collaborateur', 'Encaissement', 'Shift'].map(h => <th key={h} className="px-6 py-3 text-[10px] font-semibold text-slate-400">{h}</th>)}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 italic-rows">
                             {staffCollections.length > 0 ? staffCollections.map((s, i) => (
                               <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-2.5 font-black text-slate-800">{s.name}</td>
                                  <td className="px-6 py-2.5 font-black text-emerald-600">+{s.amount.toFixed(2)} €</td>
                                  <td className="px-6 py-2.5 text-slate-400 font-bold">{s.period}</td>
                               </tr>
                             )) : (
                               <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-300 italic">Aucun mouvement aujourd'hui</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TRANSACTION */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAddOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg pointer-events-auto p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <i className="fa-solid fa-circle-plus text-primary" /> Nouveau mouvement
                    </h3>
                    <button onClick={() => setAddOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                        <i className="fa-solid fa-times" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Type de mouvement</label>
                            <div className="flex gap-2">
                                {['debit', 'credit'].map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setForm(f => ({...f, type: t}))} 
                                        className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${form.type === t ? (t === 'debit' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200' : 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200') : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {t === 'debit' ? 'Sortie d\'argent' : 'Entrée d\'argent'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Catégorie</label>
                            <select value={form.cat} onChange={e => setForm(f => ({...f, cat: e.target.value}))} className={SC}>
                                {cats.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Montant (€) *</label>
                            <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className={IC} placeholder="0.00" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Fournisseur / Magasin</label>
                            <input type="text" value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} className={IC} placeholder="CORA, Boulangerie..." />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Saisie par</label>
                            <input type="text" value={form.by} onChange={e => setForm(f => ({...f, by: e.target.value}))} className={IC} placeholder="Prénom N." />
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Description *</label>
                        <input type="text" value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} className={IC} placeholder="Détail de la transaction..." />
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 ml-1">Justificatif (Scan/PDF)</label>
                        <div 
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                            onClick={() => document.getElementById('receipt-upload')?.click()}
                        >
                            <i className="fa-solid fa-cloud-upload-alt text-2xl text-slate-300 group-hover:text-primary mb-2 transition-colors" />
                            <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">Cliquez pour importer un ticket</p>
                            <input 
                                id="receipt-upload" 
                                type="file" 
                                className="hidden" 
                                onChange={e => setForm(f => ({...f, receipt: e.target.files?.[0] || null}))} 
                            />
                            {form.receipt && <p className="text-[10px] text-emerald-500 font-black mt-2">✓ {form.receipt.name}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setAddOpen(false)} className="px-6 py-3 rounded-2xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <button 
                    onClick={() => { 
                        if (!form.desc || !form.amount) return; 
                        setTransactions(prev => [{ 
                            id: Date.now().toString(), 
                            date: new Date().toLocaleString('fr-FR').slice(0,16), 
                            desc: form.desc, 
                            type: form.type, 
                            amount: parseFloat(form.amount), 
                            cat: form.cat, 
                            by: form.by || 'Staff',
                            supplier: form.supplier || '—',
                            receipt: form.receipt ? URL.createObjectURL(form.receipt) : null
                        }, ...prev]); 
                        setAddOpen(false); 
                        setForm({ desc: '', type: 'debit', amount: '', cat: 'Ménage', by: '', supplier: '', receipt: null }); 
                    }} 
                    className="px-8 py-3 rounded-2xl text-[12px] font-black text-white bg-primary hover:bg-[#7b4be8] shadow-xl shadow-primary/20 transition-all"
                  >
                        Valider l'enregistrement
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL CONTROLE DE CAISSE */}
      <AnimatePresence>
        {controlType !== 'none' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setControlType('none')} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }} className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden">
                    <div className={`px-8 py-6 flex justify-between items-center ${controlType === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <h3 className="text-white font-black text-lg flex items-center gap-3">
                            <i className={`fa-solid ${controlType === 'open' ? 'fa-door-open' : 'fa-lock'}`} />
                            {controlType === 'open' ? 'Ouverture de Caisse' : 'Fermeture de Caisse'}
                        </h3>
                        <button onClick={() => setControlType('none')} className="text-white/60 hover:text-white transition-colors">
                            <i className="fa-solid fa-times text-xl" />
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cédant (Responsable)</label>
                                <input type="text" className={IC} placeholder="Nom du responsable" value={controlForm.giver} onChange={e => setControlForm(f => ({...f, giver: e.target.value}))} />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Repreneur (Réceptionniste)</label>
                                <input type="text" className={IC} placeholder="Nom de l'agent" value={controlForm.taker} onChange={e => setControlForm(f => ({...f, taker: e.target.value}))} />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Montant {controlType === 'open' ? 'Initial (Compté)' : 'Réel (Compté)'} (€)</label>
                                <input type="number" step="0.01" className={IC + ' text-xl font-black'} placeholder="0.00" value={controlForm.amount} onChange={e => setControlForm(f => ({...f, amount: e.target.value}))} />
                            </div>
                            {controlType === 'close' && (
                                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-center justify-between mt-2">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Solde théorique</div>
                                        <div className="text-2xl font-black text-slate-800 tracking-tight">{balance.toFixed(2)}€</div>
                                    </div>
                                    <div className="h-10 w-px bg-slate-200 mx-2" />
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Écart constaté</div>
                                        <div className={`text-2xl font-black tracking-tight ${(parseFloat(controlForm.amount || '0') - balance) === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {(parseFloat(controlForm.amount || '0') - balance).toFixed(2)}€
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Signatures Électroniques</label>
                                <button onClick={clearSignature} className="text-[10px] font-black text-rose-500 hover:underline uppercase">Effacer</button>
                            </div>
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden relative">
                                <canvas 
                                    ref={signatureRef} 
                                    width={600} 
                                    height={200} 
                                    className="w-full h-40 cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!isDrawing && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-[11px] font-black uppercase tracking-widest">Signer ici</div>}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button onClick={() => setControlType('none')} className="flex-1 py-4 rounded-2xl text-[12px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
                                Abandonner
                            </button>
                            <button 
                                onClick={handleValidateControl}
                                className={`flex-1 py-4 rounded-2xl text-[12px] font-black text-white shadow-xl transition-all ${controlType === 'open' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'}`}
                            >
                                <i className="fa-solid fa-check-circle mr-2" />
                                Confirmer la {controlType === 'open' ? 'Ouverture' : 'Fermeture'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 7. DÉBITEURS / IMPAYÉS ──────────────────────────────────────────────────
export const Debiteurs: React.FC = () => {
  const [debs, setDebs] = useState([
    { id: '1', client: 'Dupont SA',   amount: 1250.00, dueDate: '2026-04-15', status: 'Retard',    invoiceId: 'INV-0982', canal: 'Direct',    contact: 'm.dupont@dupont.com',    days: 6  },
    { id: '2', client: 'Tech Corp',   amount: 3600.00, dueDate: '2026-04-10', status: 'Litige',    invoiceId: 'INV-0971', canal: 'Expedia',   contact: 'b.martin@tech.com',      days: 11 },
    { id: '3', client: 'M. Bernard',  amount:  120.00, dueDate: '2026-04-20', status: 'Retard',    invoiceId: 'INV-0990', canal: 'Booking',   contact: 'pierre.b@orange.fr',      days: 1  },
    { id: '4', client: 'SNCF Voyages',amount: 2800.00, dueDate: '2026-04-25', status: 'À echéance',invoiceId: 'INV-0995', canal: 'Direct',    contact: 'r.petit@sncf.fr',         days: -4 },
    { id: '5', client: 'Mme Dupont',  amount:  450.00, dueDate: '2026-04-01', status: 'Recouvrement',invoiceId:'INV-0940',canal:'Direct',    contact: 'claire.d@gmail.com',      days: 20 },
  ]);
  const totalDue = debs.reduce((a, d) => a + d.amount, 0);
  const overdue  = debs.filter(d => d.status !== 'À echéance').reduce((a, d) => a + d.amount, 0);
  const statusColor: Record<string, string> = { 'Retard': 'bg-amber-100 text-amber-700', 'Litige': 'bg-rose-100 text-rose-700', 'Recouvrement': 'bg-rose-200 text-rose-800', 'À echéance': 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI label="Total en attente" value={`${totalDue.toFixed(2)}€`} icon="fa-euro-sign" color="#8B5CF6" />
        <KPI label="En retard / Litige" value={`${overdue.toFixed(2)}€`} icon="fa-exclamation-triangle" color="#EF4444" />
        <KPI label="Dossiers actifs" value={debs.length} icon="fa-folder-open" color="#F59E0B" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-exclamation-circle text-rose-500" /> Débiteurs & Impayés</h4>
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><i className="fa-solid fa-download" /> Export CSV</button>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
            {['Client', 'Facture', 'Canal', 'Montant', 'Échéance', 'Jours de retard', 'Statut', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-400">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {debs.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3"><div className="font-bold text-slate-800">{d.client}</div><div className="text-[10px] text-slate-400">{d.contact}</div></td>
                <td className="px-4 py-3"><span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{d.invoiceId}</span></td>
                <td className="px-4 py-3 text-slate-500 font-semibold">{d.canal}</td>
                <td className="px-4 py-3 font-black text-slate-800">{d.amount.toFixed(2)}€</td>
                <td className="px-4 py-3 font-bold text-slate-500">{d.dueDate}</td>
                <td className="px-4 py-3"><span className={`font-black text-[13px] ${d.days > 10 ? 'text-rose-600' : d.days > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{d.days > 0 ? `+${d.days}j` : `${d.days}j`}</span></td>
                <td className="px-4 py-3"><Badge label={d.status} color={statusColor[d.status]} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setDebs(prev => prev.filter(dd => dd.id !== d.id)); window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Débiteur soldé · ${d.client}` } })); }} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">Réglé</button>
                    <button className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"><i className="fa-solid fa-paper-plane" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
