import React, { useMemo } from 'react';
import { addDays, format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const GanttView = ({ tasks, filterFn, onTaskClick }) => {
    // Flatten and filter all tasks
    const allTasksArray = useMemo(() => {
        return filterFn(Object.keys(tasks)).sort((a, b) => {
            const dateA = a.startDate || a.dueDate || a.createdAt;
            const dateB = b.startDate || b.dueDate || b.createdAt;
            return new Date(dateA) - new Date(dateB);
        });
    }, [tasks, filterFn]);

    // Calculate timeline range
    const { startDate, endDate, days } = useMemo(() => {
        if (allTasksArray.length === 0) {
            const now = new Date();
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            return { startDate: start, endDate: end, days: eachDayOfInterval({ start, end }) };
        }

        let minDate = new Date();
        let maxDate = new Date();

        allTasksArray.forEach(task => {
            const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt));
            const end = task.dueDate ? new Date(task.dueDate) : start;
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        // Add some padding
        const paddedStart = addDays(minDate, -5);
        const paddedEnd = addDays(maxDate, 15);
        
        return {
            startDate: paddedStart,
            endDate: paddedEnd,
            days: eachDayOfInterval({ start: paddedStart, end: paddedEnd })
        };
    }, [allTasksArray]);

    const criticalPathIds = useMemo(() => {
        const taskMap = new Map();
        let maxEndDate = new Date(0);
        
        allTasksArray.forEach(t => {
            const start = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt));
            const end = t.dueDate ? new Date(t.dueDate) : start;
            if (end > maxEndDate) maxEndDate = end;
            taskMap.set(t.id, { ...t, endStr: end.toISOString() });
        });

        const blockedByMap = new Map(); // taskId -> array of taskIds that block it
        allTasksArray.forEach(t => {
            blockedByMap.set(t.id, []);
        });

        allTasksArray.forEach(t => {
            if (t.dependencies) {
                t.dependencies.forEach(dep => {
                    const depId = typeof dep.task === 'object' ? dep.task._id : dep.task;
                    // If t blocks depId, depId is blocked by t
                    if (dep.type === 'blocking' && blockedByMap.has(depId)) {
                        blockedByMap.get(depId).push(t.id);
                    } else if (dep.type === 'blockedBy' && blockedByMap.has(depId)) {
                        blockedByMap.get(t.id).push(depId);
                    }
                });
            }
        });

        const criticalSet = new Set();
        const maxEndStr = maxEndDate.toISOString().substring(0, 10);
        
        const terminalTasks = allTasksArray.filter(t => {
            const end = t.dueDate ? new Date(t.dueDate) : (t.startDate ? new Date(t.startDate) : new Date(t.createdAt));
            // Ensure no one is blocked by this task
            let blocksSomeone = false;
            for (const [id, blockers] of blockedByMap.entries()) {
                if (blockers.includes(t.id)) blocksSomeone = true;
            }
            return !blocksSomeone && end.toISOString().substring(0, 10) === maxEndStr;
        });

        const traverseBackwards = (taskId) => {
            if (criticalSet.has(taskId)) return;
            criticalSet.add(taskId);
            const blockers = blockedByMap.get(taskId) || [];
            blockers.forEach(bId => traverseBackwards(bId));
        };

        terminalTasks.forEach(t => traverseBackwards(t.id));
        return criticalSet;
    }, [allTasksArray]);

    const cellWidth = 40; // px per day

    const getTaskStyles = (task) => {
        const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt));
        const end = task.dueDate ? new Date(task.dueDate) : start;
        
        const offsetDays = differenceInDays(start, startDate);
        let durationDays = differenceInDays(end, start) + 1;
        if (durationDays < 1) durationDays = 1;

        const left = offsetDays * cellWidth;
        const width = durationDays * cellWidth;

        let bgColor = 'bg-blue-500/80 hover:bg-blue-400';
        let barBorder = 'border-blue-400';
        if (task.status === 'Done') {
            bgColor = 'bg-emerald-500/80 hover:bg-emerald-400';
            barBorder = 'border-emerald-400';
        } else if (criticalPathIds.has(task.id)) {
            bgColor = 'bg-rose-600/90 hover:bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]';
            barBorder = 'border-rose-400';
        } else if (task.priority === 'High') {
            bgColor = 'bg-orange-500/80 hover:bg-orange-400';
            barBorder = 'border-orange-400';
        }

        return { left, width, bgColor, barBorder };
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900 border-l border-t border-slate-700 rounded-tl-xl mx-6 mt-6 shadow-2xl">
            {/* Header / Timeline Axis */}
            <div className="flex border-b border-slate-700 bg-slate-800/80 shrink-0">
                <div className="w-64 shrink-0 border-r border-slate-700 p-4 font-semibold text-slate-300 flex items-center shadow-md z-10 bg-slate-800">
                    Tasks
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex absolute" style={{ width: days.length * cellWidth }}>
                        {days.map((day, i) => {
                            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            
                            return (
                                <div 
                                    key={i} 
                                    className={`shrink-0 flex flex-col items-center justify-center border-r border-slate-700/50 py-2 h-14 ${isWeekend ? 'bg-slate-800/30' : ''} ${isToday ? 'bg-blue-500/10' : ''}`}
                                    style={{ width: cellWidth }}
                                >
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{format(day, 'MMM')}</span>
                                    <span className={`text-xs font-bold mt-0.5 ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {format(day, 'dd')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Gantt Body */}
            <div className="flex flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                {/* Fixed Task List */}
                <div className="w-64 shrink-0 border-r border-slate-700 bg-slate-800/50 z-10">
                    {allTasksArray.map(task => (
                        <div 
                            key={`list-${task.id}`} 
                            className="h-12 border-b border-slate-700/50 px-4 flex items-center cursor-pointer hover:bg-slate-700/50 transition-colors group"
                            onClick={() => onTaskClick(task)}
                        >
                            <span className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">{task.title}</span>
                        </div>
                    ))}
                    {allTasksArray.length === 0 && (
                        <div className="p-4 text-sm text-slate-500 italic">No tasks with valid dates.</div>
                    )}
                </div>

                {/* Scrollable Timeline Area */}
                <div className="flex-1 overflow-x-auto relative custom-scrollbar">
                    <div className="relative" style={{ width: days.length * cellWidth, minHeight: '100%' }}>
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {days.map((day, i) => {
                                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div 
                                        key={`grid-${i}`} 
                                        className={`shrink-0 h-full border-r border-slate-700/30 ${isWeekend ? 'bg-slate-800/20' : ''} ${isToday ? 'bg-blue-500/5 border-blue-500/20' : ''}`}
                                        style={{ width: cellWidth }}
                                    ></div>
                                );
                            })}
                        </div>
                        
                        {/* Task Bars */}
                        {allTasksArray.map((task, index) => {
                            const { left, width, bgColor, barBorder } = getTaskStyles(task);
                            const top = index * 48; // 48px is equivalent to h-12

                            return (
                                <div 
                                    key={`bar-${task.id}`}
                                    className="absolute h-12 flex items-center group pointer-events-none"
                                    style={{ top, left, width: '100%' }}
                                >
                                    <div 
                                        className={`absolute h-7 rounded-md border border-t ${bgColor} ${barBorder} shadow-sm cursor-pointer pointer-events-auto transition-all bg-opacity-90 hover:bg-opacity-100 hover:shadow-lg flex items-center px-2 overflow-hidden backdrop-blur-sm`}
                                        style={{ width, minWidth: '4px' }}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        {width > 30 && (
                                            <span className="text-[10px] font-semibold text-white truncate drop-shadow-md">
                                                {task.title}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttView;
