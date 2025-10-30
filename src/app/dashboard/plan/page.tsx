'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserProfile } from '@/lib/firestore';
import { Calendar, Clock, TrendingUp, Activity } from 'lucide-react';

interface UserProfile {
  email?: string;
  ftp?: number;
  weight?: number;
  age?: number;
  restingHR?: number;
  maxHR?: number;
  stravaConnected?: boolean;
  stravaAthleteId?: string;
}

export default function TrainingPlanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
      const userProfile = await getUserProfile(currentUser.uid);
      setProfile(userProfile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Trainingsplan...</p>
        </div>
      </div>
    );
  }

  // Sample training plan data (will be replaced with real data later)
  const weekPlan = [
    {
      day: 'Montag',
      date: '2025-11-03',
      workout: 'Recovery Ride',
      type: 'LIT',
      duration: 60,
      tss: 45,
      description: 'Lockeres Regenerationstraining in Zone 1-2',
      completed: true
    },
    {
      day: 'Dienstag',
      date: '2025-11-04',
      workout: 'Sweet Spot Intervals',
      type: 'HIT',
      duration: 90,
      tss: 85,
      description: '3x10min @ 88-94% FTP, 5min Pause',
      completed: false
    },
    {
      day: 'Mittwoch',
      date: '2025-11-05',
      workout: 'Rest Day',
      type: 'REST',
      duration: 0,
      tss: 0,
      description: 'Ruhetag - Regeneration',
      completed: false
    },
    {
      day: 'Donnerstag',
      date: '2025-11-06',
      workout: 'Endurance Ride',
      type: 'LIT',
      duration: 120,
      tss: 95,
      description: 'Grundlagenausdauer Zone 2',
      completed: false
    },
    {
      day: 'Freitag',
      date: '2025-11-07',
      workout: 'VO2max Intervals',
      type: 'HIT',
      duration: 75,
      tss: 90,
      description: '5x5min @ 106-120% FTP, 5min Pause',
      completed: false
    },
    {
      day: 'Samstag',
      date: '2025-11-08',
      workout: 'Long Ride',
      type: 'LIT',
      duration: 180,
      tss: 140,
      description: 'Lange Ausfahrt Zone 2-3',
      completed: false
    },
    {
      day: 'Sonntag',
      date: '2025-11-09',
      workout: 'Active Recovery',
      type: 'LIT',
      duration: 45,
      tss: 30,
      description: 'Aktive Erholung, sehr locker',
      completed: false
    }
  ];

  const weeklyTSS = weekPlan.reduce((sum, day) => sum + day.tss, 0);
  const completedTSS = weekPlan.filter(d => d.completed).reduce((sum, day) => sum + day.tss, 0);

  return (
    <DashboardLayout
      userEmail={user?.email || ''}
      currentPage="Trainingsplan"
      pageDescription="Dein wöchentlicher Trainingsplan"
      onSignOut={handleSignOut}
      onHelp={() => {}}
    >
      <div className="space-y-6">
        {/* Week Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Woche 45 - 2025</h2>
              <p className="text-gray-600">3. November - 9. November 2025</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{completedTSS}</div>
                <div className="text-sm text-gray-600">TSS absolviert</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{weeklyTSS}</div>
                <div className="text-sm text-gray-600">TSS geplant</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {Math.round((completedTSS / weeklyTSS) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Fortschritt</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-red-600 to-yellow-400 h-3 rounded-full transition-all"
              style={{ width: `${(completedTSS / weeklyTSS) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Training Days */}
        <div className="space-y-4">
          {weekPlan.map((workout, index) => (
            <div 
              key={index}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${
                workout.completed 
                  ? 'border-green-500 bg-green-50/30' 
                  : workout.type === 'REST' 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{workout.day}</h3>
                    <span className="text-sm text-gray-600">{workout.date}</span>
                    {workout.completed && (
                      <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        ✓ Abgeschlossen
                      </span>
                    )}
                    {workout.type !== 'REST' && (
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        workout.type === 'HIT' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {workout.type}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{workout.workout}</h4>
                  <p className="text-gray-600 mb-4">{workout.description}</p>
                  
                  {workout.type !== 'REST' && (
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{workout.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{workout.tss} TSS</span>
                      </div>
                    </div>
                  )}
                </div>

                {!workout.completed && workout.type !== 'REST' && (
                  <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                    Starten
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Week Summary */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4">Wochenzusammenfassung</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-3xl font-bold">{weekPlan.filter(w => w.type === 'HIT').length}</div>
              <div className="text-red-100">HIT Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{weekPlan.filter(w => w.type === 'LIT').length}</div>
              <div className="text-red-100">LIT Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{Math.round(weekPlan.reduce((sum, w) => sum + w.duration, 0) / 60)}h {weekPlan.reduce((sum, w) => sum + w.duration, 0) % 60}m</div>
              <div className="text-red-100">Gesamtzeit</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{weeklyTSS}</div>
              <div className="text-red-100">Wochen-TSS</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
