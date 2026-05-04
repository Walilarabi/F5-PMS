import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast, ToastContainer, supabase } from './configuration/ConfigUtils';
import { ConfigSections1to7 } from './configuration/ConfigSections1to7';
import { ConfigSections8to21 } from './configuration/ConfigSections8to21';
import { ConfigTemplates } from './configuration/ConfigTemplates';
import { ConfigPeripherals } from './configuration/ConfigPeripherals';

type ConfigProps = { onBack?: () => void };

export const Configuration: React.FC<ConfigProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('hotel');
  const { toasts, toast } = useToast();

  // ===== STATE: SECTION 1 - HOTEL =====
  const [hotelConfig, setHotelConfig] = useState({
    name: 'Flowtym Premium Resort', address: '12 Avenue des Champs-Élysées', zip: '75008',
    city: 'Paris', country: 'France', phone: '+33 1 42 00 00 00',
    emailGeneral: 'contact@flowtym.com', emailResa: 'resa@flowtym.com',
    website: 'https://flowtym-resort.com', currency: 'EUR', timezone: 'Europe/Paris',
    language: 'Français', vat: 10, cityTax: 2.50, checkin: '15:00', checkout: '11:00',
  });

  // ===== STATE: SECTION 2 - USERS =====
  const [users, setUsers] = useState<any[]>([
    { id: '1', name: 'Ali Larabi',   email: 'admin@flowtym.com',   role: 'Admin',           lastLogin: '2026-04-20 10:00', active: true },
    { id: '2', name: 'Sophie Dubois', email: 'sophie@flowtym.com', role: 'Réceptionniste',  lastLogin: '2026-04-19 14:30', active: true },
    { id: '3', name: 'Marie Dupont', email: 'marie@flowtym.com',   role: 'Gouvernante',     lastLogin: '2026-04-18 09:00', active: true },
  ]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', role: 'Réceptionniste', password: '', active: true });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [accessMatrix, setAccessMatrix] = useState<Record<string, any>>({
    'Admin':          { read: true,  write: true,  delete: true,  export: true  },
    'Direction':      { read: true,  write: true,  delete: false, export: true  },
    'Réceptionniste': { read: true,  write: true,  delete: false, export: true  },
    'Gouvernante':    { read: true,  write: false, delete: false, export: false },
    'Comptable':      { read: true,  write: false, delete: false, export: true  },
    'Maintenance':    { read: true,  write: false, delete: false, export: false },
  });
  const [selectedRoleMatrix, setSelectedRoleMatrix] = useState('Réceptionniste');

  // ===== STATE: SECTION 3 - ROOMS & RATES =====
  const [typologies, setTypologies] = useState<any[]>([
    { id: '1', code: 'DBL', name: 'Double', maxCap: 2, minSurf: 15, maxSurf: 25 },
    { id: '2', code: 'SGL', name: 'Single', maxCap: 1, minSurf: 12, maxSurf: 18 },
    { id: '3', code: 'TWN', name: 'Twin',   maxCap: 2, minSurf: 18, maxSurf: 28 },
    { id: '4', code: 'STE', name: 'Suite',  maxCap: 4, minSurf: 40, maxSurf: 60 },
  ]);
  const [categories, setCategories] = useState<any[]>([
    { id: '1', code: 'CLA', name: 'Classique',     mult: 1.0, color: '#e2e8f0' },
    { id: '2', code: 'SUP', name: 'Supérieur',     mult: 1.3, color: '#dbeafe' },
    { id: '3', code: 'DLX', name: 'Deluxe',        mult: 1.8, color: '#fef3c7' },
    { id: '4', code: 'PRE', name: 'Présidentielle',mult: 2.5, color: '#fce7f3' },
  ]);
  const [views]     = useState(['Rue', 'Cour', 'Jardin', 'Montagne', 'Mer', 'Piscine']);
  const [bathrooms] = useState(['Douche', 'Baignoire', 'Douche + Baignoire']);
  const [ratePlans, setRatePlans] = useState<any[]>([
    { id: '1', code: 'RACK-RO-FLEX',   name: 'Rack Public Flex',        basePrice: 150, pension: 'Room Only', cancel: 'Flexible (J-3)',  vat: 10 },
    { id: '2', code: 'CORP-BB-NONREF', name: 'Corporate B&B Non-Ref',   basePrice: 120, pension: 'BB',        cancel: 'Non remboursable', vat: 10 },
    { id: '3', code: 'OTA-RO-NANR',    name: 'OTA RO Non remboursable', basePrice: 135, pension: 'Room Only', cancel: 'Non remboursable', vat: 10 },
  ]);
  const [ratePlanModalOpen, setRatePlanModalOpen] = useState(false);
  const [ratePlanForm, setRatePlanForm]           = useState({ id: '', code: '', name: '', basePrice: 100, pension: 'Room Only', cancel: 'Flexible (J-3)', vat: 10 });
  const [editingRatePlan, setEditingRatePlan]     = useState<string | null>(null);
  const [roomConfig, setRoomConfig]               = useState({ total: 50, floors: 5, format: '{etage}{numero}', firstRoom: '01' });
  const [roomsList, setRoomsList]                 = useState<any[]>([]);
  const [cascadeSource, setCascadeSource]         = useState('1');
  const [cascadeTarget, setCascadeTarget]         = useState('3');
  const [cascadeDelta, setCascadeDelta]           = useState('-10%');

  // ===== STATE: SECTION 4 - CHANNELS =====
  const [channels, setChannels] = useState<any[]>([
    { id: 'booking',   name: 'Booking.com', connected: true,  lastSync: 'Il y a 5 min'    },
    { id: 'expedia',   name: 'Expedia',     connected: true,  lastSync: 'Il y a 10 min'   },
    { id: 'agoda',     name: 'Agoda',       connected: false, lastSync: 'Jamais'           },
    { id: 'airbnb',    name: 'Airbnb',      connected: true,  lastSync: 'Il y a 1 heure'  },
    { id: 'trip',      name: 'Trip.com',    connected: false, lastSync: 'Jamais'           },
    { id: 'hrs',       name: 'HRS',         connected: false, lastSync: 'Jamais'           },
    { id: 'hotelbeds', name: 'Hotelbeds',   connected: false, lastSync: 'Jamais'           },
  ]);
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);

  // ===== STATE: SECTION 5 - REPORTS =====
  const [reportConfig, setReportConfig] = useState({ period: 'Mois', format: 'PDF', autoEmail: true, recipients: 'direction@hotel.com', freq: 'Quotidien' });
  const [selectedReports, setSelectedReports] = useState<string[]>(['EXP-01 Occupation', 'FIN-11 Caisse']);
  const [sendingReport, setSendingReport] = useState(false);

  // ===== STATE: SECTION 6 - SECURITY =====
  const [securityConfig, setSecurityConfig] = useState({ twoFactor: true, sessionDuration: 120, maxAttempts: 5, lockoutDuration: 30 });
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: '1', label: 'Production',    key: 'sk_live_***************************', created: '2026-01-01' },
    { id: '2', label: 'Développement', key: 'sk_test_***************************', created: '2026-03-15' },
  ]);
  const auditLogs = [
    { id: '1', date: '2026-04-20 14:30', user: 'Ali Larabi',   ip: '192.168.1.5',  action: 'UPDATE', entity_type: 'reservation', details: 'Modification dates RES-001' },
    { id: '2', date: '2026-04-20 11:15', user: 'Sophie Dubois',ip: '82.124.55.12', action: 'CREATE', entity_type: 'invoice',     details: 'Génération facture INV-102' },
    { id: '3', date: '2026-04-19 16:45', user: 'Ali Larabi',   ip: '192.168.1.5',  action: 'DELETE', entity_type: 'promotion',   details: 'Suppression code SUMMER2025' },
  ];

  // ===== STATE: SECTION 7 - PREFERENCES =====
  const [prefs, setPrefs] = useState({ theme: 'Clair', font: 'Inter', animations: true, emailConfirm: true, emailReminder: true, reminderDays: 3, notifHousekeeping: true, notifIncident: true });

  // ===== STATE: SECTION 8 - CANCEL POLICIES =====
  const [cancelPolicies, setCancelPolicies] = useState<any[]>([
    { id: '1', name: 'Flexible',          desc: "Annulation gratuite jusqu'à 24h. 100% de la 1ère nuit ensuite.", type: 'J-1',      penalty: '1 Nuit' },
    { id: '2', name: 'Non-Remboursable',  desc: "Prélèvement total à la réservation. Pas d'annulation.",         type: 'Immédiat',  penalty: '100%'   },
    { id: '3', name: 'Stricte (groupes)', desc: 'Annulation 30 jours avant. 50% conservé.',                      type: 'J-30',     penalty: '50%'    },
  ]);

  // ===== STATE: SECTION 9 - SUPPLEMENTS =====
  const [supplements, setSupplements] = useState<any[]>([
    { id: '1', name: 'Petit-Déjeuner Continental', category: 'F&B',      price: '18.00', billing: 'Par personne / Jour', active: true  },
    { id: '2', name: 'Lit Supplémentaire',         category: 'Chambre',  price: '35.00', billing: 'Par jour',            active: true  },
    { id: '3', name: 'Parking Sécurisé',           category: 'Services', price: '15.00', billing: 'Par séjour',          active: true  },
    { id: '4', name: 'Animal de compagnie',        category: 'Services', price: '20.00', billing: 'Par jour',            active: true  },
    { id: '5', name: 'Room Service',               category: 'F&B',      price: '5.00',  billing: 'Par commande',        active: false },
  ]);

  // ===== STATE: SECTION 10 - PROMOTIONS =====
  const [promotions, setPromotions] = useState<any[]>([
    { id: '1', code: 'SUMMER2026', desc: '-15% sur tout le séjour', dates: '01/06/2026 - 31/08/2026', discount: 15, type: 'pct', active: true,  minNights: 2 },
    { id: '2', code: 'EARLYBIRD', desc: '-10% si résa J-60',         dates: 'Permanent',              discount: 10, type: 'pct', active: true,  minNights: 1 },
    { id: '3', code: 'LASTMIN',   desc: '-20% le jour même',         dates: 'Permanent',              discount: 20, type: 'pct', active: false, minNights: 1 },
  ]);

  // ===== STATE: SECTION 11 - TAXES =====
  const [taxes, setTaxes]         = useState({ hebergement: 10, fb: 10, alcool: 20, cityTax: 2.50 });
  const [taxExemptions, setTaxExemptions] = useState<string[]>(['Mineur (-18 ans)', 'Saisonnier', 'Urgence sociale']);

  // ===== STATE: SECTION 12 - NOTIFICATIONS =====
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', name: 'Confirmation de Réservation',         channel: 'Email + SMS', active: true,  template: 'Bonjour {client_name}, votre réservation {reservation_id} est confirmée.' },
    { id: '2', name: 'Rappel J-3',                          channel: 'Email',       active: true,  template: 'Rappel : votre séjour commence dans 3 jours.' },
    { id: '3', name: 'Facture en pièce jointe (Check-out)', channel: 'Email',       active: true,  template: 'Votre facture est disponible en pièce jointe.' },
    { id: '4', name: 'Demande de Review (J+1)',             channel: 'Email',       active: false, template: "Comment s'est passé votre séjour ?" },
  ]);

  // ===== STATE: SECTION 13 - API & WEBHOOKS =====
  const [webhooks, setWebhooks] = useState<any[]>([
    { id: '1', name: 'OTA Sync Update',    url: 'https://api.channex.io/v1/webhook',          events: ['reservation.created', 'reservation.updated'], active: true, lastTest: 'OK'        },
    { id: '2', name: 'CRM Notification',   url: 'https://hook.zapier.com/hooks/catch/123456', events: ['checkin.completed'],                         active: true, lastTest: 'OK'        },
  ]);

  // ===== STATE: SECTION 14 - EQUIPMENT =====
  const [equipment, setEquipment] = useState<any[]>([
    { id: '1', name: 'Piscine',          active: true  },
    { id: '2', name: 'Spa / Massage',    active: false },
    { id: '3', name: 'Salle de sport',   active: true  },
    { id: '4', name: 'Restaurant',       active: true  },
    { id: '5', name: 'Bar',              active: true  },
    { id: '6', name: 'Parking gratuit',  active: false },
    { id: '7', name: 'Wifi Haut-Débit',  active: true  },
    { id: '8', name: 'Climatisation',    active: true  },
    { id: '9', name: 'Navette Aéroport', active: false },
    { id: '10', name: 'Borne Électrique',active: false },
  ]);

  // ===== STATE: SECTION 15 - LANGUAGES =====
  const [languages, setLanguages] = useState<any[]>([
    { id: '1', code: 'fr', flag: '🇫🇷', name: 'Français', progress: 100, active: true,  isDefault: true  },
    { id: '2', code: 'en', flag: '🇬🇧', name: 'English',  progress: 88,  active: true,  isDefault: false },
    { id: '3', code: 'es', flag: '🇪🇸', name: 'Español',  progress: 30,  active: false, isDefault: false },
    { id: '4', code: 'de', flag: '🇩🇪', name: 'Deutsch',  progress: 0,   active: false, isDefault: false },
  ]);

  // ===== STATE: SECTION 16 - MEDIA =====
  const [mediaFiles, setMediaFiles] = useState<any[]>([
    { id: '1', name: 'Réception principale',    preview: null, category: 'Hôtel'       },
    { id: '2', name: 'Suite Royale',            preview: null, category: 'Chambres'    },
    { id: '3', name: 'Restaurant panoramique',  preview: null, category: 'Hôtel'       },
    { id: '4', name: 'Piscine extérieure',      preview: null, category: 'Équipements' },
    { id: '5', name: 'Spa & Bien-être',         preview: null, category: 'Équipements' },
  ]);

  // ===== STATE: SECTION 17 - BACKUP =====
  const [backupStatus, setBackupStatus] = useState('Synchronisé · Cloud Flowtym');

  // ===== STATE: SECTION 18 - AUDIT LOG =====
  const fullAuditLogs = [
    { id: '1', date: '2026-04-20 14:30', user: 'Ali Larabi',    ip: '192.168.1.5',  action: 'UPDATE', entity_type: 'reservation', details: 'Modification dates RES-001', before: '{ "checkin": "2026-04-06" }', after: '{ "checkin": "2026-04-07" }' },
    { id: '2', date: '2026-04-20 11:15', user: 'Sophie Dubois', ip: '82.124.55.12', action: 'CREATE', entity_type: 'invoice',     details: 'Génération facture INV-102', before: null, after: '{ "amount": 1200 }' },
    { id: '3', date: '2026-04-19 16:45', user: 'Ali Larabi',    ip: '192.168.1.5',  action: 'DELETE', entity_type: 'promotion',   details: 'Suppression code SUMMER2025', before: '{ "code": "SUMMER2025" }', after: null },
    { id: '4', date: '2026-04-19 10:00', user: 'Sophie Dubois', ip: '82.124.55.12', action: 'UPDATE', entity_type: 'room',        details: 'Statut chambre 101 → Propre', before: '{ "status": "Sale" }', after: '{ "status": "Propre" }' },
    { id: '5', date: '2026-04-18 09:00', user: 'Ali Larabi',    ip: '192.168.1.5',  action: 'CREATE', entity_type: 'user',        details: 'Création utilisateur Marie Dupont', before: null, after: '{ "name": "Marie Dupont" }' },
  ];

  // ===== STATE: SECTION 19 - CLOSURES =====
  const [closures, setClosures] = useState<any[]>([
    { id: '1', name: 'Maintenance Annuelle — Réfection Toiture', type: 'totale',    from: '2026-11-15', to: '2026-11-30', note: 'OTA bloquées'     },
    { id: '2', name: 'Rénovation Aile Est (Ch. 201-210)',        type: 'partielle', from: '2026-09-01', to: '2026-09-15', note: 'Travaux peinture' },
  ]);

  // ===== STATE: SECTION 20 - YIELD =====
  const [yieldConfig, setYieldConfig] = useState({ autoPilot: false, barFloor: 80, barCeiling: 500, overbookPct: 2, occupancyThresholdHigh: 80, priceBoostHigh: 15, occupancyThresholdLow: 40, priceReduceLow: 10 });

  // ===== STATE: SECTION 21 - CHANNEL ADVANCED =====
  const [syncLogs, setSyncLogs] = useState<any[]>([
    { id: '1', date: '2026-04-20 14:30', channel: 'Booking.com', type: 'PUSH',  status: 'OK',    rooms: 48, rates: 12 },
    { id: '2', date: '2026-04-20 11:15', channel: 'Expedia',     type: 'PUSH',  status: 'OK',    rooms: 48, rates: 12 },
    { id: '3', date: '2026-04-19 08:00', channel: 'Airbnb',      type: 'PULL',  status: 'ERROR', rooms: 0,  rates: 0  },
  ]);

  // ===== STATE: SECTION 22 - PARTNER MAPPING =====
  const [partnerMappings, setPartnerMappings] = useState<any[]>([]);

  // ===== 4-GROUP NAVIGATION =====
  const configGroups = [
    {
      id: 'general',
      label: 'Général',
      icon: 'fa-hotel',
      color: '#8B5CF6',
      sub: [
        { id: 'hotel',     label: "Profil de l'hôtel",    icon: 'fa-hotel'      },
        { id: 'taxes',     label: 'Taxes & TVA',          icon: 'fa-coins'      },
        { id: 'prefs',     label: 'Préférences',          icon: 'fa-cogs'       },
        { id: 'languages', label: 'Langues',               icon: 'fa-language'   },
        { id: 'media',     label: 'Médias',                icon: 'fa-images'     },
        { id: 'equipments',label: 'Équipements',            icon: 'fa-concierge-bell'},
        { id: 'peripherals',label: 'Périphériques',          icon: 'fa-print'          },
      ],
    },
    {
      id: 'parc',
      label: 'Parc & Tarifs',
      icon: 'fa-bed',
      color: '#0EA5E9',
      sub: [
        { id: 'rooms',          label: 'Chambres & Typologies', icon: 'fa-bed'            },
        { id: 'cancel_policies',label: "Annulations",            icon: 'fa-calendar-times' },
        { id: 'supplements',    label: 'Suppléments',           icon: 'fa-plus-circle'    },
        { id: 'promotions',     label: 'Promotions',             icon: 'fa-percentage'     },
        { id: 'closures',       label: 'Fermetures',             icon: 'fa-tools'          },
        { id: 'yield',          label: 'Yield / RMS',            icon: 'fa-chart-line'     },
      ],
    },
    {
      id: 'connectivity',
      label: 'Connectivité',
      icon: 'fa-satellite-dish',
      color: '#10B981',
      sub: [
        { id: 'channels',      label: 'Channel Manager',   icon: 'fa-wifi'         },
        { id: 'channel_advanced', label: 'Channel Avancé', icon: 'fa-satellite-dish'},
        { id: 'api_webhooks',  label: 'API & Webhooks',    icon: 'fa-laptop-code'  },
        { id: 'notifications', label: 'Notifications',     icon: 'fa-paper-plane'  },
        { id: 'templates',     label: 'Modèles Emails',    icon: 'fa-envelope-open'},
        { id: 'reports',       label: 'Rapports Auto',     icon: 'fa-chart-pie'    },
      ],
    },
    {
      id: 'security',
      label: 'Sécurité & Accès',
      icon: 'fa-shield-alt',
      color: '#EF4444',
      sub: [
        { id: 'users',         label: 'Utilisateurs',      icon: 'fa-users'        },
        { id: 'security',      label: 'Sécurité',          icon: 'fa-shield-alt'   },
        { id: 'audit_advanced',label: 'Audit Log',         icon: 'fa-search-plus'  },
        { id: 'backup',        label: 'Backup',            icon: 'fa-database'     },
      ],
    },
  ];

  // Active group derived from activeTab
  const activeGroup = configGroups.find(g => g.sub.some(s => s.id === activeTab))?.id || 'general';
  const activeGroupData = configGroups.find(g => g.id === activeGroup)!;
  const activeSubLabel = activeGroupData.sub.find(s => s.id === activeTab)?.label || '';


  // ===== GLOBAL SAVE =====
  const handleSave = async () => {
    try { 
      // Global config
      await supabase.from('pms_configurations').upsert({ module: 'all', config: { hotelConfig, users, ratePlans } }); 
      
      // Partner Mappings
      if (partnerMappings.length > 0) {
        const cleanMappings = partnerMappings.map(m => {
          const { id, ...rest } = m;
          return String(id).startsWith('temp_') ? { ...rest, hotel_id: 'current-hotel-id' } : { ...m, hotel_id: 'current-hotel-id' };
        });
        await supabase.from('partner_rate_mapping').upsert(cleanMappings);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    window.dispatchEvent(new CustomEvent('config-updated', { detail: { updated: Date.now() } }));
    toast('✅ Configuration sauvegardée avec succès', 'success');
  };

  useEffect(() => {
    const loadMappings = async () => {
      const { data, error } = await supabase.from('partner_rate_mapping').select('*');
      if (!error && data) setPartnerMappings(data);
    };
    loadMappings();

    supabase.channel('config-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'pms_configurations' }, (payload: any) => {
      window.dispatchEvent(new CustomEvent('config-updated', { detail: payload.new }));
    }).subscribe();
  }, []);

  // ===== SHARED PROPS =====
  const s1to7Props = {
    activeTab, toast,
    hotelConfig, setHotelConfig,
    users, setUsers, userModalOpen, setUserModalOpen, editingUser, setEditingUser, userForm, setUserForm,
    selectedRoleMatrix, setSelectedRoleMatrix, accessMatrix, setAccessMatrix,
    typologies, setTypologies, categories, setCategories, views, bathrooms,
    ratePlans, setRatePlans, ratePlanModalOpen, setRatePlanModalOpen,
    editingRatePlan, setEditingRatePlan, ratePlanForm, setRatePlanForm,
    roomConfig, setRoomConfig, roomsList, setRoomsList,
    cascadeSource, setCascadeSource, cascadeTarget, setCascadeTarget, cascadeDelta, setCascadeDelta,
    channels, setChannels, syncingChannel, setSyncingChannel,
    reportConfig, setReportConfig, selectedReports, setSelectedReports, sendingReport, setSendingReport,
    securityConfig, setSecurityConfig, apiKeys, setApiKeys, auditLogs,
    prefs, setPrefs,
    partnerMappings, setPartnerMappings,
  };
  const s8to21Props = {
    activeTab, toast,
    cancelPolicies, setCancelPolicies,
    supplements, setSupplements,
    promotions, setPromotions,
    taxes, setTaxes, taxExemptions, setTaxExemptions,
    notifications, setNotifications,
    apiKeys, setApiKeys,
    webhooks, setWebhooks,
    equipment, setEquipment,
    languages, setLanguages,
    mediaFiles, setMediaFiles,
    backupStatus, setBackupStatus,
    fullAuditLogs,
    closures, setClosures,
    yieldConfig, setYieldConfig,
    syncLogs, setSyncLogs,
    partnerMappings, setPartnerMappings,
    ratePlans, typologies, roomsList,
  };

  return (
    <div
      className="flex flex-col bg-slate-50 -mx-4 -my-8"
      style={{ minHeight: 'calc(100vh - 142px)', fontFamily: "'Inter', sans-serif" }}
    >
      {/* \u2500\u2500\u2500 TOP HEADER \u2500\u2500\u2500 */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all">
              <i className="fa-solid fa-arrow-left text-sm" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: activeGroupData.color + '20' }}>
              <i className={`fa-solid ${activeGroupData.icon} text-sm`} style={{ color: activeGroupData.color }} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800">{activeSubLabel}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{activeGroupData.label} · Configuration PMS</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-primary hover:bg-[#7b4be8] text-white px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <i className="fa-solid fa-save" /> Sauvegarder
        </button>
      </header>

      {/* \u2500\u2500\u2500 PRIMARY NAV: 4 GROUPES \u2500\u2500\u2500 */}
      <nav className="bg-white border-b border-slate-200 px-8 flex items-center gap-1 h-14 shrink-0 z-40">
        {configGroups.map(group => {
          const isActive = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveTab(group.sub[0].id)}
              className={`relative flex items-center gap-2.5 px-5 h-full text-[11px] font-black uppercase tracking-widest transition-all group whitespace-nowrap ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <i className={`fa-solid ${group.icon} text-[12px] ${
                isActive ? '' : 'text-slate-300 group-hover:text-slate-500'
              }`}
              style={isActive ? { color: group.color } : {}}
              />
              {group.label}
              {isActive && (
                <motion.div
                  layoutId="cfgGroupLine"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                  style={{ backgroundColor: group.color }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─── BODY: sidebar gauche + contenu ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar verticale sous-onglets ── */}
        <aside className="w-52 shrink-0 bg-white border-r border-slate-200 overflow-y-auto no-scrollbar">
          <div className="py-3 px-2">
            {activeGroupData.sub.map(sub => {
              const isSub = activeTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveTab(sub.id)}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold transition-all mb-0.5 text-left ${
                    isSub ? '' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  style={isSub ? { backgroundColor: activeGroupData.color + '12', color: activeGroupData.color } : {}}
                >
                  {isSub && (
                    <motion.div
                      layoutId="cfgSubLine"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                      style={{ backgroundColor: activeGroupData.color }}
                    />
                  )}
                  <i
                    className={`fa-solid ${sub.icon} text-[12px] w-4 shrink-0 ${
                      isSub ? '' : 'text-slate-300'
                    }`}
                    style={isSub ? { color: activeGroupData.color } : {}}
                  />
                  <span className="truncate">{sub.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Zone de contenu ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
              className="max-w-4xl px-8 py-8 space-y-8 pb-16"
            >
              <ConfigSections1to7 {...s1to7Props} />
              <ConfigSections8to21 {...s8to21Props} />
              {activeTab === 'templates' && <ConfigTemplates toast={toast} />}
              {activeTab === 'peripherals' && <ConfigPeripherals toast={toast} />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>


      {/* \u2500\u2500\u2500 TOASTS \u2500\u2500\u2500 */}
      <ToastContainer toasts={toasts} />

      <style>{`
        ::-webkit-scrollbar { width: 0; height: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
