'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import SessionNotes from '@/components/SessionNotes';
import { getUserProfile, updateTrainingSession } from '@/lib/firestore';
import { generateZWOFromSession, generateZWOFilename } from '@/lib/zwoGenerator';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
import type { TrainingSession } from '@/types';

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
      <div className="w-full">
        <div className={`${spacing.contentBlock} ${layout.flexRowBetween}`}>
          <div>
            <h1 className={`${typography.h1} font-bold ${colors.text.primary}`}>Training Plan</h1>
            <p className={`${colors.text.secondary} ${spacing.micro} ${typography.body}`}>8-week training schedule</p>
          </div>
          {profile?.stravaConnected && (
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className={`${components.button.primary} ${typography.body} font-medium disabled:opacity-50`}
            >
              {generatingPlan ? 'Generating...' : 'Generate Plan'}
            </button>
          )}
        </div>

        {loadingPlan ? (
          <div className={`${components.card.base} text-center`} style={{padding: '3rem'}}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : !weeksArray || weeksArray.length === 0 ? (
          <div className={`${components.card.base} text-center`} style={{padding: '3rem'}}>
            <h3 className={`${typography.h3} font-semibold ${colors.text.primary}`}>No Plan Yet</h3>
            <p className={`${spacing.micro} ${colors.text.secondary} ${typography.body}`}>Click Generate Plan to create your schedule</p>
            {trainingPlan && (
              <div className={`${spacing.tight} p-4 bg-gray-100 dark:bg-gray-700 rounded text-left ${typography.bodySmall}`}>
                <p className="font-bold">Debug Info:</p>
                <pre className={`${spacing.micro} whitespace-pre-wrap`}>{JSON.stringify(trainingPlan, null, 2).substring(0, 500)}</pre>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`${components.card.base} ${spacing.contentBlock}`}>
              <div className={`${components.card.base} ${layout.flexRowBetween} border-b dark:border-gray-700`}>
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
                  className={`${components.button.secondary} disabled:opacity-50`}
                >
                  Next Week
                </button>
              </div>
              <div className={`${components.card.base} bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700`}>
                <div className="flex gap-6 items-center">
                  <div>
                    <p className={`${typography.body} ${colors.text.secondary}`}>TSS</p>
                    <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{(currentWeekData?.totalTss || 0).toFixed(1)}</p>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600">|</div>
                  <div>
                    <p className={`${typography.body} ${colors.text.secondary}`}>Hours</p>
                    <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{formatHoursToTime(currentWeekData?.totalHours || 0)}</p>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600">|</div>
                  <div>
                    <p className={`${typography.body} ${colors.text.secondary}`}>HIT</p>
                    <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{(((1 - (currentWeekData?.litRatio || 0)) * 100)).toFixed(1)}%</p>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600">|</div>
                  <div>
                    <p className={`${typography.body} ${colors.text.secondary}`}>LIT</p>
                    <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{((currentWeekData?.litRatio || 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={spacing.section}>
              {currentWeekData?.sessions?.map((session: TrainingSession, idx: number) => (
                <div key={session?.id || idx} className={`${components.card.base} ${session ? 'border-2 border-gray-200 dark:border-gray-700' : ''}`}>
                  <div className={`flex items-center ${spacing.cardGap} ${spacing.micro}`}>
                    <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx]}
                    </h3>
                    {session && (
                      <span className={`${typography.bodySmall} rounded-full px-3 py-1 font-medium ` + (
                        session.type === 'HIT' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 
                        session.type === 'LIT' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' :
                        'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                      )}>
                        {session.type}
                      </span>
                    )}
                  </div>
                  {session ? (
                    <>
                      <p className={`font-medium ${spacing.micro} ${typography.bodyLarge} ${colors.text.primary}`}>Training</p>
                      {session.description && (
                        <p className={`${typography.body} ${colors.text.secondary} ${spacing.tight}`}>
                          {session.description}
                        </p>
                      )}
                      <div className={`flex ${spacing.cardGap} ${typography.body} ${colors.text.secondary} ${spacing.tight}`}>
                        <span>{formatHoursToTime(session.duration / 60)}</span>
                      </div>

                      {/* Export Button */}
                      <div className={`${spacing.tight} pt-2 border-t dark:border-gray-700`}>
                        <button
                          onClick={() => {
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
                          className="w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all text-sm shadow-md hover:shadow-lg"
                        >
                          📥 Export to Zwift / MyWhoosh
                        </button>
                      </div>

                      {/* Session Notes & RPE */}
                      {trainingPlan && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                          <SessionNotes
                            session={session}
                            onSave={async (updates) => {
                              const user = auth.currentUser;
                              if (!user) {
                                console.error('No user logged in');
                                alert('Bitte einloggen um Notizen zu speichern');
                                return;
                              }
                              
                              if (!trainingPlan?.id) {
                                console.error('No training plan ID found:', trainingPlan);
                                alert('Fehler: Kein Trainingsplan gefunden. Bitte Plan neu generieren.');
                                return;
                              }
                              
                              if (!session?.id) {
                                console.error('No session ID found:', session);
                                alert('Fehler: Keine Session-ID gefunden.');
                                return;
                              }
                              
                              try {
                                console.log('💾 Saving session updates:', { 
                                  userId: user.uid, 
                                  planId: trainingPlan.id, 
                                  sessionId: session.id, 
                                  updates 
                                });
                                
                                await updateTrainingSession(user.uid, trainingPlan.id, session.id, updates);
                                console.log('✅ Session saved successfully');
                                
                                // Reload plan
                                console.log('🔄 Reloading plan...');
                                const planRes = await fetch(`/api/training/plan?userId=${user.uid}`);
                                if (planRes.ok) {
                                  const planData = await planRes.json();
                                  setTrainingPlan(planData.plan);
                                  console.log('✅ Plan reloaded successfully');
                                } else {
                                  const errorText = await planRes.text();
                                  console.error('❌ Failed to reload plan:', errorText);
                                  alert('Notizen gespeichert, aber Plan konnte nicht neu geladen werden. Bitte Seite neu laden.');
                                }
                              } catch (error) {
                                console.error('❌ Error saving notes:', error);
                                alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte prüfe die Browser-Console (F12) für Details.`);
                              }
                            }}
                          />
                        </div>
                      )}
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
