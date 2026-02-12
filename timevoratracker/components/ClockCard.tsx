
import React, { useState, useEffect } from 'react';

const ClockCard: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="glass-card h-full rounded-[40px] p-8 md:p-10 flex flex-col items-center justify-center space-y-10 md:space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-3 self-start ml-2 md:ml-4">
        <svg className="w-5 h-5 md:w-6 md:h-6 text-indigo-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="serif-heading text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">Live Clock</span>
      </div>

      {/* Time Display */}
      <div className="relative flex items-baseline justify-center">
        {/* Responsive font sizing for the clock - boosted for desktop 60% container */}
        <div className="serif-heading text-[3.8rem] sm:text-[4.5rem] lg:text-[5.5rem] font-bold text-white tracking-tight leading-none tabular-nums">
          {hours}:{minutes}
        </div>
        
        {/* Seconds block: sits lower to the baseline */}
        <div className="absolute left-full bottom-[4px] ml-2">
          <span className="text-2xl md:text-3xl text-white/10 font-medium tabular-nums leading-none">
            {seconds}
          </span>
        </div>
      </div>

      {/* Date Pill */}
      <div className="bg-indigo-950/30 border border-indigo-500/10 rounded-full px-8 md:px-12 py-3 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
        <span className="serif-heading text-[11px] md:text-[13px] uppercase tracking-[0.3em] text-indigo-300 font-bold whitespace-nowrap">
          {time.toLocaleDateString([], { weekday: 'long' })} {time.getDate()} {time.toLocaleDateString([], { month: 'short' })}
        </span>
      </div>
    </div>
  );
};

export default ClockCard;
