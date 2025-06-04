import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
  compact?: boolean;
  interactive?: boolean;
  showTitle?: boolean;
}

const defaultColors = [
  "#00E5FF", // Cyan
  "#1DE9B6", // Aqua green
  "#2979FF", // Neon blue
  "#7C4DFF", // Neon purple
  "#00B8D4", // Teal
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgba(16,24,39,0.95)] p-3 rounded-lg shadow-lg border border-[rgba(0,229,255,0.12)] backdrop-blur-[12px]">
        <p className="text-[#E0F7FA] font-medium">{payload[0].name}</p>
        <p className="text-[#00E5FF]">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  colors = defaultColors,
  interactive = false,
}) => {
  console.log("DonutChart data:", data); // Debug log
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const topIndex = data.findIndex(
    (d) => d.value === Math.max(...data.map((d) => d.value)),
  );

  if (!data || data.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-gray-400"
        style={{ minHeight: 120 }}
      >
        <span>No data to display</span>
      </div>
    );
  }

  // Neon glow and separation
  const getCellStyle = (index: number) => {
    return {
      stroke: "none",
      filter: "none",
      cursor: "pointer",
      zIndex: 1,
    } as React.CSSProperties;
  };

  // Custom label for percentage
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    // Position label just outside the arc, but closer to center
    const radius = outerRadius + 8;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null; // Hide very small slices
    return (
      <text
        x={x}
        y={y - 2}
        fill="#E0F7FA"
        fontSize={12}
        fontWeight={700}
        textAnchor={x > cx ? "start" : "end"}
        style={{
          textShadow: "0 0 8px #00E5FF, 0 0 2px #0ff",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          fontFamily: "Share Tech Mono, Consolas, monospace, Inter",
          opacity: 0.95,
        }}
        dominantBaseline="central"
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <div
      className="donut-chart-flex"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div style={{ flex: "none" }}>
        <div
          className="chart-container donut-container donut-chart"
          style={{
            width: "100%",
            height: 180,
            position: "relative",
            border: "none",
            borderRadius: 16,
            boxShadow: "none",
            background: "none",
            overflow: "visible",
            padding: 0,
            margin: 0,
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <defs>
                {/* Segment light gradient overlay */}
                <linearGradient id="segment-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                {/* Soft transparent donut core gradient */}
                <radialGradient id="donutCoreGradient" cx="50%" cy="50%" r="80%">
                  <stop
                    offset="0%"
                    stopColor="rgba(0,229,255,0.04)"
                    stopOpacity={0.04}
                  />
                  <stop
                    offset="60%"
                    stopColor="rgba(0,229,255,0.01)"
                    stopOpacity={0.01}
                  />
                  <stop offset="100%" stopColor="transparent" stopOpacity={0} />
                </radialGradient>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={56}
                padAngle={2}
                cornerRadius={3}
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
                filter="none"
                style={{
                  stroke: "none",
                  filter: "none",
                  outline: "none",
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    style={{
                      ...getCellStyle(index),
                      stroke: "none",
                      filter: "none",
                      outline: "none",
                    }}
                  />
                ))}
                {/* Overlay light gradient on top of each segment */}
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-gradient-${index}`}
                    fill="url(#segment-gradient)"
                    style={{
                      pointerEvents: "none",
                      mixBlendMode: "lighter",
                      stroke: "none",
                      filter: "none",
                      outline: "none",
                    }}
                  />
                ))}
              </Pie>
              {interactive && <Tooltip content={<CustomTooltip />} />}
              {/* Make donut core truly transparent */}
              <circle
                cx="50%"
                cy="50%"
                r="56"
                fill="transparent"
                opacity={1}
                style={{
                  filter: "none",
                  stroke: "none",
                  outline: "none",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="donut-legend">
        <ul>
          {data.map((entry, idx) => (
            <li key={entry.name}>
              <span
                className="label-color-dot"
                style={{ backgroundColor: colors[idx % colors.length] }}
              ></span>
              <span style={{ marginRight: 8 }}>{entry.name}</span>
              <span style={{ fontWeight: 600, color: '#00E5FF', marginLeft: 'auto' }}>
                ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DonutChart;
