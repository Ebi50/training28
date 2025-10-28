import { 
  WeeklyPlan, 
  TrainingSession, 
  PlanningParameters, 
  Guardrails, 
  DailyMetrics, 
  SeasonGoal, 
  TrainingCamp,
  TimeSlot 
} from '@/types';
import { addDays, startOfWeek, format, differenceInDays, isBefore, isAfter } from 'date-fns';

// Default guardrails
const DEFAULT_GUARDRAILS: Guardrails = {
  maxRampRate: 0.15, // 15% max weekly increase
  minTsb: -20,
  maxTsb: 15,
  noHitBackToBack: true,
  minRecoveryAfterHit: 24, // hours
  maxHitDuration: 90, // minutes per week
  tsbBeforeRace: 0, // target TSB for race day
  maxConsecutiveHitWeeks: 3,
};

// Training distribution by weekly hours
const TRAINING_DISTRIBUTION = {
  low: { hours: 4, litRatio: 0.875, hitRatio: 0.125, maxHitDays: 1 },
  medium: { hours: 8, litRatio: 0.90, hitRatio: 0.10, maxHitDays: 2 },
  high: { hours: 12, litRatio: 0.92, hitRatio: 0.08, maxHitDays: 2 },
  elite: { hours: 16, litRatio: 0.94, hitRatio: 0.06, maxHitDays: 3 },
};

export class TrainingPlanGenerator {
  private guardrails: Guardrails;

  constructor(guardrails: Partial<Guardrails> = {}) {
    this.guardrails = { ...DEFAULT_GUARDRAILS, ...guardrails };
  }

  /**
   * Generate a weekly training plan
   */
  async generateWeeklyPlan(
    userId: string,
    weekStartDate: Date,
    parameters: PlanningParameters,
    previousMetrics: DailyMetrics[],
    upcomingGoals: SeasonGoal[] = [],
    activeCamp?: TrainingCamp
  ): Promise<WeeklyPlan> {
    
    // Apply camp overrides if active
    const adjustedParams = activeCamp 
      ? this.applyCampOverrides(parameters, activeCamp)
      : parameters;

    // Calculate current fitness metrics
    const currentMetrics = this.calculateCurrentMetrics(previousMetrics);
    
    // Validate ramp rate
    this.validateRampRate(previousMetrics, adjustedParams.weeklyHours);
    
    // Check for approaching goals (taper logic)
    const taperGoal = this.findTaperingGoal(upcomingGoals, weekStartDate);
    if (taperGoal) {
      adjustedParams.weeklyHours *= 0.7; // 30% reduction during taper
      adjustedParams.maxHitDays = Math.min(adjustedParams.maxHitDays, 1);
    }

    // Generate training sessions
    const sessions = this.generateTrainingSessions(
      weekStartDate,
      adjustedParams,
      currentMetrics,
      taperGoal
    );

    // Calculate plan totals
    const totalHours = sessions.reduce((sum, s) => sum + s.duration / 60, 0);
    const totalTss = sessions.reduce((sum, s) => sum + s.targetTss, 0);
    const hitSessions = sessions.filter(s => s.type === 'HIT').length;
    const litRatio = sessions.filter(s => s.type === 'LIT').reduce((sum, s) => sum + s.duration, 0) / 
                    sessions.reduce((sum, s) => sum + s.duration, 0);

    const plan: WeeklyPlan = {
      id: `${format(weekStartDate, 'yyyy')}-W${format(weekStartDate, 'II')}`,
      weekStartDate: format(weekStartDate, 'yyyy-MM-dd'),
      userId,
      totalHours,
      totalTss,
      litRatio,
      hitSessions,
      sessions,
      constraints: {
        availableHours: adjustedParams.weeklyHours,
        maxHitDays: adjustedParams.maxHitDays,
        campActive: activeCamp?.id,
        goalApproaching: taperGoal?.id,
      },
      generated: new Date(),
      lastModified: new Date(),
    };

    return plan;
  }

  /**
   * Apply training camp overrides to parameters
   */
  private applyCampOverrides(params: PlanningParameters, camp: TrainingCamp): PlanningParameters {
    return {
      ...params,
      weeklyHours: params.weeklyHours * (1 + camp.volumeBump / 100),
      maxHitDays: Math.min(params.maxHitDays, camp.hitCap),
      litRatio: Math.max(params.litRatio, 0.90), // Force more LIT during camps
    };
  }

  /**
   * Calculate current fitness metrics from historical data
   */
  private calculateCurrentMetrics(metrics: DailyMetrics[]): { ctl: number; atl: number; tsb: number } {
    if (metrics.length === 0) {
      return { ctl: 0, atl: 0, tsb: 0 };
    }

    // Get most recent metrics
    const latest = metrics[metrics.length - 1];
    return {
      ctl: latest.ctl || 0,
      atl: latest.atl || 0,
      tsb: latest.tsb || 0,
    };
  }

  /**
   * Validate ramp rate constraints
   */
  private validateRampRate(previousMetrics: DailyMetrics[], targetHours: number): void {
    if (previousMetrics.length === 0) return;

    // Calculate previous week's hours
    const lastWeekTss = previousMetrics.slice(-7).reduce((sum, m) => sum + (m.tss || 0), 0);
    const estimatedPrevHours = lastWeekTss / 45; // Rough TSS/hour estimate

    const rampRate = (targetHours - estimatedPrevHours) / estimatedPrevHours;
    
    if (rampRate > this.guardrails.maxRampRate) {
      throw new Error(`Ramp rate too high: ${(rampRate * 100).toFixed(1)}% (max: ${(this.guardrails.maxRampRate * 100).toFixed(1)}%)`);
    }
  }

  /**
   * Find if any goal is in taper period
   */
  private findTaperingGoal(goals: SeasonGoal[], weekStart: Date): SeasonGoal | null {
    return goals.find(goal => {
      const daysUntilGoal = differenceInDays(goal.date, weekStart);
      return daysUntilGoal >= 0 && daysUntilGoal <= goal.taperStrategy.daysBeforeEvent;
    }) || null;
  }

  /**
   * Generate training sessions for the week
   */
  private generateTrainingSessions(
    weekStart: Date,
    params: PlanningParameters,
    currentMetrics: { ctl: number; atl: number; tsb: number },
    taperGoal?: SeasonGoal
  ): TrainingSession[] {
    const sessions: TrainingSession[] = [];
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Calculate daily TSS targets
    const targetWeeklyTss = params.weeklyHours * 45; // Rough estimate
    const dailyTssTargets = this.distributeTssAcrossWeek(targetWeeklyTss, params);

    // Determine HIT days (avoid back-to-back)
    const hitDays = this.selectHitDays(params.maxHitDays, currentMetrics.tsb);
    
    weekDays.forEach((date, dayIndex) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isHitDay = hitDays.includes(dayIndex);
      const availableSlots = this.getAvailableSlots(params.availableTimeSlots, dayIndex);
      
      if (availableSlots.length === 0) {
        // Rest day - no available slots
        return;
      }

      // Determine session type based on TSB and day type
      let sessionType: 'LIT' | 'HIT' | 'REC' = 'LIT';
      
      if (currentMetrics.tsb < -15) {
        sessionType = 'REC'; // Force recovery
      } else if (isHitDay && !taperGoal) {
        sessionType = 'HIT';
      }

      // Create session(s) for the day
      const targetTss = dailyTssTargets[dayIndex];
      if (targetTss > 0) {
        const session = this.createTrainingSession(
          dateStr,
          sessionType,
          targetTss,
          availableSlots,
          params.indoorAllowed
        );
        
        if (session) {
          sessions.push(session);
        }
      }
    });

    return sessions;
  }

  /**
   * Distribute TSS across the week
   */
  private distributeTssAcrossWeek(totalTss: number, params: PlanningParameters): number[] {
    // Basic distribution - more TSS on weekends typically
    const baseDistribution = [0.10, 0.15, 0.12, 0.15, 0.12, 0.18, 0.18]; // Sun-Sat
    
    return baseDistribution.map(ratio => totalTss * ratio);
  }

  /**
   * Select which days should be HIT days
   */
  private selectHitDays(maxHitDays: number, currentTsb: number): number[] {
    // Avoid HIT if TSB is too low
    if (currentTsb < -15) return [];
    
    // Prefer Tuesday, Thursday, Saturday for HIT
    const preferredHitDays = [2, 4, 6]; // Tue, Thu, Sat
    
    return preferredHitDays.slice(0, maxHitDays);
  }

  /**
   * Get available time slots for a given day
   */
  private getAvailableSlots(timeSlots: TimeSlot[], dayOfWeek: number): TimeSlot[] {
    return timeSlots.filter(slot => slot.day === dayOfWeek);
  }

  /**
   * Create a training session
   */
  private createTrainingSession(
    date: string,
    type: 'LIT' | 'HIT' | 'REC',
    targetTss: number,
    availableSlots: TimeSlot[],
    indoorAllowed: boolean
  ): TrainingSession | null {
    
    if (availableSlots.length === 0) return null;

    // Select best slot (longest available time)
    const bestSlot = availableSlots.reduce((best, slot) => {
      const duration = this.calculateSlotDuration(slot);
      const bestDuration = this.calculateSlotDuration(best);
      return duration > bestDuration ? slot : best;
    });

    const sessionDuration = Math.min(
      this.calculateSlotDuration(bestSlot),
      this.getMaxSessionDuration(type, targetTss)
    );

    // Determine if indoor is required/preferred
    const indoor = !indoorAllowed ? false : 
                  bestSlot.type === 'indoor' ? true :
                  bestSlot.type === 'outdoor' ? false :
                  Math.random() > 0.7; // 30% chance of indoor for 'both'

    const session: TrainingSession = {
      id: `${date}-${type.toLowerCase()}`,
      date,
      type,
      subType: this.getSessionSubType(type),
      duration: sessionDuration,
      targetTss,
      indoor,
      description: this.generateSessionDescription(type, sessionDuration, targetTss),
      completed: false,
      timeSlot: {
        startTime: bestSlot.startTime,
        endTime: this.addMinutesToTime(bestSlot.startTime, sessionDuration),
      },
    };

    return session;
  }

  /**
   * Calculate duration of a time slot in minutes
   */
  private calculateSlotDuration(slot: TimeSlot): number {
    const start = this.timeToMinutes(slot.startTime);
    const end = this.timeToMinutes(slot.endTime);
    return end - start;
  }

  /**
   * Convert HH:MM to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Add minutes to a time string
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get maximum session duration based on type and TSS
   */
  private getMaxSessionDuration(type: string, targetTss: number): number {
    switch (type) {
      case 'HIT':
        return Math.min(90, targetTss * 1.2); // HIT sessions are typically shorter but intense
      case 'REC':
        return Math.min(60, targetTss * 2); // Recovery sessions are easy and can be longer
      case 'LIT':
      default:
        return Math.min(180, targetTss * 1.5); // LIT sessions can be quite long
    }
  }

  /**
   * Get session subtype
   */
  private getSessionSubType(type: string): string {
    switch (type) {
      case 'HIT':
        return Math.random() > 0.5 ? 'threshold' : 'vo2max';
      case 'REC':
        return 'recovery';
      case 'LIT':
      default:
        return 'endurance';
    }
  }

  /**
   * Generate session description
   */
  private generateSessionDescription(type: string, duration: number, targetTss: number): string {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    switch (type) {
      case 'HIT':
        return `${timeStr} threshold/VO2 intervals (TSS: ${targetTss})`;
      case 'REC':
        return `${timeStr} easy recovery ride (TSS: ${targetTss})`;
      case 'LIT':
      default:
        return `${timeStr} endurance base training (TSS: ${targetTss})`;
    }
  }
}

/**
 * Calculate CTL, ATL, TSB from TSS history
 */
export function calculateTrainingLoad(tssHistory: { date: string; tss: number }[]): {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}[] {
  const results: { date: string; ctl: number; atl: number; tsb: number }[] = [];
  let ctl = 0;
  let atl = 0;

  // CTL time constant (42 days)
  const ctlTc = 1 / 42;
  // ATL time constant (7 days)  
  const atlTc = 1 / 7;

  tssHistory.forEach(day => {
    // Update CTL (Chronic Training Load) - exponentially weighted 42-day average
    ctl = ctl + (day.tss - ctl) * ctlTc;
    
    // Update ATL (Acute Training Load) - exponentially weighted 7-day average  
    atl = atl + (day.tss - atl) * atlTc;
    
    // Calculate TSB (Training Stress Balance)
    const tsb = ctl - atl;

    results.push({
      date: day.date,
      ctl: Math.round(ctl * 100) / 100,
      atl: Math.round(atl * 100) / 100,
      tsb: Math.round(tsb * 100) / 100,
    });
  });

  return results;
}