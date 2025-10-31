export default function SciencePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">The Science</h1>
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Training Stress Score (TSS)</h2>
            <p className="text-gray-700 mb-3">
              TSS quantifies the training load of a single workout. It considers:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Duration of the activity</li>
              <li>Intensity relative to threshold (power or heart rate)</li>
              <li>Workout difficulty</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Chronic Training Load (CTL)</h2>
            <p className="text-gray-700">
              CTL represents your fitness level. It's the 42-day exponentially weighted moving 
              average of your daily TSS. Higher CTL = better fitness.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Acute Training Load (ATL)</h2>
            <p className="text-gray-700">
              ATL represents your fatigue. It's the 7-day exponentially weighted moving average 
              of your daily TSS. Higher ATL = more fatigue.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Training Stress Balance (TSB)</h2>
            <p className="text-gray-700 mb-3">
              TSB = CTL - ATL. This is your "form" or freshness:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>TSB &gt; 25:</strong> Very Fresh - ideal for racing</li>
              <li><strong>TSB 5-25:</strong> Fresh - good form</li>
              <li><strong>TSB -10 to 5:</strong> Neutral - normal training</li>
              <li><strong>TSB -30 to -10:</strong> Tired - productive training zone</li>
              <li><strong>TSB &lt; -30:</strong> Very Tired - risk of overtraining</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Training Principles</h2>
            <p className="text-gray-700 mb-3">
              Our plans follow evidence-based polarized training:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>80% low-intensity training (LIT) - below aerobic threshold</li>
              <li>20% high-intensity training (HIT) - at or above threshold</li>
              <li>Gradual CTL ramp rate (5-10 TSS/week)</li>
              <li>Recovery weeks every 3-4 weeks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
