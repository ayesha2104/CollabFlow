import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Trash2, Save, Clock, Circle, Plus, Link as LinkIcon, Play, Square } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
};

const TaskDetailModal = ({ isOpen, onClose, task, project, allTasks, onDelete, onSave, onAddComment, onRemoveComment, onAddAttachment }) => {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignee: '',
        dueDate: '',
        startDate: '',
        estimatedTime: 0,
        subtasks: [],
        customFields: {},
        dependencies: [],
        timeEntries: []
    });

    const [timerState, setTimerState] = useState({ isRunning: false, startTime: null, elapsed: 0 });
    const timerRef = useRef(null);
    const [activeViewers] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);

    const getId = (obj) => obj?._id || obj?.id || '';

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                status: task.status || 'To Do',
                assignee: getId(task.assignee) || task.assignee || '',
                dueDate: task.dueDate ? (parseLocalDate(task.dueDate)?.toISOString().substring(0, 10) || '') : '',
                startDate: task.startDate ? (parseLocalDate(task.startDate)?.toISOString().substring(0, 10) || '') : '',
                estimatedTime: task.estimatedTime || 0,
                subtasks: task.subtasks || [],
                customFields: task.customFields || {},
                dependencies: task.dependencies || [],
                timeEntries: task.timeEntries || []
            });
            setTimerState({ isRunning: false, startTime: null, elapsed: 0 });
        }
    }, [task]);

    useEffect(() => {
        if (timerState.isRunning) {
            timerRef.current = setInterval(() => {
                setTimerState(prev => ({ ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) }));
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timerState.isRunning]);

    const formatElapsedTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggleTimer = () => {
        if (timerState.isRunning) {
            const elapsedMinutes = Math.ceil(timerState.elapsed / 60) || 1;
            const newEntry = {
                user: getId(user),
                startTime: new Date(timerState.startTime),
                endTime: new Date(),
                duration: elapsedMinutes,
                description: 'Timer session'
            };
            setFormData(prev => ({ ...prev, timeEntries: [...prev.timeEntries, newEntry] }));
            setTimerState({ isRunning: false, startTime: null, elapsed: 0 });
        } else {
            setTimerState({ isRunning: true, startTime: Date.now(), elapsed: 0 });
        }
    };

    const handleAddTimeEntry = () => {
        const minStr = prompt('Enter minutes spent:');
        if (!minStr || isNaN(minStr)) return;
        const mins = parseInt(minStr, 10);
        const newEntry = {
            user: getId(user),
            startTime: new Date(),
            endTime: new Date(),
            duration: mins,
            description: 'Manual entry'
        };
        setFormData(prev => ({ ...prev, timeEntries: [...prev.timeEntries, newEntry] }));
    };

    if (!isOpen) return null;

    const taskId = getId(task);

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Task title is required');
            return;
        }
        if (onSave) {
            await onSave({ ...task, ...formData });
        }
        if (!task?.isDraft) {
            toast.success('Task updated successfully');
        }
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDelete && onDelete(taskId);
            toast.info('Task deleted');
            onClose();
        }
    };

    const handleAddComment = async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!newComment.trim() || !onAddComment) return;
            try {
                setIsSubmittingComment(true);
                await onAddComment(taskId, newComment, replyingTo);
                setNewComment('');
                setReplyingTo(null);
            } finally {
                setIsSubmittingComment(false);
            }
        }
    };

    const topLevelComments = (task?.comments || []).filter(c => !c.parentId);
    const getReplies = (parentId) => (task?.comments || []).filter(c => c.parentId === parentId);

    const createdAtStr = task?.createdAt
        ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown';
    const updatedAtStr = task?.updatedAt
        ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })
        : null;

    const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-slate-800/50">
                    <div className="flex items-center gap-4"></div>
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
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">TASK TITLE</div>
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

                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 min-h-[150px]">
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

                            {/* Subtasks */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Subtasks</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, subtasks: [...formData.subtasks, { title: '', isCompleted: false }] })}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                    >
                                        <Circle className="w-3 h-3" /> Add Subtask
                                    </button>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {formData.subtasks.map((subtask, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={subtask.isCompleted}
                                                onChange={(e) => {
                                                    const newSubtasks = [...formData.subtasks];
                                                    newSubtasks[idx].isCompleted = e.target.checked;
                                                    setFormData({ ...formData, subtasks: newSubtasks });
                                                }}
                                                className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-900"
                                            />
                                            <input
                                                type="text"
                                                value={subtask.title}
                                                onChange={(e) => {
                                                    const newSubtasks = [...formData.subtasks];
                                                    newSubtasks[idx].title = e.target.value;
                                                    setFormData({ ...formData, subtasks: newSubtasks });
                                                }}
                                                placeholder="Subtask title..."
                                                className="flex-1 bg-transparent border-none text-sm text-slate-200 outline-none focus:ring-0 p-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, subtasks: formData.subtasks.filter((_, i) => i !== idx) })}
                                                className="text-slate-500 hover:text-red-400 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.subtasks.length === 0 && (
                                        <div className="text-sm text-slate-500 italic py-2">No subtasks yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Dependencies */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dependencies</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, dependencies: [...prev.dependencies, { task: '', type: 'blocking' }] }))}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Dependency
                                    </button>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {formData.dependencies.map((dep, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                            <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                                            <select
                                                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded p-1 outline-none"
                                                value={dep.type}
                                                onChange={(e) => {
                                                    const newDeps = [...formData.dependencies];
                                                    newDeps[idx].type = e.target.value;
                                                    setFormData({ ...formData, dependencies: newDeps });
                                                }}
                                            >
                                                <option value="blocking">Blocks</option>
                                                <option value="blockedBy">Is blocked by</option>
                                            </select>
                                            <select
                                                className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded p-1 outline-none max-w-[200px]"
                                                value={typeof dep.task === 'object' ? getId(dep.task) : dep.task}
                                                onChange={(e) => {
                                                    const newDeps = [...formData.dependencies];
                                                    newDeps[idx].task = e.target.value;
                                                    setFormData({ ...formData, dependencies: newDeps });
                                                }}
                                            >
                                                <option value="">Select a task...</option>
                                                {allTasks && Object.values(allTasks)
                                                    .filter(t => getId(t) !== taskId)
                                                    .map(t => (
                                                        <option key={getId(t)} value={getId(t)}>{t.title}</option>
                                                    ))
                                                }
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, dependencies: formData.dependencies.filter((_, i) => i !== idx) })}
                                                className="text-slate-500 hover:text-red-400 p-1 ml-auto"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.dependencies.length === 0 && (
                                        <div className="text-sm text-slate-500 italic py-2">No dependencies set.</div>
                                    )}
                                </div>
                            </div>

                            {/* Attachments */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Attachments</label>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const url = prompt('Enter attachment URL (e.g., Google Drive link, Figma):');
                                            if (!url) return;
                                            const name = prompt('Enter attachment name:');
                                            if (url && name && onAddAttachment) {
                                                onAddAttachment(taskId, { url, name, type: 'link', size: 0 });
                                            }
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                    >
                                        <Circle className="w-3 h-3" /> Add Link
                                    </button>
                                </div>
                                {task?.attachments?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                        {task.attachments.map(att => (
                                            <a
                                                key={att._id}
                                                href={att.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-800 transition-all group"
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded shadow-inner text-slate-400 group-hover:text-blue-400 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-200 truncate">{att.name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{att.url}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic py-4 text-center border border-dashed border-slate-700/50 rounded-lg bg-slate-800/20">
                                        No attachments added.
                                    </div>
                                )}
                            </div>

                            {/* Activity / Comments */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Activity</label>
                                <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {topLevelComments.map(comment => (
                                        <div key={comment._id} className="mb-2">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-medium text-white overflow-hidden">
                                                    {comment.user?.avatar
                                                        ? <img src={comment.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        : (comment.user?.name?.charAt(0) || 'U')}
                                                </div>
                                                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-sm font-medium text-slate-300">{comment.user?.name || 'User'}</span>
                                                        <div className="flex items-center gap-2 text-slate-500">
                                                            <span className="text-[10px]">
                                                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {(getId(user) === getId(comment.user) || user?.role === 'pm' || user?.role === 'admin') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        onRemoveComment && onRemoveComment(taskId, comment._id);
                                                                    }}
                                                                    className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                                                    title="Delete comment"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{comment.text}</p>
                                                    <button
                                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                                        className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-400 transition-colors"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>

                                            {getReplies(comment._id).length > 0 && (
                                                <div className="ml-11 mt-3 space-y-3 border-l-2 border-slate-700/50 pl-4">
                                                    {getReplies(comment._id).map(reply => (
                                                        <div key={reply._id} className="flex gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-white overflow-hidden">
                                                                {reply.user?.avatar
                                                                    ? <img src={reply.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                                    : (reply.user?.name?.charAt(0) || 'U')}
                                                            </div>
                                                            <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded p-2">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-medium text-slate-300">{reply.user?.name || 'User'}</span>
                                                                    <div className="flex items-center gap-2 text-slate-500">
                                                                        <span className="text-[10px]">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                        {(getId(user) === getId(reply.user) || user?.role === 'pm' || user?.role === 'admin') && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    onRemoveComment && onRemoveComment(taskId, reply._id);
                                                                                }}
                                                                                className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                                                                title="Delete reply"
                                                                            >
                                                                                <X size={10} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-400 whitespace-pre-wrap">{reply.text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!task?.comments || task.comments.length === 0) && (
                                        <div className="text-sm text-slate-500 italic py-2 text-center border border-dashed border-slate-700 rounded-lg">
                                            No comments yet.
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    {replyingTo && (
                                        <div className="flex items-center justify-between bg-slate-800 border border-b-0 border-slate-700 p-2 rounded-t-lg text-xs text-slate-400">
                                            <span>Replying to comment...</span>
                                            <button onClick={() => setReplyingTo(null)} className="hover:text-slate-200"><X size={14} /></button>
                                        </div>
                                    )}
                                    <div className={`flex items-start gap-3 p-3 bg-slate-900/30 border border-slate-700 ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}>
                                        <div className="w-8 h-8 mt-1 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex-shrink-0 flex items-center justify-center text-xs text-white font-medium">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 relative">
                                            <textarea
                                                className="w-full bg-transparent border-none outline-none text-slate-300 placeholder-slate-500 resize-none min-h-[40px] p-2 focus:ring-0 text-sm"
                                                placeholder={replyingTo ? "Write a reply... (Press Enter to post)" : "Write a comment... (Press Enter to post)"}
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={handleAddComment}
                                                disabled={isSubmittingComment}
                                                rows={2}
                                            />
                                            {isSubmittingComment && (
                                                <div className="absolute top-2 right-2 w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Properties</div>

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                                    <select
                                        className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 px-3 focus:ring-2 focus:ring-blue-500"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Assignee</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500"
                                            value={formData.assignee || ''}
                                            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            {project?.members?.map(member => (
                                                <option key={getId(member)} value={getId(member)}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${formData.priority === (priority === 'Med' ? 'Medium' : priority)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                            >
                                                {priority}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col h-full">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                                        <div className="relative mt-auto">
                                            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-8 pr-2 focus:ring-2 focus:ring-blue-500"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                                        <div className="relative mt-auto">
                                            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-8 pr-2 focus:ring-2 focus:ring-blue-500"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Estimated Time */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Est. Time (Mins)</label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-2 pl-8 pr-3 focus:ring-2 focus:ring-blue-500"
                                            value={formData.estimatedTime || ''}
                                            onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Time Tracking */}
                                <div className="border-t border-slate-700/50 my-2 pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Tracking</label>
                                        <button
                                            type="button"
                                            onClick={handleToggleTimer}
                                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${timerState.isRunning
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                }`}
                                        >
                                            {timerState.isRunning
                                                ? <Square size={12} fill="currentColor" />
                                                : <Play size={12} fill="currentColor" />}
                                            {timerState.isRunning ? formatElapsedTime(timerState.elapsed) : 'Start Timer'}
                                        </button>
                                    </div>
                                    <div className="space-y-2 mt-2">
                                        {formData.timeEntries.length > 0 ? (
                                            <div className="flex justify-between items-center text-sm font-semibold text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                                                <span>Total Logged:</span>
                                                <span className="text-blue-400">
                                                    {formData.timeEntries.reduce((acc, curr) => acc + (curr.duration || 0), 0)} mins
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 italic">No time logged yet.</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleAddTimeEntry}
                                            className="w-full py-1.5 text-xs text-slate-400 border border-dashed border-slate-600 rounded hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800 transition-colors"
                                        >
                                            + Add Manual Entry
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Fields */}
                                {project?.fieldDefinitions?.length > 0 && (
                                    <div className="border-t border-slate-700/50 my-2 pt-2">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom Fields</div>
                                        <div className="space-y-3">
                                            {project.fieldDefinitions.map(field => (
                                                <div key={field.id}>
                                                    <label className="text-xs font-medium text-slate-400 mb-1 block">{field.name}</label>
                                                    {field.type === 'dropdown' ? (
                                                        <select
                                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-1.5 px-2 focus:ring-2 focus:ring-blue-500"
                                                            value={formData.customFields[field.id] || ''}
                                                            onChange={(e) => setFormData({ ...formData, customFields: { ...formData.customFields, [field.id]: e.target.value } })}
                                                        >
                                                            <option value="">Select...</option>
                                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : field.type === 'boolean' ? (
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                                            checked={!!formData.customFields[field.id]}
                                                            onChange={(e) => setFormData({ ...formData, customFields: { ...formData.customFields, [field.id]: e.target.checked } })}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                            className="w-full bg-slate-700 border-none rounded-lg text-sm text-white py-1.5 px-2 focus:ring-2 focus:ring-blue-500"
                                                            value={formData.customFields[field.id] || ''}
                                                            onChange={(e) => setFormData({ ...formData, customFields: { ...formData.customFields, [field.id]: field.type === 'number' ? Number(e.target.value) : e.target.value } })}
                                                            style={field.type === 'date' ? { colorScheme: 'dark' } : {}}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timestamps */}
                            <div className="pt-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock size={12} />
                                    <span>Created {createdAtStr} by {user?.name || 'You'}</span>
                                </div>
                                {updatedAtStr && <div>Last updated {updatedAtStr}</div>}
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
                        <Trash2 size={16} /> Delete Task
                    </button>
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
        </div >
    );
};

export default TaskDetailModal;