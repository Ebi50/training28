export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Adaptive Training</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-lg text-gray-700 mb-4">
            Adaptive Training System helps cyclists achieve their goals through personalized, 
            data-driven training plans.
          </p>
          <p className="text-gray-700 mb-4">
            Using advanced algorithms and your Strava data, we create training plans that adapt 
            to your current fitness level, available time, and goals.
          </p>
          <p className="text-gray-700">
            Built with Next.js, Firebase, and the Strava API.
          </p>
        </div>
      </div>
    </div>
  );
}
