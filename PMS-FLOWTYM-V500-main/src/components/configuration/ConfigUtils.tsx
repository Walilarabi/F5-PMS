import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ===== TYPES =====
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem { id: string; message: string; type: ToastType; }

// ===== TOAST HOOK =====
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, toast };
}

// ===== TOAST CONTAINER =====
export const ToastContainer: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => (
  <div className="fixed bottom-8 right-8 z-[9999] space-y-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div key={t.id}
          initial={{ opacity: 0, x: 60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.9 }}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-[13px] w-[300px] pointer-events-auto ${
            t.type === 'success' ? 'bg-emerald-500 text-white' :
            t.type === 'error'   ? 'bg-rose-500 text-white' :
            t.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
          }`}>
          <i className={`fa-solid text-lg ${
            t.type === 'success' ? 'fa-check-circle' :
            t.type === 'error'   ? 'fa-times-circle' :
            t.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
          }`} />
          <span>{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ===== MODAL =====
interface ModalProps {
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; onSave?: () => void;
  saveLabel?: string; size?: 'sm' | 'md' | 'lg';
}
export const ConfigModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onSave, saveLabel = 'Enregistrer', size = 'md' }) => {
  const w = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[700]" />
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
            <div className={`bg-white rounded-3xl shadow-2xl w-full ${w} pointer-events-auto max-h-[90vh] flex flex-col`}>
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                <h3 className="text-[15px] font-black text-slate-800">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                  <i className="fa-solid fa-times text-xs" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">{children}</div>
              {onSave && (
                <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                  <button onClick={onSave} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white bg-primary hover:bg-[#7b4be8] shadow-lg shadow-primary/20 transition-all">
                    <i className="fa-solid fa-save mr-1.5" />{saveLabel}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ===== FIELD WRAPPER =====
export const Fl: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ===== INPUT / SELECT CLASSES =====
export const IC = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
export const SC = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-primary bg-white";

// ===== SUPABASE MOCK (exported for use in main component) =====
export const supabase = (window as any).supabaseClient || {
  from: (_t: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: (d: any) => Promise.resolve({ data: d, error: null }),
    update: (d: any) => ({ eq: () => Promise.resolve({ data: d, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    upsert: (d: any) => Promise.resolve({ data: d, error: null }),
  }),
  channel: (_c: string) => ({ on: () => ({ subscribe: () => ({}) }) })
};
