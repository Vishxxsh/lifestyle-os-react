
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, formatDateDisplay } from '../utils';
import { Plus, X, Flame, Menu, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Modal } from './Modal';

export const TabMeals: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addMeal, deleteMeal, addWorkout, deleteWorkout } = useApp();
  
  // Date Navigation State
  const [viewDate, setViewDate] = useState(getTodayStr());

  // Food State
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [cal, setCal] = useState("");
  const [pro, setPro] = useState("");

  // Activity State
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutCal, setWorkoutCal] = useState("");

  const meals = state.meals[viewDate] || [];
  const workouts = state.workouts?.[viewDate] || [];
  
  const totalCalIn = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalPro = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCalOut = workouts.reduce((acc, w) => acc + w.calories, 0);

  // Date handlers
  const handlePrevDay = () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() - 1);
      setViewDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + 1);
      setViewDate(d.toISOString().split('T')[0]);
  };

  const isToday = viewDate === getTodayStr();

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFoodName(val);
    // Auto-fill logic
    if (state.foodHistory[val]) {
      setCal(state.foodHistory[val].calories.toString());
      setPro(state.foodHistory[val].protein.toString());
    }
  };

  const handleSaveFood = () => {
    if (!foodName || !cal) return;
    addMeal(foodName, parseInt(cal), pro ? parseInt(pro) : 0, viewDate);
    setFoodName(""); setCal(""); setPro("");
    setIsFoodModalOpen(false);
  };

  const handleSaveWorkout = () => {
      if (!workoutName || !workoutCal) return;
      addWorkout(workoutName, parseInt(workoutCal), viewDate);
      setWorkoutName(""); setWorkoutCal("");
      setIsWorkoutModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
       <div className="border-b border-gray-200 dark:border-gray-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Energy Tank</h1>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
          <button onClick={handlePrevDay} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 text-sm">
              <Calendar size={14} className="text-gray-400" />
              {isToday ? "Today" : formatDateDisplay(viewDate)}
          </div>
          <button onClick={handleNextDay} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronRight size={20} />
          </button>
      </div>

      {/* Macro Dashboard */}
      <div className="flex gap-4 sticky top-0 z-10 bg-white dark:bg-gray-900 pb-2 pt-2">
        <div className="flex-1 bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="block text-3xl font-extrabold">{totalCalIn}</span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Calories In</span>
          </div>
          {/* Net indicator */}
          <div className="absolute top-2 right-2 opacity-20">
              <Plus size={40} />
          </div>
        </div>

        <div className="flex-1 bg-orange-500 dark:bg-orange-700 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="block text-3xl font-extrabold">{totalCalOut}</span>
            <span className="text-xs text-orange-100 font-bold uppercase tracking-wider">Calories Out</span>
          </div>
          <div className="absolute top-2 right-2 opacity-20">
              <Flame size={40} />
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
           <span className="block text-xl font-extrabold">{totalPro}g</span>
           <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Protein</span>
        </div>
        <div className="text-right">
            <span className="block text-xl font-extrabold">{totalCalIn - totalCalOut}</span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Net Cals</span>
        </div>
      </div>

      {/* Food List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
           <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Food Log</h3>
           <button onClick={() => setIsFoodModalOpen(true)} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
             <Plus size={14} /> Add Food
           </button>
        </div>
        <div>
          {meals.map(m => (
            <div key={m.id} className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 last:border-none">
               <div>
                 <div className="font-bold text-gray-900 dark:text-white">{m.name}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400">{m.calories} cal  •  {m.protein}g protein</div>
               </div>
               <button onClick={() => deleteMeal(m.id, viewDate)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400">
                 <X size={16} />
               </button>
            </div>
          ))}
          {meals.length === 0 && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-600 text-xs">No food logged for this day.</div>
          )}
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
           <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Activity Log</h3>
           <button onClick={() => setIsWorkoutModalOpen(true)} className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
             <Plus size={14} /> Add Activity
           </button>
        </div>
        <div>
          {workouts.map(w => (
            <div key={w.id} className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 last:border-none">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-lg">
                    <Flame size={16} fill="currentColor" />
                 </div>
                 <div>
                    <div className="font-bold text-gray-900 dark:text-white">{w.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{w.calories} cal burnt</div>
                 </div>
               </div>
               <button onClick={() => deleteWorkout(w.id, viewDate)} className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400">
                 <X size={16} />
               </button>
            </div>
          ))}
          {workouts.length === 0 && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-600 text-xs">No activity logged for this day.</div>
          )}
        </div>
      </div>

      {/* Food Modal */}
      <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} title="Log Food">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Food Name</label>
            <input 
              list="history" 
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
              placeholder="e.g. 2 Eggs" 
              value={foodName} 
              onChange={handleFoodNameChange} 
            />
            <datalist id="history">
              {Object.keys(state.foodHistory).map(f => <option key={f} value={f} />)}
            </datalist>
          </div>
          
          <div className="flex gap-4">
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Calories</label>
               <input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="0" value={cal} onChange={e => setCal(e.target.value)} />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Protein (g)</label>
               <input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="0" value={pro} onChange={e => setPro(e.target.value)} />
             </div>
          </div>

          <button onClick={handleSaveFood} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl mt-4">Log Fuel</button>
        </div>
      </Modal>

      {/* Workout Modal */}
      <Modal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} title="Log Activity">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Activity Name</label>
            <input 
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
              placeholder="e.g. Running, Gym" 
              value={workoutName} 
              onChange={e => setWorkoutName(e.target.value)} 
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Calories Burnt</label>
             <input type="number" className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" placeholder="0" value={workoutCal} onChange={e => setWorkoutCal(e.target.value)} />
          </div>

          <button onClick={handleSaveWorkout} className="w-full py-4 bg-orange-500 dark:bg-orange-600 text-white font-bold rounded-xl mt-4">Log Burn</button>
        </div>
      </Modal>
    </div>
  );
};
