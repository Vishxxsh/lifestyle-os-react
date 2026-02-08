
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, calculateStreak } from '../utils';
import { Settings, Bell, Zap, Trash2, Edit2, Lock, Menu, GripVertical, Check } from 'lucide-react';
import { Modal } from './Modal';
import { HabitType, Habit, CategoryDef, FrequencyType } from '../types';

const AVAILABLE_COLORS = ['blue', 'red', 'emerald', 'purple', 'orange', 'slate'];

export const TabHabits: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addHabit, updateHabit, deleteHabit, moveHabit, toggleHabit, incrementHabit, setFabOnClick, addCategory, updateCategory, deleteCategory } = useApp();
  
  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);

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

  // Notification Permission
  const requestPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

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

  useEffect(() => {
    setFabOnClick(() => handleOpenHabitModal());
    return () => setFabOnClick(null);
  }, [setFabOnClick, handleOpenHabitModal]);

  const handleSaveHabit = () => {
    if (!name || !catId) return;
    
    if (reminderTime || reminderInterval) requestPermission();

    const rTime = reminderTime || undefined;
    const rInt = reminderInterval ? parseInt(reminderInterval) : undefined;
    const xp = parseInt(xpReward) || 10;
    const freqG = parseInt(frequencyGoal) || 1;

    // Strict null check here ensures ID 0 is treated as an update
    if (editingId !== null) {
      updateHabit(editingId, {
        name,
        categoryId: catId,
        type,
        target: type === 'numeric' ? parseInt(target) : undefined,
        unit: type === 'numeric' ? unit : undefined,
        frequency,
        frequencyGoal: freqG,
        reminderTime: rTime,
        reminderInterval: rInt,
        xpReward: xp
      });
    } else {
      addHabit(name, catId, type, type === 'numeric' ? parseInt(target) : undefined, type === 'numeric' ? unit : undefined, frequency, freqG, rTime, rInt, xp);
    }
    setIsHabitModalOpen(false);
  };

  const handleSaveCategory = () => {
      if (!catName) return;
      if (editingCatId) {
          updateCategory(editingCatId, catName, catColor);
      } else {
          addCategory(catName, catColor);
      }
      setIsCatModalOpen(false);
  };

  // --- Drag and Drop Handlers ---
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
    if (draggedHabitId === null) return;
    
    const draggedHabit = state.habits.find(h => h.id === draggedHabitId);
    
    // Only allow move
    if (draggedHabit && draggedHabit.id !== targetHabit.id) {
        moveHabit(draggedHabitId, targetHabit.id);
    }
    
    setDraggedHabitId(null);
  };

  const handleDragEnd = () => {
    setDraggedHabitId(null);
  };

  // Helpers
  const getColorClasses = (color: string) => {
    // Light mode uses standard colors, Dark mode uses darker backgrounds with opacity and adjusted text
    const map: Record<string, string> = {
        red: 'text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900/30',
        blue: 'text-blue-500 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-900/30',
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900/30',
        purple: 'text-purple-500 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-900/30',
        orange: 'text-orange-500 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-900/30',
        slate: 'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700',
    };
    return map[color] || map['blue'];
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

  const getDayLetter = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W
  };

  const getDayNumber = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getDate();
  };

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
            <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                 <Menu size={24} />
             </button>
            <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h1>
               <p className="text-xs text-gray-400 font-medium">Consistency is key</p>
            </div>
        </div>
        <button onClick={() => setIsManageCatsOpen(true)} className="text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
            <Settings size={14} /> Categories
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-8">
        {state.categories.map(cat => {
          // Filter out archived habits
          const habits = state.habits.filter(h => h.categoryId === cat.id);
          if (habits.length === 0) return null;

          return (
            <div key={cat.id}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-${cat.color}-500 inline-block`}></span>
                  {cat.name}
              </h3>
              <div className="space-y-3">
                {habits.map((h, idx) => {
                  const streak = calculateStreak(h.id, state);
                  const colorClass = getColorClasses(cat.color);
                  const colorParts = colorClass.split(' ');
                  const baseTextClass = colorParts.find(c => c.startsWith('text-') && !c.includes(':')) || 'text-blue-500';
                  const baseColorName = baseTextClass.replace('text-', '').replace('-500', ''); 
                  const dotActiveClass = `bg-${baseColorName}-500`;

                  return (
                    <div 
                      key={h.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, h.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, h)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4 group transition-opacity ${draggedHabitId === h.id ? 'opacity-40 border-dashed border-2' : ''}`}
                    >
                      {/* Row Top: Info & Controls */}
                      <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {/* Grip Icon for Dragging */}
                            <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 -ml-1">
                                <GripVertical size={16} />
                            </div>

                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${colorClass}`}>
                               <div className={`w-3 h-3 rounded-full ${dotActiveClass}`}></div>
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {h.name}
                                    <button onClick={() => handleOpenHabitModal(h)} className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400">
                                        <Settings size={12} />
                                    </button>
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2">
                                    <span className="uppercase tracking-wide">{h.frequencyGoal}x {h.frequency}</span>
                                    {h.type === 'numeric' && <span>• Target: {h.target} {h.unit}</span>}
                                    <span className="text-amber-500 flex items-center gap-0.5"><Zap size={8} fill="currentColor" /> {streak} streak</span>
                                    {(h.reminderTime || h.reminderInterval) && (
                                        <span className="text-blue-400 flex items-center gap-0.5"><Bell size={8} fill="currentColor" /></span>
                                    )}
                                </div>
                            </div>
                          </div>
                      </div>

                      {/* Row Bottom: Loop Style History Dots */}
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                          {last7Days.map((date, i) => {
                              const val = state.logs[date]?.[h.id];
                              const numericVal = typeof val === 'number' ? val : (val ? 1 : 0);
                              const targetVal = h.target || 1;
                              const isCompleted = h.type === 'checkbox' ? !!val : numericVal >= targetVal;
                              const isPartial = h.type === 'numeric' && numericVal > 0 && numericVal < targetVal;
                              const isEditable = i >= 5; 
                              const isToday = i === 6;
                              
                              return (
                                  <div key={date} className="flex flex-col items-center gap-1 flex-1">
                                      <div className="flex flex-col items-center leading-none">
                                        <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                            {getDayLetter(date)}
                                        </span>
                                        <span className={`text-[8px] font-medium ${isToday ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                            {getDayNumber(date)}
                                        </span>
                                      </div>
                                      
                                      <button 
                                        disabled={!isEditable}
                                        onClick={() => {
                                            if (h.type === 'checkbox') {
                                                toggleHabit(h.id, date);
                                            } else {
                                                if (isCompleted) {
                                                    incrementHabit(h.id, date, -numericVal);
                                                } else {
                                                    incrementHabit(h.id, date, targetVal - numericVal);
                                                }
                                            }
                                        }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative ${
                                            isCompleted 
                                                ? `${dotActiveClass} text-white shadow-sm scale-100` 
                                                : isPartial 
                                                    ? `bg-amber-400 text-white shadow-sm scale-95` 
                                                    : `bg-gray-100 dark:bg-gray-700 text-transparent hover:bg-gray-200 dark:hover:bg-gray-600 scale-90`
                                        } ${!isEditable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                      >
                                          {isCompleted && (
                                              h.type === 'checkbox' 
                                                ? <span className="text-xs font-bold">✓</span> 
                                                : <span className="text-[9px] font-bold">{numericVal}</span>
                                          )}
                                          
                                          {isPartial && (
                                              <span className="text-[9px] font-bold">{numericVal}</span>
                                          )}

                                          {!isEditable && !isCompleted && !isPartial && <Lock size={8} className="text-gray-300 dark:text-gray-500 absolute" />}
                                      </button>
                                  </div>
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

      {/* --- HABIT MODAL --- */}
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
                        ? activeClass
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                   >
                     <div className={`w-2 h-2 rounded-full bg-${c.color}-500 ${isSelected ? 'ring-2 ring-white dark:ring-gray-900' : ''}`}></div>
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
                 <option value="numeric">Counter (1, 2, 3...)</option>
               </select>
             </div>
             
             {type === 'numeric' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Unit</label>
                  <input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="e.g. pages" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
             )}
           </div>

           <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
               <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Frequency Schedule</h4>
               <div className="flex gap-4">
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Repeats</label>
                      <select 
                         value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                         className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white"
                       >
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                       </select>
                   </div>
                   <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Times per period</label>
                      <input type="number" className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white" value={frequencyGoal} onChange={e => setFrequencyGoal(e.target.value)} />
                   </div>
                   {type === 'numeric' && (
                       <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target / Day</label>
                          <input type="number" className="w-full p-2 bg-white dark:bg-gray-700 rounded-lg border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm text-gray-900 dark:text-white" value={target} onChange={e => setTarget(e.target.value)} />
                       </div>
                   )}
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
               <p className="text-[10px] text-blue-400 leading-tight">
                   "Daily Alarm" rings at a specific time. "Interval" notifies you periodically (e.g. every 30 mins) if you haven't completed the habit.
               </p>
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                 <Zap size={12} fill="currentColor" /> XP Reward
              </label>
              <input 
                type="number" 
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
                value={xpReward} 
                onChange={e => setXpReward(e.target.value)}
              />
           </div>

           <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               {editingId !== null && (
                   <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Delay execution slightly to ensure UI is ready/unblocked for confirm
                        setTimeout(() => {
                             if (editingId !== null && window.confirm("Are you sure you want to delete this habit? This cannot be undone.")) {
                                deleteHabit(editingId);
                                setIsHabitModalOpen(false);
                            }
                        }, 10);
                    }} 
                    type="button" 
                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors relative z-10 cursor-pointer"
                   >
                       <Trash2 size={18} /> Delete
                   </button>
               )}
               <button onClick={handleSaveHabit} type="button" className="flex-[3] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
                    {editingId !== null ? "Update Habit" : "Create Habit"}
               </button>
           </div>
        </div>
      </Modal>

      {/* Categories Modals */}
       <Modal isOpen={isManageCatsOpen} onClose={() => setIsManageCatsOpen(false)} title="Categories">
          <div className="space-y-4">
              <div className="space-y-2">
                  {state.categories.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full bg-${c.color}-500`}></div>
                              <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => { setIsManageCatsOpen(false); handleOpenCatModal(c); }} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                  <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => { if(confirm("Delete category?")) deleteCategory(c.id); }} 
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
              <button 
                  onClick={() => { setIsManageCatsOpen(false); handleOpenCatModal(); }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-400 font-bold hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition-all"
              >
                  + New Category
              </button>
          </div>
      </Modal>

      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingCatId ? "Edit Category" : "New Category"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Name</label>
                  <input className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="e.g. Hygiene" value={catName} onChange={e => setCatName(e.target.value)} />
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Color Code</label>
                  <div className="flex flex-wrap gap-3">
                      {AVAILABLE_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setCatColor(color)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center relative transition-transform ${
                                catColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-900' : 'hover:scale-105'
                            }`}
                          >
                            <div className={`w-full h-full rounded-full bg-${color}-500 border border-black/5`}></div>
                            {catColor === color && <Check size={16} className="text-white absolute" strokeWidth={3} />}
                          </button>
                      ))}
                  </div>
              </div>

              <button onClick={handleSaveCategory} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl mt-4">
                  Save Category
              </button>
          </div>
      </Modal>
    </div>
  );
};
