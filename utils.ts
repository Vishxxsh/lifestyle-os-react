
import { AppState, FrequencyType } from "./types";

// Returns Local Date String YYYY-MM-DD to avoid UTC shifts
export const getTodayStr = (): string => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000; 
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export const getYesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const offset = d.getTimezoneOffset() * 60000; 
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export const formatDateDisplay = (dateStr: string): string => {
  // Parsing YYYY-MM-DD as local date parts
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to convert YYYY-MM-DD string to a local midnight Date object
const parseDate = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// Helper to convert Date to YYYY-MM-DD
const toDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getScoreColor = (score: number): string => {
    // Returns a Tailwind color class based on score 1-10
    if (score >= 9) return 'bg-blue-600 text-white';
    if (score >= 7) return 'bg-blue-400 text-white';
    if (score >= 5) return 'bg-blue-200 text-blue-900';
    if (score >= 3) return 'bg-orange-200 text-orange-900';
    if (score > 0) return 'bg-red-200 text-red-900';
    return 'bg-gray-100 text-gray-300';
};

export const calculateStreak = (habitId: number, state: AppState): number => {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return 0;

  const logs = state.logs;
  const todayStr = getTodayStr();
  const todayDate = parseDate(todayStr);

  // Helper: Check if a specific date has ANY activity (partial or full)
  const hasActivity = (dateStr: string) => {
      const val = logs[dateStr]?.[habitId];
      if (habit.type === 'checkbox') return !!val;
      return (val as number) > 0; 
  };

  if (habit.frequency === 'daily') {
      // Daily Logic: Contiguous days backward
      let streak = 0;
      let checkDate = new Date(todayDate);
      
      // If not done today, start checking from yesterday
      if (!hasActivity(todayStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          // If yesterday is also empty, streak is 0
          if (!hasActivity(toDateStr(checkDate))) return 0;
      }

      while (true) {
          const iso = toDateStr(checkDate);
          if (hasActivity(iso)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
          } else {
              break;
          }
      }
      return streak;

  } else {
      // WEEKLY or MONTHLY Logic
      const isWeekly = habit.frequency === 'weekly';
      const target = habit.frequencyGoal || 1;
      
      let streak = 0;
      // Start checking from the current period
      let pointerDate = new Date(todayDate);
      
      // Safety break to prevent infinite loops
      for(let i=0; i<104; i++) { // Check up to 2 years back
          let periodStart: Date;
          let periodEnd: Date;

          if (isWeekly) {
              // Week: Monday to Sunday
              // getDay(): 0=Sun, 1=Mon...
              const day = pointerDate.getDay();
              const diffToMon = day === 0 ? 6 : day - 1; 
              
              periodStart = new Date(pointerDate);
              periodStart.setDate(pointerDate.getDate() - diffToMon);
              
              periodEnd = new Date(periodStart);
              periodEnd.setDate(periodStart.getDate() + 6);
          } else {
              // Month: 1st to Last
              periodStart = new Date(pointerDate.getFullYear(), pointerDate.getMonth(), 1);
              periodEnd = new Date(pointerDate.getFullYear(), pointerDate.getMonth() + 1, 0);
          }

          // Count days done in this period
          let daysDone = 0;
          let temp = new Date(periodStart);
          while (temp <= periodEnd) {
              if (hasActivity(toDateStr(temp))) daysDone++;
              temp.setDate(temp.getDate() + 1);
          }

          // Is this the CURRENT period (containing Today)?
          const isCurrentPeriod = i === 0;

          if (isCurrentPeriod) {
              // For current period, we calculate if it's even POSSIBLE to hit the target.
              // If impossible, the streak is considered "bound to break" -> reset history.
              
              // Calculate days remaining (including today)
              // diff in ms / ms per day
              const msPerDay = 1000 * 60 * 60 * 24;
              const daysRemaining = Math.floor((periodEnd.getTime() - todayDate.getTime()) / msPerDay) + 1;
              
              // If impossible to meet target, history is invalid.
              // We return just the current count (effectively resetting, but showing 2/4 progress)
              if (daysDone + Math.max(0, daysRemaining - 1) < target && !hasActivity(todayStr)) {
                   // Special check: If I haven't done it today, and (daysDone + remaining if I start tomorrow) < target?
                   // Actually, simplest check: (Current Count + Days Left In Period) < Target
                   // Note: 'daysRemaining' includes Today.
                   if ((daysDone + (daysRemaining > 0 ? daysRemaining - (hasActivity(todayStr) ? 0 : 0) : 0)) < target) {
                      
                      // Let's iterate forward from Today to End of Period to count potential slots.
                      let potential = 0;
                      let t = new Date(todayDate);
                      // If today is NOT done, we can do it.
                      if (!hasActivity(toDateStr(t))) potential++;
                      
                      // Future days
                      t.setDate(t.getDate() + 1);
                      while(t <= periodEnd) {
                          potential++;
                          t.setDate(t.getDate() + 1);
                      }
                      
                      if (daysDone + potential < target) {
                          // Impossible to maintain streak. Return just current progress.
                          return daysDone;
                      }
                   }
              }
              // If it IS possible, or already met, we add to streak and check history
              streak += daysDone;

          } else {
              // Past Period
              if (daysDone >= target) {
                  streak += daysDone;
              } else {
                  // Chain broken
                  break; 
              }
          }

          // Move pointer to previous period
          if (isWeekly) {
              pointerDate.setDate(pointerDate.getDate() - 7);
          } else {
              pointerDate.setMonth(pointerDate.getMonth() - 1);
              pointerDate.setDate(15); // Middle of previous month to be safe
          }
      }

      return streak;
  }
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
