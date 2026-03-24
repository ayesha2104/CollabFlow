import React from 'react';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';

const ListView = ({ tasks, columns, columnOrder, filterFn, onTaskClick, project }) => {
    const renderTasks = () => {
        let content = [];
        columnOrder.forEach(colId => {
            const column = columns[colId];
            const colTasks = filterFn(column.taskIds || []);
            
            if (colTasks.length === 0) return;
            
            content.push(
                <tr key={`group-${colId}`} className="bg-slate-800/80 border-y border-slate-700">
                    <td colSpan={6 + (project?.fieldDefinitions?.length || 0)} className="px-4 py-2 text-sm font-semibold text-slate-300">
                        {column.title} <span className="text-slate-500 font-normal ml-2">{colTasks.length} tasks</span>
                    </td>
                </tr>
            );
            
            colTasks.forEach(task => {
                content.push(
                    <tr 
                        key={task.id} 
                        onClick={() => onTaskClick(task)}
                        className="border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                        <td className="px-4 py-3 min-w-[200px]">
                            <div className="flex items-center gap-2">
                                {task.status === 'Done' ? <CheckCircle2 className="text-green-500 w-4 h-4 shrink-0" /> : <Circle className="text-slate-500 w-4 h-4 shrink-0 group-hover:border-blue-500 transition-colors" />}
                                <span className="font-medium text-slate-200">{task.title}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                                task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                {task.priority}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                            {task.assignee ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white overflow-hidden shrink-0">
                                        {task.assignee.avatar ? <img src={task.assignee.avatar} alt="A" className="w-full h-full object-cover" /> : task.assignee.name?.charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[100px]">{task.assignee.name}</span>
                                </div>
                            ) : (
                                <span className="text-slate-500 italic text-xs">Unassigned</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                            {task.dueDate ? (
                                <div className="flex items-center gap-1.5 text-xs">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400 font-mono text-xs">
                            {task.estimatedTime ? `${task.estimatedTime}m` : '-'}
                        </td>
                        {project?.fieldDefinitions?.map(field => (
                            <td key={field.id} className="px-4 py-3 text-sm text-slate-400 truncate max-w-[150px]">
                                {task.customFields?.[field.id] !== undefined ? (
                                    field.type === 'boolean' 
                                        ? (task.customFields[field.id] ? 'Yes' : 'No') 
                                        : String(task.customFields[field.id])
                                ) : '-'}
                            </td>
                        ))}
                    </tr>
                );
            });
        });
        
        return content.length > 0 ? content : (
            <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500 italic">No tasks found. Try adjusting filters.</td>
            </tr>
        );
    };

    return (
        <div className="w-full h-full overflow-auto p-6">
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-800 text-[10px] uppercase text-slate-400 font-semibold border-b border-slate-700 tracking-wider">
                        <tr>
                            <th className="px-4 py-3 w-1/3">Task Title</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Assignee</th>
                            <th className="px-4 py-3">Due Date</th>
                            <th className="px-4 py-3">Est. Time</th>
                            {project?.fieldDefinitions?.map(field => (
                                <th key={field.id} className="px-4 py-3">{field.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderTasks()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListView;
