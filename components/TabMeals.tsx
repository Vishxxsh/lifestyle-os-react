
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, formatDateDisplay } from '../utils';
import { Plus, X, Flame, Menu, ChevronLeft, ChevronRight, Calendar, Target, Edit2 } from 'lucide-react';
import { Modal } from './Modal';

export const TabMeals: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addMeal, deleteMeal, addWorkout, deleteWorkout, updateUserConfig } = useApp();
  
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

  // Target Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [tempInTarget, setTempInTarget] = useState("");
  const [tempOutTarget, setTempOutTarget] = useState("");

  const meals = state.meals[viewDate] || [];
  const workouts = state.workouts?.[viewDate] || [];
  
  const totalCalIn = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalPro = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCalOut = workouts.reduce((acc, w) => acc + w.calories, 0);
  const netCalories = totalCalIn - totalCalOut;

  // Targets
  const inTarget = state.user.caloriesInTarget || 2000;
  const outTarget = state.user.caloriesOutTarget || 500;
  const netTarget = inTarget - outTarget;

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

  const openTargetModal = () => {
      setTempInTarget(inTarget.toString());
      setTempOutTarget(outTarget.toString());
      setIsTargetModalOpen(true);
  };

  const saveTargets = () => {
      const i = parseInt(tempInTarget) || 2000;
      const o = parseInt(tempOutTarget) || 500;
      updateUserConfig({ 
          caloriesInTarget: i,
          caloriesOutTarget: o,
          netCaloriesTarget: i - o // Automatically calculated
      });
      setIsTargetModalOpen(false);
  };

  // Color Logic
  // In: Green if under target, Red if over
  const inColor = totalCalIn <= inTarget ? 'bg-emerald-500' : 'bg-red-500';
  // Out: Green if over target (hit goal), Orange/Gray if under (working on it)
  const outColor = totalCalOut >= outTarget ? 'bg-emerald-500' : 'bg-orange-500';
  
  // Net Color Logic based on Sign Matching
  let netColor = 'text-gray-900 dark:text-white';
  if (netTarget < 0) {
      // Weight Loss Goal (Negative Target) -> Actual should be Negative
      netColor = netCalories <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  } else {
      // Weight Gain Goal (Positive Target) -> Actual should be Positive
      netColor = netCalories >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  }

  // Calculated Net for Modal Display
  const calcNetInModal = (parseInt(tempInTarget) || 0) - (parseInt(tempOutTarget) || 0);

  return (
    <div className="space-y-6 pb-24">
       <div className="border-b border-gray-200 dark:border-gray-800 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Energy Tank</h1>
        </div>
        <button onClick={openTargetModal} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2">
            <Target size={20} />
        </button>
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
        <button 
            onClick={openTargetModal}
            className={`flex-1 ${inColor} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden transition-colors text-left group`}
        >
          <div className="relative z-10">
            <div className="flex items-end gap-1">
                <span className="block text-3xl font-extrabold">{totalCalIn}</span>
                <span className="text-xs font-medium opacity-80 mb-1.5">/ {inTarget}</span>
            </div>
            <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Calories In</span>
          </div>
          <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Plus size={40} />
          </div>
        </button>

        <button 
            onClick={openTargetModal}
            className={`flex-1 ${outColor} text-white p-4 rounded-2xl shadow-lg relative overflow-hidden transition-colors text-left group`}
        >
          <div className="relative z-10">
            <div className="flex items-end gap-1">
                <span className="block text-3xl font-extrabold">{totalCalOut}</span>
                <span className="text-xs font-medium opacity-80 mb-1.5">/ {outTarget}</span>
            </div>
            <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Calories Out</span>
          </div>
          <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Flame size={40} />
          </div>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
        <div>
           <span className="block text-xl font-extrabold">{totalPro}g</span>
           <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Protein</span>
        </div>
        <div className="text-right">
            <div className="flex items-center justify-end gap-1">
                <span className={`block text-xl font-extrabold ${netColor}`}>
                    {netCalories > 0 ? '+' : ''}{netCalories}
                </span>
                <span className="text-xs text-gray-400 font-medium mt-1">/ {netTarget}</span>
            </div>
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

      {/* Calorie Targets Modal */}
      <Modal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} title="Calorie Targets">
        <div className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-emerald-500 uppercase mb-1">Daily Max Intake (Calories In)</label>
                <input 
                    type="number"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white" 
                    value={tempInTarget} 
                    onChange={e => setTempInTarget(e.target.value)} 
                />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-orange-500 uppercase mb-1">Daily Min Burn (Calories Out)</label>
                <input 
                    type="number"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white" 
                    value={tempOutTarget} 
                    onChange={e => setTempOutTarget(e.target.value)} 
                />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Calculated Net Target</label>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-300">
                    {calcNetInModal > 0 ? '+' : ''}{calcNetInModal}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                    {calcNetInModal < 0 
                        ? "Deficit Goal: Stay negative (Green). Positive is Red." 
                        : "Surplus Goal: Stay positive (Green). Negative is Red."}
                </p>
            </div>

            <button 
                onClick={saveTargets}
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg mt-2"
            >
                Save Targets
            </button>
        </div>
      </Modal>
    </div>
  );
};
