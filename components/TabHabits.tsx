
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { calculateStreak, getTodayStr, getYesterdayStr } from '../utils';
import { Settings, Bell, Zap, Trash2, Edit2, Lock, Menu, GripVertical, Check, Plus, Minus, X } from 'lucide-react';
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
  
  // Quantity Input Modal State
  const [quantityModalData, setQuantityModalData] = useState<{
      isOpen: boolean;
      habitId: number | null;
      date: string;
      habitName: string;
      currentValue: number;
      target: number;
      unit: string;
  }>({ isOpen: false, habitId: null, date: "", habitName: "", currentValue: 0, target: 0, unit: "" });
  const [qtyInputValue, setQtyInputValue] = useState("");

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

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("blue");

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

  // Logic: Can only log for Today and Yesterday
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
        xpReward: parseInt(xpReward) || 10
    };

    if (editingId !== null) updateHabit(editingId, habitData);
    else addHabit(habitData.name, habitData.categoryId, habitData.type, habitData.target, habitData.unit, habitData.frequency, habitData.frequencyGoal, habitData.reminderTime, habitData.reminderInterval, habitData.xpReward);
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

      // If Numeric, Open Modal
      if (h.type === 'numeric') {
          const val = state.logs[date]?.[h.id];
          const current = typeof val === 'number' ? val : 0;
          
          setQuantityModalData({
              isOpen: true,
              habitId: h.id,
              date: date,
              habitName: h.name,
              currentValue: current,
              target: h.target || 1,
              unit: h.unit || 'units'
          });
          setQtyInputValue(current.toString());
      } else {
          // If Checkbox, Toggle
          toggleHabit(h.id, date);
      }
  };

  const saveQuantity = () => {
      if (quantityModalData.habitId) {
          const val = parseInt(qtyInputValue) || 0;
          setHabitValue(quantityModalData.habitId, quantityModalData.date, val);
          setQuantityModalData(prev => ({ ...prev, isOpen: false }));
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
        red: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        slate: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    };
    return map[color] || map['blue'];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative">
      {/* HEADER */}
      <div className="px-4 py-4 flex justify-between items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 z-20">
         <div className="flex items-center gap-3">
             <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                 <Menu size={24} />
             </button>
             <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Habits</h1>
             </div>
         </div>
         <button onClick={() => setIsManageCatsOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <Settings size={14} /> Cats
         </button>
      </div>

      {/* MATRIX HEADER (Sticky Dates) */}
      <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-2 shadow-sm">
          <div className="flex items-center">
              <div className="flex-1"></div> {/* Spacer for Name column on wider screens, or just hidden logic */}
              <div className="w-full grid grid-cols-7 gap-1">
                  {last7Days.map((date, i) => {
                      const active = isToday(date);
                      return (
                          <div key={date} className={`flex flex-col items-center justify-center p-1 rounded-lg ${active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-400 dark:text-gray-500'}`}>
                              <span className="text-[9px] font-bold uppercase">{getDayLetter(date)}</span>
                              <span className="text-[10px] font-bold">{getDayNumber(date)}</span>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* MAIN LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-28">
        {state.categories.map(cat => {
            const habits = state.habits.filter(h => h.categoryId === cat.id);
            if (habits.length === 0) return null;

            return (
                <div key={cat.id} className="space-y-2">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                         <span className={`w-2 h-2 rounded-full bg-${cat.color}-500`}></span>
                         {cat.name}
                     </h3>
                     
                     <div className="space-y-3">
                         {habits.map(h => {
                             const streak = calculateStreak(h.id, state);
                             const colorClass = getColorClasses(cat.color);
                             // Extract base color name for dynamic classes
                             const colorParts = colorClass.split(' ');
                             const baseTextClass = colorParts.find(c => c.startsWith('text-') && !c.includes(':')) || 'text-blue-500';
                             const baseColorName = baseTextClass.replace('text-', '').replace('-500', '');
                             const activeBgClass = `bg-${baseColorName}-500`;

                             return (
                                 <div 
                                    key={h.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, h.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, h)}
                                    className={`relative bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 transition-all ${draggedHabitId === h.id ? 'opacity-40 border-dashed border-2' : ''}`}
                                 >
                                     {/* COMPACT LUXE HEADER */}
                                     <div className="flex justify-between items-start mb-3">
                                         {/* Left: Name & Controls */}
                                         <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                                             <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-700 shrink-0">
                                                <GripVertical size={14} />
                                             </div>
                                             <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-none">
                                                 {h.name}
                                             </h3>
                                             <button onClick={() => handleOpenHabitModal(h)} className="text-gray-200 hover:text-gray-400 dark:text-gray-700 dark:hover:text-gray-500 shrink-0">
                                                 <Edit2 size={10} />
                                             </button>
                                         </div>

                                         {/* Right: Stats Stack */}
                                         <div className="flex flex-col items-end shrink-0">
                                             <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                 <Zap size={10} fill="currentColor" /> {streak} Streak
                                             </div>
                                             <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                                  {h.type === 'numeric' ? 
                                                    <span>Target: {h.target} {h.unit}</span> : 
                                                    <span>{h.frequency === 'daily' ? 'Daily' : `${h.frequencyGoal}x/${h.frequency.substr(0,1).toUpperCase()}`}</span>
                                                  }
                                                  {(h.reminderTime || h.reminderInterval) && <Bell size={8} className="text-blue-400 ml-1" fill="currentColor" />}
                                             </div>
                                         </div>
                                     </div>

                                     {/* Matrix Row (Dots) */}
                                     <div className="w-full grid grid-cols-7 gap-1">
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
                                                    className={`aspect-square rounded-lg flex items-center justify-center transition-all relative group ${
                                                        !canLog ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-90 hover:opacity-80'
                                                    } ${
                                                        isCompleted
                                                        ? `${activeBgClass} text-white shadow-sm scale-100`
                                                        : isPartial
                                                            ? 'bg-amber-400 text-white shadow-sm scale-95'
                                                            : 'bg-gray-100 dark:bg-gray-800 text-transparent scale-90'
                                                    }`}
                                                 >
                                                     {isCompleted && (
                                                         h.type === 'checkbox' 
                                                         ? <Check size={14} strokeWidth={4} /> 
                                                         : <span className="text-[10px] font-bold">{numVal > 99 ? '99+' : numVal}</span>
                                                     )}
                                                     
                                                     {isPartial && (
                                                         <span className="text-[10px] font-bold">{numVal}</span>
                                                     )}
                                                     
                                                     {/* Locked Indicator for old days if empty */}
                                                     {!canLog && !isCompleted && !isPartial && (
                                                         <Lock size={10} className="text-gray-300 dark:text-gray-700" />
                                                     )}

                                                     {/* Ghost Tick for Loggable days */}
                                                     {canLog && !isCompleted && !isPartial && (
                                                         <div className="opacity-0 group-hover:opacity-30 absolute inset-0 flex items-center justify-center text-gray-400">
                                                             <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                         </div>
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

        {state.habits.length === 0 && (
            <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-4">No habits defined yet.</p>
                <button onClick={() => handleOpenHabitModal()} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg">
                    Create First Habit
                </button>
            </div>
        )}
      </div>

      {/* --- QUANTITY INPUT MODAL --- */}
      <Modal isOpen={quantityModalData.isOpen} onClose={() => setQuantityModalData(prev => ({ ...prev, isOpen: false }))} title={`Log ${quantityModalData.habitName}`}>
          <div className="space-y-6 pt-2">
               <div className="flex flex-col items-center justify-center">
                   <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">{new Date(quantityModalData.date).toLocaleDateString()}</div>
                   <div className="text-6xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                       {qtyInputValue || '0'}
                   </div>
                   <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                       {quantityModalData.unit} 
                       <span className="text-gray-300 dark:text-gray-600 mx-2">/</span> 
                       Target: {quantityModalData.target}
                   </div>
               </div>

               {/* Quick Add Buttons */}
               <div className="flex justify-center gap-4">
                    <button onClick={() => setQtyInputValue(prev => Math.max(0, (parseInt(prev)||0) - 1).toString())} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Minus size={24} />
                    </button>
                    <button onClick={() => setQtyInputValue(prev => ((parseInt(prev)||0) + 1).toString())} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Plus size={24} />
                    </button>
               </div>
               
               {/* Shortcuts */}
               <div className="grid grid-cols-4 gap-2">
                   {[
                       Math.ceil(quantityModalData.target * 0.25), 
                       Math.ceil(quantityModalData.target * 0.5), 
                       quantityModalData.target,
                       quantityModalData.target + Math.ceil(quantityModalData.target * 0.5)
                    ].filter((v, i, a) => a.indexOf(v) === i && v > 0).map((num, i) => (
                       <button 
                         key={i} 
                         onClick={() => setQtyInputValue(num.toString())}
                         className="py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                       >
                           {num}
                       </button>
                   ))}
               </div>

               <div className="relative">
                   <input 
                     type="number" 
                     value={qtyInputValue}
                     onChange={(e) => setQtyInputValue(e.target.value)}
                     className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center font-bold text-lg outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white"
                     placeholder="Custom Amount"
                     autoFocus
                   />
               </div>

               <button 
                  onClick={saveQuantity}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                   <Check size={20} /> Save Entry
               </button>
          </div>
      </Modal>

      {/* CREATE/EDIT HABIT MODAL */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title={editingId ? "Edit Habit" : "New Habit"}>
         <div className="space-y-5">
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Name</label>
             <input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="e.g. Read Books" value={name} onChange={e => setName(e.target.value)} />
           </div>
           
           <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Category</label>
             <div className="flex flex-wrap gap-2">
               {state.categories.map(c => {
                 const isSelected = catId === c.id;
                 const activeClass = getColorClasses(c.color);

                 return (
                   <button 
                    key={c.id}
                    onClick={() => setCatId(c.id)}
                    className={`px-3 py-2 rounded-xl border font-bold text-xs uppercase transition-all flex items-center gap-2 ${
                      isSelected 
                        ? activeClass.replace('bg-', 'ring-2 ring-offset-2 ring-transparent bg-') // Adjust active class for selection
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
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
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Type</label>
               <select 
                 value={type} onChange={(e) => setType(e.target.value as HabitType)}
                 className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white appearance-none text-gray-900 dark:text-white"
               >
                 <option value="checkbox">Yes / No</option>
                 <option value="numeric">Counter</option>
               </select>
             </div>
             
             {type === 'numeric' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Unit</label>
                  <input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="e.g. pages" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
             )}
           </div>

           {type === 'numeric' && (
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Daily Target</label>
                  <input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" value={target} onChange={e => setTarget(e.target.value)} />
              </div>
           )}

           <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
               <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Frequency</h4>
               <div className="flex gap-4">
                   <div className="flex-1">
                      <select 
                         value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                         className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white"
                       >
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                       </select>
                   </div>
                   <div className="flex-1 flex items-center gap-2">
                      <input type="number" className="w-16 p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white text-center" value={frequencyGoal} onChange={e => setFrequencyGoal(e.target.value)} />
                      <span className="text-xs font-bold text-gray-400">times / period</span>
                   </div>
               </div>
           </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl space-y-3 border border-blue-100 dark:border-blue-800">
               <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-2">
                   <Bell size={12} /> Reminders
               </h4>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Daily Alarm</label>
                       <input 
                         type="time" 
                         className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" 
                         value={reminderTime} 
                         onChange={e => setReminderTime(e.target.value)} 
                        />
                   </div>
                   <div>
                       <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Interval (Mins)</label>
                       <input 
                         type="number" 
                         placeholder="e.g. 60"
                         className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" 
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
                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                   >
                       <Trash2 size={18} />
                   </button>
               )}
               <button onClick={handleSaveHabit} type="button" className="flex-[3] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
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
                      <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full bg-${c.color}-500`}></div>
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
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-400 font-bold hover:border-gray-900 dark:hover:border-white transition-all"
              >
                  + New Category
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingCatId ? "Edit Category" : "New Category"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Name</label>
                  <input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" value={catName} onChange={e => setCatName(e.target.value)} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Color</label>
                  <div className="flex flex-wrap gap-3">
                      {AVAILABLE_COLORS.map(color => (
                          <button key={color} onClick={() => setCatColor(color)} className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-transform ${catColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : ''}`}>
                            <div className={`w-full h-full rounded-full bg-${color}-500`}></div>
                          </button>
                      ))}
                  </div>
              </div>
              <button onClick={handleSaveCategory} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl mt-4">Save</button>
          </div>
      </Modal>
    </div>
  );
};
