
// This file is effectively deprecated for the main resource list view, 
// as ResourceTree.tsx and ResourceTreeNode.tsx now handle hierarchical display.
// It might still be used if a flat list of resources is needed elsewhere,
// or it can be removed if no longer used (e.g., Allocation Overview might be updated too).

import React from 'react';
import { Resource } from '../types';
import { EditIcon, TrashIcon, UserIcon } from './icons';

interface ResourceItemProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string) => void;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({ resource, onEdit, onDelete }) => {
  return (
    <div className="bg-slate-700/80 p-4 rounded-lg shadow-lg hover:shadow-sky-500/30 transition-shadow duration-300 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center mb-2">
          <UserIcon className="w-6 h-6 text-sky-400 mr-3 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-sky-300 truncate" title={resource.name}>{resource.name}</h3>
        </div>
        <p className="text-sm text-slate-400 mb-3 truncate" title={resource.role}>{resource.role}</p>
      </div>
      <div className="flex justify-end space-x-2 mt-auto pt-2">
        <button
          onClick={() => onEdit(resource)}
          className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-600/50"
          aria-label="Edit resource"
        >
          <EditIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(resource.id)}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-600/50"
          aria-label="Delete resource"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
