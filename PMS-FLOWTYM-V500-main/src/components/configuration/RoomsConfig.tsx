import React, { useState } from 'react';
import { 
  DoorOpen, 
  Plus, 
  GripVertical, 
  Trash2, 
  Copy, 
  Settings,
  X,
  Camera,
  Layers,
  Home,
  Utensils,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Check
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';

interface RoomType {
  id: string;
  name: string;
  cap: number;
  capMax: number;
  surface: number;
  view: string;
  rack: string;
  active: boolean;
  photos: string[];
  desc: string;
  amenities: string[];
}

interface RoomsConfigProps {
  rooms: RoomType[];
  setRooms: (rooms: RoomType[]) => void;
}

const AMENITIES_LIST = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'clim', label: 'Climatisation', icon: Wind },
  { id: 'tv', label: 'Télévision', icon: Tv },
  { id: 'coffee', label: 'Cafetière', icon: Coffee },
  { id: 'sdb', label: 'SdB Privée', icon: Home },
  { id: 'balcon', label: 'Balcon', icon: Layers },
];

export const RoomsConfig: React.FC<RoomsConfigProps> = ({ rooms, setRooms }) => {
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDragEnd = (newOrder: any[]) => {
    setRooms(newOrder);
  };

  const openEdit = (idx: number | null) => {
    setEditingRoom(idx);
    setShowModal(true);
  };

  const deleteRoom = (idx: number) => {
    if (confirm('Supprimer ce type de chambre ?')) {
      const newRooms = [...rooms];
      newRooms.splice(idx, 1);
      setRooms(newRooms);
    }
  };

  const duplicateRoom = (idx: number) => {
    const orig = rooms[idx];
    const copy = { ...orig, id: orig.id + '_COPY', name: orig.name + ' (copie)', photos: [] };
    const newRooms = [...rooms];
    newRooms.splice(idx + 1, 0, copy);
    setRooms(newRooms);
  };

  const saveRoom = (roomData: any) => {
    const newRooms = [...rooms];
    if (editingRoom === null) {
      newRooms.push(roomData);
    } else {
      newRooms[editingRoom] = roomData;
    }
    setRooms(newRooms);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Types de Chambres</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{rooms.length} configurations actives</p>
        </div>
        <button 
          onClick={() => openEdit(null)}
          className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nouveau Type
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <Reorder.Group axis="y" values={rooms} onReorder={handleDragEnd} className="divide-y divide-slate-100">
          {rooms.map((rt, i) => (
            <Reorder.Item key={rt.id} value={rt} className="bg-white hover:bg-slate-50/50 transition-colors group cursor-grab active:cursor-grabbing">
              <div className="p-6 flex items-center gap-6">
                 <div className="text-slate-200 group-hover:text-slate-400 transition-colors">
                    <GripVertical className="w-5 h-5" />
                 </div>
                 <div className="w-20 h-16 bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center text-slate-300">
                    {rt.photos?.[0] ? <img src={rt.photos[0]} className="w-full h-full object-cover" alt="" /> : <DoorOpen className="w-8 h-8 opacity-20" />}
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-3">
                       <span className="font-mono text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase">{rt.id}</span>
                       <h4 className="font-black text-slate-800 text-sm tracking-tight">{rt.name}</h4>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Capacité : <span className="text-slate-600">{rt.cap} pers.</span></p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Surface : <span className="text-slate-600">{rt.surface}m²</span></p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Vue : <span className="text-slate-600">{rt.view}</span></p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(i)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-all"><Settings className="w-4 h-4" /></button>
                    <button onClick={() => duplicateRoom(i)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => deleteRoom(i)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <AnimatePresence>
        {showModal && (
          <RoomModal 
            room={editingRoom !== null ? rooms[editingRoom] : null}
            onClose={() => setShowModal(false)}
            onSave={saveRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RoomModal: React.FC<{ room: any, onClose: () => void, onSave: (data: any) => void }> = ({ room, onClose, onSave }) => {
  const [data, setData] = useState(room || {
    id: '', name: '', cap: 2, capMax: 4, surface: 20, view: 'Jardin', rack: 'RACK-RO-FLEX', active: true, photos: [], desc: '', amenities: []
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{room ? 'Modifier' : 'Nouveau Type'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuration des caractéristiques techniques</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Unique (ID)</label>
                       <input 
                         value={data.id} onChange={e => setData({...data, id: e.target.value.toUpperCase()})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-mono font-black placeholder:text-slate-300 outline-none focus:bg-white focus:border-primary transition-all" placeholder="DBL_CLASS" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom Commercial</label>
                       <input 
                         value={data.name} onChange={e => setData({...data, name: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:border-primary transition-all" placeholder="Double Classique"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacité</label>
                       <input 
                         type="number" value={isNaN(data.cap) ? '' : data.cap} 
                         onChange={e => setData({...data, cap: e.target.value === '' ? NaN : parseInt(e.target.value)})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max</label>
                       <input 
                         type="number" value={isNaN(data.capMax) ? '' : data.capMax} 
                         onChange={e => setData({...data, capMax: e.target.value === '' ? NaN : parseInt(e.target.value)})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surface (m²)</label>
                       <input 
                         type="number" value={isNaN(data.surface) ? '' : data.surface} 
                         onChange={e => setData({...data, surface: e.target.value === '' ? NaN : parseInt(e.target.value)})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description Courte</label>
                    <textarea 
                      value={data.desc} onChange={e => setData({...data, desc: e.target.value})}
                      rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none no-resize"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipements & Options</label>
                    <div className="grid grid-cols-2 gap-3">
                       {AMENITIES_LIST.map(am => {
                          const Icon = am.icon;
                          const selected = data.amenities.includes(am.id);
                          return (
                            <button 
                              key={am.id}
                              onClick={() => {
                                const newAm = selected 
                                  ? data.amenities.filter((a: string) => a !== am.id)
                                  : [...data.amenities, am.id];
                                setData({...data, amenities: newAm});
                              }}
                              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${selected ? 'bg-primary-light border-primary/20 text-primary' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'}`}
                            >
                               <Icon className="w-4 h-4 shrink-0" />
                               <span className="text-[10px] font-black uppercase tracking-widest">{am.label}</span>
                               {selected && <Check className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photos du Type</label>
                    <div className="grid grid-cols-3 gap-3">
                       {data.photos.map((ph: string, pi: number) => (
                         <div key={pi} className="aspect-video bg-slate-100 rounded-xl relative group overflow-hidden">
                            <img src={ph} className="w-full h-full object-cover" alt="" />
                            <button 
                               onClick={() => {
                                 const nx = [...data.photos];
                                 nx.splice(pi, 1);
                                 setData({...data, photos: nx});
                               }}
                               className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <X className="w-3 h-3" />
                            </button>
                         </div>
                       ))}
                       <button className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all text-slate-400 hover:text-primary">
                          <Camera className="w-5 h-5" />
                          <span className="text-[8px] font-black uppercase">Ajouter</span>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
           <button onClick={onClose} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Annuler</button>
           <button 
             onClick={() => onSave(data)}
             className="bg-primary text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
           >
             Enregistrer la configuration
           </button>
        </div>
      </motion.div>
    </div>
  );
};
