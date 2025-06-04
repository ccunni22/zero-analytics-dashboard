import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "A", uv: 400, pv: 2400, amt: 2400 },
  { name: "B", uv: 300, pv: 1398, amt: 2210 },
  { name: "C", uv: 200, pv: 9800, amt: 2290 },
  { name: "D", uv: 278, pv: 3908, amt: 2000 },
  { name: "E", uv: 189, pv: 4800, amt: 2181 },
];

const TestRecharts: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: 300,
      border: "2px solid green",
      background: "rgba(255,255,255,0.2)",
    }}
  >
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="uv" stroke="#8884d8" />
        <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default TestRecharts;
