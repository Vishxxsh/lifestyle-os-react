
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, INITIAL_STATE, Habit, Todo, Meal, Workout, Goal, CategoryDef, TodoCategoryDef, HabitType, UserState, FrequencyType } from '../types';

interface AppContextType {
  state: AppState;
  addHabit: (name: string, categoryId: string, type: HabitType, target: number | undefined, unit: string | undefined, frequency: FrequencyType, frequencyGoal: number, reminderTime?: string, reminderInterval?: number, xpReward?: number, isCalorieBurner?: boolean) => void;
  updateHabit: (id: number, updates: Partial<Habit>) => void;
  deleteHabit: (id: number) => void;
  moveHabit: (activeId: number, overId: number) => void; 
  toggleHabit: (id: number, date: string, manualCalories?: number) => void;
  incrementHabit: (id: number, date: string, amount: number) => void;
  setHabitValue: (id: number, date: string, value: number | boolean, manualCalories?: number) => void; 
  
  // Day Score
  setDayScore: (date: string, score: number) => void;

  // Habit Category Mgmt
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;

  // Todo Category Mgmt
  addTodoCategory: (name: string, color: string) => void;
  updateTodoCategory: (id: string, name: string, color: string) => void;
  deleteTodoCategory: (id: string) => void;

  addTodo: (text: string, categoryId?: string, color?: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  moveTodo: (activeId: number, overId: number) => void;
  updateTodo: (id: number, updates: Partial<Todo>) => void;
  
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
  recalculateXP: () => void;
  
  resetData: () => void;
  importData: (jsonData: string) => boolean;
  // FAB Control
  fabOnClick: (() => void) | null;
  setFabOnClick: (fn: (() => void) | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lifestyleOS_v6'; 

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [fabOnClick, setFabAction] = useState<(() => void) | null>(null);

  // Central Migration Logic
  const migrateData = (data: any): AppState => {
      const mergedUser = { ...INITIAL_STATE.user, ...(data.user || {}) };
      
      const newState: AppState = {
          ...INITIAL_STATE,
          ...data,
          user: mergedUser,
          categories: data.categories || INITIAL_STATE.categories,
          // Migration: Ensure todoCategories exists
          todoCategories: data.todoCategories || INITIAL_STATE.todoCategories,
          dayScores: data.dayScores || {},
          logs: data.logs || {},
          meals: data.meals || {},
          workouts: data.workouts || {},
          foodHistory: data.foodHistory || {},
          goals: data.goals || [],
          todos: data.todos || [],
          habits: data.habits || [],
          vision: data.vision || ""
      };

      if (newState.categories.length === 0) {
          newState.categories = INITIAL_STATE.categories;
      }

      newState.habits = newState.habits.map((h: any) => ({
          ...h,
          categoryId: h.categoryId || h.category,
          frequency: h.frequency || 'daily',
          frequencyGoal: h.frequencyGoal || 1,
          unit: h.unit || (h.type === 'numeric' ? 'units' : undefined),
          isCalorieBurner: h.isCalorieBurner || false,
          id: Number(h.id)
      }));

      return newState;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = migrateData(parsed);
        setState(migrated);
      }
    } catch (e) {
      console.error("Failed to load state", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const addHabit = (name: string, categoryId: string, type: HabitType, target?: number, unit?: string, frequency: FrequencyType = 'daily', frequencyGoal: number = 1, reminderTime?: string, reminderInterval?: number, xpReward: number = 10, isCalorieBurner: boolean = false) => {
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
        xpReward,
        isCalorieBurner
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

  const toggleHabit = (id: number, date: string, manualCalories?: number) => {
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

      let newWorkouts = { ...prev.workouts };
      if (habit.isCalorieBurner) {
          const dayWorkouts = newWorkouts[date] || [];
          if (newVal && manualCalories !== undefined && manualCalories > 0) {
              const others = dayWorkouts.filter(w => w.linkedHabitId !== habit.id);
              others.push({
                  id: Date.now(),
                  name: habit.name,
                  calories: manualCalories,
                  linkedHabitId: habit.id
              });
              newWorkouts[date] = others;
          } else if (!newVal) {
              newWorkouts[date] = dayWorkouts.filter(w => w.linkedHabitId !== habit.id);
          }
      }

      return {
        ...prev,
        logs: newLogs,
        user: { ...prev.user, level, xp },
        workouts: newWorkouts
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
      
      const xpChange = xpPerUnit * amount;
      
      if (xpChange > 0) {
          xp += xpChange;
          while (xp >= level * 100) { 
            xp -= level * 100;
            level++; 
          }
      } else {
          xp = Math.max(0, xp + xpChange);
      }

      return { ...prev, logs: newLogs, user: { ...prev.user, level, xp } };
    });
  };

  const setHabitValue = (id: number, date: string, value: number | boolean, manualCalories?: number) => {
      setState(prev => {
        const habit = prev.habits.find(h => h.id === id);
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
        
        let xpChange = 0;
        let shouldUpdateXP = oldValue !== value;

        if (shouldUpdateXP) {
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
        }

        let { xp, level } = prev.user;
        if (xpChange > 0) {
            xp += xpChange;
            while (xp >= level * 100) {
                xp -= level * 100;
                level++;
            }
        } else if (xpChange < 0) {
            xp = Math.max(0, xp + xpChange);
        }

        const newLogs = {
            ...prev.logs,
            [date]: { ...dayLogs, [id]: value }
        };

        let newWorkouts = { ...prev.workouts };
        if (habit.isCalorieBurner) {
            const dayWorkouts = newWorkouts[date] || [];
            const isActive = habit.type === 'checkbox' ? !!value : (value as number) > 0;

            if (isActive && manualCalories !== undefined) {
                 const others = dayWorkouts.filter(w => w.linkedHabitId !== habit.id);
                 if (manualCalories > 0) {
                    others.push({
                        id: Date.now(),
                        name: habit.name,
                        calories: manualCalories,
                        linkedHabitId: habit.id
                    });
                 }
                 newWorkouts[date] = others;
            } else if (!isActive) {
                 newWorkouts[date] = dayWorkouts.filter(w => w.linkedHabitId !== habit.id);
            }
        }

        return { ...prev, logs: newLogs, user: { ...prev.user, level, xp }, workouts: newWorkouts };
      });
  };

  const recalculateXP = () => {
      setState(prev => {
          let totalAccumulatedXP = 0;
          Object.keys(prev.logs).forEach(date => {
              const dayLogs = prev.logs[date];
              Object.keys(dayLogs).forEach(habitIdStr => {
                  const habitId = parseInt(habitIdStr);
                  const val = dayLogs[habitId];
                  const habit = prev.habits.find(h => h.id === habitId);
                  if (habit) {
                      const reward = habit.xpReward || (habit.type === 'checkbox' ? 10 : 1);
                      if (habit.type === 'checkbox') {
                          if (!!val) totalAccumulatedXP += reward;
                      } else if (habit.type === 'numeric') {
                          if (typeof val === 'number') totalAccumulatedXP += (val * reward);
                      }
                  }
              });
          });

          let newLevel = 1;
          let currentXP = totalAccumulatedXP;
          while (currentXP >= newLevel * 100) {
              currentXP -= newLevel * 100;
              newLevel++;
          }

          return {
              ...prev,
              user: { ...prev.user, level: newLevel, xp: currentXP }
          };
      });
  };

  const setDayScore = (date: string, score: number) => {
      setState(prev => ({
          ...prev,
          dayScores: { ...prev.dayScores, [date]: score }
      }));
  };

  // --- Habit Category Mgmt ---
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

  // --- Todo Category Mgmt ---
  const addTodoCategory = (name: string, color: string) => {
    setState(prev => ({
      ...prev,
      todoCategories: [...prev.todoCategories, { id: Date.now().toString(), name, color }]
    }));
  };

  const updateTodoCategory = (id: string, name: string, color: string) => {
    setState(prev => ({
      ...prev,
      todoCategories: prev.todoCategories.map(c => c.id === id ? { ...c, name, color } : c)
    }));
  };

  const deleteTodoCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      todoCategories: prev.todoCategories.filter(c => String(c.id) !== String(id)),
      // Reset categories of deleted todos or leave them? 
      // Safe to leave them, UI will handle unknown categories
    }));
  };


  // --- Todos ---
  const addTodo = (text: string, categoryId?: string, color: string = 'slate') => {
    setState(prev => ({
      ...prev,
      todos: [{ id: Date.now(), text, done: false, categoryId, color }, ...prev.todos]
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

  const moveTodo = (activeId: number, overId: number) => {
    setState(prev => {
       const oldIndex = prev.todos.findIndex(t => t.id === activeId);
       const newIndex = prev.todos.findIndex(t => t.id === overId);
       if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

       const newTodos = [...prev.todos];
       const [moved] = newTodos.splice(oldIndex, 1);
       newTodos.splice(newIndex, 0, moved);

       return { ...prev, todos: newTodos };
    });
  };

  const updateTodo = (id: number, updates: Partial<Todo>) => {
      setState(prev => ({
          ...prev,
          todos: prev.todos.map(t => t.id === id ? { ...t, ...updates } : t)
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
            meals: { ...prev.meals, [date]: dayMeals.filter(m => String(m.id) !== String(id)) }
        };
     });
  };

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
          if (!parsed || typeof parsed !== 'object') {
              alert("Invalid backup file format.");
              return false;
          }
          const migratedData = migrateData(parsed);
          setState(migratedData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData));
          return true;
      } catch (e) {
          console.error(e);
          alert("Failed to parse file. Please check the export file.");
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
      addTodoCategory,
      updateTodoCategory,
      deleteTodoCategory,
      addTodo,
      toggleTodo,
      deleteTodo,
      moveTodo,
      updateTodo,
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
      recalculateXP,
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
