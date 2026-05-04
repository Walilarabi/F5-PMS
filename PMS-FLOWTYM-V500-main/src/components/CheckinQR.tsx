import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Smartphone,
  ChevronRight,
  ArrowRight,
  ScanLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface CheckinQRProps {
  reservations: any[];
  clients: any[];
}

export const CheckinQR: React.FC<CheckinQRProps> = ({ reservations, clients }) => {
  const [selectedResaId, setSelectedResaId] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const selectedResa = reservations.find(r => r.id === selectedResaId);
  const selectedClient = clients.find(c => c.id === selectedResa?.clientId);

  const handleGenerate = () => {
    if (!selectedResaId) return;
    setIsGenerated(true);
    setStatus('scanning');
    
    // Simulate a successful scan after 5 seconds
    setTimeout(() => {
      setStatus('success');
    }, 5000);
  };

  const reset = () => {
    setIsGenerated(false);
    setStatus('idle');
    setSelectedResaId('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -m-4 overflow-hidden bg-slate-50 items-center justify-center p-8">
      
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT: INFO & SELECTION */}
        <div className="space-y-8">
          <div>
            <div className="w-16 h-16 bg-primary/10 rounded-[24px] flex items-center justify-center mb-6">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight capitalize">
              Check-in Rapide <br />
              <span className="text-primary-light">par QR Code</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-4 leading-relaxed max-w-sm">
              Générez un code unique pour permettre à vos clients de valider leur check-in instantanément sur leur smartphone.
            </p>
          </div>

          <div className="space-y-4">
             <div className="p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sélectionner une réservation</label>
                <div className="relative">
                  <select 
                    value={selectedResaId}
                    onChange={(e) => setSelectedResaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">--- Choisir un dossier ---</option>
                    {reservations.filter(r => r.status === 'confirmed').map(r => (
                      <option key={r.id} value={r.id}>
                        {clients.find(c => c.id === r.clientId)?.name} · {r.id}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={!selectedResaId || isGenerated}
                  className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    !selectedResaId || isGenerated 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white shadow-xl hover:bg-slate-800'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${status === 'scanning' ? 'animate-spin' : ''}`} />
                  Générer le Check-in
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                   </div>
                   <span className="text-[9px] font-black text-slate-500 uppercase">Sécurisé</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                   </div>
                   <span className="text-[9px] font-black text-slate-500 uppercase">Sans contact</span>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT: QR RENDERING */}
        <div className="relative aspect-square">
          <div className="absolute inset-0 bg-primary/5 rounded-[60px] blur-3xl opacity-50" />
          
          <AnimatePresence mode="wait">
            {!isGenerated ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-full bg-white rounded-[60px] border-4 border-white shadow-2xl flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <ScanLine className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Prêt pour l'envoi</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-2">Veuillez sélectionner un dossier pour générer le QR Code de validation.</p>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-full bg-white rounded-[60px] border-4 border-white shadow-2xl overflow-hidden flex flex-col"
              >
                {/* QR CONTAINER */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50">
                  {status === 'success' ? (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40"
                    >
                      <CheckCircle2 className="w-20 h-20 text-white" />
                    </motion.div>
                  ) : (
                    <div className="bg-white p-6 rounded-[40px] shadow-2xl border border-slate-100 relative">
                       <QRCodeSVG 
                         value={`flowtym_checkin_${selectedResaId}_${Date.now()}`}
                         size={200}
                         level="H"
                         includeMargin={false}
                         fgColor={status === 'success' ? '#10B981' : '#1e293b'}
                       />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-xl flex items-center justify-center">
                             <div className="w-6 h-6 bg-primary rounded-lg" />
                          </div>
                       </div>
                    </div>
                  )}
                  
                  <div className="mt-8 text-center">
                    <h4 className="text-xl font-black text-slate-800">
                      {status === 'success' ? 'Check-in Validé !' : 'Action Requise'}
                    </h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${status === 'success' ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {status === 'success' ? 'Dossier mis à jour en séjour' : `Scannez pour RES-${selectedResaId}`}
                    </p>
                  </div>
                </div>

                {/* BOTTOM INFO */}
                <div className="p-8 bg-slate-900 flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Dossier client</div>
                    <div className="text-sm font-black text-white">{selectedClient?.name || '---'}</div>
                  </div>
                  <button 
                    onClick={reset}
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
