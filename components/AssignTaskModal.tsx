
import React from 'react';
import { Modal } from './Modal';
import { Resource, Task, TaskId, ResourceId, TaskStatus, Project } from '../types';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Resource;
  allResources: Resource[];
  allTasks: Task[];
  projects: Project[];
  onReassignTask: (taskId: TaskId, newResourceId: ResourceId | undefined, newStatus?: TaskStatus) => void;
  getResourceHierarchy: (userId: ResourceId, allResources: Resource[]) => Resource[];
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  manager,
  allResources,
  allTasks,
  projects,
  onReassignTask,
  getResourceHierarchy,
}) => {
  const openTasksForManager = allTasks.filter(
    task => task.assignedResourceId === manager.id && (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS)
  );

  const teamMembers = getResourceHierarchy(manager.id, allResources).filter(r => r.id !== manager.id); // Exclude the manager themselves for reassignment list

  const handleAssignmentChange = (taskId: TaskId, newResourceId: ResourceId | undefined) => {
    onReassignTask(taskId, newResourceId);
  };

  const handleStatusChange = (taskId: TaskId, newStatus: TaskStatus) => {
    // Get current assignment to pass it back, as onReassignTask expects it
    const currentTask = allTasks.find(t => t.id === taskId);
    onReassignTask(taskId, currentTask?.assignedResourceId, newStatus);
  };
  
  const getProjectName = (projectId?: string) => projects.find(p => p.id === projectId)?.customerName || 'N/A';


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Open Tasks for ${manager.name}`}>
      {openTasksForManager.length === 0 ? (
        <p className="text-slate-400">No open (To Do / In Progress) tasks assigned to {manager.name}.</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-xs">
          {openTasksForManager.map(task => (
            <div key={task.id} className="p-3 bg-slate-700 rounded-lg shadow">
              <h4 className="text-md font-semibold text-[#F29C2A] truncate" title={task.title}>{task.title}</h4>
              <p className="text-xs text-sky-400 mb-1">Project: {getProjectName(task.projectId)}</p>
              <p className="text-xs text-slate-400 mb-2">Current Status: {task.status}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label htmlFor={`reassign-${task.id}`} className="block text-xs font-medium text-slate-300 mb-0.5">
                    Re-assign to:
                  </label>
                  <select
                    id={`reassign-${task.id}`}
                    value={task.assignedResourceId || ''}
                    onChange={(e) => handleAssignmentChange(task.id, e.target.value || undefined)}
                    className="bg-slate-600 border border-slate-500 text-slate-100 text-xs rounded-md focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-1.5"
                  >
                    <option value={manager.id}>{manager.name} (Keep Current)</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                    <option value="">Unassign</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`status-${task.id}`} className="block text-xs font-medium text-slate-300 mb-0.5">
                    Change Status to:
                  </label>
                  <select
                    id={`status-${task.id}`}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="bg-slate-600 border border-slate-500 text-slate-100 text-xs rounded-md focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-1.5"
                  >
                    {Object.values(TaskStatus).map(statusVal => (
                      <option key={statusVal} value={statusVal}>
                        {statusVal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
