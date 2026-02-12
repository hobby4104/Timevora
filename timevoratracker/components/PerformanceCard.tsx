
import React, { useMemo, useEffect, useRef } from 'react';
import { StudySession, Task } from '../types';

interface Props {
  sessions: StudySession[];
  tasks?: Task[];
  targetMinutes: number;
  activeSeconds?: number;
}

const PerformanceCard: React.FC<Props> = ({ sessions, tasks = [], targetMinutes, activeSeconds = 0 }) => {
  const hasPlayed100 = useRef(false);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const dailyTotals: Record<string, number> = {};
    sessions.forEach(s => {
      dailyTotals[s.date] = (dailyTotals[s.date] || 0) + s.duration;
    });

    const historicalDates = Object.keys(dailyTotals).filter(d => d !== todayStr);
    const maxHistoricalSeconds = historicalDates.length > 0 
      ? Math.max(...historicalDates.map(d => dailyTotals[d]))
      : targetMinutes * 60;

    const todayCompletedSeconds = sessions
      .filter(s => s.date === todayStr)
      .reduce((acc, s) => acc + s.duration, 0);
    const todayTotalSeconds = todayCompletedSeconds + activeSeconds;

    const efficiencyDecimal = todayTotalSeconds / (maxHistoricalSeconds || 1);
    const efficiencyPercent = Math.floor(efficiencyDecimal * 100);

    const baseBarWidth = Math.min(efficiencyDecimal * 100, 100);
    const overdriveBarWidth = efficiencyDecimal > 1 
      ? Math.min(((efficiencyDecimal - 1) / 2) * 100, 100)
      : 0;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = sessions.filter(s => new Date(s.date) >= startOfWeek);
    const totalWeekSeconds = weekSessions.reduce((acc, s) => acc + s.duration, 0) + activeSeconds;
    
    const daysSet = new Set(weekSessions.map(s => s.date));
    if (activeSeconds > 0) daysSet.add(todayStr);
    const daysStudied = daysSet.size;

    const weekDailyTotals: Record<string, number> = {};
    weekSessions.forEach(s => {
      weekDailyTotals[s.date] = (weekDailyTotals[s.date] || 0) + s.duration;
    });
    weekDailyTotals[todayStr] = (weekDailyTotals[todayStr] || 0) + activeSeconds;
    
    const highestDayThisWeekSeconds = Object.values(weekDailyTotals).length > 0
      ? Math.max(...Object.values(weekDailyTotals))
      : 0;

    const formatDualUnit = (totalSecs: number) => {
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = Math.floor(totalSecs % 60);
      
      if (h > 0) {
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      if (m > 0) {
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
      }
      return `${s}s`;
    };

    return {
      totalWeek: formatDualUnit(totalWeekSeconds),
      avg: formatDualUnit(Math.round(totalWeekSeconds / (daysStudied || 1))),
      consistency: `${daysStudied}`,
      bestThisWeek: formatDualUnit(highestDayThisWeekSeconds),
      efficiency: efficiencyPercent,
      baseBarWidth,
      overdriveBarWidth,
      isNewRecord: todayTotalSeconds > maxHistoricalSeconds && historicalDates.length > 0,
    };
  }, [sessions, targetMinutes, activeSeconds]);

  // Sound logic for efficiency hitting 100%
  useEffect(() => {
    if (stats.efficiency >= 100 && !hasPlayed100.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
      hasPlayed100.current = true;
    } else if (stats.efficiency < 100) {
      hasPlayed100.current = false;
    }
  }, [stats.efficiency]);

  return (
    <div className="glass-card h-full rounded-[40px] p-10 flex flex-col justify-between space-y-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zM7 7v2h14V7H7z" />
          </svg>
          <h3 className="serif-heading text-[13px] uppercase tracking-[0.3em] text-slate-300 font-bold">Performance</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-10 gap-x-4 flex-1">
        <StatRow label="Total Week" value={stats.totalWeek} />
        <StatRow label="Avg / Day" value={stats.avg} />
        <StatRow label="Consistency" value={stats.consistency} subValue="/ 7 Days" />
        <StatRow label="Best This Week" value={stats.bestThisWeek} prefix="🏆" />
      </div>

      <div className="bg-indigo-950/20 rounded-[24px] p-5 relative overflow-hidden">
        <div className="flex items-center justify-center gap-3 relative z-10">
          <svg className={`w-5 h-5 transition-colors duration-500 ${stats.isNewRecord ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className={`serif-heading text-[11px] uppercase tracking-[0.3em] font-bold transition-colors duration-500 ${stats.isNewRecord ? 'text-emerald-400' : 'text-slate-300'}`}>
            Efficiency: {stats.efficiency}% 
            {stats.isNewRecord && <span className="ml-2 text-[8px] animate-bounce inline-block">New Record!</span>}
          </span>
        </div>
        
        <div className="mt-4 h-2 w-full bg-slate-800/50 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500 rounded-full"
            style={{ width: `${stats.baseBarWidth}%` }}
          />
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${stats.overdriveBarWidth}%` }}
          />
        </div>

        <div className="mt-2 text-center">
          <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">
            Based on personal best daily record (300% Elite Capacity)
          </span>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, subValue, prefix }: { label: string, value: string, subValue?: string, prefix?: string }) => (
  <div className="flex flex-col space-y-3">
    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">{label}</span>
    <div className="flex items-baseline gap-2">
      {prefix && <span className="text-xl leading-none mr-1 opacity-80">{prefix}</span>}
      <span className="serif-heading text-3xl font-bold text-white leading-none tracking-tight">{value}</span>
      {subValue && <span className="text-[11px] font-bold text-indigo-400/50 uppercase tracking-tighter">{subValue}</span>}
    </div>
  </div>
);

export default PerformanceCard;
