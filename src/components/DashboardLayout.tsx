'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-red-600 via-red-500 to-red-600 text-white flex-shrink-0 shadow-xl">
        {/* Logo Section */}
        <div className="p-6 bg-red-700/50 border-b border-red-400/30">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold text-center text-white">
            ADAPTIVE TRAINING
          </h1>
          <p className="text-xs text-center text-red-100 mt-1">
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
                      ? 'bg-yellow-400 text-red-900 shadow-lg shadow-yellow-400/50 font-bold' 
                      : 'text-red-50 hover:bg-red-700/50 hover:text-white'
                    }
                  `}
                >
                  <span className={isActive ? 'text-red-900' : 'text-red-200'}>
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.name}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-red-700/50 border-t border-red-400/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userEmail?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-red-100 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onHelp}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-50 hover:text-white bg-red-700/50 hover:bg-red-800 rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentPage}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pageDescription}
                </p>
              </div>
              
              {/* Season Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Season:</span>
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500">
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
