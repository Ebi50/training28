'use client';

import Link from 'next/link';
import { Calendar, Activity, Target, TrendingUp, Zap, Shield } from 'lucide-react';
import InfoSidebar from '@/components/InfoSidebar';

export default function FeaturesPage() {
  return (
    <div className="flex h-screen bg-bg-warm dark:bg-bg-warm-dark overflow-hidden transition-colors">
      <InfoSidebar />
      
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Features
            </h1>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
              Was dich erwartet – alle Funktionen im Detail
            </p>
          </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <Calendar className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Adaptive Wochenpläne
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Intelligente Steuerung von LIT/HIT, tägliche Updates nach deiner Belastung und deinem Feedback.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Automatische LIT/HIT Balance (80/20 Regel)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Tägliche Plananpassung basierend auf CTL/ATL/TSB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Ramp-Rate Kontrolle für sicheren Formaufbau</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <Activity className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Zeitfenster-Planung
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Die App baut den Plan um deinen Kalender: Splitting langer Sessions, Indoor/Outdoor-Präferenzen, Morgen/Abend-Slots.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Automatisches Session-Splitting (z.B. 90min → 2×60min)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Indoor/Outdoor Präferenzen pro Zeitslot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Flexible Morgen-, Mittag- und Abend-Slots</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <Target className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Saisonziele & Taper
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  A-/B-/C-Rennen erfassen, automatische Taper-Strategie – Ziel: frisch an der Startlinie (TSB ≥ 0).
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>A-Rennen: 2 Wochen Taper (TSB +15 bis +25)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>B-Rennen: 1 Woche Taper (TSB +5 bis +15)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>C-Rennen: Integriert in normales Training</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Trainingslager (Camps)
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Geplante Umfangssteigerung mit HIT-Cap, Umweltfaktoren und automatischer Deload-Woche danach.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>20-40% Umfangssteigerung während Camp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>HIT-Cap: max 50% des normalen HIT-Umfangs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Automatische Deload-Woche nach Camp-Ende</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <Zap className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Realtime-Reaktion
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Neue Strava-Aktivität? Sofortige Plananpassung: Compliance-Check, Ramp-Rate, Recovery-Empfehlungen.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Automatische Strava-Synchronisation via Webhooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>TSS-Berechnung aus Power, HR oder RPE</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Sofortige CTL/ATL/TSB Updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4">
              <Shield className="w-10 h-10 text-primary dark:text-primary-dark flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  Datenschutz & Sicherheit
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
                  Deine Daten gehören dir. Zugriff pro Nutzer, Secrets serverseitig – für ein gutes Gefühl bei jedem Sync.
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>User-scoped Firestore Security Rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>OAuth Tokens nur serverseitig gespeichert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>GDPR-ready Datenhaltung</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link 
              href="/login"
              className="inline-block bg-primary dark:bg-primary-dark text-white font-semibold px-10 py-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors text-lg shadow-lg"
            >
              Jetzt ausprobieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
