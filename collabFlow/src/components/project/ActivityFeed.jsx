import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Plus, Edit3, Trash2, ArrowRight, User, Clock, ChevronDown } from 'lucide-react';
import { formatActivityTime } from '../../utils/dateHelpers';
import { useActivityEvents } from '../../hooks/useSocket';

// Activity type icons and colors
const activityConfig = {
    'task_created': {
        icon: Plus,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        verb: 'created'
    },
    'task_updated': {
        icon: Edit3,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        verb: 'updated'
    },
    'task_moved': {
        icon: ArrowRight,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        verb: 'moved'
    },
    'task_deleted': {
        icon: Trash2,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        verb: 'deleted'
    },
    'task_assigned': {
        icon: User,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        verb: 'assigned'
    }
};

// Mock activities removed


const ActivityItem = ({ activity }) => {
    const config = activityConfig[activity.type] || activityConfig.task_updated;
    const Icon = config.icon;

    const getActivityText = () => {
        const { user, task, details, metadata, action } = activity;
        const userName = <span className="font-medium text-white">{user?.name || 'Someone'}</span>;
        const taskTitle = <span className="font-medium text-slate-200">"{task?.title || metadata?.taskTitle || 'a task'}"</span>;

        // Action can come from 'type' (frontend mock) or 'action' (backend)
        const activityType = activity.type || activity.action;

        switch (activityType) {
            case 'task_created':
                return <>{userName} created {taskTitle}</>;

            case 'task_moved':
                const fromStatus = details?.from || metadata?.oldStatus;
                const toStatus = details?.to || metadata?.newStatus;
                return (
                    <>
                        {userName} moved {taskTitle}
                        {toStatus && (
                            <>
                                {' to '}
                                <span className="text-blue-400 font-medium">{toStatus}</span>
                            </>
                        )}
                    </>
                );

            case 'task_updated':
                const changes = metadata?.changes;
                if (changes && Object.keys(changes).length > 0) {
                    const changedFields = Object.keys(changes);
                    const field = changedFields[0]; // Show the first change for brevity
                    const { old: oldValue, new: newValue } = changes[field];

                    // Format some common fields for better readability
                    const displayField = field.charAt(0).toUpperCase() + field.slice(1);

                    return (
                        <>
                            {userName} updated <span className="text-slate-400">{field}</span> of {taskTitle}
                            {newValue !== undefined && (
                                <>
                                    {' to '}
                                    <span className="text-blue-400 font-medium">{String(newValue)}</span>
                                </>
                            )}
                        </>
                    );
                }
                return <>{userName} updated {taskTitle}</>;

            case 'task_assigned':
                const assignee = details?.assignee || (metadata?.changes?.assignee?.new);
                return (
                    <>
                        {userName} assigned {taskTitle}
                        {assignee && (
                            <>
                                {' to '}
                                <span className="font-medium text-blue-400">{assignee}</span>
                            </>
                        )}
                    </>
                );

            case 'task_deleted':
                return <>{userName} deleted {taskTitle}</>;

            default:
                return <>{userName} performed an action on {taskTitle}</>;
        }
    };

    return (
        <div className="flex gap-3 p-3 hover:bg-slate-800/30 rounded-lg transition-colors">
            <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-relaxed">
                    {getActivityText()}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Clock size={10} />
                    <span>{formatActivityTime(activity.timestamp)}</span>
                </div>
            </div>
        </div>
    );
};

const ActivityFeed = ({ projectId, isOpen = true, onToggle }) => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    // Fetch activities
    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);

            try {
                // Real API call
                const { activitiesAPI } = await import('../../services/api');
                const response = await activitiesAPI.getByProject(projectId, { limit: 20 });
                const activitiesData = response.data.activities || response.data.data || [];
                setActivities(activitiesData);
            } catch (error) {
                console.error('Failed to fetch activities:', error);
                setActivities([]);
            }

            setIsLoading(false);
        };

        if (projectId) {
            fetchActivities();
        }
    }, [projectId]);

    // Add new activity
    const addActivity = useCallback((data) => {
        const activity = data.activity || data;
        setActivities(prev => [activity, ...prev].slice(0, 20));
    }, []);

    // Subscribe to real-time activity events
    useActivityEvents(addActivity);

    const loadMore = async () => {
        // Load more implementation to be added
        setHasMore(false);
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 bg-slate-800/50 border-l border-white/5 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-slate-400" />
                    <h3 className="font-semibold text-white">Activity</h3>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <ChevronDown size={18} />
                    </button>
                )}
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-slate-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                                    <div className="h-3 bg-slate-700/50 rounded w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-8 text-center">
                        <Activity size={32} className="text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No activity yet</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {activities.map((activity, index) => (
                            <ActivityItem key={activity._id || activity.id || `activity-${index}`} activity={activity} />
                        ))}

                        {hasMore && (
                            <button
                                onClick={loadMore}
                                className="w-full py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                            >
                                Load more
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
