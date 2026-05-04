import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Maximize, 
  RotateCcw,
  Box,
  Layout,
  Info,
  Home,
  Zap
} from 'lucide-react';
import * as THREE from 'three';

interface Room {
  id: string;
  num: string;
  floor: number;
  typeId: string;
  typeName: string;
  view: string;
  status: string;
  width?: number;
}

interface FloorPlanConfigProps {
  rooms: Room[];
}

export const FloorPlanConfig: React.FC<FloorPlanConfigProps> = ({ rooms }) => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [currentFloor, setCurrentFloor] = useState(1);
  const container3dRef = useRef<HTMLDivElement>(null);

  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a: number, b: number) => a - b);
  const floorRooms = rooms.filter(r => r.floor === currentFloor);

  useEffect(() => {
    if (viewMode === '3d' && container3dRef.current) {
      const width = container3dRef.current.clientWidth;
      const height = 500;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a); // dark slate

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(15, 15, 15);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container3dRef.current.innerHTML = '';
      container3dRef.current.appendChild(renderer.domElement);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 10, 7.5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404040));

      const floorGeometry = new THREE.PlaneGeometry(20, 20);
      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      scene.add(floorMesh);

      // Add rooms as cubes
      floorRooms.forEach((rm, i) => {
        const geometry = new THREE.BoxGeometry(2, 2, 3);
        const color = rm.status === 'available' ? 0x22c55e : rm.status === 'maintenance' ? 0xef4444 : 0x3b82f6;
        const material = new THREE.MeshStandardMaterial({ color });
        const roomBox = new THREE.Mesh(geometry, material);
        
        const xPos = (i % 4) * 3 - 6;
        const zPos = Math.floor(i / 4) * 4 - 6;
        roomBox.position.set(xPos, 1, zPos);
        scene.add(roomBox);
      });

      const animate = () => {
        requestAnimationFrame(animate);
        scene.rotation.y += 0.005;
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        renderer.dispose();
      };
    }
  }, [viewMode, floorRooms]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Contrôles Plan</h3>
              
              <div className="space-y-4">
                 <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                    <button 
                      onClick={() => setViewMode('2d')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === '2d' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                       <Layout className="w-3.5 h-3.5" /> 2D
                    </button>
                    <button 
                      onClick={() => setViewMode('3d')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === '3d' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                       <Box className="w-3.5 h-3.5" /> 3D
                    </button>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sélection Étage</label>
                    <div className="flex items-center gap-2">
                       <select 
                         value={currentFloor}
                         onChange={e => setCurrentFloor(parseInt(e.target.value))}
                         className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                       >
                          {floors.map(f => <option key={f} value={f}>Étage {f}</option>)}
                       </select>
                       <div className="flex flex-col gap-1">
                          <button onClick={() => setCurrentFloor(f => f+1)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary transition-all"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => setCurrentFloor(f => Math.max(0, f-1))} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary transition-all"><ChevronDown className="w-4 h-4" /></button>
                       </div>
                    </div>
                 </div>

                 <button className="w-full bg-slate-900 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3">
                    <Settings className="w-4 h-4" /> Configurer Plan
                 </button>
              </div>
           </div>

           <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                 <Info className="w-4 h-4 text-primary" />
                 <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Légende Statuts</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { l: 'Libre', c: 'bg-emerald-500' },
                   { l: 'Occupée', c: 'bg-blue-500' },
                   { l: 'Ménage', c: 'bg-amber-500' },
                   { l: 'Maint.', c: 'bg-rose-500' },
                 ].map((i, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${i.c}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{i.l}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-3">
           <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl relative">
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                 <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Home className="w-3.5 h-3.5" /> Étage {currentFloor}
                 </div>
              </div>
              <div className="absolute top-6 right-6 z-10 flex gap-2">
                 <button className="w-10 h-10 bg-white/80 backdrop-blur rounded-full border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                    <RotateCcw className="w-4 h-4" />
                 </button>
                 <button className="w-10 h-10 bg-white/80 backdrop-blur rounded-full border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                    <Maximize className="w-4 h-4" />
                 </button>
              </div>

              {viewMode === '2d' ? (
                <div className="p-20 bg-slate-50/50 min-h-[500px] flex items-center justify-center">
                   <div className="grid grid-cols-4 gap-4 max-w-2xl w-full">
                      {floorRooms.map(rm => (
                        <div 
                          key={rm.id}
                          className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer hover:scale-105 hover:shadow-xl ${
                            rm.status === 'available' ? 'bg-white border-emerald-500' : 
                            rm.status === 'maintenance' ? 'bg-rose-50 border-rose-500' : 
                            'bg-blue-50 border-blue-500'
                          }`}
                        >
                           <span className={`text-base font-black ${rm.status === 'available' ? 'text-emerald-500' : rm.status === 'maintenance' ? 'text-rose-500' : 'text-blue-500'}`}>{rm.num}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{rm.typeName.slice(0, 10)}</span>
                        </div>
                      ))}

                      {floorRooms.length === 0 && (
                        <div className="col-span-4 p-20 text-center space-y-4">
                           <MapIcon className="w-12 h-12 text-slate-200 mx-auto" />
                           <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Aucune chambre à cet étage</p>
                           <button className="text-primary text-[10px] font-black uppercase underline">Générer plan par défaut</button>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div ref={container3dRef} className="bg-slate-900 min-h-[500px] cursor-grab active:cursor-grabbing" />
              )}
           </div>
           
           <div className="mt-6 flex justify-between items-center px-4">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan mis à jour 12:04</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline cursor-pointer">Export Blue Print (PDF)</span>
                 </div>
              </div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Source : Inventaire Physique v1.2</p>
           </div>
        </div>
      </div>
    </div>
  );
};
