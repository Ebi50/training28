'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import UserTutorial from '@/components/UserTutorial';
import DashboardLayout from '@/components/DashboardLayout';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { calculateTSS, calculateFitnessMetrics, interpretTSB } from '@/lib/fitnessMetrics';

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

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [stravaMessage, setStravaMessage] = useState<string | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [fitnessMetrics, setFitnessMetrics] = useState({ ctl: 0, atl: 0, tsb: 0 });
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [currentPlanWeek, setCurrentPlanWeek] = useState(0);
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
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Strava Status Message */}
        {stravaMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            stravaMessage.includes('✓') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {stravaMessage}
          </div>
        )}

        {!profile?.stravaConnected ? (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="#FC4C02">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-2xl font-semibold text-gray-900">
                  🚀 Connect Your Strava Account
                </h3>
                <p className="mt-2 text-base text-gray-700">
                  Unlock the full power of adaptive training! Connect Strava to automatically sync your rides and get personalized plans.
                </p>
                
                {/* Benefits */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auto-sync activities
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Better predictions
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time fitness tracking
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No manual entry
                  </div>
                </div>

                {/* How it works */}
                <details className="mt-4 text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    📖 How does it work? (Click to expand)
                  </summary>
                  <div className="mt-2 pl-4 space-y-2">
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
                    <p className="text-green-600 font-medium">
                      ✓ You don't need to create any API account - just use your regular Strava login!
                    </p>
                    <p className="text-gray-500">
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
                  className="mt-4 px-6 py-3 bg-orange dark:bg-orange-dark text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 text-base font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  fitnessMetrics.tsb > 25 ? 'bg-green-100' :
                  fitnessMetrics.tsb >= -10 ? 'bg-blue-100' :
                  fitnessMetrics.tsb >= -30 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    fitnessMetrics.tsb > 25 ? 'text-green-600' :
                    fitnessMetrics.tsb >= -10 ? 'text-blue-600' :
                    fitnessMetrics.tsb >= -30 ? 'text-yellow-600' : 'text-red-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-500">Form (TSB)</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {profile?.stravaConnected ? fitnessMetrics.tsb.toFixed(1) : '--'}
                </p>
                {profile?.stravaConnected && (
                  <p className="text-sm text-gray-500 mt-1">
                    {interpretTSB(fitnessMetrics.tsb).message.split('-')[0].trim()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-500">Fitness (CTL)</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {profile?.stravaConnected ? fitnessMetrics.ctl.toFixed(1) : '--'}
                </p>
                <p className="text-sm text-gray-500 mt-1">42-Tage Ø</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-500">Fatigue (ATL)</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {profile?.stravaConnected ? fitnessMetrics.atl.toFixed(1) : '--'}
                </p>
                <p className="text-sm text-gray-500 mt-1">7-Tage Ø</p>
              </div>
            </div>
          </div>
        </div>

        {/* This Week's Plan */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">This Week's Training Plan</h2>
            {profile?.stravaConnected && (
              <button
                onClick={async () => {
                  if (!auth.currentUser) return;
                  setGeneratingPlan(true);
                  try {
                    const response = await fetch('/api/training/generate-plan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: auth.currentUser.uid })
                    });
                    if (response.ok) {
                      const data = await response.json();
                      console.log('✅ Plan generated:', data);
                      console.log('✅ Plan structure:', data.plan);
                      console.log('✅ Plan weeks:', data.plan?.weeks);
                      setTrainingPlan(data.plan);
                      setStravaMessage('✓ Training plan successfully generated!');
                      setTimeout(() => setStravaMessage(null), 5000);
                    } else {
                      const errorText = await response.text();
                      console.error('❌ Failed to generate plan:', errorText);
                      setStravaMessage('❌ Failed to generate plan');
                      setTimeout(() => setStravaMessage(null), 5000);
                    }
                  } catch (error) {
                    console.error('❌ Error:', error);
                    setStravaMessage('❌ Error generating plan');
                    setTimeout(() => setStravaMessage(null), 5000);
                  } finally {
                    setGeneratingPlan(false);
                  }
                }}
                disabled={generatingPlan}
                className="px-6 py-3 bg-primary dark:bg-primary-dark text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {generatingPlan ? 'Generating...' : 'Generate Plan'}
              </button>
            )}
          </div>
          <div className="p-6">
            {loadingPlan ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading plan...</p>
              </div>
            ) : trainingPlan && trainingPlan.weeks && trainingPlan.weeks.length > 0 ? (
              <div className="space-y-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPlanWeek(Math.max(0, currentPlanWeek - 1))}
                    disabled={currentPlanWeek === 0}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Week {trainingPlan.weeks[currentPlanWeek]?.weekNumber || 1}</h3>
                    <p className="text-xs text-gray-500">{currentPlanWeek === 0 ? 'This Week' : `+${currentPlanWeek} weeks`}</p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPlanWeek(Math.min(trainingPlan.weeks.length - 1, currentPlanWeek + 1))}
                    disabled={currentPlanWeek >= trainingPlan.weeks.length - 1}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="grid grid-cols-7 gap-2">
                          {week.sessions?.map((session: any, idx: number) => (
                            <div key={idx} className="bg-white rounded p-3 text-center border border-gray-200">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                              </p>
                              {session ? (
                                <>
                                  <p className="text-sm font-semibold text-gray-900">{session.type}</p>
                                  <p className="text-xs text-gray-600 mt-1">{session.duration} min</p>
                                  <p className="text-xs text-gray-500">{Math.round(session.targetTss)} TSS</p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-400">Rest</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-gray-600">Weekly TSS: <strong>{Math.round(week.totalTss || 0)}</strong></span>
                          <span className="text-gray-600">Total Time: <strong>{Math.round((week.totalHours || 0) * 60)} min</strong></span>
                          <span className="text-gray-600">HIT Sessions: <strong>{week.hitSessions || 0}</strong></span>
                        </div>
                      </div>

                      {/* Plan Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Training Load</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>LIT Ratio: <strong>{Math.round((week.litRatio || 0) * 100)}%</strong></p>
                            <p>Total Hours: <strong>{(week.totalHours || 0).toFixed(1)} h</strong></p>
                            <p>Sessions: <strong>{week.sessions?.filter((s: any) => s).length || 0}</strong></p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Fitness Projection</h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>Projected CTL: <strong>{Math.round(week.projectedFitness?.ctl || 0)}</strong></p>
                            <p>Projected ATL: <strong>{Math.round(week.projectedFitness?.atl || 0)}</strong></p>
                            <p>Projected TSB: <strong>{Math.round(week.projectedFitness?.tsb || 0)}</strong></p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2">No training plan generated yet</p>
                <p className="text-sm text-gray-400 mt-1">
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
