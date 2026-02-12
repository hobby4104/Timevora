
import React, { useState, useEffect, useRef } from 'react';
import { StudySession } from '../types';
import { getRecentTopics, removeRecentTopic } from '../utils/storage';

interface Props {
  onSessionComplete: (duration: number, topic?: string) => void;
  onSessionDelete: (id: string) => void;
  todaySessions: StudySession[];
  onTick?: (seconds: number) => void;
  activeSeconds?: number;
}

const FocusCard: React.FC<Props> = ({ onSessionComplete, onSessionDelete, todaySessions, onTick, activeSeconds = 0 }) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [focusText, setFocusText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime(prev => {
          const next = prev + 1;
          if (onTick) onTick(next);
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onTick]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartPause = () => {
    const nextState = !isActive;
    if (nextState) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
    setIsActive(nextState);
  };

  const handleStop = () => {
    if (time > 0) {
      onSessionComplete(time, focusText);
    }
    setIsActive(false);
    setTime(0);
    if (onTick) onTick(0);
    setFocusText('');
    setShowSuggestions(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleFocusInput = () => {
    const topics = getRecentTopics();
    if (topics.length > 0) {
      setRecentTopics(topics);
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (topic: string) => {
    setFocusText(topic);
    setShowSuggestions(false);
  };

  const handleDeleteSuggestion = (e: React.MouseEvent, topic: string) => {
    e.stopPropagation();
    removeRecentTopic(topic);
    const updated = recentTopics.filter(t => t !== topic);
    setRecentTopics(updated);
    if (updated.length === 0) setShowSuggestions(false);
  };

  const totalTodaySeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0) + activeSeconds;
  const displayTotalToday = formatDuration(totalTodaySeconds);

  return (
    <div className="glass-card h-full rounded-[40px] p-8 md:p-10 flex flex-col space-y-8 transition-all duration-500 overflow-hidden relative">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <span className="serif-heading text-[11px] uppercase tracking-[0.3em] text-orange-400 font-bold">Study Tracker</span>
        </div>
        <div className="bg-orange-950/20 border border-orange-500/10 rounded-full px-5 py-2 flex items-center gap-2.5 transition-all hover:bg-orange-900/30">
          <svg className="w-4 h-4 text-orange-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="serif-heading text-[11px] font-bold text-orange-300 drop-shadow-sm">{displayTotalToday}</span>
        </div>
      </div>

      <div className="flex flex-col items-center relative shrink-0" ref={dropdownRef}>
        <div className="relative inline-block w-full max-w-[240px] z-20">
          <input 
            type="text" 
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            onFocus={handleFocusInput}
            placeholder="What's the focus?"
            className="serif-heading text-xl text-center text-white placeholder-slate-700 bg-transparent border-none focus:ring-0 focus:outline-none w-full"
          />
          <div className="h-[1px] w-full bg-orange-900/50 mt-1" />
        </div>

        {showSuggestions && recentTopics.length > 0 && (
          <div className="absolute top-full mt-2 w-full max-w-[240px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-white/5 bg-white/5 text-left">
               <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold px-2">Recent Topics</p>
            </div>
            <div className="max-h-[160px] overflow-y-auto custom-scrollbar scrollbar-orange">
              {recentTopics.map((topic, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSuggestion(topic)}
                  className="flex justify-between items-center px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <span className="text-xs text-slate-300 truncate pr-4">{topic}</span>
                  <button 
                    onClick={(e) => handleDeleteSuggestion(e, topic)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                  >
                    <svg className="w-3 h-3 text-slate-500 hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center flex-1 min-h-[120px]">
        <div className="serif-heading text-7xl md:text-8xl font-bold text-orange-50/90 tracking-tighter leading-none drop-shadow-2xl">
          {formatTime(time)}
        </div>
      </div>

      <div className="flex gap-6 w-full justify-center items-center pb-2 shrink-0">
        <button 
          onClick={handleStartPause}
          className={`relative group flex items-center justify-center w-20 h-20 rounded-[28px] transition-all duration-300 transform active:scale-95 shadow-xl ${isActive ? 'bg-orange-600/20 text-orange-500 border border-orange-500/20' : 'bg-[#E65100] text-white'}`}
        >
          {isActive ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <>
              <div className="absolute inset-0 rounded-[28px] bg-orange-500 blur-2xl opacity-40 transition-opacity" />
              <svg className="w-9 h-9 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </>
          )}
        </button>

        <button 
          onClick={handleStop}
          className="flex items-center justify-center w-20 h-20 rounded-[28px] bg-orange-950/10 border border-orange-500/10 text-orange-200/40 hover:text-orange-300 transition-all duration-300 transform active:scale-95"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
             <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>

      {todaySessions.length > 0 && (
        <div className="pt-6 border-t border-white/5 h-32 overflow-y-auto custom-scrollbar scrollbar-orange shrink-0">
          <div className="space-y-3 pr-2">
            {todaySessions.slice().reverse().map((session, index) => (
              <div 
                key={session.id} 
                className="flex justify-between items-center bg-slate-800/20 p-3 rounded-xl border border-white/5 animate-in slide-in-from-left-4 duration-500"
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="text-xs text-slate-300 font-medium tracking-wide truncate">
                    {session.topic || 'Session'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="serif-heading text-[11px] font-bold text-white/70 tracking-wide">{formatDuration(session.duration)}</span>
                  <button 
                    onClick={() => onSessionDelete(session.id)}
                    className="p-1 text-slate-700 hover:text-rose-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusCard;
