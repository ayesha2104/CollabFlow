const express = require('express');
const router = express.Router();
const { getProjectActivities } = require('../controllers/activityController');
const { protect, isProjectMember } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Activity routes
router.get('/project/:projectId', isProjectMember, getProjectActivities);

module.exports = router;