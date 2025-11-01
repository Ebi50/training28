/**
 * TodayWorkoutCard Component
 * 
 * Displays today's scheduled workout with quick actions
 */

'use client';

import { TrainingSession } from '@/types/plan';
import { spacing, typography, colors, components } from '@/styles/designSystem';
import { format } from 'date-fns';

interface TodayWorkoutCardProps {
  session: TrainingSession | null;
  onStartWorkout?: () => void;
  onViewDetails?: () => void;
  onDownloadZWO?: () => void;
}

export default function TodayWorkoutCard({
  session,
  onStartWorkout,
  onViewDetails,
  onDownloadZWO,
}: TodayWorkoutCardProps) {
  
  // No workout today
  if (!session) {
    return (
      <div className={`${components.card.base} ${spacing.contentBlock} bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <h2 className={`${typography.h2} ${colors.text.primary} mb-2`}>Rest Day</h2>
          <p className={`${typography.body} ${colors.text.secondary}`}>
            No workout scheduled for today. Enjoy your recovery! 😌
          </p>
        </div>
      </div>
    );
  }

  // Get session type styling
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'HIT':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30',
          border: 'border-red-300 dark:border-red-700',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: '🔥',
        };
      case 'LIT':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30',
          border: 'border-green-300 dark:border-green-700',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: '🚴',
        };
      case 'REC':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30',
          border: 'border-blue-300 dark:border-blue-700',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: '😌',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30',
          border: 'border-gray-300 dark:border-gray-700',
          badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: '💪',
        };
    }
  };

  const styles = getTypeStyles(session.type);

  return (
    <div className={`${components.card.base} ${spacing.contentBlock} ${styles.bg} border-2 ${styles.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{styles.icon}</span>
            <div>
              <h2 className={`${typography.h2} ${colors.text.primary}`}>Today's Workout</h2>
              <p className={`${typography.bodySmall} ${colors.text.secondary}`}>
                {format(new Date(session.date), 'EEEE, MMM d')}
              </p>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles.badge}`}>
          {session.type}
        </span>
      </div>

      {/* Workout Details */}
      <div className="mb-6">
        <h3 className={`${typography.h3} ${colors.text.primary} mb-2`}>
          {session.subType ? session.subType.charAt(0).toUpperCase() + session.subType.slice(1) : session.type} Training
        </h3>
        <p className={`${typography.body} ${colors.text.secondary} mb-4`}>
          {session.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`${components.card.base} ${colors.bg.card} p-3 text-center`}>
            <p className={`${typography.bodySmall} ${colors.text.secondary} mb-1`}>Duration</p>
            <p className={`${typography.h3} ${colors.text.primary} font-bold`}>
              {Math.floor(session.duration / 60)}:{String(session.duration % 60).padStart(2, '0')}
            </p>
            <p className={`${typography.bodySmall} ${colors.text.secondary}`}>hours</p>
          </div>
          
          <div className={`${components.card.base} ${colors.bg.card} p-3 text-center`}>
            <p className={`${typography.bodySmall} ${colors.text.secondary} mb-1`}>Target TSS</p>
            <p className={`${typography.h3} ${colors.text.primary} font-bold`}>
              {session.targetTss.toFixed(0)}
            </p>
            <p className={`${typography.bodySmall} ${colors.text.secondary}`}>stress score</p>
          </div>
          
          <div className={`${components.card.base} ${colors.bg.card} p-3 text-center`}>
            <p className={`${typography.bodySmall} ${colors.text.secondary} mb-1`}>Environment</p>
            <p className={`${typography.h3} ${colors.text.primary} font-bold`}>
              {session.indoor ? '🏠' : '🌤️'}
            </p>
            <p className={`${typography.bodySmall} ${colors.text.secondary}`}>
              {session.indoor ? 'Indoor' : 'Outdoor'}
            </p>
          </div>
        </div>

        {/* Time Slot */}
        {session.timeSlot && (
          <div className={`mt-4 ${components.card.base} ${colors.bg.secondary} p-3`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`${typography.body} ${colors.text.primary} font-medium`}>
                Scheduled: {session.timeSlot.startTime} - {session.timeSlot.endTime}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onStartWorkout}
          className={`${components.button.primary} flex items-center justify-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start
        </button>
        
        <button
          onClick={onViewDetails}
          className={`${components.button.secondary} flex items-center justify-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Details
        </button>
        
        <button
          onClick={onDownloadZWO}
          className={`${components.button.secondary} flex items-center justify-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ZWO
        </button>
      </div>

      {/* Completion Status */}
      {session.completed && (
        <div className={`mt-4 ${components.card.base} bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className={`${typography.body} text-green-700 dark:text-green-300 font-medium`}>
              ✓ Completed
            </span>
            {session.actualTss && (
              <span className={`${typography.bodySmall} text-green-600 dark:text-green-400`}>
                ({session.actualTss.toFixed(0)} TSS actual)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
