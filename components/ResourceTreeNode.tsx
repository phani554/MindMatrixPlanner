
import React, { useMemo } from 'react'; 
import { Resource, ResourceId, Task, TaskStatus } from '../types'; 
import { EditIcon, TrashIcon, UserIcon } from './icons';

// Props for the ResourceTreeNode
interface ResourceTreeNodeProps {
  resource: Resource;
  allResources: Resource[]; 
  tasks: Task[]; 
  level: number;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: ResourceId) => void;
  onToggleExpand: (resourceId: ResourceId) => void;
  isExpanded: boolean; 
  buildTree: (parentId?: ResourceId) => Resource[]; 
  expandedNodes: Set<ResourceId>; 
  onOpenAssignTaskModal: (manager: Resource) => void; // New prop
}

// This is the consolidated and corrected ResourceTreeNode component
export const ResourceTreeNode: React.FC<ResourceTreeNodeProps> = ({
  resource,
  allResources,
  tasks, 
  level,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  buildTree,
  expandedNodes,
  onOpenAssignTaskModal // Destructure new prop
}) => {
  const children = buildTree(resource.id);
  const hasChildren = children.length > 0;

  const openTaskCount = useMemo(() => {
    return tasks.filter(task => 
        task.assignedResourceId === resource.id && 
        (task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS)
    ).length;
  }, [tasks, resource.id]);

  const ChevronIcon: React.FC<{ expanded: boolean, className?: string }> = ({ expanded, className = "w-4 h-4 text-slate-400 transition-transform duration-200" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} ${expanded ? 'rotate-90' : ''}`}>
      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  );

  const handleOpenTasksClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering expand/collapse if the badge is part of the main div
    if (openTaskCount > 0) {
        onOpenAssignTaskModal(resource);
    }
  };

  return (
    <div>
      <div 
        className="flex items-center p-2 rounded-md hover:bg-slate-700/70 transition-colors group"
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleExpand(resource.id);}}
            className="mr-2 p-0.5 rounded-full hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-[#F29C2A]" 
            aria-label={isExpanded ? `Collapse ${resource.name}` : `Expand ${resource.name}`}
            aria-expanded={isExpanded}
          >
            <ChevronIcon expanded={isExpanded} />
          </button>
        ) : (
          <span className="w-5 mr-2"></span> 
        )}
        <UserIcon className="w-5 h-5 text-[#F29C2A] mr-2 flex-shrink-0" /> 
        <div className="flex-grow overflow-hidden">
          <p className="text-sm font-medium text-[#F29C2A] truncate" title={resource.name}>{resource.name}</p> 
          <div className="flex items-center">
            <p className="text-xs text-slate-400 truncate" title={resource.role}>{resource.role}</p>
            <button
                onClick={handleOpenTasksClick}
                disabled={openTaskCount === 0}
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full text-white transition-colors
                            ${openTaskCount > 5 ? 'bg-red-500 hover:bg-red-600' : 
                              openTaskCount > 0 ? 'bg-yellow-600 hover:bg-yellow-700' : 
                              'bg-green-600 cursor-default'}
                            ${openTaskCount > 0 ? 'hover:shadow-md' : ''}`}
                aria-label={`Manage ${openTaskCount} open tasks for ${resource.name}`}
            >
              Open: {openTaskCount}
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(resource);}}
            className="p-1.5 text-slate-400 hover:text-[#F29C2A] transition-colors rounded-full hover:bg-slate-600/50 focus:outline-none focus:ring-1 focus:ring-[#F29C2A]" 
            aria-label={`Edit ${resource.name}`}
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(resource.id);}}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-600/50 focus:outline-none focus:ring-1 focus:ring-red-500" 
            aria-label={`Delete ${resource.name}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {children.map(child => (
            <ResourceTreeNode 
              key={child.id}
              resource={child}
              allResources={allResources}
              tasks={tasks} 
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              isExpanded={expandedNodes.has(child.id)} 
              buildTree={buildTree}
              expandedNodes={expandedNodes} 
              onOpenAssignTaskModal={onOpenAssignTaskModal} // Pass down
            />
          ))}
        </div>
      )}
    </div>
  );
};
