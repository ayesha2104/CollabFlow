import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

// Generate consistent color from name
const getAvatarColor = (name) => {
    const colors = [
        'from-blue-500 to-indigo-500',
        'from-purple-500 to-pink-500',
        'from-green-500 to-teal-500',
        'from-orange-500 to-red-500',
        'from-cyan-500 to-blue-500',
        'from-yellow-500 to-orange-500',
        'from-pink-500 to-rose-500'
    ];

    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

// Get initials from name
const getInitials = (name) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};




const UserAvatar = ({ user, size = 'default', showStatus = true }) => {
    const sizeClasses = {
        small: 'w-6 h-6 text-[10px]',
        default: 'w-8 h-8 text-xs',
        large: 'w-10 h-10 text-sm'
    };

    const statusColors = {
        active: 'bg-green-500',
        idle: 'bg-yellow-500',
        offline: 'bg-slate-500'
    };

    return (
        <div className="relative group">
            <div
                className={`
                    ${sizeClasses[size]} 
                    rounded-full 
                    bg-gradient-to-tr ${getAvatarColor(user.name)} 
                    flex items-center justify-center 
                    font-bold text-white 
                    border-2 border-slate-800 
                    cursor-pointer
                    transition-transform hover:scale-110
                `}
                title={user.name}
            >
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    getInitials(user.name)
                )}
            </div>

            {showStatus && (
                <span
                    className={`
                        absolute bottom-0 right-0 
                        w-2.5 h-2.5 
                        ${statusColors[user.status || 'active']} 
                        rounded-full 
                        border-2 border-slate-800
                    `}
                />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {user.name}
                {user.status === 'idle' && ' (idle)'}
            </div>
        </div>
    );
};

const ActiveUsers = ({ projectId, maxDisplay = 3, onUserClick }) => {
    const [users, setUsers] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch active users
    useEffect(() => {
        // Real implementation to be connected to socket context
        setUsers([]);
    }, [projectId]);

    const displayedUsers = isExpanded ? users : users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    if (users.length === 0) {
        return (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Users size={16} />
                <span>No active users</span>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {displayedUsers.map(user => (
                    <UserAvatar
                        key={user.id}
                        user={user}
                        onClick={() => onUserClick && onUserClick(user)}
                    />
                ))}

                {!isExpanded && remainingCount > 0 && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white hover:bg-slate-600 transition-colors"
                        title={`${remainingCount} more users`}
                    >
                        +{remainingCount}
                    </button>
                )}
            </div>

            {/* Expanded panel */}
            {isExpanded && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="ml-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                    Show less
                </button>
            )}
        </div>
    );
};

// Compact version for header
export const ActiveUsersCompact = ({ users = [], maxDisplay = 3 }) => {
    const displayedUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    return (
        <div className="flex -space-x-2">
            {displayedUsers.map(user => (
                <div
                    key={user.id}
                    className={`
                        w-8 h-8 
                        rounded-full 
                        bg-gradient-to-tr ${getAvatarColor(user.name)} 
                        flex items-center justify-center 
                        text-xs font-bold text-white 
                        border-2 border-slate-800
                    `}
                    title={user.name}
                >
                    {getInitials(user.name)}
                </div>
            ))}

            {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white">
                    +{remainingCount}
                </div>
            )}
        </div>
    );
};

// User presence indicator for task cards
export const UserPresenceIndicator = ({ user, isEditing = false }) => {
    if (!user) return null;

    return (
        <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
            ${isEditing ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}
        `}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>{user.name} {isEditing ? 'is editing...' : 'is viewing'}</span>
        </div>
    );
};

export default ActiveUsers;
