'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { colors, typography } from '@/styles/designSystem';

interface FitnessChartProps {
  historicalData: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
  }>;
  forecastData: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
  }>;
  isDarkMode?: boolean;
}

/**
 * FitnessChart Component
 * 
 * Visualizes CTL, ATL, and TSB over time with:
 * - Historical data (solid lines) - last 42 days
 * - Forecast data (dashed lines) - future projections
 * - Interactive tooltips
 * - TSB zones (fresh/optimal/tired/fatigued)
 * 
 * TSB Interpretation:
 * - > +25: Fresh (green zone)
 * - -10 to +25: Optimal (blue zone)
 * - -30 to -10: Tired (orange zone)
 * - < -30: Fatigued (red zone)
 */
export default function FitnessChart({ historicalData, forecastData, isDarkMode = false }: FitnessChartProps) {
  // Combine historical and forecast data
  const combinedData = [
    ...historicalData.map(d => ({ ...d, isForecast: false })),
    ...forecastData.map(d => ({ ...d, isForecast: true }))
  ];

  // Format date for display (e.g., "01 Nov")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const isForecast = data.isForecast;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {formatDate(data.date)} {isForecast && '(Prognose)'}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-olive-600 dark:text-olive-400">CTL (Fitness):</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.ctl.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-coral-600 dark:text-coral-400">ATL (Fatigue):</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.atl.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-primary-600 dark:text-primary-400">TSB (Form):</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.tsb > 0 ? '+' : ''}{data.tsb.toFixed(1)}
            </span>
          </div>
          {/* TSB interpretation */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {data.tsb > 25 && '🟢 Fresh - Bereit für Wettkämpfe'}
              {data.tsb >= -10 && data.tsb <= 25 && '🔵 Optimal - Gutes Training möglich'}
              {data.tsb >= -30 && data.tsb < -10 && '🟠 Tired - Erholung wichtig'}
              {data.tsb < -30 && '🔴 Fatigued - Dringend Regeneration'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Chart colors
  const ctlColor = '#6B8E23'; // olive
  const atlColor = '#FF6B6B'; // coral
  const tsbColor = '#3B82F6'; // primary blue

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={combinedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
          />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />

          {/* TSB Reference Lines (zones) */}
          <ReferenceLine y={25} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={-10} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={-30} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={0} stroke={isDarkMode ? '#4B5563' : '#9CA3AF'} strokeDasharray="3 3" />

          {/* Historical data (solid lines) */}
          <Line 
            type="monotone" 
            dataKey="ctl" 
            stroke={ctlColor}
            strokeWidth={2.5}
            dot={false}
            name="CTL (Fitness)"
            connectNulls
          />
          <Line 
            type="monotone" 
            dataKey="atl" 
            stroke={atlColor}
            strokeWidth={2.5}
            dot={false}
            name="ATL (Fatigue)"
            connectNulls
          />
          <Line 
            type="monotone" 
            dataKey="tsb" 
            stroke={tsbColor}
            strokeWidth={2.5}
            dot={false}
            name="TSB (Form)"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 mt-0.5 rounded" style={{ backgroundColor: ctlColor }}></div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">CTL (Fitness)</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">42-Tage Durchschnitt</p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 mt-0.5 rounded" style={{ backgroundColor: atlColor }}></div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">ATL (Fatigue)</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">7-Tage Durchschnitt</p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <div className="w-4 h-4 mt-0.5 rounded" style={{ backgroundColor: tsbColor }}></div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">TSB (Form)</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">CTL - ATL</p>
          </div>
        </div>
      </div>

      {/* TSB zones explanation */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <span>🟢</span>
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Fresh</p>
            <p className="text-green-600 dark:text-green-400">TSB &gt; +25</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <span>🔵</span>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-300">Optimal</p>
            <p className="text-blue-600 dark:text-blue-400">-10 bis +25</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
          <span>🟠</span>
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-300">Tired</p>
            <p className="text-orange-600 dark:text-orange-400">-30 bis -10</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <span>🔴</span>
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Fatigued</p>
            <p className="text-red-600 dark:text-red-400">TSB &lt; -30</p>
          </div>
        </div>
      </div>
    </div>
  );
}
