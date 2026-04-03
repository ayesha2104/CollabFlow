import React, { useState, useRef } from 'react';
import { X, FolderPlus, Rocket } from 'lucide-react';
import { toast } from 'react-toastify';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        members: []
    });
    const [memberEmail, setMemberEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const memberInputRef = useRef(null);

    if (!isOpen) return null;

    const handleAddMember = (e) => {
        if (e.key === 'Enter' && memberEmail.trim()) {
            e.preventDefault();
            const email = memberEmail.trim().toLowerCase();

            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast.error('Please enter a valid email address');
                return;
            }

            if (formData.members.includes(email)) {
                toast.error('This email is already added');
                return;
            }

            setFormData({
                ...formData,
                members: [...formData.members, email]
            });
            setMemberEmail('');
        }
    };

    const handleRemoveMember = (email) => {
        setFormData({
            ...formData,
            members: formData.members.filter(m => m !== email)
        });
    };

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
                members: formData.members.length + 1, // Current user + invited members
                updatedAt: 'Just now'
            };

            onCreate(newProject);
            // toast.success('Project created successfully!');
            setFormData({ name: '', description: '', members: [] }); // Reset form
            setMemberEmail('');
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
                    <h3 className="text-lg font-semibold text-white">
                        Create New Project
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg"
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
                        <label className="form-label">Project Description</label>
                        <textarea
                            className="form-input resize-none h-24"
                            placeholder="Add a brief description about project goals, timelines, and visibility..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Invite Team Members</label>
                        <div className="form-input min-h-[3rem] flex flex-wrap gap-2 items-center p-2">
                            {formData.members.map((email, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                                >
                                    {email}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(email)}
                                        className="hover:text-blue-100 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            <input
                                ref={memberInputRef}
                                type="email"
                                className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-white placeholder-slate-500"
                                placeholder="Type email and press enter..."
                                value={memberEmail}
                                onChange={(e) => setMemberEmail(e.target.value)}
                                onKeyDown={handleAddMember}
                            />
                        </div>
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
                            className="btn btn-primary py-2 px-5 text-sm flex items-center gap-2"
                        >
                            {isLoading ? 'Creating...' : (
                                <>
                                    Create Project
                                    <Rocket size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
