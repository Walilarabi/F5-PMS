// ═══════════════════════════════════════════════════════════════════════════
// lib/dateUtils.ts — Utilitaires date/timezone Flowtym PMS
//
// Convention : toutes les dates en DB sont stockées en DATE (YYYY-MM-DD),
// pas en TIMESTAMP, ce qui évite les décalages UTC.
// Les conversions locale↔UTC ne se font qu'à l'affichage.
// ═══════════════════════════════════════════════════════════════════════════

const HOTEL_TZ = 'Europe/Paris';

/** Retourne la date d'aujourd'hui en YYYY-MM-DD dans le fuseau hôtel */
export const todayLocal = (): string => {
  return new Date().toLocaleDateString('fr-CA', { timeZone: HOTEL_TZ });
};

/** Retourne la date d'aujourd'hui en YYYY-MM-DD UTC */
export const todayUTC = (): string => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * Parse une chaîne YYYY-MM-DD comme minuit LOCAL (évite le décalage UTC).
 * new Date('2026-04-10') = 2026-04-09T22:00:00 en Europe/Paris → bug classique.
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Convertit un objet Date en YYYY-MM-DD (fuseau local) */
export const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Calcule le nombre de nuits entre deux dates YYYY-MM-DD */
export const nightsBetween = (checkin: string, checkout: string): number => {
  if (!checkin || !checkout) return 0;
  const a = parseLocalDate(checkin);
  const b = parseLocalDate(checkout);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
};

/** Vérifie si une date YYYY-MM-DD est dans l'intervalle [from, to] inclus */
export const isDateInRange = (date: string, from: string, to: string): boolean => {
  return date >= from && date <= to;
};

/**
 * Détecte si deux plages de dates se chevauchent.
 * Utilisé pour la détection d'overbooking.
 * Convention : checkout = jour de départ (exclusif, comme en hôtellerie).
 */
export const rangesOverlap = (
  aCheckin: string,
  aCheckout: string,
  bCheckin: string,
  bCheckout: string,
): boolean => {
  return aCheckin < bCheckout && bCheckin < aCheckout;
};

/** Formate une date YYYY-MM-DD en affichage français ("15 avr. 2026") */
export const formatFR = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    return parseLocalDate(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/** Formate une plage de dates en libellé français ("15 avr. – 18 avr. 2026") */
export const formatRangeFR = (checkin: string, checkout: string): string => {
  if (!checkin || !checkout) return '';
  const cin = parseLocalDate(checkin);
  const cout = parseLocalDate(checkout);
  const sameYear = cin.getFullYear() === cout.getFullYear();

  const cinStr = cin.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  const coutStr = cout.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${cinStr} – ${coutStr}`;
};

/** Ajoute N jours à une date YYYY-MM-DD */
export const addDays = (dateStr: string, days: number): string => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
};

/** Retourne true si la date est passée (avant aujourd'hui) */
export const isPast = (dateStr: string): boolean => {
  return dateStr < todayLocal();
};

/** Retourne true si la date est aujourd'hui */
export const isToday = (dateStr: string): boolean => {
  return dateStr === todayLocal();
};

/** Retourne true si la date est dans le futur */
export const isFuture = (dateStr: string): boolean => {
  return dateStr > todayLocal();
};
