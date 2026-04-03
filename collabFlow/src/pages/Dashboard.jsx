import React, { useState } from 'react';
import Navbar from '../components/shared/Navbar';
import ProjectCard from '../components/dashboard/ProjectCard';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useSearchParams } from 'react-router-dom';
import { SkeletonCard } from '../components/shared/LoadingSpinner';

const Dashboard = () => {
    const { projects, isLoading, createProject } = useProjects();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    // Filter projects based on search query
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const projectCountLabel = projects.length === 1 ? 'project' : 'projects';
    const projectGrid = filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} variant={viewMode} />
    ));

    let projectContent = null;
    if (filteredProjects.length === 0) {
        projectContent = (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <LayoutGrid size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No projects found</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                    Get started by creating your first project to collaborate with your team.
                </p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary"
                >
                    Create New Project
                </button>
            </div>
        );
    } else if (viewMode === 'grid') {
        projectContent = (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectGrid}
            </div>
        );
    } else {
        projectContent = (
            <div className="space-y-4">
                {projectGrid}
            </div>
        );
    }

    const handleCreateProject = async (projectData) => {
        try {
            await createProject(projectData);
            setIsModalOpen(false);
        } catch (error) {
            // Error is already handled in the hook
            console.error('Failed to create project:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-dark)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
                        <p className="text-slate-400 text-sm">
                            You have {projects.length} active {projectCountLabel} this week.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary gap-2"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">New Project</span>
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                {isLoading ? (
                    // Skeleton Loading
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <SkeletonCard key={n} />
                        ))}
                    </div>
                ) : (
                    projectContent
                )}
            </main>

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </div>
    );
};

export default Dashboard;
