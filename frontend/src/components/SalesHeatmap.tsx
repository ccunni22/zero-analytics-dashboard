import React from 'react';
import type { HeatmapData } from '../services/api';

interface Props {
  data: HeatmapData[];
  loading?: boolean;
}

const SalesHeatmap: React.FC<Props> = ({ data, loading = false }) => {
  // Generate placeholder data if no data exists
  const placeholderData = Array.from({ length: 24 * 7 }, (_, i) => ({
    day_of_week: Math.floor(i / 24),
    hour_of_day: i % 24,
    total_quantity: Math.floor(Math.random() * 10),
  }));

  const chartData = data.length > 0 ? data : placeholderData;

  // Group data by day and hour
  const heatmapData = Array.from({ length: 7 }, (_, day) => {
    const dayData = Array.from({ length: 24 }, (_, hour) => {
      const point = chartData.find(
        d => d.day_of_week === day && d.hour_of_day === hour
      );
      return point?.total_quantity || 0;
    });
    return dayData;
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getColor = (value: number) => {
    if (value === 0) return 'var(--color-bg-light)';
    const intensity = Math.min(value / 10, 1);
    return `rgba(0, 229, 255, ${intensity * 0.8})`;
  };

  return (
    <div className="chart-container h-[300px] overflow-auto">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        {/* Day labels */}
        <div className="flex flex-col justify-around h-full">
          {days.map((day, i) => (
            <div
              key={day}
              className="text-xs text-[var(--color-text-secondary)] text-right pr-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-cols-24 gap-1">
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex flex-col gap-1">
              {dayData.map((value, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className="w-4 h-4 rounded-sm transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: getColor(value),
                    boxShadow: value > 0 ? '0 0 6px rgba(0, 229, 255, 0.4)' : 'none',
                  }}
                  title={`${days[dayIndex]} ${hourIndex}:00 - ${value} orders`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hour labels */}
        <div className="col-span-2 grid grid-cols-24 gap-1 mt-2">
          {hours.map(hour => (
            <div
              key={hour}
              className="text-xs text-[var(--color-text-secondary)] text-center"
            >
              {hour}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesHeatmap; 