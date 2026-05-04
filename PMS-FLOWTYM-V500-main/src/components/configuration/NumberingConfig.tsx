import React, { useState } from 'react';
import { 
  Binary, 
  Search, 
  Plus, 
  Trash2, 
  Zap, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  History,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';

interface NumberedRoom {
  id: string;
  num: string;
  floor: number;
  typeId: string;
  typeName: string;
  view: string;
  status: string;
}

interface NumberingConfigProps {
  rooms: NumberedRoom[];
  setRooms: (rooms: NumberedRoom[]) => void;
  roomTypes: {id: string, name: string}[];
}

export const NumberingConfig: React.FC<NumberingConfigProps> = ({ rooms, setRooms, roomTypes }) => {
  const [filterType, setFilterType] = useState('');

  const filtered = filterType ? rooms.filter(r => r.typeId === filterType) : rooms;

  const updateField = (idx: number, field: string, val: any) => {
    const newRooms = [...rooms];
    (newRooms[idx] as any)[field] = val;
    setRooms(newRooms);
  };

  const deleteRoom = (idx: number) => {
    if (confirm('Supprimer cette chambre physique ?')) {
      const newRooms = [...rooms];
      newRooms.splice(idx, 1);
      setRooms(newRooms);
    }
  };

  const toggleStatus = (idx: number) => {
    const newRooms = [...rooms];
    newRooms[idx].status = newRooms[idx].status === 'maintenance' ? 'available' : 'maintenance';
    setRooms(newRooms);
  };

  const generateRooms = () => {
    const count = 5;
    const start = 101;
    const floor = 1;
    const newOnes = [];
    for(let i=0; i<count; i++) {
       const n = (start + i).toString();
       if(!rooms.find(r => r.num === n)) {
          newOnes.push({
             id: 'rm_' + n,
             num: n,
             floor,
             typeId: roomTypes[0]?.id || 'DBL',
             typeName: roomTypes[0]?.name || 'Double',
             view: 'Cour',
             status: 'available'
          });
       }
    }
    setRooms([...rooms, ...newOnes]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Inventaire Physique</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Numérotation et état des unités</p>
        </div>
        <div className="flex gap-2">
           <button onClick={generateRooms} className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2">
              <Zap className="w-4 h-4" /> Auto-Générer
           </button>
           <button className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter Unité
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-slate-50/20">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Rechercher par numéro..." className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:border-primary transition-all" />
           </div>
           <select 
             value={filterType}
             onChange={e => setFilterType(e.target.value)}
             className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
           >
              <option value="">Tous les types</option>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
           </select>
           <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-all">
              <Download className="w-5 h-5" />
           </button>
        </div>

        <table className="w-full text-sm">
           <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                 <th className="px-8 py-4 text-left">N° Chambre</th>
                 <th className="px-8 py-4 text-left">Étage</th>
                 <th className="px-8 py-4 text-left">Type Commercial</th>
                 <th className="px-8 py-4 text-left">Vue Réelle</th>
                 <th className="px-8 py-4">Statut Initial</th>
                 <th className="px-8 py-4"></th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {filtered.map((rm, i) => (
                <tr key={rm.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-8 py-4">
                      <input 
                        value={rm.num} 
                        onChange={e => updateField(i, 'num', e.target.value)}
                        className="bg-transparent border-none font-black text-slate-800 text-base outline-none hover:bg-violet-50 focus:bg-violet-600 focus:text-white rounded px-2 py-1 transition-all w-24" 
                      />
                   </td>
                   <td className="px-8 py-4">
                      <input 
                        type="number"
                        value={isNaN(rm.floor) ? '' : rm.floor} 
                        onChange={e => updateField(i, 'floor', e.target.value === '' ? NaN : parseInt(e.target.value))}
                        className="bg-transparent border-none font-bold text-slate-600 outline-none w-16 text-center" 
                      />
                   </td>
                   <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rm.typeName}</span>
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      <select 
                        value={rm.view}
                        onChange={e => updateField(i, 'view', e.target.value)}
                        className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
                      >
                         <option>Cour</option>
                         <option>Rue</option>
                         <option>Jardin</option>
                         <option>Mer</option>
                      </select>
                   </td>
                   <td className="px-8 py-4 text-center">
                      <button 
                        onClick={() => toggleStatus(i)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${rm.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}
                      >
                         {rm.status === 'available' ? '✓ Actif' : '🔧 Maintenance'}
                      </button>
                   </td>
                   <td className="px-8 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => deleteRoom(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div className="p-20 text-center space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                <Binary className="w-8 h-8" />
             </div>
             <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Aucune chambre enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};
