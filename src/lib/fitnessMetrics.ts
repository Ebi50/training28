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
 * Calculate exponential moving average
 * @param previousEMA Previous EMA value
 * @param currentValue Current day's value
 * @param days Time constant (42 for CTL, 7 for ATL)
 */
function calculateEMA(previousEMA: number, currentValue: number, days: number): number {
  const alpha = 2 / (days + 1);
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
