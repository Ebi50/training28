'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  title: string;
  items?: string[];
  children: ReactNode;
}

export default function Tooltip({ title, items, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl left-full ml-4 top-0">
          {/* Arrow */}
          <div className="absolute right-full top-4">
            <div className="border-8 border-transparent border-r-surface-light dark:border-r-surface-dark"></div>
          </div>
          
          {/* Content */}
          <h4 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
            {title}
          </h4>
          
          {items && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li 
                  key={index} 
                  className="flex items-start text-base text-text-primary-light dark:text-text-primary-dark"
                >
                  <span className="text-primary-light dark:text-primary-dark mr-2 mt-1 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
