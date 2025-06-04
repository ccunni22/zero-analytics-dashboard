import React from "react";

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  cardId?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  children,
  className = "",
  icon,
  style,
  cardId,
}) => {
  return (
    <div
      className={`api-card ${className || ""}`}
      style={{
        flex: "1 1 0%",
        width: "100%",
        ...style,
      }}
      data-card-id={cardId}
    >
      {icon && <span className="mr-2 text-cyan-400">{icon}</span>}
      {title && (
        <div className="flex items-center gap-2 mb-2" style={{ gap: 8 }}>
          {icon && (
            <span
              className="text-cyan-400"
              style={{ fontSize: 14, display: "flex", alignItems: "center" }}
            >
              {icon}
            </span>
          )}
          <span
            className="uppercase text-left font-light tracking-widest text-[12px] text-[#E0F7FA]"
            style={{ letterSpacing: 1, textShadow: "0 0 8px #00E5FF" }}
          >
            {title}
          </span>
        </div>
      )}
      <div className="flex flex-col items-start w-full gap-2 text-[#B0BEC5]">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
