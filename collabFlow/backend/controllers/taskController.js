const logger = require('../utils/logger');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { TASK_STATUS, PRIORITY_LEVELS } = require('../config/constants');
const sendEmail = require('../utils/sendEmail');

// Helper to check project membership
const isProjectMember = (project, userId) => {
    return project.members.some(member => member.user.toString() === userId.toString());
};

// @desc    Get tasks by project
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Project member)
const getTasksByProject = async (req, res, next) => {
    try {
        logger.info(`[getTasksByProject] Fetching tasks for project: ${req.params.projectId} or ${req.params.id}`);
        // req.project is set by isProjectMember middleware
        // Route parameter might be :id or :projectId depending on where it's mounted
        const projectId = req.params.projectId || req.params.id;

        const tasks = await Task.find({ project: projectId })
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .sort({ createdAt: -1 });

        logger.info(`[getTasksByProject] Found ${tasks.length} tasks`);

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        logger.error('[getTasksByProject] Error:', error);
        next(error);
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Project member)
const createTask = async (req, res, next) => {
    try {
        logger.info('[createTask] Request body:', req.body);
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

        const taskStatus = status || TASK_STATUS.TODO;

        // Find highest order in the target column
        const highestOrderTask = await Task.findOne({ project: projectId, status: taskStatus })
            .sort('-order');
        const nextOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

        // Create task
        const task = await Task.create({
            project: projectId,
            title,
            description,
            status: taskStatus,
            priority: priority || PRIORITY_LEVELS.MEDIUM,
            order: nextOrder,
            assignee,
            dueDate,
            createdBy: req.user._id
        });

        logger.info('[createTask] Task created:', task._id);

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

        // Send email notification to assignee
        if (populatedTask.assignee && populatedTask.assignee._id.toString() !== req.user._id.toString()) {
            sendEmail({
                email: populatedTask.assignee.email,
                subject: `New Task Assigned: ${populatedTask.title}`,
                html: `
                    <h2>New Task Assignment</h2>
                    <p>You have been assigned to a new task: <strong>${populatedTask.title}</strong></p>
                    <p>Project: ${populatedTask.project.name}</p>
                    <p>Assigned by: ${populatedTask.createdBy.name}</p>
                    <p>Please log in to CollabFlow to view more details.</p>
                `
            }).catch(err => console.error('Failed to send task assignment email:', err));
        }

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
        logger.error('[createTask] Error:', error);
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

        // Update task with whitelisted fields
        const allowedFields = [
            'title', 'description', 'status', 'priority', 'order', 'assignee', 
            'dueDate', 'startDate', 'estimatedTime', 'customFields', 'subtasks',
            'dependencies', 'timeEntries'
        ];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                task[field] = req.body[field];
            }
        });
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

// @desc    Reorder tasks (drag & drop intra/inter-column)
// @route   PATCH /api/projects/:projectId/tasks/reorder
// @access  Private (Project member)
const reorderTasks = async (req, res, next) => {
    try {
        const { items } = req.body; // Array of { id, status, order }
        const projectId = req.params.projectId || req.params.id;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide items array for reordering'
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        // Bulk update tasks
        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { _id: item.id, project: projectId },
                update: { status: item.status, order: item.order, updatedAt: Date.now() }
            }
        }));

        if (bulkOps.length > 0) {
            await Task.bulkWrite(bulkOps);
        }

        // Broadcast real-time update
        req.io.to(projectId.toString()).emit('tasks:reordered', {
            projectId,
            items
        });

        res.status(200).json({
            success: true,
            count: items.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private (Project member)
const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, error: 'Comment text is required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Add comment
        const newComment = {
            user: req.user._id,
            text: req.body.text ? req.body.text.trim() : '',
            createdAt: Date.now(),
            ...(req.body.parentId && { parentId: req.body.parentId })
        };

        task.comments.push(newComment);
        await task.save();

        // Populate user details for returning
        await task.populate('comments.user', 'name avatar email');

        // Broadcast to project
        if (req.io) {
            req.io.to(task.project.toString()).emit('task:comment_added', {
                taskId: task._id,
                projectId: task.project,
                comment: task.comments[task.comments.length - 1]
            });
        }

        res.status(201).json({
            success: true,
            data: task.comments[task.comments.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a comment from a task
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private (Comment owner, PM, Admin)
const removeComment = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        const commentIndex = task.comments.findIndex(c => c._id.toString() === req.params.commentId);
        if (commentIndex === -1) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        const comment = task.comments[commentIndex];
        
        // Check authorization
        const isOwner = comment.user.toString() === req.user._id.toString();
        const isPMOrAdmin = req.user.role === 'pm' || req.user.role === 'admin';
        
        if (!isOwner && !isPMOrAdmin) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
        }

        task.comments.splice(commentIndex, 1);
        await task.save();

        if (req.io) {
            req.io.to(task.project.toString()).emit('task:comment_removed', {
                taskId: task._id,
                projectId: task.project,
                commentId: req.params.commentId
            });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Add an attachment to a task
// @route   POST /api/tasks/:id/attachments
// @access  Private (Project member)
const addAttachment = async (req, res, next) => {
    try {
        const { name, url, type, size } = req.body;
        
        if (!name || !url) {
            return res.status(400).json({ success: false, error: 'Attachment name and url are required' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        const newAttachment = {
            name,
            url,
            type,
            size,
            uploadedBy: req.user._id,
            uploadedAt: Date.now()
        };

        task.attachments.push(newAttachment);
        await task.save();

        await task.populate('attachments.uploadedBy', 'name avatar email');

        res.status(201).json({
            success: true,
            data: task.attachments[task.attachments.length - 1]
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
    getTasksByProject,
    reorderTasks,
    addComment,
    removeComment,
    addAttachment
};