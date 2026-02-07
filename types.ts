
export type Category = 'str' | 'int' | 'vit';
export type HabitType = 'checkbox' | 'numeric';

export interface Habit {
  id: number;
  name: string;
  category: Category;
  type: HabitType;
  target?: number; // For numeric types
  reminderTime?: string; // Daily alarm "HH:MM"
  reminderInterval?: number; // Minutes
  xpReward: number; // XP gained per completion or per unit
}

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
}

export interface UserState {
  xp: number;
  level: number;
}

export interface FoodHistoryItem {
  calories: number;
  protein: number;
}

export interface AppState {
  user: UserState;
  habits: Habit[];
  todos: Todo[];
  goals: Goal[];
  vision: string;
  // Logs: "YYYY-MM-DD": { [habitId]: value }
  logs: Record<string, Record<number, number | boolean>>;
  // Meals: "YYYY-MM-DD": Meal[]
  meals: Record<string, Meal[]>;
  // History for smart autocomplete
  foodHistory: Record<string, FoodHistoryItem>;
}

export const INITIAL_STATE: AppState = {
  user: { xp: 0, level: 1 },
  habits: [],
  todos: [],
  goals: [],
  vision: "",
  logs: {},
  meals: {},
  foodHistory: {},
};
