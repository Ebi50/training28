'use client';

import Link from 'next/link';
import { Calendar, Activity, TrendingUp, Zap } from 'lucide-react';
import InfoSidebar from '@/components/InfoSidebar';

export default function HowItWorksPage() {
  return (
    <div className="flex h-screen bg-bg-warm dark:bg-bg-warm-dark overflow-hidden transition-colors">
      <InfoSidebar />
      
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
          <h1 className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Wie es funktioniert
          </h1>
          <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
            Von der Anmeldung bis zum perfekten Trainingsplan – in 3 einfachen Schritten
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 mb-16">
          {/* Step 1 */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                Mit Strava verbinden
              </h3>
              <div className="bg-surface-warm dark:bg-surface-warm-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Verbinde dein Strava-Konto mit einem Klick. Die App synchronisiert automatisch alle deine Aktivitäten 
                  und berechnet daraus deine aktuelle Form (CTL, ATL, TSB).
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <Activity className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Automatische Aktivitäts-Synchronisation via Webhooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>TSS-Berechnung aus Power-Daten, Herzfrequenz oder RPE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Historische Daten werden berücksichtigt (letzten 42 Tage)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                Zeitfenster & Ziele definieren
              </h3>
              <div className="bg-surface-warm dark:bg-surface-warm-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Gib deine verfügbaren Trainingszeiten an (Morgens, Mittags, Abends) und definiere deine Saisonziele. 
                  Die App plant automatisch passende Einheiten um deinen Alltag herum.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Wochentag-spezifische Zeitslots (z.B. Mo-Fr 6-7 Uhr, Sa 9-12 Uhr)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Indoor/Outdoor Präferenzen pro Slot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Saisonziele: A-/B-/C-Rennen mit automatischem Taper</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Trainingslager mit Umfangs-Boost und Deload</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary dark:bg-primary-dark text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                Plan erhalten & loslegen
              </h3>
              <div className="bg-surface-warm dark:bg-surface-warm-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Morgen startet dein individueller Trainingsplan. Die App passt sich täglich an deine Belastung an 
                  und schlägt die optimale nächste Einheit vor.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Wöchentlicher Plan mit LIT/HIT Balance (80/20 Regel)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Tägliche Anpassung basierend auf CTL/ATL/TSB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Automatische Session-Splits wenn Zeit knapp ist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-primary dark:text-primary-dark flex-shrink-0 mt-0.5" />
                    <span>Recovery-Empfehlungen bei hoher Belastung</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How it adapts */}
        <div className="bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border-l-4 border-accent dark:border-accent-400 p-8 rounded-lg mb-12">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary dark:text-primary-dark" />
            Realtime-Anpassung
          </h2>
          <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
            Das Besondere: Nach jeder Strava-Aktivität aktualisiert die App sofort deinen Plan.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                Zu viel Belastung?
              </h4>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Die App reduziert automatisch den Umfang und schlägt mehr Recovery ein, wenn dein TSB zu negativ wird 
                oder die Ramp-Rate zu hoch ist.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                Zu wenig Belastung?
              </h4>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Wenn du gut erholt bist (TSB positiv) und Potenzial hast, steigert die App sanft den Umfang – 
                immer innerhalb der Ramp-Rate Grenzen.
              </p>
            </div>
          </div>
        </div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              href="/login"
              className="inline-block bg-primary dark:bg-primary-dark text-white font-semibold px-10 py-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors text-lg shadow-lg"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
