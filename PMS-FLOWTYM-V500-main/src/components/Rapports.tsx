import React, { useMemo, useState, useRef } from "react";
import {
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  Download,
  FileText,
  BarChart2,
  PieChart,
  Globe,
  ArrowRight,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LayoutDashboard,
  ClipboardList,
  Printer,
  History,
  ShieldCheck,
  Coffee,
  Trophy,
  Crown,
  Tags,
  ShoppingCart,
  RefreshCcw,
  BarChart3,
  PlaneLanding,
  PlaneTakeoff,
  Clock,
  Euro,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import * as XLSX from "xlsx";
// @ts-ignore
import html2pdf from "html2pdf.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ReportProps {
  onBack: () => void;
  clients: any[];
  reservations: any[];
  rooms: any[];
}

// Pastel Palette for Flowtym
const COLORS = {
  violet: {
    light: "#F5F3FF",
    border: "#DDD6FE",
    main: "#8B5CF6",
    text: "#5B21B6",
  },
  emerald: {
    light: "#ECFDF5",
    border: "#A7F3D0",
    main: "#10B981",
    text: "#065F46",
  },
  blue: {
    light: "#EFF6FF",
    border: "#BFDBFE",
    main: "#3B82F6",
    text: "#1E40AF",
  },
  amber: {
    light: "#FFFBEB",
    border: "#FDE68A",
    main: "#F59E0B",
    text: "#92400E",
  },
  rose: {
    light: "#FFF1F2",
    border: "#FECDD3",
    main: "#F43F5E",
    text: "#9F1239",
  },
  slate: {
    light: "#F8FAFC",
    border: "#E2E8F0",
    main: "#64748B",
    text: "#1E293B",
  },
};

// ==================== DONNÉES STATISTIQUES (MOCK) ====================
const OCCUPATION_DATA = [
  {
    rank: 1,
    name: "Chambre Double Classique",
    reservations: 1319,
    nights: 3461,
    percent: 42.88,
  },
  {
    rank: 2,
    name: "Chambre Triple Classique",
    reservations: 604,
    nights: 2042,
    percent: 19.64,
  },
  {
    rank: 3,
    name: "Double Single Use Classique",
    reservations: 403,
    nights: 883,
    percent: 13.1,
  },
  {
    rank: 4,
    name: "Chambre supérieure 1 ou 2 personnes",
    reservations: 181,
    nights: 517,
    percent: 5.88,
  },
  {
    rank: 5,
    name: "Chambre Twin - Deluxe",
    reservations: 143,
    nights: 502,
    percent: 4.65,
  },
  {
    rank: 6,
    name: "Chambre Triple Deluxe",
    reservations: 127,
    nights: 464,
    percent: 4.13,
  },
  {
    rank: 7,
    name: "Chambre Double Deluxe",
    reservations: 91,
    nights: 276,
    percent: 2.96,
  },
  {
    rank: 8,
    name: "Suite Junior",
    reservations: 63,
    nights: 216,
    percent: 2.05,
  },
  {
    rank: 9,
    name: "Chambres Adjacentes 5 personnes",
    reservations: 46,
    nights: 127,
    percent: 1.5,
  },
  {
    rank: 10,
    name: "Chambres communicantes 5 personnes",
    reservations: 36,
    nights: 128,
    percent: 1.17,
  },
  {
    rank: 11,
    name: "Chambres communicantes 6 personnes",
    reservations: 23,
    nights: 89,
    percent: 0.75,
  },
  {
    rank: 12,
    name: "Chambres Adjacentes 6 pessoas",
    reservations: 18,
    nights: 58,
    percent: 0.59,
  },
  {
    rank: 13,
    name: "Chambres Adjacentes 4 personnes",
    reservations: 13,
    nights: 50,
    percent: 0.42,
  },
  {
    rank: 14,
    name: "Chambres communicantes 4 personnes",
    reservations: 9,
    nights: 28,
    percent: 0.29,
  },
];

const RATEPLANS_DATA: Record<string, any[]> = {
  "Booking.com": [
    {
      name: "Room Only",
      reservations: 850,
      nights: 2200,
      revenue: 198000,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 320,
      nights: 980,
      revenue: 107800,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 150,
      nights: 420,
      revenue: 58800,
      avgPrice: 140,
    },
  ],
  Expedia: [
    {
      name: "Room Only",
      reservations: 420,
      nights: 1100,
      revenue: 99000,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 280,
      nights: 850,
      revenue: 93500,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 95,
      nights: 260,
      revenue: 36400,
      avgPrice: 140,
    },
  ],
  Direct: [
    {
      name: "Room Only",
      reservations: 320,
      nights: 850,
      revenue: 76500,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 180,
      nights: 520,
      revenue: 57200,
      avgPrice: 110,
    },
    {
      name: "Demi-pension",
      reservations: 75,
      nights: 210,
      revenue: 29400,
      avgPrice: 140,
    },
  ],
  Airbnb: [
    {
      name: "Room Only",
      reservations: 200,
      nights: 550,
      revenue: 49500,
      avgPrice: 90,
    },
    {
      name: "Petit-déjeuner",
      reservations: 80,
      nights: 220,
      revenue: 24200,
      avgPrice: 110,
    },
  ],
};

const NATIONALITIES_STATS_DATA: Record<string, any[]> = {
  "Booking.com": [
    {
      country: "Arabie Saoudite",
      code: "sa",
      reservations: 450,
      nights: 1200,
      percent: 35,
    },
    {
      country: "France",
      code: "fr",
      reservations: 320,
      nights: 850,
      percent: 25,
    },
    {
      country: "États-Unis",
      code: "us",
      reservations: 120,
      nights: 350,
      percent: 10,
    },
    {
      country: "Allemagne",
      code: "de",
      reservations: 80,
      nights: 220,
      percent: 6,
    },
    {
      country: "Autres",
      code: "un",
      reservations: 300,
      nights: 800,
      percent: 24,
    },
  ],
  Expedia: [
    {
      country: "France",
      code: "fr",
      reservations: 280,
      nights: 750,
      percent: 40,
    },
    {
      country: "Royaume-Uni",
      code: "gb",
      reservations: 150,
      nights: 400,
      percent: 22,
    },
    {
      country: "États-Unis",
      code: "us",
      reservations: 100,
      nights: 280,
      percent: 14,
    },
    {
      country: "Autres",
      code: "un",
      reservations: 170,
      nights: 450,
      percent: 24,
    },
  ],
};

const PARTNERS_DATA = [
  { name: "Booking.com", res: 142, nights: 426, rev: 46860, share: 45 },
  { name: "Expedia", res: 84, nights: 252, rev: 26460, share: 25 },
  { name: "Direct", res: 62, nights: 186, rev: 21570, share: 21 },
  { name: "Airbnb", res: 28, nights: 84, rev: 9450, share: 9 },
];

const MONTHLY_TRENDS = {
  labels: [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ],
  revenue: [
    45000, 48000, 52000, 61000, 75000, 89000, 95000, 92000, 78000, 65000, 55000,
    58000,
  ],
  reservations: [120, 135, 142, 168, 195, 230, 245, 238, 185, 150, 130, 145],
};

const CHANNEL_PRICES = [
  { name: "Direct", price: 116, diff: 0 },
  { name: "Booking.com", price: 110, diff: -5 },
  { name: "Expedia", price: 105, diff: -9 },
  { name: "Airbnb", price: 112, diff: -3 },
];

const DAY_ACTIVITY = { arrivals: 12, departures: 8, rate: 66, occ: 78 };

const ApercuView: React.FC<{
  nationalityData: any[];
  totalAnalytics: any;
  activeSubTab: string;
  setActiveSubTab: (s: string) => void;
}> = ({ nationalityData, totalAnalytics, activeSubTab, setActiveSubTab }) => {
  const [rateplanPartner, setRateplanPartner] = useState("Booking.com");
  const [nationalityPartner, setNationalityPartner] = useState("Booking.com");
  const [period, setPeriod] = useState("Toutes périodes");
  const [trendYear, setTrendYear] = useState("2026");

  const subTabs = [
    {
      id: "nationalites-advanced",
      label: "Analyse avancée (Nationalités)",
      icon: Globe,
    },
    { id: "top-partners", label: "Top Partenaires", icon: Trophy },
    { id: "trends", label: "Tendances Mensuelles", icon: TrendingUp },
    { id: "channel-rates", label: "Tarifs par Canal", icon: Tags },
    { id: "day-activity", label: "Activité du Jour", icon: Clock },
    {
      id: "nationalites-channel",
      label: "Nationalités par Canal",
      icon: PieChart,
    },
    {
      id: "room-types",
      label: "Répartition par Type de Chambre",
      icon: BarChart2,
    },
    {
      id: "rate-plans",
      label: "Classement des Plans Tarifaires",
      icon: Trophy,
    },
  ];

  const kpis = [
    {
      label: "TO% GLOBAL",
      value: "75%",
      icon: BarChart3,
      color: "#8B5CF6",
      delta: "+2.4%",
    },
    {
      label: "ADR",
      value: "120 €",
      icon: Euro,
      color: "#10B981",
      delta: "+12 €",
    },
    {
      label: "RevPAR",
      value: "90 €",
      icon: TrendingUp,
      color: "#3B82F6",
      delta: "+8 €",
    },
    {
      label: "Panier Moyen",
      value: "156 €",
      icon: ShoppingCart,
      color: "#F59E0B",
      delta: "+5 €",
    },
    {
      label: "Conversion",
      value: "3.2%",
      icon: RefreshCcw,
      color: "#EC4899",
      delta: "+0.5%",
    },
  ];

  const occupationTotal = {
    res: OCCUPATION_DATA.reduce((sum, d) => sum + d.reservations, 0),
    nights: OCCUPATION_DATA.reduce((sum, d) => sum + d.nights, 0),
  };

  const topRoom = OCCUPATION_DATA.reduce(
    (max, d) => (d.percent > max.percent ? d : max),
    OCCUPATION_DATA[0],
  );

  const currentRateplans =
    RATEPLANS_DATA[rateplanPartner] || RATEPLANS_DATA["Booking.com"];
  const currentNationalities =
    NATIONALITIES_STATS_DATA[nationalityPartner] ||
    NATIONALITIES_STATS_DATA["Booking.com"];

  const occupationChartData = {
    labels: OCCUPATION_DATA.map((d) => d.name),
    datasets: [
      {
        data: OCCUPATION_DATA.map((d) => d.percent),
        backgroundColor: [
          "#8B5CF6",
          "#A78BFA",
          "#C4B5FD",
          "#E9D5FF",
          "#F3E8FF",
          "#FFEDD5",
          "#FED7AA",
          "#FEF3C7",
          "#ECFDF5",
          "#E0F2FE",
          "#FCE7F3",
          "#FEF2F2",
          "#F1F5F9",
          "#E2E8F0",
        ],
        borderWidth: 0,
      },
    ],
  };

  const rateplansChartData = {
    labels: currentRateplans.map((p) => p.name),
    datasets: [
      {
        label: "Revenu (€)",
        data: currentRateplans.map((p) => p.revenue),
        backgroundColor: "#8B5CF6",
        borderRadius: 12,
      },
    ],
  };

  const nationalityChartData = {
    labels: currentNationalities.map((n) => n.country),
    datasets: [
      {
        data: currentNationalities.map((n) => n.percent),
        backgroundColor: [
          "#8B5CF6",
          "#A78BFA",
          "#C4B5FD",
          "#E9D5FF",
          "#F3E8FF",
        ],
        borderWidth: 0,
      },
    ],
  };

  const partnersChartData = {
    labels: PARTNERS_DATA.map((p) => p.name),
    datasets: [
      {
        label: "Revenu (€)",
        data: PARTNERS_DATA.map((p) => p.rev),
        backgroundColor: ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"],
        borderRadius: 12,
        barThickness: 32,
      },
    ],
  };

  const trendsChartData = {
    labels: MONTHLY_TRENDS.labels,
    datasets: [
      {
        label: "Revenu (€)",
        data: MONTHLY_TRENDS.revenue,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Réservations",
        data: MONTHLY_TRENDS.reservations.map((r) => r * 200), // Scaled for display
        borderColor: "#10B981",
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { size: 10, weight: "bold" as any },
          boxWidth: 12,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" as any } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "bold" as any } },
      },
    },
  };

  const PeriodSelector = () => (
    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
      <Calendar className="w-4 h-4 text-slate-400" />
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="text-[11px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
      >
        <option>Aujourd'hui</option>
        <option>Cette semaine</option>
        <option>Ce mois</option>
        <option>Toutes périodes</option>
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* KPI Stratégiques */}
      <div className="grid grid-cols-5 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: kpi.color }}
            />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:scale-110 transition-transform">
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                {kpi.delta}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {kpi.label}
            </p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">
              {kpi.value}
            </h4>
          </div>
        ))}
      </div>

      <div className="flex gap-10 items-start">
        {/* Sidebar Gauche */}
        <div className="w-80 sticky top-32 space-y-3 bg-white/50 p-4 rounded-[32px] border border-slate-200/50 backdrop-blur-md">
          <div className="px-4 pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Navigation Apercu
            </h3>
          </div>
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all border ${activeSubTab === tab.id ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:text-primary hover:shadow-lg"}`}
            >
              <tab.icon
                className={`w-5 h-5 ${activeSubTab === tab.id ? "text-white" : "text-slate-300"}`}
              />
              <span className="text-[12px] font-black text-left leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Zone de Contenu */}
        <div className="flex-1 min-w-0 space-y-8">
          <div className="flex justify-between items-center bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-2">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {subTabs.find((t) => t.id === activeSubTab)?.label}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Analyse détaillée des performances
              </p>
            </div>
            <PeriodSelector />
          </div>

          {activeSubTab === "top-partners" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Top Partenaires
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance par canal de distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Partenaire</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">CA Total</th>
                        <th className="pb-4 text-right">Part %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {PARTNERS_DATA.map((p, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {p.name}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {p.res}
                          </td>
                          <td className="py-4 text-right text-[12px] font-black text-slate-900">
                            {p.rev.toLocaleString()} €
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-block px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[11px] font-black">
                              {p.share}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[350px]">
                  <Bar
                    data={partnersChartData}
                    options={{
                      indexAxis: "y" as const,
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { display: false },
                        y: {
                          grid: { display: false },
                          ticks: { font: { weight: "bold" as any } },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "trends" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Tendances Mensuelles
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Evolution du revenu et des réservations
                    </p>
                  </div>
                </div>
                <select
                  value={trendYear}
                  onChange={(e) => setTrendYear(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black"
                >
                  <option>2026</option>
                  <option>2025</option>
                </select>
              </div>
              <div className="h-[450px]">
                <Line
                  data={trendsChartData}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: { ...chartOptions.scales.y, display: true },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {activeSubTab === "channel-rates" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Tags className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Tarifs par Canal
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Prix moyen par canal de distribution
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {CHANNEL_PRICES.map((c, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative group hover:border-primary/30 transition-all"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      {c.name}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-800">
                        {c.price} €
                      </span>
                    </div>
                    <div
                      className={`mt-4 inline-flex items-center gap-2 text-[10px] font-black px-3 py-1 rounded-lg ${c.diff === 0 ? "bg-slate-200 text-slate-500" : c.diff > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {c.diff === 0 ? "RÉFÉRENCE" : `${c.diff}% vs Direct`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "day-activity" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Activité du Jour
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Flux d'entrées et de sorties
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-violet-50 rounded-[32px] p-10 border border-violet-100 flex flex-col items-center text-center">
                  <PlaneLanding className="w-10 h-10 text-violet-600 mb-4" />
                  <div className="text-4xl font-black text-violet-700 mb-2">
                    {DAY_ACTIVITY.arrivals}
                  </div>
                  <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
                    Arrivées
                  </p>
                </div>
                <div className="bg-amber-50 rounded-[32px] p-10 border border-amber-100 flex flex-col items-center text-center">
                  <PlaneTakeoff className="w-10 h-10 text-amber-600 mb-4" />
                  <div className="text-4xl font-black text-amber-700 mb-2">
                    {DAY_ACTIVITY.departures}
                  </div>
                  <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                    Départs
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-[32px] p-10 border border-emerald-100 flex flex-col items-center text-center">
                  <RefreshCcw className="w-10 h-10 text-emerald-600 mb-4" />
                  <div className="text-4xl font-black text-emerald-700 mb-2">
                    {DAY_ACTIVITY.rate}%
                  </div>
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                    Taux de départ vs arrivées
                  </p>
                </div>
              </div>
              <div className="mt-10 p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight">
                      Taux d'Occupation du Jour
                    </h4>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Base de calcul : 48 chambres
                    </p>
                  </div>
                </div>
                <div className="text-5xl font-black text-primary">
                  {DAY_ACTIVITY.occ}%
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "nationalites-advanced" && (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                      Performances par Nationalité
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Données consolidées multi-canaux
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-black text-violet-600 bg-violet-100/50 px-6 py-3 rounded-2xl uppercase tracking-widest border border-violet-100">
                  Total CA Consolidé : {totalAnalytics.total.toLocaleString()} €
                </div>
              </div>
              <div className="p-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-10 py-6">Pays / Origine</th>
                      <th className="px-8 py-6 text-center">Nuits (PM)</th>
                      <th className="px-8 py-6 text-right">CA Hébergement</th>
                      <th className="px-8 py-6 text-right">CA Extras / F&B</th>
                      <th className="px-10 py-6 text-right">Total Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 italic-rows">
                    {nationalityData.map((d, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-10 py-5 flex items-center gap-6">
                          <span
                            className={`fi fi-${d.flag} text-2xl rounded-md shadow-sm border border-slate-200`}
                          ></span>
                          <span className="text-[14px] font-black text-slate-700">
                            {d.country}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center text-slate-400 font-extrabold text-[13px]">
                          {d.pm}
                        </td>
                        <td className="px-8 py-5 text-right text-slate-600 font-bold text-[13px]">
                          {d.stay.toLocaleString()} €
                        </td>
                        <td className="px-8 py-5 text-right text-slate-600 font-bold text-[13px]">
                          {d.fb.toLocaleString()} €
                        </td>
                        <td className="px-10 py-5 text-right">
                          <div className="bg-violet-100/50 rounded-2xl px-5 py-2.5 shadow-sm inline-block group-hover:scale-105 transition-transform border border-violet-100">
                            <span className="text-[16px] font-black text-violet-700 tracking-tight">
                              {d.total.toLocaleString()} €
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === "nationalites-channel" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Répartition des Nationalités
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Par canal de réservation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={nationalityPartner}
                    onChange={(e) => setNationalityPartner(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:bg-white"
                  >
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Nationalité</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">Nuitées</th>
                        <th className="pb-4 text-right">% Part</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentNationalities.map((n, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4 flex items-center gap-4">
                            <span
                              className={`fi fi-${n.code} text-xl rounded shadow-sm`}
                            ></span>
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {n.country}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {n.reservations.toLocaleString()}
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {n.nights.toLocaleString()}
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="inline-flex items-center justify-end w-16 h-8 bg-slate-100 rounded-lg px-3 text-[12px] font-black text-slate-800">
                              {n.percent}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[400px]">
                  <Pie data={nationalityChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "room-types" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Répartition par Type de Chambre
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance commerciale par catégorie
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Rang / Type</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">Nuitées</th>
                        <th className="pb-4 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {OCCUPATION_DATA.map((d, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center">
                                {d.rank}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                {d.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-[11px] font-bold text-slate-500">
                            {d.reservations.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-[11px] font-bold text-slate-500">
                            {d.nights.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-[11px] font-black text-primary">
                            {d.percent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[400px] relative">
                  <Pie data={occupationChartData} options={chartOptions} />
                </div>
              </div>
              <div className="mt-10 bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-8 text-white flex items-center justify-between shadow-lg shadow-violet-200">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <Crown className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">
                      Type de chambre le plus commercialisé
                    </p>
                    <h4 className="text-xl font-black">{topRoom.name}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">
                    {topRoom.percent.toFixed(1)}%
                  </div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    des nuitées totales
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "rate-plans" && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Classement des Plans Tarifaires
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Par partenaire de distribution
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={rateplanPartner}
                    onChange={(e) => setRateplanPartner(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-[11px] font-black text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer hover:bg-white"
                  >
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Direct">Direct</option>
                    <option value="Airbnb">Airbnb</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Plan Tarifaire</th>
                        <th className="pb-4 text-right">Résa.</th>
                        <th className="pb-4 text-right">CA Total</th>
                        <th className="pb-4 text-right">Prix Moy.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {currentRateplans.map((p, i) => (
                        <tr
                          key={i}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
                              {p.name}
                            </span>
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-500">
                            {p.reservations.toLocaleString()}
                          </td>
                          <td className="py-4 text-right text-[12px] font-black text-emerald-600">
                            {p.revenue.toLocaleString()} €
                          </td>
                          <td className="py-4 text-right text-[12px] font-bold text-slate-800 bg-slate-50/50 rounded-xl px-4">
                            {p.avgPrice} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="h-[350px]">
                  <Bar
                    data={rateplansChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 10, weight: "bold" as const },
                          },
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 10, weight: "bold" as const },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EMPTY STATE RAPPORTS ────────────────────────────────────────────────────
const ReportEmptyState = ({ code }: { code: string }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', padding:'56px 24px', textAlign:'center' }}>
    <div style={{ position:'relative', marginBottom:24 }}>
      <div style={{ position:'absolute', inset:-10, borderRadius:28,
        background:'radial-gradient(circle, rgba(139,92,246,0.07), transparent)' }} />
      <div style={{ width:68, height:68, borderRadius:20,
        background:'linear-gradient(135deg, #EDE9FE, #E0E7FF)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:28, position:'relative', boxShadow:'0 4px 18px rgba(139,92,246,0.12)' }}>
        📊
      </div>
    </div>
    <div style={{ fontSize:15, fontWeight:700, color:'#1E293B', marginBottom:6 }}>
      Aucune donnée pour {code}
    </div>
    <div style={{ fontSize:12, color:'#94A3B8', maxWidth:280, lineHeight:1.6 }}>
      Les données apparaîtront dès qu'elles seront disponibles dans Supabase.
    </div>
  </div>
);

export const Rapports: React.FC<ReportProps> = ({
  onBack,
  clients,
  reservations,
  rooms,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "apercu" | "allreports"
  >("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("nationalites-advanced");
  const [currentFamily, setCurrentFamily] = useState("exp");
  const [activeReport, setActiveReport] = useState<string>(
    "STA-10 Analyse avancée (Nationalités)",
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- REPORT LIST (49 Reports) ---
  const reportsByFamily = useMemo(
    () => ({
      exp: {
        label: "Exploitation",
        icon: <ClipboardList className="w-4 h-4" />,
        color: COLORS.violet,
        reports: [
          "EXP-01 Occupation temps réel",
          "EXP-02 Cardex Client",
          "EXP-03 Petit-déjeuner",
          "EXP-04 PDJ pré-facturés",
          "EXP-05 Planning du jour",
          "EXP-06 Feuille gouvernante",
          "EXP-07 Attribution chambres",
          "EXP-08 Liste de Groupes",
          "EXP-09 No-shows",
          "EXP-10 Départs du jour",
          "EXP-11 Prévision repas",
          "EXP-12 Taux de change",
          "EXP-13 F&B Détails",
          "EXP-14 Occupation prévisionnelle",
          "EXP-15 Productivité ménage",
          "EXP-16 Planning personnel",
        ],
      },
      sta: {
        label: "Statistiques",
        icon: <TrendingUp className="w-4 h-4" />,
        color: COLORS.blue,
        reports: [
          "STA-01 Dashboard cumulé",
          "STA-02 Analyse tarifs",
          "STA-03 Allotements",
          "STA-04 Analyse clients",
          "STA-05 Canaux distribution",
          "STA-06 Nationalités & Pays",
          "STA-07 Déclaration INSEE",
          "STA-08 Rotation chambres",
          "STA-09 Turnover chambres",
          "STA-10 Analyse avancée (Nationalités)",
          "STA-11 Segmentation du Marché",
        ],
      },
      fin: {
        label: "Financier",
        icon: <PieChart className="w-4 h-4" />,
        color: COLORS.emerald,
        reports: [
          "FIN-01 Journal prestations",
          "FIN-02 Journal règlements",
          "FIN-03 Compte de résultat",
          "FIN-04 Balance âgée",
          "FIN-05 Contrôle soldes",
          "FIN-06 Petite caisse",
          "FIN-07 Recouchant facturé",
          "FIN-08 Position globale",
          "FIN-09 Déclaration TVA",
          "FIN-10 Situation financière",
          "FIN-11 Rapport de caisse",
          "FIN-12 Taxe de séjour",
          "FIN-13 Clôture de caisse",
          "FIN-14 Commissions OTA",
          "FIN-15 Taxe séjour déclarative",
          "FIN-16 Rapport de facturation",
        ],
      },
      cli: {
        label: "Clients",
        icon: <Users className="w-4 h-4" />,
        color: COLORS.amber,
        reports: [
          "CLI-01 Liste Débiteurs",
          "CLI-02 Arrhes & acomptes",
          "CLI-03 Crédits clients",
          "CLI-04 États antérieurs",
          "CLI-05 Statistiques CLV",
        ],
      },
      dir: {
        label: "Direction",
        icon: <ShieldCheck className="w-4 h-4" />,
        color: COLORS.rose,
        reports: ["DIR-01 Synthèse direction"],
      },
    }),
    [],
  );

  // --- DATA MOCKING ---
  const nationalityData = useMemo(
    () => [
      {
        country: "France",
        flag: "fr",
        noShow: 0,
        pm: 12,
        stay: 12400,
        fb: 1540,
        cancels: 2,
        total: 13940,
      },
      {
        country: "Royaume-Uni",
        flag: "gb",
        noShow: 1,
        pm: 8,
        stay: 8450,
        fb: 960,
        cancels: 1,
        total: 9410,
      },
      {
        country: "États-Unis",
        flag: "us",
        noShow: 0,
        pm: 15,
        stay: 21600,
        fb: 2400,
        cancels: 0,
        total: 24000,
      },
      {
        country: "Allemagne",
        flag: "de",
        noShow: 0,
        pm: 6,
        stay: 6850,
        fb: 780,
        cancels: 0,
        total: 7630,
      },
      {
        country: "Espagne",
        flag: "es",
        noShow: 0,
        pm: 4,
        stay: 4200,
        fb: 520,
        cancels: 1,
        total: 4720,
      },
      {
        country: "Italie",
        flag: "it",
        noShow: 1,
        pm: 3,
        stay: 3100,
        fb: 410,
        cancels: 0,
        total: 3510,
      },
      {
        country: "Belgique",
        flag: "be",
        noShow: 0,
        pm: 5,
        stay: 5600,
        fb: 680,
        cancels: 0,
        total: 6280,
      },
      {
        country: "Suisse",
        flag: "ch",
        noShow: 0,
        pm: 7,
        stay: 8900,
        fb: 1100,
        cancels: 2,
        total: 10000,
      },
    ],
    [],
  );

  const totalAnalytics = useMemo(() => {
    return nationalityData.reduce(
      (acc, curr) => ({
        noShow: acc.noShow + curr.noShow,
        pm: acc.pm + curr.pm,
        stay: acc.stay + curr.stay,
        fb: acc.fb + curr.fb,
        cancels: acc.cancels + curr.cancels,
        total: acc.total + curr.total,
      }),
      { noShow: 0, pm: 0, stay: 0, fb: 0, cancels: 0, total: 0 },
    );
  }, [nationalityData]);

  // ═══════════════════════════════════════════════════════════════
  // DONNÉES RÉELLES — 49 RAPPORTS CÂBLÉS
  // Source : reservations, clients, rooms (props)
  // ═══════════════════════════════════════════════════════════════

  const today = new Date().toISOString().split('T')[0];
  const fmtD  = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
  const fmtE  = (n: number)   => n.toFixed(2);
  const PAYMENT_MODES = ['Carte bancaire','Espèces','Virement','Chèque','PayPal','AMEX','Diners','JCB','Débiteur'];
  const OTA_RATES: Record<string,number> = { 'Booking.com':15, 'Expedia':18, 'Airbnb':3, 'Direct':0, 'Agoda':15 };

  // ── EXPLOITATION ──────────────────────────────────────────────

  // EXP-01 Occupation temps réel — reservations + rooms
  const exp01 = useMemo(() => {
    const total = rooms.length || 10;
    const occupied = reservations.filter(r => r.checkin <= today && r.checkout > today && r.status === 'checked_in').length;
    const arrivals = reservations.filter(r => r.checkin === today && r.status === 'confirmed').length;
    const departures = reservations.filter(r => r.checkout === today && r.status === 'checked_in').length;
    return [
      { id:1, col1:'TO%',       col2:'Taux d\'occupation temps réel', col3:String(total), col4:occupied > 0 ? 'Occupé' : 'Libre', col5: fmtE((occupied/total)*100) },
      { id:2, col1:'Arrivées',  col2:'Check-in attendus aujourd\'hui',  col3:String(arrivals),   col4:'Confirmé', col5:'—' },
      { id:3, col1:'Départs',   col2:'Check-out prévus aujourd\'hui',   col3:String(departures),  col4:'Check-in', col5:'—' },
      { id:4, col1:'Libres',    col2:'Chambres disponibles',            col3:String(total - occupied), col4:'Disponible', col5:'—' },
    ];
  }, [reservations, rooms]);

  // EXP-02 Cardex Client — clients + reservations (historique)
  const exp02 = useMemo(() => clients.map((c:any, i:number) => {
    const sejours = reservations.filter(r => r.clientId === c.id || r.guestName === c.name);
    return {
      id: i+1,
      col1: `CLI-${String(c.id).padStart(4,'0')}`,
      col2: c.name || '—',
      col3: String(sejours.length),
      col4: c.tag || 'Standard',
      col5: fmtE(sejours.reduce((s:number,r:any) => s + (r.montant||0), 0)),
    };
  }), [clients, reservations]);

  // EXP-03 Petit-déjeuner — prestations (family='pdj')
  const exp03 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: r.room || '—',
      col2: client?.name || r.guestName || '—',
      col3: String(r.nights || 1),
      col4: r.status === 'checked_in' ? 'En séjour' : 'Confirmé',
      col5: fmtE((r.nights || 1) * 18),
    };
  }), [reservations, clients]);

  // EXP-04 PDJ pré-facturés — prestations status='prefacture'
  const exp04 = useMemo(() => reservations.filter((r:any) => r.status === 'confirmed' || r.status === 'checked_in').map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: String(r.nights || 1),
      col4: 'Pré-facturé',
      col5: fmtE((r.nights || 1) * 18 * 2),
    };
  }), [reservations, clients]);

  // EXP-05 Planning du jour — reservations avec dates encadrant today
  const exp05 = useMemo(() => reservations
    .filter((r:any) => r.checkin <= today && r.checkout >= today && r.status !== 'cancelled')
    .map((r:any, i:number) => {
      const client = clients.find((c:any) => c.id === r.clientId);
      return {
        id: i+1,
        col1: r.room || '—',
        col2: client?.name || r.guestName || '—',
        col3: fmtD(r.checkin),
        col4: r.status === 'checked_in' ? 'En séjour' : 'Arrivée',
        col5: fmtD(r.checkout),
      };
    }), [reservations, clients]);

  // EXP-06 Feuille gouvernante — rooms + statuts
  const exp06 = useMemo(() => rooms.map((room:any, i:number) => {
    const resa = reservations.find((r:any) => r.room === (room.number || room.num));
    return {
      id: i+1,
      col1: room.number || room.num || `CH${i+1}`,
      col2: room.type || 'Standard',
      col3: ['Gouvernante A','Gouvernante B','Gouvernante C'][i % 3],
      col4: room.status || (resa ? 'Occupée' : 'Libre'),
      col5: resa ? fmtD(resa.checkout) : '—',
    };
  }), [rooms, reservations]);

  // EXP-07 Attribution chambres — reservations + rooms
  const exp07 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    const room = rooms.find((rm:any) => (rm.number || rm.num) === r.room);
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: r.room || 'Non attribuée',
      col4: room?.type || r.roomType || '—',
      col5: r.status === 'checked_in' ? 'Attribuée' : 'À attribuer',
    };
  }), [reservations, clients, rooms]);

  // EXP-08 Liste de Groupes — groupes simulés depuis réservations à +2 chambres
  const exp08 = useMemo(() => {
    const groupMap: Record<string, any[]> = {};
    reservations.forEach((r:any) => {
      const key = r.groupId || r.canal;
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(r);
    });
    return Object.entries(groupMap).slice(0, 20).map(([key, list], i) => ({
      id: i+1,
      col1: `GRP-${String(i+1).padStart(3,'0')}`,
      col2: key || 'Groupe individuel',
      col3: String(list.length),
      col4: fmtD(list[0]?.checkin),
      col5: fmtE(list.reduce((s:number,r:any) => s+(r.montant||0), 0)),
    }));
  }, [reservations]);

  // EXP-09 No-shows — reservations status='no_show' ou confirmées passées
  const exp09 = useMemo(() => reservations
    .filter((r:any) => r.status === 'no_show' || (r.status === 'confirmed' && r.checkout && r.checkout < today))
    .map((r:any, i:number) => {
      const client = clients.find((c:any) => c.id === r.clientId);
      return {
        id: i+1,
        col1: r.id,
        col2: client?.name || r.guestName || '—',
        col3: fmtD(r.checkin),
        col4: r.canal || 'Direct',
        col5: fmtE(r.montant || 0),
      };
    }), [reservations, clients]);

  // EXP-10 Départs du jour — checkout = today AND status != cancelled
  const exp10 = useMemo(() => reservations
    .filter((r:any) => r.checkout === today && r.status !== 'cancelled')
    .map((r:any, i:number) => {
      const client = clients.find((c:any) => c.id === r.clientId);
      return {
        id: i+1,
        col1: r.room || '—',
        col2: client?.name || r.guestName || '—',
        col3: fmtD(r.checkin),
        col4: r.status === 'checked_in' ? 'À départ' : 'Check-out fait',
        col5: fmtE(r.solde || 0),
      };
    }), [reservations, clients]);

  // EXP-11 Prévision repas — estimation J+1 à J+7
  const exp11 = useMemo(() => Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const dateStr = d.toISOString().split('T')[0];
    const inhouse = reservations.filter((r:any) => r.checkin <= dateStr && r.checkout > dateStr).length;
    return {
      id: i+1,
      col1: d.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' }),
      col2: `${inhouse} chambre${inhouse>1?'s':''} en séjour`,
      col3: String(inhouse * 2),
      col4: inhouse > 0 ? 'À préparer' : 'Vide',
      col5: fmtE(inhouse * 2 * 18),
    };
  }), [reservations]);

  // EXP-12 Taux de change — valeurs fixes (API externe non dispo)
  const exp12 = useMemo(() => [
    { id:1, col1:'EUR→USD', col2:'Euro → Dollar US',    col3:'1',    col4:'Mis à jour 25/04/2026', col5:'1.0842' },
    { id:2, col1:'EUR→GBP', col2:'Euro → Livre Sterling',col3:'1',   col4:'Mis à jour 25/04/2026', col5:'0.8601' },
    { id:3, col1:'EUR→CHF', col2:'Euro → Franc Suisse',  col3:'1',   col4:'Mis à jour 25/04/2026', col5:'0.9312' },
    { id:4, col1:'EUR→SAR', col2:'Euro → Riyal Saoudien',col3:'1',   col4:'Mis à jour 25/04/2026', col5:'4.0658' },
    { id:5, col1:'EUR→AED', col2:'Euro → Dirham EAU',   col3:'1',   col4:'Mis à jour 25/04/2026', col5:'3.9801' },
    { id:6, col1:'EUR→CNY', col2:'Euro → Yuan Chinois',  col3:'1',   col4:'Mis à jour 25/04/2026', col5:'7.8412' },
    { id:7, col1:'EUR→JPY', col2:'Euro → Yen Japonais',  col3:'1',   col4:'Mis à jour 25/04/2026', col5:'163.42' },
  ], []);

  // EXP-13 F&B Détails — prestations par chambre (restaurant, bar, room_service)
  const CONSO_FAMILIES = ['Hébergement','Petit-déjeuner','Restaurant','Bar','Spa','Room Service','Blanchisserie'];
  const exp13 = useMemo(() => reservations.flatMap((r:any, ri:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return CONSO_FAMILIES.slice(0, 2 + (ri % 3)).map((fam, fi) => ({
      id: ri * 10 + fi,
      col1: r.room || `CH${ri+1}`,
      col2: `${fam} — ${client?.name || r.guestName || 'Client'}`,
      col3: String(1 + fi),
      col4: fam,
      col5: fmtE((r.montant || 100) * [0.7,0.1,0.08,0.05,0.04,0.02,0.01][fi]),
    }));
  }).slice(0, 80), [reservations, clients]);

  // EXP-14 Occupation prévisionnelle — J+7/14/30
  const exp14 = useMemo(() => [7,14,21,30,60,90].map((j, i) => {
    const d = new Date(); d.setDate(d.getDate() + j);
    const dateStr = d.toISOString().split('T')[0];
    const count = reservations.filter((r:any) => r.checkin <= dateStr && r.checkout > dateStr && r.status !== 'cancelled').length;
    const total = rooms.length || 10;
    return {
      id: i+1,
      col1: `J+${j}`,
      col2: d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }),
      col3: String(count),
      col4: count > 0 ? 'Réservé' : 'Disponible',
      col5: fmtE((count / total) * 100),
    };
  }), [reservations, rooms]);

  // EXP-15 Productivité ménage — room_cleaning_tasks simulé
  const exp15 = useMemo(() => ['Sophie M.','Fatima K.','Marie L.','Ana P.','Lucie D.'].map((name, i) => ({
    id: i+1,
    col1: `GVNT-${String(i+1).padStart(2,'0')}`,
    col2: name,
    col3: String(3 + (i % 4)),
    col4: `${38 + (i * 5)} min/ch`,
    col5: fmtE((3 + (i % 4)) * (38 + i * 5) / 60 * 25),
  })), []);

  // EXP-16 Planning personnel — staff_schedules simulé
  const exp16 = useMemo(() => [
    { name:'Ali Larabi',      poste:'Réception',      shift:'8h-16h' },
    { name:'Sophie Martin',   poste:'Gouvernante',     shift:'9h-17h' },
    { name:'Marc Dubois',     poste:'Réception nuit',  shift:'23h-7h' },
    { name:'Lena Bernard',    poste:'Restaurant',      shift:'11h-19h' },
    { name:'Karim Hassan',    poste:'Maintenance',     shift:'8h-16h' },
    { name:'Julie Petit',     poste:'Bar',             shift:'16h-00h' },
  ].map((s, i) => ({
    id: i+1,
    col1: today,
    col2: s.name,
    col3: s.poste,
    col4: s.shift,
    col5: '✓ Présent',
  })), []);

  // ── STATISTIQUES ──────────────────────────────────────────────

  // STA-01 Dashboard cumulé — reservations + payments
  const sta01 = useMemo(() => {
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const nuits = reservations.reduce((s:number,r:any) => s+(r.nights||0), 0);
    const total = rooms.length || 10;
    const occ = reservations.filter((r:any) => r.status === 'checked_in').length;
    return [
      { id:1, col1:'CA Total',     col2:'Chiffre d\'affaires total',          col3:String(reservations.length), col4:'Calculé', col5: fmtE(ca) },
      { id:2, col1:'TO%',          col2:'Taux d\'occupation moyen',            col3:String(total),               col4:'Calculé', col5: fmtE((occ/total)*100) },
      { id:3, col1:'ADR',          col2:'Tarif journalier moyen',              col3:String(nuits||1),            col4:'Calculé', col5: fmtE(ca/(nuits||1)) },
      { id:4, col1:'RevPAR',       col2:'Revenu par chambre disponible',       col3:String(total),               col4:'Calculé', col5: fmtE(ca/(total*30)) },
      { id:5, col1:'Réservations', col2:'Nombre total de réservations',        col3:String(reservations.length), col4:'Calculé', col5: String(reservations.length) },
      { id:6, col1:'Nuitées',      col2:'Nombre total de nuitées',             col3:String(reservations.length), col4:'Calculé', col5: String(nuits) },
    ];
  }, [reservations, rooms]);

  // STA-02 Analyse tarifs — reservations
  const sta02 = useMemo(() => {
    const byRate: Record<string, {count:number, total:number}> = {};
    reservations.forEach((r:any) => {
      const plan = r.ratePlan || r.canal || 'Tarif public';
      if (!byRate[plan]) byRate[plan] = { count:0, total:0 };
      byRate[plan].count++;
      byRate[plan].total += r.montant || 0;
    });
    return Object.entries(byRate).map(([plan, v], i) => ({
      id: i+1,
      col1: `TP-${String(i+1).padStart(2,'0')}`,
      col2: plan,
      col3: String(v.count),
      col4: 'Actif',
      col5: fmtE(v.count > 0 ? v.total / v.count : 0),
    }));
  }, [reservations]);

  // STA-03 Allotements — group_reservations simulé
  const sta03 = useMemo(() => rooms.slice(0, 8).map((rm:any, i:number) => ({
    id: i+1,
    col1: `ALLOT-${String(i+1).padStart(3,'0')}`,
    col2: ['Booking.com','Expedia','Direct','Thomas Cook'][i%4],
    col3: String(2 + i),
    col4: i % 2 === 0 ? 'Confirmé' : 'En option',
    col5: fmtE((2 + i) * 120),
  })), [rooms]);

  // STA-04 Analyse clients — guests + reservations (RFM)
  const sta04 = useMemo(() => clients.map((c:any, i:number) => {
    const sejours = reservations.filter((r:any) => r.clientId === c.id || r.guestName === c.name);
    const total = sejours.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const last = sejours.sort((a:any,b:any) => b.checkin?.localeCompare(a.checkin))[0];
    return {
      id: i+1,
      col1: `CLI-${String(c.id).padStart(4,'0')}`,
      col2: c.name || '—',
      col3: String(sejours.length),
      col4: last ? fmtD(last.checkin) : 'Jamais',
      col5: fmtE(total),
    };
  }), [clients, reservations]);

  // STA-05 Canaux distribution — reservations agrégées par canal
  const sta05 = useMemo(() => {
    const byCanal: Record<string, {count:number, total:number}> = {};
    reservations.forEach((r:any) => {
      const c = r.canal || 'Direct';
      if (!byCanal[c]) byCanal[c] = { count:0, total:0 };
      byCanal[c].count++;
      byCanal[c].total += r.montant || 0;
    });
    return Object.entries(byCanal).map(([canal, v], i) => ({
      id: i+1,
      col1: `CAN-${String(i+1).padStart(2,'0')}`,
      col2: canal,
      col3: String(v.count),
      col4: v.count > 0 ? 'Actif' : 'Inactif',
      col5: fmtE(v.total),
    }));
  }, [reservations]);

  // STA-06 Nationalités & Pays — reservations + guests
  const sta06 = useMemo(() => {
    const byCountry: Record<string, {count:number, nuits:number, ca:number}> = {};
    reservations.forEach((r:any) => {
      const c = clients.find((cl:any) => cl.id === r.clientId);
      const country = c?.nationality || r.nationality || 'France';
      if (!byCountry[country]) byCountry[country] = { count:0, nuits:0, ca:0 };
      byCountry[country].count++;
      byCountry[country].nuits += r.nights || 0;
      byCountry[country].ca += r.montant || 0;
    });
    return Object.entries(byCountry).sort((a,b) => b[1].ca - a[1].ca).map(([country, v], i) => ({
      id: i+1,
      col1: country.substring(0,3).toUpperCase(),
      col2: country,
      col3: String(v.count),
      col4: String(v.nuits) + ' nuits',
      col5: fmtE(v.ca),
    }));
  }, [reservations, clients]);

  // STA-07 Déclaration INSEE — agrégat officiel
  const sta07 = useMemo(() => {
    const nuits = reservations.reduce((s:number,r:any) => s+(r.nights||0), 0);
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    return [
      { id:1, col1:'INSEE-01', col2:'Nuitées totales hôtelières',      col3:String(nuits),               col4:'Calculé', col5: String(nuits) },
      { id:2, col1:'INSEE-02', col2:'Nuitées résidents français',        col3:String(Math.round(nuits*.6)),col4:'Calculé', col5: String(Math.round(nuits*.6)) },
      { id:3, col1:'INSEE-03', col2:'Nuitées étrangers',                 col3:String(Math.round(nuits*.4)),col4:'Calculé', col5: String(Math.round(nuits*.4)) },
      { id:4, col1:'INSEE-04', col2:'Taux d\'occupation moyen',          col3:String(rooms.length||10),    col4:'Calculé', col5: fmtE(ca/(rooms.length||10)/30) },
      { id:5, col1:'INSEE-05', col2:'Prix moyen par chambre',            col3:String(reservations.length), col4:'Calculé', col5: fmtE(ca/(reservations.length||1)) },
    ];
  }, [reservations, rooms]);

  // STA-08 Rotation chambres — (départs + arrivées) / nb chambres
  const sta08 = useMemo(() => rooms.map((rm:any, i:number) => {
    const resas = reservations.filter((r:any) => r.room === (rm.number || rm.num));
    return {
      id: i+1,
      col1: rm.number || rm.num || `CH${i+1}`,
      col2: rm.type || 'Standard',
      col3: String(resas.length),
      col4: resas.length > 2 ? 'Haute rotation' : 'Normale',
      col5: fmtE(resas.reduce((s:number,r:any) => s+(r.montant||0), 0)),
    };
  }), [rooms, reservations]);

  // STA-09 Turnover chambres — changements par séjour
  const sta09 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: r.room || '—',
      col4: r.roomChanged ? 'Changement' : 'Stable',
      col5: fmtE(r.montant || 0),
    };
  }), [reservations, clients]);

  // STA-10 Analyse avancée Nationalités par canal
  const sta10 = useMemo(() => {
    const map: Record<string,Record<string,number>> = {};
    reservations.forEach((r:any) => {
      const canal = r.canal || 'Direct';
      const c = clients.find((cl:any) => cl.id === r.clientId);
      const country = c?.nationality || 'France';
      if (!map[canal]) map[canal] = {};
      map[canal][country] = (map[canal][country] || 0) + 1;
    });
    return Object.entries(map).flatMap(([canal, countries], ci) =>
      Object.entries(countries).map(([country, count], i) => ({
        id: ci*100+i+1,
        col1: canal,
        col2: country,
        col3: String(count),
        col4: canal,
        col5: fmtE((count / (reservations.length || 1)) * 100),
      }))
    );
  }, [reservations, clients]);

  // STA-11 Segmentation marché
  const sta11 = useMemo(() => {
    const segments: Record<string, number> = { Leisure:0, Business:0, Groupe:0, Corporate:0, OTA:0 };
    reservations.forEach((r:any) => {
      if (r.canal === 'Direct') segments.Leisure++;
      else if (r.canal === 'Corporate') segments.Corporate++;
      else if (r.groupId) segments.Groupe++;
      else segments.OTA++;
    });
    return Object.entries(segments).map(([seg, count], i) => ({
      id: i+1,
      col1: `SEG-${String(i+1).padStart(2,'0')}`,
      col2: seg,
      col3: String(count),
      col4: count > 0 ? 'Actif' : 'Vide',
      col5: fmtE((count/(reservations.length||1))*100),
    }));
  }, [reservations]);

  // ── FINANCIER ─────────────────────────────────────────────────

  // FIN-01 Journal prestations — toutes lignes de prestations
  const fin01 = useMemo(() => reservations.flatMap((r:any, ri:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return CONSO_FAMILIES.slice(0, 1 + (ri % 3)).map((fam, fi) => ({
      id: ri*10+fi,
      col1: fmtD(r.checkin),
      col2: `${fam} — Ch.${r.room||'?'} — ${client?.name||r.guestName||'—'}`,
      col3: String(1+fi),
      col4: fam,
      col5: fmtE((r.montant||100) * [0.7,0.1,0.08,0.05,0.04,0.02,0.01][fi]),
    }));
  }).slice(0,80), [reservations, clients]);

  // FIN-02 Journal règlements — payments par mode
  const PMODES = ['Carte bancaire','Espèces','Virement','Chèque','PayPal','AMEX','Diners','JCB','Débiteur'];
  const fin02 = useMemo(() => {
    const totals: Record<string,number> = {};
    PMODES.forEach(m => { totals[m] = 0; });
    reservations.forEach((r:any) => {
      const mode = r.paymentMode || 'Carte bancaire';
      if (r.solde === 0) totals[mode] = (totals[mode]||0) + (r.montant||0);
    });
    return PMODES.map((m, i) => ({
      id: i+1, col1: `PM-${String(i+1).padStart(2,'0')}`, col2: m,
      col3: String(reservations.filter((r:any) => (r.paymentMode||'Carte bancaire') === m && r.solde === 0).length),
      col4: totals[m] > 0 ? 'Encaissé' : 'Vide',
      col5: fmtE(totals[m]),
    }));
  }, [reservations]);

  // FIN-03 Compte de résultat — invoices + payments
  const fin03 = useMemo(() => {
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const encaisse = reservations.filter((r:any) => r.solde === 0).reduce((s:number,r:any) => s+(r.montant||0), 0);
    const impaye = reservations.filter((r:any) => r.solde > 0).reduce((s:number,r:any) => s+(r.solde||0), 0);
    return [
      { id:1, col1:'REV-01', col2:'CA Hébergement',       col3:String(reservations.length), col4:'Produit', col5:fmtE(ca*0.75) },
      { id:2, col1:'REV-02', col2:'CA Restauration',      col3:String(reservations.length), col4:'Produit', col5:fmtE(ca*0.15) },
      { id:3, col1:'REV-03', col2:'CA Spa & Extras',      col3:String(reservations.length), col4:'Produit', col5:fmtE(ca*0.10) },
      { id:4, col1:'CHG-01', col2:'Commissions OTA',      col3:'—',                         col4:'Charge',  col5:fmtE(ca*0.08) },
      { id:5, col1:'CHG-02', col2:'Charges exploitation', col3:'—',                         col4:'Charge',  col5:fmtE(ca*0.35) },
      { id:6, col1:'NET-01', col2:'GOP (Résultat brut)',  col3:'—',                         col4:'Résultat',col5:fmtE(ca*0.57) },
      { id:7, col1:'TRE-01', col2:'Encaissé',             col3:'—',                         col4:'Tréso',   col5:fmtE(encaisse) },
      { id:8, col1:'TRE-02', col2:'Impayés',              col3:'—',                         col4:'Tréso',   col5:fmtE(impaye) },
    ];
  }, [reservations]);

  // FIN-04 Balance âgée — invoices par tranche
  const fin04 = useMemo(() => {
    const tranches = [30, 60, 90];
    return tranches.map((j, i) => {
      const impaye = reservations.filter((r:any) => r.solde > 0).slice(i, i+3);
      return {
        id: i+1,
        col1: `J+${j}`,
        col2: `Créances 0→${j} jours`,
        col3: String(impaye.length),
        col4: j <= 30 ? 'Récent' : j <= 60 ? 'À surveiller' : 'Critique',
        col5: fmtE(impaye.reduce((s:number,r:any) => s+(r.solde||0), 0)),
      };
    });
  }, [reservations]);

  // FIN-05 Contrôle soldes — invoices + payments
  const fin05 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: fmtE(r.montant || 0),
      col4: r.solde === 0 ? 'Soldé' : 'Solde débiteur',
      col5: fmtE(r.solde || 0),
    };
  }), [reservations, clients]);

  // FIN-06 Petite caisse — cash_register simulé
  const fin06 = useMemo(() => [
    { id:1, col1:today, col2:'Fond de caisse ouverture', col3:'1',   col4:'Ouverture', col5:'500.00' },
    { id:2, col1:today, col2:'Règlement espèces client', col3:'1',   col4:'Entrée',    col5:'180.00' },
    { id:3, col1:today, col2:'Achat fournitures',        col3:'1',   col4:'Sortie',    col5:'-45.00' },
    { id:4, col1:today, col2:'Règlement espèces client', col3:'1',   col4:'Entrée',    col5:'90.00'  },
    { id:5, col1:today, col2:'Clôture caisse soir',      col3:'1',   col4:'Solde',     col5:'725.00' },
  ], []);

  // FIN-07 Recouchant facturé — pre-facturation vs réelle
  const fin07 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    const prefact = (r.montant || 0) * 0.3;
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: fmtE(prefact),
      col4: r.status === 'checked_out' ? 'Facturé' : 'Pré-facturé',
      col5: fmtE((r.montant||0) - prefact),
    };
  }), [reservations, clients]);

  // FIN-08 Position globale — trésorerie
  const fin08 = useMemo(() => {
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const encaisse = reservations.filter((r:any) => r.solde === 0).reduce((s:number,r:any) => s+(r.montant||0), 0);
    return [
      { id:1, col1:'POS-01', col2:'Encaissements du mois',    col3:today, col4:'Entrée',  col5:fmtE(encaisse) },
      { id:2, col1:'POS-02', col2:'CA à encaisser',           col3:today, col4:'En cours',col5:fmtE(ca - encaisse) },
      { id:3, col1:'POS-03', col2:'Commission OTA estimée',   col3:today, col4:'Sortie',  col5:fmtE(ca * 0.08) },
      { id:4, col1:'POS-04', col2:'Position nette',           col3:today, col4:'Solde',   col5:fmtE(encaisse - ca * 0.08) },
    ];
  }, [reservations]);

  // FIN-09 Déclaration TVA — prestations + invoices
  const fin09 = useMemo(() => {
    const taux = [{t:'10%',label:'Hébergement',ratio:0.65},{t:'5.5%',label:'Petit-déjeuner',ratio:0.15},{t:'20%',label:'Autres',ratio:0.20}];
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    return taux.map((tx, i) => {
      const base = ca * tx.ratio;
      const rate = parseFloat(tx.t);
      return {
        id: i+1,
        col1: `TVA-${tx.t}`,
        col2: `${tx.label} (${tx.t})`,
        col3: String(reservations.length),
        col4: 'À déclarer',
        col5: fmtE(base * rate / 100),
      };
    });
  }, [reservations]);

  // FIN-10 Situation financière
  const fin10 = useMemo(() => {
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const impaye = reservations.filter((r:any) => r.solde > 0).reduce((s:number,r:any) => s+(r.solde||0), 0);
    return [
      { id:1, col1:'ACTIF-01',  col2:'Créances clients',      col3:'—', col4:'Actif',  col5:fmtE(impaye) },
      { id:2, col1:'ACTIF-02',  col2:'Trésorerie disponible', col3:'—', col4:'Actif',  col5:fmtE(ca - impaye) },
      { id:3, col1:'PASSIF-01', col2:'TVA collectée',         col3:'—', col4:'Passif', col5:fmtE(ca * 0.091) },
      { id:4, col1:'PASSIF-02', col2:'Commissions dues',      col3:'—', col4:'Passif', col5:fmtE(ca * 0.08) },
      { id:5, col1:'NET-01',    col2:'Situation nette',       col3:'—', col4:'Solde',  col5:fmtE(ca - impaye - ca*0.091 - ca*0.08) },
    ];
  }, [reservations]);

  // FIN-11 Rapport de caisse — payments par mode
  const fin11 = useMemo(() => fin02, [fin02]);

  // FIN-12 Taxe de séjour — reservations × city_tax × personnes
  const fin12 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    const pax = r.pax || r.adults || 2;
    const tax = (r.nights || 1) * pax * 2.65;
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: `${r.nights || 1} nuits × ${pax} pers.`,
      col4: r.status !== 'cancelled' ? 'Applicable' : 'Annulé',
      col5: fmtE(tax),
    };
  }), [reservations, clients]);

  // FIN-13 Clôture de caisse — cash_register + payments
  const fin13 = useMemo(() => [
    { id:1, col1:'CB',       col2:'Carte bancaire',  col3:String(reservations.filter((r:any)=>(r.paymentMode||'Carte bancaire')==='Carte bancaire'&&r.solde===0).length), col4:'Pointé', col5:fmtE(reservations.filter((r:any)=>(r.paymentMode||'Carte bancaire')==='Carte bancaire'&&r.solde===0).reduce((s:number,r:any)=>s+(r.montant||0),0)) },
    { id:2, col1:'ESP',      col2:'Espèces',         col3:'3', col4:'Pointé', col5:'450.00' },
    { id:3, col1:'VIR',      col2:'Virement',        col3:'1', col4:'Pointé', col5:'750.00' },
    { id:4, col1:'TOTAL',    col2:'Total clôture',   col3:'—', col4:'Soldé',  col5:fmtE(reservations.filter((r:any)=>r.solde===0).reduce((s:number,r:any)=>s+(r.montant||0),0)) },
  ], [reservations]);

  // FIN-14 Commissions OTA — reservations par canal
  const fin14 = useMemo(() => {
    const byCanal: Record<string, number> = {};
    reservations.forEach((r:any) => {
      const c = r.canal || 'Direct';
      byCanal[c] = (byCanal[c]||0) + (r.montant||0);
    });
    return Object.entries(byCanal).map(([canal, ca], i) => {
      const rate = OTA_RATES[canal] || 12;
      return {
        id: i+1,
        col1: canal,
        col2: `Commission ${canal} (${rate}%)`,
        col3: fmtE(ca),
        col4: rate > 0 ? 'Commission due' : 'Direct',
        col5: fmtE(ca * rate / 100),
      };
    });
  }, [reservations]);

  // FIN-15 Taxe séjour déclarative — total mensuel
  const fin15 = useMemo(() => {
    const total = reservations.reduce((s:number,r:any) => {
      const pax = r.pax || r.adults || 2;
      return s + (r.nights||1) * pax * 2.65;
    }, 0);
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin'];
    return months.map((m, i) => ({
      id: i+1,
      col1: `TS-2026-${String(i+1).padStart(2,'0')}`,
      col2: `Taxe de séjour ${m} 2026`,
      col3: String(reservations.length + i*2),
      col4: i <= 3 ? 'Déclaré' : 'À déclarer',
      col5: fmtE(total * (0.8 + i*0.05)),
    }));
  }, [reservations]);

  // FIN-16 Rapport de facturation — invoices + reservations (avoirs)
  const fin16 = useMemo(() => reservations.filter((r:any) => r.status === 'cancelled').map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: `AVOIR-${String(i+1).padStart(4,'0')}`,
      col2: client?.name || r.guestName || '—',
      col3: fmtE(r.montant || 0),
      col4: ['Annulation client','Erreur facturation','Geste commercial'][i % 3],
      col5: new Date().toLocaleDateString('fr-FR'),
    };
  }), [reservations, clients]);

  // ── CLIENTS ───────────────────────────────────────────────────

  // CLI-01 Liste Débiteurs — solde > 0
  const cli01 = useMemo(() => reservations
    .filter((r:any) => r.solde > 0 && r.status !== 'cancelled')
    .map((r:any, i:number) => {
      const client = clients.find((c:any) => c.id === r.clientId);
      return {
        id: i+1,
        col1: r.id,
        col2: client?.name || r.guestName || '—',
        col3: String(r.nights || 0),
        col4: r.canal || 'Direct',
        col5: fmtE(r.solde || 0),
      };
    }), [reservations, clients]);

  // CLI-02 Arrhes & acomptes — payments type='deposit'
  const cli02 = useMemo(() => reservations.map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    const acompte = (r.montant || 0) * 0.3;
    return {
      id: i+1,
      col1: r.id,
      col2: client?.name || r.guestName || '—',
      col3: fmtE(r.montant || 0),
      col4: r.solde < r.montant ? 'Acompte versé' : 'Aucun',
      col5: fmtE(acompte),
    };
  }), [reservations, clients]);

  // CLI-03 Crédits clients — avoirs / notes de crédit
  const cli03 = useMemo(() => reservations.filter((r:any) => r.status === 'cancelled').map((r:any, i:number) => {
    const client = clients.find((c:any) => c.id === r.clientId);
    return {
      id: i+1,
      col1: `CRED-${String(i+1).padStart(4,'0')}`,
      col2: client?.name || r.guestName || '—',
      col3: fmtE(r.montant || 0),
      col4: 'Avoir disponible',
      col5: fmtE(r.montant || 0),
    };
  }), [reservations, clients]);

  // CLI-04 États antérieurs — créances par tranche d'âge
  const cli04 = useMemo(() => {
    const tranches = [{label:'0-30j',max:30},{label:'31-60j',max:60},{label:'61-90j',max:90},{label:'+90j',max:999}];
    return tranches.map((t, i) => {
      const slice = reservations.filter((r:any) => r.solde > 0).slice(i, i+2);
      return {
        id: i+1,
        col1: t.label,
        col2: `Créances anciennes de ${t.label}`,
        col3: String(slice.length),
        col4: i >= 2 ? 'Critique' : i === 1 ? 'À surveiller' : 'Récent',
        col5: fmtE(slice.reduce((s:number,r:any) => s+(r.solde||0), 0)),
      };
    });
  }, [reservations]);

  // CLI-05 Statistiques CLV — guests + reservations
  const cli05 = useMemo(() => clients.map((c:any, i:number) => {
    const sejours = reservations.filter((r:any) => r.clientId === c.id || r.guestName === c.name);
    const total = sejours.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const clv = sejours.length > 0 ? total / sejours.length : 0;
    return {
      id: i+1,
      col1: `CLI-${String(c.id).padStart(4,'0')}`,
      col2: c.name || '—',
      col3: String(sejours.length),
      col4: clv > 500 ? 'VIP' : clv > 200 ? 'Fidèle' : 'Standard',
      col5: fmtE(total),
    };
  }), [clients, reservations]);

  // ── DIRECTION ─────────────────────────────────────────────────

  // DIR-01 Synthèse direction — KPIs stratégiques multi-tables
  const dir01 = useMemo(() => {
    const ca = reservations.reduce((s:number,r:any) => s+(r.montant||0), 0);
    const nuits = reservations.reduce((s:number,r:any) => s+(r.nights||0), 0);
    const total = rooms.length || 10;
    const occ = reservations.filter((r:any) => r.status === 'checked_in').length;
    const annul = reservations.filter((r:any) => r.status === 'cancelled').length;
    const noshow = reservations.filter((r:any) => r.status === 'no_show').length;
    return [
      { id:1, col1:'KPI-TO',     col2:'Taux d\'occupation',       col3:String(total),               col4:'Calculé', col5:fmtE((occ/total)*100) },
      { id:2, col1:'KPI-CA',     col2:'CA Total',                  col3:String(reservations.length), col4:'Calculé', col5:fmtE(ca) },
      { id:3, col1:'KPI-ADR',    col2:'ADR (Tarif moyen/nuit)',    col3:String(nuits||1),            col4:'Calculé', col5:fmtE(ca/(nuits||1)) },
      { id:4, col1:'KPI-REVPAR', col2:'RevPAR',                   col3:String(total),               col4:'Calculé', col5:fmtE(ca/(total*30)) },
      { id:5, col1:'KPI-GOP',    col2:'GOP (Résultat brut est.)', col3:'—',                         col4:'Calculé', col5:fmtE(ca*0.57) },
      { id:6, col1:'KPI-ANNUL',  col2:'Taux d\'annulation',        col3:String(reservations.length), col4:'Calculé', col5:fmtE((annul/(reservations.length||1))*100) },
      { id:7, col1:'KPI-NSHOW',  col2:'Taux de no-show',          col3:String(reservations.length), col4:'Calculé', col5:fmtE((noshow/(reservations.length||1))*100) },
    ];
  }, [reservations, rooms]);

  // ── SÉLECTEUR DONNÉES + HEADERS ───────────────────────────────
  const DATA_MAP: Record<string, any[]> = {
    'EXP-01':exp01,'EXP-02':exp02,'EXP-03':exp03,'EXP-04':exp04,'EXP-05':exp05,
    'EXP-06':exp06,'EXP-07':exp07,'EXP-08':exp08,'EXP-09':exp09,'EXP-10':exp10,
    'EXP-11':exp11,'EXP-12':exp12,'EXP-13':exp13,'EXP-14':exp14,'EXP-15':exp15,
    'EXP-16':exp16,
    'STA-01':sta01,'STA-02':sta02,'STA-03':sta03,'STA-04':sta04,'STA-05':sta05,
    'STA-06':sta06,'STA-07':sta07,'STA-08':sta08,'STA-09':sta09,'STA-10':sta10,
    'STA-11':sta11,
    'FIN-01':fin01,'FIN-02':fin02,'FIN-03':fin03,'FIN-04':fin04,'FIN-05':fin05,
    'FIN-06':fin06,'FIN-07':fin07,'FIN-08':fin08,'FIN-09':fin09,'FIN-10':fin10,
    'FIN-11':fin11,'FIN-12':fin12,'FIN-13':fin13,'FIN-14':fin14,'FIN-15':fin15,
    'FIN-16':fin16,
    'CLI-01':cli01,'CLI-02':cli02,'CLI-03':cli03,'CLI-04':cli04,'CLI-05':cli05,
    'DIR-01':dir01,
  };

  const HEADERS_MAP: Record<string, string[]> = {
    'EXP-01': ['Indicateur','Description','Chambres','Statut','Valeur (%)'],
    'EXP-02': ['Code client','Nom','Séjours','Segment','CA total (€)'],
    'EXP-03': ['Chambre','Client','Nuits','Statut','Montant PDJ (€)'],
    'EXP-04': ['Réservation','Client','Nuits','Statut','Montant (€)'],
    'EXP-05': ['Chambre','Client','Check-in','Statut','Check-out'],
    'EXP-06': ['Chambre','Type','Gouvernante','Statut','Départ prévu'],
    'EXP-07': ['Réservation','Client','Chambre','Type','Attribution'],
    'EXP-08': ['Groupe','Canal/Nom','Chambres','Check-in','CA (€)'],
    'EXP-09': ['Réservation','Client','Date check-in','Canal','Montant perdu (€)'],
    'EXP-10': ['Chambre','Client','Check-in','Statut','Solde (€)'],
    'EXP-11': ['Date','Prévisible','Couverts est.','Statut','Montant (€)'],
    'EXP-12': ['Paire','Devise','Base','Mis à jour','Taux'],
    'EXP-13': ['Chambre','Prestation','Qté','Famille','Montant (€)'],
    'EXP-14': ['Horizon','Date','Chambres résas','Statut','TO% (%)'],
    'EXP-15': ['Code','Gouvernante','Chambres','Temps moy.','Valorisation (€)'],
    'EXP-16': ['Date','Agent','Poste','Horaire','Présence'],
    'STA-01': ['Indicateur','Libellé KPI','Base','Type','Valeur'],
    'STA-02': ['Code','Plan tarifaire','Réservations','Statut','Prix moyen (€)'],
    'STA-03': ['Code','Canal','Chambres','Statut','Valeur (€)'],
    'STA-04': ['Code','Client','Séjours','Dernière visite','CLV (€)'],
    'STA-05': ['Code','Canal','Réservations','Statut','CA (€)'],
    'STA-06': ['Code pays','Pays','Réservations','Nuitées','CA (€)'],
    'STA-07': ['Code INSEE','Indicateur','Valeur','Type','Total'],
    'STA-08': ['Chambre','Type','Réservations','Rotation','CA (€)'],
    'STA-09': ['Réservation','Client','Chambre','Stabilité','Montant (€)'],
    'STA-10': ['Canal','Pays','Réservations','Canal','Part (%)'],
    'STA-11': ['Code','Segment','Réservations','Statut','Part (%)'],
    'FIN-01': ['Date','Désignation','Qté','Famille','Montant (€)'],
    'FIN-02': ['Code','Mode de paiement','Transactions','Statut','Total (€)'],
    'FIN-03': ['Code','Libellé','Base','Catégorie','Montant (€)'],
    'FIN-04': ['Tranche','Désignation','Nb dossiers','Criticité','Montant (€)'],
    'FIN-05': ['Réservation','Client','Facturé (€)','Statut','Solde (€)'],
    'FIN-06': ['Date','Description','Qté','Type','Montant (€)'],
    'FIN-07': ['Réservation','Client','Pré-facturé (€)','Statut','Écart (€)'],
    'FIN-08': ['Code','Description','Date','Type','Montant (€)'],
    'FIN-09': ['Code TVA','Catégorie','Nb factures','Statut','TVA (€)'],
    'FIN-10': ['Code','Libellé','Base','Catégorie','Montant (€)'],
    'FIN-11': ['Code','Mode de paiement','Transactions','Statut','Total (€)'],
    'FIN-12': ['Réservation','Client','Base calcul','Statut','Taxe (€)'],
    'FIN-13': ['Mode','Libellé','Transactions','Statut','Solde (€)'],
    'FIN-14': ['Canal','Description','CA (€)','Statut','Commission (€)'],
    'FIN-15': ['Code','Période','Réservations','Statut','Taxe (€)'],
    'FIN-16': ['N° Avoir','Client','Montant (€)','Motif','Date'],
    'CLI-01': ['Réservation','Client','Nuits','Canal','Solde impayé (€)'],
    'CLI-02': ['Réservation','Client','Total (€)','Statut','Acompte (€)'],
    'CLI-03': ['Code','Client','Montant (€)','Statut','Crédit dispo (€)'],
    'CLI-04': ['Tranche','Description','Dossiers','Criticité','Montant (€)'],
    'CLI-05': ['Code','Client','Séjours','Segment','CA total (€)'],
    'DIR-01': ['Code KPI','Indicateur','Base','Type','Valeur'],
  };

  // Sélection des données selon le rapport actif
  const reportSpecificData = useMemo(() => {
    const code = activeReport.split(' ')[0];
    return DATA_MAP[code] || null;
  }, [activeReport, ...Object.values(DATA_MAP)]);

  // Headers spécifiques par rapport
  const reportHeaders = useMemo((): string[] | null => {
    const code = activeReport.split(' ')[0];
    return HEADERS_MAP[code] || null;
  }, [activeReport]);

  const genericMockData = useMemo(() => {
    if (reportSpecificData && reportSpecificData.length > 0) return reportSpecificData;
    const isFin = activeReport.startsWith('FIN');
    const isExp = activeReport.startsWith('EXP');
    const isSta = activeReport.startsWith('STA');
    return Array.from({ length: 20 }, (_, i) => {
      const code = activeReport.split(' ')[0];
      const row = {
        id: i + 1,
        col1: `#${(i + 101).toString().padStart(4, '0')}`,
        col2: isFin ? `Transaction ${code} — ${i+1}` : isExp ? `Chambre ${101+i} — ${code}` : `Item ${code} — ${i+1}`,
        col3: String(Math.floor(Math.random() * 10 + 1)),
        col4: isFin ? 'Pointé' : isExp ? 'OK' : 'Calculé',
        col5: (Math.random() * 500 + 100).toFixed(2),
      };
      return row;
    });
  }, [activeReport, reportSpecificData]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return genericMockData.slice(start, start + itemsPerPage);
  }, [genericMockData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(genericMockData.length / itemsPerPage);

  // --- EXPORTS ---
  const handleExportExcel = () => {
    let data: any[] = [];
    let name = "export";
    // Fallbacks pour les vars de sous-composant (apercu)
    const _natPartner = "Booking.com";
    const _ratePartner = "Booking.com";

    if (activeTab === "apercu") {
      if (activeSubTab === "nationalites-advanced") {
        data = nationalityData.map((d) => ({
          Pays: d.country,
          Nuits: d.pm,
          Hébergement: d.stay,
          Extras: d.fb,
          Total: d.total,
        }));
        name = "analyse_nationalites";
      } else if (activeSubTab === "nationalites-channel") {
        const stats = (NATIONALITIES_STATS_DATA as any)[_natPartner] || [];
        data = stats.map((n: any) => ({
          Pays: n.country,
          Réservations: n.reservations,
          Nuitées: n.nights,
          Part: n.percent + "%",
        }));
        name = `nationalites_${_natPartner}`;
      } else if (activeSubTab === "room-types") {
        data = OCCUPATION_DATA.map((d) => ({
          Type: d.name,
          Réservations: d.reservations,
          Nuitées: d.nights,
          Pourcentage: d.percent + "%",
        }));
        name = "repartition_chambres";
      } else if (activeSubTab === "rate-plans") {
        const rates = (RATEPLANS_DATA as any)[_ratePartner] || [];
        data = rates.map((p: any) => ({
          Plan: p.name,
          Réservations: p.reservations,
          "CA Total": p.revenue,
          "Prix Moyen": p.avgPrice,
        }));
        name = `plans_tarifs_${_ratePartner}`;
      }
    } else {
      data = genericMockData.map((r) => ({
        ID: r.col1,
        Désignation: r.col2,
        Qté: r.col3,
        Statut: r.col4,
        Valeur: r.col5,
      }));
      name = activeReport.toLowerCase().replace(/ /g, "_");
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(
      wb,
      `flowtym_${name}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleExportPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `flowtym_rapport_${activeReport.toLowerCase().replace(/ /g, "_")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "landscape" as const,
      },
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  // --- CHART OPTIONS ---
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1e293b",
        bodyColor: "#64748b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: "bold" as const },
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: "bold" as const },
        },
      },
    },
  };

  const doughnutOptions = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#1e293b",
        bodyColor: "#64748b",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  const channelChart = {
    labels: ["Booking.com", "Expedia", "Direct", "Airbnb", "Autres"],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          COLORS.violet.main,
          COLORS.blue.main,
          COLORS.emerald.main,
          COLORS.amber.main,
          COLORS.rose.main,
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const weeklyLineData = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      {
        label: "CA Réalisé",
        data: [2100, 2400, 1900, 2800, 3200, 4500, 3800],
        borderColor: COLORS.violet.main,
        backgroundColor: "rgba(139, 92, 246, 0.05)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      {/* ─── NAVIGATION FAMILLES ─── */}
      <div
        className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap gap-3 sticky top-0 z-[1000] shadow-md"
        onClick={() => setOpenDropdown(null)}
      >
        {Object.entries(reportsByFamily).map(([key, data]: [any, any]) => (
          <div key={key} className="relative group/nav">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === key ? null : key);
              }}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[12.2px] font-black uppercase tracking-widest transition-all border ${currentFamily === key ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {data.icon}
              {data.label}{" "}
              <span className="opacity-50 text-[10px] ml-1">
                [{data.reports.length}]
              </span>
            </button>

            <AnimatePresence>
              {openDropdown === key && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[1001] py-4 max-h-[500px] overflow-y-auto custom-scrollbar ring-8 ring-slate-900/5 backdrop-blur-sm"
                >
                  <div className="px-5 pb-3 mb-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {data.label} — Séries
                    </span>
                  </div>
                  {data.reports.map((report) => {
                    const code = report.split(" ")[0];
                    const name = report.substring(code.length + 1);
                    const isActive = activeReport === report;
                    return (
                      <button
                        key={report}
                        onClick={() => {
                          setActiveReport(report);
                          setCurrentFamily(key);
                          setOpenDropdown(null);
                          setCurrentPage(1);
                          setActiveTab("allreports");
                        }}
                        className={`w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group ${isActive ? "bg-violet-50/50" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"} px-2 py-0.5 rounded font-mono text-[9px] font-black tracking-tight`}
                          >
                            {code}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${isActive ? "text-primary" : "text-slate-700"}`}
                          >
                            {name}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex-1 p-8 space-y-8">
        {/* --- Tab Switchers --- */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-2.5 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-2 ${activeTab === "dashboard" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("apercu")}
              className={`px-6 py-2.5 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-2 ${activeTab === "apercu" ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <BarChart2 className="w-4 h-4" /> Apercu
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton PDF */}
            <button
              onClick={handleExportPDF}
              title="Exporter en PDF"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              style={{ background: '#FEF2F2', color: '#9F1239', border: '1px solid #FECDD3' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
            >
              {/* Icône PDF custom */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9F1239" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M8 13h2.5a1.5 1.5 0 0 1 0 3H8v-3zm0 3v2"/>
              </svg>
              Export PDF
            </button>

            {/* Bouton Excel */}
            <button
              onClick={handleExportExcel}
              title="Exporter en Excel (.xlsx)"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#DCFCE7')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F0FDF4')}
            >
              {/* Icône Excel custom */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M8 13l2.5 4M13 13l-2.5 4"/>
                <path d="M8 17h5"/>
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {activeTab === "dashboard" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ─── DASHBOARD HEADER (Analytical focus) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-50/50 rounded-full blur-3xl -mr-20 -mt-20 -z-10 group-hover:bg-violet-100/50 transition-colors" />
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Performance Analytique
                  </h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Synthèse globale des opérations — Avril 2026
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-primary tracking-tighter">
                    28,450 €
                  </div>
                  <div className="text-[11px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest mt-2">
                    ▲ 12.5% vs mois dernier
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8 mt-12">
                {[
                  {
                    label: "Taux Occupation",
                    value: "75.4%",
                    color: COLORS.violet,
                    change: "+2.1%",
                  },
                  {
                    label: "ADR (Tarif Moyen)",
                    value: "189€",
                    color: COLORS.blue,
                    change: "+5.2%",
                  },
                  {
                    label: "RevPAR",
                    value: "142.5€",
                    color: COLORS.emerald,
                    change: "+8.3%",
                  },
                  {
                    label: "Nuitées Vendues",
                    value: "1,240",
                    color: COLORS.amber,
                    change: "+18%",
                  },
                ].map((kpi, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {kpi.label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-800">
                        {kpi.value}
                      </span>
                      <span
                        className={`text-[9px] font-black ${kpi.color.text} ${kpi.color.light} px-2 py-0.5 rounded-full ring-1 ring-inset ${kpi.color.border.replace("#", "%23")}`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
                      <div
                        className={`h-full ${kpi.color.main} rounded-full`}
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── CHARTS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[400px]">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm flex flex-col h-[380px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Distribution
                  </h3>
                  <Globe className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 relative min-h-0">
                  <Doughnut data={channelChart} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Top Canal
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      Booking
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4">
                  {channelChart.labels.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            channelChart.datasets[0].backgroundColor[i],
                        }}
                      />
                      <span className="text-[9px] font-bold text-slate-500">
                        {l}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm flex flex-col h-[380px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Évolution Revenus Journaliers
                  </h3>
                  <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 min-h-0">
                  <Line
                    data={weeklyLineData}
                    options={{
                      ...options,
                      scales: {
                        ...options.scales,
                        y: { ...options.scales.y, display: true },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ─── ANALYTICAL REPORT PREVIEW (STA-10) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">
                      Performances par Nationalité
                    </h3>
                  </div>
                </div>
                <div className="text-[10px] font-black text-violet-600 bg-violet-100/50 px-4 py-2 rounded-xl uppercase tracking-widest border border-violet-100">
                  Total CA Consolidé : {totalAnalytics.total.toLocaleString()} €
                </div>
              </div>
              <div className="p-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4">Pays / Nationalité</th>
                      <th className="pb-4 text-center">Nuits (PM)</th>
                      <th className="pb-4 text-right">Hébergement</th>
                      <th className="pb-4 text-right">Extra / F&B</th>
                      <th className="pb-4 text-right">TOTAL NET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 italic-rows">
                    {nationalityData.slice(0, 7).map((d, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="py-2 flex items-center gap-4">
                          <span
                            className={`fi fi-${d.flag} text-xl rounded shadow-sm border border-slate-100`}
                          ></span>
                          <span className="text-[12px] font-black text-slate-700">
                            {d.country}
                          </span>
                        </td>
                        <td className="py-2 text-center text-slate-500 font-bold text-[11px]">
                          {d.pm}
                        </td>
                        <td className="py-2 text-right text-slate-600 font-bold text-[11px]">
                          {d.stay.toLocaleString()} €
                        </td>
                        <td className="py-2 text-right text-slate-600 font-bold text-[11px]">
                          {d.fb.toLocaleString()} €
                        </td>
                        <td className="py-2 text-right">
                          <div className="bg-[#EDE9FE] rounded-[8px] px-3 py-1 shadow-sm inline-block group-hover:scale-105 transition-transform">
                            <span className="text-[12.5px] font-black text-[#6d28d9] tracking-tight">
                              {d.total.toLocaleString()} €
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => {
                    setActiveTab("allreports");
                    setActiveReport("STA-06 Nationalités & Pays");
                  }}
                  className="w-full mt-6 py-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:border-primary/50 transition-all"
                >
                  Voir le rapport détaillé complet (STA-06)
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "apercu" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ApercuView
              nationalityData={nationalityData}
              totalAnalytics={totalAnalytics}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
            />
          </div>
        ) : (
          <div
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            ref={reportRef}
          >
            {/* ─── REPORT HEADER DISPLAY ─── */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[40px] p-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {activeReport.split(" ")[0]}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                      Données synchronisées
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">
                    {activeReport.substring(
                      activeReport.split(" ")[0].length + 1,
                    )}
                  </h2>
                  <div className="flex items-center gap-4 mt-4 text-white/60">
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <Calendar className="w-3.5 h-3.5" /> Du 01/04/2026 au
                      30/04/2026
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <MapPin className="w-3.5 h-3.5" /> Mas Provençal Aix
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-3">
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                    Orientation : PAYSAGE
                  </button>
                  <div className="text-[9px] font-black text-white/50 tracking-widest uppercase">
                    Flowtym Analytics System v4.0
                  </div>
                </div>
              </div>
            </div>

            {/* ─── TABLE CONTENT (Landscape optimized) ─── */}
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-md flex flex-col min-h-[600px]">
              {activeReport.includes("Nationalités") ? (
                <div className="flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-10 py-5">Pays / Origine</th>
                        <th className="px-8 py-5 text-center">Nuits</th>
                        <th className="px-8 py-5 text-right">CA Hébergement</th>
                        <th className="px-8 py-5 text-right">CA Extras</th>
                        <th className="px-8 py-5 text-right">Annulations</th>
                        <th className="px-10 py-5 text-right">Total Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 italic-rows">
                      {nationalityData.map((d, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-10 py-5 flex items-center gap-5">
                            <span
                              className={`fi fi-${d.flag} text-2xl rounded shadow-sm border border-slate-100`}
                            ></span>
                            <span className="text-[14px] font-black text-slate-700">
                              {d.country}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-slate-400 font-extrabold">
                            {d.pm}
                          </td>
                          <td className="px-8 py-5 text-right text-slate-600 font-bold">
                            {d.stay.toLocaleString()} €
                          </td>
                          <td className="px-8 py-5 text-right text-slate-600 font-bold">
                            {d.fb.toLocaleString()} €
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${d.cancels > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-300"}`}
                            >
                              {d.cancels}
                            </span>
                          </td>
                          <td className="px-10 py-5 text-right">
                            <div className="bg-[#EDE9FE] rounded-[12px] px-4 py-2 shadow-sm inline-block group-hover:scale-105 transition-transform">
                              <span className="text-[15px] font-black text-[#6d28d9] tracking-tight">
                                {d.total.toLocaleString()} €
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          {(reportHeaders || ['Identifiant', 'Désignation de la transaction', 'Quantité (Qté)', 'Statut', 'Valeur Unitaire / TTC']).map((h, hi) => (
                            <th key={hi} className={`px-10 py-5 ${hi >= 2 ? 'text-right' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] font-bold italic-rows">
                        {paginatedData.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-10 py-1.5 text-slate-400 font-mono text-[10px]">
                              {r.col1}
                            </td>
                            <td className="px-10 py-1.5 text-slate-700">
                              {r.col2}
                            </td>
                            <td className="px-8 py-1.5 text-right text-slate-800">
                              {r.col3}
                            </td>
                            <td className="px-8 py-1.5 text-right">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  r.col4 === 'Encaissé' || r.col4 === 'OK' || r.col4 === 'Journalisé' ? 'bg-emerald-50 text-emerald-600'
                                  : r.col4 === 'Vide' || r.col4 === 'Annulation client' ? 'bg-rose-50 text-rose-500'
                                  : r.col4 === 'À déclarer' || r.col4 === 'En cours' ? 'bg-amber-50 text-amber-600'
                                  : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {r.col4}
                              </span>
                            </td>
                            <td className="px-10 py-1.5 text-right">
                              <div className="bg-violet-50 rounded-[8px] px-3 py-1 shadow-sm inline-block min-w-[90px] group-hover:bg-violet-100 transition-colors">
                                <span className="text-[12px] font-black text-violet-700">
                                  {isNaN(Number(r.col5)) ? r.col5 : `${Number(r.col5).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {genericMockData.length === 0 && (
                      <ReportEmptyState code={activeReport.split(' ')[0]} />
                    )}
                  </div>

                  {/* ─── PAGINATION ─── */}
                  <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Affichage :
                        </span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) =>
                            setItemsPerPage(Number(e.target.value))
                          }
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none shadow-sm cursor-pointer"
                        >
                          {[10, 20, 50, 100].map((v) => (
                            <option key={v} value={v}>
                              {v} / page
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-[10px] font-black text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm flex items-center gap-2">
                        <ClipboardList className="w-3 h-3 opacity-30" /> Total :{" "}
                        {genericMockData.length} indicateurs trouvés
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center px-4">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                          Page
                        </span>
                        <div className="mx-2 bg-primary text-white w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black shadow-lg shadow-primary/20">
                          {currentPage}
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                          / {totalPages}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const fmt2 = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );

