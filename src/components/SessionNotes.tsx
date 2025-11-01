'use client';

import { useState } from 'react';
import type { TrainingSession } from '@/types';

interface SessionNotesProps {
  session: TrainingSession;
  onSave: (updates: { notes?: string; rpe?: number }) => Promise<void>;
}

/**
 * SessionNotes Component
 * 
 * Allows users to:
 * - Add/edit notes/comments for a training session
 * - Set RPE (Rate of Perceived Exertion) on a 1-10 scale
 * 
 * RPE Scale:
 * 1-2: Very Easy
 * 3-4: Easy
 * 5-6: Moderate
 * 7-8: Hard
 * 9-10: Very Hard / Maximum
 */
export default function SessionNotes({ session, onSave }: SessionNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(session.notes || '');
  const [rpe, setRpe] = useState<'easy' | 'moderate' | 'hard' | undefined>(
    session.rpe 
      ? session.rpe <= 3 ? 'easy' 
      : session.rpe <= 7 ? 'moderate' 
      : 'hard'
      : undefined
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const rpeValue = rpe === 'easy' ? 3 : rpe === 'moderate' ? 6 : rpe === 'hard' ? 9 : undefined;
      await onSave({ 
        notes: notes.trim() || undefined, 
        rpe: rpeValue
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(session.notes || '');
    const sessionRpe = session.rpe 
      ? session.rpe <= 3 ? 'easy' 
      : session.rpe <= 7 ? 'moderate' 
      : 'hard'
      : undefined;
    setRpe(sessionRpe);
    setIsEditing(false);
  };



  if (!isEditing) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {session.notes || session.rpe ? (
              <div className="space-y-2">
                {session.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      💬 Notizen:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {session.notes}
                    </p>
                  </div>
                )}
                {session.rpe && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      📊 Schwierigkeit:
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        session.rpe <= 3 ? 'text-green-600 dark:text-green-400'
                        : session.rpe <= 7 ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                      }`}>
                        {session.rpe <= 3 ? '😊 Leicht' : session.rpe <= 7 ? '😐 Mittel' : '😓 Schwer'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Keine Notizen oder RPE vorhanden
              </p>
            )}
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="ml-4 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            {session.notes || session.rpe ? '✏️ Bearbeiten' : '➕ Hinzufügen'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        {/* Notes Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            💬 Notizen zum Training
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Wie lief das Training? Besonderheiten? Gefühl?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none"
          />
        </div>

        {/* RPE Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📊 Wie fühlte sich das Training an?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRpe('easy')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                rpe === 'easy'
                  ? 'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-200'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500'
              }`}
            >
              😊 Leicht
            </button>
            <button
              type="button"
              onClick={() => setRpe('moderate')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                rpe === 'moderate'
                  ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500 text-yellow-700 dark:text-yellow-200'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-500'
              }`}
            >
              😐 Mittel
            </button>
            <button
              type="button"
              onClick={() => setRpe('hard')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                rpe === 'hard'
                  ? 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-200'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-500'
              }`}
            >
              😓 Schwer
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {rpe ? (
              <span>Ausgewählt: <strong className={
                rpe === 'easy' ? 'text-green-600 dark:text-green-400'
                : rpe === 'moderate' ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
              }>
                {rpe === 'easy' ? '😊 Leicht' : rpe === 'moderate' ? '😐 Mittel' : '😓 Schwer'}
              </strong></span>
            ) : (
              <span>Bitte wähle eine Schwierigkeit aus</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium 
                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichern...' : '💾 Speichern'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                     text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
