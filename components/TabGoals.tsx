import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { Modal } from './Modal';

export const TabGoals: React.FC = () => {
  const { state, addGoal, updateGoal, updateVision } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const handleSave = () => {
    if (!name || !target) return;
    addGoal(name, parseInt(target), current ? parseInt(current) : 0);
    setIsModalOpen(false);
    setName(""); setTarget(""); setCurrent("");
  };

  const handleUpdate = (id: number) => {
    const amount = prompt("Add amount saved (or negative to subtract):");
    if (amount) updateGoal(id, parseInt(amount));
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Vision Board</h1>
      </div>

      {/* Financial Targets */}
      <div>
         <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Targets</h3>
         </div>

         <div className="space-y-3">
           {state.goals.map(g => {
             const pct = Math.min(100, Math.round((g.current / g.target) * 100));
             return (
               <div key={g.id} onClick={() => handleUpdate(g.id)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                 <div className="flex justify-between mb-2 font-bold text-sm text-gray-900">
                   <span>{g.name}</span>
                   <span>{pct}%</span>
                 </div>
                 <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }}></div>
                 </div>
                 <div className="text-right text-xs text-gray-500 font-mono">
                   ${g.current.toLocaleString()} / ${g.target.toLocaleString()}
                 </div>
               </div>
             );
           })}
           
           <button onClick={() => setIsModalOpen(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold text-sm hover:border-gray-400 hover:text-gray-500 transition-colors">
             + Add Goal
           </button>
         </div>
      </div>

      {/* Vision Manifesto */}
      <div className="pt-4">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">5 Year Vision</h3>
         <textarea 
           className="w-full h-64 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm leading-relaxed text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none shadow-sm"
           placeholder="In 5 years, I will be..."
           value={state.vision}
           onChange={(e) => updateVision(e.target.value)}
         ></textarea>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Goal Name</label>
            <input className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="e.g. New Laptop" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex gap-4">
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target ($)</label>
               <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" value={target} onChange={e => setTarget(e.target.value)} />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Saved ($)</label>
               <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-gray-900" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)} />
             </div>
          </div>
          <button onClick={handleSave} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl mt-4">Create Goal</button>
        </div>
      </Modal>
    </div>
  );
};
