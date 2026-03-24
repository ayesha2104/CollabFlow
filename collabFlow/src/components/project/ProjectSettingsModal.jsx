import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Users, Settings, Mail, Plus } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';

const ProjectSettingsModal = ({ isOpen, onClose, project, onUpdateProject, onDeleteProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fieldDefinitions, setFieldDefinitions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'members', 'fields'
    
    // Member invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const { inviteMembers } = useProjects();

    useEffect(() => {
        if (project && isOpen) {
            setName(project.name || '');
            setDescription(project.description || '');
            setFieldDefinitions(project.fieldDefinitions || []);
            setActiveTab('general');
        }
    }, [project, isOpen]);

    if (!isOpen || !project) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdateProject({ name, description, fieldDefinitions });
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

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        // Simple format check, let backend handle proper validation
        const emails = inviteEmail.split(',').map(e => e.trim()).filter(e => e);
        if (emails.length === 0) return;

        setIsInviting(true);
        try {
            await inviteMembers(project.id, emails);
            setInviteEmail('');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl max-w-lg w-full border border-slate-700 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
                    <h2 className="text-lg font-semibold text-white">Project Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 bg-slate-800/80 px-4 pt-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Settings size={16} /> General
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === 'members' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Users size={16} /> Members
                    </button>
                    <button
                        onClick={() => setActiveTab('fields')}
                        className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === 'fields' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Settings size={16} /> Custom Fields
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
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
                    ) : activeTab === 'members' ? (
                        <div className="space-y-6">
                            {/* Invite Input */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-2">Invite Members</h3>
                                <form onSubmit={handleInvite} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Mail size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="Enter email addresses (comma separated)"
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block pl-10 p-2.5 outline-none transition-all placeholder-slate-500 text-sm"
                                            disabled={isInviting}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInviting || !inviteEmail.trim()}
                                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 min-w-[80px]"
                                    >
                                        {isInviting ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                        ) : (
                                            <>
                                                <Plus size={16} className="mr-1" /> Invite
                                            </>
                                        )}
                                    </button>
                                </form>
                                <p className="text-xs text-slate-500 mt-2">Only registered users can be invited.</p>
                            </div>

                            <div className="border-t border-slate-700 my-4 border-dashed" />

                            {/* Member List */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center justify-between">
                                    <span>Project Members</span>
                                    <span className="bg-slate-700 py-0.5 px-2 rounded-full text-xs">{project.members?.length || 0}</span>
                                </h3>
                                
                                <div className="space-y-2">
                                    {(project.members || []).map((member, idx) => (
                                        <div key={member.id || idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={member.avatar || `https://ui-avatars.com/api/?name=${member.name || 'User'}&background=random`} 
                                                    alt={member.name} 
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-white">{member.name || 'Unknown User'}</div>
                                                    <div className="text-xs text-slate-400 capitalize">{member.role}</div>
                                                </div>
                                            </div>
                                            {/* Example spot for a Remove button if endpoint existed */}
                                            {/* {member.role !== 'owner' && (
                                                <button className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-slate-800 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            )} */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-300">Custom Fields</h3>
                                    <p className="text-xs text-slate-500 mt-1">Fields defined here will appear on all tasks in this project.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFieldDefinitions([...fieldDefinitions, { id: 'field_' + Date.now(), name: '', type: 'text' }])}
                                    className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={14} /> Add Field
                                </button>
                            </div>
                            <div className="space-y-3">
                                {fieldDefinitions.map((field, idx) => (
                                    <div key={field.id} className="flex gap-2 items-start bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={(e) => {
                                                    const newDefs = [...fieldDefinitions];
                                                    newDefs[idx].name = e.target.value;
                                                    setFieldDefinitions(newDefs);
                                                }}
                                                placeholder="Field Name (e.g., Environment)"
                                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded text-sm p-2 outline-none"
                                            />
                                            <select
                                                value={field.type}
                                                onChange={(e) => {
                                                    const newDefs = [...fieldDefinitions];
                                                    newDefs[idx].type = e.target.value;
                                                    setFieldDefinitions(newDefs);
                                                }}
                                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded text-sm p-2 outline-none"
                                            >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="dropdown">Dropdown</option>
                                                <option value="boolean">Checkbox</option>
                                            </select>
                                            {field.type === 'dropdown' && (
                                                <input
                                                    type="text"
                                                    value={field.options ? field.options.join(', ') : ''}
                                                    onChange={(e) => {
                                                        const newDefs = [...fieldDefinitions];
                                                        newDefs[idx].options = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                                        setFieldDefinitions(newDefs);
                                                    }}
                                                    placeholder="Options, comma separated"
                                                    className="w-full bg-slate-800 border-slate-700 text-slate-200 rounded text-sm p-2 outline-none border border-dashed"
                                                />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFieldDefinitions(fieldDefinitions.filter((_, i) => i !== idx))}
                                            className="text-slate-500 hover:text-red-400 p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {activeTab !== 'members' && (
                    <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 shrink-0">
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
                )}
            </div>
        </div>
    );
};

export default ProjectSettingsModal;
