import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    timeout: config.TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle specific error codes
        if (error.response) {
            // Log detailed error for debugging 400 Bad Request
            if (error.response.status === 400) {
                console.error('API 400 Error Details:', error.response.data);
            }

            // Global error handling for specific codes
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    // Forbidden
                    console.error('Access denied');
                    break;
                case 404:
                    // Not found
                    console.error('Resource not found');
                    break;
                case 500:
                    // Server error
                    console.error('Server error');
                    break;
                default:
                    break;
            }
        } else if (error.request) {
            // Network error
            console.error('Network error - please check your connection');
        }

        return Promise.reject(error);
    }
);

// Auth endpoints
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    signup: (userData) => api.post('/auth/signup', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me') // Backend uses /me not /profile
};

// Projects endpoints
export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    inviteMembers: (id, emails) => api.post(`/projects/${id}/invite`, { emails })
};

// Tasks endpoints
export const tasksAPI = {
    getByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    move: (id, newStatus) =>
        api.patch(`/tasks/${id}/move`, { newStatus })
};

// Activities endpoints
export const activitiesAPI = {
    getByProject: (projectId, params = {}) =>
        api.get(`/activities/project/${projectId}`, { params }), // Backend uses /activities/project/:projectId
};

export default api;
