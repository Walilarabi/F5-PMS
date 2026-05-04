import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigModal, Fl, IC, SC } from './ConfigUtils';

interface S1to7Props {
  activeTab: string;
  toast: (msg: string, type?: any) => void;
  // Section 1
  hotelConfig: any; setHotelConfig: (v: any) => void;
  // Section 2
  users: any[]; setUsers: (v: any) => void;
  userModalOpen: boolean; setUserModalOpen: (v: boolean) => void;
  editingUser: string | null; setEditingUser: (v: string | null) => void;
  userForm: any; setUserForm: (v: any) => void;
  selectedRoleMatrix: string; setSelectedRoleMatrix: (v: string) => void;
  accessMatrix: any; setAccessMatrix: (v: any) => void;
  // Section 3
  typologies: any[]; setTypologies: (v: any) => void;
  categories: any[]; setCategories: (v: any) => void;
  views: string[]; setViews: (v: any) => void;
  bathrooms: string[]; setBathrooms: (v: any) => void;
  ratePlans: any[]; setRatePlans: (v: any) => void;
  ratePlanModalOpen: boolean; setRatePlanModalOpen: (v: boolean) => void;
  editingRatePlan: string | null; setEditingRatePlan: (v: string | null) => void;
  ratePlanForm: any; setRatePlanForm: (v: any) => void;
  roomConfig: any; setRoomConfig: (v: any) => void;
  roomsList: any[]; setRoomsList: (v: any) => void;
  cascadeSource: string; setCascadeSource: (v: string) => void;
  cascadeTarget: string; setCascadeTarget: (v: string) => void;
  cascadeDelta: string; setCascadeDelta: (v: string) => void;
  // Section 4
  channels: any[]; setChannels: (v: any) => void;
  syncingChannel: string | null; setSyncingChannel: (v: string | null) => void;
  // Section 5
  reportConfig: any; setReportConfig: (v: any) => void;
  selectedReports: string[]; setSelectedReports: (v: any) => void;
  sendingReport: boolean; setSendingReport: (v: boolean) => void;
  // Section 6
  securityConfig: any; setSecurityConfig: (v: any) => void;
  apiKeys: any[]; setApiKeys: (v: any) => void;
  auditLogs: any[];
  // Section 7
  prefs: any; setPrefs: (v: any) => void;
  // Mapping props
  partnerMappings: any[]; setPartnerMappings: (v: any) => void;
}

const accessModules = ['Planning', 'Today', 'Réservations', 'Facturation', 'Rapports', 'Housekeeping', 'Configuration'];
const availableReports = ['EXP-01 Occupation', 'EXP-05 Planning du jour', 'FIN-01 Prestations', 'FIN-11 Caisse', 'STA-01 Dashboard', 'DIR-01 Synthèse Direction'];

export const ConfigSections1to7: React.FC<S1to7Props> = (p) => {
  const {
    activeTab, toast,
    hotelConfig, setHotelConfig,
    users, setUsers, userModalOpen, setUserModalOpen, editingUser, setEditingUser, userForm, setUserForm,
    selectedRoleMatrix, setSelectedRoleMatrix, accessMatrix, setAccessMatrix,
    typologies, setTypologies, categories, setCategories, views, bathrooms, ratePlans, setRatePlans,
    ratePlanModalOpen, setRatePlanModalOpen, editingRatePlan, setEditingRatePlan, ratePlanForm, setRatePlanForm,
    roomConfig, setRoomConfig, roomsList, setRoomsList,
    cascadeSource, setCascadeSource, cascadeTarget, setCascadeTarget, cascadeDelta, setCascadeDelta,
    channels, setChannels, syncingChannel, setSyncingChannel,
    reportConfig, setReportConfig, selectedReports, setSelectedReports, sendingReport, setSendingReport,
    securityConfig, setSecurityConfig, apiKeys, setApiKeys, auditLogs,
    prefs, setPrefs,
    partnerMappings, setPartnerMappings,
  } = p;

  const handleAddUser = () => { setEditingUser(null); setUserForm({ id: '', name: '', email: '', role: 'Réceptionniste', password: '', active: true }); setUserModalOpen(true); };
  const handleEditUser = (u: any) => { setEditingUser(u.id); setUserForm({ ...u, password: '' }); setUserModalOpen(true); };
  const handleDeleteUser = (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    setUsers((prev: any[]) => prev.filter(u => u.id !== id));
    toast('Utilisateur supprimé', 'success');
  };
  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) { toast('Nom et email requis', 'error'); return; }
    if (editingUser) {
      setUsers((prev: any[]) => prev.map(u => u.id === editingUser ? { ...u, ...userForm } : u));
      toast('Utilisateur modifié', 'success');
    } else {
      setUsers((prev: any[]) => [...prev, { ...userForm, id: Date.now().toString(), lastLogin: 'Jamais' }]);
      toast('Utilisateur ajouté', 'success');
    }
    setUserModalOpen(false);
  };

  const generateRooms = () => {
    const out: any[] = []; let count = 0;
    for (let f = 1; f <= roomConfig.floors; f++) {
      const n = Math.floor(roomConfig.total / roomConfig.floors) + (f <= roomConfig.total % roomConfig.floors ? 1 : 0);
      const start = parseInt(roomConfig.firstRoom || '1');
      for (let r = 0; r < n && count < roomConfig.total; r++, count++) {
        const t = typologies[count % typologies.length] || typologies[0];
        const c = categories[count % categories.length] || categories[0];
        out.push({ id: `${f}${start + r}`, num: roomConfig.format.replace('{etage}', f).replace('{numero}', (start + r).toString().padStart(2, '0')), type: t.name, category: c.name, floor: f, view: views[0] || 'Rue', surface: t.minSurf, bathroom: bathrooms[0] || 'Douche' });
      }
    }
    setRoomsList(out); toast(`${out.length} chambres générées`, 'success');
  };

  const handleAddRatePlan = () => { setEditingRatePlan(null); setRatePlanForm({ id: '', code: '', name: '', basePrice: 100, pension: 'Room Only', cancel: 'Flexible (J-3)', vat: 10 }); setRatePlanModalOpen(true); };
  const handleEditRatePlan = (rp: any) => { setEditingRatePlan(rp.id); setRatePlanForm({ ...rp }); setRatePlanModalOpen(true); };
  const handleDeleteRatePlan = (id: string) => { if (!window.confirm('Supprimer ce plan ?')) return; setRatePlans((prev: any[]) => prev.filter(r => r.id !== id)); toast('Plan supprimé', 'success'); };
  const handleSaveRatePlan = () => {
    if (!ratePlanForm.code || !ratePlanForm.name) { toast('Code et nom requis', 'error'); return; }
    if (editingRatePlan) { setRatePlans((prev: any[]) => prev.map(r => r.id === editingRatePlan ? { ...r, ...ratePlanForm } : r)); toast('Plan modifié', 'success'); }
    else { setRatePlans((prev: any[]) => [...prev, { ...ratePlanForm, id: Date.now().toString() }]); toast('Plan ajouté', 'success'); }
    setRatePlanModalOpen(false);
  };
  const handleApplyCascade = () => {
    const src = ratePlans.find(r => r.id === cascadeSource);
    const tgt = ratePlans.find(r => r.id === cascadeTarget);
    if (!src || !tgt || src.id === tgt.id) { toast('Sélectionnez des tarifs différents', 'error'); return; }
    const pct = cascadeDelta.includes('%');
    const d = parseFloat(cascadeDelta);
    const newP = pct ? Math.round(src.basePrice * (1 + d / 100)) : src.basePrice + d;
    setRatePlans((prev: any[]) => prev.map(r => r.id === cascadeTarget ? { ...r, basePrice: newP } : r));
    toast(`Cascade : ${tgt.name} → ${newP}€`, 'success');
  };

  const handleToggleChannel = (id: string) => {
    const ch = channels.find((c: any) => c.id === id);
    setChannels((prev: any[]) => prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c));
    toast(`${ch?.name} ${ch?.connected ? 'déconnecté' : 'connecté'}`, 'success');
  };
  const handleSyncChannel = async (id: string) => {
    setSyncingChannel(id); await new Promise(r => setTimeout(r, 1400));
    setChannels((prev: any[]) => prev.map(c => c.id === id ? { ...c, lastSync: "À l'instant" } : c));
    setSyncingChannel(null); toast('Synchronisation réussie', 'success');
  };
  const handleSyncAll = async () => {
    setSyncingChannel('all'); await new Promise(r => setTimeout(r, 2000));
    setChannels((prev: any[]) => prev.map(c => c.connected ? { ...c, lastSync: "À l'instant" } : c));
    setSyncingChannel(null); toast('Tous les canaux synchronisés', 'success');
  };

  const handleSendReportNow = async () => {
    setSendingReport(true); await new Promise(r => setTimeout(r, 1500));
    setSendingReport(false); toast(`${selectedReports.length} rapport(s) envoyé(s) à ${reportConfig.recipients}`, 'success');
  };

  const handleGenerateApiKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const key = 'sk_live_' + Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setApiKeys((prev: any[]) => [...prev, { id: Date.now().toString(), label: 'Nouvelle clé', key, created: new Date().toISOString().slice(0, 10), active: true }]);
    toast('Clé API générée', 'success');
  };
  const handleRevokeApiKey = (id: string) => {
    if (!window.confirm('Révoquer cette clé ?')) return;
    setApiKeys((prev: any[]) => prev.filter(k => k.id !== id));
    toast('Clé révoquée', 'success');
  };
  const copyKey = (key: string) => { navigator.clipboard?.writeText(key).catch(() => {}); toast('Clé copiée !', 'success'); };

  // --- Mapping Handlers ---
  const handleAddMapping = () => {
    setPartnerMappings([...partnerMappings, { id: `temp_${Date.now()}`, partner_id: '', room_types: [], room_numbers: [], rate_plans: [] }]);
  };
  const handleDeleteMapping = (id: string) => {
    if (!window.confirm('Supprimer ce mapping ?')) return;
    setPartnerMappings(partnerMappings.filter(m => m.id !== id));
  };
  const handleUpdateMapping = (id: string, field: string, value: any) => {
    setPartnerMappings(partnerMappings.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <>
      {/* ===== SECTION 1: HOTEL ===== */}
      {activeTab === 'hotel' && (
        <>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-building text-primary" /> Informations Générales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nom de l'établissement</label><input type="text" value={hotelConfig.name} onChange={e => setHotelConfig({ ...hotelConfig, name: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Pays</label><select value={hotelConfig.country} onChange={e => setHotelConfig({ ...hotelConfig, country: e.target.value })} className={SC}><option>France</option><option>Belgique</option><option>Suisse</option><option>Maroc</option><option>Tunisie</option></select></div>
              <div className="md:col-span-2"><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Adresse</label><input type="text" value={hotelConfig.address} onChange={e => setHotelConfig({ ...hotelConfig, address: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Code Postal</label><input type="text" value={hotelConfig.zip} onChange={e => setHotelConfig({ ...hotelConfig, zip: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Ville</label><input type="text" value={hotelConfig.city} onChange={e => setHotelConfig({ ...hotelConfig, city: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Téléphone</label><input type="tel" value={hotelConfig.phone} onChange={e => setHotelConfig({ ...hotelConfig, phone: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Site Web</label><input type="url" value={hotelConfig.website} onChange={e => setHotelConfig({ ...hotelConfig, website: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email Général</label><input type="email" value={hotelConfig.emailGeneral} onChange={e => setHotelConfig({ ...hotelConfig, emailGeneral: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email Réservations</label><input type="email" value={hotelConfig.emailResa} onChange={e => setHotelConfig({ ...hotelConfig, emailResa: e.target.value })} className={IC} /></div>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-globe text-primary" /> Paramètres Régionaux & Taxes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Devise</label><select value={hotelConfig.currency} onChange={e => setHotelConfig({ ...hotelConfig, currency: e.target.value })} className={SC}><option>EUR</option><option>USD</option><option>GBP</option><option>MAD</option></select></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Fuseau horaire</label><select value={hotelConfig.timezone} onChange={e => setHotelConfig({ ...hotelConfig, timezone: e.target.value })} className={SC}><option>Europe/Paris</option><option>Europe/London</option><option>Africa/Casablanca</option></select></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Langue par défaut</label><select value={hotelConfig.language} onChange={e => setHotelConfig({ ...hotelConfig, language: e.target.value })} className={SC}><option>Français</option><option>English</option><option>Español</option></select></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">TVA (%)</label><input type="number" value={hotelConfig.vat} onChange={e => setHotelConfig({ ...hotelConfig, vat: Number(e.target.value) })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Taxe séjour (€/nuit)</label><input type="number" step="0.10" value={hotelConfig.cityTax} onChange={e => setHotelConfig({ ...hotelConfig, cityTax: Number(e.target.value) })} className={IC} /></div>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Check-in par défaut</label><input type="time" value={hotelConfig.checkin} onChange={e => setHotelConfig({ ...hotelConfig, checkin: e.target.value })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Check-out par défaut</label><input type="time" value={hotelConfig.checkout} onChange={e => setHotelConfig({ ...hotelConfig, checkout: e.target.value })} className={IC} /></div>
            </div>
          </section>
        </>
      )}

      {/* ===== SECTION 2: USERS ===== */}
      {activeTab === 'users' && (
        <>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-users-cog text-primary" /> Utilisateurs</h4>
              <button onClick={handleAddUser} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Nom & Email</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Rôle</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Statut</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400 text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="font-bold text-slate-800">{u.name}</div><div className="text-[11px] text-slate-400">{u.email}</div></td>
                      <td className="px-4 py-3"><span className="bg-violet-100 text-violet-700 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider">{u.role}</span></td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.active ? 'Actif' : 'Inactif'}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleEditUser(u)} className="p-2 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-pen text-[12px]" /></button>
                        <button onClick={() => setUsers((prev: any[]) => prev.map(uu => uu.id === u.id ? { ...uu, active: !uu.active } : uu))} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><i className={`fa-solid ${u.active ? 'fa-ban' : 'fa-check'} text-[12px]`} /></button>
                        {u.role !== 'Admin' && <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash text-[12px]" /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-key text-primary" /> Matrice des Accès</h4>
              <div className="flex items-center gap-3">
                <select value={selectedRoleMatrix} onChange={e => setSelectedRoleMatrix(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] font-semibold outline-none focus:border-primary">
                  {Object.keys(accessMatrix).map(r => <option key={r}>{r}</option>)}
                </select>
                <button onClick={() => toast('Permissions sauvegardées', 'success')} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-save mr-1" />Sauvegarder</button>
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0"><tr>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400 w-1/3">Module</th>
                  {['Lecture', 'Écriture', 'Suppression', 'Export'].map(h => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase text-slate-400 text-center">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {accessModules.map(mod => {
                    const r = accessMatrix[selectedRoleMatrix] || { read: false, write: false, delete: false, export: false };
                    const isAdmin = selectedRoleMatrix === 'Admin';
                    return (
                      <tr key={mod} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{mod}</td>
                        {(['read', 'write', 'delete', 'export'] as const).map(perm => (
                          <td key={perm} className="px-4 py-3 text-center">
                            <input type="checkbox" checked={isAdmin || r[perm]} disabled={isAdmin}
                              onChange={e => setAccessMatrix((prev: any) => ({ ...prev, [selectedRoleMatrix]: { ...r, [perm]: e.target.checked } }))}
                              className="accent-primary w-4 h-4 cursor-pointer" />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ===== SECTION 3: ROOMS & RATES ===== */}
      {activeTab === 'rooms' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-bed text-primary" /> Typologies</h4>
                <button onClick={() => setTypologies((p: any[]) => [...p, { id: Date.now().toString(), code: 'NEW', name: 'Nouveau', maxCap: 2, minSurf: 15, maxSurf: 25 }])} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-plus" /></button>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Nom</th>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Code</th>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Cap</th>
                    <th className="px-3 py-2 text-right text-[11px] font-black uppercase text-slate-400">Del</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {typologies.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5"><input value={t.name} onChange={e => setTypologies((p: any[]) => p.map(tt => tt.id === t.id ? { ...tt, name: e.target.value } : tt))} className="w-full bg-transparent border-b border-transparent focus:border-primary px-1 py-1 outline-none font-semibold text-slate-700" /></td>
                        <td className="px-3 py-1.5"><input value={t.code} onChange={e => setTypologies((p: any[]) => p.map(tt => tt.id === t.id ? { ...tt, code: e.target.value.toUpperCase() } : tt))} className="w-16 bg-slate-50 px-2 py-1 rounded font-bold text-primary uppercase text-[11px]" /></td>
                        <td className="px-3 py-1.5"><input type="number" value={t.maxCap} onChange={e => setTypologies((p: any[]) => p.map(tt => tt.id === t.id ? { ...tt, maxCap: Number(e.target.value) } : tt))} className="w-12 bg-transparent px-1 py-1 outline-none font-semibold text-slate-700" /></td>
                        <td className="px-3 py-1.5 text-right"><button onClick={() => { setTypologies((p: any[]) => p.filter(tt => tt.id !== t.id)); toast('Supprimé', 'success'); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><i className="fa-solid fa-trash text-[11px]" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-star text-primary" /> Catégories</h4>
                <button onClick={() => setCategories((p: any[]) => [...p, { id: Date.now().toString(), code: 'NEW', name: 'Nouveau', mult: 1.0, color: '#e2e8f0' }])} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all"><i className="fa-solid fa-plus" /></button>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Nom</th>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Mult.</th>
                    <th className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">Couleur</th>
                    <th className="px-3 py-2 text-right text-[11px] font-black uppercase text-slate-400">Del</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {categories.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5"><input value={c.name} onChange={e => setCategories((p: any[]) => p.map(cc => cc.id === c.id ? { ...cc, name: e.target.value } : cc))} className="w-full bg-transparent border-b border-transparent focus:border-primary px-1 py-1 outline-none font-semibold text-slate-700" /></td>
                        <td className="px-3 py-1.5"><input type="number" step="0.1" value={c.mult} onChange={e => setCategories((p: any[]) => p.map(cc => cc.id === c.id ? { ...cc, mult: Number(e.target.value) } : cc))} className="w-16 bg-transparent px-1 py-1 outline-none font-semibold text-slate-700" /></td>
                        <td className="px-3 py-1.5"><input type="color" value={c.color} onChange={e => setCategories((p: any[]) => p.map(cc => cc.id === c.id ? { ...cc, color: e.target.value } : cc))} className="w-8 h-8 rounded border-none cursor-pointer" /></td>
                        <td className="px-3 py-1.5 text-right"><button onClick={() => { setCategories((p: any[]) => p.filter(cc => cc.id !== c.id)); toast('Supprimée', 'success'); }} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><i className="fa-solid fa-trash text-[11px]" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-layer-group text-primary" /> Génération Automatique du Parc</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nb chambres</label><input type="number" value={roomConfig.total} onChange={e => setRoomConfig({ ...roomConfig, total: Number(e.target.value) })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nb étages</label><input type="number" value={roomConfig.floors} onChange={e => setRoomConfig({ ...roomConfig, floors: Number(e.target.value) })} className={IC} /></div>
              <div className="md:col-span-2"><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Format</label>
                <select value={roomConfig.format} onChange={e => setRoomConfig({ ...roomConfig, format: e.target.value })} className={SC}>
                  <option value="{etage}{numero}">Ex: 101, 203</option>
                  <option value="{numero}">Ex: 01, 02</option>
                  <option value="Ch{etage}-{numero}">Ex: Ch1-01</option>
                </select>
              </div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">1ère ch.</label><input type="text" value={roomConfig.firstRoom} onChange={e => setRoomConfig({ ...roomConfig, firstRoom: e.target.value })} className={IC} /></div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={generateRooms} className="bg-primary hover:bg-[#7b4be8] text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"><i className="fa-solid fa-magic" /> Générer Automatiquement</button>
              <button onClick={() => toast('Import Excel — En préparation', 'info')} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ml-auto flex items-center gap-2"><i className="fa-solid fa-file-excel" /> Import Excel</button>
            </div>
            {roomsList.length > 0 && (
              <div className="mt-6 overflow-x-auto border border-slate-100 rounded-xl max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-[13px] whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0"><tr>
                    {['Étage', 'N°', 'Typol.', 'Catég.', 'M²', 'Vue', 'SdB'].map(h => <th key={h} className="px-3 py-2 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {roomsList.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-500 font-semibold">{r.floor}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-800">{r.num}</td>
                        <td className="px-3 py-1.5"><select value={r.type} onChange={e => setRoomsList((p: any[]) => p.map((rr, j) => j === i ? { ...rr, type: e.target.value } : rr))} className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none">{typologies.map((t: any) => <option key={t.id}>{t.name}</option>)}</select></td>
                        <td className="px-3 py-1.5"><select value={r.category} onChange={e => setRoomsList((p: any[]) => p.map((rr, j) => j === i ? { ...rr, category: e.target.value } : rr))} className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none">{categories.map((c: any) => <option key={c.id}>{c.name}</option>)}</select></td>
                        <td className="px-3 py-1.5"><input type="number" value={r.surface} onChange={e => setRoomsList((p: any[]) => p.map((rr, j) => j === i ? { ...rr, surface: Number(e.target.value) } : rr))} className="w-14 bg-transparent p-1 text-[12px] font-semibold outline-none" /></td>
                        <td className="px-3 py-1.5"><select value={r.view} onChange={e => setRoomsList((p: any[]) => p.map((rr, j) => j === i ? { ...rr, view: e.target.value } : rr))} className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none">{views.map((v: string) => <option key={v}>{v}</option>)}</select></td>
                        <td className="px-3 py-1.5"><select value={r.bathroom} onChange={e => setRoomsList((p: any[]) => p.map((rr, j) => j === i ? { ...rr, bathroom: e.target.value } : rr))} className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none">{bathrooms.map((b: string) => <option key={b}>{b}</option>)}</select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-tags text-primary" /> Plans Tarifaires</h4>
                <button onClick={handleAddRatePlan} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Ajouter</button>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                    <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Code & Nom</th>
                    <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Prix</th>
                    <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Pension</th>
                    <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Annul.</th>
                    <th className="px-4 py-3 text-right text-[11px] font-black uppercase text-slate-400">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {ratePlans.map((rp: any) => (
                      <tr key={rp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1 inline-block">{rp.code}</span><div className="font-bold text-slate-800">{rp.name}</div></td>
                        <td className="px-4 py-3 font-black text-emerald-600">{rp.basePrice}€</td>
                        <td className="px-4 py-3 text-slate-500 text-[12px]">{rp.pension}</td>
                        <td className="px-4 py-3 text-slate-500 text-[12px]">{rp.cancel}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleEditRatePlan(rp)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-pen text-[12px]" /></button>
                          <button onClick={() => handleDeleteRatePlan(rp.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash text-[12px]" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="lg:col-span-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-8 shadow-sm text-white">
              <h4 className="text-[15px] font-black flex items-center gap-2 mb-2"><i className="fa-solid fa-link" /> Cascade Tarif</h4>
              <p className="text-[11px] font-semibold text-violet-100 mb-6 leading-relaxed">Liez un tarif référent à un plan enfant avec variation automatique.</p>
              <div className="space-y-4">
                <div><label className="text-[11px] font-bold text-violet-200 uppercase block mb-1">Tarif Référent</label><select value={cascadeSource} onChange={e => setCascadeSource(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none text-white">{ratePlans.map((r: any) => <option key={r.id} value={r.id} className="text-slate-800">{r.code}</option>)}</select></div>
                <div><label className="text-[11px] font-bold text-violet-200 uppercase block mb-1">Tarif Cible</label><select value={cascadeTarget} onChange={e => setCascadeTarget(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-[13px] font-semibold outline-none text-white">{ratePlans.map((r: any) => <option key={r.id} value={r.id} className="text-slate-800">{r.code}</option>)}</select></div>
                <div><label className="text-[11px] font-bold text-violet-200 uppercase block mb-1">Dérivation (ex: -10%)</label><input type="text" value={cascadeDelta} onChange={e => setCascadeDelta(e.target.value)} className="w-full bg-white text-slate-800 border-none rounded-xl px-4 py-2.5 text-[13px] font-bold outline-none" /></div>
                <button onClick={handleApplyCascade} className="w-full bg-white text-primary hover:bg-slate-50 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg">Lier les tarifs</button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ===== SECTION 4: CHANNELS ===== */}
      {activeTab === 'channels' && (
        <div className="space-y-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-network-wired text-primary" /> Canaux de Distribution (OTA)</h4>
              <button onClick={handleSyncAll} disabled={syncingChannel === 'all'} className="bg-primary hover:bg-[#7b4be8] text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 disabled:opacity-70">
                <i className={`fa-solid fa-sync-alt ${syncingChannel === 'all' ? 'animate-spin' : ''}`} /> {syncingChannel === 'all' ? 'Sync...' : 'Sync Maintenant'}
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Canal</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Statut</th>
                  <th className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">Dernière Sync</th>
                  <th className="px-4 py-3 text-right text-[11px] font-black uppercase text-slate-400">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {channels.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-black text-slate-700">{c.name}</td>
                      <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${c.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.connected ? 'Connecté' : 'Déconnecté'}</span></td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-400">{c.lastSync}</td>
                      <td className="px-4 py-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => handleSyncChannel(c.id)} disabled={!c.connected || syncingChannel === c.id} className="text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                          <i className={`fa-solid fa-sync-alt mr-1 ${syncingChannel === c.id ? 'animate-spin' : ''}`} />Sync
                        </button>
                        <button onClick={() => handleToggleChannel(c.id)} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${c.connected ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                          {c.connected ? 'Déconnecter' : 'Connecter'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h5 className="text-[14px] font-black text-slate-700 flex items-center gap-2">
                <i className="fa-solid fa-link text-primary" /> Mapping tarifs → partenaires
              </h5>
              <button onClick={handleAddMapping} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
                <i className="fa-solid fa-plus mr-1" /> Ajouter un mapping
              </button>
            </div>
            <div className="space-y-4">
              {partnerMappings.map((m, idx) => (
                <div key={m.id || idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-[4px] h-full bg-primary/30 group-hover:bg-primary transition-colors" />
                  <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-[240px]">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Partenaire</label>
                      <select value={m.partner_id} onChange={(e) => handleUpdateMapping(m.id, 'partner_id', e.target.value)} className={SC}>
                        <option value="">Sélectionner</option>
                        <option value="booking">Booking.com</option>
                        <option value="expedia">Expedia</option>
                        <option value="agoda">Agoda</option>
                        <option value="direct">Direct</option>
                        <option value="airbnb">Airbnb</option>
                        <option value="hotelbeds">Hotelbeds</option>
                        <option value="trip">Trip.com</option>
                      </select>
                    </div>
                    <button onClick={() => handleDeleteMapping(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 font-black text-sm"><i className="fa-solid fa-trash-alt" /></button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Types de chambres</label>
                      <div className="flex flex-wrap gap-2">
                        {typologies.map(t => (
                          <label key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${m.room_types?.includes(t.name) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}>
                            <input type="checkbox" className="hidden" checked={m.room_types?.includes(t.name) || false} onChange={e => {
                              const list = m.room_types || [];
                              if (e.target.checked) handleUpdateMapping(m.id, 'room_types', [...list, t.name]);
                              else handleUpdateMapping(m.id, 'room_types', list.filter((x: string) => x !== t.name));
                            }} /> {t.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plans tarifaires</label>
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr><th className="px-3 py-2 font-black uppercase text-slate-400">Plan</th><th className="px-3 py-2 font-black uppercase text-slate-400 text-right">Actif</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {ratePlans.map(rp => (
                              <tr key={rp.id} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2.5">
                                  <div className="font-bold text-slate-700 leading-none mb-1">{rp.code}</div>
                                  <div className="text-[9px] text-slate-400 font-bold uppercase">{rp.pension} · {rp.cancel}</div>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <input type="checkbox" checked={m.rate_plans?.includes(rp.id) || false} onChange={e => {
                                    const list = m.rate_plans || [];
                                    if (e.target.checked) handleUpdateMapping(m.id, 'rate_plans', [...list, rp.id]);
                                    else handleUpdateMapping(m.id, 'rate_plans', list.filter((x: string) => x !== rp.id));
                                  }} className="accent-primary" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {partnerMappings.length === 0 && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <p className="font-bold mb-3">Aucun mapping configuré</p>
                  <button onClick={handleAddMapping} className="bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm">+ Ajouter le premier mapping</button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ===== SECTION 5: REPORTS ===== */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-cogs text-primary" /> Automatisations d'envoi</h4>
            <div className="space-y-4">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Fréquence</label><select value={reportConfig.freq} onChange={e => setReportConfig({ ...reportConfig, freq: e.target.value })} className={SC}><option>Quotidien</option><option>Hebdomadaire</option><option>Mensuel</option></select></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Format</label><select value={reportConfig.format} onChange={e => setReportConfig({ ...reportConfig, format: e.target.value })} className={SC}><option>PDF</option><option>Excel</option><option>CSV</option></select></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Destinataires</label><input type="text" value={reportConfig.recipients} onChange={e => setReportConfig({ ...reportConfig, recipients: e.target.value })} className={IC} /></div>
              <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer"><input type="checkbox" checked={reportConfig.autoEmail} onChange={e => setReportConfig({ ...reportConfig, autoEmail: e.target.checked })} className="accent-primary w-4 h-4" /><span className="text-[13px] font-bold text-slate-700">Envoi automatique activé</span></label>
              <button onClick={handleSendReportNow} disabled={sendingReport} className="w-full bg-slate-800 hover:bg-black text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                <i className={`fa-solid ${sendingReport ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> {sendingReport ? 'Envoi...' : 'Envoyer maintenant'}
              </button>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-file-invoice text-primary" /> Rapports Sélectionnés</h4>
            <div className="space-y-2">
              {availableReports.map(rp => (
                <label key={rp} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedReports.includes(rp) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={selectedReports.includes(rp)} onChange={e => { if (e.target.checked) setSelectedReports((p: string[]) => [...p, rp]); else setSelectedReports((p: string[]) => p.filter(r => r !== rp)); }} className="accent-primary w-4 h-4" />
                  <span className="text-[13px] font-bold text-slate-700">{rp}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ===== SECTION 6: SECURITY ===== */}
      {activeTab === 'security' && (
        <>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-lock text-primary" /> Paramètres de Sécurité</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Session (min)</label><input type="number" value={securityConfig.sessionDuration} onChange={e => setSecurityConfig({ ...securityConfig, sessionDuration: Number(e.target.value) })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Tentatives Max</label><input type="number" value={securityConfig.maxAttempts} onChange={e => setSecurityConfig({ ...securityConfig, maxAttempts: Number(e.target.value) })} className={IC} /></div>
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Verrouillage (min)</label><input type="number" value={securityConfig.lockoutDuration} onChange={e => setSecurityConfig({ ...securityConfig, lockoutDuration: Number(e.target.value) })} className={IC} /></div>
            </div>
            <label className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl cursor-pointer w-fit">
              <input type="checkbox" checked={securityConfig.twoFactor} onChange={e => setSecurityConfig({ ...securityConfig, twoFactor: e.target.checked })} className="accent-primary w-4 h-4" />
              <span className="text-[13px] font-bold text-slate-700">Imposer l'Authentification 2FA</span>
            </label>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-code text-primary" /> Clés API</h4>
              <button onClick={handleGenerateApiKey} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"><i className="fa-solid fa-plus mr-1" /> Générer une clé</button>
            </div>
            <div className="space-y-3">
              {apiKeys.map((k: any) => (
                <div key={k.id} className="flex items-center gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                  <div className="flex-1 min-w-0"><div className="font-bold text-slate-800 text-[13px]">{k.label}</div><div className="font-mono text-[11px] text-slate-400 truncate">{k.key}</div></div>
                  <button onClick={() => copyKey(k.key)} className="text-slate-400 hover:text-primary p-2 transition-colors"><i className="fa-solid fa-copy" /></button>
                  <button onClick={() => handleRevokeApiKey(k.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors"><i className="fa-solid fa-trash" /></button>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-user-secret text-primary" /> Journal des connexions</h4>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                  {['Date', 'Utilisateur', 'Action', 'Entité', 'Détails'].map(h => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-400">{log.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{log.user}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{log.action}</span></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 font-black uppercase">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ===== SECTION 7: PREFERENCES ===== */}
      {activeTab === 'prefs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-paint-roller text-primary" /> Apparence</h4>
            <div className="space-y-5">
              <div><label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Thème</label>
                <div className="flex gap-3">{['Clair', 'Sombre', 'Auto'].map(t => <button key={t} onClick={() => setPrefs({ ...prefs, theme: t })} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${prefs.theme === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{t}</button>)}</div>
              </div>
              <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer border border-slate-100"><input type="checkbox" checked={prefs.animations} onChange={e => setPrefs({ ...prefs, animations: e.target.checked })} className="accent-primary w-4 h-4" /><span className="text-[13px] font-bold text-slate-700">Activer les animations (Motion)</span></label>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2 mb-6"><i className="fa-solid fa-bell text-primary" /> Notifications</h4>
            <div className="space-y-3">
              <label className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl cursor-pointer hover:shadow-sm transition-shadow"><span className="text-[13px] font-bold text-slate-700">Email de confirmation automatique</span><input type="checkbox" checked={prefs.emailConfirm} onChange={e => setPrefs({ ...prefs, emailConfirm: e.target.checked })} className="accent-primary w-4 h-4" /></label>
              <div className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl"><span className="text-[13px] font-bold text-slate-700">Rappel avant arrivée (jours)</span><div className="flex items-center gap-3"><input type="number" value={prefs.reminderDays} onChange={e => setPrefs({ ...prefs, reminderDays: Number(e.target.value) })} className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-center text-[13px] font-bold outline-none" /><input type="checkbox" checked={prefs.emailReminder} onChange={e => setPrefs({ ...prefs, emailReminder: e.target.checked })} className="accent-primary w-4 h-4" /></div></div>
              <label className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl cursor-pointer hover:shadow-sm transition-shadow"><span className="text-[13px] font-bold text-slate-700">Notification Ménage terminé</span><input type="checkbox" checked={prefs.notifHousekeeping} onChange={e => setPrefs({ ...prefs, notifHousekeeping: e.target.checked })} className="accent-primary w-4 h-4" /></label>
            </div>
          </section>
        </div>
      )}

      {/* ===== MODALS: SECTIONS 1-7 ===== */}
      <ConfigModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'} onSave={handleSaveUser}>
        <Fl label="Nom complet" required><input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className={IC} placeholder="Jean Dupont" /></Fl>
        <Fl label="Email" required><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className={IC} placeholder="jean@hotel.com" /></Fl>
        <Fl label="Rôle"><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className={SC}><option>Admin</option><option>Direction</option><option>Réceptionniste</option><option>Gouvernante</option><option>Comptable</option><option>Maintenance</option></select></Fl>
        {!editingUser && <Fl label="Mot de passe" required><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className={IC} placeholder="••••••••" /></Fl>}
      </ConfigModal>

      <ConfigModal isOpen={ratePlanModalOpen} onClose={() => setRatePlanModalOpen(false)} title={editingRatePlan ? 'Modifier le plan' : 'Nouveau plan tarifaire'} onSave={handleSaveRatePlan}>
        <Fl label="Code" required><input type="text" value={ratePlanForm.code} onChange={e => setRatePlanForm({ ...ratePlanForm, code: e.target.value.toUpperCase() })} className={IC} placeholder="RACK-RO-FLEX" /></Fl>
        <Fl label="Nom" required><input type="text" value={ratePlanForm.name} onChange={e => setRatePlanForm({ ...ratePlanForm, name: e.target.value })} className={IC} placeholder="Public Flexible" /></Fl>
        <Fl label="Prix Base (€)"><input type="number" value={ratePlanForm.basePrice} onChange={e => setRatePlanForm({ ...ratePlanForm, basePrice: Number(e.target.value) })} className={IC} /></Fl>
        <Fl label="Pension"><select value={ratePlanForm.pension} onChange={e => setRatePlanForm({ ...ratePlanForm, pension: e.target.value })} className={SC}><option>Room Only</option><option>BB</option><option>HB</option><option>FB</option></select></Fl>
        <Fl label="Politique d'annulation"><select value={ratePlanForm.cancel} onChange={e => setRatePlanForm({ ...ratePlanForm, cancel: e.target.value })} className={SC}><option>Flexible (J-3)</option><option>Modérée (J-7)</option><option>Non remboursable</option></select></Fl>
      </ConfigModal>
    </>
  );
};
