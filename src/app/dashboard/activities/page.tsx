'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { signOut } from 'firebase/auth';
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  max_watts?: number;
  kilojoules?: number;
  average_speed: number;
  max_speed: number;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const router = useRouter();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  const loadActivities = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const afterTimestamp = Math.floor(weekStart.getTime() / 1000);
      const beforeTimestamp = Math.floor(weekEnd.getTime() / 1000) + 86400;

      const response = await fetch(
        `/api/strava/activities?userId=${user.uid}&after=${afterTimestamp}&per_page=100`
      );

      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((activity: StravaActivity) => {
          const activityDate = new Date(activity.start_date);
          return activityDate >= weekStart && activityDate <= weekEnd;
        });
        setActivities(filtered);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Format duration for Strava activities (no rounding, keep exact values)
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')} h`;
  };

  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0) / 1000;
  const totalTime = activities.reduce((sum, a) => sum + a.moving_time, 0);
  const totalElevation = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
    >
      <div className="w-full">
        <div className={spacing.contentBlock}>
          <div className={`${layout.flexRowBetween} ${spacing.contentBlock}`}>
            <h1 className={`${typography.h1} font-bold text-gray-900`}>Activities</h1>
            <button
              onClick={goToCurrentWeek}
              className={`${components.button.primary} ${typography.body} font-medium`}
            >
              Diese Woche
            </button>
          </div>

          <div className={`${layout.flexRowBetween} ${components.card.base}`}>
            <button
              onClick={goToPreviousWeek}
              className={components.button.small}
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h2 className={`${typography.h3} font-semibold ${colors.text.primary}`}>
                {format(weekStart, 'd. MMM', { locale: de })} - {format(weekEnd, 'd. MMM yyyy', { locale: de })}
              </h2>
              <p className={`${typography.body} ${colors.text.secondary}`}>KW {format(weekStart, 'I')}</p>
            </div>

            <button
              onClick={goToNextWeek}
              className={components.button.small}
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className={`${components.grid.cols3} ${spacing.cardGap} ${spacing.tight}`}>
            <div className={components.card.base}>
              <p className={`${typography.body} ${colors.text.secondary}`}>Distanz</p>
              <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{totalDistance.toFixed(1)} km</p>
            </div>
            <div className={components.card.base}>
              <p className={`${typography.body} ${colors.text.secondary}`}>Zeit</p>
              <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{formatDuration(totalTime)}</p>
            </div>
            <div className={components.card.base}>
              <p className={`${typography.body} ${colors.text.secondary}`}>Höhenmeter</p>
              <p className={`${typography.h2} font-bold ${colors.text.primary}`}>{totalElevation.toFixed(1)} m</p>
            </div>
          </div>
        </div>

        <div className={components.card.base}>
          <div className={`${components.card.base} ${colors.border.default} border-b`}>
            <h3 className={`${typography.h3} font-semibold ${colors.text.primary}`}>
              {loading ? 'Lade Activities...' : `${activities.length} Activities`}
            </h3>
          </div>

          {loading ? (
            <div className={`text-center ${spacing.card}`} style={{padding: '3rem'}}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className={`text-center ${colors.text.secondary} ${spacing.card}`} style={{padding: '3rem'}}>
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className={spacing.tight}>Keine Activities in dieser Woche</p>
            </div>
          ) : (
            <div className={`divide-y ${colors.border.default}`}>
              {activities.map((activity) => (
                <div key={activity.id} className={`${spacing.card} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`flex items-center ${spacing.cardGap} ${spacing.micro}`}>
                        <h4 className={`${typography.h3} font-medium ${colors.text.primary}`}>{activity.name}</h4>
                        <span className={`px-2 py-1 ${typography.bodySmall} bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded`}>
                          {activity.sport_type || activity.type}
                        </span>
                      </div>

                      <p className={`${typography.body} ${colors.text.secondary} ${spacing.micro}`}>
                        {format(parseISO(activity.start_date), 'EEEE, d. MMMM yyyy  HH:mm', { locale: de })} Uhr
                      </p>

                      <div className={`grid grid-cols-2 md:grid-cols-4 ${spacing.cardGap}`}>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Distanz</p>
                            <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{(activity.distance / 1000).toFixed(1)} km</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Zeit</p>
                            <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{formatDuration(activity.moving_time)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <div>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Höhenmeter</p>
                            <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{activity.total_elevation_gain.toFixed(1)} m</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Ø Tempo</p>
                            <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{(activity.average_speed * 3.6).toFixed(1)} km/h</p>
                          </div>
                        </div>

                        {activity.average_watts && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-400 dark:text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Leistung</p>
                              <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{activity.average_watts.toFixed(1)} W</p>
                            </div>
                          </div>
                        )}

                        {activity.average_heartrate && (
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-coral-400 dark:text-coral-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Puls</p>
                              <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">{activity.average_heartrate.toFixed(1)} bpm</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
