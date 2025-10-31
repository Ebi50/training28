'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { MorningCheck } from '@/types';
import { calculateReadinessScore, interpretReadiness } from '@/lib/readinessCalculator';
import DashboardLayout from '@/components/DashboardLayout';

const EMOJI_SCALES = {
  sleepQuality: ['😴', '😐', '😊', '😃', '🤩'],
  fatigue: ['🔋', '⚡', '😐', '😴', '🪫'],
  motivation: ['😫', '😐', '😊', '🔥', '💪'],
  soreness: ['✅', '😐', '😕', '⚠️', '🔴'],
  stress: ['😌', '😊', '😐', '😓', '🤯'],
};

const LABELS = {
  sleepQuality: {
    title: '☀️ Wie hast du geschlafen?',
    options: ['Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Ausgezeichnet'],
  },
  fatigue: {
    title: '⚡ Wie müde fühlst du dich?',
    options: ['Sehr frisch', 'Frisch', 'OK', 'Müde', 'Erschöpft'],
  },
  motivation: {
    title: '💪 Wie motiviert bist du?',
    options: ['Keine Lust', 'Wenig', 'OK', 'Motiviert', 'Top motiviert'],
  },
  soreness: {
    title: '🦵 Wie ist dein Muskelkater?',
    options: ['Kein Muskelkater', 'Leicht', 'Mittel', 'Stark', 'Sehr stark'],
  },
  stress: {
    title: '🧠 Wie gestresst bist du?',
    options: ['Sehr entspannt', 'Entspannt', 'OK', 'Gestresst', 'Sehr gestresst'],
  },
};

export default function MorningCheckPage() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    console.log('🔐 Morning Check: Auth state changed');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('👤 Current user:', user ? user.uid : 'NOT LOGGED IN');
      setUser(user);
      if (!user) {
        console.log('❌ No user, redirecting to login');
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const [responses, setResponses] = useState({
    sleepQuality: 0,
    fatigue: 0,
    motivation: 0,
    soreness: 0,
    stress: 0,
  });
  
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleSelect = (category: keyof typeof responses, value: number) => {
    console.log('🎯 Question answered:', category, '=', value);
    setResponses(prev => {
      const newResponses = { ...prev, [category]: value };
      console.log('📊 Current responses:', newResponses);
      return newResponses;
    });
  };

  const allAnswered = Object.values(responses).every(v => v > 0);
  
  useEffect(() => {
    console.log('🔄 Responses changed:', responses, 'All answered:', allAnswered);
  }, [responses, allAnswered]);

  const calculatePreview = () => {
    if (!allAnswered) return null;
    
    const mockCheck: MorningCheck = {
      date: new Date().toISOString().split('T')[0],
      ...responses,
      submittedAt: new Date(),
    };
    
    const readiness = calculateReadinessScore(mockCheck);
    const interpretation = interpretReadiness(readiness);
    
    return { readiness, interpretation };
  };

  const handleSubmit = async () => {
    if (!user || !allAnswered) {
      console.error('🚫 Cannot submit:', { user: !!user, allAnswered });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🧠 Submitting Morning Check:', {
        userId: user.uid,
        date: today,
        responses,
      });
      
      // Check if Firebase is initialized
      if (!db) {
        console.error('❌ Firestore DB is not initialized!');
        setError('Firebase ist nicht initialisiert.');
        setLoading(false);
        return;
      }
      console.log('✅ Firestore DB is initialized:', db.app.name);
      
      const check: MorningCheck = {
        date: today,
        ...responses,
        notes: notes || undefined,
        submittedAt: new Date(),
      };
      
      // Calculate readiness score
      const readinessScore = calculateReadinessScore(check);
      check.readinessScore = readinessScore;
      
      console.log('🧠 Readiness Score:', {
        score: (readinessScore * 100).toFixed(0) + '%',
        raw: readinessScore,
      });
      
      // Save to Firestore
      const metricsRef = doc(db, `users/${user.uid}/dailyMetrics/${today}`);
      const docPath = `users/${user.uid}/dailyMetrics/${today}`;
      
      console.log('💾 Saving to Firestore:', {
        path: docPath,
        data: {
          date: today,
          morningCheck: check,
        }
      });
      
      console.log('⏳ Calling setDoc...');
      
      const result = await setDoc(metricsRef, {
        date: today,
        morningCheck: check,
        updatedAt: new Date().toISOString(),
        savedAt: Date.now(),
      }, { merge: true });
      
      console.log('✅ setDoc completed, result:', result);
      console.log('✅ Morning Check saved successfully to Firestore!');
      
      // Trigger plan adaptation
      console.log('🎯 Triggering plan adaptation...');
      try {
        const adaptResponse = await fetch('/api/adapt-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, date: today }),
        });
        
        if (adaptResponse.ok) {
          const adaptResult = await adaptResponse.json();
          console.log('✅ Plan adaptation result:', adaptResult);
        } else {
          console.warn('⚠️ Plan adaptation failed:', await adaptResponse.text());
        }
      } catch (adaptError) {
        console.error('❌ Error adapting plan:', adaptError);
        // Continue anyway - don't block user flow
      }
      
      // Redirect to dashboard
      console.log('🔄 Redirecting to dashboard...');
      router.push('/dashboard?morning_check=complete');
      
    } catch (err: any) {
      console.error('❌ ERROR saving morning check:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error:', JSON.stringify(err, null, 2));
      setError(`Fehler beim Speichern: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  const preview = calculatePreview();
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <DashboardLayout
      userEmail={user?.email || undefined}
      onSignOut={handleSignOut}
      onHelp={() => {}}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ☀️ Guten Morgen!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Wie fühlst du dich heute? (dauert nur 30 Sekunden)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-8 mb-8">
          {(Object.keys(responses) as Array<keyof typeof responses>).map((category) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {LABELS[category].title}
              </h2>
              
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleSelect(category, value)}
                    className={`flex-1 py-4 px-2 rounded-lg transition-all ${
                      responses[category] === value
                        ? 'bg-primary text-white scale-110 shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{EMOJI_SCALES[category][value - 1]}</div>
                    <div className="text-xs font-medium">
                      {LABELS[category].options[value - 1]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optional Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📝 Notizen (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. 'Leichte Erkältung' oder 'Wichtiger Termin heute'"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Preview Readiness Score */}
        {allAnswered && preview && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Deine Bereitschaft heute
              </h3>
              <div className="text-4xl font-bold" style={{
                color: preview.readiness >= 0.7 ? '#10b981' : preview.readiness >= 0.5 ? '#f59e0b' : '#ef4444'
              }}>
                {(preview.readiness * 100).toFixed(0)}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {preview.interpretation.level === 'excellent' ? '🤩' : 
                   preview.interpretation.level === 'good' ? '😊' :
                   preview.interpretation.level === 'moderate' ? '😐' : '😴'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {preview.interpretation.level === 'excellent' ? 'Exzellent' :
                   preview.interpretation.level === 'good' ? 'Gut' :
                   preview.interpretation.level === 'moderate' ? 'Moderat' : 'Niedrig'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {preview.interpretation.recommendation}
              </p>
              
              {preview.interpretation.adjustmentFactor < 1.0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Training wird um {Math.round((1 - preview.interpretation.adjustmentFactor) * 100)}% reduziert
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          
          <button
            onClick={() => {
              console.log('🔘 BUTTON CLICKED!', { allAnswered, loading, user: !!user, responses });
              if (!allAnswered) {
                console.error('❌ Not all questions answered!', responses);
                return;
              }
              if (loading) {
                console.error('❌ Already loading...');
                return;
              }
              if (!user) {
                console.error('❌ No user logged in!');
                return;
              }
              console.log('✅ All checks passed, calling handleSubmit...');
              handleSubmit();
            }}
            disabled={!allAnswered || loading}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
              allAnswered && !loading
                ? 'bg-primary hover:bg-primary-dark text-white shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Speichern...' : 'Speichern & Weiter'}
          </button>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          💡 Dein Trainingsplan wird basierend auf deiner Bereitschaft angepasst
        </p>
      </div>
    </DashboardLayout>
  );
}
