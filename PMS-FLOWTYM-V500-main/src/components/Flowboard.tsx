import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, X, TrendingUp, Users, Calendar, AlertTriangle,
  CalendarPlus, CalendarMinus, LogIn, LogOut, Eye,
  CircleCheck, CircleAlert, Clock, Hotel, LayoutDashboard,
  Euro, Activity, Maximize2, Minimize2, GripVertical, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

interface FlowboardProps {
  rooms?: any[];
  reservations?: any[];
  clients?: any[];
  onOpenReservation?: (id: string) => void;
  onAction?: (action: string, params?: any) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k€` : `${n}€`;

// ── KPI mini-card ─────────────────────────────────────────────────────────────
const KPI: React.FC<{
  label: string; value: string | number; icon: React.FC<any>;
  color: string; bg: string; delta?: string;
}> = ({ label, value, icon: Icon, color, bg, delta }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default flex items-center gap-3">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
      <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
    </div>
    <div className="min-w-0">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</div>
      <div className="text-2xl font-black text-slate-800 leading-tight">{value}</div>
      {delta && (
        <div className={`text-[9px] font-black flex items-center gap-0.5 ${delta.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>
          {delta} <span className="text-slate-400 font-bold">vs hier</span>
        </div>
      )}
    </div>
  </div>
);

// ── Widget shell ──────────────────────────────────────────────────────────────
const Widget: React.FC<{
  title: string; onRemove?: () => void; children: React.ReactNode;
  className?: string; expanded?: boolean; onToggleExpand?: () => void;
}> = ({ title, onRemove, children, className = '', expanded, onToggleExpand }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-primary/20 transition-all ${className}`}
  >
    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
      <div className="flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-slate-300 cursor-move" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleExpand && (
          <button onClick={onToggleExpand} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-primary transition-all">
            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
    <div className="flex-1 p-4 overflow-auto">{children}</div>
  </motion.div>
);

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
export const Flowboard: React.FC<FlowboardProps> = ({
  rooms = [], reservations = [], clients = [],
  onOpenReservation, onAction,
}) => {
  const TODAY = todayISO();

  // Widgets visibles (ids)
  const [visibleWidgets, setVisibleWidgets] = useState([
    'arrivals', 'departures', 'occ-chart', 'canal', 'alerts', 'activity'
  ]);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const removeWidget = (id: string) => setVisibleWidgets(prev => prev.filter(w => w !== id));
  const toggleExpand = (id: string) => setExpandedWidget(prev => prev === id ? null : id);
  const show = (id: string) => visibleWidgets.includes(id);

  // ── Calculs live depuis les props ──
  const arrivalsToday   = reservations.filter(r => r.checkin === TODAY && r.status !== 'cancelled' && r.status !== 'checked_out');
  const departuresToday = reservations.filter(r => r.checkout === TODAY && r.status !== 'cancelled');
  const inHouse         = reservations.filter(r => r.status === 'checked_in');
  const occupiedRooms   = rooms.filter(r => ['Occupée', 'occupied'].includes(r.status)).length;
  const totalRooms      = rooms.length || 1;
  const occupancy       = Math.round((occupiedRooms / totalRooms) * 100);
  const caToday         = reservations
    .filter(r => r.checkin === TODAY)
    .reduce((s, r) => s + (r.montant || 0), 0);
  const getClientName   = (r: any) => {
    if (r.guestName) return r.guestName;
    const c = clients.find(c => c.id === r.clientId);
    return c?.name || 'Client';
  };

  const kpis = [
    { label: "Taux d'occupation", value: `${occupancy}%`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', delta: '+3%' },
    { label: "Arrivées du jour",  value: arrivalsToday.length,   icon: CalendarPlus,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: "Départs du jour",   value: departuresToday.length,  icon: CalendarMinus, color: 'text-rose-600',    bg: 'bg-rose-50' },
    { label: "En séjour",         value: inHouse.length,          icon: Hotel,         color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: "CA du jour",        value: caToday > 0 ? fmt(caToday) : '—', icon: Euro, color: 'text-amber-600', bg: 'bg-amber-50', delta: caToday > 0 ? '+8%' : undefined },
    { label: "Chambres libres",   value: rooms.filter(r => ['Propre', 'available', 'Libre'].includes(r.status)).length, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  // Données graphique occupation hebdo
  const weekOccData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [72, 68, 81, 79, 85, 91, 77],
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139,92,246,0.07)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#8B5CF6',
      pointRadius: 3,
      pointHoverRadius: 5,
    }]
  };

  // CA par canal
  const canalData = {
    labels: ['Direct', 'Booking', 'Expedia', 'Airbnb', 'Autres'],
    datasets: [{
      data: [38, 29, 15, 12, 6],
      backgroundColor: ['#8B5CF6', '#3B82F6', '#F59E0B', '#EF4444', '#94A3B8'],
      borderWidth: 0,
    }]
  };

  // RevPAR 7j
  const revparData = {
    labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', "Auj."],
    datasets: [{
      label: 'RevPAR',
      data: [118, 132, 127, 145, 139, 158, Math.round(caToday / (totalRooms || 1)) || 142],
      backgroundColor: 'rgba(139,92,246,0.75)',
      borderRadius: 6,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { x: { display: false }, y: { display: false } },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94A3B8' } },
      y: { display: false },
    },
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 9 }, padding: 10 } },
    },
    cutout: '65%',
  };

  // Alertes opérationnelles (dérivées des données réelles)
  const alerts = [
    ...(arrivalsToday.length > 0 ? [{ type: 'info', msg: `${arrivalsToday.length} arrivée${arrivalsToday.length > 1 ? 's' : ''} prévue${arrivalsToday.length > 1 ? 's' : ''} aujourd'hui` }] : []),
    ...(departuresToday.filter(r => r.status !== 'checked_out').length > 0 ? [{ type: 'warn', msg: `${departuresToday.filter(r => r.status !== 'checked_out').length} départ${departuresToday.length > 1 ? 's' : ''} à finaliser` }] : []),
    ...(rooms.filter(r => r.status === 'Sale').length > 0 ? [{ type: 'warn', msg: `${rooms.filter(r => r.status === 'Sale').length} chambre${rooms.filter(r => r.status === 'Sale').length > 1 ? 's' : ''} en attente de ménage` }] : []),
    { type: 'info', msg: 'Supabase non connecté — données mockées' },
  ];

  const ALL_WIDGETS = [
    { id: 'arrivals',   label: 'Arrivées du jour' },
    { id: 'departures', label: 'Départs du jour' },
    { id: 'occ-chart',  label: 'Taux occupation (7j)' },
    { id: 'revpar',     label: 'RevPAR (7j)' },
    { id: 'canal',      label: 'Répartition canaux' },
    { id: 'alerts',     label: 'Alertes opérationnelles' },
    { id: 'activity',   label: 'Activité récente' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-[fadeIn_0.3s_ease-out]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Flowboard
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Ajouter widget */}
          {ALL_WIDGETS.filter(w => !visibleWidgets.includes(w.id)).length > 0 && (
            <div className="relative group">
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all">
                <Plus className="w-3 h-3" /> Widget
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[180px] z-50 hidden group-hover:block">
                {ALL_WIDGETS.filter(w => !visibleWidgets.includes(w.id)).map(w => (
                  <button key={w.id} onClick={() => setVisibleWidgets(prev => [...prev, w.id])}
                    className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-600 hover:bg-violet-50 hover:text-primary transition-colors">
                    + {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => onAction && onAction('new-reservation')}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle réservation
          </button>
        </div>
      </div>

      {/* ── KPI ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <KPI {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* ── WIDGET GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>

          {/* ARRIVÉES */}
          {show('arrivals') && (
            <Widget key="arrivals" title="Arrivées du jour"
              onRemove={() => removeWidget('arrivals')}
              onToggleExpand={() => toggleExpand('arrivals')}
              expanded={expandedWidget === 'arrivals'}
              className={expandedWidget === 'arrivals' ? 'xl:col-span-2 min-h-[260px]' : 'min-h-[200px]'}
            >
              {arrivalsToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-6">
                  <CalendarPlus className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Aucune arrivée prévue</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {arrivalsToday.slice(0, expandedWidget === 'arrivals' ? 10 : 4).map(r => (
                    <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 group transition-colors">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black">
                        {getClientName(r).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-black text-slate-800 truncate">{getClientName(r)}</div>
                        <div className="text-[9px] text-slate-400 font-bold">Ch. {r.room} · {r.canal}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${r.solde <= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                        {r.solde <= 0 ? '✓ Payé' : `${r.solde}€`}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => onOpenReservation && onOpenReservation(r.id)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-300 hover:text-primary transition-colors shadow-sm">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-500 shadow-sm">
                          <LogIn className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {arrivalsToday.length > 4 && expandedWidget !== 'arrivals' && (
                    <button onClick={() => toggleExpand('arrivals')} className="w-full text-center text-[9px] font-black text-primary/60 hover:text-primary py-1.5 transition-colors">
                      +{arrivalsToday.length - 4} autres <ArrowRight className="inline w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </Widget>
          )}

          {/* DÉPARTS */}
          {show('departures') && (
            <Widget key="departures" title="Départs du jour"
              onRemove={() => removeWidget('departures')}
              onToggleExpand={() => toggleExpand('departures')}
              expanded={expandedWidget === 'departures'}
              className={expandedWidget === 'departures' ? 'xl:col-span-2 min-h-[260px]' : 'min-h-[200px]'}
            >
              {departuresToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-6">
                  <CalendarMinus className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Aucun départ prévu</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {departuresToday.slice(0, expandedWidget === 'departures' ? 10 : 4).map(r => (
                    <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 group transition-colors">
                      <div className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black">
                        {getClientName(r).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-black text-slate-800 truncate">{getClientName(r)}</div>
                        <div className="text-[9px] text-slate-400 font-bold">Ch. {r.room}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${r.status === 'checked_out' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-100 text-amber-600 border-amber-100'}`}>
                        {r.status === 'checked_out' ? 'Libéré' : 'À libérer'}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => onOpenReservation && onOpenReservation(r.id)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-300 hover:text-primary transition-colors shadow-sm">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1 bg-rose-50 border border-rose-100 rounded-lg text-rose-400 shadow-sm">
                          <LogOut className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Widget>
          )}

          {/* OCCUPATION 7j */}
          {show('occ-chart') && (
            <Widget key="occ-chart" title="Taux d'occupation (7 jours)"
              onRemove={() => removeWidget('occ-chart')}
              className="min-h-[200px]"
            >
              <div className="h-[140px]">
                <Line data={weekOccData} options={{ ...chartOpts, scales: { x: { display: true, ticks: { font: { size: 9 }, color: '#94A3B8' }, grid: { display: false } }, y: { display: false } } }} />
              </div>
              <div className="flex justify-between mt-3 px-1">
                <div className="text-center">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Moy. semaine</div>
                  <div className="text-base font-black text-primary">79%</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Pic</div>
                  <div className="text-base font-black text-emerald-600">91%</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">ADR moy.</div>
                  <div className="text-base font-black text-slate-800">189€</div>
                </div>
              </div>
            </Widget>
          )}

          {/* REVPAR */}
          {show('revpar') && (
            <Widget key="revpar" title="RevPAR 7 derniers jours"
              onRemove={() => removeWidget('revpar')}
              className="min-h-[200px]"
            >
              <div className="h-[150px]">
                <Bar data={revparData} options={barOpts} />
              </div>
            </Widget>
          )}

          {/* CANAUX */}
          {show('canal') && (
            <Widget key="canal" title="Répartition par canal"
              onRemove={() => removeWidget('canal')}
              className="min-h-[200px]"
            >
              <div className="h-[150px]">
                <Doughnut data={canalData} options={doughnutOpts} />
              </div>
            </Widget>
          )}

          {/* ALERTES */}
          {show('alerts') && (
            <Widget key="alerts" title="Alertes opérationnelles"
              onRemove={() => removeWidget('alerts')}
              className="min-h-[200px]"
            >
              <div className="space-y-2.5">
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-900">Tout est en ordre</span>
                  </div>
                ) : alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${a.type === 'warn' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                    {a.type === 'warn'
                      ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      : <Activity className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                    <span className={`text-[11px] font-bold leading-tight ${a.type === 'warn' ? 'text-amber-900' : 'text-blue-900'}`}>{a.msg}</span>
                  </div>
                ))}
              </div>
            </Widget>
          )}

          {/* ACTIVITÉ RÉCENTE */}
          {show('activity') && (
            <Widget key="activity" title="Activité récente"
              onRemove={() => removeWidget('activity')}
              className="min-h-[200px]"
            >
              <div className="space-y-3">
                {[
                  { icon: LogIn,     color: 'text-emerald-600', bg: 'bg-emerald-50', action: 'Check-in effectué', detail: 'Sophie Dubois · Ch. 201', time: 'Il y a 5 min' },
                  { icon: Plus,      color: 'text-primary',     bg: 'bg-violet-50',  action: 'Nouvelle réservation', detail: 'Booking.com · RES-009', time: 'Il y a 18 min' },
                  { icon: LogOut,    color: 'text-rose-500',    bg: 'bg-rose-50',    action: 'Check-out finalisé', detail: 'Marc Fontaine · Ch. 104', time: 'Il y a 1h' },
                  { icon: Calendar,  color: 'text-blue-500',    bg: 'bg-blue-50',    action: 'Ménage demandé',     detail: 'Ch. 202 · Marie L.', time: 'Il y a 2h' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 ${item.bg} ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-slate-800">{item.action}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{item.detail}</div>
                    </div>
                    <div className="text-[9px] text-slate-300 font-bold shrink-0">{item.time}</div>
                  </div>
                ))}
              </div>
            </Widget>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
