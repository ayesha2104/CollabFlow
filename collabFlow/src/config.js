/**
 * Central configuration for the application
 */

// Environment check
const isDev = import.meta.env.MODE === 'development';

const config = {
    // API and Socket URLs
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',

    // Feature flags
    // Feature flags
    // Mock API usage removed


    // Environment
    ENV: import.meta.env.VITE_ENV || import.meta.env.MODE || 'development',
    IS_DEV: isDev,

    // Render-specific considerations
    TIMEOUT: 30000, // Increased timeout for Render free tier spindowns
};

export default config;
