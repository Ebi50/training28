export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Features</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">🚴 Strava Integration</h2>
            <p className="text-gray-700">
              Automatically sync your rides from Strava for real-time fitness tracking.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">📊 Fitness Metrics</h2>
            <p className="text-gray-700">
              Track your CTL (Chronic Training Load), ATL (Acute Training Load), and TSB (Training Stress Balance).
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">🎯 Personalized Plans</h2>
            <p className="text-gray-700">
              Get training plans adapted to your current fitness level, available time, and goals.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">📅 Weekly Navigation</h2>
            <p className="text-gray-700">
              View your activities week by week with detailed metrics and summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
