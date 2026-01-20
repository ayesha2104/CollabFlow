const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Not authorized'
        });
    }
};

const isProjectMember = async (req, res, next) => {
    try {
        const Project = require('../models/Project');
        const project = await Project.findById(req.params.id || req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Check if user is a member (owner is also a member)
        const isMember = project.members.some(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Not a project member'
            });
        }

        req.project = project;
        next();
    } catch (error) {
        console.error('Project membership check error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

const isProjectOwner = async (req, res, next) => {
    try {
        const Project = require('../models/Project');
        const project = await Project.findById(req.params.id || req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Check if user is the owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only project owner can perform this action'
            });
        }

        req.project = project;
        next();
    } catch (error) {
        console.error('Project ownership check error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
// Add after the existing middleware functions

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        next();
    };
};

// Specific role checkers
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin only'
        });
    }
    next();
};

const isPM = (req, res, next) => {
    if (!['admin', 'PM'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Project Manager or Admin only'
        });
    }
    next();
};

// Update exports at the bottom
module.exports = {
    protect,
    isProjectMember,
    isProjectOwner,
    authorize,  // Add this
    isAdmin,    // Add this
    isPM        // Add this
};
