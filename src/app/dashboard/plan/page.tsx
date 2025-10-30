'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserProfile } from '@/lib/firestore';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

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
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Plan</h1>
            <p className="text-gray-600 mt-1">8-week training schedule</p>
          </div>
          {profile?.stravaConnected && (
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {generatingPlan ? 'Generating...' : 'Generate Plan'}
            </button>
          )}
        </div>

        {loadingPlan ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : !weeksArray || weeksArray.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900">No Plan Yet</h3>
            <p className="mt-2 text-gray-600">Click Generate Plan to create your schedule</p>
            {trainingPlan && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                <p className="font-bold">Debug Info:</p>
                <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(trainingPlan, null, 2).substring(0, 500)}</pre>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 flex items-center justify-between border-b">
                <button
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Previous Week
                </button>
                <h2 className="text-2xl font-bold">Woche {currentWeek + 1}</h2>
                <button
                  onClick={() => setCurrentWeek(Math.min(weeksArray.length - 1, currentWeek + 1))}
                  disabled={currentWeek >= weeksArray.length - 1}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Next Week
                </button>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">TSS</p>
                    <p className="text-2xl font-bold">{Math.round(currentWeekData?.totalTss || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hours</p>
                    <p className="text-2xl font-bold">{(currentWeekData?.totalHours || 0).toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">HIT</p>
                    <p className="text-2xl font-bold">{currentWeekData?.hitSessions || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">LIT</p>
                    <p className="text-2xl font-bold">{Math.round((currentWeekData?.litRatio || 0) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {currentWeekData?.sessions?.map((session: any, idx: number) => (
                <div key={idx} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                    </h3>
                    {session && (
                      <span className={'px-3 py-1 text-xs rounded-full ' + (session.type === 'HIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                        {session.type}
                      </span>
                    )}
                  </div>
                  {session ? (
                    <>
                      <p className="font-medium mb-2">{session.name || 'Training'}</p>
                      {session.description && <p className="text-sm text-gray-600 mb-3">{session.description}</p>}
                      <div className="flex gap-6 text-sm">
                        <span>{session.duration} min</span>
                        <span>{Math.round(session.targetTss)} TSS</span>
                        {session.targetZone && <span>Zone {session.targetZone}</span>}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">Rest Day</p>
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
