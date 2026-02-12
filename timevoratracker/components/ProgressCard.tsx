
import React, { useState, useEffect, useRef } from 'react';
import { StudySession, Settings } from '../types';

interface Props {
  sessions: StudySession[];
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onMarkDone: () => void;
  activeSeconds?: number;
}

const ProgressCard: React.FC<Props> = ({ sessions, settings, onSettingsChange, onMarkDone, activeSeconds = 0 }) => {
  const today = new Date().toISOString().split('T')[0];
  const manualTopic = "Goal Completed Manually";
  
  const [localTarget, setLocalTarget] = useState(settings.dailyTargetMinutes.toString());
  const hasPlayed100 = useRef(false);

  useEffect(() => {
    setLocalTarget(settings.dailyTargetMinutes.toString());
  }, [settings.dailyTargetMinutes]);

  const todaySessions = sessions.filter(s => s.date === today);
  const isManuallyCompleted = todaySessions.some(s => s.topic === manualTopic);
  
  const todaySeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0) + activeSeconds;
  const todayMinutes = todaySeconds / 60;
  
  const totalPercentage = settings.dailyTargetMinutes > 0 
    ? Math.round((todayMinutes / settings.dailyTargetMinutes) * 100) 
    : 0;

  // Sound logic for hitting 100%
  useEffect(() => {
    if (totalPercentage >= 100 && !hasPlayed100.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      hasPlayed100.current = true;
    } else if (totalPercentage < 100) {
      hasPlayed100.current = false;
    }
  }, [totalPercentage]);

  const baseBarWidth = Math.min(totalPercentage, 100);
  const overdriveBarWidth = totalPercentage > 100 
    ? Math.min(((totalPercentage - 100) / 200) * 100, 100) 
    : 0;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setLocalTarget('');
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed >= 1) {
      setLocalTarget(parsed.toString());
      onSettingsChange({ 
        ...settings, 
        dailyTargetMinutes: parsed 
      });
    } else if (parsed === 0) {
      setLocalTarget('0');
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(localTarget);
    if (isNaN(parsed) || parsed < 1) {
      onSettingsChange({ ...settings, dailyTargetMinutes: 1 });
      setLocalTarget('1');
    } else {
      setLocalTarget(parsed.toString());
    }
  };

  const isNaturallyCompleted = !isManuallyCompleted && totalPercentage >= 100;

  return (
    <div className="glass-card h-full rounded-[40px] p-10 flex flex-col justify-between space-y-6 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-20 transition-all duration-1000 ${totalPercentage >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} />

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="serif-heading text-[13px] uppercase tracking-[0.3em] text-slate-300 font-bold">Daily Progress</h3>
        </div>
        <div className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all duration-500 ${totalPercentage >= 100 ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-purple-900/30 text-purple-300 border-purple-500/10'}`}>
          {totalPercentage >= 100 ? (isManuallyCompleted ? 'Manual Complete' : totalPercentage >= 300 ? 'Legendary Study' : totalPercentage >= 200 ? 'Elite Performance' : 'Achieved') : 'Ongoing'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 relative z-10">
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Target Session</span>
          <div className="flex items-center gap-2 group/input">
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl py-1 px-4 flex items-center focus-within:border-purple-500/30 transition-all">
              <input 
                type="number"
                value={localTarget}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="bg-transparent serif-heading text-4xl font-bold text-white text-center w-20 focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <span className="serif-heading text-[12px] uppercase tracking-widest text-slate-500 font-bold">m</span>
          </div>
        </div>

        <div className="flex flex-col space-y-1 text-right items-end justify-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Completion</span>
          <div className="flex items-baseline gap-1">
             <span className="serif-heading text-6xl font-bold text-white leading-none tracking-tighter">{totalPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
        <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-purple-600 to-indigo-500"
            style={{ width: `${baseBarWidth}%` }}
          />
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${overdriveBarWidth}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-bold tracking-widest text-slate-500 uppercase">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${totalPercentage >= 300 ? 'bg-emerald-400 animate-pulse' : totalPercentage >= 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} />
            <span>{formatDuration(todaySeconds)} studied today</span>
          </div>
          <span>{totalPercentage >= 100 ? (totalPercentage >= 300 ? 'Limit Reached' : 'Overdrive active') : `Goal ${settings.dailyTargetMinutes}m`}</span>
        </div>
      </div>

      <div className="flex justify-end items-center relative z-10">
        <button 
          onClick={onMarkDone}
          disabled={isNaturallyCompleted}
          className={`py-2 px-5 rounded-2xl flex items-center gap-2 transition-all border shadow-lg transform active:scale-95 ${
            isNaturallyCompleted 
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 opacity-50 cursor-not-allowed' 
              : isManuallyCompleted
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-200 hover:bg-orange-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <div className={`w-3 h-3 rounded-full border transition-colors ${
            isNaturallyCompleted ? 'bg-emerald-400 border-emerald-400' : 
            isManuallyCompleted ? 'bg-orange-400 border-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]' : 'border-slate-500'
          }`} />
          <span className="serif-heading text-[10px] uppercase tracking-[0.25em] font-bold">
            {isNaturallyCompleted ? 'Achieved' : isManuallyCompleted ? 'Restore Record' : 'Mark Done'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProgressCard;
