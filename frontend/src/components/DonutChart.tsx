import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DonutChartProps {
  data: { name: string; value: number }[];
  title: string;
  subtitle?: string;
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

const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  title, 
  subtitle, 
  colors = defaultColors, 
  compact = false, 
  interactive = false,
  showTitle = true 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="donut-card w-full h-full flex flex-col">
      {showTitle && (
        <div className="flex items-center gap-2 mb-3 w-full">
          <span className="text-cyan-400 flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </span>
          <h3 
            className="uppercase text-left font-light tracking-widest text-[12px] text-[#E0F7FA]" 
            style={{ 
              letterSpacing: 1, 
              textShadow: '0 0 8px #00E5FF' 
            }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="w-full h-full flex flex-col flex-1 justify-between">
        {/* Chart Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 flex justify-center items-center p-4">
            <ResponsiveContainer width={compact ? 128 : 160} height={compact ? 128 : 160}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={compact ? 30 : 48}
                  outerRadius={compact ? 38 : 56}
                  label={false}
                  labelLine={false}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={0}
                  stroke="#101827"
                  strokeWidth={8}
                  paddingAngle={2}
                >
                  {data.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={colors[idx % colors.length]}
                      className="transition-all duration-300 ease-in-out hover:opacity-80 cursor-pointer"
                      style={{ 
                        filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.3))',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.filter = 'drop-shadow(0 0 6px rgba(0,255,255,0.6))';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.filter = 'drop-shadow(0 0 8px rgba(0,229,255,0.3))';
                      }}
                    />
                  ))}
                </Pie>
                {interactive && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend Container - Hidden in compact mode and with CSS on small screens */}
          {!compact && (
            <div className="donut-legend mt-2 px-4 pb-4">
              <div className="max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((item, idx) => (
                  <div 
                    key={item.name} 
                    className="flex items-center gap-2 text-xs text-[#E0F7FA] transition-all duration-300 ease-in-out hover:text-[#00E5FF] mb-1"
                    style={{ wordBreak: 'break-word', fontSize: '12px' }}
                  >
                    <span 
                      className="inline-block w-2 h-2 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ 
                        background: colors[idx % colors.length],
                        boxShadow: '0 0 8px rgba(0,229,255,0.3)'
                      }}
                    />
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="font-bold text-[#E0F7FA] whitespace-nowrap">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonutChart; 