const Activity = require('../models/Activity');

// @desc    Get project activity feed
// @route   GET /api/activities/project/:projectId
// @access  Private (Project member)
const getProjectActivities = async (req, res) => {
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

module.exports = {
    getProjectActivities
};