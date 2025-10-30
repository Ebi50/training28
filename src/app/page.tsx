'use client';

import Link from 'next/link';
import { Zap, Moon, Sun, Target, Activity, TrendingUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex h-screen bg-bg-warm dark:bg-bg-warm-dark overflow-hidden transition-colors">
      <div className="w-64 bg-gradient-to-b from-primary via-primary-700 to-primary dark:from-primary-dark dark:via-secondary-dark dark:to-primary-dark text-white flex flex-col fixed h-screen">
        <div className="p-6 border-b border-primary-400/30 dark:border-primary-600/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-surface-warm-dark rounded-full flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary dark:text-primary-dark" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Adaptive</h1>
              <p className="text-sm text-primary-100 dark:text-primary-200">Training System</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-primary-200 dark:text-primary-300 uppercase tracking-wider mb-3">
              Informationen
            </h3>
            <nav className="space-y-2">
              <Link href="/features" className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 transition-colors">
                <Target className="w-5 h-5" />
                <span>Features</span>
              </Link>
              <Link href="/how-it-works" className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 transition-colors">
                <Activity className="w-5 h-5" />
                <span>Wie es funktioniert</span>
              </Link>
              <Link href="/science" className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 transition-colors">
                <TrendingUp className="w-5 h-5" />
                <span>Wissenschaft</span>
              </Link>
              <Link href="/about" className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 transition-colors">
                <BookOpen className="w-5 h-5" />
                <span>Ueber das Projekt</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-primary-400/30 dark:border-primary-600/30">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-4 py-2.5 mb-3 text-sm font-medium text-primary-50 dark:text-primary-100 hover:text-white bg-primary-700/50 dark:bg-primary-800/50 hover:bg-primary-800 dark:hover:bg-primary-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 mr-2" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 mr-2" />
                <span>Light Mode</span>
              </>
            )}
          </button>
          
          <Link 
            href="/login"
            className="block w-full bg-white dark:bg-surface-warm-dark text-primary dark:text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Login / Anmelden
          </Link>
        </div>
      </div>

      <div className="flex-1 ml-64 overflow-y-auto">
        <main className="max-w-5xl mx-auto px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
              Dein smarter Trainingspartner
            </h1>
            <p className="text-2xl text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-12 max-w-3xl mx-auto">
              Mehr als nur ein Trainingsplan - eine App die mitdenkt sich taeglich anpasst und dich sicher zu deinen Zielen fuehrt.
            </p>
            
            <div className="flex gap-6 justify-center">
              <Link 
                href="/login"
                className="bg-primary dark:bg-primary-dark text-white font-semibold px-10 py-5 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors text-xl shadow-lg"
              >
                Jetzt starten
              </Link>
              <Link 
                href="/dashboard"
                className="bg-surface-warm dark:bg-surface-warm-dark text-text-primary-light dark:text-text-primary-dark font-semibold px-10 py-5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xl border-2 border-border-light dark:border-border-dark"
              >
                Demo ansehen
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary dark:text-primary-dark" />
              </div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                Passt zu deinem Leben
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Dein Kalender deine Zeitfenster - die App baut den Plan um deinen Alltag herum.
              </p>
            </div>

            <div className="text-center p-8 bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-primary dark:text-primary-dark" />
              </div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                Taeglich angepasst
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Realtime-Reaktion auf jede Aktivitaet - sichere Belastungssteuerung garantiert.
              </p>
            </div>

            <div className="text-center p-8 bg-surface-warm dark:bg-surface-warm-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary-dark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary dark:text-primary-dark" />
              </div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                Wissenschaftlich fundiert
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                TSS CTL ATL - erprobte Methoden fuer nachhaltigen Formaufbau.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/30 dark:to-accent-800/30 border-l-4 border-accent dark:border-accent-400 p-10 rounded-lg mb-16">
            <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
              Fuer Sportler und Sportlerinnen aus allen Altersklassen und Ambitionen
            </h2>
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Hier bekommst du einen Plan der zu deinem Leben passt. 
              Die App beruecksichtigt deine verfuegbaren Zeitfenster 
              splittet Einheiten bei Bedarf und fuehrt dich mit einer durchdachten LIT/HIT-Balance 
              sicher durch die Saison.
            </p>
          </div>

          <div className="text-center py-16 bg-gradient-to-r from-primary via-primary-700 to-primary dark:from-primary-dark dark:via-secondary-dark dark:to-primary-dark rounded-lg text-white">
            <h2 className="text-4xl font-bold mb-4">Bereit fuer smartes Training?</h2>
            <p className="text-xl mb-8 text-primary-50 dark:text-primary-100">
              Weniger Planung. Mehr Fortschritt. Mehr Spass am Sport.
            </p>
            <Link 
              href="/login"
              className="inline-block bg-white dark:bg-surface-warm-dark text-primary dark:text-primary-dark font-semibold px-10 py-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
            >
              Jetzt kostenlos starten
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
