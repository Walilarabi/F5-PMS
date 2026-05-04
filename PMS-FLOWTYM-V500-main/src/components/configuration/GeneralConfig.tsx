import React from 'react';
import { 
  Hotel, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Euro, 
  Percent,
  Upload,
  ShieldCheck
} from 'lucide-react';

interface GeneralConfigProps {
  config: any;
  updateConfig: (patch: any) => void;
}

export const GeneralConfig: React.FC<GeneralConfigProps> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest leading-none">Identité de l'établissement</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Paramètres légaux et coordonnées</p>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'établissement</label>
              <div className="relative">
                <Hotel className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  value={config.hotelName} 
                  onChange={e => updateConfig({ hotelName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-violet-500 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de contact</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  value={config.email} 
                  onChange={e => updateConfig({ email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-violet-500 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  value={config.phone} 
                  onChange={e => updateConfig({ phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-violet-500 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  value={config.address} 
                  onChange={e => updateConfig({ address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-violet-500 transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
             <div className="flex items-center gap-6">
                <div className="w-24 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 relative group overflow-hidden">
                   {config.logo ? <img src={config.logo} className="w-full h-full object-contain" alt="Logo" /> : <Hotel className="w-8 h-8 opacity-50" />}
                </div>
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Logo de l'hôtel</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase">PNG, JPG — Max 2 Mo</p>
                   <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Changer le logo
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <Globe className="w-4 h-4 text-emerald-500" />
             <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Devise & Localisation</h3>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Devise</label>
                   <select 
                     value={config.currency}
                     onChange={e => updateConfig({ currency: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all"
                   >
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — Dollar</option>
                      <option value="GBP">GBP — Livre</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Symbole</label>
                   <input 
                     value={config.symbol}
                     onChange={e => updateConfig({ symbol: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-center outline-none" 
                   />
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuseau Horaire</label>
                <div className="relative">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <select 
                     value={config.timezone}
                     onChange={e => updateConfig({ timezone: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all"
                   >
                      <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                   </select>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
             <Percent className="w-4 h-4 text-rose-500" />
             <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Taxes & Frais</h3>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TVA Hébergement (%)</label>
                   <input 
                     type="number"
                     value={isNaN(config.tva) ? '' : config.tva}
                     onChange={e => updateConfig({ tva: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxe séjour (€/p/n)</label>
                   <input 
                     type="number"
                     value={isNaN(config.taxeSejour) ? '' : config.taxeSejour}
                     onChange={e => updateConfig({ taxeSejour: e.target.value === '' ? NaN : parseFloat(e.target.value) })}
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-rose-500 transition-all" 
                   />
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition Annulation Défaut</label>
                <select 
                   value={config.cancelDefault}
                   onChange={e => updateConfig({ cancelDefault: e.target.value })}
                   className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:border-rose-500 transition-all"
                >
                   <option value="24h">Gratuit jusqu'à J-1 (24h)</option>
                   <option value="48h">Gratuit jusqu'à J-2 (48h)</option>
                   <option value="7j">Gratuit jusqu'à J-7</option>
                   <option value="nanr">Non remboursable (Strict)</option>
                </select>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
