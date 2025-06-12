
import React, { useState } from 'react';
import { Resource, ResourceId, Department, Task } from '../types'; // Added Task
import { ResourceTreeNode } from './ResourceTreeNode';
import { UserIcon, EditIcon, TrashIcon } from './icons'; // For department leader icon and edit/delete

interface ResourceTreeProps {
  resources: Resource[];
  tasks: Task[]; 
  departments: Department[];
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: ResourceId) => void;
  onEditDepartment: (department: Department) => void; 
  onDeleteDepartment: (departmentId: string) => void; 
  onOpenAssignTaskModal: (manager: Resource) => void; // New prop
}

export const ResourceTree: React.FC<ResourceTreeProps> = ({ resources, tasks, departments, onEdit, onDelete, onEditDepartment, onDeleteDepartment, onOpenAssignTaskModal }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<ResourceId>>(new Set());

  const handleToggleExpand = (resourceId: ResourceId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  // This function now also builds the tree for a specific leader within a department context
  const buildTree = (parentId?: ResourceId): Resource[] => {
    return resources
      .filter(resource => resource.parentId === parentId)
      .sort((a,b) => a.name.localeCompare(b.name));
  };

  if (resources.length === 0 && departments.length === 0) {
    return null; 
  }

  return (
    <div className="space-y-4">
      {departments.map(dept => {
        const leader = dept.leaderId ? resources.find(r => r.id === dept.leaderId) : undefined;
        
        return (
          <div key={dept.id} className="p-1 rounded-lg group">
            <div className="flex items-center justify-between mb-2 border-b border-slate-600 pb-2 pt-1 px-2">
                <div className="flex items-center">
                    <UserIcon className="w-6 h-6 text-[#F29C2A] mr-2 flex-shrink-0"/>
                    <h3 className="text-lg font-semibold text-[#F29C2A]">{dept.name} 
                        {leader && <span className="text-sm text-slate-400"> ({leader.name})</span>}
                        {!leader && <span className="text-sm text-slate-500 italic"> (No Leader)</span>}
                    </h3>
                </div>
                 <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEditDepartment(dept)}
                        className="p-1.5 text-slate-400 hover:text-[#F29C2A] transition-colors rounded-full hover:bg-slate-600/50 focus:outline-none focus:ring-1 focus:ring-[#F29C2A]"
                        aria-label={`Edit department ${dept.name}`}
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDeleteDepartment(dept.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-600/50 focus:outline-none focus:ring-1 focus:ring-red-500"
                        aria-label={`Delete department ${dept.name}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {leader && (
                <ResourceTreeNode
                  key={leader.id}
                  resource={leader}
                  allResources={resources}
                  tasks={tasks} 
                  level={0} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleExpand={handleToggleExpand}
                  isExpanded={expandedNodes.has(leader.id)}
                  buildTree={buildTree}
                  expandedNodes={expandedNodes}
                  onOpenAssignTaskModal={onOpenAssignTaskModal} // Pass down
                />
            )}
             {!leader && dept.leaderId && <p className="text-xs text-slate-500 pl-2">Leader (ID: {dept.leaderId}) not found in resources.</p>}
             {!leader && !dept.leaderId && resources.filter(r => r.parentId === dept.id).length > 0 && ( /* Check if this was an old pattern */
                <p className="text-xs text-slate-500 pl-2">This department has no assigned leader, but may have direct reports assigned via old parentId structure.</p>
             )}
          </div>
        );
      })}
      {/* Render resources that don't belong to any defined department (orphans or unassigned top levels) */}
      {resources.filter(r => !r.parentId && !departments.some(d => d.leaderId === r.id)).map(orphanResource => (
         <div key={`orphan_dept_${orphanResource.id}`} className="mt-4 p-1 rounded-lg">
            <div className="flex items-center mb-2 border-b border-slate-600 pb-2 pt-1 px-2">
                <UserIcon className="w-6 h-6 text-slate-500 mr-2 flex-shrink-0"/>
                <h3 className="text-lg font-semibold text-slate-400">Other Top-Level <span className="text-sm text-slate-500">({orphanResource.name})</span></h3>
            </div>
            <ResourceTreeNode
              key={orphanResource.id}
              resource={orphanResource}
              allResources={resources}
              tasks={tasks} 
              level={0}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={handleToggleExpand}
              isExpanded={expandedNodes.has(orphanResource.id)}
              buildTree={buildTree}
              expandedNodes={expandedNodes}
              onOpenAssignTaskModal={onOpenAssignTaskModal} // Pass down
            />
        </div>
      ))}
    </div>
  );
};
