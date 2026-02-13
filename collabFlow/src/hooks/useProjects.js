import { useState, useCallback, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { extractResponseData, transformProjectFromBackend } from '../utils/apiHelpers';
import config from '../config';

// Mock data removed


export const useProjects = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all projects
    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Real API call
            const response = await projectsAPI.getAll();
            const projectsData = extractResponseData(response);
            // Transform backend format to frontend format
            const transformedProjects = Array.isArray(projectsData)
                ? projectsData.map(transformProjectFromBackend)
                : [];
            setProjects(transformedProjects);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch projects';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch single project
    const fetchProject = useCallback(async (id) => {
        try {
            // Real API call
            const response = await projectsAPI.getById(id);
            const projectData = extractResponseData(response);
            // Handle the { project, tasks } wrapper or direct project object
            const actualProject = projectData.project || projectData;
            return transformProjectFromBackend(actualProject);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load project';
            toast.error(errorMessage);
            throw err;
        }
    }, []);

    // Create project
    const createProject = useCallback(async (projectData) => {
        try {
            // Real API call
            const response = await projectsAPI.create(projectData);
            const responseData = extractResponseData(response);
            const newProject = transformProjectFromBackend(responseData);
            setProjects(prev => [newProject, ...prev]);
            toast.success('Project created successfully!');
            return newProject;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create project';
            toast.error(errorMessage);
            throw err;
        }
    }, [projects]);

    // Update project
    const updateProject = useCallback(async (id, updates) => {
        try {
            // Real API call
            const response = await projectsAPI.update(id, updates);
            const projectData = extractResponseData(response);
            const updatedProject = transformProjectFromBackend(projectData);
            setProjects(prev => prev.map(p => (p.id === parseInt(id) || p.id === id) ? updatedProject : p));
            toast.success('Project updated successfully!');
            return updatedProject;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update project';
            toast.error(errorMessage);
            throw err;
        }
    }, [projects]);

    // Delete project
    const deleteProject = useCallback(async (id) => {
        try {
            // Real API call
            await projectsAPI.delete(id);
            setProjects(prev => prev.filter(p => p.id !== parseInt(id) && p.id !== id));
            toast.success('Project deleted successfully!');
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete project';
            toast.error(errorMessage);
            throw err;
        }
    }, [projects]);

    // Load projects on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        isLoading,
        error,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject
    };
};

export default useProjects;
