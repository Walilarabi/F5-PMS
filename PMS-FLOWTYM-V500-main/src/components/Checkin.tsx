import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { CheckinModal } from './CheckinModal';
import { CHANNELS } from '../constants/channels';
import { getContrastColor, adjustColor } from '../lib/colorUtils';

const SourceLogo = ({ channelName }: { channelName: string | null }) => {
  if (!channelName) return null;
  const sourceLower = channelName.toLowerCase();
  const channel = CHANNELS.find(c => 
    sourceLower.includes(c.name.toLowerCase()) || 
    sourceLower.includes(c.code.toLowerCase())
  ) || CHANNELS.find(c => c.code === 'DIRECT');

  if (!channel) return <span className="text-[10px] font-bold text-slate-400">{channelName}</span>;

  return (
    <div className="flex items-center gap-1.5 group cursor-help" title={channel.name}>
      <div 
        className="w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm shrink-0"
        style={{ backgroundColor: channel.color }}
      >
        <span className="text-[6px] font-black uppercase tracking-tighter" style={{ color: getContrastColor(channel.color) }}>
           {channel.initials}
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: adjustColor(channel.color, -50) }}>{channel.name}</span>
    </div>
  );
};

interface CheckinProps {
  clients: any[];
  reservations: any[];
  rooms: any[];
  onConfirmCheckin: (data: any) => void;
  onOpenReservation?: (id: string) => void;
}

export const Checkin: React.FC<CheckinProps> = ({ clients, reservations, rooms, onConfirmCheckin, onOpenReservation }) => {
  const TODAY = new Date().toISOString().slice(0,10);
  const [selectedResa, setSelectedResa] = useState<any>(null);

  const arrivals = reservations.filter(r => r.checkin === TODAY && r.status !== 'checked_in' && r.status !== 'Annulee');
  const departures = reservations.filter(r => r.checkout === TODAY && r.status === 'checked_in');
  const inHouse = reservations.filter(r => r.status === 'checked_in');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ─── ARRIVALS ─── */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
              <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                 <ArrowRight className="w-4 h-4" /> Arrivées du jour
              </h3>
              <span className="bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{arrivals.length} dossiers</span>
           </div>
           <div className="flex-1 p-6 space-y-4">
              {arrivals.length > 0 ? arrivals.map(r => {
                const c = clients.find(cl => cl.id === r.clientId);
                return (
                  <div 
                    key={r.id} 
                    onClick={() => onOpenReservation?.(r.id)}
                    className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50 transition-all group group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-xl font-black shadow-sm group-hover:scale-105 transition-transform">
                       {c?.name.charAt(0)}
                    </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-black text-slate-800 truncate">{c?.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Ch. {r.room} · <SourceLogo channelName={r.canal} />
                        </div>
                     </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResa(r);
                      }}
                      className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all opacity-0 group-hover:opacity-100"
                    >
                       <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                );
              }) : (
                <div className="py-20 text-center text-slate-300">
                   <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-50" />
                   <p className="text-xs font-black uppercase tracking-widest">Toutes les arrivées traitées</p>
                </div>
              )}
           </div>
        </div>

        {/* ─── DEPARTURES ─── */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
              <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                 <ArrowLeft className="w-4 h-4" /> Départs attendus
              </h3>
              <span className="bg-amber-100 text-amber-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{departures.length} dossiers</span>
           </div>
           <div className="flex-1 p-6 space-y-4">
              {departures.length > 0 ? departures.map(r => {
                const c = clients.find(cl => cl.id === r.clientId);
                return (
                  <div 
                    key={r.id} 
                    onClick={() => onOpenReservation?.(r.id)}
                    className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-amber-200 hover:bg-amber-50 transition-all group group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 text-xl font-black shadow-sm group-hover:scale-105 transition-transform">
                       {c?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-black text-slate-800 truncate">{c?.name}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ch. {r.room} · {r.dates.split('–')[1]}</div>
                    </div>
                    <button className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all opacity-0 group-hover:opacity-100">
                       <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                );
              }) : (
                <div className="py-20 text-center text-slate-300">
                   <Clock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                   <p className="text-xs font-black uppercase tracking-widest">Aucun départ imminent</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* ─── IN HOUSE TABLE ─── */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4 text-primary" /> Clients en séjour
            </h3>
            <span className="bg-primary-light text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{inHouse.length} résidents</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-400">
              <th className="px-6 py-2 text-left">Client</th>
              <th className="px-6 py-2 text-center">Chambre</th>
              <th className="px-6 py-2 text-center">Arrivée</th>
              <th className="px-6 py-2 text-center">Identité</th>
              <th className="px-6 py-2 text-right">Montant</th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inHouse.map(r => {
               const c = clients.find(cl => cl.id === r.clientId);
               return (
                 <tr 
                   key={r.id} 
                   onClick={() => onOpenReservation?.(r.id)}
                   className="hover:bg-primary/5 transition-colors group cursor-pointer text-center"
                 >
                   <td className="px-6 py-2 text-left flex items-center gap-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-[9px] uppercase">{c?.name.split(' ').map(w=>w[0]).join('')}</div>
                      <span className="font-black text-slate-800">{c?.name}</span>
                   </td>
                   <td className="px-6 py-2 text-center">
                      <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black">{r.room}</span>
                   </td>
                   <td className="px-6 py-2 text-center text-xs text-slate-500 font-medium">07/04/2026</td>
                   <td className="px-6 py-2">
                      <div className="flex justify-center">
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-black border border-emerald-100">
                           <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </div>
                      </div>
                   </td>
                   <td className="px-6 py-2 text-right font-black text-slate-900">{r.montant}€</td>
                   <td className="px-6 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-white border border-slate-200 p-1.5 rounded-lg text-slate-400 hover:text-primary transition-colors">
                         <Sliders className="w-3.5 h-3.5" />
                      </button>
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      <CheckinModal
        isOpen={!!selectedResa}
        onClose={() => setSelectedResa(null)}
        reservation={selectedResa}
        rooms={rooms}
        clients={clients}
        onConfirm={(data) => {
          onConfirmCheckin(data);
          setSelectedResa(null);
        }}
      />
    </div>
  );
};

const Sliders = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
);
