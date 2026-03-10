/**
 * Utility functions to convert between frontend display format and backend API format
 */

// Status mapping: Frontend Display ↔ Backend API
export const STATUS_MAP = {
    // Frontend → Backend
    'To Do': 'todo',
    'In Progress': 'in_progress',
    'Done': 'done',
    // Backend → Frontend
    'todo': 'To Do',
    'in_progress': 'In Progress',
    'done': 'Done'
};

// Priority mapping: Frontend Display ↔ Backend API
export const PRIORITY_MAP = {
    // Frontend → Backend
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    // Backend → Frontend
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High'
};

/**
 * Convert frontend status to backend format
 */
export const toBackendStatus = (frontendStatus) => {
    return STATUS_MAP[frontendStatus] || frontendStatus;
};

/**
 * Convert backend status to frontend display format
 */
export const toFrontendStatus = (backendStatus) => {
    return STATUS_MAP[backendStatus] || backendStatus;
};

/**
 * Convert frontend priority to backend format
 */
export const toBackendPriority = (frontendPriority) => {
    return PRIORITY_MAP[frontendPriority] || frontendPriority.toLowerCase();
};

/**
 * Convert backend priority to frontend display format
 */
export const toFrontendPriority = (backendPriority) => {
    return PRIORITY_MAP[backendPriority] || backendPriority.charAt(0).toUpperCase() + backendPriority.slice(1);
};

/**
 * Transform task from backend format to frontend format
 */
export const transformTaskFromBackend = (backendTask) => {
    return {
        ...backendTask,
        id: backendTask._id || backendTask.id,
        status: toFrontendStatus(backendTask.status || 'todo'),
        priority: toFrontendPriority(backendTask.priority || 'medium'),
        assignee: backendTask.assignee?.name || backendTask.assignee || '',
        dueDate: backendTask.dueDate ? new Date(backendTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
    };
};

export const transformTaskToBackend = (frontendTask) => {
    const backendTask = {
        ...frontendTask,
        status: toBackendStatus(frontendTask.status || 'To Do'),
        priority: toBackendPriority(frontendTask.priority || 'Medium'),
        order: frontendTask.order !== undefined ? frontendTask.order : 0
    };

    // Remove empty optional strings to avoid backend validation failures (e.g., empty dueDate)
    if (!backendTask.assignee) delete backendTask.assignee;
    if (!backendTask.dueDate) delete backendTask.dueDate;
    if (!backendTask.description) delete backendTask.description;

    // Remove frontend-specific fields
    delete backendTask.id; // Backend uses _id

    return backendTask;
};

/**
 * Transform project from backend format to frontend format
 */
export const transformProjectFromBackend = (backendProject) => {
    return {
        ...backendProject,
        id: backendProject._id || backendProject.id,
        members: backendProject.members?.map(m => ({
            id: m.user?._id || m.user || m.id,
            name: m.user?.name || m.name || 'Unknown',
            avatar: m.user?.avatar || m.avatar || null,
            role: m.role || 'member'
        })) || [],
        columns: backendProject.columns?.sort((a, b) => a.order - b.order) || [],
        taskCount: backendProject.taskCount || 0,
        activeTaskCount: backendProject.activeTaskCount || 0,
        progress: backendProject.progress || 0,
        status: backendProject.status || 'planning',
        icon: backendProject.icon || 'folder',
        updatedAt: backendProject.updatedAt ? formatRelativeTime(new Date(backendProject.updatedAt)) : 'Just now'
    };
};

/**
 * Extract data from backend response
 * Handles both { success: true, data: {...} } and { projects: [...] } formats
 */
export const extractResponseData = (response) => {
    if (response.data) {
        // Check if response has success/data structure
        if (response.data.success !== undefined && response.data.data !== undefined) {
            return response.data.data;
        }
        // Check if response has projects array (GET /api/projects)
        if (response.data.projects) {
            return response.data.projects;
        }
        // Check if response has activities array
        if (response.data.activities) {
            return response.data.activities;
        }
        // Otherwise return the data object
        return response.data;
    }
    return response;
};

/**
 * Format relative time (simple version)
 */
const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default {
    STATUS_MAP,
    PRIORITY_MAP,
    toBackendStatus,
    toFrontendStatus,
    toBackendPriority,
    toFrontendPriority,
    transformTaskFromBackend,
    transformTaskToBackend,
    transformProjectFromBackend,
    extractResponseData
};
