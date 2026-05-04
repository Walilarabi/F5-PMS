import React from 'react';
import { 
  Database, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  Info,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Pool {
  id: string;
  name: string;
  compositeType: string;
  count: number;
  rule: 'same_floor' | 'any' | 'adjacent_num';
  ruleLabel: string;
  sources: string[];
}

interface PoolsConfigProps {
  pools: Pool[];
  setPools: (pools: Pool[]) => void;
  roomTypes: {id: string, name: string}[];
}

export const PoolsConfig: React.FC<PoolsConfigProps> = ({ pools, setPools, roomTypes }) => {
  const toggleSource = (poolIdx: number, rtId: string) => {
    const newPools = [...pools];
    const sources = [...newPools[poolIdx].sources];
    const existingIdx = sources.indexOf(rtId);
    
    if (existingIdx >= 0) sources.splice(existingIdx, 1);
    else sources.push(rtId);
    
    newPools[poolIdx].sources = sources;
    setPools(newPools);
  };

  const deletePool = (idx: number) => {
    if (confirm('Supprimer ce pool composite ?')) {
      const newPools = [...pools];
      newPools.splice(idx, 1);
      setPools(newPools);
    }
  };

  const addPool = () => {
    const newPool: Pool = {
      id: 'pool_' + Date.now(),
      name: 'Nouveau pool composite',
      compositeType: 'NEW_TYPE',
      count: 2,
      rule: 'same_floor',
      ruleLabel: 'Les chambres doivent être adjacentes (même étage)',
      sources: []
    };
    setPools([...pools, newPool]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Pools Composites</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestion des groupements de chambres</p>
        </div>
        <button 
          onClick={addPool}
          className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Créer un Pool
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {pools.map((pool, pi) => (
           <div key={pool.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl transition-all border-l-[6px] border-l-primary">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
                       <Database className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="font-black text-slate-800 text-base">{pool.name}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type Commercial :</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[9px] font-black uppercase font-mono">{pool.compositeType}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-300 hover:text-primary transition-all"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => deletePool(pi)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-300 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Composition</p>
                       <div className="text-2xl font-black text-slate-800 flex items-baseline gap-1">
                          {pool.count} <span className="text-[10px] font-bold text-slate-400 uppercase">Unités individuelles</span>
                       </div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
                       <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                       <div className="text-[10px] font-bold text-amber-800/80 leading-relaxed uppercase">
                          Chaque vente de ce type consomme {pool.count} dispos dans la source.
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Règle de groupement</p>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                       <Layers className="w-5 h-5 text-primary" />
                       <div className="text-[11px] font-black text-slate-700 leading-tight uppercase tracking-tight">
                          {pool.ruleLabel}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chambres Sources Autorisées</p>
                    <div className="flex flex-wrap gap-2">
                       {roomTypes.map(rt => {
                         const isActive = pool.sources.includes(rt.id);
                         return (
                           <button 
                             key={rt.id}
                             onClick={() => toggleSource(pi, rt.id)}
                             className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${isActive ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                           >
                              {isActive && '✓ '} {rt.name}
                           </button>
                         );
                       })}
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-start gap-6">
         <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">À propos des Pools</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-3xl">
               Le moteur Flowtym calcule automatiquement la disponibilité "Composite" en fonction des stocks réels des chambres sources. 
               Exemple: Pour vendre une "Chambre Familiale" (2 doubles), le système vérifie s'il reste au moins 2 chambres doubles libres à l'étage.
            </p>
         </div>
      </div>
    </div>
  );
};
