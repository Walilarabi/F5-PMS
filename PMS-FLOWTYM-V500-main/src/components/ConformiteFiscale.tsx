import React, { useEffect, useRef, useState } from 'react';

// Import direct du HTML comme string brute — feature native Vite (?raw)
// Zéro fetch, zéro dépendance réseau, fonctionne en standalone ET avec serveur
// @ts-ignore
import conformiteHtml from '../../public/conformite-fiscale.html?raw';

export default function ConformiteFiscale() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    // Créer un Blob URL à partir du HTML importé — isolation totale CSS/JS
    const blob = new Blob([conformiteHtml], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    setBlobUrl(url);

    // Nettoyage mémoire au démontage du composant
    return () => URL.revokeObjectURL(url);
  }, []);

  if (!blobUrl) return null;

  return (
    <div
      style={{
        height: 'calc(100vh - 180px)',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        background: '#f4f6fa',
      }}
    >
      <iframe
        ref={iframeRef}
        src={blobUrl}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Conformité Fiscale — Flowtym PMS"
        allow="downloads"
      />
    </div>
  );
}
