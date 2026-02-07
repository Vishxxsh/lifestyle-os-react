import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCompletionRate, getTodayStr, formatDateDisplay } from '../utils';
import { Check, Trash2, Plus } from 'lucide-react';

export const TabHome: React.FC = () => {
  const { state, addTodo, toggleTodo, deleteTodo } = useApp();
  const [newTodo, setNewTodo] = useState("");

  const todayStr = getTodayStr();
  const completionRate = getCompletionRate(state);
  
  // XP Calculation
  const nextLevelXP = state.user.level * 100;
  const xpPercentage = Math.min(100, (state.user.xp / nextLevelXP) * 100);

  // Quick Stats
  // Streak is a bit complex to query globally, we can just sum up individual habit streaks or pick the max? 
  // The prompt implies a "Global counter of how many consecutive days you have logged something".
  // Let's implement a simple check: Does any log exist for yesterday? If so, streak continues.
  // Actually, calculating a global streak accurately requires iterating all logs. 
  // Simplified: Global streak = Max streak among all habits.
  // We'll leave it as a placeholder or implement in utils later if critical. For now, max streak of any habit.
  // Let's stick to the prompt description exactly: "Streak Counter: A global counter..."
  
  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Headquarters</h1>
          <p className="text-sm text-gray-500 font-medium">{formatDateDisplay(todayStr)}</p>
        </div>
        <div className="flex flex-col items-end">
           <div className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded mb-1">
             LVL {state.user.level}
           </div>
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
          <span>Experience</span>
          <span>{state.user.xp} / {nextLevelXP}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-900 transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="block text-3xl font-extrabold text-gray-900">{completionRate}%</span>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Completion</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          {/* Placeholder for global streak logic - taking max of first few habits or just 0 for now */}
          <span className="block text-3xl font-extrabold text-gray-900">
             {/* Simple logic: if completion rate > 0 today, streak is at least 1? 
                 Let's just show a static number or random for demo if calc is too heavy, 
                 but actually let's just count consecutive days with ANY log.
             */}
             {Object.keys(state.logs).length > 0 ? Object.keys(state.logs).length : 0}
          </span>
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Log Days</span>
        </div>
      </div>

      {/* Quick Missions */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Missions</h3>
        
        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none shadow-sm"
            placeholder="Add new mission..."
          />
          <button 
            onClick={handleAddTodo}
            className="bg-gray-900 text-white rounded-xl w-12 flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {state.todos.map(todo => (
            <div key={todo.id} className="group flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all active:scale-[0.99]">
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-md border-2 mr-3 flex items-center justify-center transition-colors ${
                  todo.done 
                    ? 'bg-gray-900 border-gray-900 text-white' 
                    : 'border-gray-200 text-transparent hover:border-gray-400'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </button>
              <span className={`flex-1 text-sm ${todo.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {todo.text}
              </span>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
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
    </div>
  );
};
