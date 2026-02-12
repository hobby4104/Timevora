
import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

const TaskBoard: React.FC<Props> = ({ tasks, onTasksChange }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [view, setView] = useState<'today' | 'habit'>('today');
  
  const todayISO = new Date().toISOString().split('T')[0];

  const calculateStreak = (task: Task) => {
    if (task.type !== 'habit' || !task.completedDates || task.completedDates.length === 0) return 0;
    
    const completedSet = new Set(task.completedDates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isDoneToday = completedSet.has(todayStr);
    const isDoneYesterday = completedSet.has(yesterdayStr);

    if (!isDoneToday && !isDoneYesterday) {
      return 0;
    }

    let streak = 0;
    let checkDate = isDoneToday ? today : yesterday;

    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (completedSet.has(checkStr)) {
        streak++;
        const nextCheck = new Date(checkDate);
        nextCheck.setDate(nextCheck.getDate() - 1);
        checkDate = nextCheck;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const masterStreak = useMemo(() => {
    const habitTasks = tasks.filter(t => t.type === 'habit');
    if (habitTasks.length === 0) return 0;
    return Math.max(0, ...habitTasks.map(t => calculateStreak(t)));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      completed: false,
      createdAt: Date.now(),
      type: view,
      date: view === 'today' ? todayISO : undefined,
      completedDates: view === 'habit' ? [] : undefined
    };
    
    onTasksChange([newTask, ...tasks]);
    setNewTaskText('');
  };

  const isTaskCompleted = (task: Task) => {
    if (task.type === 'today') return task.completed;
    return task.completedDates?.includes(todayISO) ?? false;
  };

  const toggleTask = (id: string) => {
    onTasksChange(tasks.map(t => {
      if (t.id !== id) return t;
      
      if (t.type === 'today') {
        return { ...t, completed: !t.completed };
      } else {
        const completedDates = t.completedDates || [];
        const isDoneToday = completedDates.includes(todayISO);
        return {
          ...t,
          completedDates: isDoneToday 
            ? completedDates.filter(d => d !== todayISO) 
            : [...completedDates, todayISO]
        };
      }
    }));
  };

  const deleteTask = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  const displayedTasks = tasks.filter(t => {
    if (view === 'today') {
      return (t.type === 'today' && t.date === todayISO) || t.type === 'habit';
    } else {
      return t.type === 'habit';
    }
  });

  return (
    <div className="glass-card h-full rounded-[40px] p-10 flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex gap-4 items-center">
           <div className="w-10 h-10 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center shadow-lg">
             <div className="w-5 h-5 rounded-full border-2 border-indigo-400/40 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
             </div>
           </div>
           <h3 className="serif-heading text-lg text-white font-medium">Task Board</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full transition-all duration-700 shadow-2xl ${masterStreak > 0 ? 'bg-red-600 ring-4 ring-red-500/30 scale-105 border-none' : 'bg-slate-900/40 border border-white/5 opacity-50'}`}>
            <span className={`text-xl drop-shadow-md ${masterStreak > 0 ? 'grayscale-0' : 'grayscale'}`}>🔥</span>
            <div className="flex flex-col items-start -space-y-0.5">
               <span className={`text-[14px] font-black leading-none tracking-tight ${masterStreak > 0 ? 'text-white' : 'text-slate-500'}`}>
                 {masterStreak} Days
               </span>
               <span className={`text-[8px] uppercase tracking-[0.3em] font-black leading-none ${masterStreak > 0 ? 'text-red-100/80' : 'text-slate-700'}`}>
                 Fire Streak
               </span>
            </div>
            {masterStreak > 0 && <div className="absolute inset-0 bg-red-400 blur-2xl opacity-20 -z-10 animate-pulse rounded-full" />}
          </div>

          <div className="bg-slate-900/80 border border-white/5 p-1 rounded-xl flex flex-1 sm:flex-none">
            <button 
              onClick={() => setView('today')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${view === 'today' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setView('habit')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${view === 'habit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Habits
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={addTask} className="relative">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-1 flex items-center">
          <input 
            type="text" 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={view === 'today' ? "What's the goal for today?" : "Create a recurring habit..."}
            className="flex-1 bg-transparent px-5 py-4 serif-heading text-xs text-slate-300 placeholder-slate-700 focus:outline-none"
          />
          <button type="submit" className="bg-indigo-600 w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-indigo pr-2">
        <div className="flex flex-col space-y-3">
          {displayedTasks.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <span className="serif-heading text-[9px] uppercase tracking-[0.4em] font-bold">Empty Board</span>
            </div>
          ) : (
            displayedTasks.map(task => {
              const completed = isTaskCompleted(task);
              const streak = calculateStreak(task);
              const total = task.completedDates?.length || (task.completed ? 1 : 0);
              
              return (
                <div key={task.id} className={`flex items-center gap-4 bg-slate-900/30 p-4 rounded-3xl border border-white/5 transition-all ${completed ? 'opacity-40 grayscale' : ''}`}>
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all ${completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 bg-slate-800/50'}`}
                  >
                    {completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <span className={`serif-heading text-sm tracking-wide font-light truncate block ${completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                      {task.text}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] uppercase tracking-widest font-black ${task.type === 'habit' ? 'text-indigo-400/60' : 'text-emerald-400/60'}`}>
                        {task.type === 'habit' ? 'Habit' : 'Single'}
                      </span>
                      {task.type === 'habit' && (
                        <span className="text-[8px] uppercase tracking-widest font-black text-slate-700">
                          {total} Total
                        </span>
                      )}
                    </div>
                  </div>

                  {task.type === 'habit' && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${streak > 0 ? 'bg-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.4)] scale-110' : 'bg-slate-900/40 border border-white/5 opacity-30'}`}>
                      <span className={`text-[12px] drop-shadow-sm ${streak > 0 ? 'grayscale-0' : 'grayscale'}`}>🔥</span>
                      <span className={`text-[11px] font-black ${streak > 0 ? 'text-white' : 'text-slate-600'}`}>
                        {streak}
                      </span>
                    </div>
                  )}

                  <button onClick={() => deleteTask(task.id)} className="text-slate-800 hover:text-rose-400 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
