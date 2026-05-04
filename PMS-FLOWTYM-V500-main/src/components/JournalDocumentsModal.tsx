import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  History, 
  Upload, 
  FileText, 
  User, 
  Calendar, 
  Paperclip, 
  Trash2, 
  Download, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Image as ImageIcon,
  Mail as MailIcon,
  File as FileIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface JournalEvent {
  id: string;
  reservation_id: string;
  event_type: 'creation' | 'modification' | 'checkin' | 'checkout' | 'avis' | 'upload' | 'note';
  description: string;
  user_email: string;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  expires_at?: string;
}

interface JournalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  reservationName?: string;
}

export const JournalDocumentsModal: React.FC<JournalDocumentsModalProps> = ({
  isOpen,
  onClose,
  reservationId,
  reservationName
}) => {
  const [events, setEvents] = useState<JournalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newNote, setNewNote] = useState('');

  const fetchEvents = useCallback(async () => {
    if (!reservationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching journal events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, fetchEvents]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reservationId}/${Date.now()}-${file.name}`;
        const filePath = `documents/${fileName}`;

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Determine expiration based on file type (GDPR)
        let expiresAt: Date | null = null;
        if (file.type.includes('image') && (file.name.toLowerCase().includes('passport') || file.name.toLowerCase().includes('cni'))) {
          // Passport/CNI: 30 days
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
        } else if (file.type === 'application/pdf' && file.name.toLowerCase().includes('facture')) {
          // Invoice: 10 years
          expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 10);
        } else if (file.type.includes('image')) {
          // Screenshot/Review: 1 year
          expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        // 3. Insert record in documents table
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            reservation_id: reservationId,
            tenant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.tenant_id || '00000000-0000-0000-0000-000000000000',
            event_type: 'upload',
            description: `Ajout du document : ${file.name}`,
            user_email: (await supabase.auth.getUser()).data.user?.email || 'admin@flowtym.com',
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            expires_at: expiresAt?.toISOString()
          });

        if (insertError) throw insertError;
      }

      await fetchEvents();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erreur lors de l\'envoi du fichier.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `screenshot-${new Date().toISOString()}.png`, { type: 'image/png' });
          files.push(file);
        }
      }
    }
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          reservation_id: reservationId,
          tenant_id: (await supabase.auth.getUser()).data.user?.user_metadata?.tenant_id || '00000000-0000-0000-0000-000000000000',
          event_type: 'note',
          description: newNote,
          user_email: (await supabase.auth.getUser()).data.user?.email || 'admin@flowtym.com'
        });

      if (error) throw error;
      setNewNote('');
      await fetchEvents();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      // 1. Générer une URL signée (valable 1h) pour la sécurité
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      
      // 2. Ouvrir dans un nouvel onglet ou forcer le téléchargement
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Téléchargement démarré');
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    // Utilisation du système de toast global ou local
    const event = new CustomEvent('app-toast', { detail: { message: msg, type } });
    window.dispatchEvent(event);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end" onPaste={handlePaste}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-[600px] max-w-full bg-white shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Header - Styled to match your snippet */}
            <div className="bg-[#8B5CF6] p-6 text-white shrink-0 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6" />
                <h3 className="text-lg font-bold tracking-tight">Journal & Documents</h3>
              </div>
              <button onClick={onClose} className="text-2xl leading-none hover:rotate-90 transition-transform">
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                {/* Drag & Drop Zone */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onClick={() => document.getElementById('fileInputJournal')?.click()}
                  className={`border-2 border-dashed rounded-[20px] p-8 text-center transition-all cursor-pointer ${
                    isDragging ? 'border-[#8B5CF6] bg-[#f3e8ff]' : 'border-[#e2e8f0] bg-[#fafcff] hover:bg-[#f8faff]'
                  }`}
                >
                  <Upload className="w-10 h-10 text-[#8B5CF6] mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Glissez un fichier ici (PDF, image, email...)</p>
                  <p className="text-xs text-slate-400 mt-1">ou <strong>Ctrl+V</strong> pour coller une image</p>
                  <input 
                    type="file" 
                    id="fileInputJournal" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                  <button className="mt-4 px-6 py-2 bg-[#8B5CF6] text-white rounded-full text-xs font-bold hover:bg-[#7c4dff] transition-colors shadow-md">
                    Parcourir
                  </button>
                </div>

                {/* Historique */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[10px] font-bold text-[#475569] uppercase tracking-wider">
                        <th className="p-3 border-b border-[#e2e8f0]">Date / Heure</th>
                        <th className="p-3 border-b border-[#e2e8f0]">Événement</th>
                        <th className="p-3 border-b border-[#e2e8f0]">Utilisateur</th>
                        <th className="p-3 border-b border-[#e2e8f0] text-right">Doc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></td></tr>
                      ) : events.length === 0 ? (
                        <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-xs italic">Aucun événement enregistré.</td></tr>
                      ) : (
                        events.map((event) => (
                          <tr key={event.id} className="text-[11px] hover:bg-slate-50 transition-colors">
                            <td className="p-3 whitespace-nowrap text-slate-500">
                              {new Date(event.created_at).toLocaleString('fr-FR')}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-700">{event.description}</div>
                              {event.expires_at && (
                                <div className="text-[9px] text-amber-500 font-bold mt-0.5">
                                  RGPD: Expire le {new Date(event.expires_at).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-slate-500">
                              {event.user_email?.split('@')[0] || '—'}
                            </td>
                            <td className="p-3 text-right">
                              {event.file_path ? (
                                <button 
                                  onClick={() => downloadFile(event.file_path!, event.file_name!)}
                                  className="inline-flex items-center gap-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3 py-1.5 rounded-full text-slate-700 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span className="max-w-[80px] truncate">{event.file_name}</span>
                                </button>
                              ) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
