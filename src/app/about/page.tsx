export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8">About Adaptive Training</h1>
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
  );
}
