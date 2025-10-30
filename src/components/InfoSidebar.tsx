'use client';

import Link from 'next/link';
import { Zap, Moon, Sun, Target, Activity, TrendingUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function InfoSidebar() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="w-64 bg-gradient-to-b from-primary via-secondary to-primary-600 dark:from-primary-dark dark:via-surface-warm-dark dark:to-secondary-dark text-text-onDark flex flex-col fixed h-screen">
      <div className="p-6 border-b border-white/10 dark:border-white/10">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 bg-white dark:bg-surface-warm-dark rounded-full flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Adaptive</h1>
            <p className="text-sm opacity-80">Training System</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-3">
            Informationen
          </h3>
          <nav className="space-y-2">
            <Link href="/features" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
              <Target className="w-5 h-5" />
              <span>Features</span>
            </Link>
            <Link href="/how-it-works" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
              <Activity className="w-5 h-5" />
              <span>Wie es funktioniert</span>
            </Link>
            <Link href="/science" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Wissenschaft</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
              <BookOpen className="w-5 h-5" />
              <span>Ueber das Projekt</span>
            </Link>
          </nav>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center px-4 py-2.5 mb-3 text-sm font-medium hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors"
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
          className="block w-full bg-white dark:bg-surface-warm-dark text-primary dark:text-primary-dark font-semibold px-6 py-3 rounded-lg hover:bg-accent dark:hover:bg-accent/80 transition-colors text-center"
        >
          Login / Anmelden
        </Link>
      </div>
    </div>
  );
}
