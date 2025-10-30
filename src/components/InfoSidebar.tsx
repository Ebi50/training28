'use client';

import Link from 'next/link';
import { Zap, Moon, Sun, Target, Activity, TrendingUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function InfoSidebar() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="w-64 bg-gradient-to-b from-primary via-primary-700 to-primary dark:from-primary-dark dark:via-secondary-dark dark:to-primary-dark text-white flex flex-col fixed h-screen">
      <div className="p-6 border-b border-primary-400/30 dark:border-primary-600/30">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 bg-white dark:bg-surface-warm-dark rounded-full flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Adaptive</h1>
            <p className="text-sm text-primary-100 dark:text-primary-200">Training System</p>
          </div>
        </Link>
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
  );
}
