import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Peripheral {
  id: string;
  label: string;
  kind: 'scanner' | 'printer';
  status: 'connected' | 'disconnected' | 'error';
  lastUsed?: string;
}

interface PeripheralConfig {
  scanner: string;         // label du scanner sélectionné
  scannerId: string;       // deviceId MediaDevices (caméra/scanner)
  printer: string;         // label de l'imprimante sélectionnée
  printerId: string;
  autoPrintInvoice: boolean;
  autoPrintCheckin: boolean;
  scanOnCheckin: boolean;
  paperFormat: 'A4' | 'A5' | 'ticket80mm';
  printerCopies: number;
}

const DEFAULT_CONFIG: PeripheralConfig = {
  scanner: '', scannerId: '',
  printer: '', printerId: '',
  autoPrintInvoice: false, autoPrintCheckin: false,
  scanOnCheckin: true,
  paperFormat: 'A4', printerCopies: 1,
};

const STORAGE_KEY = 'flowtym_peripherals';

const load = (): PeripheralConfig => {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return DEFAULT_CONFIG; }
};
const save = (cfg: PeripheralConfig) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

// ─── Styles ───────────────────────────────────────────────────────────────────
const FIELD = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-[3px] focus:ring-primary/20 focus:border-primary focus:bg-white outline-none text-sm font-medium transition-all appearance-none";
const LABEL = "block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider";

const StatusDot: React.FC<{ status: 'connected' | 'disconnected' | 'error' | 'unknown' }> = ({ status }) => {
  const map = {
    connected:    { bg: '#10B981', pulse: true,  label: 'Connecté' },
    disconnected: { bg: '#94A3B8', pulse: false, label: 'Déconnecté' },
    error:        { bg: '#EF4444', pulse: false, label: 'Erreur' },
    unknown:      { bg: '#F59E0B', pulse: false, label: 'Inconnu' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold"
      style={{ color: s.bg }}>
      <span className="relative flex h-2 w-2">
        {s.pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: s.bg }} />}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: s.bg }} />
      </span>
      {s.label}
    </span>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export const ConfigPeripherals: React.FC<{ toast: (msg: string) => void }> = ({ toast }) => {
  const [cfg, setCfg] = useState<PeripheralConfig>(load);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [scannerStatus, setScannerStatus] = useState<'connected' | 'disconnected' | 'error' | 'unknown'>('unknown');
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [testPrinting, setTestPrinting] = useState(false);
  const [testScanning, setTestScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [saved, setSaved] = useState(false);

  // ─── Détection caméras / scanners via MediaDevices ─────────────────────────
  useEffect(() => {
    detectCameras();
    detectPrinters();
  }, []);

  const detectCameras = async () => {
    try {
      // Demander la permission caméra
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop()); // Libérer immédiatement
      setPermissionGranted(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      // Si un scanner est déjà configuré et qu'il existe toujours
      if (cfg.scannerId) {
        const exists = videoDevices.some(d => d.deviceId === cfg.scannerId);
        setScannerStatus(exists ? 'connected' : 'disconnected');
      } else if (videoDevices.length > 0) {
        setScannerStatus('disconnected'); // Disponible mais non configuré
      }
    } catch {
      setScannerStatus('error');
    }
  };

  const detectPrinters = () => {
    // L'API Web Printing n'est pas standardisée — on utilise window.print() 
    // pour détecter si l'impression est disponible
    const available = typeof window !== 'undefined' && 'print' in window;
    setPrinterStatus(available ? (cfg.printerId ? 'connected' : 'disconnected') : 'error');
  };

  // ─── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSave = () => {
    save(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast('Périphériques sauvegardés · Configuration mise à jour');
    // Mettre à jour les statuts
    if (cfg.scannerId) {
      const exists = cameras.some(c => c.deviceId === cfg.scannerId);
      setScannerStatus(exists ? 'connected' : 'disconnected');
    }
    if (cfg.printerId) setPrinterStatus('connected');
  };

  const set = (k: keyof PeripheralConfig, v: any) => setCfg(prev => ({ ...prev, [k]: v }));

  // ─── Test scanner ──────────────────────────────────────────────────────────
  const handleTestScanner = async () => {
    setTestScanning(true);
    try {
      const constraints: MediaStreamConstraints = cfg.scannerId
        ? { video: { deviceId: { exact: cfg.scannerId } } }
        : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => t.stop());
      setScannerStatus('connected');
      toast('Scanner testé · Caméra fonctionnelle');
    } catch {
      setScannerStatus('error');
      toast('Erreur scanner · Caméra inaccessible');
    } finally {
      setTestScanning(false);
    }
  };

  // ─── Test impression ───────────────────────────────────────────────────────
  const handleTestPrint = () => {
    setTestPrinting(true);
    const win = window.open('', '_blank', 'width=400,height=300');
    if (win) {
      win.document.write(`
        <!DOCTYPE html><html><head><title>Test Impression Flowtym</title>
        <style>body{font-family:Inter,sans-serif;padding:40px;text-align:center}
        h1{color:#8B5CF6;font-size:24px}p{color:#64748B;font-size:14px}
        .badge{display:inline-block;background:#EDE9FE;color:#5B21B6;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}</style>
        </head><body>
        <h1>✅ Flowtym PMS</h1>
        <p>Page de test d'impression</p>
        <div class="badge">Imprimante : ${cfg.printer || 'Imprimante système'}</div>
        <p style="margin-top:20px;font-size:12px;color:#94A3B8">
          Format : ${cfg.paperFormat} · Copies : ${cfg.printerCopies}<br>
          ${new Date().toLocaleString('fr-FR')}
        </p>
        </body></html>
      `);
      win.document.close();
      win.print();
      win.onafterprint = () => win.close();
    }
    setTimeout(() => {
      setTestPrinting(false);
      setPrinterStatus('connected');
      toast('Test impression · Page de test envoyée');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Périphériques</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configurez le scanner de documents et l'imprimante associés à ce poste.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
          style={{
            background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
          }}
        >
          <span>{saved ? '✓' : '💾'}</span>
          {saved ? 'Sauvegardé !' : 'Enregistrer'}
        </button>
      </div>

      {/* ── SECTION SCANNER ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v4H7zM7 14h3M7 17h5"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Scanner / Caméra</div>
              <div className="text-[10px] text-slate-400">Pour la lecture des pièces d'identité et passeports</div>
            </div>
          </div>
          <StatusDot status={scannerStatus} />
        </div>

        <div className="p-5 space-y-4">
          {/* Permission caméra */}
          {!permissionGranted && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="text-[12px] font-semibold text-amber-700">Permission caméra requise</div>
                <div className="text-[11px] text-amber-600 mt-0.5">
                  Autorisez l'accès à la caméra pour détecter les périphériques disponibles.
                </div>
                <button onClick={detectCameras}
                  className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold transition-all">
                  Autoriser l'accès
                </button>
              </div>
            </div>
          )}

          {/* Sélection scanner/caméra */}
          <div>
            <label className={LABEL}>Caméra / Scanner connecté</label>
            <select
              className={FIELD}
              value={cfg.scannerId}
              onChange={e => {
                const device = cameras.find(c => c.deviceId === e.target.value);
                set('scannerId', e.target.value);
                set('scanner', device?.label || e.target.value);
              }}
            >
              <option value="">— Sélectionner un périphérique —</option>
              {cameras.map(cam => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Caméra ${cameras.indexOf(cam) + 1}`}
                </option>
              ))}
              <option value="__system__">Caméra système (par défaut)</option>
            </select>
            {cameras.length === 0 && permissionGranted && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Aucune caméra détectée. Connectez un scanner USB ou activez la caméra intégrée.
              </p>
            )}
          </div>

          {/* Nom personnalisé */}
          <div>
            <label className={LABEL}>Nom d'affichage (optionnel)</label>
            <input type="text" className={FIELD} placeholder="ex: Scanner Fujitsu ScanSnap iX1300"
              value={cfg.scanner} onChange={e => set('scanner', e.target.value)} />
          </div>

          {/* Options scanner */}
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-violet-200 flex items-center justify-center text-sm">📷</div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-700">Scanner automatique au check-in</div>
                  <div className="text-[10px] text-slate-400">Ouvrir le scanner lors de chaque enregistrement client</div>
                </div>
              </div>
              <input type="checkbox" checked={cfg.scanOnCheckin} onChange={e => set('scanOnCheckin', e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600 cursor-pointer" />
            </label>
          </div>

          {/* Bouton test */}
          <div className="flex gap-2">
            <button onClick={handleTestScanner} disabled={testScanning}
              className="flex items-center gap-2 px-4 py-2 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {testScanning ? 'Test en cours…' : 'Tester la caméra'}
            </button>
            <button onClick={detectCameras}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-semibold transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION IMPRIMANTE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Imprimante</div>
              <div className="text-[10px] text-slate-400">Pour les factures, confirmations et fiches de check-in</div>
            </div>
          </div>
          <StatusDot status={printerStatus} />
        </div>

        <div className="p-5 space-y-4">
          {/* Nom imprimante */}
          <div>
            <label className={LABEL}>Nom de l'imprimante</label>
            <input type="text" className={FIELD}
              placeholder="ex: HP LaserJet Pro M404dn — Réception"
              value={cfg.printer} onChange={e => set('printer', e.target.value)} />
            <p className="text-[10px] text-slate-400 mt-1.5">
              Le nom doit correspondre exactement à celui défini dans les Paramètres système de l'OS.
              L'impression utilisera l'imprimante système par défaut si ce champ est vide.
            </p>
          </div>

          {/* Format papier + copies */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Format papier</label>
              <select className={FIELD} value={cfg.paperFormat} onChange={e => set('paperFormat', e.target.value)}>
                <option value="A4">A4 (21×29,7 cm)</option>
                <option value="A5">A5 (14,8×21 cm)</option>
                <option value="ticket80mm">Ticket 80 mm (TPE/Caisse)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Nombre de copies</label>
              <input type="number" min={1} max={5} className={FIELD}
                value={cfg.printerCopies} onChange={e => set('printerCopies', +e.target.value || 1)} />
            </div>
          </div>

          {/* Options impression automatique */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Impression automatique</div>
            {[
              { key: 'autoPrintInvoice' as const, icon: '🧾', label: 'Facture / Proforma',        desc: 'Imprimer automatiquement lors du check-out' },
              { key: 'autoPrintCheckin' as const, icon: '📋', label: 'Fiche d\'arrivée',           desc: 'Imprimer la fiche client lors du check-in' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 group-hover:border-blue-200 flex items-center justify-center text-sm">{opt.icon}</div>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-700">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                </div>
                <input type="checkbox" checked={cfg[opt.key] as boolean} onChange={e => set(opt.key, e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
              </label>
            ))}
          </div>

          {/* Bouton test */}
          <button onClick={handleTestPrint} disabled={testPrinting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            {testPrinting ? 'Impression en cours…' : 'Imprimer une page de test'}
          </button>
        </div>
      </div>

      {/* ── RÉCAPITULATIF ACTIF ── */}
      {(cfg.scanner || cfg.printer) && (
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-100 p-5">
          <div className="text-[11px] font-bold text-violet-700 uppercase tracking-wider mb-3">Configuration active</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-violet-100">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Scanner</div>
              <div className="text-[12px] font-bold text-slate-700 truncate">{cfg.scanner || 'Non configuré'}</div>
              <div className="text-[10px] text-violet-500 mt-0.5">{cfg.scanOnCheckin ? '✓ Actif au check-in' : '✗ Manuel uniquement'}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Imprimante</div>
              <div className="text-[12px] font-bold text-slate-700 truncate">{cfg.printer || 'Imprimante système'}</div>
              <div className="text-[10px] text-blue-500 mt-0.5">Format {cfg.paperFormat} · {cfg.printerCopies} copie{cfg.printerCopies > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTE TECHNIQUE ── */}
      <div className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
        <strong className="text-slate-500">Note technique :</strong> La détection des caméras utilise l'API Web MediaDevices (HTTP requis ou localhost).
        Pour les imprimantes réseau, renseignez le nom exact du périphérique tel qu'il apparaît dans <em>Paramètres système → Imprimantes et scanners</em> de votre OS.
        La configuration est sauvegardée localement sur ce poste et appliquée à tous les modules Flowtym.
      </div>
    </div>
  );
};
