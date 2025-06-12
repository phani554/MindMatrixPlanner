import React, { useState, useEffect } from 'react';
import { Department, Resource, ResourceId } from '../types';

interface DepartmentFormProps {
  onSubmit: (department: Omit<Department, 'id'> | Department) => void;
  initialData?: Department | null;
  resources: Resource[]; // To select a leader
  onClose: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ onSubmit, initialData, resources, onClose }) => {
  const [name, setName] = useState('');
  const [leaderId, setLeaderId] = useState<ResourceId | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLeaderId(initialData.leaderId);
    } else {
      setName('');
      setLeaderId(undefined);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Department Name is required.");
      return;
    }
    const departmentData = {
      name,
      leaderId: leaderId === "" ? undefined : leaderId,
    };
    onSubmit(initialData ? { ...initialData, ...departmentData } : departmentData);
    onClose();
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="departmentName" className={labelClass}>Department Name</label>
        <input type="text" id="departmentName" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g., Marketing" required />
      </div>
      <div>
        <label htmlFor="departmentLeader" className={labelClass}>Department Leader (Optional)</label>
        <select id="departmentLeader" value={leaderId || ''} onChange={(e) => setLeaderId(e.target.value || undefined)} className={inputClass}>
          <option value="">None</option>
          {resources.sort((a,b) => a.name.localeCompare(b.name)).map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#F29C2A] hover:bg-[#EE4D1E] rounded-lg transition-colors shadow-md focus:ring-2 focus:ring-[#F29C2A] focus:ring-opacity-50"
        >
          {initialData ? 'Save Changes' : 'Add Department'}
        </button>
      </div>
    </form>
  );
};
