import { AppState } from "./types";

export const getTodayStr = (): string => new Date().toISOString().split('T')[0];

export const getYesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export const formatDateDisplay = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const calculateStreak = (habitId: number, state: AppState): number => {
  let streak = 0;
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  
  // Check today first
  if (state.logs[today] && state.logs[today][habitId]) {
    streak++;
  }

  // Iterate backwards from yesterday
  let d = new Date(yesterday);
  while (true) {
    const iso = d.toISOString().split('T')[0];
    const logVal = state.logs[iso]?.[habitId];
    
    // If log exists and is truthy (true for checkbox, >0 for numeric)
    if (logVal) {
      // If we already counted today, we just add; otherwise we start counting
      // (The logic in the prompt says: check yesterday. If yes, streak+1. Logic implies unbroken chain)
      // We will count the continuous chain ending yesterday or today.
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const getCompletionRate = (state: AppState): number => {
  const today = getTodayStr();
  const todaysLogs = state.logs[today] || {};
  const habits = state.habits;
  
  if (habits.length === 0) return 0;

  let completed = 0;
  habits.forEach(h => {
    const val = todaysLogs[h.id];
    if (h.type === 'checkbox' && val === true) completed++;
    else if (h.type === 'numeric' && (val as number) >= (h.target || 1)) completed++;
  });

  return Math.round((completed / habits.length) * 100);
};
