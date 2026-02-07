import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr } from '../utils';
import { Plus, X } from 'lucide-react';
import { Modal } from './Modal';

export const TabMeals: React.FC = () => {
  const { state, addMeal, deleteMeal } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [cal, setCal] = useState("");
  const [pro, setPro] = useState("");

  const today = getTodayStr();
  const meals = state.meals[today] || [];
  
  const totalCal = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalPro = meals.reduce((acc, m) => acc + m.protein, 0);

  const handleFoodNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFoodName(val);
    // Auto-fill logic
    if (state.foodHistory[val]) {
      setCal(state.foodHistory[val].calories.toString());
      setPro(state.foodHistory[val].protein.toString());
    }
  };

  const handleSave = () => {
    if (!foodName || !cal) return;
    addMeal(foodName, parseInt(cal), pro ? parseInt(pro) : 0, today);
    setFoodName("");
    setCal("");
    setPro("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
       <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Tank</h1>
      </div>

      {/* Macro Dashboard */}
      <div className="flex gap-4 sticky top-0 z-10 bg-gray-50 pb-2 pt-2">
        <div className="flex-1 bg-gray-900 text-white p-4 rounded-2xl shadow-lg">
          <span className="block text-3xl font-extrabold">{totalCal}</span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Calories</span>
        </div>
        <div className="flex-1 bg-white border border-gray-200 text-gray-900 p-4 rounded-2xl shadow-sm">
          <span className="block text-3xl font-extrabold">{totalPro}g</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Protein</span>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Today's Log</h3>
           <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-blue-600 flex items-center gap-1">
             <Plus size={14} /> Add Food
           </button>
        </div>
        <div>
          {meals.map(m => (
            <div key={m.id} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-none">
               <div>
                 <div className="font-bold text-gray-900">{m.name}</div>
                 <div className="text-xs text-gray-500">{m.calories} cal  •  {m.protein}g protein</div>
               </div>
               <button onClick={() => deleteMeal(m.id, today)} className="p-2 text-gray-300 hover:text-red-500">
                 <X size={16} />
               </button>
            </div>
          ))}
          {meals.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">Fuel tank empty. Log something.</div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Food">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Food Name</label>
            <input 
              list="history" 
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" 
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
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calories</label>
               <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="0" value={cal} onChange={e => setCal(e.target.value)} />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Protein (g)</label>
               <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="0" value={pro} onChange={e => setPro(e.target.value)} />
             </div>
          </div>

          <button onClick={handleSave} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4">Log Fuel</button>
        </div>
      </Modal>
    </div>
  );
};
