import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigModal, Fl, IC, SC } from './ConfigUtils';

// ===== TYPES =====
interface EmailTemplate {
  id: string; event_type: string; language: string; channel: string;
  subject: string; body_html: string; variables: string[];
  is_active: boolean; created_at: string; updated_at: string;
  tone?: string;
}
interface SendLog {
  id: string; date: string; recipient: string; event: string;
  status: 'sent' | 'error' | 'pending'; subject: string; body: string;
}

// ===== CONSTANTS =====
const EVENT_TYPES = [
  { id: 'confirmation',    label: 'Confirmation de réservation', icon: 'fa-check-circle',      color: 'emerald', vars: ['{{client_nom}}','{{client_prenom}}','{{dates}}','{{chambre}}','{{montant}}','{{hotel_nom}}','{{receptionniste}}'] },
  { id: 'modification',    label: 'Modification de réservation', icon: 'fa-edit',              color: 'blue',    vars: ['{{client_nom}}','{{anciennes_dates}}','{{nouvelles_dates}}','{{ancienne_chambre}}','{{nouvelle_chambre}}'] },
  { id: 'annulation',      label: 'Annulation de réservation',  icon: 'fa-times-circle',      color: 'rose',    vars: ['{{client_nom}}','{{dates}}','{{chambre}}','{{motif}}'] },
  { id: 'rappel_j3',       label: 'Rappel avant arrivée (J-3)', icon: 'fa-clock',             color: 'amber',   vars: ['{{client_nom}}','{{dates}}','{{chambre}}','{{heure_checkin}}','{{lien_paiement}}'] },
  { id: 'rappel_j1',       label: 'Rappel avant arrivée (J-1)', icon: 'fa-bell',              color: 'amber',   vars: ['{{client_nom}}','{{dates}}','{{chambre}}','{{heure_checkin}}','{{hotel_adresse}}'] },
  { id: 'facture',         label: 'Facture / Reçu',             icon: 'fa-file-invoice-dollar',color: 'violet', vars: ['{{client_nom}}','{{montant}}','{{montant_ttc}}','{{facture_pdf}}','{{mode_paiement}}','{{dates}}'] },
  { id: 'demande_avis',    label: "Demande d'avis",            icon: 'fa-star',              color: 'yellow',  vars: ['{{client_nom}}','{{lien_avis}}','{{sejour_dates}}','{{hotel_nom}}'] },
  { id: 'promo',           label: 'Offre promotionnelle',       icon: 'fa-percentage',        color: 'pink',    vars: ['{{client_nom}}','{{code_promo}}','{{reduction}}','{{date_expiration}}','{{lien_offre}}'] },
  { id: 'menage_termine',  label: 'Ménage terminé',             icon: 'fa-broom',             color: 'teal',    vars: ['{{chambre}}','{{heure}}','{{gouvernante}}'] },
  { id: 'incident',        label: 'Incident signalé',           icon: 'fa-exclamation-triangle',color:'orange', vars: ['{{chambre}}','{{incident_type}}','{{description}}','{{heure}}','{{signale_par}}'] },
];

const TONES = ['Professionnel', 'Amical', 'Luxe', 'Urgent', 'Formel', 'Chaleureux'];
const LENGTHS = ['Courte', 'Normale', 'Détaillée'];
const LANGUAGES = [{ code: 'fr', label: 'Français', flag: '🇫🇷' }, { code: 'en', label: 'English', flag: '🇬🇧' }, { code: 'de', label: 'Deutsch', flag: '🇩🇪' }, { code: 'es', label: 'Español', flag: '🇪🇸' }];

const PREVIEW_VALUES: Record<string, string> = {
  '{{client_nom}}': 'Larabi', '{{client_prenom}}': 'Ali', '{{dates}}': '15 - 18 Mai 2026',
  '{{chambre}}': 'Suite Royale 201', '{{montant}}': '750,00 €', '{{montant_ttc}}': '825,00 €',
  '{{hotel_nom}}': 'Flowtym Premium Resort', '{{receptionniste}}': 'Sophie Dubois',
  '{{anciennes_dates}}': '10 - 13 Mai 2026', '{{nouvelles_dates}}': '15 - 18 Mai 2026',
  '{{ancienne_chambre}}': '103 - Double Classique', '{{nouvelle_chambre}}': '201 - Suite Royale',
  '{{motif}}': 'Changement de programme personnel', '{{heure_checkin}}': '15h00',
  '{{lien_paiement}}': 'https://pay.flowtym.com/xyz123', '{{hotel_adresse}}': '12 Av. des Champs-Élysées, Paris',
  '{{facture_pdf}}': 'https://flowtym.com/factures/INV-1042.pdf', '{{mode_paiement}}': 'Carte bancaire (Visa)',
  '{{lien_avis}}': 'https://g.page/flowtym-resort', '{{sejour_dates}}': '15 - 18 Mai 2026',
  '{{code_promo}}': 'SUMMER2026', '{{reduction}}': '15%', '{{date_expiration}}': '31 Août 2026',
  '{{lien_offre}}': 'https://flowtym.com/offres/summer', '{{heure}}': '14h32',
  '{{gouvernante}}': 'Nathalie Bernard', '{{incident_type}}': 'Fuite robinet', '{{description}}': 'Robinet salle de bain qui fuit',
  '{{signale_par}}': 'Client',
};

// ===== AI TEMPLATE GENERATOR =====
function generateAITemplate(eventType: string, tone: string, length: string, language: string): { subject: string; body: string } {
  const ev = EVENT_TYPES.find(e => e.id === eventType);
  const evLabel = ev?.label || eventType;
  const isShort = length === 'Courte';
  const isLong = length === 'Détaillée';
  const isFr = language === 'fr';

  const templates: Record<string, { subject: string; body: string }> = {
    confirmation: {
      subject: isFr ? `✅ Confirmation de votre réservation — {{hotel_nom}}` : `✅ Booking Confirmation — {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nNous avons le plaisir de vous confirmer votre réservation au {{hotel_nom}}.\n\n📋 **Détails de votre séjour :**\n• Dates : {{dates}}\n• Chambre : {{chambre}}\n• Montant total : {{montant}}\n\n${isLong ? "Pour toute question ou demande spéciale, n'hésitez pas à nous contacter. Notre équipe se fera un plaisir de vous accompagner pour rendre votre séjour inoubliable.\n\n" : ""}Votre référence : #REF-{{client_nom}}\n\nÀ très bientôt,\n{{receptionniste}}\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nWe are delighted to confirm your reservation at {{hotel_nom}}.\n\n📋 **Booking Details:**\n• Dates: {{dates}}\n• Room: {{chambre}}\n• Total Amount: {{montant}}\n\nWe look forward to welcoming you.\n\n{{receptionniste}}\n{{hotel_nom}}`,
    },
    modification: {
      subject: isFr ? `🔄 Modification de votre réservation — {{hotel_nom}}` : `🔄 Booking Modification — {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nVotre réservation a été modifiée avec succès.\n\n📅 **Anciens détails :** {{anciennes_dates}} | {{ancienne_chambre}}\n📅 **Nouveaux détails :** {{nouvelles_dates}} | {{nouvelle_chambre}}\n\n${isLong ? "Si vous n'avez pas effectué cette modification ou si vous souhaitez des informations complémentaires, contactez-nous immédiatement.\n\n" : ""}Cordialement,\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nYour booking has been updated.\n\nPrevious: {{anciennes_dates}} | {{ancienne_chambre}}\nNew: {{nouvelles_dates}} | {{nouvelle_chambre}}\n\nBest regards,\n{{hotel_nom}}`,
    },
    annulation: {
      subject: isFr ? `❌ Annulation de votre réservation — {{hotel_nom}}` : `❌ Booking Cancellation — {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nNous confirmons l'annulation de votre réservation.\n\n• Dates : {{dates}}\n• Chambre : {{chambre}}\n${ev?.vars.includes('{{motif}}') ? '• Motif : {{motif}}\n' : ''}\nNous espérons vous accueillir prochainement.\n\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nYour booking has been cancelled.\n\nDates: {{dates}} | Room: {{chambre}}\n\nWe hope to welcome you in the future.\n\n{{hotel_nom}}`,
    },
    rappel_j3: {
      subject: isFr ? `⏰ Rappel — Votre arrivée dans 3 jours | {{hotel_nom}}` : `⏰ Reminder — Your arrival in 3 days | {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nVotre séjour approche ! Nous avons hâte de vous accueillir.\n\n📍 **{{hotel_nom}}** — {{hotel_adresse}}\n📅 Dates : {{dates}}\n🛏️ Chambre : {{chambre}}\n⏰ Check-in : à partir de {{heure_checkin}}\n\n💳 Finalisez votre paiement : {{lien_paiement}}\n\nÀ très bientôt !\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nYour stay is coming up! Check-in: {{heure_checkin}}, Dates: {{dates}}\n\nPay online: {{lien_paiement}}\n\n{{hotel_nom}}`,
    },
    rappel_j1: {
      subject: isFr ? `🌟 Demain c'est le grand jour ! | {{hotel_nom}}` : `🌟 Tomorrow is the day! | {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nVotre arrivée est prévue demain ! Tout est prêt pour vous accueillir.\n\n📅 Dates : {{dates}}\n🛏️ Chambre : {{chambre}}\n⏰ Check-in : à partir de {{heure_checkin}}\n📍 Adresse : {{hotel_adresse}}\n\nNous avons hâte de vous voir !\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nYour arrival is tomorrow! We can't wait to welcome you.\nCheck-in from {{heure_checkin}}.\n\n{{hotel_nom}}`,
    },
    facture: {
      subject: isFr ? `🧾 Votre facture de séjour — {{hotel_nom}}` : `🧾 Your Invoice — {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nMerci pour votre séjour au {{hotel_nom}} du {{dates}}.\n\n💰 Montant total TTC : {{montant_ttc}}\n💳 Mode de paiement : {{mode_paiement}}\n📄 Télécharger votre facture : {{facture_pdf}}\n\nMerci de votre confiance.\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nThank you for your stay. Total: {{montant_ttc}} ({{mode_paiement}})\nDownload invoice: {{facture_pdf}}\n\n{{hotel_nom}}`,
    },
    demande_avis: {
      subject: isFr ? `⭐ Votre avis compte pour nous | {{hotel_nom}}` : `⭐ We'd love your feedback | {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nNous espérons que votre séjour du {{sejour_dates}} s'est parfaitement déroulé.\n\nVotre avis est précieux pour nous améliorer en permanence. Cela ne prend que 2 minutes !\n\n⭐ Laisser un avis : {{lien_avis}}\n\nMerci infiniment,\nL'équipe {{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nWe hope you enjoyed your stay ({{sejour_dates}}).\nShare your experience: {{lien_avis}}\n\nThank you!\n{{hotel_nom}}`,
    },
    promo: {
      subject: isFr ? `🎁 Offre exclusive rien que pour vous | {{hotel_nom}}` : `🎁 Exclusive offer just for you | {{hotel_nom}}`,
      body: isFr
        ? `Cher(e) {{client_prenom}} {{client_nom}},\n\nEn tant que client fidèle, nous avons une offre exceptionnelle pour vous !\n\n🏷️ Code promo : **{{code_promo}}**\n💸 Réduction : {{reduction}}\n📅 Valable jusqu'au : {{date_expiration}}\n\nRéservez maintenant : {{lien_offre}}\n\n{{hotel_nom}}`
        : `Dear {{client_prenom}} {{client_nom}},\n\nExclusive deal for you! Code: {{code_promo}} – {{reduction}} off until {{date_expiration}}.\nBook: {{lien_offre}}\n\n{{hotel_nom}}`,
    },
    menage_termine: {
      subject: isFr ? `✨ Chambre {{chambre}} prête` : `✨ Room {{chambre}} ready`,
      body: isFr ? `La chambre {{chambre}} a été nettoyée et est prête à l'accueil.\n\nNettoyée par : {{gouvernante}}\nHeure : {{heure}}` : `Room {{chambre}} is clean and ready.\n\nCleaned by: {{gouvernante}} at {{heure}}`,
    },
    incident: {
      subject: isFr ? `⚠️ Incident signalé — Chambre {{chambre}}` : `⚠️ Incident reported — Room {{chambre}}`,
      body: isFr ? `Un incident a été signalé.\n\nChambre : {{chambre}}\nType : {{incident_type}}\nDescriptif : {{description}}\nSignalé par : {{signale_par}}\nHeure : {{heure}}\n\nMerci de traiter cette demande rapidement.` : `Incident reported in Room {{chambre}}:\n\nType: {{incident_type}}\nDescription: {{description}}\nReported by: {{signale_par}} at {{heure}}`,
    },
  };

  return templates[eventType] || { subject: `Template ${evLabel} — ${language}`, body: `Cher(e) {{client_prenom}} {{client_nom}},\n\n[Contenu du template ${evLabel} généré avec un ton ${tone}, longueur ${length}]\n\nCordialement,\n{{hotel_nom}}` };
}

// ===== PREVIEW RENDERER =====
function renderPreview(text: string): string {
  let result = text;
  Object.entries(PREVIEW_VALUES).forEach(([key, val]) => { result = result.split(key).join(`<mark class="bg-yellow-100 text-yellow-800 rounded px-0.5">${val}</mark>`); });
  return result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// ===== COLOR MAP =====
const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700', blue: 'bg-blue-100 text-blue-700',
  rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700', yellow: 'bg-yellow-100 text-yellow-700',
  pink: 'bg-pink-100 text-pink-700', teal: 'bg-teal-100 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
};

// ===== MAIN COMPONENT =====
interface Props { toast: (msg: string, type?: any) => void; }

export const ConfigTemplates: React.FC<Props> = ({ toast }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importRef   = useRef<HTMLInputElement>(null);

  // ===== STATE =====
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    { id: '1', event_type: 'confirmation', language: 'fr', channel: 'direct', subject: '✅ Confirmation de votre réservation — {{hotel_nom}}', body_html: 'Cher(e) {{client_prenom}} {{client_nom}},\n\nNous avons le plaisir de vous confirmer votre réservation au {{hotel_nom}}.\n\n📋 **Détails :**\n• Dates : {{dates}}\n• Chambre : {{chambre}}\n• Montant : {{montant}}\n\nÀ très bientôt,\n{{receptionniste}}\n{{hotel_nom}}', variables: ['{{client_nom}}','{{dates}}','{{chambre}}','{{montant}}'], is_active: true, created_at: '2026-01-01', updated_at: '2026-04-20', tone: 'Professionnel' },
    { id: '2', event_type: 'rappel_j3',    language: 'fr', channel: 'direct', subject: '⏰ Rappel — Votre arrivée dans 3 jours | {{hotel_nom}}', body_html: 'Cher(e) {{client_prenom}} {{client_nom}},\n\nVotre séjour approche ! Check-in à partir de {{heure_checkin}}.\n\n📍 {{hotel_adresse}}\n💳 Paiement : {{lien_paiement}}\n\nNous avons hâte de vous accueillir !\n{{hotel_nom}}', variables: ['{{client_nom}}','{{dates}}','{{heure_checkin}}'], is_active: true, created_at: '2026-01-01', updated_at: '2026-04-20', tone: 'Amical' },
    { id: '3', event_type: 'facture',       language: 'fr', channel: 'direct', subject: '🧾 Votre facture de séjour — {{hotel_nom}}', body_html: 'Cher(e) {{client_prenom}} {{client_nom}},\n\nMerci pour votre séjour du {{dates}}.\n\n💰 Montant TTC : {{montant_ttc}}\n📄 Facture : {{facture_pdf}}\n\nMerci de votre confiance.\n{{hotel_nom}}', variables: ['{{client_nom}}','{{montant_ttc}}','{{facture_pdf}}'], is_active: true, created_at: '2026-01-01', updated_at: '2026-04-20', tone: 'Professionnel' },
  ]);

  const [sendLogs, setSendLogs] = useState<SendLog[]>([
    { id: '1', date: '2026-04-20 14:05', recipient: 'ali.larabi@example.com', event: 'confirmation',  status: 'sent',  subject: '✅ Confirmation réservation',   body: '' },
    { id: '2', date: '2026-04-20 11:30', recipient: 'claire.m@gmail.com',     event: 'facture',       status: 'sent',  subject: '🧾 Votre facture de séjour',    body: '' },
    { id: '3', date: '2026-04-19 09:00', recipient: 'john.doe@mail.com',      event: 'rappel_j3',     status: 'error', subject: '⏰ Rappel arrivée dans 3 jours', body: '' },
  ]);

  // Modals
  const [editorOpen,    setEditorOpen]    = useState(false);
  const [aiModalOpen,   setAiModalOpen]   = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [logDetailOpen, setLogDetailOpen] = useState<SendLog | null>(null);
  const [activeTab,     setActiveTab]     = useState<'list' | 'logs'>('list');
  const [filterEvent,   setFilterEvent]   = useState('');
  const [filterLang,    setFilterLang]    = useState('');

  // Editor form
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editorForm,  setEditorForm]  = useState({ event_type: 'confirmation', language: 'fr', channel: 'direct', subject: '', body_html: '', tone: 'Professionnel', is_active: true, bcc: '', has_attachment: false });
  const [previewMode, setPreviewMode] = useState(false);

  // AI form
  const [aiForm,      setAiForm]      = useState({ event_type: 'confirmation', tone: 'Professionnel', length: 'Normale', language: 'fr' });
  const [aiLoading,   setAiLoading]   = useState(false);

  // Test send
  const [testEmail,   setTestEmail]   = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testTemplId, setTestTemplId] = useState('');

  const openAdd = () => {
    setEditingId(null);
    setEditorForm({ event_type: 'confirmation', language: 'fr', channel: 'direct', subject: '', body_html: '', tone: 'Professionnel', is_active: true, bcc: '', has_attachment: false });
    setPreviewMode(false);
    setEditorOpen(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setEditorForm({ event_type: t.event_type, language: t.language, channel: t.channel, subject: t.subject, body_html: t.body_html, tone: t.tone || 'Professionnel', is_active: t.is_active, bcc: '', has_attachment: false });
    setPreviewMode(false);
    setEditorOpen(true);
  };

  const deleteTemplate = (id: string) => {
    if (!window.confirm('Supprimer ce template ?')) return;
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast('Template supprimé', 'success');
  };

  const saveTemplate = () => {
    if (!editorForm.subject.trim()) { toast("Objet de l'email requis", 'error'); return; }
    if (!editorForm.body_html.trim()) { toast('Contenu requis', 'error'); return; }
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (editingId) {
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...editorForm, variables: extractVars(editorForm.body_html), updated_at: now } : t));
      toast('Template mis à jour', 'success');
    } else {
      setTemplates(prev => [...prev, { id: Date.now().toString(), ...editorForm, variables: extractVars(editorForm.body_html), created_at: now, updated_at: now }]);
      toast('Template créé', 'success');
    }
    setEditorOpen(false);
  };

  const extractVars = (text: string): string[] => {
    const matches = text.match(/{{[^}]+}}/g);
    return matches ? [...new Set(matches)] : [];
  };

  const insertVar = (v: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const newVal = editorForm.body_html.slice(0, start) + v + editorForm.body_html.slice(end);
    setEditorForm(prev => ({ ...prev, body_html: newVal }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    const generated = generateAITemplate(aiForm.event_type, aiForm.tone, aiForm.length, aiForm.language);
    setEditorForm(prev => ({ ...prev, event_type: aiForm.event_type, language: aiForm.language, tone: aiForm.tone, subject: generated.subject, body_html: generated.body }));
    setAiLoading(false);
    setAiModalOpen(false);
    setEditorOpen(true);
    toast('✨ Template généré par IA', 'success');
  };

  const handleTest = async () => {
    if (!testEmail.trim()) { toast('Email requis', 'error'); return; }
    if (!testEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { toast('Email invalide', 'error'); return; }
    setTestSending(true);
    await new Promise(r => setTimeout(r, 1500));
    const tpl = templates.find(t => t.id === testTemplId);
    setSendLogs(prev => [{ id: Date.now().toString(), date: new Date().toLocaleString('fr-FR'), recipient: testEmail, event: tpl?.event_type || 'test', status: 'sent', subject: tpl?.subject || 'Test', body: tpl?.body_html || '' }, ...prev]);
    setTestSending(false); setTestModalOpen(false); setTestEmail('');
    toast(`Email de test envoyé à ${testEmail}`, 'success');
  };

  const exportTemplate = (t: EmailTemplate) => {
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `template-${t.event_type}-${t.language}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Template exporté', 'success');
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `flowtym-templates-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Tous les templates exportés', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const arr: EmailTemplate[] = Array.isArray(data) ? data : [data];
        const imported = arr.map(t => ({ ...t, id: Date.now().toString() + Math.random(), created_at: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString().slice(0, 10) }));
        setTemplates(prev => [...prev, ...imported]);
        toast(`${imported.length} template(s) importé(s)`, 'success');
      } catch { toast('Fichier JSON invalide', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportLogs = () => {
    const csv = 'Date,Destinataire,Événement,Statut,Objet\n' + sendLogs.map(l => `${l.date},${l.recipient},${l.event},${l.status},"${l.subject}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'journal-envois.csv'; a.click(); URL.revokeObjectURL(url);
    toast('Journal exporté', 'success');
  };

  const getEventInfo = (id: string) => EVENT_TYPES.find(e => e.id === id);
  const currentEventVars = EVENT_TYPES.find(e => e.id === editorForm.event_type)?.vars || [];

  const filteredTemplates = templates.filter(t =>
    (!filterEvent || t.event_type === filterEvent) &&
    (!filterLang || t.language === filterLang)
  );

  return (
    <div className="space-y-6">
      {/* ─── HEADER TABS ─── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
          {[{ id: 'list', label: 'Templates', icon: 'fa-envelope-open' }, { id: 'logs', label: 'Journal des envois', icon: 'fa-list' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className={`fa-solid ${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAiModalOpen(true)} className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles" /> Générer avec IA
          </button>
          <button onClick={openAdd} className="bg-primary hover:bg-[#7b4be8] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Nouveau Template
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={() => importRef.current?.click()} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-1.5">
            <i className="fa-solid fa-upload" /> Import
          </button>
          <button onClick={exportAll} className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-all flex items-center gap-1.5">
            <i className="fa-solid fa-download" /> Export tout
          </button>
        </div>
      </div>

      {/* ─── TAB: TEMPLATES LIST ─── */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1"><label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Filtrer par événement</label>
              <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className={SC}>
                <option value="">Tous les événements</option>
                {EVENT_TYPES.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
              </select>
            </div>
            <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Langue</label>
              <select value={filterLang} onChange={e => setFilterLang(e.target.value)} className={SC + ' min-w-[140px]'}>
                <option value="">Toutes</option>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Events quick-add grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-[13px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <i className="fa-solid fa-bolt text-primary" /> Événements disponibles
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {EVENT_TYPES.map(ev => {
                const hasTemplate = templates.some(t => t.event_type === ev.id);
                return (
                  <button key={ev.id} onClick={() => { setEditorForm(f => ({ ...f, event_type: ev.id })); openAdd(); }}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:shadow-md group ${hasTemplate ? 'border-primary/30 bg-primary/5' : 'border-slate-200 hover:border-primary/30 hover:bg-primary/5'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${colorMap[ev.color] || 'bg-slate-100 text-slate-600'}`}><i className={`fa-solid ${ev.icon}`} /></div>
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">{ev.label}</span>
                    {hasTemplate && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><i className="fa-solid fa-check text-white text-[7px]" /></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-envelope-open text-primary" /> Templates créés</h4>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredTemplates.length} template(s)</span>
            </div>
            {filteredTemplates.length === 0 ? (
              <div className="p-16 text-center">
                <i className="fa-solid fa-envelope-open text-4xl text-slate-200 mb-4 block" />
                <p className="font-bold text-slate-400">Aucun template — Cliquez sur "Nouveau Template" ou "Générer avec IA"</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredTemplates.map(t => {
                  const ev = getEventInfo(t.event_type);
                  return (
                    <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 group transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[ev?.color || 'violet'] || 'bg-slate-100 text-slate-600'}`}>
                        <i className={`fa-solid ${ev?.icon || 'fa-envelope'} text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-[13px] truncate">{t.subject}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase text-slate-400">{ev?.label}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] font-bold text-slate-400">{LANGUAGES.find(l => l.code === t.language)?.flag} {LANGUAGES.find(l => l.code === t.language)?.label}</span>
                          {t.tone && <><span className="text-[10px] text-slate-300">·</span><span className="text-[10px] font-bold text-slate-400 italic">{t.tone}</span></>}
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">Modifié: {t.updated_at}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.variables.slice(0, 5).map(v => <span key={v} className="text-[9px] font-mono bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-100">{v}</span>)}
                          {t.variables.length > 5 && <span className="text-[9px] text-slate-400 font-bold">+{t.variables.length - 5}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setTemplates(prev => prev.map(tt => tt.id === t.id ? { ...tt, is_active: !tt.is_active } : tt))} className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-colors ${t.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t.is_active ? 'Actif' : 'Inactif'}</button>
                        <button onClick={() => { setTestTemplId(t.id); setTestModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500 transition-colors" title="Envoyer un test"><i className="fa-solid fa-paper-plane text-[12px]" /></button>
                        <button onClick={() => exportTemplate(t)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors" title="Exporter"><i className="fa-solid fa-download text-[12px]" /></button>
                        <button onClick={() => openEdit(t)} className="p-2 text-slate-300 hover:text-primary transition-colors" title="Modifier"><i className="fa-solid fa-pen text-[12px]" /></button>
                        <button onClick={() => deleteTemplate(t.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors" title="Supprimer"><i className="fa-solid fa-trash text-[12px]" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB: SEND LOGS ─── */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[15px] font-black text-slate-800 flex items-center gap-2"><i className="fa-solid fa-list text-primary" /> Journal des envois</h4>
            <button onClick={exportLogs} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
              <i className="fa-solid fa-file-csv mr-1" /> Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/80 border-b border-slate-100"><tr>
                {['Date', 'Destinataire', 'Événement', 'Objet', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-[11px] font-black uppercase text-slate-400">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {sendLogs.map(log => {
                  const ev = getEventInfo(log.event);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-400 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{log.recipient}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${colorMap[ev?.color || 'violet']}`}>{ev?.label || log.event}</span></td>
                      <td className="px-4 py-3 font-semibold text-slate-700 max-w-[220px] truncate">{log.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase w-fit px-2 py-1 rounded-lg ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : log.status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          <i className={`fa-solid ${log.status === 'sent' ? 'fa-check' : log.status === 'error' ? 'fa-times' : 'fa-clock'} text-[10px]`} />
                          {log.status === 'sent' ? 'Envoyé' : log.status === 'error' ? 'Erreur' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setLogDetailOpen(log)} className="text-[11px] font-bold text-primary hover:underline">Voir</button>
                      </td>
                    </tr>
                  );
                })}
                {sendLogs.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold">Aucun envoi enregistré</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: AI GENERATOR ===== */}
      <AnimatePresence>
        {aiModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !aiLoading && setAiModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><i className="fa-solid fa-wand-magic-sparkles text-white" /></div>
                      <div>
                        <h3 className="text-[17px] font-black">Générateur IA de templates</h3>
                        <p className="text-violet-200 text-[12px] font-semibold">Laissez l'IA créer votre email en quelques secondes</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-5">
                    <Fl label="Événement déclencheur" required>
                      <select value={aiForm.event_type} onChange={e => setAiForm(f => ({ ...f, event_type: e.target.value }))} className={SC}>
                        {EVENT_TYPES.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
                      </select>
                    </Fl>
                    <div className="grid grid-cols-3 gap-4">
                      <Fl label="Ton du message">
                        <select value={aiForm.tone} onChange={e => setAiForm(f => ({ ...f, tone: e.target.value }))} className={SC}>
                          {TONES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </Fl>
                      <Fl label="Longueur">
                        <select value={aiForm.length} onChange={e => setAiForm(f => ({ ...f, length: e.target.value }))} className={SC}>
                          {LENGTHS.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </Fl>
                      <Fl label="Langue">
                        <select value={aiForm.language} onChange={e => setAiForm(f => ({ ...f, language: e.target.value }))} className={SC}>
                          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                        </select>
                      </Fl>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-[12px] text-violet-700 font-semibold">
                      <i className="fa-solid fa-info-circle mr-2" />
                      L'IA va générer un email avec les variables dynamiques incluses. Vous pourrez modifier le texte avant de sauvegarder.
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 px-8 pb-8">
                    <button onClick={() => setAiModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                    <button onClick={handleGenerateAI} disabled={aiLoading} className="px-8 py-2.5 rounded-xl text-[12px] font-black text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-200 transition-all flex items-center gap-2 disabled:opacity-70">
                      {aiLoading ? <><i className="fa-solid fa-spinner fa-spin" /> Génération en cours...</> : <><i className="fa-solid fa-wand-magic-sparkles" /> Générer le template</>}
                    </button>
                  </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL: EDITOR ===== */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditorOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[700]" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[701] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl pointer-events-auto max-h-[95vh] flex flex-col">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                  <h3 className="text-[15px] font-black text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-envelope-open text-primary" />
                    {editingId ? 'Modifier le template' : 'Nouveau template'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPreviewMode(!previewMode)} className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${previewMode ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <i className={`fa-solid ${previewMode ? 'fa-code' : 'fa-eye'}`} /> {previewMode ? 'Édition' : 'Aperçu'}
                    </button>
                    <button onClick={() => setEditorOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"><i className="fa-solid fa-times text-xs" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-0 h-full">
                    {/* Left: Form */}
                    <div className="p-8 border-r border-slate-100 space-y-5 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <Fl label="Événement"><select value={editorForm.event_type} onChange={e => setEditorForm(f => ({ ...f, event_type: e.target.value }))} className={SC}>{EVENT_TYPES.map(ev => <option key={ev.id} value={ev.id}>{ev.label}</option>)}</select></Fl>
                        <Fl label="Langue"><select value={editorForm.language} onChange={e => setEditorForm(f => ({ ...f, language: e.target.value }))} className={SC}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}</select></Fl>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Fl label="Ton"><select value={editorForm.tone} onChange={e => setEditorForm(f => ({ ...f, tone: e.target.value }))} className={SC}>{TONES.map(t => <option key={t}>{t}</option>)}</select></Fl>
                        <Fl label="Canal"><select value={editorForm.channel} onChange={e => setEditorForm(f => ({ ...f, channel: e.target.value }))} className={SC}><option value="direct">Direct</option><option value="booking">Booking.com</option><option value="expedia">Expedia</option><option value="all">Tous</option></select></Fl>
                      </div>
                      <Fl label="Objet de l'email" required>
                        <input type="text" value={editorForm.subject} onChange={e => setEditorForm(f => ({ ...f, subject: e.target.value }))} className={IC} placeholder="Ex: ✅ Confirmation de votre réservation..." />
                      </Fl>
                      <Fl label="BCC (copie cachée)">
                        <input type="text" value={editorForm.bcc} onChange={e => setEditorForm(f => ({ ...f, bcc: e.target.value }))} className={IC} placeholder="admin@hotel.com" />
                      </Fl>
                      {/* Variables */}
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block mb-2">Variables disponibles <span className="text-slate-300 font-normal normal-case tracking-normal">(cliquer pour insérer)</span></label>
                        <div className="flex flex-wrap gap-1.5">
                          {currentEventVars.map(v => (
                            <button key={v} onClick={() => insertVar(v)} className="text-[10px] font-mono bg-violet-50 hover:bg-violet-100 text-violet-700 px-2 py-1 rounded-lg border border-violet-100 hover:border-violet-200 transition-colors cursor-pointer">{v}</button>
                          ))}
                        </div>
                      </div>
                      {/* Editor textarea */}
                      <Fl label="Corps du message" required>
                        <textarea
                          ref={textareaRef}
                          value={editorForm.body_html}
                          onChange={e => setEditorForm(f => ({ ...f, body_html: e.target.value }))}
                          className={IC + ' h-56 resize-none font-mono text-[12px] leading-relaxed'}
                          placeholder="Rédigez votre message ici. Cliquez sur une variable pour l'insérer..."
                        />
                      </Fl>
                      <label className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl cursor-pointer border border-slate-100">
                        <input type="checkbox" checked={editorForm.has_attachment} onChange={e => setEditorForm(f => ({ ...f, has_attachment: e.target.checked }))} className="accent-primary w-4 h-4" />
                        <i className="fa-solid fa-paperclip text-slate-400" />
                        <span className="text-[13px] font-bold text-slate-700">Joindre la facture PDF automatiquement</span>
                      </label>
                    </div>

                    {/* Right: Preview */}
                    <div className="p-8 bg-slate-50/50 overflow-y-auto">
                      <div className="sticky top-0 bg-slate-50/95 pb-3 mb-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <i className="fa-solid fa-eye" /> Aperçu en temps réel
                          <span className="text-[9px] font-semibold normal-case tracking-normal text-slate-300">Avec exemples de valeurs</span>
                        </label>
                      </div>
                      {editorForm.subject || editorForm.body_html ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-slate-800 px-5 py-3 text-white">
                            <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-rose-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                            <div className="text-[11px] text-slate-400 mb-0.5">De: noreply@flowtym-resort.com</div>
                            <div className="text-[11px] text-slate-400 mb-1">À: ali.larabi@example.com</div>
                            {editorForm.bcc && <div className="text-[11px] text-slate-400 mb-1">BCC: {editorForm.bcc}</div>}
                            <div className="font-bold text-sm" dangerouslySetInnerHTML={{ __html: renderPreview(editorForm.subject) }} />
                          </div>
                          <div className="p-6 text-[13px] text-slate-700 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: renderPreview(editorForm.body_html) }} />
                          {editorForm.has_attachment && <div className="px-6 pb-5"><div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit text-[11px] text-slate-600 font-semibold"><i className="fa-solid fa-file-pdf text-rose-500" /> facture-INV-1042.pdf</div></div>}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                          <i className="fa-solid fa-envelope-open text-5xl mb-3" />
                          <p className="font-bold text-sm">Rédigez le contenu pour voir l'aperçu</p>
                        </div>
                      )}
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-700 font-semibold">
                        <i className="fa-solid fa-lightbulb mr-1.5" />
                        Les valeurs surlignées en jaune sont les variables dynamiques remplacées automatiquement lors de l'envoi.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editor Footer */}
                <div className="flex justify-between items-center px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={editorForm.is_active} onChange={e => setEditorForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-primary w-4 h-4" />
                    <span className="text-[13px] font-bold text-slate-700">Activer l'envoi automatique pour cet événement</span>
                  </label>
                  <div className="flex gap-3">
                    <button onClick={() => setEditorOpen(false)} className="px-5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                    <button onClick={saveTemplate} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-white bg-primary hover:bg-[#7b4be8] shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                      <i className="fa-solid fa-save" /> Sauvegarder le template
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL: TEST SEND ===== */}
      <ConfigModal isOpen={testModalOpen} onClose={() => setTestModalOpen(false)} title="Envoyer un email de test" onSave={handleTest} saveLabel="Envoyer le test" size="sm">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[12px] text-blue-700 font-semibold mb-2">
          <i className="fa-solid fa-info-circle mr-2" />
          Un email de test sera envoyé avec des valeurs exemples pour prévisualiser le rendu.
        </div>
        <Fl label="Adresse email de test" required>
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} className={IC} placeholder="votre@email.com" autoFocus />
        </Fl>
      </ConfigModal>

      {/* ===== MODAL: LOG DETAIL ===== */}
      <ConfigModal isOpen={!!logDetailOpen} onClose={() => setLogDetailOpen(null)} title="Détail de l'envoi" size="md">
        {logDetailOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Date</div><div className="font-bold text-slate-800">{logDetailOpen.date}</div></div>
              <div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Destinataire</div><div className="font-bold text-slate-800">{logDetailOpen.recipient}</div></div>
              <div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Statut</div><span className={`inline-block text-[10px] font-black uppercase px-2 py-1 rounded ${logDetailOpen.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{logDetailOpen.status === 'sent' ? 'Envoyé' : 'Erreur'}</span></div>
              <div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Événement</div><div className="font-bold text-slate-800">{getEventInfo(logDetailOpen.event)?.label || logDetailOpen.event}</div></div>
            </div>
            <div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Objet</div><div className="font-bold text-slate-800 text-[13px]">{logDetailOpen.subject}</div></div>
            {logDetailOpen.body && (<div><div className="text-[11px] font-black uppercase text-slate-400 mb-1">Contenu envoyé</div><div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-[12px] text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">{logDetailOpen.body}</div></div>)}
          </div>
        )}
      </ConfigModal>
    </div>
  );
};
