'use client';

import { Target, Users } from 'lucide-react';
import InfoSidebar from '@/components/InfoSidebar';

export default function AboutPage() {
  return (
    <div className="flex h-screen bg-bg-warm dark:bg-bg-warm-dark transition-colors overflow-hidden">
      <InfoSidebar />
      
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Über das Projekt
            </h1>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
              Warum wir dieses System entwickelt haben und was dahintersteckt
            </p>
          </div>

        {/* Mission */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Target className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Unsere Mission
            </h2>
          </div>

          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-6">
              Training sollte <strong>smart</strong>, <strong>sicher</strong> und <strong>spaßig</strong> sein – 
              nicht frustrierend oder gefährlich. Zu viele Athleten scheitern an:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg border-l-4 border-error dark:border-error-dark">
                <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-3">
                  ❌ Häufige Probleme
                </h4>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  <li>• Zu schneller Belastungsaufbau → Verletzungen</li>
                  <li>• Zu viel Intensität → Übertraining</li>
                  <li>• Starre Pläne → passen nicht zum Alltag</li>
                  <li>• Keine Anpassung → falsche Belastung zur falschen Zeit</li>
                </ul>
              </div>

              <div className="bg-bg-warm dark:bg-bg-warm-dark p-6 rounded-lg border-l-4 border-success dark:border-success-dark">
                <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-3">
                  ✓ Unsere Lösung
                </h4>
                <ul className="space-y-2 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  <li>• Ramp-Rate Kontrolle → sichere Progression</li>
                  <li>• Polarisiertes Training (80/20) → optimale Balance</li>
                  <li>• Zeitfenster-Planung → passt zu deinem Kalender</li>
                  <li>• Tägliche Anpassung → reagiert auf deine Form</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border-l-4 border-accent dark:border-accent-400 p-6 rounded-lg">
              <p className="text-text-primary-light dark:text-text-primary-dark font-semibold">
                Unser Ziel: Ein Trainingsplan, der <strong>mit dir</strong> arbeitet, nicht gegen dich.
              </p>
            </div>
          </div>
        </div>

        {/* For Whom */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Users className="w-12 h-12 text-primary dark:text-primary-dark" />
            <h2 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Für wen ist diese App?
            </h2>
          </div>

          <div className="bg-surface-warm dark:bg-surface-warm-dark p-8 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 text-center">
              Für Sportler und Sportlerinnen aus allen Altersklassen und Ambitionen
            </h3>
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed text-center mb-6">
              Ob du gerade erst mit dem Radsport beginnst, schon seit Jahren trainierst oder spezifische 
              Wettkampfziele verfolgst – diese App passt sich deinen individuellen Bedürfnissen an.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                  Flexible Anpassung
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Die App plant um deinen Alltag herum und maximiert den Trainingseffekt in der verfügbaren Zeit.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📈</div>
                <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                  Individuelle Ziele
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Automatisches Taper und wissenschaftlich fundierte Belastungssteuerung für optimale Ergebnisse.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🔄</div>
                <h4 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark mb-2">
                  Berücksichtigt Recovery
                </h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Die App berücksichtigt individuelle Regenerationsfähigkeit und passt das Training entsprechend an.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
