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
      let availableSlots = this.getAvailableSlots(params.availableTimeSlots, dayIndex);
      
      // 🎯 Handle time slot scenarios:
      // 1. User has NO time slots defined at all → Use sensible defaults (first-time setup)
      // 2. User HAS time slots but NOT for this day → Rest day (respect their schedule!)
      
      if (params.availableTimeSlots.length === 0) {
        // Scenario 1: No time slots configured at all - use defaults (weekdays only)
        // dayIndex: 0=Monday, 1=Tuesday, ..., 6=Sunday
        if (dayIndex >= 0 && dayIndex <= 4) { // Monday-Friday (0-4)
          availableSlots = [{ day: dayIndex, startTime: '08:00', endTime: '10:00', type: 'both' as const }];
        } else {
          return; // Weekend rest days by default
        }
      } else if (availableSlots.length === 0) {
        // Scenario 2: User configured time slots, but not for this day → Respect their choice (rest day)
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
        // Count existing HIT sessions for variety
        const hitCount = sessions.filter(s => s.type === 'HIT').length;
        
        const daySessions = this.createTrainingSessions(
          dateStr,
          sessionType,
          targetTss,
          availableSlots,
          params.indoorAllowed,
          userProfile.ftp, // Pass FTP for workout structure
          hitCount // Pass HIT count for interval variety
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
    indoorAllowed: boolean,
    ftp?: number,
    hitSessionCount: number = 0
  ): TrainingSession[] {
    
    if (availableSlots.length === 0) return [];

    // Calculate total available time across all slots
    const totalAvailableTime = availableSlots.reduce(
      (sum, slot) => sum + this.calculateSlotDuration(slot), 
      0
    );
    
    const idealDuration = this.getMaxSessionDuration(type, targetTss);
    
    // Get longest single slot duration
    const longestSlotDuration = Math.max(...availableSlots.map(slot => this.calculateSlotDuration(slot)));

    // 🎯 Decision logic:
    // 1. Single slot OR total time fits in one session → Single session
    // 2. Multiple slots AND longest slot < 70% of ideal duration → Split across slots
    // 3. Multiple slots for LIT AND total time > 120min → Split (allow long endurance rides)
    
    if (availableSlots.length === 1) {
      // Single slot - always create one session
      const session = this.createTrainingSession(date, type, targetTss, availableSlots, indoorAllowed, ftp, hitSessionCount);
      return session ? [session] : [];
    }
    
    // Multiple slots available
    const needsSplit = longestSlotDuration < idealDuration * 0.7 || 
                      (type === 'LIT' && totalAvailableTime > 120 && idealDuration > 90);
    
    if (needsSplit) {
      // Split training across multiple slots
      return this.createMultiSessionDay(date, type, targetTss, availableSlots, indoorAllowed, ftp, hitSessionCount);
    }
    
    // Use best slot for single session
    const session = this.createTrainingSession(date, type, targetTss, availableSlots, indoorAllowed, ftp, hitSessionCount);
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
    indoorAllowed: boolean,
    ftp?: number,
    hitSessionCount: number = 0
  ): TrainingSession[] {
    
    // Sort slots by start time
    const sortedSlots = [...availableSlots].sort((a, b) => 
      this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
    );

    const sessions: TrainingSession[] = [];
    const numSlots = sortedSlots.length;

    // 🎯 Distribute TSS across ALL available slots proportionally
    // If 2 slots: 60/40 split (main + secondary)
    // If 3+ slots: Equal distribution
    const tssPerSlot = numSlots === 2 
      ? [0.6, 0.4].map(ratio => Math.round(targetTss * ratio))
      : Array(numSlots).fill(Math.round(targetTss / numSlots));

    sortedSlots.forEach((slot, index) => {
      const sessionTss = tssPerSlot[index];
      // First session keeps the requested type, rest are LIT (recovery/easy)
      const sessionType = index === 0 ? type : 'LIT';
      
      const session = this.createTrainingSession(
        date, 
        sessionType, 
        sessionTss, 
        [slot], // Only use this specific slot
        indoorAllowed,
        ftp,
        hitSessionCount
      );

      if (session) {
        // Mark as part of multi-session day
        session.id = `${date}-${sessionType.toLowerCase()}-${index + 1}`;
        session.notes = session.notes 
          ? `${session.notes} | Part ${index + 1} of ${numSlots}` 
          : `Part ${index + 1} of ${numSlots} (Multi-Session Day)`;
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
    indoorAllowed: boolean,
    ftp?: number,
    hitSessionCount: number = 0
  ): TrainingSession | null {
    
    if (availableSlots.length === 0) return null;

    // Calculate TOTAL available time across all slots (for double-session days)
    const totalSlotDuration = availableSlots.reduce((sum, slot) => {
      return sum + this.calculateSlotDuration(slot);
    }, 0);

    // Select best slot (longest available time) - but use total duration for planning
    const bestSlot = availableSlots.reduce((best, slot) => {
      const duration = this.calculateSlotDuration(slot);
      const bestDuration = this.calculateSlotDuration(best);
      return duration > bestDuration ? slot : best;
    });

    // 🎯 IMPORTANT: Session duration MUST match available time slot
    // User expects training to fit exactly in their time slot (e.g., 6:00-7:00 = 60min)
    const slotDuration = totalSlotDuration; // Use TOTAL duration from time slot
    const idealDuration = this.getMaxSessionDuration(type, targetTss); // For TSS adjustment calculation only
    const sessionDuration = slotDuration; // Session MUST fit in slot (no min() with idealDuration)!

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

    // Get session subtype based on type, TSS, and duration
    const subType = this.getSessionSubType(type, adjustedTss, sessionDuration);

    const session: TrainingSession = {
      id: `${date}-${type.toLowerCase()}`,
      date,
      type,
      subType,
      duration: sessionDuration,
      targetTss: adjustedTss, // ← Use adjusted TSS!
      indoor,
      description: this.generateSessionDescription(type, subType, sessionDuration, adjustedTss, ftp, type === 'HIT' ? hitSessionCount : 0),
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
   * Get session subtype based on type and TSS
   */
  private getSessionSubType(
    type: string, 
    targetTss: number, 
    duration: number
  ): 'endurance' | 'tempo' | 'threshold' | 'vo2max' | 'neuromuscular' | 'recovery' {
    switch (type) {
      case 'HIT':
        // Determine HIT subtype based on TSS and duration
        const intensity = targetTss / duration; // TSS per minute
        if (intensity > 1.2) {
          return 'vo2max'; // Very high intensity, short intervals (>106% FTP)
        } else if (intensity > 0.95) {
          return 'threshold'; // Sustained high intensity (95-105% FTP)
        } else {
          return 'tempo'; // Sweet Spot / Tempo (88-94% FTP)
        }
      case 'REC':
        return 'recovery';
      case 'LIT':
      default:
        // LIT is ONLY endurance (Zone 2) - never tempo!
        // Tempo (Zone 3) is actually a HIT workout
        return 'endurance'; // Always endurance for LIT (60-75% FTP, Zone 2)
    }
  }

  /**
   * Generate workout name based on subType
   */
  private generateWorkoutName(subType: TrainingSession['subType']): string {
    const workoutNames = {
      'endurance': 'Endurance Base',
      'tempo': 'Tempo Ride',
      'threshold': 'Threshold Intervals',
      'vo2max': 'VO2max Repeats',
      'neuromuscular': 'Sprint Training',
      'recovery': 'Easy Recovery',
    };
    return workoutNames[subType || 'endurance'];
  }

  /**
   * Select interval variation based on session count to add variety
   */
  private selectIntervalVariant(subType: 'vo2max' | 'threshold' | 'tempo', sessionCount: number): {
    intervalMin: number;
    restMin: number;
    variant: string;
  } {
    const variantIndex = sessionCount % 4; // Rotate through 4 variants
    
    switch (subType) {
      case 'vo2max':
        const vo2Variants = [
          { intervalMin: 5, restMin: 3, variant: '5min' },    // Classic
          { intervalMin: 4, restMin: 4, variant: '4min' },    // Equal work:rest
          { intervalMin: 3, restMin: 2, variant: '3min' },    // Short & sharp
          { intervalMin: 6, restMin: 3, variant: '6min' },    // Longer intervals
        ];
        return vo2Variants[variantIndex];
      
      case 'threshold':
        const thresholdVariants = [
          { intervalMin: 10, restMin: 5, variant: '10min' },  // Classic 2:1
          { intervalMin: 8, restMin: 4, variant: '8min' },    // Shorter
          { intervalMin: 12, restMin: 5, variant: '12min' },  // Longer
          { intervalMin: 15, restMin: 5, variant: '15min' },  // Extended
        ];
        return thresholdVariants[variantIndex];
      
      case 'tempo':
        const tempoVariants = [
          { intervalMin: 20, restMin: 5, variant: '20min' },  // Classic
          { intervalMin: 15, restMin: 5, variant: '15min' },  // Shorter
          { intervalMin: 12, restMin: 3, variant: '12min' },  // Frequent
          { intervalMin: 25, restMin: 5, variant: '25min' },  // Long blocks
        ];
        return tempoVariants[variantIndex];
    }
  }

  /**
   * Generate structured workout details (intervals)
   */
  private generateWorkoutStructure(
    subType: TrainingSession['subType'], 
    duration: number, 
    targetTss: number,
    ftp?: number,
    sessionCount: number = 0
  ): string {
    const intensity = targetTss / duration; // TSS per minute
    
    switch (subType) {
      case 'vo2max': {
        // VO2max with variety - rotates through 4 different interval patterns
        const variant = this.selectIntervalVariant('vo2max', sessionCount);
        const totalTime = variant.intervalMin + variant.restMin;
        const reps = Math.max(3, Math.floor(duration / totalTime));
        return `${reps}x${variant.variant} @ 110-120% FTP (${variant.restMin}min rest)`;
      }
      
      case 'threshold': {
        // Threshold with variety - rotates through 4 different patterns
        const variant = this.selectIntervalVariant('threshold', sessionCount);
        const totalTime = variant.intervalMin + variant.restMin;
        const reps = Math.max(2, Math.floor(duration / totalTime));
        return `${reps}x${variant.variant} @ 95-105% FTP (${variant.restMin}min rest)`;
      }
      
      case 'tempo': {
        // Tempo/Sweet Spot with variety
        if (duration > 60) {
          const variant = this.selectIntervalVariant('tempo', sessionCount);
          const totalTime = variant.intervalMin + variant.restMin;
          const reps = Math.max(2, Math.floor(duration / totalTime));
          return `${reps}x${variant.variant} @ 88-94% FTP (${variant.restMin}min rest)`;
        } else {
          const roundedDuration = Math.round(duration);
          return `${roundedDuration}min @ 88-94% FTP (Sweet Spot)`;
        }
      }
      
      case 'endurance': {
        // Zone 2 Endurance - the ONLY type for LIT workouts (60-75% FTP)
        // No duration in description - shown separately in UI
        return `@ 60-75% FTP (Zone 2)`;
      }
      
      case 'recovery':
        return `${duration}min @ 50-60% FTP (Active Recovery)`;
      
      case 'neuromuscular':
        const sprintReps = Math.floor(duration / 5); // Short sprints
        return `${sprintReps}x30sec all-out sprints (4min rest)`;
      
      default:
        return `${duration}min steady ride`;
    }
  }

  /**
   * Generate session description with formatted time and workout details
   */
  private generateSessionDescription(
    type: string, 
    subType: TrainingSession['subType'],
    duration: number, 
    targetTss: number,
    ftp?: number,
    sessionCount: number = 0
  ): string {
    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(duration / 5) * 5;
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;
    
    // Format as "h:mm h" or "Xmin"
    const timeStr = hours > 0 
      ? `${hours}:${String(minutes).padStart(2, '0')} h` 
      : `${minutes}min`;
    
    const tssStr = targetTss.toFixed(0);
    
    // Get workout name and structure (with variety for HIT)
    const workoutName = this.generateWorkoutName(subType);
    const structure = this.generateWorkoutStructure(subType, duration, targetTss, ftp, sessionCount);

    return `${workoutName} - ${structure} (${tssStr} TSS)`;
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