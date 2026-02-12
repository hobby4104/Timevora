
import { StudySession, Task, Settings, RoutineTask, RoutineCompletion } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'timevora_sessions',
  TASKS: 'timevora_tasks',
  ROUTINES: 'timevora_routines',
  ROUTINE_COMPLETIONS: 'timevora_routine_completions',
  SETTINGS: 'timevora_settings',
  RECENT_TOPICS: 'timevora_recent_topics'
};

const RETENTION_DAYS = 90;

const getCutoffDateStr = () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  cutoffDate.setHours(0, 0, 0, 0);
  return cutoffDate.toISOString().split('T')[0];
};

export const cleanupOldData = (sessions: StudySession[]): StudySession[] => {
  const cutoff = getCutoffDateStr();
  return sessions.filter(session => session.date >= cutoff);
};

export const cleanupOldTasks = (tasks: Task[]): Task[] => {
  const cutoff = getCutoffDateStr();
  return tasks.filter(task => {
    if (task.type === 'today' && task.date) {
      return task.date >= cutoff;
    }
    return true;
  });
};

export const cleanupRoutineCompletions = (completions: RoutineCompletion): RoutineCompletion => {
  const cutoff = getCutoffDateStr();
  const cleaned: RoutineCompletion = {};
  Object.keys(completions).forEach(date => {
    if (date >= cutoff) {
      cleaned[date] = completions[date];
    }
  });
  return cleaned;
};

export const getSessions = (): StudySession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  const sessions = data ? JSON.parse(data) : [];
  return cleanupOldData(sessions);
};

export const saveSession = (session: StudySession) => {
  const sessions = getSessions();
  const updated = [session, ...sessions];
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(cleanupOldData(updated)));
  
  if (session.topic && session.topic.trim()) {
    saveRecentTopic(session.topic);
  }
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  const tasks = data ? JSON.parse(data) : [];
  return cleanupOldTasks(tasks);
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(cleanupOldTasks(tasks)));
};

export const getRoutines = (): RoutineTask[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
  return data ? JSON.parse(data) : [];
};

export const saveRoutines = (routines: RoutineTask[]) => {
  localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
};

export const getRoutineCompletions = (): RoutineCompletion => {
  const data = localStorage.getItem(STORAGE_KEYS.ROUTINE_COMPLETIONS);
  const completions = data ? JSON.parse(data) : {};
  return cleanupRoutineCompletions(completions);
};

export const saveRoutineCompletions = (completions: RoutineCompletion) => {
  localStorage.setItem(STORAGE_KEYS.ROUTINE_COMPLETIONS, JSON.stringify(cleanupRoutineCompletions(completions)));
};

export const getSettings = (): Settings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : { dailyTargetMinutes: 60 };
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getRecentTopics = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.RECENT_TOPICS);
  return data ? JSON.parse(data) : [];
};

export const saveRecentTopic = (topic: string) => {
  const topics = getRecentTopics();
  const trimmed = topic.trim();
  const filtered = topics.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, 10);
  localStorage.setItem(STORAGE_KEYS.RECENT_TOPICS, JSON.stringify(updated));
};

export const removeRecentTopic = (topic: string) => {
  const topics = getRecentTopics();
  const updated = topics.filter(t => t !== topic);
  localStorage.setItem(STORAGE_KEYS.RECENT_TOPICS, JSON.stringify(updated));
};
