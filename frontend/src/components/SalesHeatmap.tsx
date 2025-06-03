import React, { useState } from 'react';
// import {
//   ResponsiveContainer,
//   ScatterChart,
//   XAxis,
//   YAxis,
//   ZAxis,
//   Tooltip,
//   Scatter
// } from 'recharts';
import type { HeatmapData } from '../services/api';
import { format, parseISO } from 'date-fns';

interface Props {
  data: HeatmapData[];
  interactive?: boolean;
}

// Color scale for value ranges
const COLOR_SCALE = [
  { min: 126, color: '#5ecbfa' }, // soft blue
  { min: 76, color: '#b8c7d1' }, // cool gray
  { min: 31, color: '#e3eaf3' }, // lightest
  { min: 0, color: '#22304a' },  // card bg
];

function getColor(value: number) {
  for (const { min, color } of COLOR_SCALE) {
    if (value >= min) return color;
  }
  return COLOR_SCALE[COLOR_SCALE.length - 1].color;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12AM';
  if (i < 12) return `${i}AM`;
  if (i === 12) return '12PM';
  return `${i - 12}PM`;
});

const SalesHeatmap: React.FC<Props> = ({ data, interactive = false }) => {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; hour: number; value: number } | null>(null);

  // Defensive: If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="text-lg text-gray-300 mt-8">No heatmap data available for the selected date range.</div>
      </div>
    );
  }
  // Get all unique days in the data, sorted
  const uniqueDays = Array.from(new Set(data.map(d => d.date))).sort();
  // Build a grid: rows = days, cols = 24 hours
  const grid: number[][] = uniqueDays.map(day => Array(24).fill(0));
  data.forEach(({ date, hour_of_day, total_quantity }) => {
    const rowIdx = uniqueDays.indexOf(date);
    if (rowIdx !== -1 && hour_of_day >= 0 && hour_of_day < 24) {
      grid[rowIdx][hour_of_day] = total_quantity;
    }
  });

  return (
    <div className="w-full h-full flex flex-col items-start justify-center relative">
      <div className="w-full max-w-2xl mx-auto">
        {/* Unified scrollable grid with axes */}
        <div className="overflow-auto border border-[rgba(255,255,255,0.08)] rounded-[8px] bg-[rgba(255,255,255,0.03)]" style={{ maxHeight: 400, maxWidth: '100%' }}>
          <table className="border-collapse min-w-max">
            <thead>
              <tr>
                <th className="bg-[#111827]" style={{ width: 80, minWidth: 80, height: 32 }}></th>
                {HOUR_LABELS.map((h, i) => (
                  <th key={h} className="text-xs text-cyan-300 font-normal bg-[#111827] text-left" style={{ width: 24, minWidth: 24, height: 32 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueDays.map((date, rowIdx) => (
                <tr key={date}>
                  <td className="text-xs text-cyan-200 pr-2 bg-[#111827] text-left" style={{ width: 80, minWidth: 80, height: 24 }}>{date ? format(parseISO(date), 'EEE, MMM d') : 'Invalid date'}</td>
                  {grid[rowIdx].map((value, colIdx) => (
                    <td key={colIdx} style={{ padding: 0, width: 24, minWidth: 24, height: 24 }}>
                      <div
                        className={`rounded-md inline-block ${interactive ? 'cursor-pointer hover:ring-2 hover:ring-accent' : ''}`}
                        style={{ 
                          width: 24, 
                          height: 24, 
                          background: getColor(value),
                          transition: 'all 0.3s ease',
                          transform: hoveredCell?.date === date && hoveredCell?.hour === colIdx ? 'scale(1.1)' : 'scale(1)'
                        }}
                        onMouseEnter={() => interactive && setHoveredCell({ date, hour: colIdx, value })}
                        onMouseLeave={() => interactive && setHoveredCell(null)}
                        title={interactive ? undefined : `${format(parseISO(date), 'EEE, MMM d')} ${HOUR_LABELS[colIdx]}: ${value}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex justify-start gap-4 mt-4">
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-md" style={{ background: COLOR_SCALE[3].color }}></span><span className="text-xs text-cyan-200">≤30</span></div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-md" style={{ background: COLOR_SCALE[2].color }}></span><span className="text-xs text-cyan-200">31-75</span></div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-md" style={{ background: COLOR_SCALE[1].color }}></span><span className="text-xs text-cyan-200">76-125</span></div>
          <div className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-md" style={{ background: COLOR_SCALE[0].color }}></span><span className="text-xs text-cyan-200">&gt;125</span></div>
        </div>
        {/* Interactive Tooltip */}
        {interactive && hoveredCell && (
          <div 
            className="absolute bg-[rgba(16,24,39,0.95)] border border-[rgba(0,229,255,0.12)] rounded-[8px] p-3 shadow-[0_4px_24px_0_rgba(0,229,255,0.12)] backdrop-blur-[12px]"
            style={{
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px',
              zIndex: 1000
            }}
          >
            <div className="font-medium text-[#E0F7FA]">{format(parseISO(hoveredCell.date), 'EEE, MMM d')}</div>
            <div className="text-cyan-200">{HOUR_LABELS[hoveredCell.hour]}</div>
            <div className="text-[#00E5FF] font-medium">{hoveredCell.value} items</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHeatmap; 