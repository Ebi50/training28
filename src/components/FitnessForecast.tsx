'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FitnessForecastProps {
  userId: string;
}

interface ForecastData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

export default function FitnessForecast({ userId }: FitnessForecastProps) {
  const [current, setCurrent] = useState({ ctl: 0, atl: 0, tsb: 0 });
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/fitness/forecast?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load forecast');
        }

        const data = await response.json();
        setCurrent(data.current);
        setForecast(data.forecast);
      } catch (err: any) {
        console.error('Error loading forecast:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadForecast();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <p className="text-red-600 dark:text-red-400">Fehler beim Laden: {error}</p>
      </div>
    );
  }

  if (forecast.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Kein Trainingsplan verfügbar. Generiere einen Plan um die Prognose zu sehen.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const labels = forecast.map(f => {
    const date = new Date(f.date);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'CTL (Fitness)',
        data: forecast.map(f => f.ctl),
        borderColor: 'rgb(59, 130, 246)', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'ATL (Fatigue)',
        data: forecast.map(f => f.atl),
        borderColor: 'rgb(239, 68, 68)', // red
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'TSB (Form)',
        data: forecast.map(f => f.tsb),
        borderColor: 'rgb(34, 197, 94)', // green
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)', // gray-400
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(75, 85, 99)', // gray-600
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          📈 Fitness Prognose
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Projektion basierend auf deinem geplanten Training
        </p>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aktuell CTL</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {current.ctl.toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aktuell ATL</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {current.atl.toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aktuell TSB</p>
          <p className={`text-2xl font-bold ${
            current.tsb > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {current.tsb.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>

      {/* End Values */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ziel CTL</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            {forecast[forecast.length - 1].ctl.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {forecast[forecast.length - 1].ctl > current.ctl ? '↗' : '↘'} 
            {' '}
            {Math.abs(forecast[forecast.length - 1].ctl - current.ctl).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ziel ATL</p>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400">
            {forecast[forecast.length - 1].atl.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {forecast[forecast.length - 1].atl > current.atl ? '↗' : '↘'}
            {' '}
            {Math.abs(forecast[forecast.length - 1].atl - current.atl).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ziel TSB</p>
          <p className={`text-xl font-semibold ${
            forecast[forecast.length - 1].tsb > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {forecast[forecast.length - 1].tsb.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {forecast[forecast.length - 1].tsb > current.tsb ? '↗' : '↘'}
            {' '}
            {Math.abs(forecast[forecast.length - 1].tsb - current.tsb).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
