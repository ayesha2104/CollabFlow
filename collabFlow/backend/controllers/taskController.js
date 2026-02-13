const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { TASK_STATUS, PRIORITY_LEVELS } = require('../config/constants');

// Helper to check project membership
const isProjectMember = (project, userId) => {
    return project.members.some(member => member.user.toString() === userId.toString());
};

// @desc    Get tasks by project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Project member)
const getTasksByProject = async (req, res, next) => {
    try {
        console.log(`[getTasksByProject] Fetching tasks for project: ${req.params.projectId} or ${req.params.id}`);
        // req.project is set by isProjectMember middleware
        // Route parameter might be :id or :projectId depending on where it's mounted
        const projectId = req.params.projectId || req.params.id;

        const tasks = await Task.find({ project: projectId })
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .sort({ createdAt: -1 });

        console.log(`[getTasksByProject] Found ${tasks.length} tasks`);

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('[getTasksByProject] Error:', error);
        next(error);
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Project member)
const createTask = async (req, res, next) => {
    try {
        console.log('[createTask] Request body:', req.body);
        const {
            projectId,
            title,
            description,
            status,
            priority,
            assignee,
            dueDate
        } = req.body;

        // Note: isProjectMember middleware can handle the membership check if applied to route
        // For safety/redundancy or if route doesn't use it, we check here
        let project = req.project;
        if (!project) {
            project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }
            if (!isProjectMember(project, req.user._id)) {
                return res.status(403).json({ success: false, error: 'Not a project member' });
            }
        }

        // Validate assignee is a project member
        if (assignee) {
            if (!isProjectMember(project, assignee)) {
                return res.status(400).json({
                    success: false,
                    error: 'Assignee must be a project member'
                });
            }
        }

        // Create task
        const task = await Task.create({
            project: projectId,
            title,
            description,
            status: status || TASK_STATUS.TODO,
            priority: priority || PRIORITY_LEVELS.MEDIUM,
            assignee,
            dueDate,
            createdBy: req.user._id
        });

        console.log('[createTask] Task created:', task._id);

        // Populate task with user info
        const populatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('project', 'name');

        // Log activity
        const activity = await Activity.create({
            project: projectId,
            user: req.user._id,
            action: 'task_created',
            task: task._id,
            metadata: {
                taskTitle: task.title
            }
        });

        // Broadcast real-time update
        req.io.to(projectId.toString()).emit('task:created', {
            task: populatedTask
        });

        req.io.to(projectId.toString()).emit('activity:new', {
            activity: await Activity.findById(activity._id)
                .populate('user', 'name avatar')
        });

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        console.error('[createTask] Error:', error);
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Project member)
const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Validate project membership
        const project = task.project;
        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        // Validate assignee is a project member
        if (req.body.assignee) {
            if (!isProjectMember(project, req.body.assignee)) {
                return res.status(400).json({
                    success: false,
                    error: 'Assignee must be a project member'
                });
            }
        }

        // Track changes for activity log
        const changes = {};

        Object.keys(req.body).forEach(key => {
            // Simple comparison - logic could be more robust for arrays/dates
            if (task[key] !== req.body[key] && req.body[key] !== undefined) {
                // Skip if checking string vs objectId mismatch unless we convert
                if (key === 'assignee' && task.assignee && task.assignee.toString() === req.body.assignee) return;

                changes[key] = {
                    old: task[key],
                    new: req.body[key]
                };
            }
        });

        // Update task
        Object.assign(task, req.body);
        task.updatedAt = Date.now();
        await task.save();

        // Populate updated task
        const updatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('project', 'name');

        // Log activity
        const activity = await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'task_updated',
            task: task._id,
            metadata: {
                taskTitle: task.title,
                changes: changes
            }
        });

        // Broadcast real-time update
        req.io.to(project._id.toString()).emit('task:updated', {
            taskId: task._id,
            updates: req.body
        });

        req.io.to(project._id.toString()).emit('activity:new', {
            activity: await Activity.findById(activity._id)
                .populate('user', 'name avatar')
        });

        res.status(200).json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project member)
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Validate project membership
        const project = await Project.findById(task.project);
        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        const taskTitle = task.title;
        const projectId = task.project;

        // Delete task
        await task.deleteOne();

        // Log activity
        const activity = await Activity.create({
            project: projectId,
            user: req.user._id,
            action: 'task_deleted',
            metadata: {
                taskTitle: taskTitle
            }
        });

        // Broadcast real-time update
        req.io.to(projectId.toString()).emit('task:deleted', {
            taskId: task._id
        });

        req.io.to(projectId.toString()).emit('activity:new', {
            activity: await Activity.findById(activity._id)
                .populate('user', 'name avatar')
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Move task (drag & drop)
// @route   PATCH /api/tasks/:id/move
// @access  Private (Project member)
const moveTask = async (req, res, next) => {
    try {
        const { newStatus } = req.body;

        // Note: Validation of newStatus is handled by express-validator in routes

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Validate project membership
        const project = await Project.findById(task.project);
        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        const oldStatus = task.status;

        // Update task status
        task.status = newStatus;
        task.updatedAt = Date.now();
        await task.save();

        // Populate updated task
        const updatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar');

        // Log activity
        const activity = await Activity.create({
            project: task.project,
            user: req.user._id,
            action: 'task_moved',
            task: task._id,
            metadata: {
                taskTitle: task.title,
                oldStatus,
                newStatus
            }
        });

        // Broadcast real-time update
        req.io.to(task.project.toString()).emit('task:moved', {
            taskId: task._id,
            oldStatus,
            newStatus
        });

        req.io.to(task.project.toString()).emit('activity:new', {
            activity: await Activity.findById(activity._id)
                .populate('user', 'name avatar')
        });

        res.status(200).json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByProject
};