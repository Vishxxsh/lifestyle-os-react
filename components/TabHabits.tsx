import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, getYesterdayStr, calculateStreak } from '../utils';
import { Plus, Flame, Check, Settings, Bell, ChevronUp, ChevronDown, Zap, Trash2, Edit2 } from 'lucide-react';
import { Modal } from './Modal';
import { HabitType, Habit, CategoryDef } from '../types';

export const TabHabits: React.FC = () => {
  const { state, addHabit, updateHabit, deleteHabit, reorderHabit, toggleHabit, incrementHabit, setFabOnClick, addCategory, updateCategory, deleteCategory } = useApp();
  const [viewDate, setViewDate] = useState<'today' | 'yesterday'>('today');
  
  // Modals
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);

  // Habit Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState<string>("");
  const [type, setType] = useState<HabitType>('checkbox');
  const [target, setTarget] = useState("10");
  const [xpReward, setXpReward] = useState("10");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderInterval, setReminderInterval] = useState("");

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("blue");

  // Input state for quantitative habits
  const [quantInputs, setQuantInputs] = useState<Record<number, string>>({});

  const dateStr = viewDate === 'today' ? getTodayStr() : getYesterdayStr();
  const logs = state.logs[dateStr] || {};

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
      setXpReward(habit.xpReward?.toString() || "10");
      setReminderTime(habit.reminderTime || "");
      setReminderInterval(habit.reminderInterval?.toString() || "");
    } else {
      setEditingId(null);
      setName("");
      // Default to first category
      setCatId(state.categories[0]?.id || "");
      setType('checkbox');
      setTarget("10");
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

  // Register FAB action
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

    if (editingId) {
      updateHabit(editingId, {
        name,
        categoryId: catId,
        type,
        target: type === 'numeric' ? parseInt(target) : undefined,
        reminderTime: rTime,
        reminderInterval: rInt,
        xpReward: xp
      });
    } else {
      addHabit(name, catId, type, type === 'numeric' ? parseInt(target) : undefined, rTime, rInt, xp);
    }
    setIsHabitModalOpen(false);
  };

  const handleDeleteHabit = () => {
    if (editingId && confirm("Are you sure you want to delete this habit? History will be preserved but hidden.")) {
      deleteHabit(editingId);
      setIsHabitModalOpen(false);
    }
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

  // Helpers
  // We use inline styles or specific maps because Tailwind needs complete class names
  const getColorClasses = (color: string) => {
    const map: Record<string, string> = {
        red: 'text-red-500 bg-red-50 border-red-200',
        orange: 'text-orange-500 bg-orange-50 border-orange-200',
        amber: 'text-amber-500 bg-amber-50 border-amber-200',
        green: 'text-green-500 bg-green-50 border-green-200',
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        teal: 'text-teal-500 bg-teal-50 border-teal-200',
        cyan: 'text-cyan-500 bg-cyan-50 border-cyan-200',
        sky: 'text-sky-500 bg-sky-50 border-sky-200',
        blue: 'text-blue-500 bg-blue-50 border-blue-200',
        indigo: 'text-indigo-500 bg-indigo-50 border-indigo-200',
        violet: 'text-violet-500 bg-violet-50 border-violet-200',
        purple: 'text-purple-500 bg-purple-50 border-purple-200',
        fuchsia: 'text-fuchsia-500 bg-fuchsia-50 border-fuchsia-200',
        pink: 'text-pink-500 bg-pink-50 border-pink-200',
        rose: 'text-rose-500 bg-rose-50 border-rose-200',
        slate: 'text-slate-500 bg-slate-50 border-slate-200',
    };
    return map[color] || map['blue'];
  };

  const availableColors = [
      'red', 'orange', 'amber', 'green', 'emerald', 'teal', 'cyan', 'sky', 
      'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate'
  ];

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Header & Toggle */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Daily Grind</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewDate('yesterday')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewDate === 'yesterday' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Yesterday
          </button>
          <button 
            onClick={() => setViewDate('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewDate === 'today' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex justify-end">
          <button onClick={() => setIsManageCatsOpen(true)} className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1">
              <Settings size={12} /> Manage Categories
          </button>
      </div>

      {/* Habits List */}
      <div className="space-y-6">
        {state.categories.map(cat => {
          const habits = state.habits.filter(h => h.categoryId === cat.id);
          // If no habits, still show category if user created it, unless we want to hide empty ones?
          // Let's hide if empty for cleanliness, OR show placeholder
          if (habits.length === 0) return null;

          return (
            <div key={cat.id}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-${cat.color}-500 inline-block`}></span>
                  {cat.name}
              </h3>
              <div className="space-y-3">
                {habits.map((h, idx) => {
                  const val = logs[h.id];
                  const streak = calculateStreak(h.id, state);
                  const isDone = h.type === 'checkbox' ? !!val : (val as number || 0) >= (h.target || 1);
                  const colorClass = getColorClasses(cat.color);

                  return (
                    <div key={h.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${colorClass.split(' ')[1]}`}>
                           {/* Simple circle icon based on color */}
                           <div className={`w-3 h-3 rounded-full ${colorClass.split(' ')[0].replace('text', 'bg')}`}></div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate pr-2 flex items-center gap-2">
                            {h.name}
                            <button onClick={() => handleOpenHabitModal(h)} className="text-gray-300 hover:text-gray-500">
                               <Settings size={14} />
                            </button>
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => reorderHabit(h.id, 'up')}
                                disabled={idx === 0}
                                className="text-gray-300 hover:text-gray-900 disabled:opacity-0"
                              >
                                <ChevronUp size={10} />
                              </button>
                              <button 
                                onClick={() => reorderHabit(h.id, 'down')}
                                disabled={idx === habits.length - 1}
                                className="text-gray-300 hover:text-gray-900 disabled:opacity-0"
                              >
                                <ChevronDown size={10} />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-amber-500 font-bold flex items-center gap-3">
                            <span className="flex items-center gap-1"><Flame size={12} fill="currentColor" /> {streak}</span>
                            <span className="text-gray-400 flex items-center gap-0.5">
                                <Zap size={10} fill="currentColor" /> {h.xpReward || 1} XP
                            </span>
                            {(h.reminderTime || h.reminderInterval) && (
                                <span className="text-gray-400 flex items-center gap-0.5"><Bell size={10} /> On</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {h.type === 'checkbox' ? (
                        <button 
                          onClick={() => toggleHabit(h.id, dateStr)}
                          className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 shrink-0 ${
                            isDone 
                              ? `${colorClass.split(' ')[0]} border-current` 
                              : 'border-gray-200 text-transparent hover:border-gray-300'
                          }`}
                        >
                           <Check size={24} strokeWidth={4} />
                        </button>
                      ) : (
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 shrink-0">
                           <span className="px-2 text-sm font-mono font-bold text-gray-600 whitespace-nowrap">
                             {val || 0}/{h.target}
                           </span>
                           <input 
                             type="number" 
                             className="w-10 h-8 text-center text-xs border border-gray-200 rounded mx-1 focus:ring-1 focus:ring-gray-900 outline-none"
                             placeholder="1"
                             value={quantInputs[h.id] || ""}
                             onChange={(e) => setQuantInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                           />
                           <button 
                             onClick={() => {
                               const amount = parseInt(quantInputs[h.id]) || 1;
                               incrementHabit(h.id, dateStr, amount);
                               setQuantInputs(prev => ({ ...prev, [h.id]: "" }));
                             }}
                             className="w-8 h-8 bg-white rounded shadow-sm flex items-center justify-center text-gray-900 hover:bg-gray-100 active:scale-95 transition-transform"
                           >
                             <Plus size={16} />
                           </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {state.habits.length === 0 && (
           <div className="text-center py-10 text-gray-400">
             <p>No habits yet. Start your grind.</p>
           </div>
        )}
      </div>

      {/* --- HABIT MODAL --- */}
      <Modal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} title={editingId ? "Edit Habit" : "New Habit"}>
        <div className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
             <input className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. Morning Pushups" value={name} onChange={e => setName(e.target.value)} />
           </div>
           
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
             <div className="flex flex-wrap gap-2">
               {state.categories.map(c => (
                 <button 
                  key={c.id}
                  onClick={() => setCatId(c.id)}
                  className={`px-3 py-2 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                    catId === c.id 
                      ? getColorClasses(c.color).replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'border-') // Re-use helper logic roughly
                      : 'border-gray-200 text-gray-400'
                  }`}
                  style={catId === c.id ? { borderColor: 'currentColor', color: 'inherit' } : {}} // Fallback
                 >
                   {c.name}
                 </button>
               ))}
             </div>
           </div>

           <div className="flex gap-4">
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
               <select 
                 value={type} onChange={(e) => setType(e.target.value as HabitType)}
                 className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900 appearance-none"
               >
                 <option value="checkbox">Essential (Yes/No)</option>
                 <option value="numeric">Quantitative (Counter)</option>
               </select>
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                   <Zap size={12} fill="currentColor" /> XP Reward
                </label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" 
                  value={xpReward} 
                  onChange={e => setXpReward(e.target.value)}
                  placeholder={type === 'numeric' ? "XP per Unit" : "XP on Complete"} 
                />
             </div>
           </div>

           {type === 'numeric' && (
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Daily Target</label>
               <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" value={target} onChange={e => setTarget(e.target.value)} />
             </div>
           )}

           <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                 <Bell size={14} /> Reminders (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Alarm</label>
                     <input 
                       type="time" 
                       className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-gray-900 text-sm" 
                       value={reminderTime} 
                       onChange={e => setReminderTime(e.target.value)} 
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Interval (Mins)</label>
                     <input 
                       type="number" 
                       className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-gray-900 text-sm" 
                       placeholder="e.g. 10"
                       value={reminderInterval} 
                       onChange={e => setReminderInterval(e.target.value)} 
                     />
                  </div>
              </div>
           </div>

           <div className="flex gap-3 mt-4">
               {editingId && (
                   <button onClick={handleDeleteHabit} className="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                       <Trash2 size={18} /> Delete
                   </button>
               )}
               <button onClick={handleSaveHabit} className="flex-[3] py-4 bg-gray-900 text-white font-bold rounded-xl">
                    {editingId ? "Update Habit" : "Create Habit"}
               </button>
           </div>
        </div>
      </Modal>

      {/* --- MANAGE CATEGORIES MODAL --- */}
      <Modal isOpen={isManageCatsOpen} onClose={() => setIsManageCatsOpen(false)} title="Categories">
          <div className="space-y-4">
              <div className="space-y-2">
                  {state.categories.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full bg-${c.color}-500`}></div>
                              <span className="font-bold text-gray-900">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => { setIsManageCatsOpen(false); handleOpenCatModal(c); }} className="p-2 text-gray-400 hover:text-gray-900">
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
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-gray-900 hover:text-gray-900 transition-all"
              >
                  + New Category
              </button>
          </div>
      </Modal>

      {/* --- EDIT/NEW CATEGORY MODAL --- */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingCatId ? "Edit Category" : "New Category"}>
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. Hygiene" value={catName} onChange={e => setCatName(e.target.value)} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                  <div className="grid grid-cols-4 gap-2">
                      {availableColors.map(color => (
                          <button
                              key={color}
                              onClick={() => setCatColor(color)}
                              className={`w-full h-10 rounded-lg bg-${color}-500 transition-transform ${catColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : ''}`}
                          />
                      ))}
                  </div>
              </div>
              <button onClick={handleSaveCategory} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4">
                  Save Category
              </button>
          </div>
      </Modal>
    </div>
  );
};
