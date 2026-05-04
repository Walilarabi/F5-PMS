import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Calendar, Users, Baby, Mail, Phone, Bed, Globe,
  CreditCard, IdCard, StickyNote, LogIn, CheckCircle2,
  Camera, Scan, AlertCircle, MapPin, Flag, Hash,
  ChevronDown, Clock, DollarSign, FileText
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: any;
  rooms: any[];
  clients: any[];
  onConfirm: (data: any) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
const nights = (ci: string, co: string) => {
  if (!ci || !co) return 0;
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
};

const PAYMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  vcc:           { label: 'VCC Partenaire',   color: '#6366F1', bg: '#EEF2FF' },
  preauthorized: { label: 'Préautorisé',      color: '#F59E0B', bg: '#FFF7ED' },
  paid:          { label: 'Payé',             color: '#10B981', bg: '#ECFDF5' },
  refused:       { label: 'Refusé',           color: '#EF4444', bg: '#FEF2F2' },
  pending:       { label: 'En attente',       color: '#94A3B8', bg: '#F8FAFC' },
  partial:       { label: 'Acompte versé',    color: '#8B5CF6', bg: '#EDE9FE' },
};

// ─── ScannerModal — ouvre la caméra de l'ordinateur ─────────────────────────
const ScannerModal: React.FC<{ onClose: () => void; onCapture: (img: string) => void }> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Lire le scanner configuré dans localStorage
  const savedScanner = (() => {
    try { return JSON.parse(localStorage.getItem('flowtym_peripherals') || '{}').scanner || null; }
    catch { return null; }
  })();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // caméra arrière si dispo
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.'
          : err.name === 'NotFoundError'
          ? 'Aucune caméra détectée sur cet appareil.'
          : `Erreur caméra : ${err.message}`
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    setScanning(true);
    // Simulation OCR passeport (2s)
    setTimeout(() => setScanning(false), 2000);
  };

  const confirm = () => {
    if (captured) { onCapture(captured); stopCamera(); onClose(); }
  };

  const retry = () => { setCaptured(null); setScanning(false); };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-[#0F172A] rounded-[24px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Scan className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Scanner ID / Passeport</div>
              {savedScanner && <div className="text-[10px] text-violet-300/70">{savedScanner}</div>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5">
          {error ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-sm font-semibold text-white">{error}</div>
              <div className="text-[11px] text-white/40 max-w-xs">
                Vérifiez que la caméra est connectée et que l'accès est autorisé dans votre navigateur.
                <br/>Vous pouvez aussi configurer un scanner dédié dans <span className="text-violet-400">Paramètres → Périphériques</span>.
              </div>
              <button onClick={onClose} className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all">
                Fermer
              </button>
            </div>
          ) : !captured ? (
            <>
              {/* Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {/* Guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[60%] border-2 border-violet-400/70 rounded-xl relative">
                    {/* Coins */}
                    {['tl','tr','bl','br'].map(pos => (
                      <div key={pos} className={`absolute w-5 h-5 border-violet-400 ${
                        pos === 'tl' ? 'top-0 left-0 border-t-2 border-l-2 rounded-tl' :
                        pos === 'tr' ? 'top-0 right-0 border-t-2 border-r-2 rounded-tr' :
                        pos === 'bl' ? 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl' :
                        'bottom-0 right-0 border-b-2 border-r-2 rounded-br'
                      }`} />
                    ))}
                    {/* Ligne scan animée */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scanLine_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
                  </div>
                </div>
                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="text-[10px] font-semibold text-white/60 bg-black/40 px-3 py-1 rounded-full">
                    Placez la page données du passeport dans le cadre
                  </span>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={capture}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" /> Capturer le document
              </button>
            </>
          ) : (
            <>
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4">
                <img src={captured} alt="Capture" className="w-full h-full object-cover" />
                {scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
                    <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    <div className="text-sm font-semibold text-white">Lecture OCR en cours…</div>
                    <div className="text-[10px] text-white/50">Extraction des données du document</div>
                  </div>
                )}
                {!scanning && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Document capturé
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={retry} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all">
                  Reprendre
                </button>
                <button
                  onClick={confirm}
                  disabled={scanning}
                  className="flex-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmer
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── CheckinModal principal ───────────────────────────────────────────────────
export const CheckinModal: React.FC<CheckinModalProps> = ({
  isOpen, onClose, reservation, rooms, clients, onConfirm
}) => {
  const [formData, setFormData] = useState({
    guestName: '', arrivalDate: new Date().toISOString().split('T')[0],
    departureDate: '', adults: 1, children: 0, email: '', phone: '',
    roomId: '', channel: 'Direct', paymentStatus: 'pending', notes: '',
    // Champs enrichis
    nationality: '', passportNumber: '', passportExpiry: '',
    address: '', city: '', zipCode: '', country: '',
    montant: 0, solde: 0, acompte: 0, segment: '', ratePlan: '',
    reservationRef: '', bookingSource: '',
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [passportImg, setPassportImg] = useState<string | null>(null);
  const [tab, setTab] = useState<'info' | 'paiement' | 'document'>('info');

  // ─── Pré-remplissage depuis la réservation ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setTab('info');
    setPassportImg(null);

    if (reservation) {
      const client = clients.find(c => c.id === reservation.clientId);
      setFormData({
        guestName:      client?.name        || reservation.guestName     || '',
        arrivalDate:    reservation.checkin || reservation.check_in      || new Date().toISOString().split('T')[0],
        departureDate:  reservation.checkout|| reservation.check_out     || '',
        adults:         reservation.adults  || reservation.pax           || 2,
        children:       reservation.children                             || 0,
        email:          client?.email       || reservation.email         || reservation.guestEmail  || '',
        phone:          client?.phone       || reservation.phone         || reservation.guestPhone  || '',
        roomId:         reservation.room    || reservation.room_number   || '',
        channel:        reservation.canal   || reservation.source        || 'Direct',
        paymentStatus:  reservation.paymentStatus || reservation.payment_status || 'pending',
        notes:          reservation.notes   || reservation.special_requests || '',
        // Champs enrichis
        nationality:    client?.nationality || '',
        passportNumber: client?.passport    || '',
        passportExpiry: '',
        address:        client?.address     || '',
        city:           client?.city        || '',
        zipCode:        client?.zip         || '',
        country:        client?.country     || '',
        montant:        reservation.montant || reservation.total_amount  || 0,
        solde:          reservation.solde   || 0,
        acompte:        (reservation.montant || 0) - (reservation.solde || 0),
        segment:        reservation.segment || client?.segment           || '',
        ratePlan:       reservation.ratePlan|| reservation.rate_plan_id  || '',
        reservationRef: reservation.id      || reservation.reference     || '',
        bookingSource:  reservation.canal   || reservation.source        || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        guestName: '', arrivalDate: new Date().toISOString().split('T')[0],
        departureDate: '', adults: 1, children: 0, email: '', phone: '',
        roomId: '', channel: 'Direct', paymentStatus: 'pending', notes: '',
        nationality: '', passportNumber: '', passportExpiry: '',
        address: '', city: '', zipCode: '', country: '',
        montant: 0, solde: 0, acompte: 0, segment: '', ratePlan: '',
        reservationRef: '', bookingSource: '',
      }));
    }
  }, [reservation, clients, isOpen]);

  const set = (k: string, v: any) => setFormData(prev => ({ ...prev, [k]: v }));

  const handleValidate = () => {
    if (!formData.guestName || !formData.arrivalDate || !formData.departureDate || !formData.roomId) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Champs obligatoires manquants · Nom, Dates et Chambre requis' } }));
      return;
    }
    onConfirm({ ...formData, passportImg });
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Check-in validé · ${formData.guestName} · Ch. ${formData.roomId}` } }));
    onClose();
  };

  const payInfo = PAYMENT_LABELS[formData.paymentStatus] || PAYMENT_LABELS.pending;
  const stayNights = nights(formData.arrivalDate, formData.departureDate);

  const FIELD = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-[3px] focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] focus:bg-white outline-none text-sm font-medium transition-all";
  const LABEL = "flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1.5";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {scannerOpen && (
          <ScannerModal
            onClose={() => setScannerOpen(false)}
            onCapture={(img) => {
              setPassportImg(img);
              setScannerOpen(false);
              setTab('document');
              window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Document scanné · En attente de vérification' } }));
            }}
          />
        )}

        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[640px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col my-auto"
          >
            {/* ── HEADER ── */}
            <div className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white px-6 py-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight">Enregistrement Check-in</h3>
                    {formData.reservationRef && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-semibold">{formData.reservationRef}</span>
                        {formData.bookingSource && <span className="text-[10px] text-white/60">{formData.bookingSource}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Récapitulatif réservation */}
              {reservation && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Arrivée', value: fmtDate(formData.arrivalDate), icon: '📅' },
                    { label: 'Départ',  value: fmtDate(formData.departureDate), icon: '📅' },
                    { label: 'Nuits',   value: stayNights || '—', icon: '🌙' },
                    { label: 'Chambre', value: formData.roomId || '—', icon: '🏨' },
                  ].map(item => (
                    <div key={item.label} className="bg-white/10 rounded-xl px-3 py-2">
                      <div className="text-[9px] text-white/60 font-semibold uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm font-bold mt-0.5">{item.icon} {item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── ONGLETS ── */}
            <div className="flex border-b border-slate-100 bg-white px-4">
              {([
                { id: 'info',      label: 'Informations', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'paiement',  label: 'Paiement',     icon: <CreditCard className="w-3.5 h-3.5" /> },
                { id: 'document',  label: 'Document ID',  icon: <IdCard className="w-3.5 h-3.5" /> },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-semibold border-b-2 transition-all ${
                    tab === t.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}>
                  {t.icon} {t.label}
                  {t.id === 'document' && passportImg && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                  )}
                </button>
              ))}
            </div>

            {/* ── BODY ── */}
            <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>

              {/* ── TAB INFO ── */}
              {tab === 'info' && (
                <>
                  {/* Client */}
                  <div>
                    <label className={LABEL}><User className="w-3 h-3" /> Nom complet <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="Prénom Nom" className={FIELD} value={formData.guestName} onChange={e => set('guestName', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}><Mail className="w-3 h-3" /> Email</label>
                      <input type="email" placeholder="client@email.com" className={FIELD} value={formData.email} onChange={e => set('email', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}><Phone className="w-3 h-3" /> Téléphone</label>
                      <input type="tel" placeholder="+33 6 12 34 56 78" className={FIELD} value={formData.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL}><Calendar className="w-3 h-3" /> Arrivée <span className="text-red-400">*</span></label>
                      <input type="date" className={FIELD} value={formData.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}><Calendar className="w-3 h-3" /> Départ <span className="text-red-400">*</span></label>
                      <input type="date" className={FIELD} value={formData.departureDate} onChange={e => set('departureDate', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}><Bed className="w-3 h-3" /> Chambre <span className="text-red-400">*</span></label>
                      <select className={FIELD + ' appearance-none cursor-pointer'} value={formData.roomId} onChange={e => set('roomId', e.target.value)}>
                        <option value="">Sélectionner...</option>
                        {rooms.map(r => (
                          <option key={r.id || r.num} value={r.id || r.num}>
                            Ch. {r.number || r.num} — {r.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL}><Users className="w-3 h-3" /> Adultes</label>
                      <input type="number" min={1} className={FIELD} value={formData.adults} onChange={e => set('adults', +e.target.value || 1)} />
                    </div>
                    <div>
                      <label className={LABEL}><Baby className="w-3 h-3" /> Enfants</label>
                      <input type="number" min={0} className={FIELD} value={formData.children} onChange={e => set('children', +e.target.value || 0)} />
                    </div>
                    <div>
                      <label className={LABEL}><Globe className="w-3 h-3" /> Canal</label>
                      <select className={FIELD + ' appearance-none cursor-pointer'} value={formData.channel} onChange={e => set('channel', e.target.value)}>
                        {['Direct','Booking.com','Expedia','Airbnb','Téléphone','Agence','Tour Opérator'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}><Flag className="w-3 h-3" /> Nationalité</label>
                      <input type="text" placeholder="ex: Française" className={FIELD} value={formData.nationality} onChange={e => set('nationality', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}><Hash className="w-3 h-3" /> N° Passeport / CNI</label>
                      <input type="text" placeholder="ex: 12AB345678" className={FIELD} value={formData.passportNumber} onChange={e => set('passportNumber', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}><MapPin className="w-3 h-3" /> Adresse</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="Adresse" className={FIELD + ' col-span-2'} style={{ gridColumn: 'span 2' }} value={formData.address} onChange={e => set('address', e.target.value)} />
                      <input type="text" placeholder="Code postal" className={FIELD} value={formData.zipCode} onChange={e => set('zipCode', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input type="text" placeholder="Ville" className={FIELD} value={formData.city} onChange={e => set('city', e.target.value)} />
                      <input type="text" placeholder="Pays" className={FIELD} value={formData.country} onChange={e => set('country', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}><StickyNote className="w-3 h-3" /> Notes / Préférences</label>
                    <textarea rows={2} placeholder="Allergies, heure d'arrivée tardive, préférence chambre..." className={FIELD + ' resize-none'} value={formData.notes} onChange={e => set('notes', e.target.value)} />
                  </div>
                </>
              )}

              {/* ── TAB PAIEMENT ── */}
              {tab === 'paiement' && (
                <>
                  {/* Récap financier */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total séjour', value: `${formData.montant.toFixed(2)} €`, color: '#1E293B' },
                      { label: 'Déjà réglé',   value: `${formData.acompte.toFixed(2)} €`, color: '#10B981' },
                      { label: 'Solde restant', value: `${formData.solde.toFixed(2)} €`,  color: formData.solde > 0 ? '#EF4444' : '#10B981' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                        <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Statut paiement */}
                  <div>
                    <label className={LABEL}><CreditCard className="w-3 h-3" /> Statut du paiement</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PAYMENT_LABELS).map(([key, info]) => (
                        <button key={key} onClick={() => set('paymentStatus', key)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold border-2 transition-all text-left"
                          style={{
                            background: formData.paymentStatus === key ? info.bg : '#F8FAFC',
                            borderColor: formData.paymentStatus === key ? info.color : '#E2E8F0',
                            color: formData.paymentStatus === key ? info.color : '#94A3B8',
                          }}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
                          {info.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Solde warning */}
                  {formData.solde > 0 && (
                    <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[12px] font-semibold text-amber-700">Solde impayé détecté</div>
                        <div className="text-[11px] text-amber-600 mt-0.5">
                          Un solde de <strong>{formData.solde.toFixed(2)} €</strong> reste à encaisser lors du check-in.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plan tarifaire et segment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}><FileText className="w-3 h-3" /> Plan tarifaire</label>
                      <input type="text" className={FIELD} value={formData.ratePlan} onChange={e => set('ratePlan', e.target.value)} placeholder="ex: Tarif public" />
                    </div>
                    <div>
                      <label className={LABEL}><Users className="w-3 h-3" /> Segment</label>
                      <select className={FIELD + ' appearance-none cursor-pointer'} value={formData.segment} onChange={e => set('segment', e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {['Loisir','Business','Corpo','Groupe','Agence','TO','Famille','VIP'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── TAB DOCUMENT ID ── */}
              {tab === 'document' && (
                <div className="space-y-4">
                  {/* Zone scanner */}
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="w-full p-5 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 transition-all group"
                    style={{
                      borderColor: passportImg ? '#10B981' : '#8B5CF6',
                      background: passportImg ? '#ECFDF5' : '#F5F3FF',
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ background: passportImg ? '#D1FAE5' : '#EDE9FE' }}>
                      {passportImg ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <Scan className="w-7 h-7 text-violet-600" />}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: passportImg ? '#065F46' : '#4C1D95' }}>
                        {passportImg ? 'Document scanné ✓' : 'Scanner ID / Passeport'}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: passportImg ? '#34D399' : '#7C3AED' }}>
                        {passportImg ? 'Cliquez pour rescanner' : 'Ouvre la caméra — positionnez le document dans le cadre'}
                      </div>
                    </div>
                  </button>

                  {/* Aperçu capture */}
                  {passportImg && (
                    <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 relative">
                      <img src={passportImg} alt="Document scanné" className="w-full h-40 object-cover" />
                      <div className="absolute top-2 right-2">
                        <button onClick={() => setPassportImg(null)}
                          className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs hover:bg-red-600 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-3">
                        <div className="text-[10px] font-semibold text-white">Document capturé — vérification manuelle requise</div>
                      </div>
                    </div>
                  )}

                  {/* Champs manuels */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}><Hash className="w-3 h-3" /> N° Document</label>
                      <input type="text" placeholder="Numéro passeport / CNI" className={FIELD} value={formData.passportNumber} onChange={e => set('passportNumber', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL}><Clock className="w-3 h-3" /> Date d'expiration</label>
                      <input type="date" className={FIELD} value={formData.passportExpiry} onChange={e => set('passportExpiry', e.target.value)} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                    <strong className="text-slate-600">Note RGPD :</strong> Les données du document sont stockées de manière chiffrée et supprimées automatiquement 30 jours après le check-out, conformément au RGPD.
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER ── */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {/* Indicateur statut paiement */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: payInfo.bg, color: payInfo.color }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: payInfo.color }} />
                  {payInfo.label}
                </div>
                {stayNights > 0 && (
                  <div className="text-[10px] font-semibold text-slate-400">
                    {stayNights} nuit{stayNights > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all">
                  Annuler
                </button>
                <button onClick={handleValidate}
                  className="px-7 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}>
                  <CheckCircle2 className="w-4 h-4" /> Valider Check-in
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
};
