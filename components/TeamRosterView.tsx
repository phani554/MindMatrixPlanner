
import React, { useState, useMemo } from 'react';
import { Resource, Department } from '../types';
import { EditIcon, UserIcon } from './icons';

interface TeamRosterViewProps {
  resources: Resource[];
  departments: Department[];
  onEditResource: (resource: Resource) => void;
}

// Helper to find the department a resource belongs to
const getResourceDepartment = (resource: Resource, resources: Resource[], departments: Department[]): Department | undefined => {
  if (!resource.id) return undefined;

  let current: Resource | undefined = resource;
  while (current) {
    const dept = departments.find(d => d.leaderId === current!.id);
    if (dept) return dept;
    if (!current.parentId) return undefined; // Reached a top-level resource not a dept leader
    current = resources.find(r => r.id === current!.parentId);
  }
  return undefined;
};

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({ resources, departments, onEditResource }) => {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  const filteredResources = useMemo(() => {
    if (!selectedDepartmentId) {
      return resources.sort((a, b) => a.name.localeCompare(b.name));
    }
    const selectedDept = departments.find(d => d.id === selectedDepartmentId);
    if (!selectedDept) return [];

    const members: Resource[] = [];
    const queue: string[] = [selectedDept.leaderId];
    const visited: Set<string> = new Set();

    while(queue.length > 0) {
        const currentId = queue.shift();
        if (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const member = resources.find(r => r.id === currentId);
            if (member) {
                members.push(member);
                resources.filter(r => r.parentId === currentId).forEach(child => queue.push(child.id));
            }
        }
    }
    return members.sort((a,b) => a.name.localeCompare(b.name));
  }, [resources, selectedDepartmentId, departments]);
  
  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-2.5 placeholder-slate-400"; // Updated focus colors

  return (
    <div className="space-y-6 bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-semibold text-[#F29C2A] mb-3 sm:mb-0">Team Roster</h2> {/* Updated title color */}
        <div>
          <label htmlFor="departmentFilterRoster" className="block text-sm font-medium text-slate-300 mb-1">Filter by Department</label>
          <select
            id="departmentFilterRoster"
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className={`${inputClass} min-w-[200px]`}
          >
            <option value="">All Resources</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700/80"> {/* Updated header text color */}
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Department</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">Joining Date</th>
                <th scope="col" className="px-4 py-3">Birth Date</th>
                <th scope="col" className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(member => {
                const department = getResourceDepartment(member, resources, departments);
                return (
                  <tr key={member.id} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100 whitespace-nowrap flex items-center">
                        <UserIcon className="w-4 h-4 mr-2 text-[#F29C2A] flex-shrink-0"/> {/* Updated icon color */}
                        {member.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{member.role}</td>
                    <td className="px-4 py-3 text-slate-400">{department?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-400">{member.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{member.contactNumber || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{member.joiningDate ? new Date(member.joiningDate + "T00:00:00").toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{member.birthDate || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onEditResource(member)}
                        className="p-1.5 text-slate-400 hover:text-[#F29C2A] transition-colors rounded-full hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-[#F29C2A]" // Updated hover and ring color
                        aria-label={`Edit ${member.name}`}
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500 text-center py-8">
          No resources match the current filter or no resources available.
        </p>
      )}
    </div>
  );
};