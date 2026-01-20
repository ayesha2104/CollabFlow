import React from 'react';
import { Users, MoreHorizontal, Calendar, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
    const navigate = useNavigate();

    // Mock data fallback if props are missing
    const {
        id = 1,
        name = "Project Name",
        description = "No description provided.",
        taskCount = 0,
        activeTaskCount = 0,
        members = [], // Array of user objects or numbers
        updatedAt = "2h ago"
    } = project || {};

    return (
        <div
            // onClick={() => navigate(`/project/${id}`)}
            className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
        >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
                            <Folder size={20} />
                        </div>
                        <button className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-200 transition-colors line-clamp-1">
                        {name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
                        {description}
                    </p>
                </div>

                <div>
                    {/* Progress Bar (Mock) */}
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${Math.random() * 60 + 20}%` }}
                        ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(3, members.length || 1))].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-600 border border-slate-800 flex items-center justify-center text-[10px] text-white">
                                        {["A", "B", "C"][i]}
                                    </div>
                                ))}
                                {(members.length > 3) && (
                                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[10px] text-white">
                                        +{members.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{taskCount} Tasks</span>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>Updated {updatedAt}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
