'use client';

import Link from 'next/link';
import { TrendingUp, Activity, Target, Brain } from 'lucide-react';
import InfoSidebar from '@/components/InfoSidebar';

export default function SciencePage() {
  return (
    <div className="flex h-screen bg-bg-warm dark:bg-bg-warm-dark transition-colors overflow-hidden">
      <InfoSidebar />
      
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Die Wissenschaft dahinter
            </h1>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
              Erprobte Methoden für nachhaltigen Formaufbau – wissenschaftlich fundiert
            </p>
          </div>

        {/* TSS/CTL/ATL Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <TrendingUp className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              TSS, CTL, ATL & TSB
            </h2>
          </div>
          
          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-8">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-6">
              Die App basiert auf dem <strong>Training Stress Score (TSS)</strong> System von TrainingPeaks – 
              ein etabliertes Konzept im Ausdauersport zur Quantifizierung von Trainingsbelastung.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  TSS (Training Stress Score)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Misst die Belastung einer einzelnen Trainingseinheit. Wird berechnet aus:
                </p>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">•</span>
                    <span><strong>Power-Daten</strong> (Normalized Power vs. FTP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">•</span>
                    <span><strong>Herzfrequenz</strong> (HR-basiertes TSS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">•</span>
                    <span><strong>RPE</strong> (Subjektives Belastungsempfinden)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  CTL (Chronic Training Load)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Deine <strong>Fitness</strong> – ein exponentiell gewichteter 42-Tage-Durchschnitt deines TSS.
                </p>
                <div className="bg-accent-100 dark:bg-accent-900/30 p-3 rounded border-l-4 border-primary dark:border-primary-dark">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <strong>Ziel:</strong> CTL sollte sanft steigen (max. +5-8 TSS/Woche für sichere Progression)
                  </p>
                </div>
              </div>

              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  ATL (Acute Training Load)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Deine <strong>Müdigkeit</strong> – ein exponentiell gewichteter 7-Tage-Durchschnitt deines TSS.
                </p>
                <div className="bg-accent-100 dark:bg-accent-900/30 p-3 rounded border-l-4 border-error dark:border-error-dark">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <strong>Warnung:</strong> Wenn ATL viel höher als CTL ist, droht Übertraining
                  </p>
                </div>
              </div>

              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  TSB (Training Stress Balance)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Deine <strong>Form</strong> – berechnet als: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">TSB = CTL - ATL</code>
                </p>
                <ul className="space-y-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <li><strong className="text-error">TSB &lt; -30:</strong> Übertraining-Risiko</li>
                  <li><strong className="text-primary dark:text-primary-dark">TSB -10 bis +5:</strong> Optimal für Training</li>
                  <li><strong className="text-success">TSB &gt; +15:</strong> Gut erholt, bereit für Wettkampf</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Polarized Training Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Activity className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Polarisiertes Training (80/20)
            </h2>
          </div>

          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-6">
              Die App folgt dem <strong>polarisierten Trainingsmodell</strong> – wissenschaftlich belegt als effektivste 
              Methode für Ausdauersportler (Seiler & Tønnessen, 2009).
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg border-l-4 border-primary dark:border-primary-dark">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  80% LIT (Low Intensity Training)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Lockere Grundlagenausdauer – Zone 1-2
                </p>
                <ul className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Verbesserung der aeroben Kapazität</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Fettstoffwechsel-Training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary dark:text-primary-dark font-bold">✓</span>
                    <span>Geringe Ermüdung – hohe Trainierbarkeit</span>
                  </li>
                </ul>
              </div>

              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg border-l-4 border-error dark:border-error-dark">
                <h4 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                  20% HIT (High Intensity Training)
                </h4>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  Intensive Intervalle – Zone 4-6
                </p>
                <ul className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">✓</span>
                    <span>VO2max Steigerung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">✓</span>
                    <span>Laktattoleranz & anaerobe Kapazität</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-bold">✓</span>
                    <span>Hohe Ermüdung – begrenzte Dosis nötig</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-accent-100 dark:bg-accent-900/30 p-6 rounded-lg border-l-4 border-accent dark:border-accent-400">
              <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                Warum 80/20 funktioniert
              </h4>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Zu viel Intensität führt zu chronischer Ermüdung und verhindert optimale Anpassung. 
                Die 80/20-Regel maximiert die Trainingsfrequenz (mehr Volumen möglich) bei gleichzeitig 
                ausreichender Intensität für physiologische Anpassungen.
              </p>
            </div>
          </div>
        </div>

        {/* Ramp Rate Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Target className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Ramp Rate & Überlastungs-Prävention
            </h2>
          </div>

          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-6">
              Die <strong>Ramp Rate</strong> beschreibt, wie schnell dein CTL (Fitness) steigt. 
              Zu schnelle Steigerung = Verletzungsrisiko. Die App limitiert automatisch.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-success/10 dark:bg-success-dark/20 p-4 rounded-lg border-l-4 border-success dark:border-success-dark">
                <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Sicher: +5-8 TSS/Woche
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Nachhaltige Progression ohne Überlastung
                </p>
              </div>

              <div className="bg-amber-500/10 dark:bg-amber-500/20 p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Grenzwertig: +8-10 TSS/Woche
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Nur temporär (z.B. Trainingslager)
                </p>
              </div>

              <div className="bg-error/10 dark:bg-error-dark/20 p-4 rounded-lg border-l-4 border-error dark:border-error-dark">
                <h4 className="font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Riskant: &gt;10 TSS/Woche
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Hohe Verletzungs-/Übertraining-Gefahr
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ML Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Brain className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Machine Learning (Phase 2)
            </h2>
          </div>

          <div className="bg-gradient-to-r from-info-100 to-info-200 dark:from-info-900/30 dark:to-info-800/30 p-8 rounded-lg border-l-4 border-info dark:border-info-dark">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-4">
              Die aktuelle Version nutzt <strong>heuristische Regeln</strong> basierend auf wissenschaftlichen Erkenntnissen. 
              Phase 2 wird ein <strong>ML-Modell (XGBoost)</strong> integrieren, das aus deinen Daten lernt und 
              noch präzisere TSS-Vorhersagen und Planempfehlungen liefert.
            </p>
            <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
              <li className="flex items-start gap-2">
                <span className="text-primary dark:text-primary-dark font-bold">→</span>
                <span>Personalisierte TSS-Schätzung basierend auf deinem individuellen Belastungsprofil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary dark:text-primary-dark font-bold">→</span>
                <span>Prädiktive Anpassungen: Vorhersage deiner optimalen Belastung 1-2 Wochen im Voraus</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary dark:text-primary-dark font-bold">→</span>
                <span>Kontinuierliches Lernen: Je mehr du trainierst, desto besser wird die App</span>
              </li>
            </ul>
          </div>
        </div>

        {/* References */}
        <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-12">
          <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
            Wissenschaftliche Grundlagen
          </h3>
          <ul className="space-y-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <li className="border-l-4 border-primary dark:border-primary-dark pl-4">
              <strong>Seiler, S., & Tønnessen, E. (2009).</strong> Intervals, thresholds, and long slow distance: 
              the role of intensity and duration in endurance training. <em>Sportscience, 13, 32-53.</em>
            </li>
            <li className="border-l-4 border-primary dark:border-primary-dark pl-4">
              <strong>Coggan, A. R. (2003).</strong> Training and racing using a power meter: An introduction. 
              <em>TrainingPeaks.</em>
            </li>
            <li className="border-l-4 border-primary dark:border-primary-dark pl-4">
              <strong>Banister, E. W. (1991).</strong> Modeling elite athletic performance. 
              <em>Physiological Testing of Elite Athletes, 347-424.</em>
            </li>
          </ul>
        </div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              href="/login"
              className="inline-block bg-primary dark:bg-primary-dark text-white font-semibold px-10 py-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors text-lg shadow-lg"
            >
              Jetzt wissenschaftlich fundiert trainieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
