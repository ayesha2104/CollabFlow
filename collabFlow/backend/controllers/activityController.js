const Activity = require('../models/Activity');
const Project = require('../models/Project'); // Need this to find user's projects

// @desc    Get project activity feed
// @route   GET /api/activities/project/:projectId
// @access  Private (Project member)
const getProjectActivities = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        const activities = await Activity.find({ project: req.params.projectId })
            .populate('user', 'name avatar')
            .populate('task', 'title')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Activity.countDocuments({ project: req.params.projectId });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                skip: parseInt(skip),
                limit: parseInt(limit),
                hasMore: total > parseInt(skip) + activities.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's global activity feed (from all their projects)
// @route   GET /api/activities/user
// @access  Private
const getUserActivities = async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        // Find all projects where user is a member
        const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
        const projectIds = userProjects.map(p => p._id);

        const activities = await Activity.find({ project: { $in: projectIds } })
            .populate('project', 'name')
            .populate('user', 'name avatar')
            .populate('task', 'title')
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Activity.countDocuments({ project: { $in: projectIds } });

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                skip: parseInt(skip),
                limit: parseInt(limit),
                hasMore: total > parseInt(skip) + activities.length
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjectActivities,
    getUserActivities
};