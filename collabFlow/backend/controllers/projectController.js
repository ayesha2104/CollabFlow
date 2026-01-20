const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            'members.user': req.user._id
        })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await Project.create({
            name,
            description,
            owner: req.user._id
        });

        // Log activity
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

// @desc    Get single project with tasks
// @route   GET /api/projects/:id
// @access  Private (Project member)
const getProject = async (req, res) => {
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

        // Get tasks for this project
        const tasks = await Task.find({ project: project._id })
            .populate('assignee', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                project,
                tasks
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project owner)
const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, description, updatedAt: Date.now() },
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

        // Log activity
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
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Delete all tasks for this project
        await Task.deleteMany({ project: project._id });

        // Delete all activities for this project
        await Activity.deleteMany({ project: project._id });

        // Delete project
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
const inviteMembers = async (req, res) => {
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

        // Find users by email
        const users = await User.find({ email: { $in: emails } });

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No users found with provided emails'
            });
        }

        const invitedUsers = [];
        const alreadyMembers = [];

        // Process each user
        users.forEach(user => {
            const isMember = project.members.some(
                member => member.user.toString() === user._id.toString()
            );

            if (!isMember) {
                let projectRole = 'member';

                // Set project role based on user's global role
                if (user.role === 'PM' || user.role === 'admin') {
                    projectRole = 'pm';
                } else if (user.role === 'Client') {
                    projectRole = 'client';
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

        // Log activity for each invited user
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
        }

        // Populate members
        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar role');

        // Broadcast real-time updates (if you have socket.io setup)
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
const removeMember = async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        // Check if user is trying to remove themselves
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

        // Check if target user is the owner
        if (project.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove project owner'
            });
        }

        // Remove member
        project.members = project.members.filter(
            member => member.user.toString() !== userId
        );

        await project.save();

        // Log activity
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

        // Broadcast update
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
const updateMemberRole = async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const { role } = req.body;

        if (!role || !['owner', 'pm', 'member', 'client'].includes(role)) {
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

        // Find member
        const memberIndex = project.members.findIndex(
            member => member.user.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in project'
            });
        }

        // Update role
        project.members[memberIndex].role = role;
        await project.save();

        // Log activity
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

        // Broadcast update
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

module.exports = {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    inviteMembers,
    removeMember,
    updateMemberRole
};