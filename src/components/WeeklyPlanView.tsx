'use client';

import { format, startOfWeek, addDays } from 'date-fns';
import { useState } from 'react';
import type { WeeklyPlan, TrainingSession } from '@/types';
import SessionNotes from '@/components/SessionNotes';
import { updateTrainingSession } from '@/lib/firestore';
import { auth } from '@/lib/firebase';

interface WeeklyPlanViewProps {
  plan: WeeklyPlan | null;
  loading?: boolean;
  onSessionUpdate?: () => void; // Callback when session is updated
}

// Helper function to format hours to "h:mm h" (rounded to 5min)
const formatHoursToTime = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const roundedMinutes = Math.round(totalMinutes / 5) * 5; // Round to nearest 5 minutes
  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')} h`;
};

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

export default function WeeklyPlanView({ plan, loading, onSessionUpdate }: WeeklyPlanViewProps) {
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
          <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Week {format(weekStart, 'w, yyyy')}
          </h3>
          <span className="text-base text-text-secondary-light dark:text-text-secondary-dark">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">Total Volume</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{formatHoursToTime(totalHours)}</p>
          </div>
          <div>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">Total TSS</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{totalTSS.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">Sessions</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{plan.sessions.length}</p>
          </div>
          <div>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">LIT/HIT</p>
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
                isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-border-light dark:border-border-dark bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark'
                  }`}>
                    <span className="font-semibold">{format(day, 'EEE')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-base text-text-primary-light dark:text-text-primary-dark">{format(day, 'EEEE')}</p>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">{format(day, 'MMM d')}</p>
                  </div>
                </div>
                {sessions.length > 0 && (
                  <div className="text-right">
                    <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                      {formatHoursToTime(sessions.reduce((sum, s) => sum + s.duration, 0) / 60)}
                    </p>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                      {sessions.reduce((sum, s) => sum + s.targetTss, 0).toFixed(1)} TSS
                    </p>
                  </div>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-base">
                  Rest day
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session, sessionIndex) => (
                    <SessionCard key={sessionIndex} session={session} planId={plan.id} onUpdate={onSessionUpdate} />
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

function SessionCard({ session, planId, onUpdate }: { 
  session: TrainingSession; 
  planId: string;
  onUpdate?: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const typeLabel = session.subType ? SESSION_TYPE_LABELS[session.subType] : session.type;

  const handleSaveNotes = async (updates: { notes?: string; rpe?: number }) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Du musst eingeloggt sein.');
      return;
    }

    await updateTrainingSession(user.uid, planId, session.id, updates);
    
    // Trigger refresh
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleExportZWO = async (platform: 'zwift' | 'mywoosh') => {
    setExporting(true);
    try {
      // Get user's FTP from localStorage or default
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const ftp = userProfile.ftp || 200;

      const response = await fetch('/api/training/export-zwo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, ftp, platform })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'workout.zwo';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportDialog(true);
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Export. Bitte versuche es erneut.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              session.type === 'HIT' ? 'bg-coral-100 dark:bg-coral-900 text-coral-800 dark:text-coral-200' : 
              session.type === 'LIT' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
              session.type === 'REC' ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200' :
              'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {session.type}
            </span>
            <span className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
              {typeLabel}
            </span>
            {session.indoor && (
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">🏠 Indoor</span>
            )}
          </div>
          
          {session.description && (
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-2">
              {session.description
                // First handle "Xh Ym" patterns (e.g., "1h 48m" -> "1:48h")
                .replace(/(\d+\.?\d*)h\s*(\d+)m/g, (match, h, m) => {
                  const totalHours = parseFloat(h) + parseFloat(m) / 60;
                  return formatHoursToTime(totalHours);
                })
                // Then handle standalone "Xh" patterns
                .replace(/(\d+\.?\d*)h/g, (match) => {
                  const hours = parseFloat(match.replace('h', ''));
                  return formatHoursToTime(hours);
                })
                // Handle standalone minutes (e.g., "101.25min" -> "105min")
                .replace(/(\d+\.?\d*)min/g, (match) => {
                  const mins = parseFloat(match.replace('min', ''));
                  const rounded = Math.round(mins / 5) * 5;
                  return `${rounded}min`;
                })
                // TSS formatting
                .replace(/TSS:\s*[\d.]+/g, (match) => {
                  const tssValue = parseFloat(match.replace('TSS:', '').trim());
                  return `TSS: ${tssValue.toFixed(1)}`;
                })}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-base text-text-secondary-light dark:text-text-secondary-dark">
            <span>⏱️ {formatHoursToTime(session.duration / 60)}</span>
            <span>📊 {session.targetTss.toFixed(1)} TSS</span>
            {session.actualTss && (
              <span>✓ {session.actualTss.toFixed(1)} TSS actual</span>
            )}
          </div>

          {/* Export Buttons */}
          {(session.type === 'HIT' || session.type === 'LIT' || session.type === 'REC') && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => handleExportZWO('zwift')}
                disabled={exporting}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? '...' : '📥 Zwift'}
              </button>
              <button
                onClick={() => handleExportZWO('mywoosh')}
                disabled={exporting}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? '...' : '📥 MyWhoosh'}
              </button>
            </div>
          )}

          {/* Session Notes & RPE */}
          <SessionNotes session={session} onSave={handleSaveNotes} />
        </div>

        {session.completed && (
          <div className="ml-4">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
              ✓ Completed
            </span>
          </div>
        )}
      </div>

      {/* Export Instructions Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowExportDialog(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Workout erfolgreich exportiert! 🎉
            </h3>
            
            <div className="space-y-4 text-base text-gray-700 dark:text-gray-300">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💻 Zwift (Desktop):</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Öffne <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">Dokumente/Zwift/Workouts/&lt;deine-Zwift-ID&gt;/</code></li>
                  <li>Kopiere die heruntergeladene .ZWO-Datei in diesen Ordner</li>
                  <li>Starte Zwift → Workouts → Custom Workouts</li>
                  <li>Wähle dein Workout aus und starte! 🚴</li>
                </ol>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">📱 Zwift (iOS/iPad):</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Verbinde dein Gerät mit deinem Mac/PC</li>
                  <li>Öffne Finder → Dein Gerät → Dateien → Zwift → Workouts</li>
                  <li>Kopiere die .ZWO-Datei hierhin</li>
                  <li>Sync abwarten, dann in Zwift unter Custom Workouts finden</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">🌐 MyWhoosh:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Öffne <a href="https://app.mywoosh.com/workout-builder" target="_blank" className="text-blue-600 hover:underline">MyWhoosh Workout Builder</a></li>
                  <li>Klicke auf "Import" und wähle deine .ZWO-Datei</li>
                  <li>Workout erscheint in deinem Custom-Ordner</li>
                  <li>Öffne MyWhoosh App und starte das Workout! 🚴</li>
                </ol>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Tipp:</strong> Die Workout-Intensitäten basieren auf deinem FTP. 
                  Stelle sicher, dass dein FTP in den Settings aktuell ist!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowExportDialog(false)}
              className="mt-6 w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

