// =====================================================
// FLOWTYM PMS – CONNECTIVITÉ ENTRE MODULES
// Supabase Realtime + Synchronisation des données
// =====================================================

// ════════════════════════════════════════════════════════════
// 1. INITIALISATION SUPABASE
// ════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-clé-anon-publique';
const supabaseInstance = window.supabaseClient || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)) || null;

let currentHotelId = 1;
let realtimeChannels = [];

// ════════════════════════════════════════════════════════════
// 2. FONCTIONS DE MISE À JOUR PARTAGÉES
// ════════════════════════════════════════════════════════════

/**
 * Met à jour le statut d’une chambre
 */
async function updateRoomStatus(roomId, newStatus) {
  if (!supabaseInstance) return { data: null, error: new Error('Supabase client is not initialized') };
  const { data, error } = await supabaseInstance
    .from('rooms')
    .update({ status: newStatus, updated_at: new Date() })
    .eq('id', roomId)
    .select();
  
  if (error) console.error('Erreur updateRoomStatus:', error);
  return { data, error };
}

/**
 * Met à jour une réservation
 */
async function updateReservation(reservationId, updates) {
  if (!supabaseInstance) return { data: null, error: new Error('Supabase client is not initialized') };
  const { data, error } = await supabaseInstance
    .from('reservations')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', reservationId)
    .select();
  
  if (error) console.error('Erreur updateReservation:', error);
  return { data, error };
}

/**
 * Crée une tâche ménage
 */
async function createHousekeepingTask(roomId, status = 'pending', priority = 'normal') {
  if (!supabaseInstance) return { data: null, error: new Error('Supabase client is not initialized') };
  const { data, error } = await supabaseInstance
    .from('room_cleaning_tasks')
    .insert([{ room_id: roomId, status, priority, created_at: new Date() }])
    .select();
  
  if (error) console.error('Erreur createHousekeepingTask:', error);
  return { data, error };
}

/**
 * Met à jour les statistiques client (total_stays, total_spent)
 */
async function updateGuestStats(guestId) {
  if (!supabaseInstance) return;
  const { data: history, error: histError } = await supabaseInstance
    .from('guest_history')
    .select('amount')
    .eq('guest_id', guestId);
  
  if (histError) return;
  
  const totalStays = history.length;
  const totalSpent = history.reduce((sum, h) => sum + (h.amount || 0), 0);
  const lastStay = history.length > 0 ? history[0]?.stay_end : null;
  
  await supabaseInstance
    .from('guests')
    .update({ total_stays: totalStays, total_spent: totalSpent, last_stay_date: lastStay })
    .eq('id', guestId);
}

/**
 * Ajoute un paiement à une facture
 */
async function addPayment(invoiceId, amount, method) {
  if (!supabaseInstance) return { data: null, error: new Error('Supabase client is not initialized') };
  const { data, error } = await supabaseInstance
    .from('payments')
    .insert([{ invoice_id: invoiceId, amount, method, date: new Date() }])
    .select();
  
  if (error) console.error('Erreur addPayment:', error);
  return { data, error };
}

/**
 * Récupère la configuration (couleurs, TVA, code promo)
 */
async function loadConfiguration() {
  if (!supabaseInstance) return [];
  const { data, error } = await supabaseInstance
    .from('pms_configurations')
    .select('*')
    .eq('hotel_id', currentHotelId);
  
  if (error) console.error('Erreur loadConfiguration:', error);
  return data || [];
}

/**
 * Applique la configuration à l’interface (couleurs des canaux, etc.)
 */
function applyConfiguration(config) {
  const channelColors = config.find(c => c.module === 'channel_colors')?.config || {};
  const promoCode = config.find(c => c.module === 'promo_code')?.config?.code || 'FLOWTYM5';
  const vatRate = config.find(c => c.module === 'taxes')?.config?.vat_rate || 10;
  const cityTax = config.find(c => c.module === 'taxes')?.config?.city_tax || 2.50;
  
  // Stocker globalement pour les autres modules
  window.FlowtymConfig = { channelColors, promoCode, vatRate, cityTax };
  
  // Déclencher un événement pour que les modules se mettent à jour
  window.dispatchEvent(new CustomEvent('config-updated', { detail: window.FlowtymConfig }));
}

// ════════════════════════════════════════════════════════════
// 3. ACTIONS MÉTIER (appelées par les boutons)
// ════════════════════════════════════════════════════════════

/**
 * CHECK-IN
 */
async function performCheckin(roomId, guestId, checkinDate, checkoutDate, channel, paymentStatus) {
  // 1. Créer la réservation
  const { data: reservation, error: resError } = await supabaseInstance
    .from('reservations')
    .insert([{
      hotel_id: currentHotelId,
      room_id: roomId,
      guest_id: guestId,
      start_date: checkinDate,
      end_date: checkoutDate,
      status: 'checked_in',
      canal: channel,
      payment_status: paymentStatus,
      created_at: new Date()
    }])
    .select()
    .single();
  
  if (resError) throw resError;
  
  // 2. Mettre à jour le statut de la chambre
  await updateRoomStatus(roomId, 'occupied');
  
  // 3. Mettre à jour les stats du client
  await updateGuestStats(guestId);
  
  // 4. Émettre un événement pour rafraîchir les modules
  window.dispatchEvent(new CustomEvent('checkin-completed', { detail: { roomId, reservationId: reservation.id } }));
  
  return reservation;
}

/**
 * CHECK-OUT
 */
async function performCheckout(reservationId, roomId, invoiceData, payments) {
  // 1. Mettre à jour la réservation
  await updateReservation(reservationId, { status: 'checked_out', updated_at: new Date() });
  
  // 2. Libérer la chambre et créer une tâche ménage
  await updateRoomStatus(roomId, 'to_clean');
  await createHousekeepingTask(roomId, 'pending', 'high');
  
  // 3. Générer la facture
  const { data: invoice, error: invError } = await supabaseInstance
    .from('invoices')
    .insert([{
      reservation_id: reservationId,
      total_amount: invoiceData.total,
      paid_amount: invoiceData.paid,
      status: invoiceData.paid >= invoiceData.total ? 'paid' : 'partial',
      created_at: new Date()
    }])
    .select()
    .single();
  
  if (invError) throw invError;
  
  // 4. Enregistrer les paiements
  for (const payment of payments) {
    await addPayment(invoice.id, payment.amount, payment.method);
  }
  
  // 5. Émettre un événement
  window.dispatchEvent(new CustomEvent('checkout-completed', { detail: { roomId, reservationId, invoiceId: invoice.id } }));
  
  return invoice;
}

/**
 * DRAG & DROP – Déplacer une réservation
 */
async function moveReservation(reservationId, newRoomId, newStartDate, newEndDate) {
  // Vérifier si la chambre cible est disponible
  const { data: conflicts, error: conflictError } = await supabaseInstance
    .from('reservations')
    .select('*')
    .eq('room_id', newRoomId)
    .filter('start_date', 'lt', newEndDate)
    .filter('end_date', 'gt', newStartDate)
    .neq('id', reservationId);
  
  if (conflictError) throw conflictError;
  
  if (conflicts && conflicts.length > 0) {
    throw new Error('Conflit : chambre déjà réservée sur cette période');
  }
  
  // Déplacer la réservation
  const { data, error } = await supabaseInstance
    .from('reservations')
    .update({ room_id: newRoomId, start_date: newStartDate, end_date: newEndDate, updated_at: new Date() })
    .eq('id', reservationId)
    .select();
  
  if (error) throw error;
  
  window.dispatchEvent(new CustomEvent('reservation-moved', { detail: { reservationId, newRoomId, newStartDate, newEndDate } }));
  return data;
}

/**
 * VALIDER UN MÉNAGE (gouvernante)
 */
async function completeHousekeepingTask(taskId, roomId) {
  // 1. Terminer la tâche
  await supabaseInstance
    .from('room_cleaning_tasks')
    .update({ status: 'completed', completed_at: new Date() })
    .eq('id', taskId);
  
  // 2. Mettre à jour le statut de la chambre
  await updateRoomStatus(roomId, 'clean');
  
  window.dispatchEvent(new CustomEvent('housekeeping-completed', { detail: { roomId, taskId } }));
}

// ════════════════════════════════════════════════════════════
// 4. SYNCHRONISATION EN TEMPS RÉEL (SUPABASE REALTIME)
// ════════════════════════════════════════════════════════════

/**
 * Initialise les écouteurs Realtime pour tous les modules
 */
function initRealtime() {
  if (!supabaseInstance) {
    console.warn('Realtime Supabase non initialisé (client introuvable)');
    return;
  }
  // Nettoyer les anciens canaux
  realtimeChannels.forEach(channel => supabaseInstance.removeChannel(channel));
  realtimeChannels = [];
  
  // Canal pour les réservations
  const reservationsChannel = supabaseInstance.channel('reservations-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `hotel_id=eq.${currentHotelId}` }, 
      (payload) => {
        console.log('🔄 Réservation modifiée:', payload);
        window.dispatchEvent(new CustomEvent('reservations-updated', { detail: payload }));
      })
    .subscribe();
  realtimeChannels.push(reservationsChannel);
  
  // Canal pour les chambres
  const roomsChannel = supabaseInstance.channel('rooms-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `hotel_id=eq.${currentHotelId}` },
      (payload) => {
        console.log('🔄 Chambre modifiée:', payload);
        window.dispatchEvent(new CustomEvent('rooms-updated', { detail: payload }));
      })
    .subscribe();
  realtimeChannels.push(roomsChannel);
  
  // Canal pour les tâches ménage
  const tasksChannel = supabaseInstance.channel('tasks-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_cleaning_tasks' },
      (payload) => {
        console.log('🔄 Tâche ménage modifiée:', payload);
        window.dispatchEvent(new CustomEvent('tasks-updated', { detail: payload }));
      })
    .subscribe();
  realtimeChannels.push(tasksChannel);
  
  // Canal pour les configurations
  const configChannel = supabaseInstance.channel('config-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_configurations', filter: `hotel_id=eq.${currentHotelId}` },
      async () => {
        console.log('🔄 Configuration modifiée');
        const config = await loadConfiguration();
        applyConfiguration(config);
      })
    .subscribe();
  realtimeChannels.push(configChannel);
}

// ════════════════════════════════════════════════════════════
// 5. ÉCOUTEURS POUR LA COHÉRENCE ENTRE MODULES
// ════════════════════════════════════════════════════════════

/**
 * Met en place les écouteurs d’événements pour synchroniser les modules
 */
function initEventListeners() {
  // Quand une réservation est modifiée, rafraîchir Planning et Today
  window.addEventListener('reservations-updated', () => {
    if (window.refreshPlanning) window.refreshPlanning();
    if (window.refreshToday) window.refreshToday();
  });
  
  // Quand une chambre change de statut
  window.addEventListener('rooms-updated', (e) => {
    const { new: newRoom } = e.detail;
    if (window.updateRoomInPlanning) window.updateRoomInPlanning(newRoom);
    if (window.updateRoomInToday) window.updateRoomInToday(newRoom);
  });
  
  // Quand une tâche ménage est terminée
  window.addEventListener('tasks-updated', (e) => {
    const { new: newTask } = e.detail;
    if (newTask.status === 'completed' && window.updateRoomStatusFromHousekeeping) {
      window.updateRoomStatusFromHousekeeping(newTask.room_id, 'clean');
    }
  });
  
  // Quand un check-out est effectué
  window.addEventListener('checkout-completed', (e) => {
    const { roomId } = e.detail;
    if (window.markRoomForCleaning) window.markRoomForCleaning(roomId);
    if (window.updatePlanningAfterCheckout) window.updatePlanningAfterCheckout(roomId);
  });
  
  // Quand la configuration change
  window.addEventListener('config-updated', (e) => {
    if (window.applyChannelColors) window.applyChannelColors(e.detail.channelColors);
    if (window.updatePromoCode) window.updatePromoCode(e.detail.promoCode);
  });
}

// ════════════════════════════════════════════════════════════
// 6. INITIALISATION GLOBALE
// ════════════════════════════════════════════════════════════

/**
 * Initialise toute la connectivité
 */
async function initConnectivity() {
  // Charger la configuration initiale
  const config = await loadConfiguration();
  applyConfiguration(config);
  
  // Initialiser Realtime
  initRealtime();
  
  // Initialiser les écouteurs d’événements
  initEventListeners();
  
  console.log('✅ Connectivité Flowtym PMS initialisée');
}

// ════════════════════════════════════════════════════════════
// 7. VALIDATION DES BOUTONS (exemple pour Planning/Today)
// ════════════════════════════════════════════════════════════

/**
 * Vérifie que tous les boutons critiques sont fonctionnels
 */
function validateButtons() {
  const buttons = [
    { selector: '.checkout-btn', action: 'checkout', handler: performCheckout },
    { selector: '.checkin-btn', action: 'checkin', handler: performCheckin },
    { selector: '.housekeeping-btn', action: 'housekeeping', handler: completeHousekeepingTask },
    { selector: '.payment-btn', action: 'payment', handler: addPayment }
  ];
  
  buttons.forEach(btn => {
    document.querySelectorAll(btn.selector).forEach(el => {
      if (!el.hasAttribute('data-validated')) {
        el.setAttribute('data-validated', 'true');
        el.addEventListener('click', async (e) => {
          e.preventDefault();
          const data = el.dataset;
          try {
            await btn.handler(data);
            toast(`${btn.action} effectué avec succès`, 'success');
          } catch (error) {
            toast(`Erreur: ${error.message}`, 'error');
          }
        });
      }
    });
  });
}

// Exposer les fonctions globalement pour les autres modules
window.FlowtymConnectivity = {
  updateRoomStatus,
  updateReservation,
  createHousekeepingTask,
  addPayment,
  performCheckin,
  performCheckout,
  moveReservation,
  completeHousekeepingTask,
  loadConfiguration,
  initConnectivity,
  validateButtons
};

// Auto-initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  initConnectivity();
  
  // Attendre un peu que les modules soient chargés pour valider les boutons
  setTimeout(validateButtons, 1000);
});

function toast(message, type) {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // À connecter avec le système de toast existant du PMS
  if (window.showToast) window.showToast(message, type);
}