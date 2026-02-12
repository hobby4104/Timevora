
import React from 'react';
import { RoutineTask, RoutineCompletion } from '../types';

interface Props {
  routines: RoutineTask[];
  completions: RoutineCompletion;
  selectedDate: string;
  onUpdateRoutines: (routines: RoutineTask[]) => void;
  onToggleRoutine: (taskId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (task: RoutineTask) => void;
}

const RoutineScreen: React.FC<Props> = ({ 
  routines, 
  completions, 
  selectedDate, 
  onUpdateRoutines, 
  onToggleRoutine,
  onOpenAddModal,
  onOpenEditModal
}) => {
  const doneIds = completions[selectedDate] || [];
  const progress = routines.length ? Math.round((doneIds.length / routines.length) * 100) : 0;

  // Circular progress calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="serif-heading text-4xl md:text-5xl font-bold text-white tracking-tight">Routine Matrix</h2>
          <p className="text-slate-500 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] mt-1">Consistency Tracker</p>
        </div>
        
        {/* Redesigned Circular Progress Module */}
        <div className="flex items-center gap-8 glass-card px-10 py-6 rounded-[40px] shadow-2xl transition-all duration-500 hover:shadow-indigo-500/5">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/[0.03]"
              />
              {/* Progress Stroke */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-indigo-500 transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="serif-heading text-2xl font-black text-white leading-none tabular-nums">
                {progress}%
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-[0.2em]">Day Efficiency</p>
            <p className="text-sm font-medium text-slate-400">
              <span className="text-white font-bold">{doneIds.length}</span> of {routines.length} Active
            </p>
            <div className="flex gap-1 mt-2">
              {routines.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-3 rounded-full transition-all duration-500 ${i < doneIds.length ? 'bg-indigo-500' : 'bg-white/5'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card flex-1 rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative border-t border-white/5">
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
             <h3 className="serif-heading text-xl text-white font-medium">Daily Schedule</h3>
          </div>
          <button 
            onClick={onOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[10px] uppercase tracking-widest font-black">New Entry</span>
          </button>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar scrollbar-indigo">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-[0.3em] bg-white/[0.01]">
                <th className="p-10 w-24 text-center">Done</th>
                <th className="p-8">Time</th>
                <th className="p-8">Activity</th>
                <th className="p-8">Duration</th>
                <th className="p-8">Category</th>
                <th className="p-10 text-right w-40">Manage</th>
              </tr>
            </thead>
            <tbody>
              {routines.sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99')).map(task => {
                const isDone = doneIds.includes(task.id);
                return (
                  <tr key={task.id} className={`border-b border-white/5 transition-all hover:bg-white/[0.02] ${isDone ? 'opacity-40 grayscale-[0.3]' : ''}`}>
                    <td className="p-10">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => onToggleRoutine(task.id)}
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isDone ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-800 hover:border-indigo-500/50'}`}
                        >
                          {isDone && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      </div>
                    </td>
                    <td className="p-8 text-indigo-300 font-bold tabular-nums text-lg">{task.time || <span className="text-slate-700 opacity-50 italic text-xs">Anytime</span>}</td>
                    <td className="p-8 font-medium text-white text-base">{task.activity}</td>
                    <td className="p-8 text-slate-400 text-sm font-medium">{task.duration}</td>
                    <td className="p-8">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5 ${task.category ? 'text-slate-500' : 'text-slate-800 opacity-30'}`}>
                         {task.category || 'N/A'}
                       </span>
                    </td>
                    <td className="p-10 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => onOpenEditModal(task)}
                          className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => onUpdateRoutines(routines.filter(r => r.id !== task.id))}
                          className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {routines.length === 0 && (
             <div className="py-24 flex flex-col items-center justify-center opacity-20">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="serif-heading text-xl">The Matrix is silent</p>
                <p className="text-[10px] uppercase tracking-widest font-black mt-2">Add your first routine item to begin</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineScreen;
