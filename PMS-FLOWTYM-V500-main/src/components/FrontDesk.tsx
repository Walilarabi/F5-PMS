import React from 'react';
import { 
  Hotel, 
  Users, 
  CalendarPlus, 
  CalendarMinus, 
  ArrowRight,
  Eye,
  Euro,
  LogIn,
  LogOut,
  TrendingUp,
  CircleCheck,
  CircleAlert,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface FrontDeskProps {
  rooms: any[];
  reservations: any[];
  clients: any[];
  onOpenReservation?: (id: string) => void;
  onOpenClient?: (id: number) => void;
  onAction?: (action: string, params?: any) => void;
}

export const FrontDesk: React.FC<FrontDeskProps> = ({ 
  rooms, 
  reservations, 
  clients,
  onOpenReservation,
  onOpenClient,
  onAction
}) => {
  const TODAY = new Date().toISOString().slice(0, 10);

  // --- CALCULATIONS ---
  const arrivalsToday = reservations.filter(r => r.checkin === TODAY && r.status !== 'cancelled');
  const departuresToday = reservations.filter(r => r.checkout === TODAY && r.status !== 'cancelled');
  const occupiedRooms = rooms.filter(r => r.status === 'Occupée').length;
  const freeRooms = rooms.filter(r => r.status === 'available' || r.status === 'Propre').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'Inconnu';

  const kpis = [
    { label: "Taux d'occupation", value: `${occupancyRate}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: "Arrivées aujourd'hui", value: arrivalsToday.length, icon: CalendarPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: "Départs aujourd'hui", value: departuresToday.length, icon: CalendarMinus, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: "Chambres libres", value: freeRooms, icon: Hotel, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* ─── KPI GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-2.5 rounded-[18px] border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-default group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-12 h-12 ${kpi.bg} opacity-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform`} />
            <div className="flex items-center gap-2.5 relative z-10">
              <div className={`w-8 h-8 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center shadow-inner`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-800 tracking-tight leading-none">{kpi.value}</div>
                <div className="text-[8px] font-black text-slate-400 tracking-widest mt-0.5 uppercase">{kpi.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── MAIN TABLES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ARRIVAIS */}
        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <CalendarPlus className="w-3 h-3" />
              </div>
              <h3 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">Arrivées du jour</h3>
            </div>
            <button 
              onClick={() => onAction && onAction('new-reservation')}
              className="bg-primary hover:bg-primary-dark text-white px-2 py-1 rounded-lg text-[8px] font-black tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-1"
            >
              + Nouveau
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/20 border-b border-slate-100 font-black text-[8px] tracking-[0.2em] text-slate-400 uppercase">
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Chambre</th>
                  <th className="px-4 py-2">Paiement</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {arrivalsToday.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-300 font-black text-[9px] tracking-widest">Aucune arrivée prévue aujourd'hui</td></tr>
                ) : (
                  arrivalsToday.map(r => (
                    <tr key={r.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-1">
                        <div className="font-black text-slate-800 text-[12px]">{getClientName(r.clientId)}</div>
                        <div className="text-[8px] text-slate-400 font-bold leading-none">{r.canal}</div>
                      </td>
                      <td className="px-4 py-1">
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-widest ${r.room === 'Non assignée' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'}`}>
                          {r.room}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest flex items-center justify-center gap-1 ${r.solde <= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {r.solde <= 0 ? <CircleCheck className="w-2.5 h-2.5" /> : <CircleAlert className="w-2.5 h-2.5" />}
                          {r.solde <= 0 ? 'Payé' : 'Impayé'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onOpenReservation && onOpenReservation(r.id)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm">
                            <LogIn className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DEPARTURES */}
        <div className="bg-white rounded-[20px] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <CalendarMinus className="w-3 h-3" />
              </div>
              <h3 className="text-[10px] font-black text-slate-700 tracking-widest uppercase">Départs du jour</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 tracking-widest">
              <Clock className="w-2.5 h-2.5" /> 11:00
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/20 border-b border-slate-100 font-black uppercase text-[8px] tracking-[0.2em] text-slate-400">
                  <th className="px-6 py-2 text-left">Client</th>
                  <th className="px-6 py-2 text-left">Chambre</th>
                  <th className="px-6 py-2">Statut</th>
                  <th className="px-6 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departuresToday.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Aucun départ prévu aujourd'hui</td></tr>
                ) : (
                  departuresToday.map(r => (
                    <tr key={r.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-1">
                        <div className="font-black text-slate-800 text-[12px]">{getClientName(r.clientId)}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">{r.status === 'checked_out' ? 'Parti' : 'En séjour'}</div>
                      </td>
                      <td className="px-6 py-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black tracking-widest">
                          {r.room}
                        </span>
                      </td>
                      <td className="px-6 py-1 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest border ${r.status === 'checked_out' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                          {r.status === 'checked_out' ? 'Libéré' : 'À libérer'}
                        </span>
                      </td>
                      <td className="px-6 py-1 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onOpenReservation && onOpenReservation(r.id)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                            <LogOut className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ─── QUICK FOOTER ─── */}
      <div className="bg-slate-900 rounded-[20px] p-4 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight mb-0.5">Flowtym <span className="text-primary-light">Ultimate Edition</span></h2>
            <p className="text-slate-400 text-[10px] font-bold leading-tight max-w-md">
              Bienvenue dans votre tableau de bord opérationnel. Gérez vos flux d'arrivées et de départs en temps réel avec une précision absolue.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onAction && onAction('focus-search')} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-black text-[9px] tracking-widest transition-all backdrop-blur-md border border-white/10">Recherche</button>
            <button onClick={() => onAction && onAction('go-today')} className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl font-black text-[9px] tracking-widest transition-all shadow-xl shadow-primary/40">Vue Today</button>
          </div>
        </div>
      </div>
    </div>
  );
};
