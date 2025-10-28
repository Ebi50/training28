export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Adaptive Training System
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Smart, data-driven training plans that adapt to your fitness, schedule, and goals
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Data-Driven</h3>
              <p className="text-gray-600">
                Syncs with Strava and wearables to track your progress
              </p>
            </div>
            
            <div className="card">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Goal-Oriented</h3>
              <p className="text-gray-600">
                Plans adapt to your season goals and training camps
              </p>
            </div>
            
            <div className="card">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Respects your available time slots and preferences
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <a href="/auth/signin" className="btn btn-primary text-lg px-8 py-3">
              Get Started
            </a>
            <a href="/dashboard" className="btn btn-secondary text-lg px-8 py-3">
              View Demo
            </a>
          </div>
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Connect Your Accounts</h4>
                <p className="text-gray-600">
                  Link Strava and your wearable devices to automatically track activities and recovery metrics
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Set Your Goals</h4>
                <p className="text-gray-600">
                  Define season goals, training camps, and available time slots
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Get Your Plan</h4>
                <p className="text-gray-600">
                  Receive weekly training plans that adapt in real-time based on your performance and recovery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}