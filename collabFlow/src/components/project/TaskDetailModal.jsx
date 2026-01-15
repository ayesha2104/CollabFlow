import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Trash2, Save, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const TaskDetailModal = ({ isOpen, onClose, task, onDelete, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignee: '',
        dueDate: ''
    });

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
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                        TASK-{task?.id?.split('-')[1] || 'NEW'}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Title */}
                    <input
                        type="text"
                        className="w-full bg-transparent text-2xl font-bold text-white border-none focus:ring-0 focus:outline-none placeholder-slate-600 mb-4"
                        placeholder="Task Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                <textarea
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 min-h-[150px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                                    placeholder="Add a more detailed description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Sidebar Controls */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-4">
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
                                    <div className="relative">
                                        <Flag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>
                                    </div>
                                </div>

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
                                            <option value="Alice">Alice</option>
                                            <option value="Bob">Bob</option>
                                            <option value="Charlie">Charlie</option>
                                        </select>
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

                            <div className="pt-2 text-xs text-slate-500 flex items-center gap-1">
                                <Clock size={12} />
                                <span>Created 2 days ago</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)] bg-slate-800/50 flex justify-between items-center">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} /> Delete
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
    );
};

export default TaskDetailModal;
