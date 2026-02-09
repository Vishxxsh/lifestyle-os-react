
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, getScoreColor, formatDateDisplay } from '../utils';
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3, Menu, Flame, Utensils, X, Check, Dumbbell, Calendar as CalendarIcon, Smile } from 'lucide-react';
import { Meal, Workout } from '../types';
import { Modal } from './Modal';

export const TabReports: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
    const { state } = useApp();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(null);

    // --- Calendar Logic ---
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 Sun - 6 Sat
    // Adjust for Monday start: Mon=0, Sun=6
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // --- Correlation Logic ---
    const correlationData = useMemo(() => {
        if (Object.keys(state.dayScores).length < 5) return [];

        const habits = state.habits;
        const results = habits.map(habit => {
            let sumDone = 0, countDone = 0;
            let sumNot = 0, countNot = 0;

            Object.entries(state.dayScores).forEach(([date, score]) => {
                const val = state.logs[date]?.[habit.id];
                const done = habit.type === 'checkbox' ? !!val : (val as number || 0) >= (habit.target || 1);

                if (done) {
                    sumDone += (score as number);
                    countDone++;
                } else {
                    sumNot += (score as number);
                    countNot++;
                }
            });

            const avgDone = countDone ? sumDone / countDone : 0;
            const avgNot = countNot ? sumNot / countNot : 0;
            const diff = avgDone - avgNot;

            return {
                id: habit.id,
                name: habit.name,
                diff,
                avgDone,
                countDone
            };
        });

        return results.filter(r => r.countDone > 0).sort((a, b) => b.diff - a.diff).slice(0, 3);
    }, [state.dayScores, state.logs, state.habits]);

    // --- Category Consistency Logic ---
    const categoryConsistency = useMemo(() => {
        if (state.habits.length === 0) return [];
        
        // Determine how many days have passed in the selected month
        const today = new Date();
        const isCurrentMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
        
        let daysPassed = daysInMonth;
        if (isCurrentMonth) {
            daysPassed = today.getDate();
        } else if (viewDate > today) {
            // Future month, no consistency data
            daysPassed = 0; 
        }

        // Filter habits that exist
        const cats = state.categories.map(cat => {
            const habits = state.habits.filter(h => h.categoryId === cat.id);
            if (habits.length === 0) return null;

            let totalActual = 0;
            let totalExpected = 0;

            // Loop through days PASSED in the current viewed month
            for (let d = 1; d <= daysPassed; d++) {
                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                // For each habit in this category
                habits.forEach(h => {
                     const val = state.logs[dateStr]?.[h.id];
                     
                     // Modified Logic: For Numeric, > 0 counts as consistent (showing up matters)
                     // For Checkbox, true counts as consistent
                     const isDone = h.type === 'checkbox' ? !!val : (val as number || 0) > 0;
                     
                     if (isDone) totalActual++;
                });
            }

            // Calculate Expected (Pro-rated based on daysPassed)
            habits.forEach(h => {
                if (h.frequency === 'daily') {
                    totalExpected += daysPassed; 
                } else if (h.frequency === 'weekly') {
                    // e.g. If 9 days passed, expect (Goal/7 * 9)
                    totalExpected += (h.frequencyGoal * (daysPassed / 7));
                } else if (h.frequency === 'monthly') {
                    // e.g. If 9 days passed in a 30 day month, expect (Goal/30 * 9)
                    totalExpected += (h.frequencyGoal * (daysPassed / daysInMonth));
                }
            });

            // Prevent division by zero if daysPassed is 0 (future month)
            const percentage = totalExpected <= 0 ? 0 : Math.round((totalActual / totalExpected) * 100);

            return {
                ...cat,
                percentage: Math.min(100, percentage) // Cap at 100
            };
        }).filter(Boolean) as (typeof state.categories[0] & { percentage: number })[];

        return cats;
    }, [state.habits, state.categories, state.logs, viewDate, daysInMonth]);

    // --- Nutrition Stats Logic ---
    const nutritionStats = useMemo(() => {
        let totalCalsIn = 0;
        let totalCalsOut = 0;
        let totalProtein = 0;
        const loggedDays = new Set<string>();

        // We iterate through all data, filtering for the current view Month
        // This is slightly inefficient if data is huge, but fine for local storage scale
        const targetYM = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;

        // Process Meals
        Object.entries(state.meals).forEach(([date, meals]: [string, Meal[]]) => {
            if (date.startsWith(targetYM)) {
                if (meals.length > 0) loggedDays.add(date);
                meals.forEach(m => {
                    totalCalsIn += m.calories;
                    totalProtein += m.protein;
                });
            }
        });

        // Process Workouts
        Object.entries(state.workouts).forEach(([date, workouts]: [string, Workout[]]) => {
             if (date.startsWith(targetYM)) {
                 workouts.forEach(w => {
                     totalCalsOut += w.calories;
                 });
             }
        });

        const netCalories = totalCalsIn - totalCalsOut;
        const avgProtein = loggedDays.size > 0 ? Math.round(totalProtein / loggedDays.size) : 0;

        return { netCalories, avgProtein };
    }, [state.meals, state.workouts, viewDate]);

    const getColorClasses = (color: string) => {
        // Simple background colors for bars, keeping them bright in dark mode for visibility
        const map: Record<string, string> = {
            red: 'bg-red-500',
            blue: 'bg-blue-500',
            emerald: 'bg-emerald-500',
            purple: 'bg-purple-500',
            orange: 'bg-orange-500',
            slate: 'bg-slate-500',
        };
        return map[color] || 'bg-blue-500';
    };

    // --- Day Details Helpers ---
    const getDayDetails = () => {
        if (!selectedDetailDate) return null;
        
        const dateStr = selectedDetailDate;
        const score = state.dayScores[dateStr];
        const dayMeals = state.meals[dateStr] || [];
        const dayWorkouts = state.workouts[dateStr] || [];
        const dayHabits = state.habits.map(h => {
            const val = state.logs[dateStr]?.[h.id];
            const isDone = h.type === 'checkbox' ? !!val : (val as number || 0) >= (h.target || 1);
            return { ...h, val, isDone };
        });

        const dayCalsIn = dayMeals.reduce((acc, m) => acc + m.calories, 0);
        const dayCalsOut = dayWorkouts.reduce((acc, w) => acc + w.calories, 0);
        const dayProtein = dayMeals.reduce((acc, m) => acc + m.protein, 0);
        const dayNetCals = dayCalsIn - dayCalsOut;

        return { dateStr, score, dayMeals, dayWorkouts, dayHabits, dayCalsIn, dayCalsOut, dayProtein, dayNetCals };
    };

    const details = getDayDetails();

    return (
        <div className="space-y-8 pb-24">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 flex items-center gap-3">
                <button onClick={onOpenSettings} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Menu size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Analyze your performance</p>
                </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="font-bold text-gray-900 dark:text-white">{monthName}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const score = state.dayScores[dateStr];
                        const hasData = score || (state.logs[dateStr] && Object.keys(state.logs[dateStr]).length > 0) || state.meals[dateStr]?.length > 0;
                        
                        return (
                            <button 
                                key={day} 
                                onClick={() => setSelectedDetailDate(dateStr)}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-95 border border-transparent 
                                    ${score 
                                        ? getScoreColor(score) 
                                        : hasData 
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
                <div className="text-center mt-3 text-[10px] text-gray-400">Tap a date to view detailed logs</div>
            </div>

            {/* Nutrition Insights (New Section) */}
            <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Utensils size={16} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nutrition Insights</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-orange-500 mb-2">
                            <Flame size={20} fill="currentColor" />
                            <span className="text-xs font-bold uppercase">Net Calories</span>
                        </div>
                        <div>
                            <span className={`text-2xl font-black ${nutritionStats.netCalories > 0 ? 'text-gray-900 dark:text-white' : 'text-emerald-500'}`}>
                                {nutritionStats.netCalories > 0 ? '+' : ''}{nutritionStats.netCalories}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1">Total (In - Out) this month</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-blue-500 mb-2">
                            <Utensils size={20} />
                            <span className="text-xs font-bold uppercase">Avg Protein</span>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                                {nutritionStats.avgProtein}g
                            </span>
                            <p className="text-[10px] text-gray-400 mt-1">Daily average (recorded days)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consistency Scores */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consistency by Category</h3>
                </div>

                <div className="grid gap-4">
                    {categoryConsistency.map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-900 dark:text-white">{cat.name}</span>
                                <span className="text-sm font-black text-gray-900 dark:text-white">{cat.percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${getColorClasses(cat.color)}`}
                                    style={{ width: `${cat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {categoryConsistency.length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-xs bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                            No habits to track.
                        </div>
                    )}
                    {categoryConsistency.length > 0 && (
                        <p className="text-[10px] text-gray-400 px-1">
                            Calculated based on days passed this month. Any progress on numeric habits (> 0) counts as consistency.
                        </p>
                    )}
                </div>
            </div>

            {/* Impact Analysis */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Day Boosters</h3>
                </div>
                
                {correlationData.length > 0 ? (
                    correlationData.map((item, idx) => (
                        <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                    <div className="text-[10px] text-gray-400">
                                        Avg Rating when done: <span className="font-bold text-gray-600 dark:text-gray-300">{item.avgDone.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-emerald-500">+{item.diff.toFixed(1)}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Impact</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-6 text-center text-gray-400 text-xs bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                        Not enough data to calculate correlations yet. Keep tracking your days!
                    </div>
                )}
            </div>

            {/* --- Day Detail Modal --- */}
            {details && (
                <Modal isOpen={!!selectedDetailDate} onClose={() => setSelectedDetailDate(null)} title="Day Details">
                    <div className="space-y-6">
                        {/* Header & Score */}
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                             <div>
                                 <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                     {formatDateDisplay(details.dateStr)}
                                 </h2>
                                 <div className="text-xs text-gray-400 uppercase font-bold tracking-widest mt-1">
                                     {new Date(details.dateStr).getFullYear()}
                                 </div>
                             </div>
                             <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl ${details.score ? getScoreColor(details.score) : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                 <div className="text-2xl font-black">{details.score || '-'}</div>
                                 <div className="text-[8px] uppercase font-bold">Rating</div>
                             </div>
                        </div>

                        {/* Habits */}
                        <div className="space-y-3">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Check size={14} /> Habits
                             </h3>
                             <div className="space-y-2">
                                 {details.dayHabits.length > 0 ? (
                                     details.dayHabits.map(h => {
                                         const currentVal = typeof h.val === 'number' ? h.val : (h.val ? 1 : 0);
                                         const targetVal = h.target || 1;
                                         const isPartial = h.type === 'numeric' && currentVal > 0 && !h.isDone;

                                         return (
                                             <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl border ${h.isDone ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-2 h-2 rounded-full ${h.isDone ? 'bg-emerald-500' : (isPartial ? 'bg-orange-400' : 'bg-gray-300 dark:bg-gray-600')}`}></div>
                                                     <span className={`text-sm font-bold ${h.isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                                         {h.name}
                                                     </span>
                                                 </div>
                                                 {h.type === 'checkbox' ? (
                                                     h.isDone ? (
                                                         <Check size={16} className="text-emerald-500" />
                                                     ) : (
                                                         <X size={16} className="text-gray-300 dark:text-gray-600" />
                                                     )
                                                 ) : (
                                                     <span className={`text-xs font-bold ${h.isDone ? 'text-emerald-600 dark:text-emerald-400' : (currentVal > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600')}`}>
                                                         {currentVal} / {targetVal} {h.unit}
                                                     </span>
                                                 )}
                                             </div>
                                         );
                                     })
                                 ) : (
                                     <div className="text-sm text-gray-400 italic">No habits tracked.</div>
                                 )}
                             </div>
                        </div>

                        {/* Nutrition */}
                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Utensils size={14} /> Nutrition
                             </h3>
                             
                             {/* Stats Row */}
                             <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <div className="text-center">
                                     <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Net Cals</div>
                                     <div className={`text-lg font-black ${details.dayNetCals > 0 ? 'text-gray-900 dark:text-white' : 'text-emerald-500'}`}>
                                        {details.dayNetCals > 0 ? '+' : ''}{details.dayNetCals}
                                     </div>
                                </div>
                                <div className="text-center border-l border-gray-200 dark:border-gray-700">
                                     <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Protein</div>
                                     <div className="text-lg font-black text-blue-500">
                                        {details.dayProtein}g
                                     </div>
                                </div>
                                 <div className="text-center border-l border-gray-200 dark:border-gray-700">
                                     <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">In / Out</div>
                                     <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
                                        {details.dayCalsIn} / <span className="text-orange-500">{details.dayCalsOut}</span>
                                     </div>
                                </div>
                             </div>

                             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                 {details.dayMeals.map(m => (
                                     <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                         <span className="text-gray-700 dark:text-gray-300">{m.name}</span>
                                         <span className="text-xs text-gray-500">{m.calories} cal</span>
                                     </div>
                                 ))}
                                 {details.dayMeals.length === 0 && <div className="text-xs text-gray-400 italic">No meals logged.</div>}
                             </div>
                        </div>

                        {/* Workouts */}
                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Dumbbell size={14} /> Activity
                             </h3>
                             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                 {details.dayWorkouts.map(w => (
                                     <div key={w.id} className="flex justify-between items-center text-sm p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                                         <span className="text-gray-700 dark:text-gray-200">{w.name}</span>
                                         <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{w.calories} cal</span>
                                     </div>
                                 ))}
                                 {details.dayWorkouts.length === 0 && <div className="text-xs text-gray-400 italic">No workouts logged.</div>}
                             </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
