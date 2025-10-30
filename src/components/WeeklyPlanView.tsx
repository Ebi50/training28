'use client';

import { format, startOfWeek, addDays } from 'date-fns';
import type { WeeklyPlan, TrainingSession } from '@/types';

interface WeeklyPlanViewProps {
  plan: WeeklyPlan | null;
  loading?: boolean;
}

const ZONE_COLORS = {
  Z1: 'bg-gray-200 text-gray-800',
  Z2: 'bg-blue-200 text-blue-800',
  Z3: 'bg-green-200 text-green-800',
  Z4: 'bg-yellow-200 text-yellow-800',
  Z5: 'bg-orange-200 text-orange-800',
  Z6: 'bg-red-200 text-red-800',
  Z7: 'bg-purple-200 text-purple-800',
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  endurance: 'Endurance',
  tempo: 'Tempo',
  threshold: 'Threshold',
  vo2max: 'VO2 Max',
  neuromuscular: 'Neuromuscular',
  recovery: 'Recovery',
};

export default function WeeklyPlanView({ plan, loading }: WeeklyPlanViewProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2">No training plan available</p>
      </div>
    );
  }

  const weekStart = new Date(plan.weekStartDate);
  const days = [...Array(7)].map((_, i) => addDays(weekStart, i));

  const getSessionsForDay = (dayIndex: number): TrainingSession[] => {
    return plan.sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getDay() === (dayIndex + 1) % 7;
    });
  };

  const totalHours = plan.totalHours;
  const totalTSS = plan.totalTss;
  const hitSessions = plan.hitSessions;
  const litPercentage = (plan.litRatio * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Week Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Week {format(weekStart, 'w, yyyy')}
          </h3>
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Total Volume</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{totalHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Total TSS</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{totalTSS}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sessions</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{plan.sessions.length}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">LIT/HIT</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{litPercentage}% / {(100 - parseFloat(litPercentage)).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Daily Sessions */}
      <div className="space-y-3">
        {days.map((day, dayIndex) => {
          const sessions = getSessionsForDay(dayIndex);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={dayIndex}
              className={`border rounded-lg p-4 ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-border-light dark:border-border-dark bg-surface-warm dark:bg-surface-warm-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-text-secondary-light dark:text-text-secondary-dark'
                  }`}>
                    <span className="font-semibold">{format(day, 'EEE')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{format(day, 'EEEE')}</p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{format(day, 'MMM d')}</p>
                  </div>
                </div>
                {sessions.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      {(sessions.reduce((sum, s) => sum + s.duration, 0) / 60).toFixed(1)}h
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {sessions.reduce((sum, s) => sum + s.targetTss, 0)} TSS
                    </p>
                  </div>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Rest day
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session, sessionIndex) => (
                    <SessionCard key={sessionIndex} session={session} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: TrainingSession }) {
  const typeLabel = session.subType ? SESSION_TYPE_LABELS[session.subType] : session.type;

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              session.type === 'HIT' ? 'bg-red-200 text-red-800' : 
              session.type === 'LIT' ? 'bg-blue-200 text-blue-800' :
              session.type === 'REC' ? 'bg-green-200 text-green-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {session.type}
            </span>
            <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              {typeLabel}
            </span>
            {session.indoor && (
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">🏠 Indoor</span>
            )}
          </div>
          
          {session.description && (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">{session.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            <span>⏱️ {(session.duration / 60).toFixed(1)}h</span>
            <span>📊 {session.targetTss} TSS</span>
            {session.actualTss && (
              <span>✓ {session.actualTss} TSS actual</span>
            )}
          </div>
        </div>

        {session.completed && (
          <div className="ml-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 dark:bg-success-900/30 text-green-800">
              ✓ Completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

