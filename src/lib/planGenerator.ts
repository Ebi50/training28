import { 
  WeeklyPlan, 
  TrainingSession, 
  PlanningParameters, 
  Guardrails, 
  DailyMetrics, 
  SeasonGoal, 
  TrainingCamp,
  TimeSlot,
  UserProfile,
  MorningCheck,
  PlanQuality,
  PlanWarning 
} from '@/types';
import { addDays, startOfWeek, format, differenceInDays, isBefore, isAfter } from 'date-fns';
import { predictTSS, isModelAvailable } from './mlPredictor';
import { adaptSession } from './sessionAdapter';

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
  private useML: boolean = false;

  constructor(guardrails: Partial<Guardrails> = {}) {
    this.guardrails = { ...DEFAULT_GUARDRAILS, ...guardrails };
  }

  /**
   * Check if ML model is available and enable it
   */
  async initialize(): Promise<void> {
    this.useML = await isModelAvailable();
    if (this.useML) {
      console.log('✅ ML model available - using hybrid approach');
    } else {
      console.log('⚠️  ML model not available - using heuristic approach');
    }
  }

  /**
   * Generate a weekly training plan
   */
  async generateWeeklyPlan(
    userId: string,
    weekStartDate: Date,
    parameters: PlanningParameters,
    previousMetrics: DailyMetrics[],
    userProfile: UserProfile,
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

    // Generate training sessions with quality tracking
    const { sessions, quality } = await this.generateTrainingSessionsWithQuality(
      weekStartDate,
      adjustedParams,
      currentMetrics,
      userProfile,
      previousMetrics,
      taperGoal || undefined
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
      quality, // ← Add quality assessment
    };

    // Log summary if there are warnings (only once per plan)
    if (quality.warnings.length > 0) {
      console.warn(`\n⚠️  Plan Quality Summary (${plan.id}):`);
      console.warn(`   Quality Score: ${(quality.score * 100).toFixed(0)}%`);
      console.warn(`   Adjustments: ${quality.adjustments.splitSessions} split, ${quality.adjustments.tssReduced} TSS reduced`);
      console.warn(`   Total TSS lost: ${quality.adjustments.totalTssLost}\n`);
    }

    return plan;
  }

  /**
   * Adjust today's sessions based on Morning Check
   * This should be called daily after user completes Morning Check
   */
  async adjustTodaysSessions(
    userId: string,
    todayDate: Date,
    morningCheck: MorningCheck,
    currentPlan: WeeklyPlan,
    recentMetrics: DailyMetrics[]
  ): Promise<{
    adjustedSessions: TrainingSession[];
    changed: boolean;
    reasons: string[];
  }> {
    const todayStr = format(todayDate, 'yyyy-MM-dd');
    
    // Find today's sessions in current plan
    const todaysSessions = currentPlan.sessions.filter(s => s.date === todayStr);
    
    if (todaysSessions.length === 0) {
      return {
        adjustedSessions: [],
        changed: false,
        reasons: ['Keine Sessions für heute geplant'],
      };
    }
    
    // Adapt each session based on readiness
    const adaptedSessions: TrainingSession[] = [];
    const reasons: string[] = [];
    let changed = false;
    
    for (const session of todaysSessions) {
      const result = adaptSession(session, morningCheck, recentMetrics);
      adaptedSessions.push(result.adaptedSession);
      
      if (result.changed) {
        changed = true;
        reasons.push(result.reason);
        console.log('🔄 Session adapted:', {
          original: `${session.type} ${session.duration}min ${session.targetTss}TSS`,
          adapted: `${result.adaptedSession.type} ${result.adaptedSession.duration}min ${result.adaptedSession.targetTss}TSS`,
          reason: result.reason,
        });
      }
    }
    
    return {
      adjustedSessions: adaptedSessions,
      changed,
      reasons,
    };
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
   * Generate training sessions with quality assessment (wrapper)
   */
  private async generateTrainingSessionsWithQuality(
    weekStart: Date,
    params: PlanningParameters,
    currentMetrics: { ctl: number; atl: number; tsb: number },
    userProfile: UserProfile,
    previousMetrics: DailyMetrics[],
    taperGoal?: SeasonGoal
  ): Promise<{ sessions: TrainingSession[]; quality: PlanQuality }> {
    
    // Generate sessions (existing logic)
    const sessions = await this.generateTrainingSessions(
      weekStart,
      params,
      currentMetrics,
      userProfile,
      previousMetrics,
      taperGoal
    );

    // Assess plan quality
    const quality = this.assessPlanQuality(sessions, params);

    return { sessions, quality };
  }

  /**
   * Generate training sessions for the week
   */
  private async generateTrainingSessions(
    weekStart: Date,
    params: PlanningParameters,
    currentMetrics: { ctl: number; atl: number; tsb: number },
    userProfile: UserProfile,
    previousMetrics: DailyMetrics[],
    taperGoal?: SeasonGoal
  ): Promise<TrainingSession[]> {
    const sessions: TrainingSession[] = [];
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Calculate daily TSS targets
    let dailyTssTargets: number[];
    
    if (this.useML) {
      // Use ML predictions
      console.log('🤖 Using ML predictions for TSS targets');
      dailyTssTargets = await this.predictDailyTss(weekDays, userProfile, previousMetrics);
    } else {
      // Fall back to heuristic
      console.log('📊 Using heuristic approach for TSS targets');
      const targetWeeklyTss = params.weeklyHours * 45; // Rough estimate
      dailyTssTargets = this.distributeTssAcrossWeek(targetWeeklyTss, params);
    }

    // Determine HIT days (avoid back-to-back)
    const hitDays = this.selectHitDays(params.maxHitDays, currentMetrics.tsb);
    
    weekDays.forEach((date, dayIndex) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isHitDay = hitDays.includes(dayIndex);
      const availableSlots = this.getAvailableSlots(params.availableTimeSlots, dayIndex);
      
      // If no slots defined, assume all days available with default slot
      if (params.availableTimeSlots.length === 0 && availableSlots.length === 0) {
        availableSlots.push({ day: dayIndex, startTime: '08:00', endTime: '10:00', type: 'both' });
      }
      
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
        const daySessions = this.createTrainingSessions(
          dateStr,
          sessionType,
          targetTss,
          availableSlots,
          params.indoorAllowed
        );
        
        sessions.push(...daySessions);
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
   * Create training session(s) for a day - supports multi-session if needed
   * This is a wrapper that can split training into multiple sessions if slots are too short
   */
  private createTrainingSessions(
    date: string,
    type: 'LIT' | 'HIT' | 'REC',
    targetTss: number,
    availableSlots: TimeSlot[],
    indoorAllowed: boolean
  ): TrainingSession[] {
    
    if (availableSlots.length === 0) return [];

    // Calculate total available time across all slots
    const totalAvailableTime = availableSlots.reduce(
      (sum, slot) => sum + this.calculateSlotDuration(slot), 
      0
    );
    
    const idealDuration = this.getMaxSessionDuration(type, targetTss);

    // Case 1: Single slot is sufficient
    if (availableSlots.length === 1 || totalAvailableTime <= idealDuration * 1.2) {
      const session = this.createTrainingSession(date, type, targetTss, availableSlots, indoorAllowed);
      return session ? [session] : [];
    }

    // Case 2: Multiple slots available and needed (e.g., long endurance ride split into AM + PM)
    // Only split LIT sessions, keep HIT/REC as single sessions
    if (type === 'LIT' && availableSlots.length > 1 && idealDuration > totalAvailableTime * 0.6) {
      return this.createMultiSessionDay(date, type, targetTss, availableSlots, indoorAllowed);
    }

    // Default: Single session in best slot
    const session = this.createTrainingSession(date, type, targetTss, availableSlots, indoorAllowed);
    return session ? [session] : [];
  }

  /**
   * Create multiple sessions for a single day (e.g., AM + PM doubles)
   */
  private createMultiSessionDay(
    date: string,
    type: 'LIT' | 'HIT' | 'REC',
    targetTss: number,
    availableSlots: TimeSlot[],
    indoorAllowed: boolean
  ): TrainingSession[] {
    
    // Sort slots by start time
    const sortedSlots = [...availableSlots].sort((a, b) => 
      this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );

    // Take first two slots (typically AM and PM)
    const usedSlots = sortedSlots.slice(0, 2);
    const sessions: TrainingSession[] = [];

    // Distribute TSS and duration across sessions
    // First session gets 60% of TSS (main workout)
    // Second session gets 40% of TSS (secondary/recovery)
    const tssDistribution = [0.6, 0.4];

    usedSlots.forEach((slot, index) => {
      const sessionTss = Math.round(targetTss * tssDistribution[index]);
      const sessionType = index === 0 ? type : 'LIT'; // Second session is always LIT
      
      const session = this.createTrainingSession(
        date, 
        sessionType, 
        sessionTss, 
        [slot], // Only use this specific slot
        indoorAllowed
      );

      if (session) {
        // Mark as part of double day
        session.id = `${date}-${sessionType.toLowerCase()}-${index + 1}`;
        session.notes = session.notes 
          ? `${session.notes} | Part ${index + 1} of 2` 
          : `Part ${index + 1} of 2 (Double Day)`;
        sessions.push(session);
      }
    });

    return sessions;
  }

  /**
   * Create a single training session (with proper time slot constraints)
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

    const slotDuration = this.calculateSlotDuration(bestSlot);
    const idealDuration = this.getMaxSessionDuration(type, targetTss);
    const sessionDuration = Math.min(slotDuration, idealDuration);

    // 🎯 IMPORTANT: Adjust TSS proportionally if slot is too short
    // This prevents unrealistic intensity (e.g., 80 TSS in 30 minutes)
    let adjustedTss = targetTss;
    let note: string | undefined;

    if (slotDuration < idealDuration) {
      const durationRatio = slotDuration / idealDuration;
      
      // Only adjust if slot is significantly shorter (< 70% of ideal)
      if (durationRatio < 0.7) {
        adjustedTss = Math.round(targetTss * durationRatio);
        // Store details in note for quality assessment (no console.warn here)
        note = `⚠️ Training shortened: ${sessionDuration}min (ideal: ${idealDuration}min) - TSS reduced from ${targetTss} to ${adjustedTss}`;
      } else {
        // Slot is 70-99% of ideal - acceptable, minor note
        note = `Fits in ${sessionDuration}min slot (ideal: ${idealDuration}min)`;
      }
    }

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
      targetTss: adjustedTss, // ← Use adjusted TSS!
      indoor,
      description: this.generateSessionDescription(type, sessionDuration, adjustedTss),
      completed: false,
      timeSlot: {
        startTime: bestSlot.startTime,
        endTime: this.addMinutesToTime(bestSlot.startTime, sessionDuration),
      },
      notes: note, // Add note for quality assessment (not a user-facing warning)
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
  private getSessionSubType(type: string): 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'neuromuscular' | 'recovery' {
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
   * Generate session description with formatted time (rounded to 5min)
   */
  private generateSessionDescription(type: string, duration: number, targetTss: number): string {
    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(duration / 5) * 5;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    
    // Format as "h:mm h" or "Xmin"
    const timeStr = hours > 0 
      ? `${hours}:${String(minutes).padStart(2, '0')} h` 
      : `${minutes}min`;
    
    const tssStr = targetTss.toFixed(1);

    switch (type) {
      case 'HIT':
        return `${timeStr} threshold/VO2 intervals (TSS: ${tssStr})`;
      case 'REC':
        return `${timeStr} easy recovery ride (TSS: ${tssStr})`;
      case 'LIT':
      default:
        return `${timeStr} endurance base training (TSS: ${tssStr})`;
    }
  }

  /**
   * Predict daily TSS using ML model
   */
  private async predictDailyTss(
    dates: Date[],
    userProfile: UserProfile,
    previousMetrics: DailyMetrics[]
  ): Promise<number[]> {
    const predictions: number[] = [];
    
    for (const date of dates) {
      try {
        const prediction = await predictTSS(userProfile, previousMetrics, date);
        predictions.push(prediction.predictedTss);
      } catch (error) {
        console.error(`ML prediction failed for ${date}, using heuristic:`, error);
        // Fallback to heuristic
        predictions.push(45); // Default average TSS per day
      }
    }
    
    return predictions;
  }

  /**
   * Assess the quality of a generated training plan
   * Analyzes time slot compliance and generates warnings
   */
  private assessPlanQuality(
    sessions: TrainingSession[],
    params: PlanningParameters
  ): PlanQuality {
    const warnings: PlanWarning[] = [];
    let splitSessions = 0;
    let tssReduced = 0;
    let totalTssLost = 0;

    // Group sessions by date to detect double days (split sessions)
    const sessionsByDate = new Map<string, TrainingSession[]>();
    sessions.forEach(session => {
      const existing = sessionsByDate.get(session.date) || [];
      existing.push(session);
      sessionsByDate.set(session.date, existing);
    });

    // Analyze each day
    sessionsByDate.forEach((daySessions, date) => {
      // Check for split sessions (double days)
      if (daySessions.length > 1) {
        splitSessions++;
        const totalDayTss = daySessions.reduce((sum, s) => sum + s.targetTss, 0);
        
        warnings.push({
          type: 'split-session',
          severity: 'info',
          sessionIds: daySessions.map(s => s.id),
          message: `${date}: Training split into ${daySessions.length} sessions (${totalDayTss} TSS total)`,
          details: {
            adjustedTss: totalDayTss,
          }
        });
      }

      // Check for TSS reductions (indicated by warning notes)
      daySessions.forEach(session => {
        if (session.notes?.includes('⚠️ Training shortened')) {
          tssReduced++;
          
          // Extract original TSS from warning message
          const match = session.notes.match(/TSS reduced from (\d+) to (\d+)/);
          if (match) {
            const originalTss = parseInt(match[1]);
            const adjustedTss = parseInt(match[2]);
            const lostTss = originalTss - adjustedTss;
            totalTssLost += lostTss;

            warnings.push({
              type: 'tss-reduced',
              severity: 'warning',
              sessionIds: [session.id],
              message: `${date}: TSS reduced due to time constraints`,
              details: {
                originalTss,
                adjustedTss,
                originalDuration: session.timeSlot ? this.calculateSlotDuration({
                  day: 0,
                  startTime: session.timeSlot.startTime,
                  endTime: session.timeSlot.endTime,
                  type: 'both'
                }) : undefined,
                availableDuration: session.duration,
              }
            });
          }
        }
      });
    });

    // Calculate quality factors
    const timeSlotMatch = 1 - (tssReduced / Math.max(sessions.length, 1)) * 0.5; // Max 50% penalty
    const trainingDistribution = this.assessDistributionQuality(sessions, params);
    const recoveryAdequacy = this.assessRecoveryQuality(sessions);

    // Calculate overall score (weighted average)
    const score = (
      timeSlotMatch * 0.4 +
      trainingDistribution * 0.3 +
      recoveryAdequacy * 0.3
    );

    return {
      score: Math.max(0, Math.min(1, score)), // Clamp to 0-1
      warnings,
      adjustments: {
        splitSessions,
        tssReduced,
        totalTssLost,
      },
      factors: {
        timeSlotMatch,
        trainingDistribution,
        recoveryAdequacy,
      }
    };
  }

  /**
   * Assess training distribution quality (LIT/HIT balance)
   */
  private assessDistributionQuality(sessions: TrainingSession[], params: PlanningParameters): number {
    if (sessions.length === 0) return 1;

    const litDuration = sessions.filter(s => s.type === 'LIT').reduce((sum, s) => sum + s.duration, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const actualLitRatio = litDuration / totalDuration;
    const targetLitRatio = params.litRatio;

    // Penalize deviation from target LIT ratio
    const deviation = Math.abs(actualLitRatio - targetLitRatio);
    return Math.max(0, 1 - deviation * 2); // Max 50% deviation = 0 score
  }

  /**
   * Assess recovery adequacy (spacing between HIT sessions)
   */
  private assessRecoveryQuality(sessions: TrainingSession[]): number {
    const hitSessions = sessions.filter(s => s.type === 'HIT').sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (hitSessions.length <= 1) return 1; // No recovery issues with 0-1 HIT sessions

    let penaltyPoints = 0;
    for (let i = 1; i < hitSessions.length; i++) {
      const prevDate = new Date(hitSessions[i - 1].date);
      const currDate = new Date(hitSessions[i].date);
      const daysBetween = differenceInDays(currDate, prevDate);

      if (daysBetween < 2) {
        penaltyPoints += 0.3; // 30% penalty for back-to-back or 1-day gap
      }
    }

    return Math.max(0, 1 - penaltyPoints);
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