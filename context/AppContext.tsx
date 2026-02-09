
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, INITIAL_STATE, Habit, Todo, Meal, Workout, Goal, CategoryDef, HabitType, UserState, FrequencyType } from '../types';

interface AppContextType {
  state: AppState;
  addHabit: (name: string, categoryId: string, type: HabitType, target: number | undefined, unit: string | undefined, frequency: FrequencyType, frequencyGoal: number, reminderTime?: string, reminderInterval?: number, xpReward?: number) => void;
  updateHabit: (id: number, updates: Partial<Habit>) => void;
  deleteHabit: (id: number) => void;
  moveHabit: (activeId: number, overId: number) => void; 
  toggleHabit: (id: number, date: string) => void;
  incrementHabit: (id: number, date: string, amount: number) => void;
  setHabitValue: (id: number, date: string, value: number | boolean) => void; 
  
  // Day Score
  setDayScore: (date: string, score: number) => void;

  // Category Mgmt
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;

  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  
  addMeal: (name: string, calories: number, protein: number, date: string) => void;
  deleteMeal: (id: number, date: string) => void;

  addWorkout: (name: string, calories: number, date: string) => void;
  deleteWorkout: (id: number, date: string) => void;

  addGoal: (name: string, target: number, current: number) => void;
  updateGoal: (id: number, amountToAdd: number) => void; 
  editGoal: (id: number, name: string, target: number, current: number) => void; 
  deleteGoal: (id: number) => void;
  updateVision: (text: string) => void;

  // User Config
  updateUserConfig: (updates: Partial<UserState>) => void;
  
  resetData: () => void;
  importData: (jsonData: string) => boolean;
  // FAB Control
  fabOnClick: (() => void) | null;
  setFabOnClick: (fn: (() => void) | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lifestyleOS_v5'; 

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
        
        // MIGRATIONS
        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = INITIAL_STATE.categories;
        }
        if (!parsed.dayScores) parsed.dayScores = {};

        if (parsed.habits) {
            parsed.habits = parsed.habits.map((h: any) => ({
                ...h,
                categoryId: h.categoryId || h.category,
                frequency: h.frequency || 'daily',
                frequencyGoal: h.frequencyGoal || 1,
                unit: h.unit || (h.type === 'numeric' ? 'units' : undefined)
            }));
        }

        if (!parsed.workouts) parsed.workouts = {};
        if (!parsed.goals) parsed.goals = [];
        
        // Settings Migration
        if (!parsed.user.theme) parsed.user.theme = 'light';
        if (parsed.user.soundEnabled === undefined) parsed.user.soundEnabled = true;
        if (parsed.user.vibrationEnabled === undefined) parsed.user.vibrationEnabled = true;
        if (!parsed.user.proteinTarget) parsed.user.proteinTarget = 150;

        // New Sound Config Migrations
        if (parsed.user.alarmDuration === undefined) parsed.user.alarmDuration = 30;
        if (parsed.user.chimeDuration === undefined) parsed.user.chimeDuration = 5;
        if (!parsed.user.soundType) parsed.user.soundType = 'modern';

        // DND Migration
        if (!parsed.user.dndStartTime) parsed.user.dndStartTime = "23:00";
        if (!parsed.user.dndEndTime) parsed.user.dndEndTime = "07:00";

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

  const addHabit = (name: string, categoryId: string, type: HabitType, target?: number, unit?: string, frequency: FrequencyType = 'daily', frequencyGoal: number = 1, reminderTime?: string, reminderInterval?: number, xpReward: number = 10) => {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { 
        id: Date.now(), 
        name, 
        categoryId, 
        type, 
        target,
        unit,
        frequency,
        frequencyGoal, 
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
      habits: prev.habits.filter(h => String(h.id) !== String(id)),
    }));
  };

  const moveHabit = (activeId: number, overId: number) => {
    setState(prev => {
        const oldIndex = prev.habits.findIndex(h => h.id === activeId);
        const newIndex = prev.habits.findIndex(h => h.id === overId);
        
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

        const newHabits = [...prev.habits];
        const [movedHabit] = newHabits.splice(oldIndex, 1);
        newHabits.splice(newIndex, 0, movedHabit);

        return { ...prev, habits: newHabits };
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
        user: { ...prev.user, level, xp }
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
      
      // Handle both positive and negative increments
      const xpChange = xpPerUnit * amount;
      
      if (xpChange > 0) {
          xp += xpChange;
          while (xp >= level * 100) { 
            xp -= level * 100;
            level++; 
          }
      } else {
          // Prevent dropping below 0 for the current level (simple implementation)
          xp = Math.max(0, xp + xpChange);
      }

      return { ...prev, logs: newLogs, user: { ...prev.user, level, xp } };
    });
  };

  const setHabitValue = (id: number, date: string, value: number | boolean) => {
      setState(prev => {
        const habit = prev.habits.find(h => h.id === id);
        // If habit undefined, just update logs without XP calc
        if (!habit) {
             const dayLogs = prev.logs[date] || {};
             const newLogs = {
                ...prev.logs,
                [date]: { ...dayLogs, [id]: value }
             };
             return { ...prev, logs: newLogs };
        }

        const dayLogs = prev.logs[date] || {};
        const oldValue = dayLogs[id];
        
        // If value unchanged, do nothing to prevent unnecessary renders/calcs
        if (oldValue === value) return prev;

        // Calculate XP Change
        let xpChange = 0;
        // Default rewards: 10 for checkbox, 1 per unit for numeric
        const reward = habit.xpReward || (habit.type === 'checkbox' ? 10 : 1);

        if (habit.type === 'checkbox') {
            const oldBool = !!oldValue;
            const newBool = !!value;
            if (newBool !== oldBool) {
                xpChange = newBool ? reward : -reward;
            }
        } else {
            const oldNum = (typeof oldValue === 'number') ? oldValue : 0;
            const newNum = (typeof value === 'number') ? value : 0;
            xpChange = (newNum - oldNum) * reward;
        }

        let { xp, level } = prev.user;

        if (xpChange > 0) {
            xp += xpChange;
            while (xp >= level * 100) {
                xp -= level * 100;
                level++;
            }
        } else if (xpChange < 0) {
            // Cap at 0 to prevent de-leveling complexity
            xp = Math.max(0, xp + xpChange);
        }

        const newLogs = {
            ...prev.logs,
            [date]: { ...dayLogs, [id]: value }
        };

        return { ...prev, logs: newLogs, user: { ...prev.user, level, xp } };
      });
  };

  const setDayScore = (date: string, score: number) => {
      setState(prev => ({
          ...prev,
          dayScores: { ...prev.dayScores, [date]: score }
      }));
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
      categories: prev.categories.filter(c => String(c.id) !== String(id)),
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
      todos: prev.todos.filter(t => String(t.id) !== String(id))
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
            meals: { ...prev.meals, [date]: dayMeals.filter(m => String(m.id) !== String(id)) }
        };
     });
  };

  // --- Workouts ---
  const addWorkout = (name: string, calories: number, date: string) => {
    setState(prev => {
      const dayWorkouts = prev.workouts?.[date] || [];
      const newWorkouts = [...dayWorkouts, { id: Date.now(), name, calories }];
      return {
        ...prev,
        workouts: { ...prev.workouts, [date]: newWorkouts }
      };
    });
  };

  const deleteWorkout = (id: number, date: string) => {
    setState(prev => {
       const dayWorkouts = prev.workouts?.[date] || [];
       return {
           ...prev,
           workouts: { ...prev.workouts, [date]: dayWorkouts.filter(w => String(w.id) !== String(id)) }
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

  const editGoal = (id: number, name: string, target: number, current: number) => {
      setState(prev => ({
          ...prev,
          goals: prev.goals.map(g => g.id === id ? { ...g, name, target, current } : g)
      }));
  };

  const deleteGoal = (id: number) => {
      setState(prev => ({
          ...prev,
          goals: prev.goals.filter(g => String(g.id) !== String(id))
      }));
  };

  const updateVision = (text: string) => {
    setState(prev => ({ ...prev, vision: text }));
  };

  const updateUserConfig = (updates: Partial<UserState>) => {
      setState(prev => ({
          ...prev,
          user: { ...prev.user, ...updates }
      }));
  };

  const resetData = () => {
    setState(INITIAL_STATE);
  };

  const importData = (jsonStr: string): boolean => {
      try {
          const parsed = JSON.parse(jsonStr);
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
      moveHabit,
      toggleHabit,
      incrementHabit,
      setHabitValue,
      setDayScore,
      addCategory,
      updateCategory,
      deleteCategory,
      addTodo,
      toggleTodo,
      deleteTodo,
      addMeal,
      deleteMeal,
      addWorkout,
      deleteWorkout,
      addGoal,
      updateGoal,
      editGoal,
      deleteGoal,
      updateVision,
      updateUserConfig,
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
