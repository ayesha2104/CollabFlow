const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { TASK_STATUS, PRIORITY_LEVELS } = require('../config/constants');
const {
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByProject
} = require('../controllers/taskController');
// const { protect } = require('../middleware/auth');
const validate = require('../middleware/validator');
// Add this middleware at the top of routes/tasks.js
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const createTaskValidation = [
    body('projectId')
        .notEmpty()
        .withMessage('Project ID is required'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Task title is required')
        .isLength({ max: 200 })
        .withMessage('Task title cannot be more than 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    body('status')
        .optional()
        .isIn(Object.values(TASK_STATUS))
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(Object.values(PRIORITY_LEVELS))
        .withMessage('Invalid priority'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
];

const updateTaskValidation = [
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty')
        .isLength({ max: 200 })
        .withMessage('Task title cannot be more than 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot be more than 2000 characters'),
    body('status')
        .optional()
        .isIn(Object.values(TASK_STATUS))
        .withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(Object.values(PRIORITY_LEVELS))
        .withMessage('Invalid priority'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
];

const moveTaskValidation = [
    body('newStatus')
        .notEmpty()
        .withMessage('New status is required')
        .isIn(Object.values(TASK_STATUS))
        .withMessage('Invalid status')
];

// All routes require authentication
router.use(protect);

// Task routes - IMPORTANT: Define specific routes before parameterized routes
router.post('/', createTaskValidation, validate, createTask);
router.patch('/:id/move', moveTaskValidation, validate, moveTask);
router.put('/:id', updateTaskValidation, validate, updateTask);
router.delete('/:id', protect, authorize('admin', 'PM'), deleteTask);

module.exports = router;