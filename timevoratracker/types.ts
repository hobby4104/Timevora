
export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  duration: number; // seconds
  topic?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean; // Used for "today" tasks
  createdAt: number;
  type: 'today' | 'habit';
  date?: string; // YYYY-MM-DD, used for "today" tasks
  completedDates?: string[]; // YYYY-MM-DD list, used for "habit" tasks to track daily completion
}

export interface RoutineTask {
  id: string;
  time: string;
  activity: string;
  duration: string;
  category: string;
  createdAt: number;
}

export interface RoutineCompletion {
  [date: string]: string[]; // date string -> array of routine task ids completed on that day
}

export interface Settings {
  dailyTargetMinutes: number;
  userName?: string;
}

export interface DayHistory {
  date: string;
  totalDuration: number;
  sessions: StudySession[];
}
