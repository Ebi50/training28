'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserProfile } from '@/lib/firestore';
import { Calendar, Clock, TrendingUp, MapPin, Heart, Zap } from 'lucide-react';

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

export default function ActivitiesPage() {
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
          <p className="text-gray-600">Lade Aktivitäten...</p>
        </div>
      </div>
    );
  }

  // Sample activities (will be replaced with real Strava data)
  const activities = [
    {
      id: 1,
      name: 'Morning Sweet Spot Session',
      type: 'Ride',
      date: '2025-11-03',
      time: '07:30',
      duration: 90,
      distance: 45.2,
      tss: 85,
      avgPower: 245,
      normalizedPower: 258,
      avgHR: 152,
      elevation: 420,
      indoor: true
    },
    {
      id: 2,
      name: 'Recovery Spin',
      type: 'Ride',
      date: '2025-11-02',
      time: '18:00',
      duration: 60,
      distance: 28.5,
      tss: 42,
      avgPower: 180,
      normalizedPower: 185,
      avgHR: 128,
      elevation: 180,
      indoor: false
    },
    {
      id: 3,
      name: 'Weekend Long Ride',
      type: 'Ride',
      date: '2025-11-01',
      time: '09:00',
      duration: 180,
      distance: 95.8,
      tss: 142,
      avgPower: 215,
      normalizedPower: 228,
      avgHR: 145,
      elevation: 1250,
      indoor: false
    },
    {
      id: 4,
      name: 'VO2max Intervals',
      type: 'Ride',
      date: '2025-10-31',
      time: '07:00',
      duration: 75,
      distance: 35.2,
      tss: 88,
      avgPower: 268,
      normalizedPower: 285,
      avgHR: 168,
      elevation: 380,
      indoor: true
    },
    {
      id: 5,
      name: 'Easy Endurance Ride',
      type: 'Ride',
      date: '2025-10-30',
      time: '16:30',
      duration: 120,
      distance: 62.4,
      tss: 95,
      avgPower: 205,
      normalizedPower: 212,
      avgHR: 138,
      elevation: 620,
      indoor: false
    }
  ];

  const totalTSS = activities.reduce((sum, act) => sum + act.tss, 0);
  const totalTime = activities.reduce((sum, act) => sum + act.duration, 0);
  const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);

  return (
    <DashboardLayout
      userEmail={user?.email || ''}
      currentPage="Aktivitäten"
      pageDescription="Deine Trainingshistorie"
      onSignOut={handleSignOut}
      onHelp={() => {}}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aktivitäten</p>
                <p className="text-3xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamtzeit</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.floor(totalTime / 60)}h {totalTime % 60}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Distanz</p>
                <p className="text-3xl font-bold text-gray-900">{totalDistance.toFixed(1)} km</p>
              </div>
              <MapPin className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Gesamt TSS</p>
                <p className="text-3xl font-bold text-gray-900">{totalTSS}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Strava Connection Banner */}
        {!profile?.stravaConnected && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Verbinde Strava für automatische Aktivitätssynchronisation</h3>
                <p className="text-orange-100">Alle deine Trainings werden automatisch importiert und analysiert.</p>
              </div>
              <button className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors">
                Mit Strava verbinden
              </button>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Letzte Aktivitäten</h2>
          
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-red-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{activity.name}</h3>
                    {activity.indoor && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">
                        Indoor
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{activity.date}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                    <span>•</span>
                    <span className="capitalize">{activity.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">{activity.tss}</div>
                  <div className="text-sm text-gray-600">TSS</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Zeit</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.duration} min</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Distanz</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.distance} km</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Avg Power</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.avgPower} W</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">NP</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.normalizedPower} W</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">Avg HR</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.avgHR} bpm</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Elevation</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{activity.elevation} m</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
