import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { toast } from 'react-toastify';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Project name is required');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            const newProject = {
                id: Date.now(),
                name: formData.name,
                description: formData.description,
                taskCount: 0,
                activeTaskCount: 0,
                members: [1], // Current user
                updatedAt: 'Just now'
            };

            onCreate(newProject);
            toast.success('Project created successfully!');
            setFormData({ name: '', description: '' }); // Reset form
            setIsLoading(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FolderPlus className="text-blue-500" size={20} />
                        Create New Project
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Website Redesign"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description <span className="text-slate-500 font-normal">(Optional)</span></label>
                        <textarea
                            className="form-input resize-none h-24"
                            placeholder="What is this project about?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary py-2 px-5 text-sm"
                        >
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
