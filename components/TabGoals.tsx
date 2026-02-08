
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Edit2, Plus, TrendingUp, X, Trophy, CheckCircle2, Trash2, Menu } from 'lucide-react';
import { Modal } from './Modal';
import { formatCurrency } from '../utils';

export const TabGoals: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addGoal, updateGoal, editGoal, deleteGoal, updateVision } = useApp();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const handleOpenModal = (goal?: any) => {
    if (goal) {
      setEditingId(goal.id);
      setName(goal.name);
      setTarget(goal.target.toString());
      setCurrent(goal.current.toString());
    } else {
      setEditingId(null);
      setName("");
      setTarget("");
      setCurrent("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if(!name || !target) return;
    const t = parseInt(target);
    const c = parseInt(current) || 0;

    if (editingId !== null) {
      editGoal(editingId, name, t, c);
    } else {
      addGoal(name, t, c);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm("Delete this target?")) {
        deleteGoal(id);
    }
  };

  const handleQuickAdd = (id: number) => {
     const val = prompt("Enter amount to add (or negative to remove):");
     if (val) {
       const num = parseInt(val);
       if (!isNaN(num)) updateGoal(id, num);
     }
  };

  const handleModalDelete = () => {
      if (editingId !== null) {
          if (window.confirm("Delete this financial target?")) {
              deleteGoal(editingId);
              setIsModalOpen(false);
          }
      }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-4 flex items-center gap-3">
        <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
             <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vision Board</h1>
      </div>

      {/* Vision Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">5 Year Vision</h3>
        </div>
        <textarea 
           className="w-full h-40 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl p-4 text-sm leading-relaxed text-gray-800 dark:text-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none resize-none shadow-sm transition-all placeholder-gray-400"
           placeholder="Describe your life in 5 years..."
           value={state.vision}
           onChange={(e) => updateVision(e.target.value)}
        />
      </section>

      {/* Goals Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Targets</h3>
        </div>

        <div className="grid gap-4">
          {state.goals.map(goal => {
            const isCompleted = goal.current >= goal.target;
            const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
            
            return (
              <div 
                key={goal.id} 
                className={`p-5 rounded-2xl border shadow-sm relative group transition-all duration-300 ${
                    isCompleted 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' 
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* Background Pattern for Completed */}
                {isCompleted && (
                    <div className="absolute -right-4 -top-4 text-emerald-100 dark:text-emerald-900/40 opacity-50 rotate-12 pointer-events-none">
                        <Trophy size={120} />
                    </div>
                )}

                {/* Card Header */}
                <div className="flex justify-between items-start mb-4 gap-4 relative z-20">
                   <div className="flex-1 min-w-0">
                     <h3 className={`font-bold text-lg leading-tight truncate ${isCompleted ? 'text-emerald-900 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                         {goal.name}
                     </h3>
                     <p className={`text-xs font-mono mt-1 ${isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'}`}>
                       {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                     </p>
                   </div>
                   
                   {/* Actions: Explicit z-index to stay above other elements */}
                   <div className="flex gap-2 relative z-50">
                       {!isCompleted && (
                           <button 
                             type="button"
                             onClick={(e) => { 
                               e.stopPropagation();
                               handleOpenModal(goal); 
                             }}
                             className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
                             title="Edit Target"
                           >
                             <Edit2 size={18} />
                           </button>
                       )}
                       
                       <button 
                         type="button"
                         onClick={(e) => handleDelete(e, goal.id)}
                         className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer shadow-sm ${
                             isCompleted 
                             ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60' 
                             : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700'
                         }`}
                         title="Delete Target"
                       >
                         <X size={20} />
                       </button>
                   </div>
                </div>

                {/* Completed Message */}
                {isCompleted ? (
                    <div className="relative z-10 bg-white/60 dark:bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                        <div className="bg-emerald-500 text-white p-1.5 rounded-full">
                            <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Congrats! Goal Reached.</span>
                    </div>
                ) : (
                    /* Progress Bar */
                    <div 
                      onClick={() => handleQuickAdd(goal.id)}
                      className="cursor-pointer relative z-10 group/bar mt-4"
                    >
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-blue-600 dark:text-blue-400">{progress}% Funded</span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-2 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        Tap to update funds
                      </p>
                    </div>
                )}
              </div>
            );
          })}

          <button 
            onClick={() => handleOpenModal()} 
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-400 dark:text-gray-500 font-bold text-sm hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Target
          </button>
        </div>
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId !== null ? "Edit Target" : "New Target"}>
         <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Goal Name</label>
              <input 
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
                placeholder="e.g. Dream House" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Target Amount</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Current Saved</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white" 
                  value={current} 
                  onChange={e => setCurrent(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                {editingId !== null && (
                    <button 
                        type="button"
                        onClick={handleModalDelete}
                        className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        <Trash2 size={18} /> Delete
                    </button>
                )}
                <button 
                  type="button"
                  onClick={handleSubmit} 
                  className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                    {editingId !== null ? "Save Changes" : "Create Goal"}
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
