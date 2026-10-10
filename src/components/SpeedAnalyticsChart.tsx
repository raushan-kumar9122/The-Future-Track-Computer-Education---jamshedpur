import React from 'react';
import { WpmTimelinePoint } from '../types';

interface SpeedAnalyticsChartProps {
  timeline: WpmTimelinePoint[];
  grossWpm: number;
  netWpm: number;
  totalErrors: number;
}

export const SpeedAnalyticsChart: React.FC<SpeedAnalyticsChartProps> = ({
  timeline,
  grossWpm,
  netWpm,
  totalErrors,
}) => {
  if (!timeline || timeline.length < 2) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
        Continuous keystroke timeline will populate automatically as test progresses.
      </div>
    );
  }

  // SVG dimensions
  const width = 760;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max values
  const maxWpm = Math.max(60, ...timeline.map((p) => Math.max(p.grossWpm, p.netWpm))) + 10;
  const maxSec = Math.max(1, timeline[timeline.length - 1].second);

  // Coordinate mappers
  const getX = (sec: number) => padding.left + (sec / maxSec) * chartWidth;
  const getY = (wpm: number) => padding.top + chartHeight - (wpm / maxWpm) * chartHeight;

  // Build SVG path strings
  const grossPoints = timeline.map((p) => `${getX(p.second)},${getY(p.grossWpm)}`).join(' L ');
  const netPoints = timeline.map((p) => `${getX(p.second)},${getY(p.netWpm)}`).join(' L ');

  const netAreaPath = `M ${getX(timeline[0].second)},${padding.top + chartHeight} L ${netPoints} L ${getX(
    timeline[timeline.length - 1].second
  )},${padding.top + chartHeight} Z`;

  // Filter error bursts for plotting
  const errorPoints = timeline.filter((p) => p.errors > 0);

  // Horizontal Grid Lines (e.g. 0, 20, 40, 60, 80...)
  const gridSteps = 4;
  const gridWpmValues = Array.from({ length: gridSteps + 1 }, (_, i) =>
    Math.round((maxWpm / gridSteps) * i)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 font-heading">
            Speed Velocity & Keystroke Consistency Graph
          </h4>
          <p className="text-xs text-slate-500">
            Real-time second-by-second cadence tracking across examination duration
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-600 rounded"></span>
            <span className="font-semibold text-slate-700">Net WPM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-slate-400 rounded"></span>
            <span className="text-slate-500">Gross (Raw)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-rose-600 font-medium">Error logged</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-56 select-none font-sans"
        >
          {/* Horizontal Grid lines */}
          {gridWpmValues.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area gradient under Net WPM line */}
          <defs>
            <linearGradient id="netWpmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={netAreaPath} fill="url(#netWpmGrad)" />

          {/* Gross WPM Path */}
          <path
            d={`M ${grossPoints}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Net WPM Path */}
          <path
            d={`M ${netPoints}`}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Error burst indicators */}
          {errorPoints.map((p, idx) => (
            <circle
              key={idx}
              cx={getX(p.second)}
              cy={getY(p.netWpm)}
              r="3.5"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          ))}

          {/* Bottom X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Time axis labels */}
          <text
            x={padding.left}
            y={height - 10}
            fill="#64748b"
            fontSize="10"
            textAnchor="start"
            fontFamily="monospace"
          >
            00:00
          </text>
          <text
            x={padding.left + chartWidth / 2}
            y={height - 10}
            fill="#64748b"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {Math.floor(maxSec / 120)}:{(Math.floor(maxSec / 2) % 60).toString().padStart(2, '0')}
          </text>
          <text
            x={width - padding.right}
            y={height - 10}
            fill="#64748b"
            fontSize="10"
            textAnchor="end"
            fontFamily="monospace"
          >
            {Math.floor(maxSec / 60)}:{(maxSec % 60).toString().padStart(2, '0')}
          </text>
        </svg>
      </div>
    </div>
  );
};
