/**
 * ═══════════════════════════════════════════════════════════════
 * FLOWTYM PMS — Module Conformité Fiscale
 * Intégration non invasive — plug & play
 *
 * Ce script :
 *   1. Injecte un bouton dans la nav principale de Flowtym
 *   2. Ouvre le module dans une modale isolée (iframe sandboxé)
 *   3. Ne modifie AUCUN fichier existant
 *   4. Désactivable via localStorage.setItem('flowtym_conformite', 'off')
 *
 * Installation : <script defer src="/conformite-integration.js"></script>
 * Placé juste avant </body> dans index.html — ou chargé dynamiquement.
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── Guard : désactivation possible via localStorage ──────────
  if (localStorage.getItem('flowtym_conformite') === 'off') {
    console.info('[Conformité] Module désactivé via localStorage.');
    return;
  }

  // ── Guard : ne s'injecter qu'une seule fois ──────────────────
  if (document.getElementById('flowtym-conformite-btn')) return;

  const MODULE_URL = '/conformite-fiscale.html';
  const BTN_ID     = 'flowtym-conformite-btn';
  const MODAL_ID   = 'flowtym-conformite-modal';

  // ────────────────────────────────────────────────────────────
  // 1. STYLES INJECTÉS (scoped, ne polluent pas l'existant)
  // ────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'flowtym-conformite-styles';
  style.textContent = `
    /* ── Bouton nav ── */
    #${BTN_ID} {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      height: 36px;
      border-radius: 12px;
      border: none;
      background: transparent;
      color: #64748b;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background .15s, color .15s;
      flex-shrink: 0;
    }
    #${BTN_ID}:hover {
      background: #EDE9FE;
      color: #6D28D9;
    }
    #${BTN_ID} .cfi-icon {
      font-size: 10px;
      color: #a78bfa;
      transition: transform .15s;
    }
    #${BTN_ID}:hover .cfi-icon { transform: scale(1.15); }
    #${BTN_ID} .cfi-badge {
      font-size: 9px;
      font-weight: 700;
      background: #EDE9FE;
      color: #6D28D9;
      padding: 2px 7px;
      border-radius: 20px;
      letter-spacing: .3px;
    }

    /* ── Modale ── */
    #${MODAL_ID} {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      align-items: center;
      justify-content: center;
    }
    #${MODAL_ID}.cfi-open { display: flex; }

    /* Animation entrée */
    @keyframes cfiIn {
      from { opacity: 0; transform: scale(.96) translateY(12px); }
      to   { opacity: 1; transform: scale(1)   translateY(0); }
    }

    #${MODAL_ID} .cfi-shell {
      position: relative;
      width: 94vw;
      height: 92vh;
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,.24);
      animation: cfiIn .22s cubic-bezier(.34,1.2,.64,1) both;
      display: flex;
      flex-direction: column;
    }

    /* Barre de titre de la modale */
    #${MODAL_ID} .cfi-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 48px;
      background: linear-gradient(130deg, #8B5CF6, #6D28D9);
      flex-shrink: 0;
    }
    #${MODAL_ID} .cfi-titlebar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #${MODAL_ID} .cfi-titlebar-logo {
      width: 28px; height: 28px;
      background: rgba(255,255,255,.18);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: #fff;
    }
    #${MODAL_ID} .cfi-titlebar-name {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      letter-spacing: .2px;
    }
    #${MODAL_ID} .cfi-titlebar-sub {
      font-size: 10px;
      color: rgba(255,255,255,.65);
      margin-top: 1px;
    }
    #${MODAL_ID} .cfi-close {
      width: 32px; height: 32px;
      background: rgba(255,255,255,.15);
      border: none; border-radius: 50%;
      color: #fff; font-size: 14px;
      cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: background .15s;
    }
    #${MODAL_ID} .cfi-close:hover { background: rgba(255,255,255,.28); }

    /* iframe */
    #${MODAL_ID} iframe {
      flex: 1;
      border: none;
      width: 100%;
      display: block;
    }
  `;
  document.head.appendChild(style);

  // ────────────────────────────────────────────────────────────
  // 2. INJECTION DU BOUTON DANS LA NAV
  // ────────────────────────────────────────────────────────────
  function injectButton() {
    // Cibler la nav bar de Flowtym (sticky, bg-white, border-b)
    // On cherche le conteneur flex des groupes nav
    const navBar = document.querySelector('nav > div.flex.items-center');
    if (!navBar) return false;

    const btn = document.createElement('button');
    btn.id   = BTN_ID;
    btn.type = 'button';
    btn.title = 'Ouvrir le module Conformité Fiscale (Ctrl+Shift+F)';
    btn.innerHTML = `
      <i class="fa-solid fa-shield-check cfi-icon"></i>
      <span>Platform</span>
      <span class="cfi-badge">⚖️ Fiscal</span>
    `;
    btn.addEventListener('click', openModal);

    // Insérer à la fin de la barre nav, après le dernier groupe
    navBar.appendChild(btn);
    return true;
  }

  // ────────────────────────────────────────────────────────────
  // 3. MODALE ISOLÉE (iframe sandboxé)
  // ────────────────────────────────────────────────────────────
  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;

    overlay.innerHTML = `
      <div class="cfi-shell">
        <div class="cfi-titlebar">
          <div class="cfi-titlebar-left">
            <div class="cfi-titlebar-logo">
              <i class="fa-solid fa-shield-check"></i>
            </div>
            <div>
              <div class="cfi-titlebar-name">Conformité Fiscale</div>
              <div class="cfi-titlebar-sub">Flowtym PMS — E-invoicing · E-reporting · PDP</div>
            </div>
          </div>
          <button class="cfi-close" id="cfi-close-btn" title="Fermer (Échap)">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <iframe
          src="${MODULE_URL}"
          title="Conformité Fiscale — Flowtym PMS"
          allow="downloads"
          loading="lazy"
        ></iframe>
      </div>
    `;

    // Fermer sur clic overlay (hors shell)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);

    document.getElementById('cfi-close-btn')
      .addEventListener('click', closeModal);
  }

  function openModal() {
    buildModal(); // idempotent
    document.getElementById(MODAL_ID).classList.add('cfi-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const m = document.getElementById(MODAL_ID);
    if (m) m.classList.remove('cfi-open');
    document.body.style.overflow = '';
  }

  // ────────────────────────────────────────────────────────────
  // 4. RACCOURCI CLAVIER Ctrl+Shift+F (non invasif)
  //    Écoute en phase bubble APRÈS les listeners existants
  // ────────────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    // Ctrl+Shift+F → ouvre/ferme le module
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
      const modal = document.getElementById(MODAL_ID);
      if (modal?.classList.contains('cfi-open')) {
        e.preventDefault();
        closeModal();
      } else {
        e.preventDefault();
        openModal();
      }
    }
    // Échap → ferme si ouvert (ne bloque pas les autres écouteurs)
    if (e.key === 'Escape') {
      const modal = document.getElementById(MODAL_ID);
      if (modal?.classList.contains('cfi-open')) closeModal();
    }
  });

  // ────────────────────────────────────────────────────────────
  // 5. INIT — attendre que React ait rendu la nav
  //    MutationObserver : dès que la nav bar apparaît dans le DOM
  // ────────────────────────────────────────────────────────────
  function tryInject() {
    if (injectButton()) {
      console.info('[Conformité] Module injecté dans la navigation Flowtym.');
      return;
    }
    // Si la nav n'est pas encore là, on observe le DOM
    const observer = new MutationObserver(function (_, obs) {
      if (injectButton()) {
        obs.disconnect();
        console.info('[Conformité] Module injecté (après hydratation React).');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Sécurité : arrêter l'observation après 10s si React ne rend pas
    setTimeout(() => {
      observer.disconnect();
      if (!document.getElementById(BTN_ID)) {
        console.warn('[Conformité] Nav Flowtym introuvable après 10s — injection abandonnée.');
      }
    }, 10000);
  }

  // Lancer après le chargement complet du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

})();
