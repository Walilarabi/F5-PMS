import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigModal, Fl, IC, SC } from './ConfigUtils';

interface S8to21Props {
  activeTab: string;
  toast: (msg: string, type?: any) => void;
  // 8 - Cancel Policies
  cancelPolicies: any[]; setCancelPolicies: (v: any) => void;
  // 9 - Supplements
  supplements: any[]; setSupplements: (v: any) => void;
  // 10 - Promotions
  promotions: any[]; setPromotions: (v: any) => void;
  // 11 - Taxes
  taxes: any; setTaxes: (v: any) => void;
  taxExemptions: string[]; setTaxExemptions: (v: any) => void;
  // 12 - Notifications
  notifications: any[]; setNotifications: (v: any) => void;
  // 13 - API & Webhooks
  apiKeys: any[]; setApiKeys: (v: any) => void;
  webhooks: any[]; setWebhooks: (v: any) => void;
  // 14 - Equipment
  equipment: any[]; setEquipment: (v: any) => void;
  // 15 - Languages
  languages: any[]; setLanguages: (v: any) => void;
  // 16 - Media
  mediaFiles: any[]; setMediaFiles: (v: any) => void;
  // 17 - Backup
  backupStatus: string; setBackupStatus: (v: string) => void;
  // 18 - Audit Log
  fullAuditLogs: any[];
  // 19 - Closures
  closures: any[]; setClosures: (v: any) => void;
  // 20 - Yield
  yieldConfig: any; setYieldConfig: (v: any) => void;
  // 21 - Channel Advanced
  syncLogs: any[]; setSyncLogs: (v: any) => void;
  partnerMappings: any[]; setPartnerMappings: (v: any) => void;
  // Section 3 data needed for mapping
  ratePlans: any[];
  typologies: any[];
  roomsList: any[];
}

export const ConfigSections8to21: React.FC<S8to21Props> = (p) => {
  const { activeTab, toast, partnerMappings, setPartnerMappings, ratePlans, typologies, roomsList } = p;
  const mediaRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // === 8: CANCEL POLICIES ===
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({ id: '', name: '', desc: '', type: 'J-1', penalty: '', penaltyType: 'pct' });
  const [editingCancel, setEditingCancel] = useState<string | null>(null);
  const openAddCancel = () => { setEditingCancel(null); setCancelForm({ id: '', name: '', desc: '', type: 'J-1', penalty: '', penaltyType: 'pct' }); setCancelModalOpen(true); };
  const openEditCancel = (pol: any) => { setEditingCancel(pol.id); setCancelForm({ ...pol }); setCancelModalOpen(true); };
  const deleteCancel = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setCancelPolicies((prev: any[]) => prev.filter(x => x.id !== id)); toast('Politique supprimée', 'success'); };
  const saveCancel = () => {
    if (!cancelForm.name) { toast('Nom requis', 'error'); return; }
    if (editingCancel) p.setCancelPolicies((prev: any[]) => prev.map(x => x.id === editingCancel ? { ...x, ...cancelForm } : x));
    else p.setCancelPolicies((prev: any[]) => [...prev, { ...cancelForm, id: Date.now().toString() }]);
    toast(editingCancel ? 'Modifiée' : 'Ajoutée', 'success'); setCancelModalOpen(false);
  };

  // === 9: SUPPLEMENTS ===
  const [supplModalOpen, setSupplModalOpen] = useState(false);
  const [supplForm, setSupplForm] = useState({ id: '', name: '', category: 'F&B', price: '', billing: 'Par personne / Jour', active: true });
  const [editingSuppl, setEditingSuppl] = useState<string | null>(null);
  const openAddSuppl = () => { setEditingSuppl(null); setSupplForm({ id: '', name: '', category: 'F&B', price: '', billing: 'Par personne / Jour', active: true }); setSupplModalOpen(true); };
  const openEditSuppl = (s: any) => { setEditingSuppl(s.id); setSupplForm({ ...s }); setSupplModalOpen(true); };
  const deleteSuppl = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setSupplements((prev: any[]) => prev.filter(x => x.id !== id)); toast('Supprimé', 'success'); };
  const saveSuppl = () => {
    if (!supplForm.name || !supplForm.price) { toast('Nom et prix requis', 'error'); return; }
    if (editingSuppl) p.setSupplements((prev: any[]) => prev.map(x => x.id === editingSuppl ? { ...x, ...supplForm } : x));
    else p.setSupplements((prev: any[]) => [...prev, { ...supplForm, id: Date.now().toString() }]);
    toast(editingSuppl ? 'Modifié' : 'Ajouté', 'success'); setSupplModalOpen(false);
  };

  // === 10: PROMOTIONS ===
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ id: '', code: '', desc: '', dates: 'Permanent', discount: 10, type: 'pct', active: true, minNights: 1 });
  const [editingPromo, setEditingPromo] = useState<string | null>(null);
  const openAddPromo = () => { setEditingPromo(null); setPromoForm({ id: '', code: '', desc: '', dates: 'Permanent', discount: 10, type: 'pct', active: true, minNights: 1 }); setPromoModalOpen(true); };
  const openEditPromo = (pr: any) => { setEditingPromo(pr.id); setPromoForm({ ...pr }); setPromoModalOpen(true); };
  const deletePromo = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setPromotions((prev: any[]) => prev.filter(x => x.id !== id)); toast('Supprimée', 'success'); };
  const savePromo = () => {
    if (!promoForm.code) { toast('Code requis', 'error'); return; }
    if (editingPromo) p.setPromotions((prev: any[]) => prev.map(x => x.id === editingPromo ? { ...x, ...promoForm } : x));
    else p.setPromotions((prev: any[]) => [...prev, { ...promoForm, id: Date.now().toString() }]);
    toast(editingPromo ? 'Modifiée' : 'Créée', 'success'); setPromoModalOpen(false);
  };

  // === 12: NOTIFICATIONS ===
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ id: '', name: '', channel: 'Email', active: true, template: '' });
  const [editingNotif, setEditingNotif] = useState<string | null>(null);
  const [testingNotif, setTestingNotif] = useState<string | null>(null);
  const openAddNotif = () => { setEditingNotif(null); setNotifForm({ id: '', name: '', channel: 'Email', active: true, template: '' }); setNotifModalOpen(true); };
  const openEditNotif = (n: any) => { setEditingNotif(n.id); setNotifForm({ ...n }); setNotifModalOpen(true); };
  const deleteNotif = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setNotifications((prev: any[]) => prev.filter(x => x.id !== id)); toast('Supprimé', 'success'); };
  const saveNotif = () => {
    if (!notifForm.name) { toast('Nom requis', 'error'); return; }
    if (editingNotif) p.setNotifications((prev: any[]) => prev.map(x => x.id === editingNotif ? { ...x, ...notifForm } : x));
    else p.setNotifications((prev: any[]) => [...prev, { ...notifForm, id: Date.now().toString() }]);
    toast(editingNotif ? 'Modifié' : 'Ajouté', 'success'); setNotifModalOpen(false);
  };
  const testNotif = async (id: string) => {
    setTestingNotif(id); await new Promise(r => setTimeout(r, 1500));
    setTestingNotif(null); toast('Email de test envoyé !', 'success');
  };

  // === 13: WEBHOOKS ===
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ id: '', name: '', url: '', events: '' });
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const openAddWebhook = () => { setEditingWebhook(null); setWebhookForm({ id: '', name: '', url: '', events: 'reservation.created' }); setWebhookModalOpen(true); };
  const openEditWebhook = (w: any) => { setEditingWebhook(w.id); setWebhookForm({ ...w, events: Array.isArray(w.events) ? w.events.join(', ') : w.events }); setWebhookModalOpen(true); };
  const deleteWebhook = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setWebhooks((prev: any[]) => prev.filter(x => x.id !== id)); toast('Supprimé', 'success'); };
  const saveWebhook = () => {
    if (!webhookForm.name || !webhookForm.url) { toast('Nom et URL requis', 'error'); return; }
    const data = { ...webhookForm, events: webhookForm.events.split(',').map(e => e.trim()) };
    if (editingWebhook) p.setWebhooks((prev: any[]) => prev.map(x => x.id === editingWebhook ? { ...x, ...data } : x));
    else p.setWebhooks((prev: any[]) => [...prev, { ...data, id: Date.now().toString(), active: true, lastTest: 'Non testé' }]);
    toast(editingWebhook ? 'Modifié' : 'Ajouté', 'success'); setWebhookModalOpen(false);
  };
  const testWebhook = async (id: string) => {
    setTestingWebhook(id); await new Promise(r => setTimeout(r, 1500));
    p.setWebhooks((prev: any[]) => prev.map(w => w.id === id ? { ...w, lastTest: 'OK' } : w));
    setTestingWebhook(null); toast('Webhook testé — HTTP 200', 'success');
  };
  const copyKey = (key: string) => { navigator.clipboard?.writeText(key).catch(() => {}); toast('Clé copiée !', 'success'); };
  const generateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const key = 'sk_live_' + Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * 36)]).join('');
    p.setApiKeys((prev: any[]) => [...prev, { id: Date.now().toString(), label: 'Nouvelle clé', key, created: new Date().toISOString().slice(0, 10) }]);
    toast('Clé générée', 'success');
  };
  const revokeKey = (id: string) => { if (!window.confirm('Révoquer ?')) return; p.setApiKeys((prev: any[]) => prev.filter(k => k.id !== id)); toast('Révoquée', 'success'); };

  // === 14: EQUIPMENT ===
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [newEquip, setNewEquip] = useState('');
  const saveEquip = () => {
    if (!newEquip) { toast('Nom requis', 'error'); return; }
    p.setEquipment((prev: any[]) => [...prev, { id: Date.now().toString(), name: newEquip, active: true }]);
    toast('Équipement ajouté', 'success'); setEquipModalOpen(false);
  };

  // === 15: LANGUAGES ===
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [langForm, setLangForm] = useState({ flag: '🏳️', name: '', code: '' });
  const saveLang = () => {
    if (!langForm.name || !langForm.code) { toast('Nom et code requis', 'error'); return; }
    p.setLanguages((prev: any[]) => [...prev, { ...langForm, id: Date.now().toString(), progress: 0, active: false, isDefault: false }]);
    toast('Langue ajoutée', 'success'); setLangModalOpen(false);
  };

  // === 16: MEDIA ===
  const handleMediaUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => p.setMediaFiles((prev: any[]) => [...prev, { id: Date.now().toString() + Math.random(), name: file.name.replace(/\.[^/.]+$/, ''), preview: e.target?.result, category: 'Hôtel' }]);
      reader.readAsDataURL(file);
    });
    toast(`${files.length} photo(s) ajoutée(s)`, 'success');
  };
  const deleteMedia = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setMediaFiles((prev: any[]) => prev.filter(m => m.id !== id)); toast('Supprimée', 'success'); };

  // === 17: BACKUP ===
  const [backupRunning, setBackupRunning] = useState(false);
  const handleBackupNow = async () => {
    setBackupRunning(true); p.setBackupStatus('En cours...');
    await new Promise(r => setTimeout(r, 2000));
    setBackupRunning(false); p.setBackupStatus('Sauvegardé à ' + new Date().toLocaleTimeString('fr-FR'));
    toast('Sauvegarde réussie', 'success');
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ backup: Date.now() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `flowtym-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Export lancé', 'success');
  };

  // === 18: AUDIT ===
  const [auditFilter, setAuditFilter] = useState({ user: '', action: '', entity: '' });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const filteredLogs = p.fullAuditLogs.filter(l =>
    (!auditFilter.user || l.user.toLowerCase().includes(auditFilter.user.toLowerCase())) &&
    (!auditFilter.action || l.action === auditFilter.action) &&
    (!auditFilter.entity || l.entity_type.includes(auditFilter.entity.toLowerCase()))
  );
  const exportAudit = (fmt: 'csv' | 'json') => {
    const content = fmt === 'csv'
      ? 'Date,User,Action,Entity,Details\n' + filteredLogs.map(l => `${l.date},${l.user},${l.action},${l.entity_type},"${l.details}"`).join('\n')
      : JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([content], { type: fmt === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit.${fmt}`; a.click(); URL.revokeObjectURL(url);
    toast(`Exporté en ${fmt.toUpperCase()}`, 'success');
  };

  // === 19: CLOSURES ===
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [closureForm, setClosureForm] = useState({ id: '', name: '', type: 'totale', from: '', to: '', note: '' });
  const [editingClosure, setEditingClosure] = useState<string | null>(null);
  const openAddClosure = () => { setEditingClosure(null); setClosureForm({ id: '', name: '', type: 'totale', from: '', to: '', note: '' }); setClosureModalOpen(true); };
  const openEditClosure = (c: any) => { setEditingClosure(c.id); setClosureForm({ ...c }); setClosureModalOpen(true); };
  const deleteClosure = (id: string) => { if (!window.confirm('Supprimer ?')) return; p.setClosures((prev: any[]) => prev.filter(x => x.id !== id)); toast('Supprimée', 'success'); };
  const saveClosure = () => {
    if (!closureForm.name || !closureForm.from || !closureForm.to) { toast('Nom et dates requis', 'error'); return; }
    if (editingClosure) p.setClosures((prev: any[]) => prev.map(x => x.id === editingClosure ? { ...x, ...closureForm } : x));
    else p.setClosures((prev: any[]) => [...prev, { ...closureForm, id: Date.now().toString() }]);
    toast(editingClosure ? 'Modifiée' : 'Ajoutée', 'success'); setClosureModalOpen(false);
  };

  // === 20: YIELD ===
  const [simRunning, setSimRunning] = useState(false);
  const handleSimulate = async () => {
    setSimRunning(true); await new Promise(r => setTimeout(r, 2000));
    setSimRunning(false); toast('Simulation : +12% RevPAR estimé sur 30 jours', 'success');
  };

  // === 21: CHANNEL ADVANCED ===
  const [advSyncRunning, setAdvSyncRunning] = useState(false);
  const handleAdvSync = async () => {
    setAdvSyncRunning(true); await new Promise(r => setTimeout(r, 2500));
    p.setSyncLogs((prev: any[]) => [{ id: Date.now().toString(), date: new Date().toLocaleString('fr-FR'), channel: 'Tous', type: 'PUSH', status: 'OK', rooms: 48, rates: 12 }, ...prev]);
    setAdvSyncRunning(false); toast('Synchronisation complète — 48 ch. · 12 tarifs', 'success');
  };

  return (
    <>
      {/* ===== SECTION 8: CANCEL POLICIES ===== */}
      {activeTab === 'cancel_policies' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-calendar-times text-primary" /> Politiques d'annulation</h4>
            <button onClick={openAddCancel} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Nouvelle Politique</button>
          </div>
          <div className="space-y-4">
            {p.cancelPolicies.map((pol: any) => (
              <div key={pol.id} className="border border-slate-100 p-5 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow bg-slate-50/50">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="font-bold text-slate-800 flex items-center gap-2">{pol.name} <span className="text-[10px] bg-white border border-slate-200 px-2 rounded-full uppercase text-slate-500">{pol.type}</span></div>
                  <div className="text-[13px] text-slate-500 mt-1">{pol.desc}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[11px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1 rounded">Pénalité: {pol.penalty}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCancel(pol)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-pen text-[12px]" /></button>
                    <button onClick={() => deleteCancel(pol.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash text-[12px]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 9: SUPPLEMENTS ===== */}
      {activeTab === 'supplements' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-plus-circle text-primary" /> Suppléments & Options</h4>
            <button onClick={openAddSuppl} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
          </div>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                {['Nom', 'Catégorie', 'Prix', 'Facturation', 'Statut', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {p.supplements.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{s.category}</span></td>
                    <td className="px-4 py-3 font-black text-emerald-600">{s.price}€</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.billing}</td>
                    <td className="px-4 py-3"><button onClick={() => p.setSupplements((prev: any[]) => prev.map(ss => ss.id === s.id ? { ...ss, active: !ss.active } : ss))} className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.active ? 'Actif' : 'Inactif'}</button></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEditSuppl(s)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-pen text-[12px]" /></button>
                      <button onClick={() => deleteSuppl(s.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash text-[12px]" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== SECTION 10: PROMOTIONS ===== */}
      {activeTab === 'promotions' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-percentage text-primary" /> Promotions & Codes Promo</h4>
            <button onClick={openAddPromo} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Créer</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {p.promotions.map((pr: any) => (
              <div key={pr.id} className={`border p-6 rounded-2xl flex flex-col ${pr.active ? 'border-primary/20 bg-primary/5' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-lg tracking-widest border border-dashed border-slate-300 px-3 py-1 bg-white rounded uppercase">{pr.code}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${pr.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <button onClick={() => openEditPromo(pr)} className="text-slate-400 hover:text-primary p-1"><i className="fa-solid fa-pen text-[11px]" /></button>
                    <button onClick={() => deletePromo(pr.id)} className="text-slate-400 hover:text-rose-500 p-1"><i className="fa-solid fa-trash text-[11px]" /></button>
                  </div>
                </div>
                <p className="text-[13px] font-bold text-slate-700 mt-2">{pr.desc}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-[11px] text-slate-500 uppercase">{pr.dates}</p>
                  <button onClick={() => p.setPromotions((prev: any[]) => prev.map(pp => pp.id === pr.id ? { ...pp, active: !pp.active } : pp))} className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${pr.active ? 'bg-white text-rose-500 hover:bg-rose-50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                    {pr.active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 11: TAXES ===== */}
      {activeTab === 'taxes' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-coins text-primary" /> Taxes & Exonérations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h5 className="text-[13px] font-black uppercase text-slate-400 mb-4 tracking-widest">TVA Appliquées</h5>
              <div className="space-y-4">
                {[{ label: 'Hébergement', key: 'hebergement' as const }, { label: 'Restauration (F&B)', key: 'fb' as const }, { label: 'Alcool & Services', key: 'alcool' as const }].map(t => (
                  <div key={t.key} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <span className="font-bold text-slate-700">{t.label}</span>
                    <div className="flex items-center gap-2"><input type="number" value={p.taxes[t.key]} onChange={e => p.setTaxes((prev: any) => ({ ...prev, [t.key]: Number(e.target.value) }))} className="w-20 border border-slate-200 rounded px-2 py-1 outline-none text-right font-black focus:border-primary" /><span className="text-slate-500 font-bold">%</span></div>
                  </div>
                ))}
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 p-4 rounded-xl">
                  <span className="font-bold text-slate-700">Taxe de séjour</span>
                  <div className="flex items-center gap-2"><input type="number" step="0.10" value={p.taxes.cityTax} onChange={e => p.setTaxes((prev: any) => ({ ...prev, cityTax: Number(e.target.value) }))} className="w-20 border border-slate-200 rounded px-2 py-1 outline-none text-right font-black focus:border-primary" /><span className="text-slate-500 font-bold">€/nuit</span></div>
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-[13px] font-black uppercase text-slate-400 mb-4 tracking-widest">Exonérations (Taxe séjour)</h5>
              <div className="space-y-2 mb-4">
                {p.taxExemptions.map((exo: string) => (
                  <div key={exo} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer flex-1"><input type="checkbox" defaultChecked className="accent-primary w-4 h-4" /><span className="text-[13px] font-bold text-slate-700">{exo}</span></label>
                    <button onClick={() => { p.setTaxExemptions((prev: string[]) => prev.filter(e => e !== exo)); toast('Supprimée', 'success'); }} className="text-slate-300 hover:text-rose-500 p-1"><i className="fa-solid fa-times text-[11px]" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => { const exo = window.prompt('Nouvelle exonération :'); if (exo) { p.setTaxExemptions((prev: string[]) => [...prev, exo]); toast('Ajoutée', 'success'); } }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all">
                <i className="fa-solid fa-plus mr-1" /> Ajouter
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===== SECTION 12: NOTIFICATIONS ===== */}
      {activeTab === 'notifications' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-paper-plane text-primary" /> Notifications Automatiques</h4>
            <button onClick={openAddNotif} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
          </div>
          <div className="space-y-4">
            {p.notifications.map((n: any) => (
              <div key={n.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex-1 min-w-0 mr-4"><div className="font-bold text-slate-800">{n.name}</div><div className="text-[10px] font-black uppercase text-slate-400 mt-1">{n.channel}</div></div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => testNotif(n.id)} disabled={testingNotif === n.id} className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50">{testingNotif === n.id ? <i className="fa-solid fa-spinner fa-spin" /> : 'Test'}</button>
                  <button onClick={() => openEditNotif(n)} className="text-slate-400 hover:text-primary p-1.5"><i className="fa-solid fa-pen text-[12px]" /></button>
                  <button onClick={() => deleteNotif(n.id)} className="text-slate-400 hover:text-rose-500 p-1.5"><i className="fa-solid fa-trash text-[12px]" /></button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={n.active} onChange={() => p.setNotifications((prev: any[]) => prev.map(nn => nn.id === n.id ? { ...nn, active: !nn.active } : nn))} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 13: API & WEBHOOKS ===== */}
      {activeTab === 'api_webhooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-sm text-white">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[15px] font-black flex items-center gap-2"><i className="fa-solid fa-code text-primary" /> Clés API</h4>
              <button onClick={generateKey} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-plus mr-1" /> Générer</button>
            </div>
            <div className="space-y-3">
              {p.apiKeys.map((k: any) => (
                <div key={k.id} className="bg-black/50 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                  <div className="min-w-0 flex-1"><div className="text-[11px] font-bold text-slate-400 mb-0.5">{k.label}</div><code className="text-emerald-400 text-[11px] font-mono truncate block">{k.key.slice(0, 28)}...</code></div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <button onClick={() => copyKey(k.key)} className="text-slate-400 hover:text-white p-1.5"><i className="fa-solid fa-copy text-[12px]" /></button>
                    <button onClick={() => revokeKey(k.id)} className="text-slate-400 hover:text-rose-400 p-1.5"><i className="fa-solid fa-trash text-[12px]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-link text-primary" /> Webhooks</h4>
              <button onClick={openAddWebhook} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
            </div>
            <div className="space-y-3">
              {p.webhooks.map((w: any) => (
                <div key={w.id} className="border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-[13px]">{w.name}</span>
                    <div className="flex items-center gap-2"><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${w.lastTest === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{w.lastTest}</span><div className={`w-2 h-2 rounded-full ${w.active ? 'bg-emerald-500' : 'bg-slate-300'}`} /></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{w.url}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => testWebhook(w.id)} disabled={testingWebhook === w.id} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"><i className={`fa-solid ${testingWebhook === w.id ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-1`} />Test</button>
                    <button onClick={() => openEditWebhook(w)} className="text-slate-400 hover:text-primary ml-auto p-1"><i className="fa-solid fa-pen text-[11px]" /></button>
                    <button onClick={() => deleteWebhook(w.id)} className="text-slate-400 hover:text-rose-500 p-1"><i className="fa-solid fa-trash text-[11px]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ===== SECTION 14: EQUIPMENT ===== */}
      {activeTab === 'equipments' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-concierge-bell text-primary" /> Équipements de l'hôtel</h4>
            <button onClick={() => { setNewEquip(''); setEquipModalOpen(true); }} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
          </div>
          <p className="text-[13px] text-slate-500 mb-6">Équipements visibles sur votre moteur de réservation et envoyés aux OTA.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {p.equipment.map((eq: any) => (
              <div key={eq.id} className={`flex items-center justify-between gap-3 border rounded-xl p-3 transition-all ${eq.active ? 'border-primary/30 bg-primary/5' : 'border-slate-100 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={eq.active} onChange={() => p.setEquipment((prev: any[]) => prev.map(e => e.id === eq.id ? { ...e, active: !e.active } : e))} className="accent-primary w-4 h-4" />
                  <span className="text-[12px] font-bold text-slate-700">{eq.name}</span>
                </label>
                <button onClick={() => { p.setEquipment((prev: any[]) => prev.filter(e => e.id !== eq.id)); toast('Supprimé', 'success'); }} className="text-slate-200 hover:text-rose-400 transition-colors shrink-0"><i className="fa-solid fa-times text-[10px]" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 15: LANGUAGES ===== */}
      {activeTab === 'languages' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-language text-primary" /> Langues & Traductions</h4>
            <button onClick={() => { setLangForm({ flag: '🏳️', name: '', code: '' }); setLangModalOpen(true); }} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all hover:bg-primary hover:text-white">+ Ajouter</button>
          </div>
          <div className="space-y-4">
            {p.languages.map((l: any) => (
              <div key={l.id} className={`flex items-center justify-between p-5 rounded-xl border transition-colors ${l.active ? 'border-primary/20 bg-primary/5' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{l.flag}</span>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">{l.name}{l.isDefault && <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase font-black">Défaut</span>}</div>
                    <div className="flex items-center gap-2 mt-1"><div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${l.progress}%` }} /></div><span className="text-[11px] font-bold text-slate-400">{l.progress}%</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!l.isDefault && <button onClick={() => p.setLanguages((prev: any[]) => prev.map(ll => ll.id === l.id ? { ...ll, active: !ll.active } : ll))} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors ${l.active ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>{l.active ? 'Désactiver' : 'Activer'}</button>}
                  <button onClick={() => toast(`Éditeur de traductions ${l.name} — Bientôt disponible`, 'info')} className="text-[11px] font-bold text-primary hover:underline">Éditer</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 16: MEDIA ===== */}
      {activeTab === 'media' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-images text-primary" /> Galerie & Photos</h4>
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors mb-8 ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            onClick={() => mediaRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleMediaUpload(e.dataTransfer.files); }}
          >
            <input type="file" ref={mediaRef} accept="image/*" multiple className="hidden" onChange={e => handleMediaUpload(e.target.files)} />
            <i className={`fa-solid fa-cloud-upload-alt text-4xl mb-4 ${isDragging ? 'text-primary' : 'text-slate-300'}`} />
            <p className="font-bold text-slate-500">Glissez / Déposez vos images ici</p>
            <p className="text-[11px] text-slate-400 mt-2">ou <span className="text-primary font-bold underline">parcourez</span> · JPG, PNG (max 5MB)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {p.mediaFiles.map((m: any) => (
              <div key={m.id} className="aspect-square bg-slate-200 rounded-xl relative group overflow-hidden">
                {m.preview ? <img src={m.preview} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"><i className="fa-solid fa-image text-2xl text-slate-400 mb-1" /><span className="text-[9px] text-slate-400 font-bold text-center px-2 leading-tight">{m.name}</span></div>}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => deleteMedia(m.id)} className="text-white hover:text-rose-400 transition-colors bg-black/30 rounded-full p-2"><i className="fa-solid fa-trash text-xs" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 17: BACKUP ===== */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-4"><i className="fa-solid fa-cloud-download-alt text-primary" /> Sauvegarde Manuelle</h4>
            <p className="text-xs text-slate-500 mb-6">Téléchargez une sauvegarde complète de votre configuration PMS.</p>
            <button onClick={handleExport} className="w-full bg-slate-800 hover:bg-black text-white px-4 py-4 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg flex justify-center items-center gap-2 mb-4 transition-colors"><i className="fa-solid fa-download" /> Exporter (.json)</button>
            <button onClick={handleBackupNow} disabled={backupRunning} className="w-full bg-primary hover:bg-[#7b4be8] text-white px-4 py-4 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-primary/20 flex justify-center items-center gap-2 transition-colors disabled:opacity-70">
              <i className={`fa-solid ${backupRunning ? 'fa-spinner fa-spin' : 'fa-save'}`} /> {backupRunning ? 'En cours...' : 'Sauvegarder Maintenant'}
            </button>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm border-l-4 border-l-primary">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-4"><i className="fa-solid fa-cloud text-primary" /> Sauvegarde Cloud Auto</h4>
            <p className="text-xs text-slate-500 mb-6">Données sauvegardées en temps réel (Double-Redondance).</p>
            <div className="flex items-center gap-3 text-emerald-600 font-black text-sm mb-6"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />{p.backupStatus}</div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="text-[11px] font-black uppercase text-slate-400 mb-3">Restaurer depuis :</div>
              <div className="space-y-2">
                {['Snapshot 2026-04-20 02:00', 'Snapshot 2026-04-19 02:00', 'Snapshot 2026-04-18 02:00'].map(snap => (
                  <button key={snap} onClick={() => { if (window.confirm(`Restaurer depuis ${snap} ?`)) toast(`Restauration depuis ${snap} initiée`, 'info'); }} className="w-full flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-slate-700 hover:border-primary hover:bg-primary/5 transition-colors">
                    <span><i className="fa-solid fa-history mr-2 text-slate-400" />{snap}</span>
                    <i className="fa-solid fa-redo text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===== SECTION 18: AUDIT LOG ADVANCED ===== */}
      {activeTab === 'audit_advanced' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-search-dollar text-primary" /> Audit Log Avancé</h4>
            <div className="flex gap-2">
              <button onClick={() => exportAudit('csv')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-file-csv mr-1" />CSV</button>
              <button onClick={() => exportAudit('json')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-file-code mr-1" />JSON</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Utilisateur</label><input type="text" placeholder="Filtrer..." value={auditFilter.user} onChange={e => setAuditFilter(prev => ({ ...prev, user: e.target.value }))} className={IC} /></div>
            <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Action</label><select value={auditFilter.action} onChange={e => setAuditFilter(prev => ({ ...prev, action: e.target.value }))} className={SC}><option value="">Toutes</option><option>CREATE</option><option>UPDATE</option><option>DELETE</option></select></div>
            <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Entité</label><input type="text" placeholder="Filtrer..." value={auditFilter.entity} onChange={e => setAuditFilter(prev => ({ ...prev, entity: e.target.value }))} className={IC} /></div>
          </div>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                {['Date', 'Utilisateur', 'Action', 'Entité', 'Détails', ''].map(h => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log: any) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-400">{log.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{log.user}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{log.action}</span></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 font-black uppercase">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium text-[12px]">{log.details}</td>
                      <td className="px-4 py-3 text-center"><i className={`fa-solid ${expandedLog === log.id ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-400 text-[11px]`} /></td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                            {log.before && <div><div className="text-[10px] font-black uppercase text-slate-400 mb-1">Avant</div><div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100">{log.before}</div></div>}
                            {log.after && <div><div className="text-[10px] font-black uppercase text-slate-400 mb-1">Après</div><div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-100">{log.after}</div></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredLogs.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold">Aucun résultat</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== SECTION 19: CLOSURES ===== */}
      {activeTab === 'closures' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-hammer text-primary" /> Fermetures & Maintenance</h4>
            <button onClick={openAddClosure} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Nouvelle fermeture</button>
          </div>
          <div className="space-y-4">
            {p.closures.map((c: any) => (
              <div key={c.id} className={`border p-5 rounded-xl ${c.type === 'totale' ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">{c.name}<span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.type === 'totale' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{c.type}</span></div>
                    <div className="text-[12px] text-slate-500 mt-1"><i className="fa-regular fa-calendar mr-1" />Du {c.from} au {c.to}</div>
                    {c.note && <div className="text-[11px] font-semibold text-rose-600 mt-1"><i className="fa-solid fa-triangle-exclamation mr-1" />{c.note}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEditClosure(c)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-pen text-[12px]" /></button>
                    <button onClick={() => deleteClosure(c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash text-[12px]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== SECTION 20: YIELD ===== */}
      {activeTab === 'yield' && (
        <section className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-chart-line text-primary" /> Yield / Revenue Management System</h4>
          <p className="text-[13px] text-slate-600 mb-8 max-w-3xl leading-relaxed">Notre moteur RMS analyse l'occupation, les concurrents et les événements locaux pour optimiser vos tarifs en continu.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Mode Pilote Auto', content: <label className="relative inline-flex items-center cursor-pointer mt-2"><input type="checkbox" checked={p.yieldConfig.autoPilot} onChange={e => p.setYieldConfig((prev: any) => ({ ...prev, autoPilot: e.target.checked }))} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600" /></label> },
              { label: 'Prix Plancher (BAR)', content: <div className="flex items-end gap-1"><input type="number" value={p.yieldConfig.barFloor} onChange={e => p.setYieldConfig((prev: any) => ({ ...prev, barFloor: Number(e.target.value) }))} className="text-2xl font-black w-20 outline-none bg-transparent text-slate-800" /><span className="font-bold text-slate-500 pb-1">€</span></div> },
              { label: 'Prix Plafond', content: <div className="flex items-end gap-1"><input type="number" value={p.yieldConfig.barCeiling} onChange={e => p.setYieldConfig((prev: any) => ({ ...prev, barCeiling: Number(e.target.value) }))} className="text-2xl font-black w-20 outline-none bg-transparent text-slate-800" /><span className="font-bold text-slate-500 pb-1">€</span></div> },
              { label: 'Overbooking', content: <div className="flex items-end gap-1"><input type="number" value={p.yieldConfig.overbookPct} onChange={e => p.setYieldConfig((prev: any) => ({ ...prev, overbookPct: Number(e.target.value) }))} className="text-2xl font-black w-16 outline-none bg-transparent text-slate-800" /><span className="font-bold text-slate-500 pb-1">%</span></div> },
            ].map(card => (
              <div key={card.label} className="border border-slate-200 p-5 rounded-2xl bg-white shadow-sm relative z-10">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-3">{card.label}</div>
                {card.content}
              </div>
            ))}
          </div>
          <button onClick={handleSimulate} disabled={simRunning} className="bg-gradient-to-r from-slate-800 to-black hover:from-black text-white px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 relative z-10">
            <i className={`fa-solid ${simRunning ? 'fa-spinner fa-spin' : 'fa-bolt'} text-yellow-400`} />
            {simRunning ? 'Simulation en cours...' : "Simuler l'impact sur 30 jours"}
          </button>
        </section>
      )}

      {/* ===== SECTION 21: CHANNEL ADVANCED ===== */}
      {activeTab === 'channel_advanced' && (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-satellite-dish text-primary" /> Channel Manager Avancé</h4>
            <button onClick={handleAdvSync} disabled={advSyncRunning} className="bg-primary hover:bg-[#7b4be8] text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
              <i className={`fa-solid fa-sync-alt ${advSyncRunning ? 'animate-spin' : ''}`} /> {advSyncRunning ? 'Sync...' : 'Synchroniser'}
            </button>
          </div>
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-8">
            <div>
              <div className="font-black text-emerald-800">Synchronisation Push Temps Réel XML/JSON</div>
              <div className="text-xs text-emerald-600 mt-1">Disparités d'inventaire &lt; 2 secondes.</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <i className="fa-solid fa-check-circle text-2xl text-emerald-400" />
            </div>
          </div>
          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h5 className="text-[12px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-history text-slate-400" /> Historique de Synchronisation
              </h5>
              <span className="text-[10px] text-slate-400 font-semibold px-3 py-1 bg-white rounded-full border border-slate-100">{p.syncLogs.length} entrée(s)</span>
            </div>
            <div className="divide-y divide-slate-50">
              {p.syncLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                  <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{log.date}</div>
                    <div className="font-black text-slate-800 text-[14px] leading-none">{log.channel}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase border border-slate-200">{log.type}</div>
                    <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${log.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.status}</div>
                  </div>
                  {log.rooms > 0 && (
                    <div className="ml-auto text-[11px] font-black text-slate-500 flex items-center gap-3">
                       <span className="flex items-center gap-1.5"><i className="fa-solid fa-bed text-slate-300" /> {log.rooms}</span>
                       <span className="flex items-center gap-1.5"><i className="fa-solid fa-tag text-slate-300" /> {log.rates}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MODALS: SECTIONS 8-21 ===== */}
      <ConfigModal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title={editingCancel ? 'Modifier la politique' : "Nouvelle politique d'annulation"} onSave={saveCancel}>
        <Fl label="Nom" required><input type="text" value={cancelForm.name} onChange={e => setCancelForm({ ...cancelForm, name: e.target.value })} className={IC} placeholder="Flexible" /></Fl>
        <Fl label="Description"><textarea value={cancelForm.desc} onChange={e => setCancelForm({ ...cancelForm, desc: e.target.value })} className={IC + ' h-20 resize-none'} /></Fl>
        <Fl label="Délai"><select value={cancelForm.type} onChange={e => setCancelForm({ ...cancelForm, type: e.target.value })} className={SC}><option>Immédiat</option><option>J-1</option><option>J-3</option><option>J-7</option><option>J-14</option><option>J-30</option></select></Fl>
        <Fl label="Pénalité"><input type="text" value={cancelForm.penalty} onChange={e => setCancelForm({ ...cancelForm, penalty: e.target.value })} className={IC} placeholder="100%, 1 Nuit..." /></Fl>
      </ConfigModal>

      <ConfigModal isOpen={supplModalOpen} onClose={() => setSupplModalOpen(false)} title={editingSuppl ? 'Modifier le supplément' : 'Nouveau supplément'} onSave={saveSuppl}>
        <Fl label="Nom" required><input type="text" value={supplForm.name} onChange={e => setSupplForm({ ...supplForm, name: e.target.value })} className={IC} placeholder="Petit-Déjeuner..." /></Fl>
        <Fl label="Catégorie"><select value={supplForm.category} onChange={e => setSupplForm({ ...supplForm, category: e.target.value })} className={SC}><option>F&B</option><option>Chambre</option><option>Services</option><option>Transport</option></select></Fl>
        <Fl label="Prix (€)" required><input type="number" step="0.01" value={supplForm.price} onChange={e => setSupplForm({ ...supplForm, price: e.target.value })} className={IC} /></Fl>
        <Fl label="Facturation"><select value={supplForm.billing} onChange={e => setSupplForm({ ...supplForm, billing: e.target.value })} className={SC}><option>Par personne / Jour</option><option>Par chambre / Jour</option><option>Par jour</option><option>Par séjour</option><option>Par commande</option></select></Fl>
      </ConfigModal>

      <ConfigModal isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)} title={editingPromo ? 'Modifier la promotion' : 'Nouvelle promotion'} onSave={savePromo}>
        <Fl label="Code Promo" required><input type="text" value={promoForm.code} onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} className={IC} placeholder="SUMMER2026" /></Fl>
        <Fl label="Description"><input type="text" value={promoForm.desc} onChange={e => setPromoForm({ ...promoForm, desc: e.target.value })} className={IC} /></Fl>
        <Fl label="Réduction (%)"><input type="number" value={promoForm.discount} onChange={e => setPromoForm({ ...promoForm, discount: Number(e.target.value) })} className={IC} /></Fl>
        <Fl label="Nuits minimum"><input type="number" value={promoForm.minNights} onChange={e => setPromoForm({ ...promoForm, minNights: Number(e.target.value) })} className={IC} /></Fl>
        <Fl label="Période"><input type="text" value={promoForm.dates} onChange={e => setPromoForm({ ...promoForm, dates: e.target.value })} className={IC} placeholder="Permanent ou 01/06 - 31/08" /></Fl>
      </ConfigModal>

      <ConfigModal isOpen={notifModalOpen} onClose={() => setNotifModalOpen(false)} title={editingNotif ? 'Modifier le template' : 'Nouveau template'} onSave={saveNotif} size="lg">
        <Fl label="Nom" required><input type="text" value={notifForm.name} onChange={e => setNotifForm({ ...notifForm, name: e.target.value })} className={IC} /></Fl>
        <Fl label="Canal"><select value={notifForm.channel} onChange={e => setNotifForm({ ...notifForm, channel: e.target.value })} className={SC}><option>Email</option><option>SMS</option><option>Email + SMS</option><option>Push</option></select></Fl>
        <Fl label="Template (Variables: {'{client_name}'}, {'{reservation_id}'}, {'{hotel_name}'}...)">
          <textarea value={notifForm.template} onChange={e => setNotifForm({ ...notifForm, template: e.target.value })} className={IC + ' h-32 resize-none font-mono text-[12px]'} placeholder="Bonjour {client_name}..." />
        </Fl>
      </ConfigModal>

      <ConfigModal isOpen={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} title={editingWebhook ? 'Modifier le webhook' : 'Nouveau webhook'} onSave={saveWebhook}>
        <Fl label="Nom" required><input type="text" value={webhookForm.name} onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })} className={IC} /></Fl>
        <Fl label="URL cible" required><input type="url" value={webhookForm.url} onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })} className={IC} placeholder="https://..." /></Fl>
        <Fl label="Événements (séparés par virgule)"><input type="text" value={webhookForm.events} onChange={e => setWebhookForm({ ...webhookForm, events: e.target.value })} className={IC} placeholder="reservation.created, checkin.completed" /></Fl>
      </ConfigModal>

      <ConfigModal isOpen={equipModalOpen} onClose={() => setEquipModalOpen(false)} title="Ajouter un équipement" onSave={saveEquip}>
        <Fl label="Nom" required><input type="text" value={newEquip} onChange={e => setNewEquip(e.target.value)} className={IC} placeholder="ex: Sauna, Terrasse..." autoFocus /></Fl>
      </ConfigModal>

      <ConfigModal isOpen={langModalOpen} onClose={() => setLangModalOpen(false)} title="Ajouter une langue" onSave={saveLang}>
        <Fl label="Drapeau (emoji)"><input type="text" value={langForm.flag} onChange={e => setLangForm({ ...langForm, flag: e.target.value })} className={IC} /></Fl>
        <Fl label="Nom" required><input type="text" value={langForm.name} onChange={e => setLangForm({ ...langForm, name: e.target.value })} className={IC} placeholder="Deutsch" /></Fl>
        <Fl label="Code ISO" required><input type="text" maxLength={2} value={langForm.code} onChange={e => setLangForm({ ...langForm, code: e.target.value.toLowerCase() })} className={IC} placeholder="de" /></Fl>
      </ConfigModal>

      <ConfigModal isOpen={closureModalOpen} onClose={() => setClosureModalOpen(false)} title={editingClosure ? 'Modifier la fermeture' : 'Nouvelle fermeture'} onSave={saveClosure}>
        <Fl label="Intitulé" required><input type="text" value={closureForm.name} onChange={e => setClosureForm({ ...closureForm, name: e.target.value })} className={IC} /></Fl>
        <Fl label="Type"><select value={closureForm.type} onChange={e => setClosureForm({ ...closureForm, type: e.target.value })} className={SC}><option value="totale">Fermeture Totale</option><option value="partielle">Fermeture Partielle</option><option value="maintenance">Maintenance</option></select></Fl>
        <div className="grid grid-cols-2 gap-4">
          <Fl label="Début" required><input type="date" value={closureForm.from} onChange={e => setClosureForm({ ...closureForm, from: e.target.value })} className={IC} /></Fl>
          <Fl label="Fin" required><input type="date" value={closureForm.to} onChange={e => setClosureForm({ ...closureForm, to: e.target.value })} className={IC} /></Fl>
        </div>
        <Fl label="Note"><input type="text" value={closureForm.note} onChange={e => setClosureForm({ ...closureForm, note: e.target.value })} className={IC} placeholder="OTA bloquées..." /></Fl>
      </ConfigModal>
    </>
  );
};
