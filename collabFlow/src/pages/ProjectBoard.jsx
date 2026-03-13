import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskColumn from '../components/project/TaskColumn';
import Navbar from '../components/shared/Navbar';
import TaskDetailModal from '../components/project/TaskDetailModal';
import ProjectSettingsModal from '../components/project/ProjectSettingsModal';
import ProjectAnalyticsModal from '../components/project/ProjectAnalyticsModal';
import ActivityFeed from '../components/project/ActivityFeed';
import ActiveUsers from '../components/project/ActiveUsers';
import { Settings, Filter, ArrowLeft, Plus, Activity, BarChart2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { toast } from 'react-toastify';
import { PageLoader } from '../components/shared/LoadingSpinner';

const ProjectBoard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchProject, updateProjectColumns, updateProject, deleteProject } = useProjects();
    const { connected } = useSocket();
    const {
        tasks,
        columns,
        columnOrder,
        isLoading: tasksLoading,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        setColumnOrder,
        addComment,
        removeComment,
        addAttachment
    } = useTasks(id);

    const [project, setProject] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [showActivityFeed, setShowActivityFeed] = useState(true);

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');

    // Load project and tasks data
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingProject(true);
            try {
                const projectData = await fetchProject(id);
                setProject(projectData);
                await fetchTasks(id, projectData.columns);
            } catch (error) {
                toast.error('Failed to load project');
                navigate('/dashboard');
            } finally {
                setIsLoadingProject(false);
            }
        };

        loadData();
    }, [id, fetchProject, fetchTasks, navigate]);

    // Drag and drop handler
    const onDragEnd = async (result) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        if (type === 'column') {
            const newColumnOrder = Array.from(columnOrder);
            newColumnOrder.splice(source.index, 1);
            newColumnOrder.splice(destination.index, 0, draggableId);
            
            setColumnOrder(newColumnOrder); // Optimistic UI update
            
            const newBackendColumns = newColumnOrder.map((colId, index) => {
                const col = columns[colId];
                return {
                    id: col.id,
                    title: col.title,
                    order: index
                };
            });

            try {
                await updateProjectColumns(id, newBackendColumns);
            } catch (error) {
                // Revert or error handle
            }
            return;
        }

        try {
            await moveTask(draggableId, source.droppableId, destination.droppableId, source.index, destination.index);
        } catch (error) {
            // Error already handled by hook/toast
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleAddTask = async (columnId) => {
        try {
            const newTask = await createTask(columnId, {
                title: 'New Task',
                priority: 'Medium'
            });
            setSelectedTask(newTask);
            setIsModalOpen(true);
        } catch (error) {
            // Error already handled
        }
    };

    const handleUpdateTask = async (updatedTask) => {
        try {
            await updateTask(updatedTask.id, updatedTask);
        } catch (error) {
            // Error already handled
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(taskId);
            setIsModalOpen(false);
        } catch (error) {
            // Error already handled
        }
    };

    const handleAddColumn = async () => {
        const newColTitle = prompt('Enter column name:');
        if (!newColTitle || !newColTitle.trim()) return;

        const newColId = `col-${Date.now()}`;
        const newColumn = { id: newColId, title: newColTitle.trim(), order: project.columns?.length || 0 };
        const newColumns = [...(project.columns || []), newColumn];

        try {
            const updatedProject = await updateProjectColumns(id, newColumns);
            setProject(updatedProject);
            await fetchTasks(id, updatedProject.columns);
        } catch (error) {
            // Error already handled
        }
    };

    const handleUpdateProject = async (updates) => {
        const updatedProject = await updateProject(id, updates);
        setProject(updatedProject);
    };

    const handleDeleteProject = async () => {
        await deleteProject(id);
        navigate('/dashboard');
    };

    // Filter Logic
    const getFilteredTasks = (taskIds) => {
        return taskIds
            .map(taskId => tasks[taskId])
            .filter(task => {
                if (!task) return false;

                const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

                return matchesSearch && matchesPriority;
            });
    };

    if (isLoadingProject || tasksLoading || !columnOrder.length) {
        return <PageLoader text="Loading project..." />;
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-dark)] overflow-hidden">
            <Navbar />

            {/* Project Header */}
            <div className="border-b border-[var(--border)] bg-slate-800/30 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {project?.name || 'Project Board'}
                            <span className="text-xs font-normal text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                                {connected ? 'Live' : 'Offline'}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400">
                            <Filter size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 pl-10 p-1.5 transition-all text-slate-200 placeholder-slate-500"
                        />
                    </div>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none hover:bg-slate-700 transition-colors"
                    >
                        <option value="All">All Priority</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    <ActiveUsers projectId={id} />

                    <div className="h-6 w-px bg-slate-700 mx-1"></div>

                    <button
                        onClick={() => setShowActivityFeed(!showActivityFeed)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${showActivityFeed ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                    >
                        <Activity size={16} /> Activity
                    </button>

                    <button
                        onClick={() => setIsAnalyticsOpen(true)}
                        className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                        <BarChart2 size={16} /> Analytics
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-1.5 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                        <Settings size={16} /> Settings
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Board Canvas */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="board" direction="horizontal" type="column">
                            {(provided) => (
                                <div
                                    className="h-full flex p-6 gap-6 min-w-max"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {columnOrder.map((columnId, index) => {
                                        const column = columns[columnId];
                                        const filteredTasks = getFilteredTasks(column.taskIds);
                                        return (
                                            <TaskColumn
                                                key={column.id}
                                                column={column}
                                                tasks={filteredTasks}
                                                index={index}
                                                onAddTask={handleAddTask}
                                                onTaskClick={handleTaskClick}
                                            />
                                        );
                                    })}
                                    {provided.placeholder}

                                    <button 
                                        onClick={handleAddColumn}
                                        className="w-80 h-12 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all flex-shrink-0"
                                    >
                                        <Plus size={20} className="mr-2" /> Add Column
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* Activity Feed Sidebar */}
                {showActivityFeed && (
                    <ActivityFeed
                        projectId={id}
                        isOpen={showActivityFeed}
                        onToggle={() => setShowActivityFeed(false)}
                    />
                )}
            </div>

            <TaskDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask ? tasks[selectedTask.id] : null}
                onSave={handleUpdateTask}
                onDelete={handleDeleteTask}
                onAddComment={addComment}
                onRemoveComment={removeComment}
                onAddAttachment={addAttachment}
            />

            <ProjectSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                project={project}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
            />

            <ProjectAnalyticsModal
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                projectId={id}
            />
        </div>
    );
};

export default ProjectBoard;
