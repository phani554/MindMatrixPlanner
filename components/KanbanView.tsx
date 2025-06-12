
import React from 'react';
import { Task, TaskStatus, Resource, Project, TaskId } from '../types';
import { EditIcon, TrashIcon, UserIcon, LinkIcon, PlayIcon, PauseIcon } from './icons';

// Simplified TaskItem for Kanban cards
const KanbanTaskItem: React.FC<{ 
    task: Task; 
    project?: Project;
    assignedResource?: Resource;
    onEdit: (task: Task) => void;
    onDelete: (taskId: TaskId) => void;
    onTimerToggle: (taskId: TaskId) => void;
}> = ({ task, project, assignedResource, onEdit, onDelete, onTimerToggle }) => {
    
    const priorityColorMap: Record<string, string> = { High: 'border-red-500', Medium: 'border-yellow-500', Low: 'border-green-500' };
    const displayTime = task.isTimerRunning && task.actualStartTime
    ? (task.accumulatedTime || 0) + (Date.now() - task.actualStartTime)
    : (task.accumulatedTime || 0);

    const formatTime = (ms?: number) => {
        if (ms === undefined || ms === null) return '0m';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <div className={`bg-slate-700 p-3 rounded-lg shadow-md mb-3 border-l-4 ${priorityColorMap[task.priority] || 'border-slate-500'}`}>
            <h4 className="text-sm font-semibold text-[#F29C2A] mb-1 truncate" title={task.title}>{task.title}</h4>
            {project && <p className="text-xs text-sky-400 mb-1 truncate" title={project.customerName}>Project: {project.customerName}</p>}
            <p className="text-xs text-slate-400 mb-2 h-10 overflow-y-auto custom-scrollbar-xs">{task.description || "No description"}</p>
            
            {assignedResource && (
                 <div className="flex items-center text-xs text-slate-500 mb-1" title={`Assigned: ${assignedResource.name}`}>
                    <UserIcon className="w-3 h-3 mr-1 text-slate-400"/> {assignedResource.name}
                </div>
            )}
            {task.dueDate && <p className="text-xs text-slate-500 mb-1">Due: {new Date(task.dueDate+"T00:00:00").toLocaleDateString()}</p>}
            <div className="text-xs text-slate-500 mb-2">Tracked: {formatTime(displayTime)}</div>


            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-600/50">
                 <button
                    onClick={() => onTimerToggle(task.id)}
                    className={`p-1 rounded-full transition-colors text-xs flex items-center ${task.isTimerRunning ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'}`}
                    aria-label={task.isTimerRunning ? "Pause timer" : "Start timer"}
                >
                    {task.isTimerRunning ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                    <span className="ml-1">{task.isTimerRunning ? 'Pause' : 'Start'}</span>
                </button>
                <div className="flex space-x-1">
                    <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-[#F29C2A] rounded-full hover:bg-slate-600/50" aria-label="Edit Task"><EditIcon className="w-3.5 h-3.5"/></button>
                    <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-600/50" aria-label="Delete Task"><TrashIcon className="w-3.5 h-3.5"/></button>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    status: TaskStatus; 
    tasks: Task[]; 
    projects: Project[];
    resources: Resource[];
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: TaskId) => void;
    onStatusChange: (taskId: TaskId, status: TaskStatus) => void;
    onTimerToggle: (taskId: TaskId) => void;
}> = ({ status, tasks, projects, resources, onEditTask, onDeleteTask, onStatusChange, onTimerToggle }) => {
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        const taskId = e.dataTransfer.getData("taskId");
        onStatusChange(taskId, status);
    };
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: TaskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    return (
        <div 
            className="bg-slate-800/70 p-3 rounded-lg w-full md:w-1/3 flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="text-lg font-semibold text-[#F29C2A] mb-3 px-1 pb-2 border-b border-slate-700">{status} ({tasks.length})</h3>
            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar-xs">
                {tasks.map(task => (
                    <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)}>
                        <KanbanTaskItem
                            task={task}
                            project={projects.find(p => p.id === task.projectId)}
                            assignedResource={resources.find(r => r.id === task.assignedResourceId)}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onTimerToggle={onTimerToggle}
                        />
                    </div>
                ))}
                {tasks.length === 0 && <p className="text-slate-500 text-xs text-center py-4">No tasks in this stage.</p>}
            </div>
        </div>
    );
};

interface KanbanViewProps {
    tasks: Task[];
    resources: Resource[];
    projects: Project[];
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: TaskId) => void;
    onStatusChange: (taskId: TaskId, status: TaskStatus) => void;
    onTimerToggle: (taskId: TaskId) => void;
    onTimeLog: (taskId: TaskId, newAccumulatedTime: number) => void; // Keep for TaskItem compatibility if needed
    viewingUser: Resource; // The user whose planner is being viewed
}

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, resources, projects, onEditTask, onDeleteTask, onStatusChange, onTimerToggle, viewingUser }) => {
    const tasksToDo = tasks.filter(t => t.status === TaskStatus.TODO).sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const tasksInProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const tasksDone = tasks.filter(t => t.status === TaskStatus.DONE).sort((a,b) => (b.dueDate || '').localeCompare(a.dueDate || ''));

    return (
        <div className="bg-slate-800/60 p-4 sm:p-6 rounded-xl shadow-xl backdrop-blur-sm">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#F29C2A] mb-4">
                Personal Planner: {viewingUser.name}
            </h2>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <KanbanColumn status={TaskStatus.TODO} tasks={tasksToDo} projects={projects} resources={resources} onEditTask={onEditTask} onDeleteTask={onDeleteTask} onStatusChange={onStatusChange} onTimerToggle={onTimerToggle} />
                <KanbanColumn status={TaskStatus.IN_PROGRESS} tasks={tasksInProgress} projects={projects} resources={resources} onEditTask={onEditTask} onDeleteTask={onDeleteTask} onStatusChange={onStatusChange} onTimerToggle={onTimerToggle} />
                <KanbanColumn status={TaskStatus.DONE} tasks={tasksDone} projects={projects} resources={resources} onEditTask={onEditTask} onDeleteTask={onDeleteTask} onStatusChange={onStatusChange} onTimerToggle={onTimerToggle} />
            </div>
        </div>
    );
};
