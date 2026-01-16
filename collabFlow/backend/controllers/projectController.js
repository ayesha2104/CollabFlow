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
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching projects'
        });
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
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error creating project'
        });
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
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error fetching project'
        });
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
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error updating project'
        });
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
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error deleting project'
        });
    }
};

// @desc    Invite members to project
// @route   POST /api/projects/:id/invite
// @access  Private (Project owner)
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

        users.forEach(user => {
            const isMember = project.members.some(
                member => member.user.toString() === user._id.toString()
            );

            if (!isMember) {
                project.members.push({
                    user: user._id,
                    role: 'member'
                });
                invitedUsers.push(user);
            } else {
                alreadyMembers.push(user);
            }
        });

        await project.save();

        // Populate members
        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(200).json({
            success: true,
            data: {
                project: populatedProject,
                invited: invitedUsers.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email
                })),
                alreadyMembers: alreadyMembers.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email
                }))
            }
        });
    } catch (error) {
        console.error('Invite members error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error inviting members'
        });
    }
};

module.exports = {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    inviteMembers
};