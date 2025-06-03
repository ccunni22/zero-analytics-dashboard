import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  title, 
  colors = defaultColors, 
  compact = false, 
  interactive = false,
  showTitle = true 
}) => {
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
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
                onMouseEnter={e => ((e.target as SVGElement).style.filter = 'drop-shadow(0 0 6px rgba(0,255,255,0.6))')}
                onMouseLeave={e => ((e.target as SVGElement).style.filter = 'drop-shadow(0 0 8px rgba(0,229,255,0.3))')}
              />
            ))}
          </Pie>
          <Tooltip
            labelFormatter={(value) => {
              const entry = data.find(d => d.value === value);
              return entry ? entry.name : value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart; 