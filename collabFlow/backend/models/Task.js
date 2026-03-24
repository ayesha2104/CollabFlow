const mongoose = require('mongoose');
const { TASK_STATUS, PRIORITY_LEVELS } = require('../config/constants');

const taskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
        maxlength: [200, 'Task title cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    status: {
        type: String,
        default: TASK_STATUS.TODO
    },
    order: {
        type: Number,
        default: 0
    },
    priority: {
        type: String,
        enum: Object.values(PRIORITY_LEVELS),
        default: PRIORITY_LEVELS.MEDIUM
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    estimatedTime: {
        type: Number, // Stored in minutes
        default: 0
    },
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    subtasks: [{
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    dependencies: [{
        task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        type: { type: String, enum: ['blocking', 'blockedBy'] }
    }],
    timeEntries: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number }, // duration in minutes
        description: { type: String },
        loggedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId
        }
    }],
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String },
        size: { type: Number },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for faster queries
taskSchema.index({ project: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

// CORRECTED LINE - Changed 'Task' to 'taskSchema'
module.exports = mongoose.model('Task', taskSchema);