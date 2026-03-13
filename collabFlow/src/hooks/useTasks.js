import { useState, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useSocket, useTaskEvents } from './useSocket';
import {
    extractResponseData,
    transformTaskFromBackend,
    transformTaskToBackend,
    toBackendStatus,
    toFrontendStatus
} from '../utils/apiHelpers';
import config from '../config';

// Flag to toggle between mock and real API
// Flag to toggle between mock and real API
// const USE_MOCK_API = config.USE_MOCK_API; // Removed

export const useTasks = (projectId) => {
    const [tasks, setTasks] = useState({});
    const [columns, setColumns] = useState({});
    const [columnOrder, setColumnOrder] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitTaskMoved } = useSocket();

    // Handle external task updates (from socket events)
    const handleExternalTaskCreated = useCallback((data) => {
        const { task, projectId: eventProjectId } = data;
        if (eventProjectId !== projectId) return;

        // Transform task from backend format
        const transformedTask = transformTaskFromBackend(task);

        setTasks(prev => ({ ...prev, [transformedTask.id]: transformedTask }));
        setColumns(prev => {
            const columnId = Object.keys(prev).find(
                colId => prev[colId].title === transformedTask.status
            ) || 'col-1';

            return {
                ...prev,
                [columnId]: {
                    ...prev[columnId],
                    taskIds: [...prev[columnId].taskIds, transformedTask.id]
                }
            };
        });

        toast.info(`New task created: ${transformedTask.title}`);
    }, [projectId]);

    const handleExternalTaskUpdated = useCallback((data) => {
        const { taskId, updates, projectId: eventProjectId } = data;
        if (eventProjectId !== projectId) return;

        // Transform updates from backend format
        const transformedUpdates = { ...updates };
        if (updates.status) {
            transformedUpdates.status = toFrontendStatus(updates.status);
        }
        if (updates.priority) {
            transformedUpdates.priority = updates.priority.charAt(0).toUpperCase() + updates.priority.slice(1);
        }

        setTasks(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId], ...transformedUpdates }
        }));
    }, [projectId]);

    const handleExternalTaskDeleted = useCallback((data) => {
        const { taskId, projectId: eventProjectId } = data;
        if (eventProjectId !== projectId) return;

        setTasks(prev => {
            const newTasks = { ...prev };
            delete newTasks[taskId];
            return newTasks;
        });

        setColumns(prev => {
            const newColumns = { ...prev };
            Object.keys(newColumns).forEach(colId => {
                newColumns[colId] = {
                    ...newColumns[colId],
                    taskIds: newColumns[colId].taskIds.filter(id => id !== taskId)
                };
            });
            return newColumns;
        });
    }, [projectId]);

    const handleExternalTaskMoved = useCallback((data) => {
        const { taskId, oldStatus, newStatus, projectId: eventProjectId } = data;
        if (eventProjectId !== projectId) return;

        // Convert backend status to frontend format for matching
        const frontendOldStatus = toFrontendStatus(oldStatus);
        const frontendNewStatus = toFrontendStatus(newStatus);

        setColumns(prev => {
            const sourceColId = Object.keys(prev).find(
                colId => prev[colId].title === frontendOldStatus
            );
            const destColId = Object.keys(prev).find(
                colId => prev[colId].title === frontendNewStatus
            );

            if (!sourceColId || !destColId) return prev;

            const newColumns = { ...prev };
            newColumns[sourceColId] = {
                ...newColumns[sourceColId],
                taskIds: newColumns[sourceColId].taskIds.filter(id => id !== taskId)
            };
            newColumns[destColId] = {
                ...newColumns[destColId],
                taskIds: [...newColumns[destColId].taskIds, taskId]
            };
            return newColumns;
        });

        setTasks(prev => {
            if (!prev[taskId]) return prev;
            return {
                ...prev,
                [taskId]: { ...prev[taskId], status: frontendNewStatus }
            };
        });
    }, [projectId]);

    // Subscribe to task events
    useTaskEvents({
        onTaskCreated: handleExternalTaskCreated,
        onTaskUpdated: handleExternalTaskUpdated,
        onTaskMoved: handleExternalTaskMoved,
        onTaskDeleted: handleExternalTaskDeleted
    });

    // Initialize predefined or dynamic board structure
    const initializeBoard = useCallback((projectColumns = []) => {
        if (!projectColumns || projectColumns.length === 0) {
            const defaultColumns = {
                'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
                'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
                'col-3': { id: 'col-3', title: 'Done', taskIds: [] }
            };
            setColumns(defaultColumns);
            setColumnOrder(['col-1', 'col-2', 'col-3']);
            return;
        }

        const cols = {};
        const colOrder = [];

        projectColumns.forEach(pc => {
            cols[pc.id] = { id: pc.id, title: pc.title, taskIds: [] };
            colOrder.push(pc.id);
        });

        setColumns(cols);
        setColumnOrder(colOrder);
    }, []);

    // Fetch tasks for a project
    const fetchTasks = useCallback(async (projectIdOverride, projectColumns = []) => {
        const id = projectIdOverride || projectId;
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            // Real API call - fetch tasks directly
            const response = await tasksAPI.getByProject(id);
            const tasksData = extractResponseData(response);

            const tasksArray = Array.isArray(tasksData) ? tasksData : [];
            // Sort tasks by order before distributing into columns
            tasksArray.sort((a, b) => (a.order || 0) - (b.order || 0));

            const transformedTasks = {};
            
            // Re-initialize correct columns
            let cols = {};
            let colOrder = [];
            if (projectColumns && projectColumns.length > 0) {
                projectColumns.forEach(pc => {
                    cols[pc.id] = { id: pc.id, title: pc.title, taskIds: [] };
                    colOrder.push(pc.id);
                });
            } else {
                cols = {
                    'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
                    'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
                    'col-3': { id: 'col-3', title: 'Done', taskIds: [] }
                };
                colOrder = ['col-1', 'col-2', 'col-3'];
            }

            tasksArray.forEach(task => {
                const transformed = transformTaskFromBackend(task);
                transformedTasks[transformed.id] = transformed;

                // Find matching column by title or id
                const colId = Object.keys(cols).find(cid => cols[cid].title === transformed.status || cid === transformed.status) || colOrder[0];
                if (colId && cols[colId]) {
                    cols[colId].taskIds.push(transformed.id);
                }
            });

            setTasks(transformedTasks);
            setColumns(cols);
            setColumnOrder(colOrder);

        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch tasks';
            setError(errorMessage);
            toast.error(errorMessage);
            initializeBoard();
        } finally {
            setIsLoading(false);
        }
    }, [projectId, initializeBoard]);

    // Save tasks to storage (mock) or API (real)
    const saveTasks = useCallback(async (newTasks, newColumns, id) => {
        const targetProjectId = id || projectId;

        // In real API, tasks are saved individually, so this might not be needed
        // Or you could have a bulk update endpoint
        // For now, we'll rely on individual task API calls
    }, [projectId, columnOrder]);

    // Create task
    const createTask = useCallback(async (columnId, taskData = {}) => {
        const status = columns[columnId]?.title || 'To Do';
        const newTaskData = {
            projectId,
            title: taskData.title || 'New Task',
            description: taskData.description || '',
            priority: taskData.priority || 'Medium',
            assignee: taskData.assignee || '',
            dueDate: taskData.dueDate || '',
            status
        };

        try {
            // Transform to backend format before sending
            const backendTaskData = transformTaskToBackend(newTaskData);

            // Real API call
            const response = await tasksAPI.create(backendTaskData);
            const responseData = extractResponseData(response);
            const newTask = transformTaskFromBackend(responseData);

            const newTasks = { ...tasks, [newTask.id]: newTask };
            const newColumns = {
                ...columns,
                [columnId]: {
                    ...columns[columnId],
                    taskIds: [...columns[columnId].taskIds, newTask.id]
                }
            };

            setTasks(newTasks);
            setColumns(newColumns);

            // Note: Backend will broadcast task:created via Socket.io
            return newTask;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create task';
            toast.error(errorMessage);
            throw err;
        }
    }, [tasks, columns, projectId, saveTasks, emitTaskCreated]);

    // Update task
    const updateTask = useCallback(async (taskId, updates) => {
        if (!tasks[taskId]) return null;

        try {
            // Transform updates to backend format
            const backendUpdates = transformTaskToBackend(updates);

            // Real API call
            const response = await tasksAPI.update(taskId, backendUpdates);
            const taskData = extractResponseData(response);
            const updatedTask = transformTaskFromBackend(taskData);

            const newTasks = { ...tasks, [taskId]: updatedTask };
            setTasks(newTasks);

            // Note: Backend will broadcast task:updated via Socket.io
            return updatedTask;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update task';
            toast.error(errorMessage);
            throw err;
        }
    }, [tasks, columns, projectId, saveTasks, emitTaskUpdated]);

    // Delete task
    const deleteTask = useCallback(async (taskId) => {
        try {
            // Real API call
            await tasksAPI.delete(taskId);

            const newTasks = { ...tasks };
            delete newTasks[taskId];

            const newColumns = { ...columns };
            Object.keys(newColumns).forEach(colId => {
                newColumns[colId] = {
                    ...newColumns[colId],
                    taskIds: newColumns[colId].taskIds.filter(id => id !== taskId)
                };
            });

            setTasks(newTasks);
            setColumns(newColumns);

            emitTaskDeleted(taskId, projectId);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete task';
            toast.error(errorMessage);
            throw err;
        }
    }, [tasks, columns, projectId, saveTasks, emitTaskDeleted]);

    // Move task (for drag and drop)
    const moveTask = useCallback(async (taskId, sourceColId, destColId, sourceIndex, destIndex) => {
        const sourceColumn = columns[sourceColId];
        const destColumn = columns[destColId];

        try {
            // Same column reorder
            if (sourceColId === destColId) {
                const newTaskIds = Array.from(sourceColumn.taskIds);
                newTaskIds.splice(sourceIndex, 1);
                newTaskIds.splice(destIndex, 0, taskId);

                const newColumns = {
                    ...columns,
                    [sourceColId]: { ...sourceColumn, taskIds: newTaskIds }
                };
                setColumns(newColumns);

                // Prepare reorder items
                const status = destColumn.title;
                const backendStatus = toBackendStatus(status);
                const items = newTaskIds.map((id, index) => ({ id, status: backendStatus, order: index }));

                // Call reorder API
                await tasksAPI.reorder(projectId, items);

            } else {
                // Moving between columns
                const frontendStatus = destColumn.title;
                const backendStatus = toBackendStatus(frontendStatus);

                const sourceTaskIds = Array.from(sourceColumn.taskIds);
                sourceTaskIds.splice(sourceIndex, 1);

                const destTaskIds = Array.from(destColumn.taskIds);
                destTaskIds.splice(destIndex, 0, taskId);

                const updatedTask = { ...tasks[taskId], status: frontendStatus };
                const newTasks = { ...tasks, [taskId]: updatedTask };

                const newColumns = {
                    ...columns,
                    [sourceColId]: { ...sourceColumn, taskIds: sourceTaskIds },
                    [destColId]: { ...destColumn, taskIds: destTaskIds }
                };

                setTasks(newTasks);
                setColumns(newColumns);

                // Prepare reorder items for both columns
                const sourceBackendStatus = toBackendStatus(sourceColumn.title);
                const sourceItems = sourceTaskIds.map((id, index) => ({ id, status: sourceBackendStatus, order: index }));
                const destItems = destTaskIds.map((id, index) => ({ id, status: backendStatus, order: index }));
                const items = [...sourceItems, ...destItems];

                // Call reorder API
                await tasksAPI.reorder(projectId, items);

                // Emit socket event for compatibility or other clients (though reorder handles the DB updates)
                emitTaskMoved(taskId, sourceBackendStatus, backendStatus, projectId);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to move task';
            toast.error(errorMessage);
            // On failure, we should ideally revert state
            throw err;
        }
    }, [tasks, columns, projectId, emitTaskMoved]);

    // Add Comment
    const addComment = useCallback(async (taskId, text) => {
        try {
            const response = await tasksAPI.addComment(taskId, text);
            // Handling varied backend response structure based on extractResponseData
            const responseData = response.data?.data || response.data || {};
            const comment = Array.isArray(responseData) ? responseData[0] : responseData;
            
            setTasks(prev => {
                const task = prev[taskId];
                if (!task) return prev;
                return {
                    ...prev,
                    [taskId]: {
                        ...task,
                        comments: [...(task.comments || []), comment]
                    }
                };
            });
            return comment;
        } catch (err) {
            toast.error('Failed to add comment');
            throw err;
        }
    }, []);

    // Remove Comment
    const removeComment = useCallback(async (taskId, commentId) => {
        try {
            await tasksAPI.removeComment(taskId, commentId);
            
            setTasks(prev => {
                const task = prev[taskId];
                if (!task) return prev;
                return {
                    ...prev,
                    [taskId]: {
                        ...task,
                        comments: (task.comments || []).filter(c => c._id !== commentId && c.id !== commentId)
                    }
                };
            });
        } catch (err) {
            toast.error('Failed to remove comment');
            throw err;
        }
    }, []);

    // Add Attachment
    const addAttachment = useCallback(async (taskId, attachmentData) => {
        try {
            const response = await tasksAPI.addAttachment(taskId, attachmentData);
            const responseData = response.data?.data || response.data || {};
            const attachment = Array.isArray(responseData) ? responseData[0] : responseData;
            
            setTasks(prev => {
                const task = prev[taskId];
                if (!task) return prev;
                return {
                    ...prev,
                    [taskId]: {
                        ...task,
                        attachments: [...(task.attachments || []), attachment]
                    }
                };
            });
            return attachment;
        } catch (err) {
            toast.error('Failed to add attachment');
            throw err;
        }
    }, []);

    return {
        tasks,
        columns,
        columnOrder,
        isLoading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        setColumnOrder,
        addComment,
        removeComment,
        addAttachment
    };
};

export default useTasks;
