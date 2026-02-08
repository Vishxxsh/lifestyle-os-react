
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getTodayStr, getScoreColor } from '../utils';
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3, Calendar, Menu, Flame, Utensils } from 'lucide-react';
import { Meal, Workout } from '../types';

export const TabReports: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
    const { state } = useApp();
    const [viewDate, setViewDate] = useState(new Date());

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
        
        // Filter habits that exist
        const cats = state.categories.map(cat => {
            const habits = state.habits.filter(h => h.categoryId === cat.id);
            if (habits.length === 0) return null;

            let totalActual = 0;
            let totalExpected = 0;

            // Loop through all days of the current viewed month
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                // For each habit in this category
                habits.forEach(h => {
                     const val = state.logs[dateStr]?.[h.id];
                     const isDone = h.type === 'checkbox' ? !!val : (val as number || 0) >= (h.target || 1);
                     if (isDone) totalActual++;
                });
            }

            // Calculate Expected
            habits.forEach(h => {
                if (h.frequency === 'daily') {
                    totalExpected += daysInMonth; 
                } else if (h.frequency === 'weekly') {
                    totalExpected += (h.frequencyGoal * (daysInMonth / 7));
                } else if (h.frequency === 'monthly') {
                    totalExpected += h.frequencyGoal;
                }
            });

            const percentage = totalExpected === 0 ? 0 : Math.round((totalActual / totalExpected) * 100);

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
                        
                        return (
                            <div 
                                key={day} 
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-default border border-transparent ${score ? getScoreColor(score) : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-700'}`}
                                title={score ? `Rating: ${score}` : 'No rating'}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
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
        </div>
    );
};
