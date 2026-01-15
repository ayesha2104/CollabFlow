import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, MoreHorizontal } from 'lucide-react';

const TaskCard = ({ task, index, onClick }) => {
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-slate-700 text-slate-400 border-slate-600';
        }
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`grid-item bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)] mb-3 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-all shadow-sm ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500/50 rotate-2 opacity-90' : ''}`}
                    style={{ ...provided.draggableProps.style }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        <button className="text-slate-400 hover:text-white transition-colors">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>

                    <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">{task.title}</h4>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            {task.dueDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>{task.dueDate}</span>
                                </div>
                            )}
                        </div>

                        {task.assignee && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-slate-700" title={task.assignee}>
                                {task.assignee.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard;
