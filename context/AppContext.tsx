import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, INITIAL_STATE, Habit, Todo, Meal, Goal, CategoryDef, HabitType } from '../types';

interface AppContextType {
  state: AppState;
  addHabit: (name: string, categoryId: string, type: HabitType, target?: number, reminderTime?: string, reminderInterval?: number, xpReward?: number) => void;
  updateHabit: (id: number, updates: Partial<Habit>) => void;
  deleteHabit: (id: number) => void;
  reorderHabit: (id: number, direction: 'up' | 'down') => void;
  toggleHabit: (id: number, date: string) => void;
  incrementHabit: (id: number, date: string, amount: number) => void;
  
  // Category Mgmt
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;

  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  addMeal: (name: string, calories: number, protein: number, date: string) => void;
  deleteMeal: (id: number, date: string) => void;
  addGoal: (name: string, target: number, current: number) => void;
  updateGoal: (id: number, amountToAdd: number) => void;
  updateVision: (text: string) => void;
  resetData: () => void;
  importData: (jsonData: string) => boolean;
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
        const parsed = JSON.parse(saved);
        
        // MIGRATION: Ensure categories exist if loading old data
        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = INITIAL_STATE.categories;
          // Map old string categories to IDs if necessary, 
          // but our INITIAL_STATE ids match the old string literals ('str', 'int', 'vit'), 
          // so habits referencing 'str' will work fine.
        }

        // MIGRATION: Remap old 'category' field to 'categoryId' if needed
        if (parsed.habits && parsed.habits.length > 0 && parsed.habits[0].category) {
            parsed.habits = parsed.habits.map((h: any) => ({
                ...h,
                categoryId: h.categoryId || h.category, // Use existing or fallback to old field
            }));
        }

        setState(parsed);
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

  const addHabit = (name: string, categoryId: string, type: HabitType, target?: number, reminderTime?: string, reminderInterval?: number, xpReward: number = 10) => {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { 
        id: Date.now(), 
        name, 
        categoryId, 
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

  const deleteHabit = (id: number) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      // Optional: Cleanup logs for this habit? keeping them for history is usually safer
    }));
  };

  const reorderHabit = (id: number, direction: 'up' | 'down') => {
    setState(prev => {
      const habits = [...prev.habits];
      const index = habits.findIndex(h => h.id === id);
      if (index === -1) return prev;
      
      const currentHabit = habits[index];
      
      let swapIndex = -1;
      
      if (direction === 'up') {
        for (let i = index - 1; i >= 0; i--) {
          if (habits[i].categoryId === currentHabit.categoryId) {
            swapIndex = i;
            break;
          }
        }
      } else {
        for (let i = index + 1; i < habits.length; i++) {
          if (habits[i].categoryId === currentHabit.categoryId) {
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
          while (xp >= level * 100) { 
             xp -= level * 100;
             level++; 
          }
      } else {
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
      
      while (xp >= level * 100) { 
        xp -= level * 100;
        level++; 
      }

      return { ...prev, logs: newLogs, user: { level, xp } };
    });
  };

  // --- Category Mgmt ---
  const addCategory = (name: string, color: string) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { id: Date.now().toString(), name, color }]
    }));
  };

  const updateCategory = (id: string, name: string, color: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, name, color } : c)
    }));
  };

  const deleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      // Prevent orphaned habits by assigning them to the first available category or just keeping them (they won't render)
      // Better to delete habits or warn user. For now, we just delete the cat.
    }));
  };

  // --- Todos ---
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

  // --- Meals ---
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

  // --- Goals ---
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

  const importData = (jsonStr: string): boolean => {
      try {
          const parsed = JSON.parse(jsonStr);
          // Basic validation
          if (!parsed.user || !parsed.habits) {
              alert("Invalid backup file format.");
              return false;
          }
          setState(parsed);
          return true;
      } catch (e) {
          console.error(e);
          alert("Failed to parse file.");
          return false;
      }
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
      deleteHabit,
      reorderHabit,
      toggleHabit,
      incrementHabit,
      addCategory,
      updateCategory,
      deleteCategory,
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
