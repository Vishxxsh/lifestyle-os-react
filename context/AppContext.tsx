import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, INITIAL_STATE, Habit, Todo, Meal, Goal, Category, HabitType } from '../types';

interface AppContextType {
  state: AppState;
  addHabit: (name: string, category: Category, type: HabitType, target?: number, reminderTime?: string, reminderInterval?: number, xpReward?: number) => void;
  updateHabit: (id: number, updates: Partial<Habit>) => void;
  reorderHabit: (id: number, direction: 'up' | 'down') => void;
  toggleHabit: (id: number, date: string) => void;
  incrementHabit: (id: number, date: string, amount: number) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  addMeal: (name: string, calories: number, protein: number, date: string) => void;
  deleteMeal: (id: number, date: string) => void;
  addGoal: (name: string, target: number, current: number) => void;
  updateGoal: (id: number, amountToAdd: number) => void;
  updateVision: (text: string) => void;
  resetData: () => void;
  importData: (newState: AppState) => void;
  // FAB Control
  fabOnClick: (() => void) | null;
  setFabOnClick: (fn: (() => void) | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lifestyleOS_v4';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [fabOnClick, setFabAction] = useState<(() => void) | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load state", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const addHabit = (name: string, category: Category, type: HabitType, target?: number, reminderTime?: string, reminderInterval?: number, xpReward: number = 10) => {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { 
        id: Date.now(), 
        name, 
        category, 
        type, 
        target, 
        reminderTime, 
        reminderInterval, 
        xpReward 
      }]
    }));
  };

  const updateHabit = (id: number, updates: Partial<Habit>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const reorderHabit = (id: number, direction: 'up' | 'down') => {
    setState(prev => {
      const habits = [...prev.habits];
      const index = habits.findIndex(h => h.id === id);
      if (index === -1) return prev;
      
      const currentHabit = habits[index];
      
      // Find the nearest neighbor with the SAME category to swap with
      let swapIndex = -1;
      
      if (direction === 'up') {
        for (let i = index - 1; i >= 0; i--) {
          if (habits[i].category === currentHabit.category) {
            swapIndex = i;
            break;
          }
        }
      } else {
        for (let i = index + 1; i < habits.length; i++) {
          if (habits[i].category === currentHabit.category) {
            swapIndex = i;
            break;
          }
        }
      }

      if (swapIndex !== -1) {
        [habits[index], habits[swapIndex]] = [habits[swapIndex], habits[index]];
        return { ...prev, habits };
      }

      return prev;
    });
  };

  const toggleHabit = (id: number, date: string) => {
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit) return prev;

      const dayLogs = prev.logs[date] || {};
      const currentVal = dayLogs[id];
      const newVal = !currentVal;
      
      const newLogs = {
        ...prev.logs,
        [date]: { ...dayLogs, [id]: newVal }
      };

      let { xp, level } = prev.user;
      const xpAmount = habit.xpReward || 10;

      if (newVal) {
          xp += xpAmount;
          // While loop allows multi-level jumps if reward is high
          while (xp >= level * 100) { 
             xp -= level * 100;
             level++; 
          }
      } else {
           // Basic undo logic (doesn't de-level to keep it simple and safe)
           xp = Math.max(0, xp - xpAmount);
      }

      return {
        ...prev,
        logs: newLogs,
        user: { level, xp }
      };
    });
  };

  const incrementHabit = (id: number, date: string, amount: number) => {
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit) return prev;

      const dayLogs = prev.logs[date] || {};
      const currentVal = (dayLogs[id] as number) || 0;
      const newVal = currentVal + amount;
      
      const newLogs = {
        ...prev.logs,
        [date]: { ...dayLogs, [id]: newVal }
      };

      let { xp, level } = prev.user;
      const xpPerUnit = habit.xpReward || 1; 
      
      xp += xpPerUnit * amount; 
      
      // While loop allows multi-level jumps
      while (xp >= level * 100) { 
        xp -= level * 100;
        level++; 
      }

      return { ...prev, logs: newLogs, user: { level, xp } };
    });
  };

  const addTodo = (text: string) => {
    setState(prev => ({
      ...prev,
      todos: [{ id: Date.now(), text, done: false }, ...prev.todos]
    }));
  };

  const toggleTodo = (id: number) => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const deleteTodo = (id: number) => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== id)
    }));
  };

  const addMeal = (name: string, calories: number, protein: number, date: string) => {
    setState(prev => {
      const dayMeals = prev.meals[date] || [];
      const newMeals = [...dayMeals, { id: Date.now(), name, calories, protein }];
      const newHistory = { ...prev.foodHistory, [name]: { calories, protein } };

      return {
        ...prev,
        meals: { ...prev.meals, [date]: newMeals },
        foodHistory: newHistory
      };
    });
  };

  const deleteMeal = (id: number, date: string) => {
     setState(prev => {
        const dayMeals = prev.meals[date] || [];
        return {
            ...prev,
            meals: { ...prev.meals, [date]: dayMeals.filter(m => m.id !== id) }
        };
     });
  };

  const addGoal = (name: string, target: number, current: number) => {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, { id: Date.now(), name, target, current }]
    }));
  };

  const updateGoal = (id: number, amountToAdd: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, current: g.current + amountToAdd } : g)
    }));
  };

  const updateVision = (text: string) => {
    setState(prev => ({ ...prev, vision: text }));
  };

  const resetData = () => {
    setState(INITIAL_STATE);
  };

  const importData = (newState: AppState) => {
      setState(newState);
  };

  const setFabOnClick = useCallback((fn: (() => void) | null) => {
      setFabAction(() => fn);
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      state,
      addHabit,
      updateHabit,
      reorderHabit,
      toggleHabit,
      incrementHabit,
      addTodo,
      toggleTodo,
      deleteTodo,
      addMeal,
      deleteMeal,
      addGoal,
      updateGoal,
      updateVision,
      resetData,
      importData,
      fabOnClick,
      setFabOnClick
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
