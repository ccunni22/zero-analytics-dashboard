import React from 'react';

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  expanded?: boolean;
  className?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, expanded = false, className = '', icon, style }) => (
  <div className={`dashboard-card ${className || ''}`} style={{
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 8px 30px rgba(0,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    ...style
  }}>
    {icon && <span className="mr-2 text-cyan-400">{icon}</span>}
    {title && (
      <div className="flex items-center gap-2 mb-2" style={{gap: 8}}>
        {icon && <span className="text-cyan-400" style={{fontSize: 14, display: 'flex', alignItems: 'center'}}>{icon}</span>}
        <span className="uppercase text-left font-light tracking-widest text-[12px] text-[#E0F7FA]" style={{ letterSpacing: 1, textShadow: '0 0 8px #00E5FF' }}>{title}</span>
      </div>
    )}
    <div className="flex flex-col items-start w-full gap-2 text-[#B0BEC5]">{children}</div>
  </div>
);

export default DashboardCard; 