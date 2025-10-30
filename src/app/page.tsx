'use client';

import Link from 'next/link';
import { Activity, Calendar, TrendingUp, Target, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Fixed */}
      <div className="w-64 bg-gradient-to-b from-red-600 via-red-500 to-red-600 text-white flex flex-col fixed h-screen">
        {/* Logo Section */}
        <div className="p-6 border-b border-red-400/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Zap className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Adaptive</h1>
              <p className="text-sm text-red-100">Training System</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-6 overflow-y-auto">
          <nav className="space-y-2">
            <a href="#features" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-50 hover:bg-red-700/50 transition-colors">
              <Target className="w-5 h-5" />
              <span>Features</span>
            </a>
            <a href="#how-it-works" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-50 hover:bg-red-700/50 transition-colors">
              <Activity className="w-5 h-5" />
              <span>Wie es funktioniert</span>
            </a>
            <a href="#benefits" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-50 hover:bg-red-700/50 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Vorteile</span>
            </a>
          </nav>
        </div>

        {/* Login Button at Bottom - Fixed */}
        <div className="p-6 border-t border-red-400/30">
          <Link 
            href="/login"
            className="block w-full bg-white text-red-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors text-center"
          >
            Login / Anmelden
          </Link>
        </div>
      </div>

      {/* Main Content - With left margin for sidebar */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <main className="max-w-5xl mx-auto px-8 py-12">
          {/* Hero Section - Sticky at top */}
          <div className="sticky top-0 bg-gray-50 z-10 pb-8 mb-8 border-b-2 border-red-200">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 pt-4">
              Mehr als nur ein Trainingsplan – dein smarter Trainingspartner
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed mb-8">
              Unsere App ist kein starres Schema, sondern <strong>dein persönlicher Wegbegleiter</strong>: 
              Sie plant, denkt mit und passt sich täglich an – an deine Ziele, an deinen Kalender und 
              an das, was dein Körper signalisiert. Sicherheit, Spaß und <strong>nachhaltiger Fortschritt</strong> stehen 
              dabei ganz oben. Nicht die reine Trainingszeit zählt, sondern <strong>die Qualität jeder Einheit</strong>.
            </p>
            
            <div className="flex gap-4">
              <Link 
                href="/login"
                className="bg-red-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-red-700 transition-colors text-lg"
              >
                Jetzt starten
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-200 text-gray-800 font-semibold px-8 py-4 rounded-lg hover:bg-gray-300 transition-colors text-lg"
              >
                Demo ansehen
              </Link>
            </div>
          </div>

          {/* Target Audience */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Für alle, die Radsport (und Ausdauer) lieben
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Egal ob Hobbyfahrer:in, Senior:in, Einsteiger:in oder ambitionierte:r Racer – hier bekommst du 
              einen Plan, der zu <strong>deinem Leben</strong> passt. Die App berücksichtigt deine verfügbaren <strong>Zeitfenster</strong>, 
              splittet Einheiten bei Bedarf (z. B. 90 min → 2×60 min) und führt dich mit einer durchdachten <strong>LIT/HIT-Balance</strong> sicher 
              durch die Saison.
            </p>
          </div>

          {/* Benefits Box */}
          <div id="benefits" className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 p-8 rounded-lg mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Deine Vorteile auf einen Blick</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold text-xl">✓</span>
                <span className="text-gray-800">Training, das <strong>zu deinem Alltag</strong> passt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold text-xl">✓</span>
                <span className="text-gray-800"><strong>Mehr Struktur, weniger Grübeln</strong> vor jeder Einheit</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold text-xl">✓</span>
                <span className="text-gray-800"><strong>Sicherer Formaufbau</strong> statt Überlastung</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold text-xl">✓</span>
                <span className="text-gray-800">Klarer Fokus vor wichtigen <strong>Wettkämpfen</strong></span>
              </li>
            </ul>
          </div>

          {/* Features Section */}
          <div id="features" className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Was dich erwartet</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <Calendar className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Adaptive Wochenpläne</h3>
                    <p className="text-gray-700">
                      Intelligente Steuerung von LIT/HIT, tägliche Updates nach deiner Belastung und deinem Feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <Activity className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Zeitfenster-Planung</h3>
                    <p className="text-gray-700">
                      Die App baut den Plan um deinen Kalender: Splitting langer Sessions (z. B. 2×60 min), 
                      Indoor/Outdoor-Präferenzen, Morgen/Abend-Slots.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <Target className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Saisonziele & Taper</h3>
                    <p className="text-gray-700">
                      A-/B-/C-Rennen erfassen, automatische Taper-Strategie – Ziel: <strong>frisch an der Startlinie</strong> (TSB ≥ 0).
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 4 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Trainingslager (Camps)</h3>
                    <p className="text-gray-700">
                      Geplante Umfangssteigerung mit <strong>HIT-Cap</strong>, Umweltfaktoren und automatischer 
                      <strong> Deload-Woche</strong> danach.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 5 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Realtime-Reaktion</h3>
                    <p className="text-gray-700">
                      Neue Strava-Aktivität? Sofortige Plananpassung: Compliance-Check, Ramp-Rate, Recovery-Empfehlungen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Card 6 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Datenschutz & Sicherheit</h3>
                    <p className="text-gray-700">
                      Deine Daten gehören <strong>dir</strong>. Zugriff pro Nutzer, Secrets serverseitig – 
                      für ein gutes Gefühl bei jedem Sync.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div id="how-it-works" className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vielfalt & Alltagstauglichkeit
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Saisonziele im Blick, Alltag im Griff: <strong>Camps</strong> mit mehr Umfang, <strong>Taper</strong> vor 
              dem Rennen, <strong>Deload</strong> nach Belastungsspitzen – alles automatisch einberechnet. 
              Neue Strava-Aktivität? Die Planung reagiert in <strong>Echtzeit</strong> und schlägt die passende 
              nächste Einheit vor. So bleibst du im Flow, ohne am Plan herumzubasteln.
            </p>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">So funktioniert's</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Mit Strava verbinden</h4>
                    <p className="text-gray-600">
                      Verbinde dein Strava-Konto, um Aktivitäten automatisch zu synchronisieren und zu tracken.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Zeitfenster setzen</h4>
                    <p className="text-gray-600">
                      Gib deine verfügbaren Trainingszeiten an – die App plant automatisch passende Einheiten.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Plan erhalten & loslegen</h4>
                    <p className="text-gray-600">
                      Morgen startet dein individueller Plan – angepasst an deine Ziele und deinen Alltag.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center py-12 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-white">
            <h2 className="text-3xl font-bold mb-4">Bereit, smart zu trainieren?</h2>
            <p className="text-xl mb-8">Weniger Planung. Mehr Fortschritt. Mehr Spaß am Sport.</p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/login"
                className="bg-white text-red-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg"
              >
                Jetzt starten
              </Link>
              <Link 
                href="/dashboard"
                className="bg-red-700 text-white font-semibold px-8 py-4 rounded-lg hover:bg-red-800 transition-colors text-lg border-2 border-white"
              >
                Demo ansehen
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}