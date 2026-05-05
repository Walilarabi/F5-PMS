import React from 'react';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Topbar } from '@/src/components/layout/Topbar';
import { TodayView } from '@/src/pages/TodayView';
import { PlanningView } from '@/src/pages/PlanningView';
import { ReservationsView } from '@/src/pages/ReservationsView';
import { ClientsView } from '@/src/pages/ClientsView';
import { RevenueView } from '@/src/pages/RevenueView';
import { FinanceView } from '@/src/pages/FinanceView';
import { AnalysisView } from '@/src/pages/AnalysisView';
import { FlowboardView } from '@/src/pages/FlowboardView';
import { SettingsView } from '@/src/pages/SettingsView';
import { Tarifs } from '@/src/components/Tarifs';
import { AutoRules } from '@/src/components/AutoRules';
import { PageId } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useShortcuts, buildDefaultShortcuts, flattenShortcuts } from '@/src/hooks/useShortcuts';
import { ShortcutsHelpModal } from '@/src/components/modals/ShortcutsHelpModal';
import { useNotifications } from '@/src/components/modals/Notifications';

const PlaceholderPage = ({ name }: { name: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
       <span className="text-4xl">🏗️</span>
    </div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{name}</h1>
    <p className="text-gray-500 max-w-md">Cette page est actuellement en cours de modernisation. Elle conservera toutes ses fonctionnalités existantes avec un design rafraîchi.</p>
  </div>
);

const App = () => {
  const [activePage, setActivePage] = React.useState<PageId>('today');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead } = useNotifications();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Listen for toast events from anywhere in the app
  React.useEffect(() => {
    const handleToast = (e: CustomEvent) => {
      setToastMessage(e.detail.message || 'Notification');
      setToastType(e.detail.type || 'info');
      setShowToast(true);
    };
    window.addEventListener('app-toast', handleToast as EventListener);
    return () => window.removeEventListener('app-toast', handleToast as EventListener);
  }, []);

  // ── Raccourcis clavier globaux ──────────────────────────────────────────
  const shortcutMap = React.useMemo(() => buildDefaultShortcuts({
    // Navigation modules
    newReservation: () => {
      setActivePage('reservations');
      // Dispatch event for ReservationsView to pick up
      setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:new-reservation')), 150);
    },
    goToday: () => setActivePage('today'),
    showClients: () => setActivePage('clients'),
    generateReport: () => setActivePage('analysis'),
    financialReport: () => { setActivePage('analysis'); setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:tab', { detail: { tab: 'financial' } })), 150); },
    operationalReport: () => { setActivePage('analysis'); setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:tab', { detail: { tab: 'operational' } })), 150); },
    clientHistory: () => { setActivePage('clients'); setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:tab', { detail: { tab: 'history' } })), 150); },
    newClient: () => { setActivePage('clients'); setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:new-client')), 150); },
    searchClient: () => { setActivePage('clients'); setTimeout(() => window.dispatchEvent(new CustomEvent('flowtym:search-client')), 150); },

    // Planning navigation
    previousPeriod: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'prev' } })),
    nextPeriod: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'next' } })),
    openDatePicker: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'datepicker' } })),
    setView15: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'view15' } })),
    setViewWeek: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'viewWeek' } })),
    focusSearch: () => {
      // Try to focus the first search input on the page
      const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="echerch"], input[type="search"]');
      if (searchInput) searchInput.focus();
      else window.dispatchEvent(new CustomEvent('flowtym:focus-search'));
    },
    zoomIn: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'zoomIn' } })),
    zoomOut: () => window.dispatchEvent(new CustomEvent('flowtym:planning-nav', { detail: { action: 'zoomOut' } })),

    // Check-in / Check-out (dispatched to current view)
    checkIn: () => window.dispatchEvent(new CustomEvent('flowtym:checkin')),
    checkOut: () => window.dispatchEvent(new CustomEvent('flowtym:checkout')),

    // Facturation
    addPrestation: () => window.dispatchEvent(new CustomEvent('flowtym:add-prestation')),
    printInvoice: () => window.dispatchEvent(new CustomEvent('flowtym:print-invoice')),
    save: () => window.dispatchEvent(new CustomEvent('flowtym:save')),

    // Général
    closeModal: () => {
      setIsHelpOpen(false);
      window.dispatchEvent(new CustomEvent('flowtym:close-modal'));
    },
    showHelp: () => setIsHelpOpen(true),
    openConformite: () => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Module Conformité — Bientôt disponible' } })),
  }), []);

  const shortcutEntries = React.useMemo(() => flattenShortcuts(shortcutMap), [shortcutMap]);

  useShortcuts(shortcutMap);

  const renderPage = () => {
    switch (activePage) {
      case 'today': return <TodayView />;
      case 'flowboard': return <FlowboardView />;
      case 'planning': return <PlanningView />;
      case 'reservations': 
      case 'calendrier':
      case 'mouvements':
      case 'qr':
      case 'simulation':
      case 'groupes':
      case 'paiements':
      case 'relances':
      case 'anomalies':
        return <ReservationsView />;
      case 'clients': 
      case 'fiches':
      case 'fidelite':
        return <ClientsView />;
      case 'revenue': 
      case 'yield':
      case 'promotions':
        return <RevenueView />;
      case 'tarifs': return <Tarifs />;
      case 'auto_rules': return <AutoRules />;
      case 'analysis': 
      case 'performance':
      case 'forecast':
        return <AnalysisView />;
      case 'finance': 
      case 'facturation':
      case 'caisse':
      case 'impayes':
      case 'cloture':
      case 'proprietaires':
        return <FinanceView activeTab={activePage} />;
      case 'operations': return <PlaceholderPage name="Opérations" />;
      case 'settings': 
      case 'annulations':
      case 'supplements':
      case 'fermatures':
      case 'hotel':
      case 'taxe':
      case 'pms':
      case 'api':
        return <SettingsView activeTab={activePage} />;
      default: return <TodayView />;
    }
  };

  const getCategory = (page: PageId): string => {
    if (['today', 'flowboard', 'planning'].includes(page)) return 'today';
    if (['reservations', 'calendrier', 'mouvements', 'qr', 'simulation', 'groupes', 'paiements', 'relances', 'anomalies'].includes(page)) return 'reservations';
    if (['revenue', 'yield', 'promotions', 'tarifs', 'auto_rules'].includes(page)) return 'revenue';
    if (['finance', 'facturation', 'caisse', 'impayes', 'cloture', 'proprietaires'].includes(page)) return 'finance';
    if (['analysis', 'performance', 'forecast'].includes(page)) return 'analysis';
    if (['clients', 'fiches', 'fidelite'].includes(page)) return 'clients';
    if (['settings', 'annulations', 'supplements', 'hotel', 'taxe', 'pms', 'api'].includes(page)) return 'settings';
    return 'today';
  };

  const activeCategory = getCategory(activePage);

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 font-sans overflow-hidden">
      {/* Global Contextual Sidebar */}
      {/* Global Contextual Sidebar - Only shown for 'today' category since others use ModuleSidebar */}
      {activeCategory === 'today' && (
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar activePage={activePage} setActivePage={setActivePage} />
        
        <main className="flex-1 overflow-hidden relative">
           <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full w-full overflow-hidden flex flex-col"
              >
                 {renderPage()}
              </motion.div>
           </AnimatePresence>
        </main>

        {/* Global Footer / Quick Access */}
        <footer className="h-10 bg-white border-t border-[#E5E7EB] flex items-center justify-between px-6 shrink-0 z-50">
           <div className="flex items-center gap-4">
              <button 
                 onClick={() => setActivePage('planning')}
                 className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-[#8B5CF6] transition-colors uppercase tracking-widest"
              >
                 <span className="p-1 bg-gray-100 rounded">📅</span> Planning
              </button>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-gray-400">SYSTÈME OK</span>
              </div>
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="text-[9px] font-bold text-gray-400 tracking-tighter hover:text-indigo-500 transition-colors cursor-pointer bg-transparent border-none"
              >
                 Ctrl+Shift+H Aide • Esc Fermer
              </button>
           </div>
        </footer>
      </div>

      {/* Modale d'aide raccourcis (globale) */}
      <ShortcutsHelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        shortcuts={shortcutEntries} 
      />
    </div>
  );
};

export default App;
