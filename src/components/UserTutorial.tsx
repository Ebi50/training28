'use client';

import { useState } from 'react';

interface TutorialStep {
  title: string;
  content: string;
  image?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '👋 Welcome to Adaptive Training!',
    content: `Your intelligent cycling training companion is ready to help you reach your goals.

This system analyzes your fitness data, generates personalized plans, and adapts to your schedule.

Let's get you started in just a few steps!`,
  },
  {
    title: '👤 Step 1: Set Up Your Profile',
    content: `First, we need to know a bit about you:

• **Date of Birth**: Used for age-based training zones
• **Weight (kg)**: For power-to-weight calculations
• **FTP (watts)**: Your 1-hour max power
  → Don't know? Use 75% of 20-min max
• **LTHR (bpm)**: Threshold heart rate (~85-90% of max)
• **Max HR (bpm)**: Your maximum heart rate

💡 Tip: These values help calculate accurate training zones!`,
  },
  {
    title: '⏰ Step 2: Add Training Time Slots',
    content: `Tell us when you're available to train:

1. Click "Add Zeitslot" button
2. Select day, time, and location type
3. Add all your available times
4. Click "Save Time Slots"

**Example Schedule:**
• Monday: 08:00-09:00 (Indoor & Outdoor)
• Wednesday: 18:00-19:30 (Indoor & Outdoor)
• Saturday: 09:00-12:00 (Outdoor)

💡 Tip: More time slots = Better plan flexibility!`,
  },
  {
    title: '🔗 Step 3: Connect Strava (Optional)',
    content: `Link your Strava account for automatic sync:

**Why Connect?**
✅ Auto-import all your rides
✅ Real-time fitness tracking
✅ Historical training data
✅ More accurate AI predictions
✅ No manual entry needed!

**How to Connect (Super Easy!):**
1. Click the orange "Connect Strava" button
2. You'll be taken to Strava.com
3. Log in to your Strava account
4. Click "Authorize" to allow access
5. You'll be redirected back - Done! ✓

**What Access Do We Get?**
• Read your activities (rides, runs, etc.)
• Read your profile info (name, photo)
• That's it! We NEVER post or modify anything

**Is It Safe?**
Yes! This is the official Strava OAuth system.
You can revoke access anytime in your Strava settings.

💡 Tip: Highly recommended for best experience!`,
  },
  {
    title: '📊 Understanding Your Metrics',
    content: `Key metrics on your dashboard:

**TSB (Training Stress Balance)**
→ Your readiness to perform
→ Positive = Fresh, Negative = Fatigued

**CTL (Chronic Training Load)**
→ Your long-term fitness
→ Higher = Better base

**ATL (Acute Training Load)**
→ Recent fatigue
→ Should be close to CTL

💡 Tip: Don't worry too much about numbers at first - the system handles it!`,
  },
  {
    title: '🚴 Your First Training Plan',
    content: `After setup, the system will:

1. **Analyze** your current fitness
2. **Generate** a personalized weekly plan
3. **Optimize** workouts for your schedule
4. **Adapt** based on completed activities

**Plan Types:**
• **LIT**: Easy, endurance-building rides
• **HIT**: High-intensity intervals
• **Recovery**: Active recovery

💡 Tip: Plans update automatically each week!`,
  },
  {
    title: '🎯 Advanced Features',
    content: `Once you're comfortable, explore:

**Training Camps**
→ Plan multi-day training blocks
→ Auto recovery after camp

**Season Goals**
→ Set race/event dates
→ Auto periodization & taper

**Manual Adjustments**
→ Reschedule workouts
→ Adjust intensity
→ Skip if needed

💡 Tip: Start simple, add complexity later!`,
  },
  {
    title: '✅ Ready to Start!',
    content: `You're all set to begin your training journey!

**Next Steps:**
1. Complete your profile in Settings
2. Add your training time slots
3. (Optional) Connect Strava
4. Return to Dashboard to view your plan

**Need Help?**
• Click the ? icon for quick tips
• Check User Guide for detailed info
• Email support for questions

Let's get started! 🚀`,
  },
];

interface UserTutorialProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function UserTutorial({ onClose, onComplete }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Getting Started</h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-text-secondary-light dark:text-text-secondary-dark"
              aria-label="Close tutorial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
              <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary dark:bg-primary-dark h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            {step.title}
          </h3>
          <div className="text-lg text-text-primary-light dark:text-text-primary-dark whitespace-pre-line leading-relaxed">
            {step.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            {/* Left: Previous/Skip */}
            <button
              onClick={currentStep === 0 ? handleSkip : handlePrevious}
              className="px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark font-medium"
            >
              {currentStep === 0 ? 'Skip Tutorial' : '← Previous'}
            </button>

            {/* Center: Dots */}
            <div className="flex space-x-2">
              {TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-primary dark:bg-primary-dark w-8'
                      : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Right: Next/Finish */}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary dark:bg-primary-dark text-text-onDark rounded-md hover:bg-primary-600 dark:hover:bg-secondary-dark font-medium transition-colors"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? "Let's Go! 🚀" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

