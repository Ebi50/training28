'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firestore';
import { SlotEditor } from '@/components/SlotEditor';
import { TimeSlot, SeasonGoal } from '@/types/user';

type SetupStep = 'ftp' | 'slots' | 'goals' | 'complete';

const steps = [
  { id: 'ftp' as const, title: 'FTP & Threshold', description: 'Enter your Functional Threshold Power and Heart Rate' },
  { id: 'slots' as const, title: 'Training Availability', description: 'Define when you can train' },
  { id: 'goals' as const, title: 'Season Goals', description: 'Set your main goals' },
  { id: 'complete' as const, title: 'Ready!', description: 'Profile setup complete' },
];

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<SetupStep>('ftp');
  const [isLoading, setIsLoading] = useState(false);
  const [ftp, setFtp] = useState<number>(0);
  const [fthr, setFthr] = useState<number>(0);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [goals, setGoals] = useState<SeasonGoal[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === 'ftp') {
      if (ftp < 50 || ftp > 600 || fthr < 100 || fthr > 220) {
        alert('Please enter valid values');
        return;
      }
      setCurrentStep('slots');
    } else if (currentStep === 'slots') {
      if (slots.length === 0) {
        alert('Please add at least one training slot');
        return;
      }
      setCurrentStep('goals');
    } else if (currentStep === 'goals') {
      if (!user) {
        alert('You must be logged in to save your profile');
        return;
      }
      
      setIsLoading(true);
      try {
        // Save profile to Firestore
        await updateUserProfile(user.uid, {
          ftp,
          lthr: fthr,
          preferences: {
            indoorAllowed: true,
            availableDevices: [],
            preferredTrainingTimes: slots,
          },
        });
        
        console.log('Profile saved successfully');
        setCurrentStep('complete');
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Failed to save profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep === 'slots') setCurrentStep('ftp');
    else if (currentStep === 'goals') setCurrentStep('slots');
  };

  const canProceed = () => {
    if (currentStep === 'ftp') return ftp >= 50 && ftp <= 600 && fthr >= 100 && fthr <= 220;
    if (currentStep === 'slots') return slots.length > 0;
    return true;
  };

  // Show loading state while checking authentication
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark">
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-700 z-50">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="border-b border-border-light dark:border-border-dark bg-bg-secondary-light dark:bg-bg-secondary-dark">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-xl font-semibold mb-2">Welcome to Cyclona</h1>
          <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
            Setup your training profile
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-16 flex justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex-1 text-center" style={{ opacity: i <= currentStepIndex ? 1 : 0.4 }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold ${
                i <= currentStepIndex ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>{i + 1}</div>
              <div className="text-sm">{step.title}</div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-lg font-semibold mb-2">{steps[currentStepIndex].title}</h2>
          <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-8">
            {steps[currentStepIndex].description}
          </p>

          {currentStep === 'ftp' && (
            <div className="space-y-8">
              <div>
                <label className="block font-semibold mb-2">FTP (Watts)</label>
                <input
                  type="number"
                  value={ftp || ''}
                  onChange={(e) => setFtp(Number(e.target.value))}
                  placeholder="250"
                  className="w-full p-4 border border-border-light dark:border-border-dark rounded-lg bg-bg-primary-light dark:bg-bg-primary-dark"
                />
                <p className="text-sm text-gray-500 mt-2">Typically 50-600W</p>
              </div>
              <div>
                <label className="block font-semibold mb-2">FTHR (bpm)</label>
                <input
                  type="number"
                  value={fthr || ''}
                  onChange={(e) => setFthr(Number(e.target.value))}
                  placeholder="165"
                  className="w-full p-4 border border-border-light dark:border-border-dark rounded-lg bg-bg-primary-light dark:bg-bg-primary-dark"
                />
                <p className="text-sm text-gray-500 mt-2">Typically 100-220 bpm</p>
              </div>
            </div>
          )}

          {currentStep === 'slots' && <SlotEditor slots={slots} onChange={setSlots} />}

          {currentStep === 'goals' && (
            <div>
              <p className="mb-8 text-text-secondary-light dark:text-text-secondary-dark">
                Season goals will be implemented in Sprint 2.3
              </p>
              <button
                onClick={() => {
                  const g: SeasonGoal = {
                    id: `goal-${Date.now()}`,
                    title: 'Example Race',
                    date: new Date(Date.now() + 90 * 86400000),
                    priority: 'A',
                    discipline: 'road',
                    taperStrategy: {
                      daysBeforeEvent: 14,
                      volumeReduction: 40,
                      intensityMaintenance: true,
                    },
                  };
                  setGoals([...goals, g]);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Add Example Goal
              </button>
              {goals.length > 0 && (
                <div className="mt-6 space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                      <p className="font-semibold">{goal.title}</p>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {goal.date.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-8 text-white text-3xl">
                ✓
              </div>
              <p className="text-base">Profile created! Ready to train.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-6">
          {currentStep !== 'ftp' && currentStep !== 'complete' && (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 ml-auto"
          >
            {isLoading ? 'Saving...' : currentStep === 'complete' ? 'Go to Dashboard' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
