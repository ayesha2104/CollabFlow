import React from 'react';
import { MoreHorizontal, Calendar, Folder, PenTool, Megaphone, Smartphone, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project, variant = 'grid' }) => {
    const navigate = useNavigate();

    // Mock data fallback if props are missing
    const {
        id,
        name,
        description,
        taskCount,
        activeTaskCount,
        members,
        updatedAt,
        status,
        icon
    } = project || {};

    const handleClick = () => {
        navigate(`/project/${id}`);
    };

    // Get member initials
    const getMemberInitials = (member, index) => {
        if (typeof member === 'object' && member.name) {
            return member.name.charAt(0).toUpperCase();
        }
        return ['A', 'B', 'C', 'D'][index % 4];
    };

    // Calculate progress (mock based on tasks)
    // Calculate progress
    const progressPercentage = project?.progress || 0;

    // Status badge config
    const statusConfig = {
        on_track: { label: 'ON TRACK', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
        high_priority: { label: 'HIGH PRIORITY', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        planning: { label: 'PLANNING', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };

    // Icon config
    const iconConfig = {
        folder: { icon: Folder, color: 'bg-blue-500/10 text-blue-400' },
        pen: { icon: PenTool, color: 'bg-blue-500/10 text-blue-400' },
        megaphone: { icon: Megaphone, color: 'bg-orange-500/10 text-orange-400' },
        smartphone: { icon: Smartphone, color: 'bg-purple-500/10 text-purple-400' },
        file: { icon: FileText, color: 'bg-indigo-500/10 text-indigo-400' }
    };

    const IconComponent = iconConfig[icon]?.icon || Folder;
    const iconColor = iconConfig[icon]?.color || iconConfig.folder.color;
    const statusInfo = statusConfig[status] || statusConfig.on_track;
    const isListView = variant === 'list';
    const projectMembers = Array.isArray(members) ? members : [];
    const visibleMembers = projectMembers.slice(0, 3);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`w-full text-left group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden ${isListView ? 'p-4' : 'p-5'}`}
        >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className={`relative z-10 ${isListView ? 'flex items-center gap-4' : 'flex flex-col h-full justify-between'}`}>
                <div className={isListView ? 'flex items-center gap-4 flex-1 min-w-0' : ''}>
                    <div className={`p-4  rounded-lg group-hover:opacity-80 transition-colors shrink-0 relative left-[-10px] top-[-2px] `}>
                        <IconComponent size={20} />
                    </div>

                    <div className={isListView ? 'flex-1 min-w-0' : ''}>
                        <div className={`flex ${isListView ? 'items-start gap-3 mb-2' : 'justify-between items-start mb-3'}`}>
                            <div className="min-w-0 flex-1">
                                <h3 className={`${isListView ? 'text-base' : 'text-lg'} font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors line-clamp-1`}>
                                    {name}
                                </h3>
                                <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">
                                    {description}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
                                >
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={isListView ? 'grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3' : ''}>
                            <div className="text-xs text-slate-400 relative top-[-12px]">
                                {taskCount} Tasks • {activeTaskCount || Math.floor(taskCount * 0.3)} Active
                            </div>

                            <div className={isListView ? 'sm:col-span-2' : ''}>
                                <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-500">{Math.round(progressPercentage)}%</div>
                            </div>

                            <div className="flex items-center justify-between gap-3 col-span-full">
                                <div className="flex -space-x-2">
                                    {visibleMembers.map((member, i) => (
                                        <div
                                            key={member?.id || member?.name || member?.email || `member-${member?.avatar || 'unknown'}`}
                                            className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border-2 border-slate-800 flex items-center justify-center text-[10px] text-white font-medium"
                                        >
                                            {getMemberInitials(member, i)}
                                        </div>
                                    ))}
                                    {(projectMembers.length > 3) && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-slate-800 flex items-center justify-center text-[10px] text-white font-medium">
                                            +{projectMembers.length - 3}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <Calendar size={12} />
                                    <span>Updated {updatedAt}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ProjectCard;
