import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'cyan', // 'cyan' | 'emerald' | 'fuchsia' | 'indigo' | 'amber'
  trend,
}) => {
  const accentStyles = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      iconBg: 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40',
      shadow: 'hover:shadow-glow-cyan',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40',
      shadow: 'hover:shadow-glow-emerald',
    },
    fuchsia: {
      border: 'border-fuchsia-500/20 hover:border-fuchsia-500/50',
      iconBg: 'bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-800/40',
      shadow: 'hover:shadow-glow-fuchsia',
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/50',
      iconBg: 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40',
      shadow: 'hover:shadow-glow-indigo',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      iconBg: 'bg-amber-950/60 text-amber-400 border border-amber-800/40',
      shadow: 'hover:shadow-glow-amber',
    },
  }[accentColor] || {
    border: 'border-slate-800',
    iconBg: 'bg-slate-800 text-slate-300',
    shadow: '',
  };

  return (
    <div
      className={`glass-card p-5 border ${accentStyles.border} ${accentStyles.shadow} transition-all duration-300 relative overflow-hidden group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mt-1.5 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${accentStyles.iconBg} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">{trend.label}</span>
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
};
