import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, getYesterdayStr, calculateStreak } from '../utils';
import { Plus, Flame, Check, Settings, Bell, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Modal } from './Modal';
import { Category, HabitType, Habit } from '../types';

export const TabHabits: React.FC = () => {
  const { state, addHabit, updateHabit, reorderHabit, toggleHabit, incrementHabit, setFabOnClick } = useApp();
  const [viewDate, setViewDate] = useState<'today' | 'yesterday'>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Category>('str');
  const [type, setType] = useState<HabitType>('checkbox');
  const [target, setTarget] = useState("10");
  const [xpReward, setXpReward] = useState("10");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderInterval, setReminderInterval] = useState("");

  // Input state for quantitative habits
  const [quantInputs, setQuantInputs] = useState<Record<number, string>>({});

  const dateStr = viewDate === 'today' ? getTodayStr() : getYesterdayStr();
  const logs = state.logs[dateStr] || {};

  // Notification Permission Logic
  const requestPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  const handleOpenModal = useCallback((habit?: Habit) => {
    if (habit) {
      setEditingId(habit.id);
      setName(habit.name);
      setCat(habit.category);
      setType(habit.type);
      setTarget(habit.target?.toString() || "10");
      setXpReward(habit.xpReward?.toString() || "10");
      setReminderTime(habit.reminderTime || "");
      setReminderInterval(habit.reminderInterval?.toString() || "");
    } else {
      setEditingId(null);
      setName("");
      setCat('str');
      setType('checkbox');
      setTarget("10");
      setXpReward("10");
      setReminderTime("");
      setReminderInterval("");
    }
    setIsModalOpen(true);
  }, []);

  // Register FAB action
  useEffect(() => {
    // Pass the function that we want to execute on click
    setFabOnClick(() => handleOpenModal());
    return () => setFabOnClick(null);
  }, [setFabOnClick, handleOpenModal]);

  const handleSave = () => {
    if (!name) return;
    
    // Request permission if reminders are set
    if (reminderTime || reminderInterval) {
      requestPermission();
    }

    const rTime = reminderTime || undefined;
    const rInt = reminderInterval ? parseInt(reminderInterval) : undefined;
    const xp = parseInt(xpReward) || 10;

    if (editingId) {
      updateHabit(editingId, {
        name,
        category: cat,
        type,
        target: type === 'numeric' ? parseInt(target) : undefined,
        reminderTime: rTime,
        reminderInterval: rInt,
        xpReward: xp
      });
    } else {
      addHabit(name, cat, type, type === 'numeric' ? parseInt(target) : undefined, rTime, rInt, xp);
    }
    setIsModalOpen(false);
  };

  // Helpers
  const getColor = (c: Category) => {
    switch (c) {
      case 'str': return 'text-red-500 bg-red-50 border-red-200';
      case 'int': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'vit': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    }
  };

  const getIcon = (c: Category) => {
      switch(c) {
          case 'str': return '🔴';
          case 'int': return '🔵';
          case 'vit': return '🟢';
      }
  }

  const categories: Category[] = ['str', 'int', 'vit'];

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

      {/* Habits List */}
      <div className="space-y-6">
        {categories.map(categoryKey => {
          // Filter habits based on category, preserving their order from the main state
          const habits = state.habits.filter(h => h.category === categoryKey);
          if (habits.length === 0) return null;

          const label = categoryKey === 'str' ? 'Strength' : categoryKey === 'int' ? 'Intellect' : 'Vitality';

          return (
            <div key={categoryKey}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</h3>
              <div className="space-y-3">
                {habits.map((h, idx) => {
                  const val = logs[h.id];
                  const streak = calculateStreak(h.id, state);
                  const isDone = h.type === 'checkbox' ? !!val : (val as number || 0) >= (h.target || 1);

                  return (
                    <div key={h.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gray-50 shrink-0`}>
                           {getIcon(h.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate pr-2 flex items-center gap-2">
                            {h.name}
                            <button onClick={() => handleOpenModal(h)} className="text-gray-300 hover:text-gray-500">
                               <Settings size={14} />
                            </button>
                            {/* Reordering Controls */}
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
                            <span className="text-gray-400 flex items-center gap-0.5" title="XP Reward">
                                <Zap size={10} fill="currentColor" /> {h.xpReward || 1} XP
                            </span>
                            {(h.reminderTime || h.reminderInterval) && (
                                <span className="text-gray-400 flex items-center gap-0.5"><Bell size={10} /> On</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      {h.type === 'checkbox' ? (
                        <button 
                          onClick={() => toggleHabit(h.id, dateStr)}
                          className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 shrink-0 ${
                            isDone 
                              ? `${getColor(h.category).split(' ')[0]} border-current` 
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

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Habit" : "New Habit"}>
        <div className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
             <input className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. Morning Pushups" value={name} onChange={e => setName(e.target.value)} />
           </div>
           
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zone</label>
             <div className="flex gap-2">
               {categories.map(c => (
                 <button 
                  key={c}
                  onClick={() => setCat(c)}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${
                    cat === c 
                      ? (c === 'str' ? 'border-red-500 bg-red-50 text-red-600' : c === 'int' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-emerald-500 bg-emerald-50 text-emerald-600')
                      : 'border-gray-200 text-gray-400'
                  }`}
                 >
                   {c === 'str' ? 'Strength' : c === 'int' ? 'Intellect' : 'Vitality'}
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

           <button onClick={handleSave} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4">
             {editingId ? "Update Habit" : "Create Habit"}
           </button>
        </div>
      </Modal>
    </div>
  );
};
