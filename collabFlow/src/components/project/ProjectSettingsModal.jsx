import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

const ProjectSettingsModal = ({ isOpen, onClose, project, onUpdateProject, onDeleteProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (project && isOpen) {
            setName(project.name || '');
            setDescription(project.description || '');
        }
    }, [project, isOpen]);

    if (!isOpen || !project) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdateProject({ name, description });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            await onDeleteProject();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-lg font-semibold text-white">Project Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[70vh]">
                    <form id="project-settings-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Project Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 outline-none transition-all placeholder-slate-500"
                                placeholder="Enter project name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 outline-none transition-all placeholder-slate-500 resize-none"
                                placeholder="Enter project description"
                            />
                        </div>
                    </form>

                    <div className="mt-8 pt-4 border-t border-slate-700 border-dashed">
                        <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-xs text-slate-400 mb-3">
                            Once you delete a project, there is no going back. Please be certain.
                        </p>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-colors font-medium text-sm"
                        >
                            <Trash2 size={16} /> Delete Project
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="project-settings-form"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsModal;
