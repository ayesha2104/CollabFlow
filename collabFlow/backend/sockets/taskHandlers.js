module.exports = (io) => {
    // This module is kept for future expansion
    // Currently, task events are handled in the REST controllers
    // and broadcasted directly from there using req.io

    io.on('connection', (socket) => {
        // Future real-time task handlers can be added here
        // For MVP, we're using REST + broadcast pattern

        // Example: Real-time typing indicator
        socket.on('task:editing', (data) => {
            const { taskId, projectId } = data;
            socket.to(projectId).emit('user:editing', {
                taskId,
                userId: socket.userId,
                userName: socket.user.name
            });
        });

        socket.on('task:stop-editing', (data) => {
            const { taskId, projectId } = data;
            socket.to(projectId).emit('user:stopped-editing', {
                taskId,
                userId: socket.userId
            });
        });
    });
};