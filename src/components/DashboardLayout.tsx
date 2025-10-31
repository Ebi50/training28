'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, colors, components, layout } from '@/styles/designSystem';
import { Moon, Sun } from 'lucide-react';
import NotificationBell from './NotificationBell';

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
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary via-secondary to-coral dark:from-primary-dark dark:via-secondary-dark dark:to-coral-dark text-white flex flex-col flex-shrink-0 shadow-2xl fixed h-screen overflow-y-auto">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-primary dark:text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center">
            ADAPTIVE TRAINING
          </h1>
          <p className="text-xs text-center opacity-90 mt-1">
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
                  onClick={() => {
                    router.push(item.href);
                  }}
                  onMouseEnter={() => router.prefetch(item.href)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-150
                    ${isActive 
                      ? 'bg-white dark:bg-surface-dark text-primary dark:text-primary-dark shadow-lg font-bold scale-105' 
                      : 'hover:bg-white/15 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <span className={isActive ? 'text-primary' : 'opacity-80'}>
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
          <h3 className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-2 px-4">
            Informationen
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => router.push('/features#features')}
              onMouseEnter={() => router.prefetch('/features')}
              className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Features</span>
            </button>
            <button
              onClick={() => router.push('/features#how-it-works')}
              className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Wie es funktioniert</span>
            </button>
            <button
              onClick={() => router.push('/features#science')}
              className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Wissenschaft</span>
            </button>
            <button
              onClick={() => router.push('/features#about')}
              className="w-full flex items-center px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Über das Projekt</span>
            </button>
            <button
              onClick={() => router.push('/impressum')}
              className="w-full flex items-start px-4 py-3 text-base hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-left">Impressum & Datenschutz</span>
            </button>
          </div>
        </div>

        {/* User Section */}
        <div className="mt-auto p-4 border-t border-white/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">
                  {userEmail?.split('@')[0] || 'User'}
                </p>
                <p className="text-sm opacity-70 truncate">
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
              className="w-full flex items-center px-4 py-3 text-base font-medium hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Help</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-4 py-3 text-base font-medium hover:bg-white/15 dark:hover:bg-white/10 rounded-lg transition-all duration-150"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-5 h-5 mr-3" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5 mr-3" />
                  <span>Light Mode</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={onSignOut}
              className="w-full flex items-center px-4 py-3 text-base font-medium bg-coral dark:bg-coral-dark hover:bg-coral-700 dark:hover:bg-coral-800 rounded-lg transition-all duration-150 shadow-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <header className={`bg-surface-light dark:bg-surface-dark shadow-md border-b ${colors.border.default}`}>
          <div className={spacing.header}>
            <div className={layout.flexRowBetween}>
              <div>
                <h2 className={typography.h1}>
                  {currentPage}
                </h2>
                <p className={`${typography.bodySmall} ${colors.text.secondary} mt-1`}>
                  {pageDescription}
                </p>
              </div>
              
              {/* Right Side: Notification Bell + Season Selector */}
              <div className={`${layout.flexRow} ${spacing.contentInline}`}>
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Season Selector */}
                <div className={`${layout.flexRow} ${spacing.contentInline}`}>
                  <span className={`${typography.bodySmall} ${typography.medium} ${colors.text.primary}`}>Season:</span>
                  <select className={`${components.input.small} cursor-pointer ${colors.border.hover}`}>
                    <option>2025</option>
                    <option>2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${spacing.page}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

