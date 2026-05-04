import React, { useState } from 'react';
import { 
  Tags, 
  Plus, 
  Search, 
  Settings, 
  Copy, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Check,
  Zap,
  Layers,
  Euro,
  Percent,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RatePlan {
  code: string;
  name: string;
  type: string;
  derivedFrom: string | null;
  derivedMode: '%' | 'fixed' | null;
  derivedVal: number;
  meal: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  cancel: 'FLEX' | 'NANR' | '48H' | '7J';
  active: boolean;
}

interface RatePlansConfigProps {
  ratePlans: RatePlan[];
  setRatePlans: (plans: RatePlan[]) => void;
}

export const RatePlansConfig: React.FC<RatePlansConfigProps> = ({ ratePlans, setRatePlans }) => {
  const [search, setSearch] = useState('');
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredPlans = ratePlans.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (idx: number | null) => {
    setEditingPlan(idx);
    setShowModal(true);
  };

  const deletePlan = (idx: number) => {
    if (confirm('Supprimer ce rate plan ?')) {
      const newPlans = [...ratePlans];
      newPlans.splice(idx, 1);
      setRatePlans(newPlans);
    }
  };

  const duplicatePlan = (idx: number) => {
    const orig = ratePlans[idx];
    const copy = { ...orig, code: orig.code + '_COPY', name: orig.name + ' (copie)' };
    const newPlans = [...ratePlans];
    newPlans.splice(idx + 1, 0, copy);
    setRatePlans(newPlans);
  };

  const savePlan = (planData: RatePlan) => {
    const newPlans = [...ratePlans];
    if (editingPlan === null) {
      newPlans.push(planData);
    } else {
      newPlans[editingPlan] = planData;
    }
    setRatePlans(newPlans);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Rate Plans & Tarifs</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Structure tarifaire et dérivations</p>
        </div>
        <button 
          onClick={() => openEdit(null)}
          className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nouveau Plan
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex gap-4 bg-slate-50/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              placeholder="Rechercher un code ou un nom..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:border-primary transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-sm">
           <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-400">
                 <th className="px-6 py-4 text-left">Code</th>
                 <th className="px-6 py-4 text-left">Nom</th>
                 <th className="px-6 py-4">Type</th>
                 <th className="px-6 py-4">Meal</th>
                 <th className="px-6 py-4">Annul.</th>
                 <th className="px-6 py-4">D-Edge</th>
                 <th className="px-6 py-4"></th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {filteredPlans.map((p, i) => (
                <tr key={p.code} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                   <td className="px-6 py-5">
                      <span className="font-mono text-[11px] font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">{p.code}</span>
                   </td>
                   <td className="px-6 py-5">
                      <div className="font-black text-slate-800 text-xs">{p.name}</div>
                      {p.derivedFrom && (
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                           <RefreshCw className="w-2.5 h-2.5" /> Dérivé de {p.derivedFrom}
                        </div>
                      )}
                   </td>
                   <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.type === 'RACK' ? 'bg-slate-900 text-white' : 'bg-violet-100 text-violet-600'}`}>
                        {p.type}
                      </span>
                   </td>
                   <td className="px-6 py-5 text-center">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">{p.meal}</span>
                   </td>
                   <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.cancel === 'FLEX' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {p.cancel}
                      </span>
                   </td>
                   <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                   </td>
                   <td className="px-6 py-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(i)} className="p-2 text-slate-400 hover:text-primary transition-colors"><Settings className="w-4 h-4" /></button>
                        <button onClick={() => duplicatePlan(i)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => deletePlan(i)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <RatePlanModal 
            plan={editingPlan !== null ? ratePlans[editingPlan] : null}
            allPlans={ratePlans}
            onClose={() => setShowModal(false)}
            onSave={savePlan}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RatePlanModal: React.FC<{ plan: any, allPlans: any[], onClose: () => void, onSave: (data: any) => void }> = ({ plan, allPlans, onClose, onSave }) => {
  const [data, setData] = useState(plan || {
    code: '', name: '', type: 'Dérivé', derivedFrom: null, derivedMode: '%', derivedVal: 0, meal: 'RO', cancel: 'FLEX', active: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{plan ? 'Modifier Rate Plan' : 'Nouveau Rate Plan'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configuration des règles de calcul</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Tarif (Unique)</label>
                 <input value={data.code} onChange={e => setData({...data, code: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-mono font-black outline-none focus:bg-white focus:border-primary transition-all" placeholder="RACK-RO-FLEX" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom Commercial</label>
                 <input value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" placeholder="Rack Public" />
              </div>
           </div>

           <div className="bg-violet-50/50 rounded-3xl p-6 border border-violet-100 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <Layers className="w-4 h-4 text-violet-600" />
                 <h4 className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Dérivation & Calcul</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type de plan</label>
                    <select value={data.type} onChange={e => setData({...data, type: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none">
                       <option value="RACK">RACK (Référence principale)</option>
                       <option value="Dérivé">Dérivé (Calcul automatique)</option>
                       <option value="Promotion">Promotion (Action spot)</option>
                    </select>
                 </div>
                 {data.type !== 'RACK' && (
                    <div className="grid grid-cols-3 gap-3">
                       <div className="col-span-1 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base</label>
                          <select value={data.derivedFrom || ''} onChange={e => setData({...data, derivedFrom: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none">
                             {allPlans.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                          </select>
                       </div>
                       <div className="col-span-1 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</label>
                          <select value={data.derivedMode} onChange={e => setData({...data, derivedMode: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none">
                            <option value="%">Pourcentage (%)</option>
                            <option value="fixed">Montant fixe (€)</option>
                          </select>
                       </div>
                       <div className="col-span-1 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur</label>
                          <input 
                            type="number" 
                            value={isNaN(data.derivedVal) ? '' : data.derivedVal} 
                            onChange={e => setData({...data, derivedVal: e.target.value === '' ? NaN : parseFloat(e.target.value)})} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none" 
                          />
                       </div>
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Régime (Meal Plan)</label>
                 <select value={data.meal} onChange={e => setData({...data, meal: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none">
                    <option value="RO">RO — Room Only</option>
                    <option value="BB">BB — Petit-Déjeuner</option>
                    <option value="HB">HB — Demi-Pension</option>
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition Annulation</label>
                 <select value={data.cancel} onChange={e => setData({...data, cancel: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none">
                    <option value="FLEX">FLEX — 48h</option>
                    <option value="NANR">NANR — Non remboursable</option>
                    <option value="7J">7J — Strict</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
           <button onClick={onClose} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-500">Annuler</button>
           <button onClick={() => onSave(data)} className="bg-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-primary/20">Sauvegarder</button>
        </div>
      </motion.div>
    </div>
  );
};
