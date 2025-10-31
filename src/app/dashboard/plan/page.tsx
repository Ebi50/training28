'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserProfile } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// Helper function to format hours to "h:mm h" (rounded to 5min)
const formatHoursToTime = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const roundedMinutes = Math.round(totalMinutes / 5) * 5; // Round to nearest 5 minutes
  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')} h`;
};

interface UserProfile {
  email?: string;
  ftp?: number;
  stravaConnected?: boolean;
}

export default function TrainingPlanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }
      
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    const loadPlan = async () => {
      const user = auth.currentUser;
      if (!user || !profile?.stravaConnected) return;

      setLoadingPlan(true);
      try {
        const response = await fetch(`/api/training/plan?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Plan loaded:', data.plan);
          console.log('📊 Weeks type:', typeof data.plan?.weeks);
          console.log('📊 Weeks isArray:', Array.isArray(data.plan?.weeks));
          
          // Convert weeks object to array if needed
          let plan = data.plan;
          if (plan?.weeks && !Array.isArray(plan.weeks)) {
            console.log('🔄 Converting weeks object to array');
            plan = {
              ...plan,
              weeks: Object.values(plan.weeks)
            };
          }
          
          console.log('📊 Processed weeks:', plan?.weeks);
          console.log('📊 First week:', plan?.weeks?.[0]);
          setTrainingPlan(plan);
          setCurrentWeek(0); // Reset to first week
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setLoadingPlan(false);
      }
    };

    loadPlan();
  }, [profile?.stravaConnected]);

  const handleGeneratePlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setGeneratingPlan(true);
    try {
      const response = await fetch('/api/training/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Convert weeks object to array if needed
        let plan = data.plan;
        if (plan?.weeks && !Array.isArray(plan.weeks)) {
          console.log('🔄 Converting weeks object to array on generate');
          plan = {
            ...plan,
            weeks: Object.values(plan.weeks)
          };
        }
        
        setTrainingPlan(plan);
        setCurrentWeek(0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return null;
  }

  // Ensure weeks is an array
  const weeksArray = trainingPlan?.weeks 
    ? (Array.isArray(trainingPlan.weeks) ? trainingPlan.weeks : Object.values(trainingPlan.weeks))
    : null;
  
  const currentWeekData = weeksArray?.[currentWeek];
  
  // Debug logging
  console.log('🔍 Current week index:', currentWeek);
  console.log('🔍 Weeks array:', weeksArray);
  console.log('🔍 Current week data:', currentWeekData);
  console.log('🔍 Total weeks:', weeksArray?.length);

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Training Plan</h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1 text-base">8-week training schedule</p>
          </div>
          {profile?.stravaConnected && (
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="px-6 py-3 bg-blue-600 text-white text-base rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {generatingPlan ? 'Generating...' : 'Generate Plan'}
            </button>
          )}
        </div>

        {loadingPlan ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : !weeksArray || weeksArray.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">No Plan Yet</h3>
            <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark text-base">Click Generate Plan to create your schedule</p>
            {trainingPlan && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-left text-sm">
                <p className="font-bold">Debug Info:</p>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(trainingPlan, null, 2).substring(0, 500)}</pre>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
              <div className="px-6 py-4 flex items-center justify-between border-b dark:border-gray-700">
                <button
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className="px-4 py-2 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Previous Week
                </button>
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Woche {currentWeek + 1}</h2>
                <button
                  onClick={() => setCurrentWeek(Math.min(weeksArray.length - 1, currentWeek + 1))}
                  disabled={currentWeek >= weeksArray.length - 1}
                  className="px-4 py-2 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  Next Week
                </button>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">TSS</p>
                    <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{(currentWeekData?.totalTss || 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">Hours</p>
                    <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{formatHoursToTime(currentWeekData?.totalHours || 0)}</p>
                  </div>
                  <div>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">HIT</p>
                    <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{currentWeekData?.hitSessions || 0}</p>
                  </div>
                  <div>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">LIT</p>
                    <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{((currentWeekData?.litRatio || 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {currentWeekData?.sessions?.map((session: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                    </h3>
                    {session && (
                      <span className={'px-3 py-1 text-sm rounded-full ' + (
                        session.type === 'HIT' ? 'bg-coral-100 dark:bg-coral-900 text-coral-700 dark:text-coral-200' : 
                        session.type === 'LIT' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                        'bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-200'
                      )}>
                        {session.type}
                      </span>
                    )}
                  </div>
                  {session ? (
                    <>
                      <p className="font-medium mb-2 text-base text-text-primary-light dark:text-text-primary-dark">{session.name || 'Training'}</p>
                      {session.description && (
                        <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-3">
                          {session.description
                            // First handle "Xh Ym" patterns (e.g., "1h 48m" -> "1:48h")
                            .replace(/(\d+\.?\d*)h\s*(\d+)m/g, (match: string, h: string, m: string) => {
                              const totalHours = parseFloat(h) + parseFloat(m) / 60;
                              return formatHoursToTime(totalHours);
                            })
                            // Then handle standalone "Xh" patterns
                            .replace(/(\d+\.?\d*)h/g, (match: string) => {
                              const hours = parseFloat(match.replace('h', ''));
                              return formatHoursToTime(hours);
                            })
                            // Handle standalone minutes (e.g., "101.25min" -> "105min")
                            .replace(/(\d+\.?\d*)min/g, (match: string) => {
                              const mins = parseFloat(match.replace('min', ''));
                              const rounded = Math.round(mins / 5) * 5;
                              return `${rounded}min`;
                            })
                            // TSS formatting
                            .replace(/TSS:\s*[\d.]+/g, (match: string) => {
                              const tss = parseFloat(match.replace('TSS:', '').trim());
                              return 'TSS: ' + tss.toFixed(1);
                            })
                          }
                        </p>
                      )}
                      <div className="flex gap-6 text-base text-text-secondary-light dark:text-text-secondary-dark">
                        <span>{session.targetTss.toFixed(1)} TSS</span>
                        {session.targetZone && <span>Zone {session.targetZone}</span>}
                      </div>
                    </>
                  ) : (
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">Rest Day</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
