export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">How It Works</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Connect Strava</h2>
            <p className="text-gray-700">
              Link your Strava account to automatically import your cycling activities. 
              We only read your data - never post or modify anything.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Configure Your Profile</h2>
            <p className="text-gray-700">
              Set your FTP (Functional Threshold Power), LTHR (Lactate Threshold Heart Rate), 
              and available training time.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Track Your Fitness</h2>
            <p className="text-gray-700">
              The system calculates your CTL (fitness), ATL (fatigue), and TSB (form) based on 
              Training Stress Score (TSS) from each activity.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Generate Training Plans</h2>
            <p className="text-gray-700">
              Click "Generate Plan" to create a personalized training plan adapted to your 
              current fitness and goals.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Review Activities</h2>
            <p className="text-gray-700">
              Browse your activities week by week, with detailed metrics including distance, 
              time, elevation, power, and heart rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
