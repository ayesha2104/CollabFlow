import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

const TaskColumn = ({ column, tasks, onAddTask, onTaskClick }) => {
    return (
        <div className="flex flex-col bg-slate-800/50 rounded-xl border border-white/5 h-full w-80 flex-shrink-0 backdrop-blur-sm">
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-200">{column.title}</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onAddTask && onAddTask(column.id)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/80' : ''}`}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={() => onTaskClick && onTaskClick(task)}
                            />
                        ))}
                        {provided.placeholder}

                        {/* Quick Add Button at bottom of list */}
                        <button
                            onClick={() => onAddTask && onAddTask(column.id)}
                            className="w-full py-2 mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 transition-all"
                        >
                            <Plus size={16} /> Add Task
                        </button>
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default TaskColumn;
