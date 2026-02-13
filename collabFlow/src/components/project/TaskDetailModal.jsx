import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Trash2, Save, Clock, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const TaskDetailModal = ({ isOpen, onClose, task, onDelete, onSave }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignee: '',
        dueDate: ''
    });

    // Mock active viewers removed
    const [activeViewers] = useState([]);

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                status: task.status || 'To Do',
                assignee: task.assignee || '',
                dueDate: task.dueDate || ''
            });
        }
    }, [task]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.title.trim()) {
            toast.error('Task title is required');
            return;
        }

        onSave && onSave({ ...task, ...formData });
        toast.success('Task updated successfully');
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDelete && onDelete(task.id);
            toast.info('Task deleted');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        {/* Presence Indicator */}
                        {/* Presence Indicator - To be implemented with real socket data */}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full border border-blue-500/30 uppercase">
                            Live
                        </span>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Title */}
                    <div className="mb-4">
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
                            TASK TITLE
                        </div>
                        <input
                            type="text"
                            className="w-full bg-transparent text-2xl font-bold text-white border-none focus:ring-0 focus:outline-none placeholder-slate-600"
                            placeholder="Task Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 min-h-[150px]">
                                    {/* Rich text toolbar */}
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                                        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                            <span className="font-bold text-sm">B</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                            <span className="italic text-sm">I</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent border-none outline-none text-slate-300 resize-y min-h-[100px] focus:ring-0"
                                        placeholder="Add a more detailed description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Activity Section */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Activity</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs text-white font-medium">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent border-none outline-none text-slate-300 placeholder-slate-500"
                                        placeholder="Write a comment..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Properties</div>

                                {/* Assignee */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Assignee</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500"
                                            value={formData.assignee}
                                            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            <option value="Alex Rivera">Alex Rivera</option>
                                            <option value="Sarah Chen">Sarah Chen</option>
                                            <option value="Bob Johnson">Bob Johnson</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                                    <select
                                        className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 px-3 focus:ring-2 focus:ring-blue-500"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option>To Do</option>
                                        <option>In Progress</option>
                                        <option>Done</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                                    <div className="flex gap-2">
                                        {['Low', 'Med', 'High'].map((priority) => (
                                            <button
                                                key={priority}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: priority === 'Med' ? 'Medium' : priority })}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${formData.priority.toLowerCase() === priority.toLowerCase() ||
                                                        (priority === 'Med' && formData.priority === 'Medium')
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {priority}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Oct 24"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock size={12} />
                                    <span>Created Oct 10 by {user?.name || 'You'}</span>
                                </div>
                                <div>Last updated 2 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] bg-slate-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} /> Delete Task
                        </button>
                        <span className="text-xs text-slate-500">Press Esc to close</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary gap-2"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskDetailModal;
