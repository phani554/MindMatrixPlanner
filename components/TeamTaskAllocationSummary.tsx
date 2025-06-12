
import React from 'react';
import { Resource, Task, TaskStatus, ResourceId } from '../types';
import { UserIcon } from './icons';

interface TeamTaskAllocationSummaryProps {
  teamMembers: Resource[];
  tasks: Task[]; // Should be all tasks, filtering will happen here
  title?: string;
  onSelectUser: (userId: ResourceId) => void; // New prop for navigation
}

export const TeamTaskAllocationSummary: React.FC<TeamTaskAllocationSummaryProps> = ({
  teamMembers,
  tasks,
  title = "Team Task Allocation Summary",
  onSelectUser,
}) => {
  if (!teamMembers || teamMembers.length === 0) {
    return <p className="text-slate-500 text-sm">{title}: No team members to display.</p>;
  }

  const memberStats = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignedResourceId === member.id);
    const toDoCount = memberTasks.filter(t => t.status === TaskStatus.TODO).length;
    const inProgressCount = memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const doneCount = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
    const totalTasks = memberTasks.length;
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      toDoCount,
      inProgressCount,
      doneCount,
      totalTasks
    };
  }).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <section className="bg-slate-800/60 p-4 sm:p-6 rounded-xl shadow-xl backdrop-blur-sm mt-6">
      <h3 className="text-lg font-semibold text-sky-300 mb-4">{title}</h3>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">Team Member</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3 text-center">To Do / Pending</th>
              <th scope="col" className="px-4 py-3 text-center">In Progress</th>
              <th scope="col" className="px-4 py-3 text-center">Completed</th>
              <th scope="col" className="px-4 py-3 text-center">Total Tasks</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map(member => (
              <tr key={member.id} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/60 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-100 whitespace-nowrap">
                  <button
                    onClick={() => onSelectUser(member.id)}
                    className="flex items-center text-left hover:text-[#F29C2A] focus:outline-none focus:text-[#F29C2A] transition-colors"
                    aria-label={`View planner for ${member.name}`}
                  >
                    <UserIcon className="w-4 h-4 mr-2 text-[#F29C2A] flex-shrink-0" />
                    {member.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-400">{member.role}</td>
                <td className="px-4 py-3 text-center font-medium text-yellow-400">{member.toDoCount}</td>
                <td className="px-4 py-3 text-center font-medium text-blue-400">{member.inProgressCount}</td>
                <td className="px-4 py-3 text-center font-medium text-green-400">{member.doneCount}</td>
                <td className="px-4 py-3 text-center font-semibold">{member.totalTasks}</td>
              </tr>
            ))}
            {memberStats.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-500">
                        No team members with tasks for this view.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
