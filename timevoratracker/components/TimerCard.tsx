
import React, { useState, useEffect, useRef } from 'react';
import { StudySession } from '../types';
import { getRecentTopics, removeRecentTopic } from '../utils/storage';

const PRESETS_STUDY = [25, 45, 60, 90];
const PRESETS_BREAK = [5, 10, 15, 30];

interface Props {
  onSessionComplete: (duration: number, topic?: string) => void;
  onTick?: (seconds: number) => void;
  todaySessions?: StudySession[];
  activeSeconds?: number;
}

const TimerCard: React.FC<Props> = ({ onSessionComplete, onTick, todaySessions = [], activeSeconds = 0 }) => {
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [minutes, setMinutes] = useState(25);
  const [localMinutes, setLocalMinutes] = useState('25');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSetting, setIsSetting] = useState(true);
  const [topic, setTopic] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (mode === 'study' && onTick) {
            onTick(minutes * 60 - next);
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, minutes, onTick]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleComplete = () => {
    setIsActive(false);
    setIsComplete(true);
    
    const soundUrl = mode === 'study' 
      ? 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'
      : 'https://assets.mixkit.co/active_storage/sfx/1011/1011-preview.mp3';
    
    const audio = new Audio(soundUrl);
    audio.volume = 0.6;
    audio.play().catch(() => {});
    
    if (mode === 'study') {
      const durationSeconds = minutes * 60;
      onSessionComplete(durationSeconds, topic || 'Timer Study Session');
      setTopic('');
    }

    setTimeout(() => {
      alert(`${mode === 'study' ? 'Study' : 'Break'} session complete!`);
      resetTimer();
      setIsComplete(false);
    }, 100);
  };

  const handleStopAndSave = () => {
    const elapsedSeconds = minutes * 60 - timeLeft;
    if (mode === 'study' && elapsedSeconds > 0) {
      onSessionComplete(elapsedSeconds, topic || 'Timer Study Session');
      setTopic('');
    }
    resetTimer();
  };

  const startTimer = () => {
    if (isSetting) {
      const finalMins = parseInt(localMinutes) || minutes;
      setTimeLeft(finalMins * 60);
      setMinutes(finalMins);
      setIsSetting(false);
      if (mode === 'study' && onTick) onTick(0);
    }
    setIsActive(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsSetting(true);
    setIsComplete(false);
    setTimeLeft(minutes * 60);
    setLocalMinutes(minutes.toString());
    if (onTick) onTick(0);
    setShowSuggestions(false);
  };

  const handleModeChange = (newMode: 'study' | 'break') => {
    if (isActive) {
      if (!confirm("Switching modes will reset your current timer. Continue?")) return;
    }
    setMode(newMode);
    const defaultMins = newMode === 'study' ? 25 : 5;
    setMinutes(defaultMins);
    setLocalMinutes(defaultMins.toString());
    setTimeLeft(defaultMins * 60);
    setIsActive(false);
    setIsSetting(true);
    setIsComplete(false);
    if (onTick) onTick(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setLocalMinutes('');
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setLocalMinutes(parsed.toString());
      if (parsed >= 1 && isSetting) {
        setMinutes(parsed);
        setTimeLeft(parsed * 60);
      }
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(localMinutes);
    if (isNaN(parsed) || parsed < 1) {
      const fallback = mode === 'study' ? 25 : 5;
      setMinutes(fallback);
      setLocalMinutes(fallback.toString());
      setTimeLeft(fallback * 60);
    } else {
      const validM = Math.min(999, parsed);
      setMinutes(validM);
      setLocalMinutes(validM.toString());
      setTimeLeft(validM * 60);
    }
  };

  const handlePresetClick = (p: number) => {
    setMinutes(p);
    setLocalMinutes(p.toString());
    if (isSetting) setTimeLeft(p * 60);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleFocusTopic = () => {
    const topics = getRecentTopics();
    if (topics.length > 0) {
      setRecentTopics(topics);
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (suggested: string) => {
    setTopic(suggested);
    setShowSuggestions(false);
  };

  const handleDeleteSuggestion = (e: React.MouseEvent, suggested: string) => {
    e.stopPropagation();
    removeRecentTopic(suggested);
    const updated = recentTopics.filter(t => t !== suggested);
    setRecentTopics(updated);
    if (updated.length === 0) setShowSuggestions(false);
  };

  const progress = isSetting ? 100 : (timeLeft / (minutes * 60)) * 100;
  
  const totalTodaySeconds = mode === 'study' 
    ? todaySessions.reduce((acc, s) => acc + s.duration, 0) + activeSeconds 
    : 0;

  return (
    <div className={`glass-card h-full rounded-[40px] p-10 flex flex-col space-y-8 transition-all duration-500 overflow-hidden relative border-t ${mode === 'study' ? 'border-purple-500/10' : 'border-emerald-500/10'} ${isComplete ? 'animate-pulse ring-4 ring-offset-4 ring-offset-slate-950 ' + (mode === 'study' ? 'ring-purple-500/40' : 'ring-emerald-500/40') : ''}`}>
      
      <div className="flex justify-center shrink-0">
        <div className="bg-slate-900/60 p-1 rounded-2xl flex border border-white/5">
          <button 
            onClick={() => handleModeChange('study')}
            className={`px-8 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'study' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Study
          </button>
          <button 
            onClick={() => handleModeChange('break')}
            className={`px-8 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'break' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Break
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <svg className={`w-5 h-5 ${mode === 'study' ? 'text-purple-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="serif-heading text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold">
            {mode === 'study' ? 'Focus Timer' : 'Short Break'}
          </span>
        </div>
        
        {mode === 'study' && todaySessions.length > 0 && (
          <div className="bg-purple-950/20 border border-purple-500/10 rounded-full px-4 py-1.5 flex items-center transition-all hover:bg-purple-900/30">
            <span className="serif-heading text-[10px] font-bold text-purple-300 drop-shadow-sm">{formatDuration(totalTodaySeconds)}</span>
          </div>
        )}

        {isSetting ? (
           <div className="flex gap-2">
             {(mode === 'study' ? PRESETS_STUDY : PRESETS_BREAK).map(p => (
               <button 
                 key={p} 
                 onClick={() => handlePresetClick(p)}
                 className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${
                   minutes === p 
                    ? (mode === 'study' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white') 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {p}m
               </button>
             ))}
           </div>
        ) : (
          <button 
            onClick={resetTimer}
            className={`text-[9px] uppercase tracking-widest font-black transition-colors ${mode === 'study' ? 'text-slate-600 hover:text-purple-400' : 'text-slate-600 hover:text-emerald-400'}`}
          >
            Reset
          </button>
        )}
      </div>

      {mode === 'study' && isSetting && (
        <div className="flex flex-col items-center relative shrink-0" ref={dropdownRef}>
           <div className="w-full max-w-[220px] relative z-20">
              <input 
                 type="text" 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 onFocus={handleFocusTopic}
                 placeholder="Study topic? (optional)"
                 className="bg-slate-900/40 border-b border-white/5 text-center text-sm py-2 px-4 focus:outline-none focus:border-purple-500/40 text-slate-300 w-full transition-all"
              />
           </div>

           {showSuggestions && recentTopics.length > 0 && (
             <div className="absolute top-full mt-2 w-full max-w-[220px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-white/5 bg-white/5 text-left">
                  <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold px-2">Suggestions</p>
                </div>
                <div className="max-h-[160px] overflow-y-auto custom-scrollbar scrollbar-purple">
                  {recentTopics.map((t, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectSuggestion(t)}
                      className="flex justify-between items-center px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <span className="text-xs text-slate-300 truncate pr-4">{t}</span>
                      <button 
                        onClick={(e) => handleDeleteSuggestion(e, t)}
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
      )}

      <div className="flex flex-col items-center justify-center space-y-4 flex-1">
        {isSetting ? (
          <div className="flex items-center gap-3 group/input">
            <div className={`bg-slate-900/60 border border-white/5 rounded-2xl py-2 px-6 flex items-center transition-all ${mode === 'study' ? 'focus-within:border-purple-500/30' : 'focus-within:border-emerald-500/30'}`}>
              <input 
                type="number"
                value={localMinutes}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="bg-transparent serif-heading text-5xl font-bold text-white text-center w-28 focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <span className="serif-heading text-[14px] uppercase tracking-widest text-slate-500 font-bold">m</span>
          </div>
        ) : (
          <div className={`serif-heading text-8xl font-bold tracking-tighter leading-none drop-shadow-2xl transition-colors duration-700 ${mode === 'study' ? 'text-purple-50' : 'text-emerald-50'}`}>
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 shrink-0">
        <div className="flex justify-center items-center gap-6">
          {isActive ? (
            <button 
              onClick={pauseTimer}
              className={`w-20 h-20 rounded-[28px] bg-slate-800/50 border flex items-center justify-center transition-all active:scale-95 ${mode === 'study' ? 'border-purple-500/20 text-purple-400 hover:text-purple-300' : 'border-emerald-500/20 text-emerald-400 hover:text-emerald-300'}`}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={startTimer}
              className={`relative group w-20 h-20 rounded-[28px] text-white flex items-center justify-center shadow-2xl transition-all active:scale-95 ${mode === 'study' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
              <div className={`absolute inset-0 rounded-[28px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${mode === 'study' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              <svg className="w-10 h-10 ml-1 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {!isSetting && mode === 'study' && (
            <button 
              onClick={handleStopAndSave}
              className="flex items-center justify-center w-20 h-20 rounded-[28px] bg-slate-900/40 border border-purple-500/10 text-purple-200/40 hover:text-purple-300 hover:bg-purple-950/20 transition-all duration-300 transform active:scale-95"
              title="Stop and Save"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                 <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          )}
        </div>

        {!isSetting && mode === 'break' && (
          <button 
            onClick={resetTimer}
            className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500/40 hover:text-emerald-400 transition-all active:scale-95 py-3 px-6"
          >
            Skip Break
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900/50">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${
            mode === 'study' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-400 shadow-[0_-4px_10px_rgba(147,51,234,0.3)]' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_-4px_10px_rgba(16,185,129,0.3)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default TimerCard;
