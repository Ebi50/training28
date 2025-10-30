'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  userEmail?: string;
  currentPage?: string;
  pageDescription?: string;
  onSignOut?: () => void;
  onHelp?: () => void;
}

export default function DashboardLayout({ 
  children, 
  userEmail,
  currentPage = 'Dashboard',
  pageDescription = 'Welcome back! Here\'s your training overview',
  onSignOut,
  onHelp 
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Training Plan', 
      href: '/dashboard/plan', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Activities', 
      href: '/dashboard/activities', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-bg-warm dark:bg-bg-warm-dark flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary via-primary-700 to-primary dark:from-primary-dark dark:via-secondary-dark dark:to-primary-dark text-white flex flex-col flex-shrink-0 shadow-xl fixed h-screen overflow-y-auto">
        {/* Logo Section */}
        <div className="p-6 bg-primary-700/50 dark:bg-primary-900/50 border-b border-primary-400/30 dark:border-primary-600/30">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-white dark:bg-surface-warm-dark rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-primary dark:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-white">
            ADAPTIVE TRAINING
          </h1>
          <p className="text-xs text-center text-primary-100 dark:text-primary-200 mt-1">
            Smart Cycling Plans
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all
                    ${isActive 
                      ? 'bg-accent text-primary-900 dark:text-primary-900 shadow-lg shadow-accent/50 font-bold' 
                      : 'text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 hover:text-white'
                    }
                  `}
                >
                  <span className={isActive ? 'text-primary-900' : 'text-primary-200 dark:text-primary-300'}>
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Info Section */}
        <div className="mt-8 px-3">
          <h3 className="text-xs font-semibold text-primary-200 dark:text-primary-300 uppercase tracking-wider mb-2 px-4">
            Informationen
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => router.push('/features')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Features</span>
            </button>
            <button
              onClick={() => router.push('/how-it-works')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Wie es funktioniert</span>
            </button>
            <button
              onClick={() => router.push('/science')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Wissenschaft</span>
            </button>
            <button
              onClick={() => router.push('/about')}
              className="w-full flex items-center px-4 py-2.5 text-sm text-primary-50 dark:text-primary-100 hover:bg-primary-700/50 dark:hover:bg-primary-800/50 hover:text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Über das Projekt</span>
            </button>
          </div>
        </div>

        {/* User Section */}
        <div className="mt-auto p-4 bg-primary-700/50 dark:bg-primary-900/50 border-t border-primary-400/30 dark:border-primary-600/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-700 dark:bg-primary-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-100 dark:text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userEmail?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-primary-100 dark:text-primary-200 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Stack vertically with consistent width */}
          <div className="space-y-2">
            {/* Help Button */}
            <button
              onClick={onHelp}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-primary-50 dark:text-primary-100 hover:text-white bg-primary-700/50 dark:bg-primary-800/50 hover:bg-primary-800 dark:hover:bg-primary-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Help</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-primary-50 dark:text-primary-100 hover:text-white bg-primary-700/50 dark:bg-primary-800/50 hover:bg-primary-800 dark:hover:bg-primary-700 rounded-lg transition-colors"
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

            {/* Logout Button */}
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-800 dark:bg-gray-900 hover:bg-gray-900 dark:hover:bg-black rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header Bar */}
        <header className="bg-surface-warm dark:bg-surface-warm-dark shadow-sm border-b border-border-light dark:border-border-dark">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {currentPage}
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  {pageDescription}
                </p>
              </div>
              
              {/* Season Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Season:</span>
                <select className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-sm font-medium text-text-primary-light dark:text-text-primary-dark bg-surface-warm dark:bg-surface-warm-dark hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark">
                  <option>2025</option>
                  <option>2024</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
