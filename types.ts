
export interface CategoryDef {
  id: string;
  name: string;
  color: string; // e.g. 'red', 'blue', 'green', 'purple'
}

export type HabitType = 'checkbox' | 'numeric';
export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: number;
  name: string;
  categoryId: string;
  type: HabitType;
  target?: number; // For numeric types (e.g. 2000 ml)
  unit?: string;   // e.g. 'ml', 'pages', 'mins'
  frequency: FrequencyType; 
  frequencyGoal: number; // e.g. 3 times per week
  reminderTime?: string; 
  reminderInterval?: number; 
  xpReward: number; 
  
  // Calorie Config
  isCalorieBurner?: boolean;
}

export interface Todo {
  id: number;
  text: string;
  done: boolean;
  color?: string; // New: Color coding for priorities/categories
  reminderTime?: string; // Optional reminder time "HH:MM"
  reminderInterval?: number; // Optional reminder interval in minutes
}

export interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export interface Workout {
  id: number;
  name: string;
  calories: number;
  linkedHabitId?: number; // To track if this was created by a habit
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
}

export type SoundType = 'modern' | 'classic' | 'retro';

export interface UserState {
  // Profile
  name: string;
  age: number;
  weight: number; // in kg

  xp: number;
  level: number;
  proteinTarget: number; // Daily protein target in grams
  
  // Calorie Targets
  caloriesInTarget: number;
  caloriesOutTarget: number;
  netCaloriesTarget: number;

  theme: 'light' | 'dark';
  accentColor: string; // e.g. 'blue', 'violet'
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  backgroundKeepAlive: boolean; // Plays silent audio to keep app running

  // Sound Config
  alarmDuration: number; // seconds
  chimeDuration: number; // seconds
  soundType: SoundType;
  // DND Config
  dndStartTime?: string; // "23:00"
  dndEndTime?: string;   // "07:00"
}

export interface FoodHistoryItem {
  calories: number;
  protein: number;
}

export interface AppState {
  user: UserState;
  categories: CategoryDef[];
  habits: Habit[];
  todos: Todo[];
  goals: Goal[];
  vision: string;
  // Logs: "YYYY-MM-DD": { [habitId]: value }
  logs: Record<string, Record<number, number | boolean>>;
  // Day Scores: "YYYY-MM-DD": number (1-10)
  dayScores: Record<string, number>;
  // Meals: "YYYY-MM-DD": Meal[]
  meals: Record<string, Meal[]>;
  // Workouts: "YYYY-MM-DD": Workout[]
  workouts: Record<string, Workout[]>;
  // History for smart autocomplete
  foodHistory: Record<string, FoodHistoryItem>;
}

export const INITIAL_STATE: AppState = {
  user: { 
      name: "Guest",
      age: 25,
      weight: 70,
      xp: 0, 
      level: 1, 
      proteinTarget: 150,
      caloriesInTarget: 2000,
      caloriesOutTarget: 500,
      netCaloriesTarget: 1500, 
      theme: 'light',
      accentColor: 'blue',
      soundEnabled: true, 
      vibrationEnabled: true,
      backgroundKeepAlive: false,
      alarmDuration: 30,
      chimeDuration: 5,
      soundType: 'modern',
      dndStartTime: "23:00",
      dndEndTime: "07:00"
  },
  categories: [
    { id: 'str', name: 'Strength', color: 'red' },
    { id: 'int', name: 'Intellect', color: 'blue' },
    { id: 'vit', name: 'Vitality', color: 'emerald' },
  ],
  habits: [],
  todos: [],
  goals: [],
  vision: "",
  logs: {},
  dayScores: {},
  meals: {},
  workouts: {},
  foodHistory: {},
};
