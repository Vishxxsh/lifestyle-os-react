
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { calculateStreak, getTodayStr, getYesterdayStr, getThemeColors } from '../utils';
import { Settings, Bell, Zap, Trash2, Edit2, Lock, Menu, GripVertical, Check, Plus, Minus, X, Trophy, Flame } from 'lucide-react';
import { Modal } from './Modal';
import { HabitType, Habit, CategoryDef, FrequencyType } from '../types';

const AVAILABLE_COLORS = ['blue', 'red', 'emerald', 'purple', 'orange', 'slate'];

export const TabHabits: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addHabit, updateHabit, deleteHabit, moveHabit, toggleHabit, setHabitValue, setFabOnClick, addCategory, updateCategory, deleteCategory } = useApp();
  
  // --- STATE ---
  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  
  // Log Entry Modal
  const [logModalData, setLogModalData] = useState<{
      isOpen: boolean;
      habitId: number | null;
      date: string;
      habitName: string;
      currentValue: number;
      target: number;
      unit: string;
      type: HabitType;
      isCalorieBurner: boolean;
      currentCalories: number;
  }>({ 
      isOpen: false, habitId: null, date: "", habitName: "", currentValue: 0, target: 0, unit: "", 
      type: 'checkbox', isCalorieBurner: false, currentCalories: 0 
  });
  
  const [logInputValue, setLogInputValue] = useState("");
  const [logCaloriesValue, setLogCaloriesValue] = useState("");

  // DnD State
  const [draggedHabitId, setDraggedHabitId] = useState<number | null>(null);

  // Habit Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState<string>("");
  const [type, setType] = useState<HabitType>('checkbox');
  const [target, setTarget] = useState("10");
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [frequencyGoal, setFrequencyGoal] = useState("1");
  const [xpReward, setXpReward] = useState("10");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderInterval, setReminderInterval] = useState("");
  const [isCalorieBurner, setIsCalorieBurner] = useState(false);

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("blue");

  const theme = getThemeColors(state.user.accentColor);

  // --- HELPERS ---
  const requestPermission = () => {
    if ("Notification" in window) Notification.requestPermission();
  };

  const getLast7Days = () => {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
  };
  
  const last7Days = getLast7Days();

  const getDayLetter = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'narrow' });
  const getDayNumber = (dateStr: string) => new Date(dateStr).getDate();
  const isToday = (dateStr: string) => {
      return dateStr === getTodayStr();
  };

  const isLoggable = (dateStr: string) => {
      const today = getTodayStr();
      const yesterday = getYesterdayStr();
      return dateStr === today || dateStr === yesterday;
  };

  // --- HANDLERS ---
  const handleOpenHabitModal = useCallback((habit?: Habit) => {
    if (habit) {
      setEditingId(habit.id);
      setName(habit.name);
      setCatId(habit.categoryId);
      setType(habit.type);
      setTarget(habit.target?.toString() || "10");
      setUnit(habit.unit || "");
      setFrequency(habit.frequency || 'daily');
      setFrequencyGoal(habit.frequencyGoal?.toString() || "1");
      setXpReward(habit.xpReward?.toString() || "10");
      setReminderTime(habit.reminderTime || "");
      setReminderInterval(habit.reminderInterval?.toString() || "");
      setIsCalorieBurner(habit.isCalorieBurner || false);
    } else {
      setEditingId(null);
      setName("");
      setCatId(state.categories[0]?.id || "");
      setType('checkbox');
      setTarget("10");
      setUnit("");
      setFrequency('daily');
      setFrequencyGoal("1");
      setXpReward("10");
      setReminderTime("");
      setReminderInterval("");
      setIsCalorieBurner(false);
    }
    setIsHabitModalOpen(true);
  }, [state.categories]);

  const handleOpenCatModal = (cat?: CategoryDef) => {
      if (cat) {
          setEditingCatId(cat.id);
          setCatName(cat.name);
          setCatColor(cat.color);
      } else {
          setEditingCatId(null);
          setCatName("");
          setCatColor("blue");
      }
      setIsCatModalOpen(true);
  };

  const handleSaveHabit = () => {
    if (!name || !catId) return;
    if (reminderTime || reminderInterval) requestPermission();

    const habitData = {
        name, categoryId: catId, type,
        target: type === 'numeric' ? parseInt(target) : undefined,
        unit: type === 'numeric' ? unit : undefined,
        frequency, frequencyGoal: parseInt(frequencyGoal) || 1,
        reminderTime: reminderTime || undefined,
        reminderInterval: reminderInterval ? parseInt(reminderInterval) : undefined,
        xpReward: parseInt(xpReward) || 10,
        isCalorieBurner
    };

    if (editingId !== null) updateHabit(editingId, habitData);
    else addHabit(habitData.name, habitData.categoryId, habitData.type, habitData.target, habitData.unit, habitData.frequency, habitData.frequencyGoal, habitData.reminderTime, habitData.reminderInterval, habitData.xpReward, habitData.isCalorieBurner);
    setIsHabitModalOpen(false);
  };

  const handleSaveCategory = () => {
      if (!catName) return;
      if (editingCatId) updateCategory(editingCatId, catName, catColor);
      else addCategory(catName, catColor);
      setIsCatModalOpen(false);
  };

  // Interaction Handlers
  const handleDotClick = (h: Habit, date: string) => {
      if (!isLoggable(date)) return; // Locked

      const val = state.logs[date]?.[h.id];
      const isDone = h.type === 'checkbox' ? !!val : (val as number) > 0;

      if (h.type === 'numeric' || h.isCalorieBurner) {
          const current = typeof val === 'number' ? val : (val ? 1 : 0);
          
          const workout = state.workouts[date]?.find(w => w.linkedHabitId === h.id);
          const cals = workout ? workout.calories : 0;

          setLogModalData({
              isOpen: true,
              habitId: h.id,
              date: date,
              habitName: h.name,
              currentValue: current,
              target: h.target || 1,
              unit: h.unit || 'units',
              type: h.type,
              isCalorieBurner: h.isCalorieBurner || false,
              currentCalories: cals
          });
          setLogInputValue(current.toString());
          setLogCaloriesValue(cals > 0 ? cals.toString() : "");
      } else {
          toggleHabit(h.id, date);
      }
  };

  const saveLogEntry = () => {
      if (logModalData.habitId) {
          let val: number | boolean = 0;
          
          if (logModalData.type === 'numeric') {
              val = parseInt(logInputValue) || 0;
          } else {
              val = true; 
          }

          const cals = parseInt(logCaloriesValue) || 0;
          
          setHabitValue(logModalData.habitId, logModalData.date, val, cals);
          setLogModalData(prev => ({ ...prev, isOpen: false }));
      }
  };

  const toggleOffFromModal = () => {
      if (logModalData.habitId) {
          setHabitValue(logModalData.habitId, logModalData.date, false, 0); 
          setLogModalData(prev => ({ ...prev, isOpen: false }));
      }
  };

  // FAB Binding
  useEffect(() => {
    setFabOnClick(() => handleOpenHabitModal());
    return () => setFabOnClick(null);
  }, [setFabOnClick, handleOpenHabitModal]);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedHabitId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: React.DragEvent, targetHabit: Habit) => {
    e.preventDefault();
    if (draggedHabitId !== null && draggedHabitId !== targetHabit.id) {
        moveHabit(draggedHabitId, targetHabit.id);
    }
    setDraggedHabitId(null);
  };

  // Helper for colors
  const getColorClasses = (color: string) => {
     const map: Record<string, string> = {
        red: 'text-red-500 bg-red-50 dark:bg-red-900/20',
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
        orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        slate: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
    };
    return map[color] || map['blue'];
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black relative -mx-4 sm:-mx-6 -mt-6">
      {/* HEADER */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-center bg-[#F2F2F7] dark:bg-black shrink-0 z-20">
         <div className="flex items-center gap-3">
             <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                 <Menu size={24} />
             </button>
             <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Habits</h1>
             </div>
         </div>
         <button onClick={() => setIsManageCatsOpen(true)} className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1 hover:scale-105 transition-transform">
            <Settings size={16} />
         </button>
      </div>

      {/* MATRIX HEADER (Sticky Dates Glass) */}
      <div className="sticky top-0 z-10 bg-[#F2F2F7]/85 dark:bg-black/85 backdrop-blur-xl border-b border-black/5 dark:border-white/5 px-6 py-4 shadow-sm">
          <div className="flex items-center">
              <div className="flex-1"></div>
              <div className="w-full grid grid-cols-7 gap-1.5">
                  {last7Days.map((date, i) => {
                      const active = isToday(date);
                      return (
                          <div key={date} className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${active ? `${theme.bg} ${theme.buttonText} shadow-lg scale-105` : 'text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{getDayLetter(date)}</span>
                              <span className="text-sm font-black">{getDayNumber(date)}</span>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* MAIN LIST */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-32 no-scrollbar">
        {state.categories.map(cat => {
            const habits = state.habits.filter(h => h.categoryId === cat.id);
            if (habits.length === 0) return null;

            return (
                <div key={cat.id} className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
                         <span className={`w-2 h-2 rounded-full bg-${cat.color}-500 shadow-[0_0_10px_currentColor]`}></span>
                         {cat.name}
                     </h3>
                     
                     <div className="space-y-3">
                         {habits.map(h => {
                             const streak = calculateStreak(h.id, state);
                             const colorClass = getColorClasses(cat.color);
                             const baseColorName = cat.color;
                             const activeBgClass = `bg-${baseColorName}-500`;

                             return (
                                 <div 
                                    key={h.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, h.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, h)}
                                    className={`relative bg-white dark:bg-gray-900 rounded-[1.5rem] p-4 shadow-ios dark:shadow-none dark:border dark:border-gray-800 transition-all active:scale-[0.99] ${draggedHabitId === h.id ? 'opacity-40 border-dashed border-2' : ''}`}
                                 >
                                     <div className="flex justify-between items-start mb-4">
                                         <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                                             <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-700 shrink-0">
                                                <GripVertical size={16} />
                                             </div>
                                             <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">
                                                    {h.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${colorClass}`}>
                                                        {h.frequency}
                                                    </span>
                                                    {(h.reminderTime || h.reminderInterval) && <Bell size={10} className="text-blue-400" fill="currentColor" />}
                                                    {h.isCalorieBurner && <Flame size={10} className="text-orange-500" fill="currentColor" />}
                                                </div>
                                             </div>
                                         </div>

                                         <div className="flex flex-col items-end shrink-0">
                                             <div className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 px-2 py-1 rounded-full">
                                                 <Zap size={12} fill="currentColor" /> {streak}
                                             </div>
                                             <button onClick={() => handleOpenHabitModal(h)} className="mt-2 text-gray-200 hover:text-gray-400 dark:text-gray-700 dark:hover:text-gray-500">
                                                 <Edit2 size={12} />
                                             </button>
                                         </div>
                                     </div>

                                     <div className="w-full grid grid-cols-7 gap-1.5">
                                         {last7Days.map((date) => {
                                             const val = state.logs[date]?.[h.id];
                                             const numVal = typeof val === 'number' ? val : (val ? 1 : 0);
                                             const targetVal = h.target || 1;
                                             
                                             const isCompleted = h.type === 'checkbox' ? !!val : numVal >= targetVal;
                                             const isPartial = h.type === 'numeric' && numVal > 0 && numVal < targetVal;
                                             const canLog = isLoggable(date);
                                             
                                             return (
                                                 <button
                                                    key={date}
                                                    onClick={() => handleDotClick(h, date)}
                                                    disabled={!canLog}
                                                    className={`aspect-square rounded-full flex items-center justify-center transition-all relative group ${
                                                        !canLog ? 'cursor-default opacity-50' : 'cursor-pointer active:scale-90 hover:opacity-80'
                                                    } ${
                                                        isCompleted
                                                        ? `${activeBgClass} text-white shadow-lg shadow-${baseColorName}-500/30 scale-100`
                                                        : isPartial
                                                            ? 'bg-amber-400 text-white shadow-md scale-90'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-transparent scale-75 hover:scale-90'
                                                    }`}
                                                 >
                                                     {isCompleted && (
                                                         h.type === 'checkbox' 
                                                         ? <Check size={14} strokeWidth={4} /> 
                                                         : <span className="text-[9px] font-bold">{numVal > 99 ? '99+' : numVal}</span>
                                                     )}
                                                     
                                                     {isPartial && (
                                                         <span className="text-[9px] font-bold">{numVal}</span>
                                                     )}
                                                     
                                                     {!canLog && !isCompleted && !isPartial && (
                                                         <Lock size={10} className="text-gray-300 dark:text-gray-600" />
                                                     )}
                                                 </button>
                                             );
                                         })}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                </div>
            );
        })}
      </div>

      {/* --- LOG ENTRY MODAL --- */}
      <Modal isOpen={logModalData.isOpen} onClose={() => setLogModalData(prev => ({ ...prev, isOpen: false }))} title={`Log ${logModalData.habitName}`}>
          <div className="space-y-8 pt-4">
               {/* Display for Date */}
               <div className="flex flex-col items-center justify-center">
                   
                   {/* If Numeric, show counter. If Checkbox, show status */}
                   {logModalData.type === 'numeric' ? (
                       <>
                           <div className="text-8xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                               {logInputValue || '0'}
                           </div>
                           <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                               {logModalData.unit} 
                               <span className="text-gray-300 dark:text-gray-600 mx-2">/</span> 
                               Target: {logModalData.target}
                           </div>
                       </>
                   ) : (
                       <div className="text-xl font-bold text-emerald-500 uppercase tracking-widest mb-4">
                           {logModalData.isCalorieBurner ? 'Activity Check' : 'Complete'}
                       </div>
                   )}
               </div>

               {/* Numeric Helpers */}
               {logModalData.type === 'numeric' && (
                   <>
                       <div className="flex justify-center gap-6">
                            <button onClick={() => setLogInputValue(prev => Math.max(0, (parseInt(prev)||0) - 1).toString())} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm active:scale-95">
                                <Minus size={24} strokeWidth={3} />
                            </button>
                            <button onClick={() => setLogInputValue(prev => ((parseInt(prev)||0) + 1).toString())} className={`w-16 h-16 rounded-full ${theme.bg} ${theme.buttonText} flex items-center justify-center hover:opacity-90 transition-colors shadow-lg active:scale-95`}>
                                <Plus size={24} strokeWidth={3} />
                            </button>
                       </div>
                       
                       <div className="grid grid-cols-4 gap-2">
                           {[
                               Math.ceil(logModalData.target * 0.25), 
                               Math.ceil(logModalData.target * 0.5), 
                               logModalData.target,
                               logModalData.target + Math.ceil(logModalData.target * 0.5)
                            ].filter((v, i, a) => a.indexOf(v) === i && v > 0).map((num, i) => (
                               <button 
                                 key={i} 
                                 onClick={() => setLogInputValue(num.toString())}
                                 className="py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                               >
                                   {num}
                               </button>
                           ))}
                       </div>
                   </>
               )}

               {/* Calorie Burner Input */}
               {logModalData.isCalorieBurner && (
                   <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 space-y-2">
                       <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1">
                           <Flame size={12} fill="currentColor" /> Calories Burnt
                       </label>
                       <input 
                           type="number" 
                           value={logCaloriesValue}
                           onChange={(e) => setLogCaloriesValue(e.target.value)}
                           className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-center text-2xl font-black text-orange-900 dark:text-orange-200 outline-none focus:ring-2 focus:ring-orange-500"
                           placeholder="0"
                       />
                   </div>
               )}

               <div className="flex gap-3 pt-4">
                   {/* Only show "Clear/Uncheck" if it has value */}
                   {(logModalData.currentValue > 0 || (logModalData.type === 'checkbox' && !!state.logs[logModalData.date]?.[logModalData.habitId!])) && (
                        <button 
                            onClick={toggleOffFromModal}
                            className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-3xl active:scale-95 transition-transform"
                        >
                            Reset
                        </button>
                   )}
                   <button 
                      onClick={saveLogEntry}
                      className={`flex-[2] py-5 ${theme.bg} ${theme.buttonText} font-bold text-lg rounded-3xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2`}
                   >
                       Save Entry
                   </button>
               </div>
          </div>
      </Modal>

      {/* CREATE/EDIT HABIT MODAL */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title={editingId ? "Edit Habit" : "New Habit"}>
         <div className="space-y-6">
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Name</label>
             <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white font-bold" placeholder="e.g. Read Books" value={name} onChange={e => setName(e.target.value)} />
           </div>
           
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Category</label>
             <div className="flex flex-wrap gap-2">
               {state.categories.map(c => {
                 const isSelected = catId === c.id;
                 const activeClass = getColorClasses(c.color);

                 return (
                   <button 
                    key={c.id}
                    onClick={() => setCatId(c.id)}
                    className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2 ${
                      isSelected 
                        ? `${activeClass.split(' ')[1]} ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700` // Use bg color
                        : 'border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800'
                    }`}
                   >
                     <div className={`w-2 h-2 rounded-full bg-${c.color}-500`}></div>
                     {c.name}
                   </button>
                 );
               })}
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Type</label>
               <select 
                 value={type} onChange={(e) => setType(e.target.value as HabitType)}
                 className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white appearance-none text-gray-900 dark:text-white font-bold"
               >
                 <option value="checkbox">Yes / No</option>
                 <option value="numeric">Counter</option>
               </select>
             </div>
             
             {type === 'numeric' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Unit</label>
                  <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white font-bold" placeholder="e.g. pages" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
             )}
           </div>

           {type === 'numeric' && (
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Daily Target</label>
                  <input type="number" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white font-bold" value={target} onChange={e => setTarget(e.target.value)} />
              </div>
           )}

           <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-3xl space-y-3">
               <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Frequency</h4>
               <div className="flex gap-4">
                   <div className="flex-1">
                      <select 
                         value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                         className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white font-bold"
                       >
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                       </select>
                   </div>
                   <div className="flex-1 flex items-center gap-2">
                      <input type="number" className="w-20 p-3 bg-white dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white text-center font-bold" value={frequencyGoal} onChange={e => setFrequencyGoal(e.target.value)} />
                      <span className="text-xs font-bold text-gray-400">times / period</span>
                   </div>
               </div>
           </div>

           {/* Calorie Burner Toggle */}
           <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-3xl flex items-center justify-between border border-orange-100 dark:border-orange-900/30">
               <div>
                   <h4 className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase flex items-center gap-2">
                       <Flame size={12} fill="currentColor" /> Calorie Burner
                   </h4>
                   <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-1">
                       Enable to manually log calories when completed.
                   </p>
               </div>
               <button 
                    type="button"
                    onClick={() => setIsCalorieBurner(!isCalorieBurner)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${isCalorieBurner ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
               >
                   <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isCalorieBurner ? 'translate-x-5' : ''}`}></div>
               </button>
           </div>

           {/* XP Reward Config */}
           <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                 <Trophy size={12} className="text-amber-500" /> XP Reward
              </label>
              <div className="flex items-center gap-3">
                 <input 
                    type="number" 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 text-gray-900 dark:text-white font-bold" 
                    value={xpReward} 
                    onChange={e => setXpReward(e.target.value)} 
                    placeholder="e.g. 10"
                 />
                 <span className="text-xs text-gray-400 font-medium">XP points</span>
              </div>
           </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl space-y-4 border border-blue-100 dark:border-blue-800">
               <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-2">
                   <Bell size={12} /> Reminders
               </h4>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Daily Alarm</label>
                       <input 
                         type="time" 
                         className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white font-bold" 
                         value={reminderTime} 
                         onChange={e => setReminderTime(e.target.value)} 
                        />
                   </div>
                   <div>
                       <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Interval (Mins)</label>
                       <input 
                         type="number" 
                         placeholder="e.g. 60"
                         className="w-full p-3 bg-white dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white font-bold" 
                         value={reminderInterval} 
                         onChange={e => setReminderInterval(e.target.value)} 
                        />
                   </div>
               </div>
           </div>

           <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               {editingId !== null && (
                   <button 
                    onClick={() => { if(confirm("Delete habit?")) { deleteHabit(editingId); setIsHabitModalOpen(false); }}} 
                    type="button" 
                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                   >
                       <Trash2 size={18} />
                   </button>
               )}
               <button onClick={handleSaveHabit} type="button" className={`flex-[3] py-4 ${theme.bg} ${theme.buttonText} font-bold rounded-2xl shadow-lg active:scale-95 transition-transform`}>
                    {editingId !== null ? "Update" : "Create"}
               </button>
           </div>
        </div>
      </Modal>

      {/* CATEGORY MODALS */}
       <Modal isOpen={isManageCatsOpen} onClose={() => setIsManageCatsOpen(false)} title="Categories">
          <div className="space-y-4">
              <div className="space-y-2">
                  {state.categories.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                          <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full bg-${c.color}-500 shadow-sm`}></div>
                              <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => { setIsManageCatsOpen(false); handleOpenCatModal(c); }} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                  <Edit2 size={16} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
              <button 
                  onClick={() => { setIsManageCatsOpen(false); handleOpenCatModal(); }}
                  className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-400 font-bold hover:border-gray-900 dark:hover:border-white transition-all"
              >
                  + New Category
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingCatId ? "Edit Category" : "New Category"}>
          <div className="space-y-6">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Name</label>
                  <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white font-bold" value={catName} onChange={e => setCatName(e.target.value)} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Color</label>
                  <div className="flex flex-wrap gap-3">
                      {AVAILABLE_COLORS.map(color => (
                          <button key={color} onClick={() => setCatColor(color)} className={`w-12 h-12 rounded-full flex items-center justify-center relative transition-transform ${catColor === color ? 'scale-110 ring-4 ring-gray-100 dark:ring-gray-800' : ''}`}>
                            <div className={`w-full h-full rounded-full bg-${color}-500 shadow-md`}></div>
                          </button>
                      ))}
                  </div>
              </div>
              <button onClick={handleSaveCategory} className={`w-full py-5 ${theme.bg} ${theme.buttonText} font-bold rounded-2xl mt-4 shadow-lg active:scale-95 transition-transform`}>Save Category</button>
          </div>
      </Modal>
    </div>
  );
};
