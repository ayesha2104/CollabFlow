const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

module.exports = (io) => {
    // Socket authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('name email avatar');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id;
            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.user.name})`);

        // Join project room
        socket.on('project:join', async (projectId) => {
            try {
                // Validate project membership
                const project = await Project.findById(projectId);

                if (!project) {
                    socket.emit('error', { message: 'Project not found' });
                    return;
                }

                const isMember = project.members.some(
                    member => member.user.toString() === socket.userId.toString()
                );

                if (!isMember) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Join room
                socket.join(projectId);

                // Get current users in room
                const socketsInRoom = await io.in(projectId).fetchSockets();
                const activeUserIds = [...new Set(socketsInRoom.map(s => s.userId.toString()))];

                const activeUsers = await User.find({
                    _id: { $in: activeUserIds }
                }).select('name email avatar');

                // Broadcast to room that user joined (except sender)
                socket.to(projectId).emit('user:joined', {
                    userId: socket.userId,
                    user: socket.user
                });

                // Send current active users to new joiner
                socket.emit('active:users', {
                    users: activeUsers
                });

                console.log(`User ${socket.userId} joined project ${projectId}`);
            } catch (error) {
                console.error('Project join error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Leave project room
        socket.on('project:leave', (projectId) => {
            socket.leave(projectId);
            socket.to(projectId).emit('user:left', {
                userId: socket.userId
            });
            console.log(`User ${socket.userId} left project ${projectId}`);
        });

        // Handle manual task move (from drag & drop)
        socket.on('task:move', async (data) => {
            try {
                const { taskId, newStatus, projectId } = data;

                // Validate project membership
                const project = await Project.findById(projectId);
                const isMember = project.members.some(
                    member => member.user.toString() === socket.userId.toString()
                );

                if (!isMember) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                // Broadcast to room (except sender)
                socket.to(projectId).emit('task:moved', {
                    taskId,
                    newStatus,
                    movedBy: socket.userId
                });

            } catch (error) {
                console.error('Task move socket error:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            // Note: Socket.io automatically handles leaving rooms on disconnect
        });
    });
};