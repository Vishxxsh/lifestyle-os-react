
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, formatDateDisplay } from '../utils';
import { Check, Trash2, Plus, Utensils, Edit2, Calendar, Smile, Menu, X, Flame } from 'lucide-react';
import { Modal } from './Modal';

interface TabHomeProps {
    onOpenSettings: () => void;
}

export const TabHome: React.FC<TabHomeProps> = ({ onOpenSettings }) => {
  const { state, addTodo, toggleTodo, deleteTodo, updateUserConfig, setDayScore, setHabitValue, addMeal } = useApp();
  const [newTodo, setNewTodo] = useState("");

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
      netColor = netCalories <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  } else {
      // Positive Target (Weight Gain) -> Green if Actual is also Positive
      netColor = netCalories >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }

  const inColor = caloriesIn <= inTarget ? 'text-gray-900 dark:text-white' : 'text-red-500';
  const outColor = caloriesOut >= outTarget ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white';

  // Day Score for today (if exists)
  const currentDayScore = state.dayScores[todayStr];

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo("");
    }
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

  const openLogDay = () => {
      setLogDate(todayStr);
      setDayRating(state.dayScores[todayStr] || 5);
      
      // Pre-fill batch logs with existing data for that day
      const existingLogs = state.logs[todayStr] || {};
      setBatchLogs({ ...existingLogs });

      // Pre-fill existing calorie data
      const existingCals: Record<number, number> = {};
      const workouts = state.workouts[todayStr] || [];
      workouts.forEach(w => {
          if (w.linkedHabitId) {
              existingCals[w.linkedHabitId] = w.calories;
          }
      });
      setBatchCalories(existingCals);
      
      // Reset temp meals
      setTempMeals([]);
      setNewMealName("");
      setNewMealCal("");
      setNewMealPro("");
      
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
      // 1. Save Day Score
      setDayScore(logDate, dayRating);
      
      // 2. Commit all habit logs
      Object.entries(batchLogs).forEach(([hId, val]) => {
          const habitId = parseInt(hId);
          // Only pass manualCalories if it's a calorie burner and has a value
          const cals = batchCalories[habitId];
          setHabitValue(habitId, logDate, val, cals);
      });

      // 3. Commit Meals
      tempMeals.forEach(meal => {
          addMeal(meal.name, meal.cal, meal.pro, logDate);
      });

      setIsLogDayOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
             <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                 <Menu size={24} />
             </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lifestyle</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{formatDateDisplay(todayStr)}</p>
            </div>
        </div>
        <div className="flex flex-col items-end gap-2">
           <button 
             onClick={openLogDay}
             className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
           >
             <Calendar size={14} /> Log Day
           </button>
        </div>
      </div>

      {/* Day Score Display (if logged) */}
      {currentDayScore && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest">Today's Rating</span>
              <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-blue-900 dark:text-blue-200">{currentDayScore}</span>
                  <span className="text-sm text-blue-400 dark:text-blue-400">/ 10</span>
              </div>
          </div>
      )}

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
          <span>Experience (Lvl {state.user.level})</span>
          <span>{state.user.xp} / {nextLevelXP}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-900 dark:bg-white transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
          {/* Net Calories Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative z-10 w-full">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">Net Calories</div>
                  <div className={`text-4xl font-black mb-4 ${netColor}`}>
                      {netCalories > 0 ? `+${netCalories}` : netCalories}
                  </div>
                  <div className="flex justify-center items-center gap-6 text-sm">
                      <div className="flex flex-col items-center">
                          <span className={`font-bold ${inColor}`}>{caloriesIn}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">Eaten</span>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex flex-col items-center">
                          <span className={`font-bold ${outColor}`}>{caloriesOut}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">Burnt</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Protein Target Card */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                    <Utensils size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Protein Intake</span>
                 </div>
                 <button onClick={openProteinModal} className="text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white p-1">
                     <Edit2 size={14} />
                 </button>
              </div>
              
              <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{protein}g</span>
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-1">/ {proteinTarget}g</span>
              </div>

              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-700 ease-out" 
                    style={{ width: `${proteinProgress}%` }}
                  ></div>
              </div>
          </div>
      </div>

      {/* Quick Missions */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Missions</h3>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none shadow-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Add new mission..."
          />
          <button 
            onClick={handleAddTodo}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl w-12 flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {state.todos.map(todo => (
            <div key={todo.id} className="group flex items-center bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all active:scale-[0.99]">
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-md border-2 mr-3 flex items-center justify-center transition-colors ${
                  todo.done 
                    ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900' 
                    : 'border-gray-200 dark:border-gray-700 text-transparent hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </button>
              <span className={`flex-1 text-sm ${todo.done ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>
                {todo.text}
              </span>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {state.todos.length === 0 && (
            <div className="text-center text-gray-400 text-xs py-4 italic">No active missions</div>
          )}
        </div>
      </div>

      {/* --- LOG DAY MODAL --- */}
      <Modal isOpen={isLogDayOpen} onClose={() => setIsLogDayOpen(false)} title="Log My Day">
          <div className="space-y-6">
              {/* Date & Score */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</label>
                      <input 
                         type="date" 
                         value={logDate}
                         onChange={(e) => setLogDate(e.target.value)}
                         className="bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none text-right"
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                              <Smile size={14} /> Day Rating
                          </label>
                          <span className="text-xl font-black text-blue-600 dark:text-blue-400">{dayRating}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="10" step="1"
                        value={dayRating}
                        onChange={(e) => setDayRating(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                          <span>Terrible</span>
                          <span>Perfect</span>
                      </div>
                  </div>
              </div>

              {/* Habits List */}
              <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2">Habits Check</h3>
                  <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-3">
                      {/* Filter archived habits to keep list clean */}
                      {state.habits.map(h => {
                          const val = batchLogs[h.id];
                          const isActive = h.type === 'checkbox' ? !!val : (val as number) > 0;

                          return (
                            <div key={h.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600`}></div> 
                                          <div>
                                              <div className="text-sm font-bold text-gray-900 dark:text-white">{h.name}</div>
                                              <div className="flex items-center gap-2">
                                                  {h.type === 'numeric' && <div className="text-[10px] text-gray-400">Target: {h.target} {h.unit}</div>}
                                                  {h.isCalorieBurner && <div className="text-[10px] text-orange-500 font-bold flex items-center gap-1"><Flame size={8}/> Burns Cals</div>}
                                              </div>
                                          </div>
                                      </div>
                                      
                                      {h.type === 'checkbox' ? (
                                          <button 
                                            onClick={() => handleBatchLogChange(h.id, !val)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                                val ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
                                            }`}
                                          >
                                              <Check size={20} strokeWidth={3} />
                                          </button>
                                      ) : (
                                          <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                                              <input 
                                                 type="number"
                                                 className="w-16 h-8 bg-transparent text-center font-bold text-gray-900 dark:text-white outline-none"
                                                 placeholder="0"
                                                 value={typeof val === 'number' ? val : ''}
                                                 onChange={(e) => handleBatchLogChange(h.id, parseInt(e.target.value) || 0)}
                                              />
                                              <span className="text-xs text-gray-400 mr-2">{h.unit}</span>
                                          </div>
                                      )}
                                  </div>

                                  {/* Calorie Burner Input Field */}
                                  {h.isCalorieBurner && isActive && (
                                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between animate-fade-in">
                                          <label className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1">
                                              <Flame size={10} fill="currentColor" /> Total Calories
                                          </label>
                                          <input 
                                              type="number" 
                                              className="w-20 p-1 bg-orange-50 dark:bg-orange-900/10 rounded text-center text-xs font-bold text-orange-900 dark:text-orange-200 outline-none focus:ring-1 focus:ring-orange-500"
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
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Utensils size={14} /> Log Meals
                  </h3>
                  
                  {/* Temp Meals List */}
                  {tempMeals.length > 0 && (
                      <div className="space-y-2 mb-3">
                          {tempMeals.map((m, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                                  <span className="font-bold text-gray-700 dark:text-gray-200">{m.name}</span>
                                  <div className="flex items-center gap-3">
                                      <span className="text-xs text-gray-400">{m.cal} cal, {m.pro}g pro</span>
                                      <button onClick={() => removeTempMeal(idx)} className="text-red-400 hover:text-red-600">
                                          <X size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  {/* Add New Meal Input */}
                  <div className="flex flex-col gap-2">
                      <input 
                          type="text" 
                          list="meal-history-logday"
                          placeholder="Food Name (e.g. Chicken Rice)" 
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          value={newMealName}
                          onChange={handleMealNameChange}
                      />
                      <datalist id="meal-history-logday">
                          {Object.keys(state.foodHistory).map(f => <option key={f} value={f} />)}
                      </datalist>

                      <div className="flex gap-2">
                          <input 
                              type="number" 
                              placeholder="Calories" 
                              className="flex-1 min-w-0 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                              value={newMealCal}
                              onChange={(e) => setNewMealCal(e.target.value)}
                          />
                          <input 
                              type="number" 
                              placeholder="Protein" 
                              className="flex-1 min-w-0 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-gray-900 dark:focus:border-gray-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                              value={newMealPro}
                              onChange={(e) => setNewMealPro(e.target.value)}
                          />
                          <button 
                             onClick={handleAddTempMeal}
                             className="shrink-0 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-bold"
                          >
                             <Plus size={20} />
                          </button>
                      </div>
                  </div>
              </div>

              <button 
                 onClick={saveDayLog}
                 className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                  Save Entry
              </button>
          </div>
      </Modal>

      {/* --- PROTEIN GOAL MODAL --- */}
      <Modal isOpen={isProteinModalOpen} onClose={() => setIsProteinModalOpen(false)} title="Protein Goal">
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Daily Target (grams)</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white text-lg" 
                    placeholder="e.g. 150" 
                    value={tempProteinTarget} 
                    onChange={e => setTempProteinTarget(e.target.value)} 
                    autoFocus
                  />
              </div>
              <p className="text-xs text-gray-400">
                  Setting a high protein target helps in muscle recovery and satiety.
              </p>
              <button 
                  onClick={saveProteinTarget}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg mt-2"
              >
                  Set Target
              </button>
          </div>
      </Modal>
    </div>
  );
};
