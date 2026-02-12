
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StudySession, Task, Settings, RoutineTask, RoutineCompletion } from './types';
import { 
  getSessions, saveSession, getTasks, saveTasks, 
  getSettings, saveSettings, getRoutines, saveRoutines, 
  getRoutineCompletions, saveRoutineCompletions 
} from './utils/storage';
import ClockCard from './components/ClockCard';
import FocusCard from './components/FocusCard';
import TimerCard from './components/TimerCard';
import PerformanceCard from './components/PerformanceCard';
import ProgressCard from './components/ProgressCard';
import TaskBoard from './components/TaskBoard';
import HistoryModal from './components/HistoryModal';
import RoutineScreen from './components/RoutineScreen';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<RoutineTask[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion>({});
  const [settings, setSettings] = useState<Settings>({ dailyTargetMinutes: 60 });
  
  const [historyMode, setHistoryMode] = useState<'study' | 'routine' | null>(null);
  
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'home' | 'routine'>('home');
  
  const selectedDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineFormData, setRoutineFormData] = useState({
    time: '',
    activity: '',
    duration: '',
    category: ''
  });

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const s = getSessions();
    const t = getTasks();
    const r = getRoutines();
    const c = getRoutineCompletions();
    const set = getSettings();
    
    setSessions(s);
    setTasks(t);
    setRoutines(r);
    setCompletions(c);
    setSettings(set);

    if (!set.userName) {
      setShowWelcome(true);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActiveScreen('home');
      if (e.key === 'ArrowRight') setActiveScreen('routine');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  const todaySessions = useMemo(() => {
    return sessions.filter(s => s.date === selectedDate);
  }, [sessions, selectedDate]);

  const handleSaveSession = (duration: number, topic?: string) => {
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      date: selectedDate,
      startTime: new Date().toTimeString().split(' ')[0],
      duration,
      topic: topic?.trim() || undefined
    };
    saveSession(newSession);
    setSessions(getSessions());
    setActiveSeconds(0);
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('timevora_sessions', JSON.stringify(updated));
  };

  const handleMarkDone = () => {
    const manualTopic = "Goal Completed Manually";
    const existingManualSession = sessions.find(s => s.date === selectedDate && s.topic === manualTopic);

    if (existingManualSession) {
      handleDeleteSession(existingManualSession.id);
    } else {
      const todayTotalSecs = sessions
        .filter(s => s.date === selectedDate)
        .reduce((acc, s) => acc + s.duration, 0) + activeSeconds;
      const targetSeconds = settings.dailyTargetMinutes * 60;
      
      if (todayTotalSecs < targetSeconds) {
        handleSaveSession(targetSeconds - todayTotalSecs, manualTopic);
      }
    }
  };

  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleUpdateRoutines = (newRoutines: RoutineTask[]) => {
    setRoutines(newRoutines);
    saveRoutines(newRoutines);
  };

  const handleToggleRoutine = (taskId: string) => {
    const updatedCompletions = { ...completions };
    if (!updatedCompletions[selectedDate]) updatedCompletions[selectedDate] = [];
    
    const idx = updatedCompletions[selectedDate].indexOf(taskId);
    if (idx > -1) {
      updatedCompletions[selectedDate].splice(idx, 1);
    } else {
      updatedCompletions[selectedDate].push(taskId);
    }
    
    setCompletions(updatedCompletions);
    saveRoutineCompletions(updatedCompletions);
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleFinishWelcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const newSettings = { ...settings, userName: tempName.trim() };
    handleUpdateSettings(newSettings);
    setShowWelcome(false);
  };

  const openAddRoutineModal = () => {
    setEditingRoutineId(null);
    setRoutineFormData({ time: '', activity: '', duration: '', category: '' });
    setIsRoutineModalOpen(true);
  };

  const openEditRoutineModal = (task: RoutineTask) => {
    setEditingRoutineId(task.id);
    setRoutineFormData({ time: task.time, activity: task.activity, duration: task.duration, category: task.category });
    setIsRoutineModalOpen(true);
  };

  const handleRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoutineId) {
      handleUpdateRoutines(routines.map(r => r.id === editingRoutineId ? { ...r, ...routineFormData } : r));
    } else {
      handleUpdateRoutines([...routines, { id: crypto.randomUUID(), ...routineFormData, createdAt: Date.now() }]);
    }
    setIsRoutineModalOpen(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const delta = touchStartX.current - touchEndX.current;
    const threshold = 100;
    if (delta > threshold) setActiveScreen('routine');
    else if (delta < -threshold) setActiveScreen('home');
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="relative h-screen bg-[#0B0F1A] overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <header className="w-full h-20 shrink-0 flex items-center px-4 md:px-12 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/5 z-[100]">
        <div className="w-full max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2 md:gap-4">
              <h1 className="serif-heading text-lg md:text-2xl font-bold text-white tracking-tight">Timevora</h1>
              <span className="hidden md:inline-block serif-heading text-base md:text-lg font-medium text-indigo-400/70">
                Hi, {settings.userName || 'there'}.
              </span>
            </div>
            <p className="text-slate-500 text-[7px] md:text-[9px] font-bold uppercase tracking-[0.45em] mt-0.5">Refining Focus</p>
            <span className="md:hidden serif-heading text-[11px] font-medium text-indigo-400/70 mt-1.5">
              Hi, {settings.userName || 'there'}.
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {activeScreen === 'home' ? (
              <button onClick={() => setHistoryMode('study')} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 transition-all border border-white/5 text-indigo-300" title="Study Session History">
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">History</span>
              </button>
            ) : (
              <button onClick={() => setHistoryMode('routine')} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 transition-all border border-white/5 text-emerald-400" title="Routine Success History">
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">History</span>
              </button>
            )}
            
            <button 
              onClick={toggleFullscreen} 
              className={`p-2 md:p-3 rounded-2xl transition-all border border-white/5 ${isFullscreen ? 'bg-indigo-600/20 text-indigo-300' : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/50'}`}
              title={isFullscreen ? "Minimise View" : "Fullscreen Matrix"}
            >
               {isFullscreen ? (
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7M20 14h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6l-7-7" />
                 </svg>
               ) : (
                 <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7M21 15v6m0 0h-6m6 0l-7-7M3 9V3m0 0h6m-6 0l7 7" />
                 </svg>
               )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Slider Container */}
      <div 
        className="flex w-[200vw] h-full shrink-0 transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]"
        style={{ transform: `translateX(${activeScreen === 'home' ? '0' : '-100vw'})` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Matrix Page Independent Scroll */}
        <div className="w-[100vw] h-full overflow-y-auto overflow-x-hidden custom-scrollbar scrollbar-indigo px-4 md:px-12 pt-8 pb-32">
           <main className="max-w-[1800px] mx-auto w-full grid grid-cols-1 md:grid-cols-10 gap-6">
              <div className="md:col-span-10 lg:col-span-6"><ClockCard /></div>
              <div className="md:col-span-5 lg:col-span-4">
                <FocusCard onSessionComplete={handleSaveSession} onSessionDelete={handleDeleteSession} todaySessions={todaySessions} onTick={setActiveSeconds} activeSeconds={activeSeconds} />
              </div>
              <div className="md:col-span-5 lg:col-span-5">
                <TimerCard onSessionComplete={handleSaveSession} onTick={setActiveSeconds} todaySessions={todaySessions} activeSeconds={activeSeconds} />
              </div>
              <div className="md:col-span-5 lg:col-span-5">
                <ProgressCard sessions={sessions} settings={settings} onSettingsChange={handleUpdateSettings} onMarkDone={handleMarkDone} activeSeconds={activeSeconds} />
              </div>
              <div className="md:col-span-5 lg:col-span-4">
                <PerformanceCard sessions={sessions} tasks={tasks} targetMinutes={settings.dailyTargetMinutes} activeSeconds={activeSeconds} />
              </div>
              <div className="md:col-span-10 lg:col-span-6">
                <TaskBoard tasks={tasks} onTasksChange={handleUpdateTasks} />
              </div>
           </main>
           <footer className="mt-20 py-10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Timevora</span>
           </footer>
        </div>

        {/* Routine Page Independent Scroll */}
        <div className="w-[100vw] h-full overflow-y-auto overflow-x-hidden custom-scrollbar scrollbar-indigo px-4 md:px-12 pt-8 pb-32">
           <div className="max-w-[1400px] mx-auto w-full h-full">
             <RoutineScreen 
               routines={routines} 
               completions={completions} 
               selectedDate={selectedDate} 
               onUpdateRoutines={handleUpdateRoutines} 
               onToggleRoutine={handleToggleRoutine} 
               onOpenAddModal={openAddRoutineModal}
               onOpenEditModal={openEditRoutineModal}
             />
           </div>
           <footer className="mt-20 py-10 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity duration-500">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Timevora</span>
           </footer>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110]">
        <button 
          onClick={() => setActiveScreen('home')} 
          className={`px-4 md:px-6 py-3.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeScreen === 'home' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="hidden md:inline-block">Matrix</span>
        </button>
        <button 
          onClick={() => setActiveScreen('routine')} 
          className={`px-4 md:px-6 py-3.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeScreen === 'routine' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="hidden md:inline-block">Routine</span>
        </button>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-[200] w-screen h-screen flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="glass-card w-full max-w-[340px] rounded-[40px] py-10 px-8 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl border border-white/10 text-center">
             <div className="w-14 h-14 rounded-[22px] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-2 transition-transform duration-500 hover:scale-110">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
             </div>
             <div className="space-y-2">
                <h2 className="serif-heading text-3xl font-bold text-white tracking-tight leading-tight">Welcome!</h2>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em]">Time to focus</p>
             </div>
             <form onSubmit={handleFinishWelcome} className="w-full space-y-6">
                <div className="space-y-2">
                   <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest text-center">What's your name?</p>
                   <div className="relative">
                      <input 
                         type="text"
                         value={tempName}
                         onChange={(e) => setTempName(e.target.value)}
                         placeholder="Name here..."
                         autoFocus
                         className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-5 py-4 serif-heading text-xl text-center text-white placeholder-slate-800 focus:outline-none focus:border-indigo-500/40 transition-all"
                      />
                   </div>
                </div>
                <button type="submit" disabled={!tempName.trim()} className="w-full bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-indigo-500 text-white font-bold py-4 rounded-[20px] transition-all shadow-xl shadow-indigo-900/20 active:scale-95 serif-heading uppercase tracking-widest text-[10px]">
                   Let's go
                </button>
             </form>
          </div>
        </div>
      )}

      {isRoutineModalOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[210] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-[40px] p-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h4 className="serif-heading text-2xl text-white font-bold mb-8">{editingRoutineId ? 'Edit Entry' : 'New Routine Item'}</h4>
            <form onSubmit={handleRoutineSubmit} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 ml-2">Time (Optional)</label>
                  <input type="text" placeholder="e.g. 06:30 AM" className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-800" value={routineFormData.time} onChange={e => setRoutineFormData({...routineFormData, time: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 ml-2">Activity</label>
                  <input type="text" required placeholder="e.g. Physics Block 1" className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-800" value={routineFormData.activity} onChange={e => setRoutineFormData({...routineFormData, activity: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 ml-2">Duration</label>
                    <input type="text" required placeholder="e.g. 2.5h" className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-800" value={routineFormData.duration} onChange={e => setRoutineFormData({...routineFormData, duration: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 ml-2">Category (Optional)</label>
                    <input type="text" placeholder="e.g. Study" className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-800" value={routineFormData.category} onChange={e => setRoutineFormData({...routineFormData, category: e.target.value})} />
                  </div>
               </div>
               <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsRoutineModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest">{editingRoutineId ? 'Update' : 'Save Entry'}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {historyMode && (
        <HistoryModal 
          sessions={sessions} 
          tasks={tasks}
          mode={historyMode}
          onDeleteSession={handleDeleteSession}
          onClose={() => setHistoryMode(null)} 
        />
      )}
    </div>
  );
};

export default App;
