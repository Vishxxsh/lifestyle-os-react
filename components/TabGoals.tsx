
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Edit2, Plus, TrendingUp, X, Trophy, CheckCircle2, Trash2, Menu, CreditCard, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { formatCurrency, getThemeColors } from '../utils';

export const TabGoals: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { state, addGoal, updateGoal, editGoal, deleteGoal, updateVision } = useApp();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");

  const theme = getThemeColors(state.user.accentColor);

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

  // Card Gradients
  const getGradient = (index: number) => {
      const gradients = [
          'bg-gradient-to-br from-gray-900 to-gray-700',
          'bg-gradient-to-br from-blue-600 to-indigo-900',
          'bg-gradient-to-br from-emerald-600 to-teal-900',
          'bg-gradient-to-br from-purple-600 to-fuchsia-900',
          'bg-gradient-to-br from-orange-500 to-red-900',
      ];
      return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-3 pb-4">
        <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
             <Menu size={24} />
        </button>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Vision Board</h1>
      </div>

      {/* Vision Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-amber-200 dark:from-yellow-900 dark:to-amber-900 blur-xl opacity-20 rounded-3xl"></div>
        <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-yellow-100 dark:border-yellow-900/20 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-500">
                <Sparkles size={16} fill="currentColor" />
                <h3 className="text-xs font-bold uppercase tracking-widest">5 Year Vision</h3>
            </div>
            <textarea 
            className="w-full h-32 bg-transparent text-lg font-medium leading-relaxed text-gray-800 dark:text-gray-200 outline-none resize-none placeholder-gray-400/50"
            placeholder="Write your dreams here..."
            value={state.vision}
            onChange={(e) => updateVision(e.target.value)}
            />
        </div>
      </section>

      {/* Goals Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <CreditCard size={14} /> Financial Targets
           </h3>
           <button 
            onClick={() => handleOpenModal()} 
            className={`text-xs font-bold ${theme.text} ${theme.bgLight} px-3 py-1.5 rounded-full flex items-center gap-1 hover:opacity-80 transition-colors`}
           >
               <Plus size={12} /> New
           </button>
        </div>

        <div className="flex flex-col gap-4 perspective-1000">
          {state.goals.map((goal, idx) => {
            const isCompleted = goal.current >= goal.target;
            const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
            
            return (
              <div 
                key={goal.id} 
                onClick={() => handleQuickAdd(goal.id)}
                className={`relative h-48 rounded-[1.5rem] p-6 shadow-2xl text-white transform transition-all duration-500 hover:scale-[1.02] active:scale-95 cursor-pointer overflow-hidden group ${getGradient(idx)}`}
                style={{ 
                    marginTop: idx > 0 ? '-60px' : '0', // Stack effect
                    zIndex: idx 
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-xl tracking-wide text-white/90">{goal.name}</h3>
                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">Lifestyle OS Card</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold">
                            {progress}%
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-mono tracking-tighter">
                                {formatCurrency(goal.current)}
                            </span>
                            <span className="text-xs text-white/60 mb-1">
                                Goal: {formatCurrency(goal.target)}
                            </span>
                        </div>
                        
                        {/* Progress Bar styled like card strip */}
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div 
                                className="h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons (Visible on Hover/Touch) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(goal); }}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 text-white"
                     >
                         <Edit2 size={14} />
                     </button>
                     <button 
                        onClick={(e) => handleDelete(e, goal.id)}
                        className="p-2 bg-red-500/20 backdrop-blur-md rounded-full hover:bg-red-500/40 text-white"
                     >
                         <X size={14} />
                     </button>
                </div>

                {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                        <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl transform scale-110">
                            <CheckCircle2 className="text-emerald-500" /> Completed
                        </div>
                    </div>
                )}
              </div>
            );
          })}
          
          {state.goals.length === 0 && (
              <div 
                onClick={() => handleOpenModal()}
                className="h-48 rounded-[1.5rem] border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                  <Plus size={32} />
                  <span className="font-bold text-sm">Add First Card</span>
              </div>
          )}
        </div>
        
        {state.goals.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                Tap card to update balance • Stacked for focus
            </p>
        )}
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId !== null ? "Edit Card" : "New Card"}>
         <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Goal Name</label>
              <input 
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400" 
                placeholder="e.g. Dream House" 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Target</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-gray-900 dark:text-white" 
                  value={target} 
                  onChange={e => setTarget(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Saved</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-gray-900 dark:text-white" 
                  value={current} 
                  onChange={e => setCurrent(e.target.value)} 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                {editingId !== null && (
                    <button 
                        type="button"
                        onClick={handleModalDelete}
                        className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold rounded-2xl active:scale-95 transition-transform hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        Delete
                    </button>
                )}
                <button 
                  type="button"
                  onClick={handleSubmit} 
                  className={`flex-[2] py-4 ${theme.bg} ${theme.buttonText} font-bold rounded-2xl shadow-lg active:scale-95 transition-transform`}
                >
                    {editingId !== null ? "Update Card" : "Issue Card"}
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
