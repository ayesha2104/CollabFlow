import React, { useState } from 'react';
import Navbar from '../components/shared/Navbar';
import ProjectCard from '../components/dashboard/ProjectCard';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';
import { Plus, LayoutGrid, Search, Activity, Clock } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { SkeletonCard } from '../components/shared/LoadingSpinner';
import { activitiesAPI } from '../services/api';
import { extractResponseData } from '../utils/apiHelpers';

const Dashboard = () => {
    const { projects, isLoading, createProject } = useProjects();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activities, setActivities] = useState([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await activitiesAPI.getUserActivities({ limit: 10 });
                setActivities(extractResponseData(response) || []);
            } catch (error) {
                console.error('Failed to fetch user activities', error);
            } finally {
                setIsLoadingActivities(false);
            }
        };

        fetchActivities();
    }, []);

    const handleCreateProject = async (projectData) => {
        try {
            await createProject(projectData);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[var(--bg-dark)]">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
                        <p className="text-slate-400 text-sm">
                            You have {projects.length} active project{projects.length !== 1 ? 's' : ''} this week.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2 transition-all text-slate-200 placeholder-slate-500"
                            />
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary gap-2 w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            <span>New Project</span>
                        </button>
                    </div>
                </div>

                {/* Main Dashboard Layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Projects Section (Left Side) - Takes up 2/3 space on large screens */}
                    <div className="flex-1 lg:w-2/3">
                        {isLoading ? (
                            // Skeleton Loading
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((n) => (
                                    <SkeletonCard key={n} />
                                ))}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            // Empty State
                            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <LayoutGrid size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">
                                    {searchQuery ? 'No projects match your search' : 'No projects found'}
                                </h3>
                                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                                    {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating your first project to collaborate with your team.'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="btn btn-primary"
                                    >
                                        Create New Project
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Project Grid
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {filteredProjects.map((project) => (
                                    <ProjectCard key={project.id || project._id} project={project} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications Section (Right Side) - Takes up 1/3 space on large screens */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl sticky top-24">
                            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <Activity size={18} className="text-blue-400" />
                                    Recent Notifications
                                </h2>
                            </div>
                            
                            <div className="p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {isLoadingActivities ? (
                                    <div className="flex justify-center items-center py-10">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-sm">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    activities.map(activity => (
                                        <div key={activity._id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400 font-medium text-xs border border-blue-500/30">
                                                    {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-300">
                                                        <span className="font-semibold text-white">{activity.user?.name || 'Someone'}</span>
                                                        {' '}{activity.action.replace(/_/g, ' ')}{' '}
                                                    </p>
                                                    <p className="text-xs text-blue-400 font-medium mt-0.5 truncate">
                                                        {activity.project?.name || 'A project'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-medium">
                                                        <Clock size={10} />
                                                        {new Date(activity.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
