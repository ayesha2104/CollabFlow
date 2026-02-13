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
        enum: Object.values(TASK_STATUS),
        default: TASK_STATUS.TODO
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
    dueDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update updatedAt on save
taskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
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