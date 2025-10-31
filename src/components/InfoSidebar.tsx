'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Features', href: '/features', icon: '🚴' },
  { name: 'How It Works', href: '/how-it-works', icon: '⚙️' },
  { name: 'The Science', href: '/science', icon: '🔬' },
  { name: 'About', href: '/about', icon: 'ℹ️' },
];

export default function InfoSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
      <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
        Information
      </h2>
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive
                  ? 'bg-primary dark:bg-primary-dark text-white'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base text-primary dark:text-primary-dark hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
