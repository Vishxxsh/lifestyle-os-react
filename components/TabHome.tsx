
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, formatDateDisplay } from '../utils';
import { Check, Trash2, Plus, Utensils, Edit2, Calendar, Smile, Menu, X, Flame, GripVertical, Bell, Clock, Repeat } from 'lucide-react';
import { Modal } from './Modal';

interface TabHomeProps {
    onOpenSettings: () => void;
}

const COLORS = ['slate', 'red', 'orange', 'emerald', 'blue', 'violet', 'pink'];

export const TabHome: React.FC<TabHomeProps> = ({ onOpenSettings }) => {
  const { state, addTodo, toggleTodo, deleteTodo, moveTodo, updateTodo, updateUserConfig, setDayScore, setHabitValue, addMeal, deleteMeal } = useApp();
  const [newTodo, setNewTodo] = useState("");
  const [newTodoColor, setNewTodoColor] = useState("slate");
  const [draggedTodoId, setDraggedTodoId] = useState<number | null>(null);

  // Todo Reminder Modal
  const [reminderTodoId, setReminderTodoId] = useState<number | null>(null);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderInterval, setReminderInterval] = useState("");
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Log Day Modal State
  const [isLogDayOpen, setIsLogDayOpen] = useState(false);
  const [logDate, setLogDate] = useState(getTodayStr());
  const [dayRating, setDayRating] = useState(5);
  // Temporary state for the batch log
  const [batchLogs, setBatchLogs] = useState<Record<number, number | boolean>>({});
  const [batchCalories, setBatchCalories] = useState<Record<number, number>>({});
  
  // Temporary Meal Logging State within Modal
  const [tempMeals, setTempMeals] = useState<Array<{name: string, cal: number, pro: number}>>([]);
  const [newMealName, setNewMealName] = useState("");
  const [newMealCal, setNewMealCal] = useState("");
  const [newMealPro, setNewMealPro] = useState("");

  // Protein Modal State
  const [isProteinModalOpen, setIsProteinModalOpen] = useState(false);
  const [tempProteinTarget, setTempProteinTarget] = useState("");

  const todayStr = getTodayStr();
  
  // XP Calculation
  const nextLevelXP = state.user.level * 100;
  const xpPercentage = Math.min(100, (state.user.xp / nextLevelXP) * 100);

  // Stats Data
  const todayMeals = state.meals[todayStr] || [];
  const caloriesIn = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const protein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const proteinTarget = state.user.proteinTarget || 150;
  const proteinProgress = Math.min(100, (protein / proteinTarget) * 100);

  const todayWorkouts = state.workouts?.[todayStr] || [];
  const caloriesOut = todayWorkouts.reduce((acc, w) => acc + w.calories, 0);
  
  const netCalories = caloriesIn - caloriesOut;
  const inTarget = state.user.caloriesInTarget || 2000;
  const outTarget = state.user.caloriesOutTarget || 500;
  const netTarget = inTarget - outTarget;

  // Colors based on targets
  let netColor = 'text-gray-900 dark:text-white';
  if (netTarget < 0) {
      // Negative Target (Weight Loss) -> Green if Actual is also Negative
      netColor = netCalories <= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  } else {
      // Positive Target (Weight Gain) -> Green if Actual is also Positive
      netColor = netCalories >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  }

  // Day Score for today (if exists)
  const currentDayScore = state.dayScores[todayStr];

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim(), newTodoColor);
      setNewTodo("");
    }
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTodoId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedTodoId !== null && draggedTodoId !== targetId) {
        moveTodo(draggedTodoId, targetId);
    }
    setDraggedTodoId(null);
  };

  const cycleTodoColor = (id: number, currentColor?: string) => {
      const idx = COLORS.indexOf(currentColor || 'slate');
      const nextIdx = (idx + 1) % COLORS.length;
      updateTodo(id, { color: COLORS[nextIdx] });
  };

  const getColorClass = (c: string = 'slate') => {
    const map: any = {
        slate: 'border-gray-200 dark:border-gray-800',
        red: 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10',
        orange: 'border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10',
        emerald: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10',
        blue: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10',
        violet: 'border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/10',
        pink: 'border-pink-200 dark:border-pink-900/50 bg-pink-50/50 dark:bg-pink-900/10',
    };
    return map[c] || map.slate;
  };

  const openProteinModal = () => {
      setTempProteinTarget(proteinTarget.toString());
      setIsProteinModalOpen(true);
  };

  const saveProteinTarget = () => {
      const val = parseInt(tempProteinTarget);
      if (!isNaN(val) && val > 0) {
          updateUserConfig({ proteinTarget: val });
          setIsProteinModalOpen(false);
      }
  };

  const openReminder = (id: number, currentTime?: string, currentInterval?: number) => {
      setReminderTodoId(id);
      setReminderTime(currentTime || "");
      setReminderInterval(currentInterval ? currentInterval.toString() : "");
      setIsReminderModalOpen(true);
  };

  const saveReminder = () => {
      if (reminderTodoId !== null) {
          updateTodo(reminderTodoId, { 
              reminderTime: reminderTime || undefined,
              reminderInterval: reminderInterval ? parseInt(reminderInterval) : undefined
          });
          setIsReminderModalOpen(false);
      }
  };

  const clearReminder = () => {
      if (reminderTodoId !== null) {
          updateTodo(reminderTodoId, { reminderTime: undefined, reminderInterval: undefined });
          setIsReminderModalOpen(false);
      }
  };

  const loadLogData = (date: string) => {
      setLogDate(date);
      setDayRating(state.dayScores[date] || 5);

      const existingLogs = state.logs[date] || {};
      setBatchLogs({ ...existingLogs });

      const existingCals: Record<number, number> = {};
      const workouts = state.workouts[date] || [];
      workouts.forEach(w => {
          if (w.linkedHabitId) {
              existingCals[w.linkedHabitId] = w.calories;
          }
      });
      setBatchCalories(existingCals);
      
      setTempMeals([]);
      setNewMealName("");
      setNewMealCal("");
      setNewMealPro("");
  };

  const openLogDay = () => {
      loadLogData(todayStr);
      setIsLogDayOpen(true);
  };

  const handleBatchLogChange = (habitId: number, value: number | boolean) => {
      setBatchLogs(prev => ({ ...prev, [habitId]: value }));
  };

  const handleBatchCalorieChange = (habitId: number, calories: number) => {
      setBatchCalories(prev => ({ ...prev, [habitId]: calories }));
  };

  const handleMealNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setNewMealName(val);
      if (state.foodHistory[val]) {
          setNewMealCal(state.foodHistory[val].calories.toString());
          setNewMealPro(state.foodHistory[val].protein.toString());
      }
  };

  const handleAddTempMeal = () => {
      if (!newMealName || !newMealCal) return;
      const cal = parseInt(newMealCal) || 0;
      const pro = parseInt(newMealPro) || 0;
      
      setTempMeals([...tempMeals, { name: newMealName, cal, pro }]);
      setNewMealName("");
      setNewMealCal("");
      setNewMealPro("");
  };

  const removeTempMeal = (index: number) => {
      setTempMeals(prev => prev.filter((_, i) => i !== index));
  };

  const saveDayLog = () => {
      setDayScore(logDate, dayRating);
      
      Object.entries(batchLogs).forEach(([hId, val]) => {
          const habitId = parseInt(hId);
          const cals = batchCalories[habitId];
          setHabitValue(habitId, logDate, val, cals);
      });

      tempMeals.forEach(meal => {
          addMeal(meal.name, meal.cal, meal.pro, logDate);
      });

      setIsLogDayOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start pb-4">
        <div className="flex items-center gap-3">
             <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                 <Menu size={24} />
             </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Lifestyle</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">{formatDateDisplay(todayStr).toUpperCase()}</p>
            </div>
        </div>
        <button 
            onClick={openLogDay}
            className="group relative flex items-center justify-center p-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg active:scale-95 transition-all"
        >
            <Calendar size={20} />
            <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </button>
      </div>

      {/* Day Score Display */}
      {currentDayScore && (
          <div className="glass border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-ios flex items-center justify-between">
              <div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Daily Rating</span>
                  <div className="flex items-center gap-1 mt-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{currentDayScore}</span>
                      <span className="text-sm font-bold text-gray-400">/ 10</span>
                  </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Smile size={24} />
              </div>
          </div>
      )}

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">
          <span>Level {state.user.level}</span>
          <span>{state.user.xp} / {nextLevelXP} XP</span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-gray-700 to-black dark:from-gray-400 dark:to-white transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Cards - Apple Health Style */}
      <div className="grid grid-cols-2 gap-4">
          {/* Net Calories Card */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-ios border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Flame size={12} className={netTarget < 0 ? 'text-emerald-500' : 'text-orange-500'} />
                      Net Energy
                  </div>
                  <div>
                    <div className={`text-4xl font-black tracking-tighter mb-1 ${netColor}`}>
                        {netCalories > 0 ? `+${netCalories}` : netCalories}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                        <span>In: {caloriesIn}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Out: {caloriesOut}</span>
                    </div>
                  </div>
              </div>
          </div>

          {/* Protein Target Card */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-ios border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
              <button onClick={openProteinModal} className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <Edit2 size={14} />
              </button>
              <div className="flex flex-col h-full justify-between">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Utensils size={12} className="text-blue-500" /> Protein
                 </div>
                 <div>
                     <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
                         {protein}<span className="text-lg text-gray-400 font-bold">/{proteinTarget}g</span>
                     </div>
                     <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full" 
                            style={{ width: `${proteinProgress}%` }}
                        ></div>
                     </div>
                 </div>
              </div>
          </div>
      </div>

      {/* Quick Missions */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Quick Missions</h3>
        
        {/* Input Area */}
        <div className="flex gap-3 mb-6">
           <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-ios p-2 flex items-center gap-2 border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
               <div className="flex gap-1.5 pl-2 overflow-x-auto no-scrollbar max-w-[80px]">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setNewTodoColor(c)}
                            className={`w-4 h-4 rounded-full transition-all flex-shrink-0 ${newTodoColor === c ? 'scale-125 ring-2 ring-gray-200 dark:ring-gray-700' : 'opacity-40 hover:opacity-100'} bg-${c}-500`}
                        />
                    ))}
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                <input 
                    type="text" 
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    placeholder="What's next?"
                />
           </div>
           <button 
                onClick={handleAddTodo}
                className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
           >
                <Plus size={20} strokeWidth={3} />
           </button>
        </div>

        <div className="space-y-3">
          {state.todos.map(todo => (
            <div 
                key={todo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, todo.id)}
                className={`group relative bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border transition-all duration-300 active:scale-[0.98] ${getColorClass(todo.color)} ${draggedTodoId === todo.id ? 'opacity-30' : ''}`}
            >
              <div className="flex items-start gap-3">
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    todo.done 
                        ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 scale-100' 
                        : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-gray-400 dark:hover:border-gray-500 scale-100'
                    }`}
                  >
                    <Check size={12} strokeWidth={4} />
                  </button>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                      <div className={`text-sm font-medium leading-relaxed break-words transition-all ${todo.done ? 'text-gray-400 dark:text-gray-600 line-through decoration-2 decoration-gray-300' : 'text-gray-900 dark:text-white'}`}>
                        {todo.text}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                          {todo.reminderTime && !todo.done && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                  <Clock size={10} /> {todo.reminderTime}
                              </div>
                          )}
                          {todo.reminderInterval && !todo.done && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                                  <Repeat size={10} /> {todo.reminderInterval}m
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                          onClick={() => openReminder(todo.id, todo.reminderTime, todo.reminderInterval)}
                          className={`p-2 rounded-xl transition-colors ${todo.reminderTime || todo.reminderInterval ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-300 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                          <Bell size={16} fill={todo.reminderTime || todo.reminderInterval ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="p-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                          <GripVertical size={16} />
                      </div>
                  </div>
              </div>
            </div>
          ))}
          {state.todos.length === 0 && (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-600">
                    <Check size={32} />
                </div>
                <p className="text-gray-400 text-xs font-medium">All clear for now</p>
            </div>
          )}
        </div>
      </div>

      {/* --- LOG DAY MODAL --- */}
      <Modal isOpen={isLogDayOpen} onClose={() => setIsLogDayOpen(false)} title="Log My Day">
          <div className="space-y-8">
              {/* Date & Score */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Entry Date</label>
                      <input 
                         type="date" 
                         value={logDate}
                         onChange={(e) => loadLogData(e.target.value)}
                         className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none text-right font-mono"
                      />
                  </div>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                              <Smile size={16} className="text-blue-500" /> Daily Rating
                          </label>
                          <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{dayRating}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="10" step="1"
                        value={dayRating}
                        onChange={(e) => setDayRating(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>Rough Day</span>
                          <span>Excellent</span>
                      </div>
                  </div>
              </div>

              {/* Habits List */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Habit Checklist</h3>
                  <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                      {state.habits.map(h => {
                          const val = batchLogs[h.id];
                          const isActive = h.type === 'checkbox' ? !!val : (val as number) > 0;

                          return (
                            <div key={h.id} className={`p-4 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                                  <div className="flex items-center justify-between">
                                      <div>
                                          <div className={`text-sm font-bold transition-colors ${isActive ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>{h.name}</div>
                                          <div className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400'}`}>
                                              {h.type === 'numeric' && `Target: ${h.target} ${h.unit}`}
                                              {h.isCalorieBurner && <span className="flex items-center gap-1 text-orange-500"><Flame size={8} fill="currentColor"/> Burner</span>}
                                          </div>
                                      </div>
                                      
                                      {h.type === 'checkbox' ? (
                                          <button 
                                            onClick={() => handleBatchLogChange(h.id, !val)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                val ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                                            }`}
                                          >
                                              <Check size={20} strokeWidth={3} />
                                          </button>
                                      ) : (
                                          <div className={`flex items-center rounded-lg p-1 ${isActive ? 'bg-white/10 dark:bg-black/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                              <input 
                                                 type="number"
                                                 className={`w-16 h-8 bg-transparent text-center font-bold outline-none ${isActive ? 'text-white dark:text-gray-900 placeholder-white/50' : 'text-gray-900 dark:text-white'}`}
                                                 placeholder="0"
                                                 value={typeof val === 'number' ? val : ''}
                                                 onChange={(e) => handleBatchLogChange(h.id, parseInt(e.target.value) || 0)}
                                              />
                                          </div>
                                      )}
                                  </div>

                                  {h.isCalorieBurner && isActive && (
                                      <div className="mt-4 pt-3 border-t border-white/20 dark:border-black/10 flex items-center justify-between animate-fade-in">
                                          <label className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isActive ? 'text-white/70 dark:text-black/70' : 'text-orange-500'}`}>
                                              <Flame size={10} fill="currentColor" /> Total Calories
                                          </label>
                                          <input 
                                              type="number" 
                                              className={`w-20 p-1.5 rounded-lg text-center text-xs font-bold outline-none ${isActive ? 'bg-white/20 dark:bg-black/10 text-white dark:text-black placeholder-white/40' : 'bg-orange-50 text-orange-900'}`}
                                              placeholder="0"
                                              value={batchCalories[h.id] || ''}
                                              onChange={(e) => handleBatchCalorieChange(h.id, parseInt(e.target.value) || 0)}
                                          />
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Meal Logging Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Utensils size={14} /> Meals
                  </h3>
                  
                  {/* List Container */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-2 space-y-1">
                      {state.meals[logDate]?.length > 0 && (
                          state.meals[logDate].map(m => (
                              <div key={m.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
                                 <div>
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</div>
                                    <div className="text-[10px] text-gray-400">{m.calories} cal, {m.protein}g</div>
                                 </div>
                                 <button onClick={() => deleteMeal(m.id, logDate)} className="p-2 text-gray-300 hover:text-red-500">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                          ))
                      )}

                      {/* Pending Meals */}
                      {tempMeals.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-gray-400">{m.cal} cal, {m.pro}g</span>
                                  <button onClick={() => removeTempMeal(idx)} className="text-red-400">
                                      <X size={14} />
                                  </button>
                              </div>
                          </div>
                      ))}
                      
                      {/* Input Row */}
                      <div className="p-2">
                        <input 
                            type="text" 
                            list="meal-history-logday"
                            placeholder="Add food name..." 
                            className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-blue-500 transition-colors mb-2"
                            value={newMealName}
                            onChange={handleMealNameChange}
                        />
                        <datalist id="meal-history-logday">
                            {Object.keys(state.foodHistory).map(f => <option key={f} value={f} />)}
                        </datalist>

                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                placeholder="Cals" 
                                className="flex-1 min-w-0 p-3 bg-white dark:bg-gray-900 rounded-xl text-sm outline-none"
                                value={newMealCal}
                                onChange={(e) => setNewMealCal(e.target.value)}
                            />
                            <input 
                                type="number" 
                                placeholder="Protein" 
                                className="flex-1 min-w-0 p-3 bg-white dark:bg-gray-900 rounded-xl text-sm outline-none"
                                value={newMealPro}
                                onChange={(e) => setNewMealPro(e.target.value)}
                            />
                            <button 
                                onClick={handleAddTempMeal}
                                className="w-12 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                      </div>
                  </div>
              </div>

              <button 
                 onClick={saveDayLog}
                 className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg rounded-3xl shadow-lg active:scale-95 transition-transform"
              >
                  Save Entry
              </button>
          </div>
      </Modal>

      {/* --- PROTEIN GOAL MODAL --- */}
      <Modal isOpen={isProteinModalOpen} onClose={() => setIsProteinModalOpen(false)} title="Protein Goal">
          <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl flex flex-col items-center justify-center space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Daily Target</label>
                  <div className="flex items-baseline gap-1">
                    <input 
                        type="number"
                        className="w-32 bg-transparent text-center text-5xl font-black text-gray-900 dark:text-white outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors"
                        placeholder="150" 
                        value={tempProteinTarget} 
                        onChange={e => setTempProteinTarget(e.target.value)} 
                        autoFocus
                    />
                    <span className="text-xl font-bold text-gray-400">grams</span>
                  </div>
              </div>
              <p className="text-sm text-gray-500 text-center leading-relaxed px-4">
                  Protein is essential for muscle repair and satiety. A good rule of thumb is 1.6g-2.2g per kg of bodyweight.
              </p>
              <button 
                  onClick={saveProteinTarget}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-3xl shadow-lg active:scale-95 transition-transform"
              >
                  Update Target
              </button>
          </div>
      </Modal>

      {/* --- TODO REMINDER MODAL --- */}
      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Set Reminder">
          <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                    <label className="block text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-1">
                        <Clock size={12} /> Specific Time
                    </label>
                    <input 
                        type="time" 
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full bg-transparent text-xl font-bold text-gray-900 dark:text-white outline-none"
                    />
                 </div>
                 <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                    <label className="block text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-1">
                        <Repeat size={12} /> Interval (Min)
                    </label>
                    <input 
                        type="number"
                        placeholder="30"
                        value={reminderInterval}
                        onChange={(e) => setReminderInterval(e.target.value)}
                        className="w-full bg-transparent text-xl font-bold text-gray-900 dark:text-white outline-none"
                    />
                 </div>
               </div>
               
               <p className="text-center text-xs text-gray-400 italic">
                   Alerts will notify you even if the app is closed.
               </p>

               <div className="flex gap-3">
                   {(reminderTime || reminderInterval) && (
                       <button 
                           onClick={clearReminder}
                           className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold rounded-2xl active:scale-95 transition-transform"
                       >
                           Clear
                       </button>
                   )}
                   <button 
                       onClick={saveReminder}
                       className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
                   >
                       Save Alarm
                   </button>
               </div>
          </div>
      </Modal>
    </div>
  );
};