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

    // Initialize default board structure
    const initializeBoard = useCallback(() => {
        const defaultColumns = {
            'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
            'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
            'col-3': { id: 'col-3', title: 'Done', taskIds: [] }
        };

        setColumns(defaultColumns);
        setColumnOrder(['col-1', 'col-2', 'col-3']);
    }, []);

    // Fetch tasks for a project
    const fetchTasks = useCallback(async (projectIdOverride) => {
        const id = projectIdOverride || projectId;
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            // Real API call - fetch tasks directly
            const response = await tasksAPI.getByProject(id);
            // extractResponseData returns res.data.data found in extractResponseData helper usually
            const tasksData = extractResponseData(response);

            console.log('[useTasks] Fetched tasks data:', tasksData);

            // tasksData should be an array of tasks based on getTasksByProject controller

            const tasksArray = Array.isArray(tasksData) ? tasksData : [];

            const transformedTasks = {};
            const col1Ids = [];
            const col2Ids = [];
            const col3Ids = [];

            tasksArray.forEach(task => {
                const transformed = transformTaskFromBackend(task);
                transformedTasks[transformed.id] = transformed;

                // Map status to columns
                if (transformed.status === 'In Progress') col2Ids.push(transformed.id);
                else if (transformed.status === 'Done') col3Ids.push(transformed.id);
                else col1Ids.push(transformed.id);
            });

            const defaultColumns = {
                'col-1': { id: 'col-1', title: 'To Do', taskIds: col1Ids },
                'col-2': { id: 'col-2', title: 'In Progress', taskIds: col2Ids },
                'col-3': { id: 'col-3', title: 'Done', taskIds: col3Ids }
            };

            setTasks(transformedTasks);
            setColumns(defaultColumns);
            setColumnOrder(['col-1', 'col-2', 'col-3']);

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
            const taskData = extractResponseData(response);
            const newTask = transformTaskFromBackend(taskData);

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
                // Note: Real API might not support same-column reorder yet if it relies solely on status
            } else {
                // Moving between columns - update status via API
                const frontendStatus = destColumn.title;
                const backendStatus = toBackendStatus(frontendStatus);

                // Real API call to update task status
                await tasksAPI.move(taskId, backendStatus);

                const sourceTaskIds = Array.from(sourceColumn.taskIds);
                sourceTaskIds.splice(sourceIndex, 1);

                const destTaskIds = Array.from(destColumn.taskIds);
                destTaskIds.splice(destIndex, 0, taskId);

                // Update task status (keep frontend format)
                const updatedTask = { ...tasks[taskId], status: frontendStatus };
                const newTasks = { ...tasks, [taskId]: updatedTask };

                const newColumns = {
                    ...columns,
                    [sourceColId]: { ...sourceColumn, taskIds: sourceTaskIds },
                    [destColId]: { ...destColumn, taskIds: destTaskIds }
                };

                setTasks(newTasks);
                setColumns(newColumns);

                // Emit socket event (backend expects backend format)
                emitTaskMoved(taskId, toBackendStatus(sourceColumn.title), toBackendStatus(destColumn.title), projectId);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to move task';
            toast.error(errorMessage);
            throw err;
        }
    }, [tasks, columns, projectId, saveTasks, emitTaskMoved]);

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
        moveTask
    };
};

export default useTasks;
