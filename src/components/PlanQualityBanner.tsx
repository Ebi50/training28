'use client';

import { useState } from 'react';
import type { PlanQuality } from '@/types';
import { AlertTriangle, X, Info } from 'lucide-react';

interface PlanQualityBannerProps {
  quality: PlanQuality;
  planId: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export default function PlanQualityBanner({ 
  quality, 
  planId, 
  onDismiss,
  dismissible = true 
}: PlanQualityBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  // Only show if there are warnings
  if (quality.warnings.length === 0) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Determine severity color
  const hasErrors = quality.warnings.some(w => w.severity === 'error');
  const hasWarnings = quality.warnings.some(w => w.severity === 'warning');
  
  const severityClass = hasErrors 
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : hasWarnings
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';

  const severityTextClass = hasErrors
    ? 'text-red-800 dark:text-red-200'
    : hasWarnings
    ? 'text-yellow-800 dark:text-yellow-200'
    : 'text-blue-800 dark:text-blue-200';

  const qualityPercentage = Math.round(quality.score * 100);
  const qualityColor = qualityPercentage >= 90 ? 'text-green-600' : 
                       qualityPercentage >= 75 ? 'text-yellow-600' :
                       'text-red-600';

  return (
    <div className={`${severityClass} border rounded-lg p-4 mb-4 relative`}>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`absolute top-2 right-2 ${severityTextClass} hover:opacity-70 transition-opacity`}
          aria-label="Hinweis schließen"
        >
          <X size={20} />
        </button>
      )}

      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {hasErrors || hasWarnings ? (
            <AlertTriangle className={severityTextClass} size={24} />
          ) : (
            <Info className={severityTextClass} size={24} />
          )}
        </div>

        <div className="ml-3 flex-1">
          <h3 className={`text-lg font-semibold ${severityTextClass} mb-2`}>
            Plan Quality Summary ({planId})
          </h3>
          
          <div className={`flex items-center gap-2 mb-3 ${severityTextClass}`}>
            <span className="font-medium">Quality Score:</span>
            <span className={`text-xl font-bold ${qualityColor}`}>{qualityPercentage}%</span>
          </div>

          {quality.adjustments.splitSessions > 0 || quality.adjustments.tssReduced > 0 ? (
            <div className={`${severityTextClass} mb-3`}>
              <p className="font-medium mb-1">Adjustments Made:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {quality.adjustments.splitSessions > 0 && (
                  <li>
                    {quality.adjustments.splitSessions} training{quality.adjustments.splitSessions > 1 ? 's' : ''} split into multiple sessions
                  </li>
                )}
                {quality.adjustments.tssReduced > 0 && (
                  <li>
                    {quality.adjustments.tssReduced} training{quality.adjustments.tssReduced > 1 ? 's' : ''} with reduced TSS ({quality.adjustments.totalTssLost} TSS total)
                  </li>
                )}
              </ul>
            </div>
          ) : null}

          {quality.warnings.length > 0 && (
            <details className={severityTextClass}>
              <summary className="cursor-pointer font-medium hover:opacity-70 transition-opacity">
                View Details ({quality.warnings.length} item{quality.warnings.length > 1 ? 's' : ''})
              </summary>
              <ul className="mt-2 space-y-1 text-sm ml-4">
                {quality.warnings.slice(0, 5).map((warning, index) => (
                  <li key={index} className="list-disc">
                    {warning.message}
                  </li>
                ))}
                {quality.warnings.length > 5 && (
                  <li className="italic">+ {quality.warnings.length - 5} more...</li>
                )}
              </ul>
            </details>
          )}

          <p className={`text-sm mt-3 ${severityTextClass} opacity-90`}>
            💡 Details zu einzelnen Trainings findest du in den Trainingsnotizen.
          </p>
        </div>
      </div>
    </div>
  );
}
