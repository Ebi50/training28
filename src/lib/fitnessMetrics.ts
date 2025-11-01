/**
 * Training Stress Metrics Calculator
 * Calculates CTL, ATL, and TSB from activity history
 */

interface ActivityMetrics {
  date: string;
  tss: number;
}

interface FitnessMetrics {
  ctl: number; // Chronic Training Load (Fitness) - 42-day exponential moving average
  atl: number; // Acute Training Load (Fatigue) - 7-day exponential moving average
  tsb: number; // Training Stress Balance (Form) = CTL - ATL
}

/**
 * Calculate TSS (Training Stress Score) from activity data
 * Uses multiple methods depending on available data
 */
export function calculateTSS(params: {
  movingTimeSeconds: number;
  normalizedPower?: number;
  averagePower?: number;
  averageHeartRate?: number;
  ftp?: number;
  lthr?: number;
}): number {
  const { movingTimeSeconds, normalizedPower, averagePower, averageHeartRate, ftp, lthr } = params;
  const movingTimeHours = movingTimeSeconds / 3600;

  // Method 1: Power-based TSS (most accurate)
  if (normalizedPower && ftp && ftp > 0) {
    const intensityFactor = normalizedPower / ftp;
    return (movingTimeSeconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
  }

  // Method 2: Average power-based TSS (fallback)
  if (averagePower && ftp && ftp > 0) {
    const intensityFactor = averagePower / ftp;
    return (movingTimeSeconds * averagePower * intensityFactor) / (ftp * 3600) * 100;
  }

  // Method 3: Heart rate-based TSS (HRSS)
  if (averageHeartRate && lthr && lthr > 0) {
    const hrRatio = averageHeartRate / lthr;
    // HRSS formula: duration (hours) * HR ratio^2 * 100
    return movingTimeHours * Math.pow(hrRatio, 2) * 100;
  }

  // Method 4: RPE-based estimate (very rough)
  // Assume moderate intensity (IF ~0.75) for activities without power/HR
  const estimatedIF = 0.75;
  return movingTimeHours * 100 * estimatedIF;
}

/**
 * Calculate exponential moving average (EMA)
 * 
 * FORMEL: EMA_neu = EMA_alt + α × (Wert_heute - EMA_alt)
 * 
 * Wobei α (Alpha) = 2 / (N + 1)
 * - Für CTL (42 Tage): α = 2/43 ≈ 0.0465 (langsame Änderung, Fitness)
 * - Für ATL (7 Tage):  α = 2/8  = 0.25   (schnelle Änderung, Fatigue)
 * 
 * Beispiel CTL:
 *   CTL_alt = 60, TSS_heute = 100
 *   CTL_neu = 60 + 0.0465 × (100 - 60) = 60 + 1.86 = 61.86
 * 
 * Beispiel ATL:
 *   ATL_alt = 50, TSS_heute = 100
 *   ATL_neu = 50 + 0.25 × (100 - 50) = 50 + 12.5 = 62.5
 * 
 * 📚 Ausführliche Erklärung siehe: EMA_FORMEL_ERKLAERUNG.md
 * 
 * @param previousEMA Previous EMA value
 * @param currentValue Current day's value (TSS)
 * @param days Time constant (42 for CTL, 7 for ATL)
 * @returns New EMA value
 */
function calculateEMA(previousEMA: number, currentValue: number, days: number): number {
  // Glättungsfaktor berechnen: α = 2 / (N + 1)
  const alpha = 2 / (days + 1);
  
  // EMA-Formel anwenden: EMA_neu = EMA_alt + α × (Wert_heute - EMA_alt)
  return previousEMA + alpha * (currentValue - previousEMA);
}

/**
 * Calculate fitness metrics (CTL, ATL, TSB) from activity history
 * @param activities Array of activities with TSS values
 * @param initialCTL Starting CTL value (default 0)
 * @param initialATL Starting ATL value (default 0)
 */
export function calculateFitnessMetrics(
  activities: ActivityMetrics[],
  initialCTL: number = 0,
  initialATL: number = 0
): FitnessMetrics {
  if (activities.length === 0) {
    return { ctl: initialCTL, atl: initialATL, tsb: initialCTL - initialATL };
  }

  // Sort activities by date (oldest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let ctl = initialCTL;
  let atl = initialATL;

  // Create daily TSS totals
  const dailyTSS = new Map<string, number>();
  sortedActivities.forEach(activity => {
    const date = activity.date.split('T')[0]; // Get YYYY-MM-DD
    dailyTSS.set(date, (dailyTSS.get(date) || 0) + activity.tss);
  });

  // Calculate CTL and ATL day by day
  const startDate = new Date(sortedActivities[0].date);
  const endDate = new Date(sortedActivities[sortedActivities.length - 1].date);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const todayTSS = dailyTSS.get(dateStr) || 0;
    
    // Update CTL (42-day EMA)
    ctl = calculateEMA(ctl, todayTSS, 42);
    
    // Update ATL (7-day EMA)
    atl = calculateEMA(atl, todayTSS, 7);
  }

  // Calculate TSB (Form)
  const tsb = ctl - atl;

  return {
    ctl: Math.round(ctl * 10) / 10,
    atl: Math.round(atl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10
  };
}

/**
 * Calculate fitness metrics history (day-by-day CTL, ATL, TSB)
 * Returns array of daily metrics for charting
 * @param activities Array of activities with TSS values
 * @param initialCTL Starting CTL value (default 0)
 * @param initialATL Starting ATL value (default 0)
 * @param daysToShow Number of recent days to return (default 42)
 */
export function calculateFitnessMetricsHistory(
  activities: ActivityMetrics[],
  initialCTL: number = 0,
  initialATL: number = 0,
  daysToShow: number = 42
): Array<{ date: string; ctl: number; atl: number; tsb: number }> {
  if (activities.length === 0) {
    return [];
  }

  // Sort activities by date (oldest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let ctl = initialCTL;
  let atl = initialATL;

  // Create daily TSS totals
  const dailyTSS = new Map<string, number>();
  sortedActivities.forEach(activity => {
    const date = activity.date.split('T')[0]; // Get YYYY-MM-DD
    dailyTSS.set(date, (dailyTSS.get(date) || 0) + activity.tss);
  });

  // Calculate CTL and ATL day by day, storing history
  const history: Array<{ date: string; ctl: number; atl: number; tsb: number }> = [];
  const startDate = new Date(sortedActivities[0].date);
  const endDate = new Date(sortedActivities[sortedActivities.length - 1].date);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const todayTSS = dailyTSS.get(dateStr) || 0;
    
    // Update CTL (42-day EMA)
    ctl = calculateEMA(ctl, todayTSS, 42);
    
    // Update ATL (7-day EMA)
    atl = calculateEMA(atl, todayTSS, 7);

    // Calculate TSB
    const tsb = ctl - atl;

    history.push({
      date: dateStr,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10
    });
  }

  // Return only last N days
  return history.slice(-daysToShow);
}

/**
 * Interpret TSB value for user feedback
 */
export function interpretTSB(tsb: number): {
  status: 'fresh' | 'optimal' | 'tired' | 'fatigued';
  message: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
} {
  if (tsb > 25) {
    return {
      status: 'fresh',
      message: 'Sehr erholt - Bereit für intensive Trainings oder Wettkämpfe',
      color: 'green'
    };
  } else if (tsb >= -10 && tsb <= 25) {
    return {
      status: 'optimal',
      message: 'Optimaler Trainingsbereich - Gute Balance zwischen Fitness und Erholung',
      color: 'blue'
    };
  } else if (tsb >= -30 && tsb < -10) {
    return {
      status: 'tired',
      message: 'Müde - Erholung empfohlen, nur leichte Trainings',
      color: 'yellow'
    };
  } else {
    return {
      status: 'fatigued',
      message: 'Überlastet - Dringend Erholung nötig!',
      color: 'red'
    };
  }
}

/**
 * Forecast fitness metrics based on planned training
 * Projects CTL/ATL/TSB into the future
 */
export function forecastFitnessMetrics(params: {
  currentCTL: number;
  currentATL: number;
  plannedActivities: ActivityMetrics[]; // Future planned sessions with TSS
}): {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}[] {
  const { currentCTL, currentATL, plannedActivities } = params;

  if (plannedActivities.length === 0) {
    return [];
  }

  // Sort by date (oldest first)
  const sortedActivities = [...plannedActivities].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Create daily TSS map
  const dailyTSS = new Map<string, number>();
  sortedActivities.forEach(activity => {
    const date = activity.date.split('T')[0];
    dailyTSS.set(date, (dailyTSS.get(date) || 0) + activity.tss);
  });

  // Start with current values
  let ctl = currentCTL;
  let atl = currentATL;
  const forecast: { date: string; ctl: number; atl: number; tsb: number }[] = [];

  // Project day by day
  const startDate = new Date(sortedActivities[0].date);
  const endDate = new Date(sortedActivities[sortedActivities.length - 1].date);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const todayTSS = dailyTSS.get(dateStr) || 0;

    // Update CTL (42-day EMA)
    ctl = calculateEMA(ctl, todayTSS, 42);

    // Update ATL (7-day EMA)
    atl = calculateEMA(atl, todayTSS, 7);

    // Calculate TSB
    const tsb = ctl - atl;

    forecast.push({
      date: dateStr,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
    });
  }

  return forecast;
}

/**
 * Get current metrics from past activities + forecast from planned training
 * Combines historical data with future projections
 */
export function getCombinedFitnessMetrics(params: {
  pastActivities: ActivityMetrics[];
  plannedActivities: ActivityMetrics[];
  initialCTL?: number;
  initialATL?: number;
}): {
  current: FitnessMetrics;
  forecast: { date: string; ctl: number; atl: number; tsb: number }[];
} {
  const { pastActivities, plannedActivities, initialCTL = 0, initialATL = 0 } = params;

  // Calculate current metrics from past
  const current = calculateFitnessMetrics(pastActivities, initialCTL, initialATL);

  // Forecast future metrics from planned training
  const forecast = forecastFitnessMetrics({
    currentCTL: current.ctl,
    currentATL: current.atl,
    plannedActivities,
  });

  return { current, forecast };
}
