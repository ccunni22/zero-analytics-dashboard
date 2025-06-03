import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number }[];
  title: string;
  colors?: string[];
  compact?: boolean;
  interactive?: boolean;
  showTitle?: boolean;
}

const defaultColors = [
  '#00E5FF', // Cyan
  '#1DE9B6', // Aqua green
  '#2979FF', // Neon blue
  '#82B1FF', // Sky blue
  '#00CFFF'  // Bright cyan
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

const DonutChart: React.FC<DonutChartProps> = ({ data, colors = defaultColors, interactive = false }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {interactive && <Tooltip content={<CustomTooltip />} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart; 