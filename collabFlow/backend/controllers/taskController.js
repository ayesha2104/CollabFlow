const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Project member)
const createTask = async (req, res) => {
    try {
        const {
            projectId,
            title,
            description,
            status,
            priority,
            assignee,
            dueDate
        } = req.body;

        // Validate project membership
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const isMember = project.members.some(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        // Validate assignee is a project member
        if (assignee) {
            const assigneeIsMember = project.members.some(
                member => member.user.toString() === assignee
            );

            if (!assigneeIsMember) {
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
            status: status || 'todo',
            priority: priority || 'medium',
            assignee,
            dueDate,
            createdBy: req.user._id
        });

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
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Project member)
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', '_id');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Validate project membership
        const project = await Project.findById(task.project._id);
        const isMember = project.members.some(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                error: 'Not a project member'
            });
        }

        // Validate assignee is a project member
        if (req.body.assignee) {
            const assigneeIsMember = project.members.some(
                member => member.user.toString() === req.body.assignee
            );

            if (!assigneeIsMember) {
                return res.status(400).json({
                    success: false,
                    error: 'Assignee must be a project member'
                });
            }
        }

        // Track changes for activity log
        const changes = {};
        const oldTask = { ...task._doc };

        Object.keys(req.body).forEach(key => {
            if (task[key] !== req.body[key]) {
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
            project: task.project._id,
            user: req.user._id,
            action: 'task_updated',
            task: task._id,
            metadata: {
                taskTitle: task.title,
                changes: changes
            }
        });

        // Broadcast real-time update
        req.io.to(task.project._id.toString()).emit('task:updated', {
            taskId: task._id,
            updates: req.body
        });

        req.io.to(task.project._id.toString()).emit('activity:new', {
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
const deleteTask = async (req, res) => {
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
        const isMember = project.members.some(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
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
// @route   PUT /api/tasks/:id/move
// @access  Private (Project member)
const moveTask = async (req, res) => {
    try {
        const { newStatus } = req.body;

        if (!['todo', 'in_progress', 'done'].includes(newStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
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
    moveTask
};