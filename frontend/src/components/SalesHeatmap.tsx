import React, { useState, useEffect } from "react";
import type { HeatmapData } from "../services/api";
import { format, parseISO } from "date-fns";

interface Props {
  data: HeatmapData[];
  loading?: boolean;
  days: string[]; // Array of date strings for Y-axis
}

const SalesHeatmap: React.FC<Props> = ({ data, loading = false, days }) => {
  const [maxValue, setMaxValue] = useState(0);

  useEffect(() => {
    console.log('Raw heatmap data received:', data);
    console.log('Data length:', data.length);
    
    if (!data || data.length === 0) {
      console.warn('No data received for heatmap');
      return;
    }

    // Process the data
    const processedData = data.map(item => {
      const date = new Date(item.date);
      return {
        day: date.getDay(), // 0-6 (Sunday-Saturday)
        hour: item.hour_of_day,
        value: item.total_sales
      };
    });

    console.log('Processed data:', processedData);
    console.log('Number of data points:', processedData.length);

    // Calculate max value for color scaling
    const max = Math.max(...processedData.map(d => d.value));
    console.log('Max value for color scaling:', max);
    setMaxValue(max);
  }, [data]);

  // Debug logging
  useEffect(() => {
    console.log("SalesHeatmap received data:", {
      dataLength: data.length,
      sampleData: data.slice(0, 3),
      days,
      daysLength: days.length,
      expectedDataPoints: days.length * 24,
    });
  }, [data, days]);

  // Generate placeholder data if no data exists
  const placeholderData = Array.from({ length: 24 * days.length }, (_, i) => ({
    day_index: Math.floor(i / 24),
    hour_of_day: i % 24,
    total_sales: Math.floor(Math.random() * 1000),
  }));

  // Only declare chartData once
  const chartData = data.length > 0 ? data : placeholderData;
  console.log("Chart data sample:", {
    sample: chartData.slice(0, 3),
    totalPoints: chartData.length,
    expectedPoints: days.length * 24,
    hasData: data.length > 0,
  });

  // Group data by day and hour (now by date string)
  const heatmapData = days.map((dateStr, dayIdx) => {
    const dayData = Array.from({ length: 24 }, (_, hour) => {
      const point = chartData.find(
        (d) => d.date === dateStr && d.hour_of_day === hour,
      );
      const sales = point?.total_sales || 0;
      // Ensure sales is a number
      return typeof sales === 'number' ? sales : parseFloat(sales);
    });
    return dayData;
  });
  console.log("Processed heatmap data sample:", {
    sample: heatmapData.slice(0, 2),
    totalDays: heatmapData.length,
    expectedDays: days.length,
    firstDayDataPoints: heatmapData[0]?.length || 0,
    expectedDataPointsPerDay: 24,
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    hour: number;
    value: number;
  } | null>(null);
  
  const getHeatmapColor = (value: number, max: number) => {
    // Custom gradient: Low (#0a1120), Medium (#00E5FF), High (#1DE9B6), Max (#FF6B81)
    if (max === 0) return "#0a1120";
    const pct = value / max;
    if (pct === 0) return "#0a1120";
    if (pct < 0.25) {
      // Interpolate between #0a1120 and #00E5FF
      const t = pct / 0.25;
      return `rgb(${10 + t * (0 - 10)}, ${17 + t * (229 - 17)}, ${32 + t * (255 - 32)})`;
    } else if (pct < 0.5) {
      // Interpolate between #00E5FF and #1DE9B6
      const t = (pct - 0.25) / 0.25;
      return `rgb(${0 + t * (29 - 0)}, ${229 + t * (233 - 229)}, ${255 + t * (182 - 255)})`;
    } else {
      // Interpolate between #1DE9B6 and #FF6B81
      const t = (pct - 0.5) / 0.5;
      return `rgb(${29 + t * (255 - 29)}, ${233 + t * (107 - 233)}, ${182 + t * (129 - 182)})`;
    }
  };

  const formatTooltipContent = (date: string, hour: number, value: number) => {
    const formattedDate = format(parseISO(date), "MMM d, yyyy");
    const formattedHour = hour === 0 ? "12 AM" : 
                         hour === 12 ? "12 PM" : 
                         hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    return (
      <div style={{ lineHeight: 1.4 }}>
        <div>{formattedDate} — {formattedHour}</div>
        <div style={{ color: "#00E5FF", fontWeight: 600 }}>${value.toFixed(2)}</div>
      </div>
    );
  };

  // Add container ref
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Helper to position tooltip next to cursor
  const showTooltip = (e: React.MouseEvent, day: string, hourIdx: number, value: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const relX = e.clientX - (containerRect?.left || 0) + 16; // 16px right of cursor
    const relY = e.clientY - (containerRect?.top || 0) + 4;   // 4px below cursor
    setTooltip({
      x: relX,
      y: relY,
      date: day,
      hour: hourIdx,
      value: value
    });
  };

  return (
    <div
      className="sales-heatmap-container"
      ref={containerRef}
      style={{ 
        width: "100%", 
        height: "100%", 
        position: "relative",
        paddingLeft: "16px",
        paddingRight: "16px",
        boxSizing: "border-box",
        maxWidth: "98%",
        margin: "0 auto"
      }}
    >
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(10px, -10px)"
          }}
        >
          {formatTooltipContent(tooltip.date, tooltip.hour, tooltip.value)}
        </div>
      )}
      <div
        className="sales-heatmap-scroll-wrapper"
        style={{
          maxHeight: "280px",
          overflowY: "auto",
          paddingRight: 8,
          scrollBehavior: "smooth",
          borderRadius: 14,
          background: "rgba(16,24,39,0.85)",
          boxSizing: "border-box",
        }}
      >
        {/* Fixed Hour labels */}
        <div
          className="grid bg-transparent w-full sticky top-0 z-20"
          style={{
            gridTemplateColumns: `80px repeat(24, 1fr)`,
            width: "100%",
            marginBottom: 4,
            boxSizing: "border-box",
            background: "rgba(16,24,39,0.95)",
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          }}
        >
          <div />
          {hours.map((hour) => (
            <div
              key={`hour-label-${hour}`}
              className="text-xs text-[var(--color-text-secondary)] text-center flex items-center justify-center"
            >
              {hour}
            </div>
          ))}
        </div>
        {/* Heatmap grid with Y-axis labels and cells */}
        <div
          className="grid w-full heatmap-chart"
          style={{
            gridTemplateRows: `repeat(${days.length}, 1fr)`,
            gridTemplateColumns: `80px repeat(24, 1fr)`,
            width: "100%",
            padding: "8px",
            boxSizing: "border-box",
            position: "relative",
            gap: "2px",
            paddingBottom: 32,
            marginBottom: 0,
          }}
        >
          {days.map((day, dayIdx) => (
            <React.Fragment key={day}>
              {/* Restore previous Y-axis date label style */}
              <div
                className="text-xs y-axis-label pr-2 flex items-center justify-start"
                style={{
                  gridRow: dayIdx + 1,
                  gridColumn: 1,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#00E5FF",
                  letterSpacing: 0.4,
                  textAlign: "left",
                  paddingLeft: 6,
                  padding: "2px 0",
                }}
              >
                {format(parseISO(day), "MM-dd-yy")}
              </div>
              {/* Heatmap squares for this day */}
              {heatmapData[dayIdx].map((value, hourIdx) => {
                const color = getHeatmapColor(value, maxValue);
                const opacity =
                  value === 0 ? 0.12 : value < maxValue * 0.1 ? 0.3 : 0.8;
                return (
                  <div
                    key={`cell-${dayIdx}-${hourIdx}`}
                    className="hover:scale-110 cell-row"
                    style={{
                      gridRow: dayIdx + 1,
                      gridColumn: hourIdx + 2,
                      background: color,
                      opacity,
                      borderRadius: 4,
                      border: "1px solid rgba(255,255,255,0.05)",
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      cursor: "pointer",
                      margin: 0,
                      marginBottom: 2, // Tighter vertical spacing
                    }}
                    onMouseEnter={(e) => {
                      showTooltip(e, day, hourIdx, value);
                    }}
                    onMouseMove={(e) => {
                      showTooltip(e, day, hourIdx, value);
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </React.Fragment>
          ))}
          {/* Grid lines (vertical) */}
          {hours.map(
            (_, i) =>
              i > 0 && (
                <div
                  key={`vline-${i}`}
                  style={{
                    gridColumn: i + 2,
                    gridRow: `1 / span ${days.length}`,
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              ),
          )}
          {/* Grid lines (horizontal) */}
          {days.map(
            (_, i) =>
              i > 0 && (
                <div
                  key={`hline-${i}`}
                  style={{
                    gridRow: i + 1,
                    gridColumn: "2 / span 24",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              ),
          )}
        </div>
        {/* Legend */}
        <div
          style={{
            position: "relative",
            right: 0,
            bottom: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 10, color: "#90A4AE" }}>Low</span>
          <div
            style={{
              width: 80,
              height: 10,
              borderRadius: 5,
              background:
                "linear-gradient(90deg, #0a1120 0%, #00E5FF 33%, #1DE9B6 66%, #FF6B81 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <span style={{ fontSize: 10, color: "#90A4AE" }}>High</span>
        </div>
      </div>
    </div>
  );
};

export default SalesHeatmap;
