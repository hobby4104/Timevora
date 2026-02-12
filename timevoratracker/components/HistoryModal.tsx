
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySession, Task, RoutineCompletion, RoutineTask } from '../types';
import { getRoutineCompletions, getRoutines } from '../utils/storage';

interface Props {
  sessions: StudySession[];
  tasks: Task[];
  mode: 'study' | 'routine';
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

const HistoryModal: React.FC<Props> = ({ sessions, tasks, mode, onDeleteSession, onClose }) => {
  const todayISO = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(todayISO);
  const [viewDate, setViewDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'logs' | 'calendar'>('calendar');
  
  const [routines, setRoutines] = useState<RoutineTask[]>([]);
  const [routineCompletions, setRoutineCompletions] = useState<RoutineCompletion>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoutines(getRoutines());
    setRoutineCompletions(getRoutineCompletions());
  }, []);

  // Handle mobile scroll sync with capsule
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    if (scrollLeft > width / 2) {
      setMobileView('logs');
    } else {
      setMobileView('calendar');
    }
  };

  const scrollToView = (view: 'logs' | 'calendar') => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({
      left: view === 'calendar' ? 0 : width,
      behavior: 'smooth'
    });
    setMobileView(view);
  };

  const studyHistoryData = useMemo<Record<string, { total: number, count: number, items: StudySession[] }>>(() => {
    const dates: Record<string, { total: number, count: number, items: StudySession[] }> = {};
    sessions.forEach(s => {
      if (!dates[s.date]) dates[s.date] = { total: 0, count: 0, items: [] };
      dates[s.date].total += s.duration;
      dates[s.date].count += 1;
      dates[s.date].items.push(s);
    });
    return dates;
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      result.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayStudyData = studyHistoryData[dateStr];
      const routineCompletedCount = (routineCompletions[dateStr] || []).length;
      
      result.push({
        day: i,
        date: dateStr,
        hasStudyData: !!dayStudyData,
        studyDuration: dayStudyData?.total || 0,
        routineCount: routineCompletedCount,
        isToday: dateStr === todayISO
      });
    }
    return result;
  }, [studyHistoryData, viewDate, todayISO, routineCompletions]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const jumpToMonth = (monthIndex: number) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setIsMonthPickerOpen(false);
  };

  const selectedDaySessions = selectedDate ? studyHistoryData[selectedDate] : null;

  const selectedDayRoutines = useMemo(() => {
    if (!selectedDate) return [];
    const completedIds = routineCompletions[selectedDate] || [];
    return routines.filter(r => completedIds.includes(r.id));
  }, [routines, routineCompletions, selectedDate]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(t => {
      if (t.type === 'today') {
        return t.date === selectedDate && t.completed;
      } else {
        return t.completedDates?.includes(selectedDate);
      }
    });
  }, [tasks, selectedDate]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${seconds}s`;
  };

  const getHeatColor = (dayObj: any) => {
    if (mode === 'study') {
      const duration = dayObj.studyDuration;
      if (duration === 0) return 'bg-slate-800/10 border-white/[0.02]';
      if (duration < 1800) return 'bg-indigo-500/10 border-indigo-500/10';
      if (duration < 3600) return 'bg-indigo-500/30 border-indigo-500/20';
      if (duration < 7200) return 'bg-indigo-500/60 border-indigo-500/30';
      return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-indigo-400';
    } else {
      const count = dayObj.routineCount;
      if (count === 0) return 'bg-slate-800/10 border-white/[0.02]';
      if (count < 2) return 'bg-emerald-500/10 border-emerald-500/10';
      if (count < 4) return 'bg-emerald-500/30 border-emerald-500/20';
      return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] border-emerald-400';
    }
  };

  const CalendarContent = () => (
    <div className="w-full h-full p-6 md:p-10 flex flex-col">
      <div className="relative mb-8">
         <div className="flex justify-between items-center">
            <button onClick={handlePrevMonth} className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} className="flex flex-col items-center group">
              <span className="serif-heading text-xl text-white font-bold tracking-tight group-hover:text-indigo-300 transition-colors">{viewDate.toLocaleDateString([], { month: 'long' })}</span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{viewDate.getFullYear()}</span>
            </button>
            <button onClick={handleNextMonth} className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
         </div>
         
         {isMonthPickerOpen && (
           <div className="absolute top-full left-0 right-0 mt-4 bg-[#121624] border border-white/10 p-6 rounded-3xl shadow-2xl z-50 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              {Array.from({ length: 12 }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => jumpToMonth(i)} 
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewDate.getMonth() === i ? (mode === 'study' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white') : 'hover:bg-white/5 text-slate-500'}`}
                >
                  {new Date(0, i).toLocaleDateString([], { month: 'short' })}
                </button>
              ))}
           </div>
         )}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} className="text-[10px] text-center font-black text-slate-700 py-2 uppercase tracking-tighter">{d}</div>
        ))}
        {calendarDays.map((dayObj, idx) => {
          if (!dayObj) return <div key={`empty-${idx}`} className="aspect-square" />;
          const { day, date, isToday } = dayObj;
          const isSelected = selectedDate === date;
          const heatClass = getHeatColor(dayObj);
          const activeColor = mode === 'study' ? 'bg-indigo-600 border-indigo-400' : 'bg-emerald-600 border-emerald-400';
          
          return (
            <button 
              key={date} 
              onClick={() => {
                setSelectedDate(date);
                if (window.innerWidth < 768) scrollToView('logs');
              }} 
              className={`aspect-square rounded-xl md:rounded-2xl text-[12px] md:text-[13px] font-bold transition-all relative flex items-center justify-center group ${isSelected ? 'ring-2 ring-offset-2 md:ring-offset-4 ring-offset-[#0B0F1A] scale-105 md:scale-110 z-10 ' + (mode === 'study' ? 'ring-indigo-500' : 'ring-emerald-500') : 'hover:scale-105'}`}
            >
              <div className={`absolute inset-0 rounded-xl md:rounded-2xl border transition-all ${isSelected ? activeColor : heatClass}`} />
              <span className={`relative z-10 ${isSelected ? 'text-white font-black' : ((dayObj.studyDuration > 0 || dayObj.routineCount > 0) ? 'text-slate-200' : 'text-slate-600')}`}>
                {day}
              </span>
              {isToday && !isSelected && <div className={`absolute bottom-2 w-1 h-1 rounded-full animate-pulse ${mode === 'study' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5 flex flex-col">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Monthly Total</span>
          <span className="serif-heading text-xl text-white font-bold">
            {mode === 'study' 
              ? formatDuration(calendarDays.reduce((acc, d) => acc + (d?.studyDuration || 0), 0))
              : `${calendarDays.reduce((acc, d) => acc + (d?.routineCount || 0), 0)} Completed`}
          </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 bg-[#0B0F1A]/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-6xl h-full md:h-[85vh] md:rounded-[48px] overflow-hidden flex flex-col shadow-2xl border-0 md:border md:border-white/10 animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <div className="flex flex-col">
            <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${mode === 'study' ? 'text-indigo-400/60' : 'text-emerald-400/60'}`}>
              {mode === 'study' ? 'Study History' : 'Routine History'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="serif-heading text-xl md:text-2xl text-white font-bold tracking-tight">Archives</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-90 border border-white/5"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
          
          {/* Main Content Area - Swipeable on mobile */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory md:overflow-hidden md:snap-none custom-scrollbar scrollbar-indigo h-full"
          >
            {/* Page 1: Calendar Selection (Main Screen for Mobile) */}
            <div className="w-full md:w-[420px] shrink-0 snap-center md:snap-none border-r border-white/5 bg-white/[0.01] overflow-y-auto order-1">
               <CalendarContent />
            </div>

            {/* Page 2: History Details */}
            <div className="w-full md:flex-1 shrink-0 snap-center md:snap-none p-6 md:p-10 overflow-y-auto bg-black/10 order-2">
               {selectedDate ? (
                <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
                  <div className="flex justify-between items-end border-b border-white/5 pb-6 md:pb-10">
                    <div className="flex flex-col">
                      <h3 className="serif-heading text-3xl md:text-5xl text-white font-bold leading-none mb-3 tracking-tighter">
                        {new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </h3>
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {new Date(selectedDate).toLocaleDateString([], { weekday: 'long' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">{mode === 'study' ? 'Volume' : 'Score'}</p>
                      <p className="serif-heading text-xl md:text-3xl text-white font-bold">{mode === 'study' ? (selectedDaySessions ? formatDuration(selectedDaySessions.total) : '0m') : `${selectedDayRoutines.length} Tasks`}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-10 md:gap-12">
                     {mode === 'study' ? (
                        <div className="space-y-10">
                          <div className="space-y-6">
                            <h4 className="serif-heading text-lg text-white font-medium flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Sessions</h4>
                            <div className="space-y-4">
                               {selectedDaySessions?.items.map(s => (
                                 <div key={s.id} className="glass-card p-5 rounded-[28px] border border-white/5 flex justify-between items-center bg-white/[0.02]">
                                    <div className="min-w-0 flex-1 mr-4">
                                       <p className="text-[9px] font-black text-slate-500 uppercase">{s.startTime}</p>
                                       <p className="serif-heading text-indigo-100 font-medium text-sm truncate">{s.topic || 'General Focus'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      <p className="serif-heading text-sm font-bold text-white">{formatDuration(s.duration)}</p>
                                      <button onClick={() => onDeleteSession(s.id)} className="p-2 text-slate-800 hover:text-rose-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                    </div>
                                 </div>
                               ))}
                               {(!selectedDaySessions || selectedDaySessions.items.length === 0) && <p className="text-[10px] text-slate-700 uppercase tracking-widest text-center py-10">No sessions tracked</p>}
                            </div>
                          </div>

                          <div className="space-y-6 pb-20 md:pb-0">
                            <h4 className="serif-heading text-lg text-white font-medium flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Board</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedDayTasks.map(t => (
                                <div key={t.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-[24px] flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-xs text-slate-200 font-semibold truncate">{t.text}</p>
                                     <p className="text-[8px] uppercase tracking-widest text-slate-500 font-black">{t.type === 'habit' ? 'Habit' : 'Goal'}</p>
                                  </div>
                                </div>
                              ))}
                              {selectedDayTasks.length === 0 && <p className="col-span-full text-[10px] text-slate-700 uppercase tracking-widest text-center py-10">No tasks achieved</p>}
                            </div>
                          </div>
                        </div>
                     ) : (
                        <div className="space-y-6 pb-20 md:pb-0">
                          <h4 className="serif-heading text-lg text-white font-medium flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Routine Matrix</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {selectedDayRoutines.map(r => (
                               <div key={r.id} className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-[24px] flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                                  <div>
                                     <p className="text-xs text-slate-200 font-semibold">{r.activity}</p>
                                     <p className="text-[8px] uppercase tracking-widest text-emerald-500/60 font-black">{r.time || 'All Day'}</p>
                                  </div>
                               </div>
                             ))}
                             {selectedDayRoutines.length === 0 && <p className="col-span-full text-[10px] text-slate-700 uppercase tracking-widest text-center py-10">No items completed</p>}
                          </div>
                        </div>
                     )}
                  </div>
                </div>
              ) : <p className="text-center py-20 text-slate-700 uppercase tracking-widest font-black text-[10px]">Select a date</p>}
            </div>
          </div>
        </div>

        {/* Navigation Capsule - Mobile Only */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[130]">
          <div className="bg-[#121624]/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[24px] flex items-center gap-1 shadow-2xl">
            <button 
              onClick={() => scrollToView('calendar')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300 ${mobileView === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Dates</span>
            </button>
            <button 
              onClick={() => scrollToView('logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-300 ${mobileView === 'logs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
