import React from "react";

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="dashboard-bg">
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "2rem",
        alignItems: "stretch",
      }}
    >
      {children}
    </div>
  </div>
);

export default DashboardLayout;
