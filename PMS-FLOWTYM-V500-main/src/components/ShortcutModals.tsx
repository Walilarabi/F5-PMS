import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, X, HelpCircle, Keyboard, Info } from 'lucide-react';

// ==================== DATE PICKER MODAL ====================
export const DatePickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
}> = ({ isOpen, onClose, onSelect, initialDate }) => {
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen && initialDate) {
      setDateStr(initialDate.toISOString().slice(0, 10));
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                 <Calendar className="w-5 h-5" />
              </div>
              Aller à une date
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Sélectionner le jour de début</label>
              <input 
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={() => { onSelect(new Date(dateStr)); onClose(); }}
                className="flex-1 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-primary hover:bg-[#7b4be8] shadow-lg shadow-primary/20 transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ==================== HELP SHORTCUTS MODAL ====================
export const HelpShortcutsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "Planning",
      items: [
        { key: "F2 / F3", action: "Période Précédente / Suivante" },
        { key: "F4", action: "Rechercher une date précise" },
        { key: "F5 / F6 / F7", action: "Vue Semaine / 15j / Mois" },
        { key: "T", action: "Retour à AUJOURD'HUI" },
        { key: "Ctrl + G", action: "Focus sur la Recherche" },
        { key: "Ctrl + / -", action: "Zoom Avant / Arrière" },
      ]
    },
    {
      title: "Opérations",
      items: [
        { key: "N", action: "Nouvelle Réservation" },
        { key: "E", action: "Modifier la sélection" },
        { key: "I / O", action: "Check-in / Check-out" },
        { key: "R", action: "Générer Rapport / Print" },
        { key: "A", action: "Carnet d'Adresses Clients" },
        { key: "F9", action: "Historique Client / Folio" },
        { key: "Del", action: "Annuler la Réservation" },
      ]
    },
    {
      title: "Général",
      items: [
        { key: "X + 1/2/3", action: "Switch Folio 1, 2 ou 3" },
        { key: "Ctrl + S", action: "Sauvegarder" },
        { key: "Ctrl + H", action: "Aide & Raccourcis" },
        { key: "Esc", action: "Fermer tout" },
        { key: "Ctrl + Alt + Q", action: "Déconnexion" },
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                  <Keyboard className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800">Raccourcis Clavier</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Optimisez votre productivité sur Flowtym</p>
               </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map(section => (
                  <div key={section.title} className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[3px] flex items-center gap-2 mb-4">
                      {section.title}
                      <div className="flex-1 h-[1px] bg-primary/10" />
                    </h4>
                    <div className="space-y-3">
                      {section.items.map(item => (
                        <div key={item.key} className="flex items-center justify-between group">
                          <span className="text-[12px] font-semibold text-slate-600 transition-colors group-hover:text-slate-900">{item.action}</span>
                          <kbd className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-black text-slate-400 shadow-sm min-w-[32px] text-center">
                             {item.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logiciel Flowtym PMS v4.2.0 • Session Sécurisée</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
