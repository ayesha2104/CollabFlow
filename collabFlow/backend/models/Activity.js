const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // In models/Activity.js, update the action enum:
    action: {
        type: String,
        enum: [
            'task_created',
            'task_updated',
            'task_moved',
            'task_deleted',
            'task_assigned',
            'member_added',
            'member_removed',
            'member_role_updated',
            'project_created',
            'project_updated'
        ],
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    metadata: {
        taskTitle: String,
        oldStatus: String,
        newStatus: String,
        changes: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
activitySchema.index({ project: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1 });

module.exports = mongoose.model('Activity', activitySchema);