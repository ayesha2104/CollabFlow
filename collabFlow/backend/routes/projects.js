const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    inviteMembers
} = require('../controllers/projectController');
const { protect, isProjectMember, isProjectOwner } = require('../middleware/auth');
const validate = require('../middleware/validator');

// Validation rules
const createProjectValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ max: 100 })
        .withMessage('Project name cannot be more than 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot be more than 500 characters')
];

const inviteMembersValidation = [
    body('emails')
        .isArray()
        .withMessage('Emails must be an array')
        .notEmpty()
        .withMessage('Please provide at least one email')
];

// All routes require authentication
router.use(protect);

// Public project routes
router.get('/', getProjects);
router.post('/', createProjectValidation, validate, createProject);

// Project-specific routes
router.get('/:id', isProjectMember, getProject);
router.put('/:id', isProjectOwner, createProjectValidation, validate, updateProject);
router.delete('/:id', isProjectOwner, deleteProject);
router.post('/:id/invite', isProjectOwner, inviteMembersValidation, validate, inviteMembers);

module.exports = router;