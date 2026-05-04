import React from 'react';
import { 
  Layers, 
  HelpCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ArrowRight,
  Euro,
  Percent,
  Calculator
} from 'lucide-react';

interface RackGap {
  rtId: string;
  rtName: string;
  isRef: boolean;
  relation: string;
  gapMode: '-' | '%' | 'fixed';
  gapVal: number;
}

interface RackConfigProps {
  rackGaps: RackGap[];
  setRackGaps: (gaps: RackGap[]) => void;
  basePrice?: number;
}

export const RackConfig: React.FC<RackConfigProps> = ({ rackGaps, setRackGaps, basePrice = 257 }) => {
  const updateGap = (idx: number, patch: Partial<RackGap>) => {
    const newGaps = [...rackGaps];
    newGaps[idx] = { ...newGaps[idx], ...patch };
    setRackGaps(newGaps);
  };

  const deleteGap = (idx: number) => {
    if (rackGaps[idx].isRef) return;
    const newGaps = [...rackGaps];
    newGaps.splice(idx, 1);
    setRackGaps(newGaps);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 shadow-inner">
                 <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Cascade RACK</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Référentiel de prix par type de chambre</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prix de base (D-Day)</p>
                 <div className="text-2xl font-black text-violet-600 tabular-nums">{basePrice}€</div>
              </div>
              <button className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-primary transition-all">
                 <RefreshCw className="w-5 h-5" />
              </button>
           </div>
        </div>

        <div className="p-0 overflow-x-auto">
           <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-400">
                   <th className="px-8 py-5 text-left">Type de Chambre</th>
                   <th className="px-8 py-5 text-left">Règle / Relation</th>
                   <th className="px-8 py-5">Mode Calcul</th>
                   <th className="px-8 py-5 text-right">Valeur Écart</th>
                   <th className="px-8 py-5 text-right">Prix Simulé</th>
                   <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {rackGaps.map((gap, i) => {
                   let simulated = basePrice;
                   if (!gap.isRef) {
                      if (gap.gapMode === '%') simulated = Math.round(basePrice * (1 + gap.gapVal / 100));
                      else if (gap.gapMode === 'fixed') simulated = basePrice + gap.gapVal;
                   }
                   
                   return (
                     <tr key={gap.rtId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="font-black text-slate-800">{gap.rtName}</div>
                           <div className="text-[10px] text-slate-400 font-bold font-mono mt-1 uppercase">{gap.rtId}</div>
                        </td>
                        <td className="px-8 py-5">
                           {gap.isRef ? (
                             <span className="bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-200">🔑 Référence</span>
                           ) : (
                             <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-[10px] font-bold uppercase">vs</span>
                                <span className="font-black text-slate-600 text-[11px]">{gap.relation}</span>
                             </div>
                           )}
                        </td>
                        <td className="px-8 py-5 text-center">
                           {!gap.isRef && (
                             <div className="flex justify-center gap-1">
                                <button 
                                  onClick={() => updateGap(i, { gapMode: '%' })}
                                  className={`p-2 rounded-lg border transition-all ${gap.gapMode === '%' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                   <Percent className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => updateGap(i, { gapMode: 'fixed' })}
                                  className={`p-2 rounded-lg border transition-all ${gap.gapMode === 'fixed' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                >
                                   <Euro className="w-3.5 h-3.5" />
                                </button>
                             </div>
                           )}
                        </td>
                        <td className="px-8 py-5 text-right">
                           {!gap.isRef && (
                             <input 
                               type="number" 
                               value={isNaN(gap.gapVal) ? '' : gap.gapVal} 
                               onChange={e => updateGap(i, { gapVal: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                               className="w-24 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-right text-xs font-black outline-none focus:bg-white focus:border-primary transition-all" 
                             />
                           )}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-base">
                           {simulated}€
                        </td>
                        <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => deleteGap(i)}
                             disabled={gap.isRef}
                             className={`p-2.5 rounded-xl transition-all ${gap.isRef ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                     </tr>
                   );
                 })}
              </tbody>
           </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] p-8 text-white flex items-center justify-between border border-white/5 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary-light">
               <HelpCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md">
               <h4 className="text-sm font-black uppercase tracking-widest mb-1">Règle de Cascade</h4>
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Toute modification du prix RACK sur la chambre de référence se répercute instantanément sur les autres types selon ces écarts configurés.
               </p>
            </div>
         </div>
         <button className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">
            Appliquer les modifications
         </button>
      </div>
    </div>
  );
};
