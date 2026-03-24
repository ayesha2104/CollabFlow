const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { PROJECT_ROLES, TASK_STATUS } = require('../config/constants');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({
            'members.user': req.user._id
        })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({ updatedAt: -1 });

        const projectIds = projects.map(p => p._id);

        const taskCounts = await Task.aggregate([
            { $match: { project: { $in: projectIds } } },
            {
                $group: {
                    _id: '$project',
                    taskCount: { $sum: 1 },
                    activeTaskCount: {
                        $sum: {
                            $cond: [{ $ne: ['$status', TASK_STATUS.DONE] }, 1, 0]
                        }
                    },
                    doneCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const countMap = {};
        taskCounts.forEach(t => {
            countMap[t._id.toString()] = t;
        });

        const projectsWithCounts = projects.map(p => {
            const counts = countMap[p._id.toString()];
            const taskCount = counts?.taskCount || 0;
            const doneCount = counts?.doneCount || 0;

            return {
                ...p.toObject(),
                taskCount,
                activeTaskCount: counts?.activeTaskCount || 0,
                progress: taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100)
            };
        });

        res.status(200).json({
            success: true,
            count: projectsWithCounts.length,
            data: projectsWithCounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const project = await Project.create({
            name,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: PROJECT_ROLES.OWNER }],
            columns: [
                { id: 'col-1', title: 'To Do', order: 0 },
                { id: 'col-2', title: 'In Progress', order: 1 },
                { id: 'col-3', title: 'Done', order: 2 }
            ]
        });

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'project_created',
            metadata: {
                projectName: project.name
            }
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(201).json({
            success: true,
            data: populatedProject
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project (metadata only)
// @route   GET /api/projects/:id
// @access  Private (Project member)
const getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project owner)
const updateProject = async (req, res, next) => {
    try {
        const { name, description, fieldDefinitions } = req.body;

        const updateData = { name, description, updatedAt: Date.now() };
        if (fieldDefinitions !== undefined) {
            updateData.fieldDefinitions = fieldDefinitions;
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'project_updated',
            metadata: {
                changes: { name, description }
            }
        });

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Project owner)
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await Task.deleteMany({ project: project._id });
        await Activity.deleteMany({ project: project._id });
        await project.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Invite members to project
// @route   POST /api/projects/:id/invite
// @access  Private (Project owner or PM)
const inviteMembers = async (req, res, next) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email addresses'
            });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const users = await User.find({ email: { $in: emails } });

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No users found with provided emails'
            });
        }

        const invitedUsers = [];
        const alreadyMembers = [];

        users.forEach(user => {
            const isMember = project.members.some(
                member => member.user.toString() === user._id.toString()
            );

            if (!isMember) {
                let projectRole = PROJECT_ROLES.MEMBER;

                if (user.role === 'PM' || user.role === 'admin') {
                    projectRole = PROJECT_ROLES.PM;
                } else if (user.role === 'Client') {
                    projectRole = PROJECT_ROLES.CLIENT;
                }

                project.members.push({
                    user: user._id,
                    role: projectRole
                });

                invitedUsers.push(user);
            } else {
                alreadyMembers.push(user);
            }
        });

        await project.save();

        for (const user of invitedUsers) {
            await Activity.create({
                project: project._id,
                user: req.user._id,
                action: 'member_added',
                metadata: {
                    invitedUserName: user.name,
                    invitedUserEmail: user.email
                }
            });

            sendEmail({
                email: user.email,
                subject: `You've been invited to ${project.name}`,
                html: `
                    <h2>Welcome to ${project.name}!</h2>
                    <p>You have been invited to collaborate on <strong>${project.name}</strong> on CollabFlow.</p>
                    <p>Log in to view the project details.</p>
                `
            }).catch(err => console.error('Failed to send invite email:', err));
        }

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar role');

        if (req.io) {
            req.io.to(project._id.toString()).emit('members:updated', {
                projectId: project._id,
                members: populatedProject.members
            });
        }

        res.status(200).json({
            success: true,
            data: {
                project: populatedProject,
                invited: invitedUsers.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                })),
                alreadyMembers: alreadyMembers.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Project owner or PM)
const removeMember = async (req, res, next) => {
    try {
        const { projectId, userId } = req.params;

        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove yourself from project'
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        if (project.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove project owner'
            });
        }

        project.members = project.members.filter(
            member => member.user.toString() !== userId
        );

        await project.save();

        const removedUser = await User.findById(userId);
        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'member_removed',
            metadata: {
                removedUserName: removedUser?.name || 'Unknown',
                removedUserEmail: removedUser?.email || 'Unknown'
            }
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar role');

        if (req.io) {
            req.io.to(project._id.toString()).emit('members:updated', {
                projectId: project._id,
                members: populatedProject.members
            });
        }

        res.status(200).json({
            success: true,
            data: populatedProject
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update member role in project
// @route   PUT /api/projects/:projectId/members/:userId
// @access  Private (Project owner or PM)
const updateMemberRole = async (req, res, next) => {
    try {
        const { projectId, userId } = req.params;
        const { role } = req.body;

        if (!role || !Object.values(PROJECT_ROLES).includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Valid role is required (owner, pm, member, client)'
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const memberIndex = project.members.findIndex(
            member => member.user.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in project'
            });
        }

        project.members[memberIndex].role = role;
        await project.save();

        const updatedUser = await User.findById(userId);
        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'member_role_updated',
            metadata: {
                userName: updatedUser?.name || 'Unknown',
                newRole: role
            }
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar role');

        if (req.io) {
            req.io.to(project._id.toString()).emit('members:updated', {
                projectId: project._id,
                members: populatedProject.members
            });
        }

        res.status(200).json({
            success: true,
            data: populatedProject
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project columns
// @route   PUT /api/projects/:id/columns
// @access  Private (Project owner or PM)
const updateProjectColumns = async (req, res, next) => {
    try {
        const { columns } = req.body;

        if (!columns || !Array.isArray(columns)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide columns array'
            });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        project.columns = columns;
        await project.save();

        if (req.io) {
            req.io.to(project._id.toString()).emit('columns:updated', {
                projectId: project._id,
                columns: project.columns
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get project analytics
// @route   GET /api/projects/:id/analytics
// @access  Private (Project member)
const getProjectAnalytics = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const tasks = await Task.find({ project: req.params.id });
        const activities = await Activity.find({ project: req.params.id })
            .sort({ createdAt: -1 })
            .limit(100);

        const totalTasks = tasks.length;
        const taskCounts = { todo: 0, inProgress: 0, done: 0 };
        const priorityCounts = { low: 0, medium: 0, high: 0 };

        tasks.forEach(task => {
            if (task.status === TASK_STATUS.TODO) taskCounts.todo++;
            else if (task.status === TASK_STATUS.IN_PROGRESS) taskCounts.inProgress++;
            else if (task.status === TASK_STATUS.DONE) taskCounts.done++;

            if (task.priority === 'low') priorityCounts.low++;
            else if (task.priority === 'medium') priorityCounts.medium++;
            else if (task.priority === 'high') priorityCounts.high++;
        });

        const completionRate = totalTasks === 0 ? 0 : Math.round((taskCounts.done / totalTasks) * 100);

        res.status(200).json({
            success: true,
            data: {
                totalTasks,
                taskCounts,
                priorityCounts,
                completionRate,
                recentActivities: activities.length
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    inviteMembers,
    removeMember,
    updateMemberRole,
    updateProjectColumns,
    getProjectAnalytics
};