'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserProfile, updateTrainingSession } from '@/lib/firestore';
import type { UserProfile, WeeklyPlan, TrainingSession } from '@/types';
import UserTutorial from '@/components/UserTutorial';
import DashboardLayout from '@/components/DashboardLayout';
import Tooltip from '@/components/Tooltip';
import PlanQualityBanner from '@/components/PlanQualityBanner';
import SessionNotes from '@/components/SessionNotes';
import TodayWorkoutCard from '@/components/TodayWorkoutCard';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { calculateTSS, calculateFitnessMetrics, calculateFitnessMetricsHistory, interpretTSB, getCombinedFitnessMetrics, forecastFitnessMetrics } from '@/lib/fitnessMetrics';
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
import FitnessChart from '@/components/FitnessChart';
import { generateZWOFromSession, generateZWOFilename } from '@/lib/zwoGenerator';
import { generateMvpWeeklyPlan } from '@/lib/mvpPlanGenerator';
import { getSeasonGoals, saveTrainingPlan, getLatestTrainingPlan } from '@/lib/firestore';
import type { SeasonGoal } from '@/types/user';
import { format } from 'date-fns';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  average_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
}

// Helper function to format hours to "h:mm h" (rounded to 5min)
const formatHoursToTime = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const roundedMinutes = Math.round(totalMinutes / 5) * 5; // Round to nearest 5 minutes
  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')} h`;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [fitnessMetrics, setFitnessMetrics] = useState({ ctl: 0, atl: 0, tsb: 0 });
  const [fitnessHistory, setFitnessHistory] = useState<Array<{ date: string; ctl: number; atl: number; tsb: number }>>([]);
  const [fitnessForecast, setFitnessForecast] = useState<Array<{ date: string; ctl: number; atl: number; tsb: number }>>([]);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [currentWeekPlan, setCurrentWeekPlan] = useState<WeeklyPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [currentPlanWeek, setCurrentPlanWeek] = useState(0);
  const [dismissedPlanWarnings, setDismissedPlanWarnings] = useState<Set<string>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-logout functionality
  useAutoLogout({
    timeoutMinutes: profile?.autoLogoutMinutes || 10, // Default 10 min
    onLogout: () => {
      console.log('Auto-logout triggered due to inactivity');
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
        
        // Load dismissed plan warnings from localStorage
        const dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
        setDismissedPlanWarnings(new Set(dismissed));
        
        // Show tutorial for new users (no FTP set = new user)
        if (!userProfile?.ftp) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Check for Strava OAuth callback messages
  useEffect(() => {
    const stravaConnected = searchParams.get('strava_connected');
    const stravaError = searchParams.get('strava_error');

    if (stravaConnected === 'true') {
      setStravaMessage('✓ Strava erfolgreich verbunden!');
      // Reload profile to get updated Strava status
      if (auth.currentUser) {
        getUserProfile(auth.currentUser.uid).then(setProfile);
      }
    } else if (stravaError) {
      setStravaMessage(`❌ Strava Fehler: ${stravaError}`);
    }

    // Clear message after 5 seconds
    if (stravaConnected || stravaError) {
      setTimeout(() => setStravaMessage(null), 5000);
    }
  }, [searchParams]);

  // Load training plan
  useEffect(() => {
    const loadPlan = async () => {
      const user = auth.currentUser;
      if (!user || !profile?.stravaConnected) {
        console.log('⏭️ Skipping plan load - user or Strava not connected');
        return;
      }

      console.log('📋 Loading training plan for user:', user.uid);
      setLoadingPlan(true);
      try {
        const response = await fetch(`/api/training/plan?userId=${user.uid}`);
        console.log('📋 Plan API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Plan data received:', data);
          setTrainingPlan(data.plan);
          if (data.plan) {
            console.log('✅ Plan loaded successfully, weeks:', data.plan.weeks?.length);
            // Debug: Check if first week has timeSlots
            if (data.plan.weeks?.[0]?.sessions) {
              console.log('🕒 First week sessions timeSlots:', 
                data.plan.weeks[0].sessions.map((s: any) => ({ 
                  date: s.date, 
                  timeSlot: s.timeSlot 
                }))
              );
            }
          } else {
            console.log('ℹ️ No plan found for user');
          }
        } else {
          console.error('❌ Failed to load plan:', response.status, await response.text());
        }
      } catch (error) {
        console.error('❌ Error loading plan:', error);
      } finally {
        setLoadingPlan(false);
      }
    };

    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.stravaConnected]);

  // Load Strava activities and calculate metrics
  useEffect(() => {
    const loadActivities = async () => {
      const user = auth.currentUser;
      if (!user || !profile?.stravaConnected) return;

      console.log('🔍 Loading activities for user:', user.uid);
      setLoadingActivities(true);
      try {
        // Load last 90 days of activities for accurate CTL calculation
        const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
        const response = await fetch(`/api/strava/activities?userId=${user.uid}&after=${ninetyDaysAgo}&per_page=200`);
        console.log('📡 Activities API response status:', response.status);
        if (response.ok) {
          const data: StravaActivity[] = await response.json();
          console.log('✅ Activities loaded:', data.length);
          setActivities(data.slice(0, 10)); // Show only last 10 in UI

          // Calculate TSS for each activity
          const activitiesWithTSS = data.map(activity => ({
            date: activity.start_date,
            tss: calculateTSS({
              movingTimeSeconds: activity.moving_time,
              averagePower: activity.average_watts,
              averageHeartRate: activity.average_heartrate,
              ftp: profile?.ftp,
              lthr: profile?.lthr
            })
          }));

          // Calculate fitness metrics
          const metrics = calculateFitnessMetrics(activitiesWithTSS);
          console.log('📊 Fitness metrics:', metrics);
          setFitnessMetrics(metrics);

          // Calculate fitness history for chart (last 42 days)
          const history = calculateFitnessMetricsHistory(activitiesWithTSS, 0, 0, 42);
          console.log('📈 Fitness history:', history.length, 'days');
          setFitnessHistory(history);

          // Calculate forecast if we have a training plan
          if (trainingPlan?.weeks && trainingPlan.weeks.length > 0) {
            const plannedActivities = trainingPlan.weeks.flatMap((week: any) =>
              week.sessions?.map((session: any) => ({
                date: session.date,
                tss: session.targetTss || 0
              })) || []
            );
            
            if (plannedActivities.length > 0) {
              const forecast = forecastFitnessMetrics({
                currentCTL: metrics.ctl,
                currentATL: metrics.atl,
                plannedActivities
              });
              console.log('🔮 Fitness forecast:', forecast.length, 'days');
              setFitnessForecast(forecast);
            }
          }
        } else {
          console.error('❌ Failed to fetch activities:', response.status, await response.text());
        }
      } catch (error) {
        console.error('❌ Error loading activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadActivities();
  }, [profile?.stravaConnected, profile?.ftp, profile?.lthr]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
      onHelp={() => setShowTutorial(true)}
    >
      {/* Tutorial Modal */}
      {showTutorial && (
        <UserTutorial
          onClose={() => setShowTutorial(false)}
          onComplete={() => {
            setShowTutorial(false);
          }}
        />
      )}

      {/* Main Content */}
      <div className="w-full">
        {/* Morning Check Banner */}
        <div className={`${spacing.contentBlock} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg ${spacing.card}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">☀️</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Guten Morgen! Wie fühlst du dich heute?
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mt-1">
                  Beantworte 5 schnelle Fragen und wir passen dein Training optimal an
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('🎯 Morning Check Button clicked!');
                router.push('/dashboard/morning-check');
              }}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold text-base flex items-center space-x-2 whitespace-nowrap transition-colors shadow-md hover:shadow-lg"
            >
              <span>🎯</span>
              <span>Morning Check starten</span>
            </button>
          </div>
        </div>

        {/* Strava Status Message */}
        {stravaMessage && (
          <div className={`${spacing.contentBlock} ${components.card.base} text-base ${
            stravaMessage.includes('✓') 
              ? 'bg-secondary-50 dark:bg-secondary-900/30 border border-secondary-200 dark:border-secondary-700 text-secondary-800 dark:text-secondary-200' 
              : 'bg-coral-50 dark:bg-coral-900/30 border border-coral-200 dark:border-coral-700 text-coral-800 dark:text-coral-200'
          }`}>
            {stravaMessage}
          </div>
        )}

        {/* Today's Workout Card */}
        {profile?.stravaConnected && (() => {
          // Find today's session from training plan
          const today = new Date().toISOString().split('T')[0];
          let todaySession: TrainingSession | null = null;
          
          if (trainingPlan?.weeks) {
            for (const week of trainingPlan.weeks) {
              if (week.sessions) {
                const session = week.sessions.find((s: TrainingSession) => s && s.date === today);
                if (session) {
                  todaySession = session;
                  break;
                }
              }
            }
          }

          return (
            <TodayWorkoutCard
              session={todaySession}
              onStartWorkout={() => {
                // TODO: Implement start workout (Strava activity tracking)
                console.log('Start workout:', todaySession);
              }}
              onViewDetails={() => {
                // Navigate to training plan page with today's session highlighted
                router.push('/dashboard/plan');
              }}
              onDownloadZWO={() => {
                if (todaySession && profile?.ftp) {
                  const zwoContent = generateZWOFromSession(todaySession, profile.ftp);
                  const filename = generateZWOFilename(todaySession);
                  const blob = new Blob([zwoContent], { type: 'application/xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
            />
          );
        })()}

        {/* Plan Quality Banner */}
        {!profile?.preferences?.hideTimeSlotWarnings && 
         currentWeekPlan?.quality && 
         currentWeekPlan.quality.warnings.length > 0 &&
         !dismissedPlanWarnings.has(currentWeekPlan.id) && (
          <div className={spacing.contentBlock}>
            <PlanQualityBanner 
              quality={currentWeekPlan.quality} 
              planId={currentWeekPlan.id}
              onDismiss={() => {
                // Add to dismissed set
                setDismissedPlanWarnings(prev => new Set(prev).add(currentWeekPlan.id));
                // Optional: Save to localStorage for persistence
                const dismissed = JSON.parse(localStorage.getItem('dismissedPlanWarnings') || '[]');
                dismissed.push(currentWeekPlan.id);
                localStorage.setItem('dismissedPlanWarnings', JSON.stringify(dismissed));
              }}
            />
          </div>
        )}

        {!profile?.stravaConnected ? (
          <div className={`bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 border border-orange-200 dark:border-orange-700 rounded-lg ${spacing.card} ${spacing.contentBlock}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`${typography.h2} text-gray-900`}>
                  🚀 Connect Your Strava Account
                </h3>
                <p className={`${spacing.tight} text-base text-gray-700`}>
                  Unlock the full power of adaptive training! Connect Strava to automatically sync your rides and get personalized plans.
                </p>
                
                {/* Benefits */}
                <div className={`${spacing.tight} ${components.grid.cols2} text-base text-gray-600 dark:text-gray-300`}>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto-sync activities
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Better predictions
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time fitness tracking
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-secondary dark:text-secondary-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No manual entry
                  </div>
                </div>

                {/* How it works */}
                <details className={`${spacing.tight} text-sm text-gray-600`}>
                  <summary className="cursor-pointer font-medium text-base text-gray-700 hover:text-gray-900">
                    📖 How does it work? (Click to expand)
                  </summary>
                  <div className={`${spacing.micro} pl-4 text-base`}>
                    <p>
                      <strong>Step 1:</strong> Click the button below
                    </p>
                    <p>
                      <strong>Step 2:</strong> You'll be redirected to Strava.com
                    </p>
                    <p>
                      <strong>Step 3:</strong> Log in and click "Authorize"
                    </p>
                    <p>
                      <strong>Step 4:</strong> Done! You'll be redirected back automatically
                    </p>
                    <p className="text-secondary dark:text-secondary-dark font-medium">
                      ✓ You don't need to create any API account - just use your regular Strava login!
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      <strong>Safe & Secure:</strong> We only read your activities, never post or modify anything. 
                      You can disconnect anytime in Settings.
                    </p>
                  </div>
                </details>

                <button
                  onClick={() => {
                    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
                    const redirectUri = `${window.location.origin}/api/auth/strava/callback`;
                    const scope = 'read,activity:read_all,profile:read_all';
                    const userId = auth.currentUser?.uid || '';
                    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${userId}&approval_prompt=auto`;
                  }}
                  className={`${spacing.tight} ${components.button.primary} flex items-center ${spacing.cardGap} text-base font-medium`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                  Connect Strava Now
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8`}>
          <Tooltip
            title="Form (TSB)"
            items={[
              'Zeigt dein aktuelles Erholungs- und Leistungsniveau',
              'Positiver Wert: Du bist erholt und bereit für intensive Einheiten oder Wettkämpfe',
              'Negativer Wert: Du bist ermüdet – ideal für Trainingsphasen mit höherem Umfang',
              'TSB = CTL - ATL (Langfristige Fitness minus kurzfristige Ermüdung)'
            ]}
          >
            <div className={`${components.card.hover} cursor-help transition-transform hover:scale-105 p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    fitnessMetrics.tsb > 25 ? 'bg-secondary-100 dark:bg-secondary-900' :
                    fitnessMetrics.tsb >= -10 ? 'bg-primary-100 dark:bg-primary-900' :
                    fitnessMetrics.tsb >= -30 ? 'bg-orange-100 dark:bg-orange-900' : 'bg-coral-100 dark:bg-coral-900'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      fitnessMetrics.tsb > 25 ? 'text-secondary-600 dark:text-secondary-300' :
                      fitnessMetrics.tsb >= -10 ? 'text-primary-600 dark:text-primary-300' :
                      fitnessMetrics.tsb >= -30 ? 'text-orange-600 dark:text-orange-300' : 'text-coral-600 dark:text-coral-300'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className={`${typography.body} font-medium ${colors.text.secondary}`}>Form (TSB)</p>
                  <p className={`${typography.h2} font-semibold ${colors.text.primary}`}>
                    {profile?.stravaConnected ? fitnessMetrics.tsb.toFixed(1) : '--'}
                  </p>
                  {profile?.stravaConnected && (
                    <p className={`${typography.body} ${colors.text.secondary} ${spacing.micro}`}>
                      {interpretTSB(fitnessMetrics.tsb).message.split('-')[0].trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip
            title="Fitness (CTL)"
            items={[
              'Spiegelt deine langfristige Trainingsbelastung wider',
              'Basiert auf dem Durchschnitt deiner letzten 42 Trainingstage',
              'Höherer CTL-Wert = bessere Ausdauerbasis',
              'Zeigt deine Anpassung an regelmäßiges Training'
            ]}
          >
            <div className={`${components.card.hover} cursor-help transition-transform hover:scale-105 p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-olive-100 dark:bg-olive-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-olive-600 dark:text-olive-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className={`${typography.body} font-medium ${colors.text.secondary}`}>Fitness (CTL)</p>
                  <p className={`${typography.h2} font-semibold ${colors.text.primary}`}>
                    {profile?.stravaConnected ? fitnessMetrics.ctl.toFixed(1) : '--'}
                  </p>
                  <p className={`${typography.body} ${colors.text.secondary} ${spacing.micro}`}>42-Tage Ø</p>
                </div>
              </div>
            </div>
          </Tooltip>

          <Tooltip
            title="Fatigue (ATL)"
            items={[
              'Misst deine kurzfristige Ermüdung durch die letzten 7 Trainingstage',
              'Hohe ATL-Werte bedeuten aktuelle starke Belastung',
              'Hilft Übertraining zu vermeiden',
              'Wichtig für die Steuerung der Regeneration'
            ]}
          >
            <div className={`${components.card.hover} cursor-help transition-transform hover:scale-105 p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-coral-100 dark:bg-coral-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-coral-600 dark:text-coral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className={`${typography.body} font-medium ${colors.text.secondary}`}>Fatigue (ATL)</p>
                  <p className={`${typography.h2} font-semibold ${colors.text.primary}`}>
                    {profile?.stravaConnected ? fitnessMetrics.atl.toFixed(1) : '--'}
                  </p>
                  <p className={`${typography.body} ${colors.text.secondary} ${spacing.micro}`}>7-Tage Ø</p>
                </div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Fitness Chart */}
        {profile?.stravaConnected && fitnessHistory.length > 0 && (
          <div className={`${components.card.base} ${spacing.contentBlock}`}>
            <h2 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-6">
              Fitness Verlauf & Prognose
            </h2>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Deine letzten 42 Trainingstage und zukünftige Entwicklung basierend auf deinem Trainingsplan
            </p>
            <FitnessChart 
              historicalData={fitnessHistory}
              forecastData={fitnessForecast}
              isDarkMode={false}
            />
          </div>
        )}

        {/* This Week's Plan */}
        <div className={`${components.card.base} ${spacing.contentBlock}`}>
          <div className={`${components.card.base} ${colors.border.default} flex items-center justify-between border-b`}>
            <h2 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">This Week's Training Plan</h2>
            {profile?.stravaConnected && (
              <button
                onClick={async () => {
                  console.log('🎯 Generate Plan Button clicked!');
                  console.log('👤 auth.currentUser:', auth.currentUser?.uid);
                  console.log('📋 profile:', profile ? 'loaded' : 'NOT LOADED');
                  
                  if (!auth.currentUser || !profile) {
                    console.error('❌ Cannot generate plan: Missing user or profile!');
                    return;
                  }
                  
                  console.log('✅ Starting plan generation...');
                  setGeneratingPlan(true);
                  try {
                    // Extract user slots from profile (standard template)
                    const standardSlots = profile.preferences?.preferredTrainingTimes || [];
                    
                    console.log('📅 Standard slots loaded:', standardSlots.length, 'slots');
                    console.log('📅 Standard slots:', standardSlots);
                    
                    // Get next event date from season goals
                    const seasonGoals = await getSeasonGoals(auth.currentUser.uid);
                    const nextEvent = seasonGoals.find(
                      (goal: SeasonGoal) => goal.date && new Date(goal.date) > new Date()
                    );
                    const eventDate = nextEvent?.date 
                      ? new Date(nextEvent.date)
                      : null; // No event means MAINTENANCE phase

                    // Generate 12 weeks of training
                    const weeks: WeeklyPlan[] = [];
                    const startDate = new Date();
                    startDate.setHours(0, 0, 0, 0); // Start at midnight
                    
                    for (let weekNum = 1; weekNum <= 12; weekNum++) {
                      const weekStartDate = new Date(startDate);
                      weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
                      
                      // ✅ Check for week-specific override
                      const weekKey = format(weekStartDate, 'yyyy-MM-dd');
                      const weekOverride = profile.weeklyOverrides?.[weekKey];
                      const weekSlots = weekOverride || standardSlots;
                      
                      console.log(`📅 Week ${weekNum} (${weekKey}): Using ${weekOverride ? 'OVERRIDE' : 'standard'} slots (${weekSlots.length} slots)`);
                      
                      const weekPlan = await generateMvpWeeklyPlan({
                        userId: auth.currentUser.uid,
                        userProfile: profile,
                        weekStart: weekStartDate,
                        slots: weekSlots,
                        eventDate,
                        weekNumber: weekNum
                      });
                      
                      // Debug: Check if sessions have timeSlots
                      console.log(`📅 Week ${weekNum} sessions with timeSlots:`, 
                        weekPlan.sessions?.map(s => ({ 
                          date: s.date, 
                          type: s.type, 
                          timeSlot: s.timeSlot 
                        }))
                      );
                      
                      weeks.push(weekPlan);
                    }

                    const fullPlan = {
                      userId: auth.currentUser.uid,
                      planId: `plan-${Date.now()}`,
                      startDate: startDate.toISOString(),
                      endDate: new Date(startDate.getTime() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
                      weeks,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };

                    console.log('✅ MVP Plan generated:', fullPlan);
                    console.log('💾 Saving plan to Firestore...');
                    
                    // Save to Firestore
                    await saveTrainingPlan(auth.currentUser.uid, fullPlan);
                    console.log('✅ Plan saved to Firestore');
                    
                    // Update UI
                    setTrainingPlan(fullPlan);
                    setStravaMessage('✓ Training plan successfully generated!');
                    setTimeout(() => setStravaMessage(null), 5000);
                  } catch (error) {
                    console.error('❌ Error generating plan:', error);
                    setStravaMessage('❌ Error generating plan');
                    setTimeout(() => setStravaMessage(null), 5000);
                  } finally {
                    setGeneratingPlan(false);
                  }
                }}
                disabled={generatingPlan}
                className={`${components.button.primary} text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {generatingPlan ? 'Generating...' : 'Generate Plan'}
              </button>
            )}
          </div>
          <div>
            {loadingPlan ? (
              <div className={`text-center ${spacing.card}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className={`${spacing.micro} text-gray-500`}>Loading plan...</p>
              </div>
            ) : trainingPlan && trainingPlan.weeks && trainingPlan.weeks.length > 0 ? (
              <div className={spacing.section}>
                {/* Week Navigation */}
                <div className={layout.flexRowBetween}>
                  <button
                    onClick={() => setCurrentPlanWeek(Math.max(0, currentPlanWeek - 1))}
                    disabled={currentPlanWeek === 0}
                    className={`${components.button.small} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="text-center">
                    <h3 className={`${typography.h1} font-bold ${colors.text.primary}`}>Week {trainingPlan.weeks[currentPlanWeek]?.weekNumber || 1}</h3>
                    <p className={`${typography.bodyLarge} ${colors.text.secondary} ${spacing.micro}`}>{currentPlanWeek === 0 ? 'This Week' : `+${currentPlanWeek} weeks`}</p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPlanWeek(Math.min(trainingPlan.weeks.length - 1, currentPlanWeek + 1))}
                    disabled={currentPlanWeek >= trainingPlan.weeks.length - 1}
                    className={`${components.button.small} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Current Week Display */}
                {(() => {
                  const week = trainingPlan.weeks[currentPlanWeek];
                  if (!week) return null;
                  
                  return (
                    <>
                      <div className={`bg-blue-50 dark:bg-blue-900/30 rounded-lg ${components.card.base} border border-blue-200 dark:border-blue-700`}>
                        <div className={`grid grid-cols-7 ${spacing.cardGap}`}>
                          {week.sessions?.map((session: any, idx: number) => (
                            <div key={idx} className={`${components.card.base} text-center ${colors.border.default} border`}>
                              <p className={`${typography.bodySmall} font-medium ${colors.text.secondary} ${spacing.micro}`}>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                              </p>
                              {session ? (
                                <>
                                  <p className={`${typography.body} font-semibold ${colors.text.primary}`}>{session.type}</p>
                                  <p className={`${typography.bodySmall} ${colors.text.secondary} ${spacing.micro}`}>{formatHoursToTime(session.duration / 60)}</p>
                                  <p className={`${typography.bodySmall} ${colors.text.secondary}`}>{session.targetTss.toFixed(1)} TSS</p>
                                  {session.timeSlot && (
                                    <p className={`${typography.bodySmall} ${colors.text.secondary} ${spacing.micro} font-mono`}>
                                      🕒 {session.timeSlot.startTime} - {session.timeSlot.endTime}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className={`${typography.bodySmall} ${colors.text.secondary}`}>Rest</p>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Week Summary - Horizontal Layout */}
                        <div className={`${spacing.tight} grid grid-cols-4 gap-4 ${typography.body} text-center`}>
                          <div>
                            <p className={`${colors.text.secondary} text-sm`}>TSS</p>
                            <p className={`${colors.text.primary} font-bold text-lg`}>{week.totalTss.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className={`${colors.text.secondary} text-sm`}>Hours</p>
                            <p className={`${colors.text.primary} font-bold text-lg`}>{formatHoursToTime(week.totalHours || 0)}</p>
                          </div>
                          <div>
                            <p className={`${colors.text.secondary} text-sm`}>LIT</p>
                            <p className={`${colors.text.primary} font-bold text-lg`}>{((week.litRatio || 0) * 100).toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className={`${colors.text.secondary} text-sm`}>HIT</p>
                            <p className={`${colors.text.primary} font-bold text-lg`}>{week.hitSessions || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Link to detailed Training Plan */}
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => router.push('/dashboard/plan')}
                          className={`${components.button.primary} text-base`}
                        >
                          📋 View Full Training Plan & Export Workouts
                        </button>
                      </div>

                      {/* REMOVED: Detailed Session View - Now on Training Plan page */}
                      <div className="mt-6 space-y-3 hidden">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📋 Training Sessions Details</h3>
                        {week.sessions && week.sessions.length > 0 ? (
                          week.sessions.filter((s: TrainingSession) => s).map((session: TrainingSession, idx: number) => {
                            return (
                            <div key={session.id || idx} className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow hidden">
                              {/* Session Header */}
                              <div className={`flex items-start justify-between ${spacing.micro}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`${typography.bodyLarge} font-semibold ${colors.text.primary}`}>
                                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx]}
                                    </h4>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      session.type === 'LIT' 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : session.type === 'HIT'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }`}>
                                      {session.type}
                                    </span>
                                  </div>
                                  <p className={`${typography.body} ${colors.text.secondary} ${spacing.micro}`}>
                                    Training
                                  </p>
                                  <p className={`${typography.bodySmall} ${colors.text.secondary}`}>
                                    {session.description || 'No description'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`${typography.body} font-semibold ${colors.text.primary}`}>
                                    {session.targetTss.toFixed(1)} TSS
                                  </p>
                                  <p className={`${typography.bodySmall} ${colors.text.secondary}`}>
                                    {formatHoursToTime(session.duration / 60)}
                                  </p>
                                </div>
                              </div>

                              {/* Export Buttons */}
                              <div className={`${spacing.tight} flex gap-2`}>
                                <button
                                  onClick={async () => {
                                    try {
                                      const zwoXML = generateZWOFromSession(session, profile?.ftp || 200);
                                      const filename = generateZWOFilename(session);
                                      const blob = new Blob([zwoXML], { type: 'application/xml' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = filename;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Export error:', error);
                                      alert('Error exporting workout');
                                    }
                                  }}
                                  className={`${components.button.secondary} text-sm`}
                                >
                                  📥 Export to Zwift
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const zwoXML = generateZWOFromSession(session, profile?.ftp || 200);
                                      const filename = generateZWOFilename(session);
                                      const blob = new Blob([zwoXML], { type: 'application/xml' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = filename;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Export error:', error);
                                      alert('Error exporting workout');
                                    }
                                  }}
                                  className={`${components.button.secondary} text-sm`}
                                >
                                  📥 Export to MyWhoosh
                                </button>
                              </div>

                              {/* Session Notes */}
                              {trainingPlan && (
                                <SessionNotes
                                  session={session}
                                  onSave={async (updates) => {
                                    const user = auth.currentUser;
                                    if (!user) return;
                                    try {
                                      await updateTrainingSession(user.uid, trainingPlan.id, session.id, updates);
                                      // Reload plan
                                      const planRes = await fetch(`/api/training/plan?userId=${user.uid}`);
                                      if (planRes.ok) {
                                        const planData = await planRes.json();
                                        setTrainingPlan(planData.plan);
                                      }
                                    } catch (error) {
                                      console.error('Error saving notes:', error);
                                      alert('Error saving notes');
                                    }
                                  }}
                                />
                              )}
                            </div>
                          );
                        })
                        ) : (
                          <p className="text-gray-500 text-center py-4">No training sessions for this week</p>
                        )}
                      </div>

                      {/* Plan Summary - REMOVED, redundant with week summary above */}
                      <div className={`${components.grid.cols2} ${spacing.cardGap} hidden`}>
                        <div className={`${components.card.base} ${colors.border.default} border`}>
                          <h4 className={`${typography.body} font-semibold ${colors.text.primary} ${spacing.micro}`}>Training Load</h4>
                          <div className={`${spacing.micro} ${typography.body} ${colors.text.secondary}`}>
                            <p>LIT Ratio: <strong className={colors.text.primary}>{((week.litRatio || 0) * 100).toFixed(1)}%</strong></p>
                            <p>Total Hours: <strong className={colors.text.primary}>{formatHoursToTime(week.totalHours || 0)}</strong></p>
                            <p>Sessions: <strong className={colors.text.primary}>{week.sessions?.filter((s: any) => s).length || 0}</strong></p>
                          </div>
                        </div>
                        <div className={`${components.card.base} ${colors.border.default} border`}>
                          <h4 className={`${typography.body} font-semibold ${colors.text.primary} ${spacing.micro}`}>Fitness Projection</h4>
                          <div className={`${spacing.micro} ${typography.body} ${colors.text.secondary}`}>
                            <p>Projected CTL: <strong className={colors.text.primary}>{(week.projectedFitness?.ctl || 0).toFixed(1)}</strong></p>
                            <p>Projected ATL: <strong className={colors.text.primary}>{(week.projectedFitness?.atl || 0).toFixed(1)}</strong></p>
                            <p>Projected TSB: <strong className="text-text-primary-light dark:text-text-primary-dark">{(week.projectedFitness?.tsb || 0).toFixed(1)}</strong></p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-1 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1 text-base">No training plan generated yet</p>
                <p className="text-base text-gray-400 mt-1">
                  {profile?.stravaConnected 
                    ? 'Click "Generate Plan" to create your personalized training plan'
                    : 'Connect Strava and configure your settings to get started'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
