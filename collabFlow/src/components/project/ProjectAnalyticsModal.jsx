import React, { useState, useEffect } from 'react';
import { X, BarChart2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { projectsAPI } from '../../services/api';
import { extractResponseData } from '../../utils/apiHelpers';

const ProjectAnalyticsModal = ({ isOpen, onClose, projectId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !projectId) return;

        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await projectsAPI.getAnalytics(projectId);
                setAnalytics(extractResponseData(response));
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [isOpen, projectId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-slate-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart2 className="text-blue-400" size={20} />
                        Project Analytics
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {isLoading || !analytics ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Overview Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 p-4 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-center">
                                    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Tasks</div>
                                    <div className="text-3xl font-bold text-white">{analytics.totalTasks}</div>
                                </div>
                                <div className="bg-blue-500/10 p-4 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center text-center">
                                    <div className="text-blue-400 text-xs uppercase tracking-wider font-semibold mb-1">Completion Rate</div>
                                    <div className="text-3xl font-bold text-blue-400">{analytics.completionRate}%</div>
                                </div>
                                <div className="bg-slate-800/50 p-4 border border-slate-700 rounded-xl flex flex-col items-center justify-center text-center">
                                    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Recent Activities</div>
                                    <div className="text-3xl font-bold text-white">{analytics.recentActivities}</div>
                                </div>
                                <div className="bg-emerald-500/10 p-4 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center text-center">
                                    <div className="text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-1">Done Tasks</div>
                                    <div className="text-3xl font-bold text-emerald-400">{analytics.taskCounts.done}</div>
                                </div>
                            </div>

                            {/* Status and Priority Breakdowns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Task Status */}
                                <div className="bg-slate-800/30 p-5 border border-slate-700 rounded-xl">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-blue-400" />
                                        Task Status
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>To Do</span>
                                                <span>{analytics.taskCounts.todo}</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-slate-400 h-full rounded-full" 
                                                    style={{ width: `${analytics.totalTasks ? (analytics.taskCounts.todo / analytics.totalTasks) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>In Progress</span>
                                                <span>{analytics.taskCounts.inProgress}</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-blue-400 h-full rounded-full" 
                                                    style={{ width: `${analytics.totalTasks ? (analytics.taskCounts.inProgress / analytics.totalTasks) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>Done</span>
                                                <span>{analytics.taskCounts.done}</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-emerald-400 h-full rounded-full" 
                                                    style={{ width: `${analytics.totalTasks ? (analytics.taskCounts.done / analytics.totalTasks) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Task Priority */}
                                <div className="bg-slate-800/30 p-5 border border-slate-700 rounded-xl">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-rose-400" />
                                        Task Priority
                                    </h3>
                                    <div className="flex h-32 items-end justify-center gap-6">
                                        {/* Low */}
                                        <div className="flex flex-col items-center gap-2 w-12 text-center group">
                                            <div className="text-xs font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {analytics.priorityCounts.low}
                                            </div>
                                            <div 
                                                className="w-full bg-slate-600 rounded-t-md transition-all group-hover:bg-slate-500"
                                                style={{ height: `${Math.max((analytics.priorityCounts.low / (analytics.totalTasks || 1)) * 100, 5)}%` }}
                                            ></div>
                                            <div className="text-xs text-slate-500 uppercase">Low</div>
                                        </div>

                                        {/* Medium */}
                                        <div className="flex flex-col items-center gap-2 w-12 text-center group">
                                            <div className="text-xs font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {analytics.priorityCounts.medium}
                                            </div>
                                            <div 
                                                className="w-full bg-blue-600 rounded-t-md transition-all group-hover:bg-blue-500"
                                                style={{ height: `${Math.max((analytics.priorityCounts.medium / (analytics.totalTasks || 1)) * 100, 5)}%` }}
                                            ></div>
                                            <div className="text-xs text-blue-500 uppercase">Med</div>
                                        </div>

                                        {/* High */}
                                        <div className="flex flex-col items-center gap-2 w-12 text-center group">
                                            <div className="text-xs font-semibold text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {analytics.priorityCounts.high}
                                            </div>
                                            <div 
                                                className="w-full bg-rose-600 rounded-t-md transition-all group-hover:bg-rose-500"
                                                style={{ height: `${Math.max((analytics.priorityCounts.high / (analytics.totalTasks || 1)) * 100, 5)}%` }}
                                            ></div>
                                            <div className="text-xs text-rose-500 uppercase">High</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectAnalyticsModal;
