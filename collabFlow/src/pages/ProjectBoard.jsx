import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskColumn from '../components/project/TaskColumn';
import Navbar from '../components/shared/Navbar';
import TaskDetailModal from '../components/project/TaskDetailModal';
import { Users, Settings, Filter, ArrowLeft, Plus } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

// Mock Data
const initialBoardData = {
    tasks: {
        'task-1': { id: 'task-1', title: 'Design Landing Page', priority: 'High', assignee: 'Alice', dueDate: 'Oct 24' },
        'task-2': { id: 'task-2', title: 'Setup React Project', priority: 'High', assignee: 'Bob', dueDate: 'Oct 20' },
        'task-3': { id: 'task-3', title: 'Implement Auth', priority: 'Medium', assignee: 'Charlie', dueDate: 'Oct 25' },
        'task-4': { id: 'task-4', title: 'Database Schema', priority: 'Low', assignee: 'Alice', dueDate: 'Oct 28' },
    },
    columns: {
        'col-1': { id: 'col-1', title: 'To Do', taskIds: ['task-1', 'task-2'] },
        'col-2': { id: 'col-2', title: 'In Progress', taskIds: ['task-3'] },
        'col-3': { id: 'col-3', title: 'Done', taskIds: ['task-4'] },
    },
    columnOrder: ['col-1', 'col-2', 'col-3'],
};

const ProjectBoard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(initialBoardData);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const start = data.columns[source.droppableId];
        const finish = data.columns[destination.droppableId];

        // Moving in same column
        if (start === finish) {
            const newTaskIds = Array.from(start.taskIds);
            newTaskIds.splice(source.index, 1);
            newTaskIds.splice(destination.index, 0, draggableId);

            const newColumn = { ...start, taskIds: newTaskIds };
            setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
            return;
        }

        // Moving between columns
        const startTaskIds = Array.from(start.taskIds);
        startTaskIds.splice(source.index, 1);
        const newStart = { ...start, taskIds: startTaskIds };

        const finishTaskIds = Array.from(finish.taskIds);
        finishTaskIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finish, taskIds: finishTaskIds };

        setData({
            ...data,
            columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
        });
        // TODO: Emit socket event for move
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleAddTask = (columnId) => {
        const newTaskId = `task-${Date.now()}`;
        const newTask = {
            id: newTaskId,
            title: 'New Task',
            priority: 'Medium',
            assignee: '',
            status: data.columns[columnId].title,
            dueDate: ''
        };

        const newTasks = { ...data.tasks, [newTaskId]: newTask };
        const newColumn = {
            ...data.columns[columnId],
            taskIds: [...data.columns[columnId].taskIds, newTaskId]
        };

        setData({
            ...data,
            tasks: newTasks,
            columns: { ...data.columns, [columnId]: newColumn }
        });

        // Optional: Open modal immediately
        setSelectedTask(newTask);
        setIsModalOpen(true);
    };

    const handleUpdateTask = (updatedTask) => {
        setData({
            ...data,
            tasks: {
                ...data.tasks,
                [updatedTask.id]: updatedTask
            }
        });
    };

    const handleDeleteTask = (taskId) => {
        // Remove from tasks
        const newTasks = { ...data.tasks };
        delete newTasks[taskId];

        // Remove from columns
        const newColumns = { ...data.columns };
        Object.keys(newColumns).forEach(colId => {
            newColumns[colId].taskIds = newColumns[colId].taskIds.filter(id => id !== taskId);
        });

        setData({
            ...data,
            tasks: newTasks,
            columns: newColumns
        });
        setIsModalOpen(false);
    };

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-dark)] overflow-hidden">
            <Navbar />

            {/* Project Header */}
            <div className="border-b border-[var(--border)] bg-slate-800/30 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            Website Redesign
                            <span className="text-xs font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">Public</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white">A</div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white">B</div>
                        <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white">+2</div>
                    </div>

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    <button className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium">
                        <Settings size={16} /> Settings
                    </button>
                </div>
            </div>

            {/* Board Canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="h-full flex p-6 gap-6 min-w-max">
                        {data.columnOrder.map((columnId) => {
                            const column = data.columns[columnId];
                            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);
                            return (
                                <TaskColumn
                                    key={column.id}
                                    column={column}
                                    tasks={tasks}
                                    onAddTask={handleAddTask}
                                    onTaskClick={handleTaskClick}
                                />
                            );
                        })}

                        {/* Add Column Button */}
                        <button className="w-80 h-12 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all flex-shrink-0">
                            <Plus size={20} className="mr-2" /> Add Column
                        </button>
                    </div>
                </DragDropContext>
            </div>

            <TaskDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
                onSave={handleUpdateTask}
                onDelete={handleDeleteTask}
            />
        </div>
    );
};

export default ProjectBoard;
