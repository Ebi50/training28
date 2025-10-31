'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function InformationPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">Informationen</h1>
        
        {/* FEATURES */}
        <div id="features" className="mb-12 scroll-mt-8">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">Features</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 space-y-8">
            <div id="strava">
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">🚴 Strava Integration</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Automatically sync your rides from Strava for real-time fitness tracking. 
                We only read your data - never post or modify anything.
              </p>
            </div>
            <div id="metrics">
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">📊 Fitness Metrics</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Track your CTL (Chronic Training Load), ATL (Acute Training Load), and TSB (Training Stress Balance). 
                These metrics give you a complete picture of your fitness, fatigue, and form.
              </p>
            </div>
            <div id="plans">
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">🎯 Personalized Plans</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Get training plans adapted to your current fitness level, available time, and goals. 
                Plans automatically adjust to your progress and constraints.
              </p>
            </div>
            <div id="weekly-nav">
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">📅 Weekly Navigation</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                View your activities week by week with detailed metrics and summaries including distance, time, elevation, power, and heart rate.
              </p>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="how-it-works" className="mb-12 scroll-mt-8">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">Wie es funktioniert</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">1. Connect Strava</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Link your Strava account to automatically import your cycling activities. 
                We only read your data - never post or modify anything.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">2. Configure Your Profile</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Set your FTP (Functional Threshold Power), LTHR (Lactate Threshold Heart Rate), 
                and available training time.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">3. Track Your Fitness</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                The system calculates your CTL (fitness), ATL (fatigue), and TSB (form) based on 
                Training Stress Score (TSS) from each activity.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">4. Generate Training Plans</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Click "Generate Plan" to create a personalized training plan adapted to your 
                current fitness and goals.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">5. Review Activities</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                Browse your activities week by week, with detailed metrics including distance, 
                time, elevation, power, and heart rate.
              </p>
            </div>
          </div>
        </div>

        {/* SCIENCE */}
        <div id="science" className="mb-12 scroll-mt-8">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">Die Wissenschaft</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Training Stress Score (TSS)</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-3">
                TSS quantifies the training load of a single workout. It considers:
              </p>
              <ul className="list-disc list-inside text-base text-text-secondary-light dark:text-text-secondary-dark space-y-2">
                <li>Duration of the activity</li>
                <li>Intensity relative to threshold (power or heart rate)</li>
                <li>Workout difficulty</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Chronic Training Load (CTL)</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                CTL represents your fitness level. It's the 42-day exponentially weighted moving 
                average of your daily TSS. Higher CTL = better fitness.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Acute Training Load (ATL)</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                ATL represents your fatigue. It's the 7-day exponentially weighted moving average 
                of your daily TSS. Higher ATL = more fatigue.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Training Stress Balance (TSB)</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-3">
                TSB = CTL - ATL. This is your "form" or freshness:
              </p>
              <ul className="list-disc list-inside text-base text-text-secondary-light dark:text-text-secondary-dark space-y-2">
                <li><strong>TSB &gt; 25:</strong> Very Fresh - ideal for racing</li>
                <li><strong>TSB 5-25:</strong> Fresh - good form</li>
                <li><strong>TSB -10 to 5:</strong> Neutral - normal training</li>
                <li><strong>TSB -30 to -10:</strong> Tired - productive training zone</li>
                <li><strong>TSB &lt; -30:</strong> Very Tired - risk of overtraining</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Training Principles</h3>
              <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-3">
                Our plans follow evidence-based polarized training:
              </p>
              <ul className="list-disc list-inside text-base text-text-secondary-light dark:text-text-secondary-dark space-y-2">
                <li>80% low-intensity training (LIT) - below aerobic threshold</li>
                <li>20% high-intensity training (HIT) - at or above threshold</li>
                <li>Gradual CTL ramp rate (5-10 TSS/week)</li>
                <li>Recovery weeks every 3-4 weeks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ABOUT */}
        <div id="about" className="mb-12 scroll-mt-8">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">Über das Projekt</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Adaptive Training System helps cyclists achieve their goals through personalized, 
              data-driven training plans.
            </p>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Using advanced algorithms and your Strava data, we create training plans that adapt 
              to your current fitness level, available time, and goals.
            </p>
            <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
              Built with Next.js, Firebase, and the Strava API.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
