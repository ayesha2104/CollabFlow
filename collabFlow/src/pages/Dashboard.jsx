import React, { useState, useEffect } from 'react';
import Navbar from '../components/shared/Navbar';
import ProjectCard from '../components/dashboard/ProjectCard';
// import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { Plus, LayoutGrid, List } from 'lucide-react';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);

    // Simulate fetching initial data
    useEffect(() => {
        // Fake API call
        const timer = setTimeout(() => {
            setProjects([
                {
                    id: 1,
                    name: "Website Redesign",
                    description: "Overhaul of the main corporate website with new branding.",
                    taskCount: 12,
                    members: [1, 2],
                    updatedAt: "2h ago"
                },
                {
                    id: 2,
                    name: "Mobile App MVP",
                    description: "Initial features for the iOS and Android launch.",
                    taskCount: 8,
                    members: [1],
                    updatedAt: "1d ago"
                },
                {
                    id: 3,
                    name: "Marketing Campaign",
                    description: "Q3 social media and email marketing strategy.",
                    taskCount: 24,
                    members: [1, 2, 3, 4],
                    updatedAt: "5m ago"
                }
            ]);
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // const handleCreateProject = (newProject) => {
    //     setProjects([newProject, ...projects]);
    // };

    return (
        <div className="min-h-screen bg-[var(--bg-dark)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
                        <p className="text-slate-400 text-sm">Manage your collaborative workspaces</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <List size={18} />
                            </button>
                        </div> */}

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
                            <div key={n} className="bg-[var(--bg-card)] h-48 rounded-xl border border-[var(--border)] animate-pulse p-5">
                                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                                <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    // Empty State
                    <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <LayoutGrid size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No projects found</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto">Get started by creating your first project to collaborate with your team.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary"
                        >
                            Create New Project
                        </button>
                    </div>
                ) : (
                    // Project Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}

            </main>

            {/* <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateProject}
            /> */}
        </div>
    );
};

export default Dashboard;
