import { ReservationFormData } from '../components/modals/ReservationFormModal';

export interface ReportKPIs {
  occupancyRate: number;
  adr: number;
  revPar: number;
  totalRevenue: number;
  totalNights: number;
  avgStayLength: number;
}

export const calculateKPIs = (reservations: any[], totalRoomsCount: number, period?: { start: string, end: string }): ReportKPIs => {
  let filtered = reservations.filter(r => r.status !== 'cancelled');
  if (period) {
    filtered = filtered.filter(r => r.checkIn >= period.start && r.checkIn <= period.end);
  }
  
  const totalNights = filtered.reduce((sum, r) => sum + (r.nights || 0), 0);
  const totalRevenue = filtered.reduce((sum, r) => sum + (r.totalTTC || 0), 0);
  
  const occupancyRate = totalRoomsCount > 0 ? (totalNights / (totalRoomsCount * 30)) * 100 : 0; 
  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  const revPar = totalRoomsCount > 0 ? totalRevenue / (totalRoomsCount * 30) : 0;
  
  return {
    occupancyRate: Math.min(100, Math.max(0, occupancyRate)),
    adr,
    revPar,
    totalRevenue,
    totalNights,
    avgStayLength: filtered.length > 0 ? totalNights / filtered.length : 0
  };
};

export const getComparisonData = (reservations: any[], totalRoomsCount: number, currentPeriod: { start: string, end: string }) => {
  const currentKpis = calculateKPIs(reservations, totalRoomsCount, currentPeriod);
  
  const lastYearStart = new Date(currentPeriod.start);
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
  const lastYearEnd = new Date(currentPeriod.end);
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);
  
  // Use YYYY-MM-DD exactly
  const lastYearStartStr = lastYearStart.toISOString().split('T')[0];
  const lastYearEndStr = lastYearEnd.toISOString().split('T')[0];

  const lastYearKpis = calculateKPIs(reservations, totalRoomsCount, { 
    start: lastYearStartStr, 
    end: lastYearEndStr 
  });

  const getDiff = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current: currentKpis,
    previous: lastYearKpis,
    diff: {
      totalRevenue: getDiff(currentKpis.totalRevenue, lastYearKpis.totalRevenue),
      occupancyRate: getDiff(currentKpis.occupancyRate, lastYearKpis.occupancyRate),
      adr: getDiff(currentKpis.adr, lastYearKpis.adr),
      revPar: getDiff(currentKpis.revPar, lastYearKpis.revPar)
    }
  };
};

export const getOccupancyByDay = (reservations: any[], days: number = 30) => {
  const data: Record<string, number> = {};
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    data[dateStr] = 0;
    
    reservations.forEach(r => {
      if (r.checkIn <= dateStr && r.checkOut > dateStr && r.status !== 'cancelled') {
        data[dateStr]++;
      }
    });
  }
  
  return Object.entries(data).map(([date, count]) => ({ date, count }));
};

export const getRevenueByChannel = (reservations: any[]) => {
  const channels: Record<string, number> = {};
  reservations.forEach(r => {
    if (r.status !== 'cancelled') {
      const channel = r.channel || 'Direct';
      channels[channel] = (channels[channel] || 0) + (r.totalTTC || 0);
    }
  });
  return Object.entries(channels).map(([name, value]) => ({ name, value }));
};

export const getRevenueBySegment = (reservations: any[]) => {
  const segments: Record<string, number> = {};
  reservations.forEach(r => {
    if (r.status !== 'cancelled') {
      const segment = r.segment || 'Loisir';
      segments[segment] = (segments[segment] || 0) + (r.totalTTC || 0);
    }
  });
  return Object.entries(segments).map(([name, value]) => ({ name, value }));
};

// ─── MÉTRIQUES PLANNING ──────────────────────────────────────────────────────

export interface DayMetric {
  ca: number;
  adr: number;
  revpar: number;
  occ: number;
  score: number;
  occupiedCount: number;
}

export interface MonthMetric {
  totalCA: number;
  avgOcc: number;
  avgADR: number;
  avgRevPAR: number;
  monthScore: number;
}

/**
 * Calcule les métriques hôtelières pour un jour donné à partir des réservations.
 * Fonction pure — pas de dépendance React.
 */
export function computeDayMetrics(
  reservations: any[],
  dateStr: string,
  totalRoomsCount: number
): DayMetric {
  if (totalRoomsCount === 0) {
    return { ca: 0, adr: 0, revpar: 0, occ: 0, score: 0, occupiedCount: 0 };
  }

  const active = reservations.filter(r => {
    const status = r.reservationStatus ?? 'confirmed';
    if (status === 'cancelled') return false;
    const arrDate = (r.checkIn ?? r.arrival ?? '').split(' ')[0];
    const depDate = (r.checkOut ?? r.departure ?? '').split(' ')[0];
    return arrDate <= dateStr && depDate > dateStr;
  });

  const occupiedCount = active.length;

  const ca = active.reduce((sum, r) => {
    const arrDate = (r.checkIn ?? r.arrival ?? '').split(' ')[0];
    const depDate = (r.checkOut ?? r.departure ?? '').split(' ')[0];
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(depDate).getTime() - new Date(arrDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    return sum + (r.totalAmount ?? 0) / nights;
  }, 0);

  const adr = occupiedCount > 0 ? ca / occupiedCount : 0;
  const revpar = ca / totalRoomsCount;
  const occ = (occupiedCount / totalRoomsCount) * 100;

  const toNorm = occ / 100;
  const adrNorm = Math.min(adr / 200, 1);
  const cancelled = reservations.filter(r => (r.reservationStatus ?? 'confirmed') === 'cancelled').length;
  const total = reservations.length;
  const retention = total > 0 ? Math.max(0, 1 - cancelled / total) : 1;
  const pickup = 0.5;

  const score = Math.round(
    toNorm * 40 + adrNorm * 30 + retention * 20 + pickup * 10
  );

  return { ca, adr, revpar, occ, score, occupiedCount };
}

/**
 * Agrège les métriques journalières pour un mois complet.
 */
export function computeMonthlyKPIs(
  reservations: any[],
  year: number,
  month: number,
  totalRoomsCount: number
): MonthMetric {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalCA = 0;
  let sumOcc = 0;
  let sumADR = 0;
  let sumRevPAR = 0;
  let daysWithData = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const m = computeDayMetrics(reservations, dateStr, totalRoomsCount);
    totalCA += m.ca;
    sumOcc += m.occ;
    sumADR += m.adr;
    sumRevPAR += m.revpar;
    if (m.occupiedCount > 0) daysWithData++;
  }

  const activeDays = Math.max(1, daysWithData);
  const avgOcc = sumOcc / daysInMonth;
  const avgADR = daysWithData > 0 ? sumADR / activeDays : 0;
  const avgRevPAR = sumRevPAR / daysInMonth;

  const toNorm = avgOcc / 100;
  const adrNorm = Math.min(avgADR / 200, 1);
  const cancelled = reservations.filter(r => (r.reservationStatus ?? 'confirmed') === 'cancelled').length;
  const total = reservations.length;
  const retention = total > 0 ? Math.max(0, 1 - cancelled / total) : 1;
  const monthScore = Math.round(toNorm * 40 + adrNorm * 30 + retention * 20 + 0.5 * 10);

  return { totalCA, avgOcc, avgADR, avgRevPAR, monthScore };
}
