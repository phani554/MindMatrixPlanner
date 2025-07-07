
import React, { useState, useMemo, useEffect } from 'react';
import { Resource, Task, Department, TaskStatus, ResourceId, Project, ProjectId } from '../types';
import { DownloadIcon, UserIcon, PlusIcon, EditIcon, TrashIcon } from './icons';

interface ReportViewProps {
  resources: Resource[];
  tasks: Task[];
  departments: Department[];
  projects: Project[]; 
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: ProjectId) => void;
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString?: string): string => {
    if (!dateString || dateString.toUpperCase() === 'TBD') return 'TBD';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + "T00:00:00");
        if (isNaN(date.getTime())) return dateString; 
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString; 
    }
};


const formatTimeForReport = (ms?: number) => {
    if (ms === undefined || ms === null) return '0h 0m';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const getAllTeamMembersRecursive = (leaderId: ResourceId, allResources: Resource[]): Resource[] => {
    const members: Resource[] = [];
    const queue: ResourceId[] = [leaderId]; 
    const visited: Set<ResourceId> = new Set();
    const leaderResource = allResources.find(r => r.id === leaderId);
    if (leaderResource) members.push(leaderResource); 

    while(queue.length > 0) {
        const currentId = queue.shift();
        if (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            allResources.filter(r => r.parentId === currentId).forEach(child => {
                if (!visited.has(child.id)) {
                    members.push(child);
                    queue.push(child.id);
                }
            });
        }
    }
    return members.filter((m, index, self) => index === self.findIndex(r => r.id === m.id)).sort((a,b) => a.name.localeCompare(b.name));
};


interface TaskStatusDistribution {
  status: TaskStatus;
  count: number;
  percentage: number;
  color: string;
}

interface BarChartDataItem {
  label: string;
  value: number;
  id: string;
}

type ReportTab = 'project' | 'team';


export const ReportView: React.FC<ReportViewProps> = ({ resources, tasks, departments, projects, onAddProject, onEditProject, onDeleteProject }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('team');
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(''); 
  const [selectedResourceId, setSelectedResourceId] = useState<string>(''); 
  
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectId>('');

  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<string>(formatDateForInput(oneMonthAgo));
  const [endDate, setEndDate] = useState<string>(formatDateForInput(today));

  const availableResourcesForFilter = useMemo(() => {
    if (!selectedDepartmentId) { 
        return resources.sort((a,b) => a.name.localeCompare(b.name));
    }
    const dept = departments.find(d => d.id === selectedDepartmentId);
    if (!dept) return [];
    return getAllTeamMembersRecursive(dept.leaderId, resources);
  }, [selectedDepartmentId, resources, departments]);

  useEffect(() => {
    if (selectedResourceId && !availableResourcesForFilter.find(r => r.id === selectedResourceId)) {
      setSelectedResourceId('');
    }
  }, [availableResourcesForFilter, selectedResourceId]);

  const filteredTasksByDate = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00Z') : (task.startDate ? new Date(task.startDate + 'T00:00:00Z') : null);
      const start = startDate ? new Date(startDate + 'T00:00:00Z') : null;
      const end = endDate ? new Date(endDate + 'T23:59:59Z') : null;
      
      if (!taskDate) return !(start || end); 

      let dateMatch = true;
      if (start && taskDate < start) dateMatch = false;
      if (end && taskDate > end) dateMatch = false;
      return dateMatch;
    });
  }, [tasks, startDate, endDate]);

  // Data for Team Level Report
  const teamReportData = useMemo(() => {
    let tasksToAnalyze = filteredTasksByDate;
    let resourcesToDisplay: Resource[] = [];
    let reportTitle = "Global Report";
    let viewMode: 'global' | 'department' | 'resource' = 'global';

    if (selectedResourceId) {
        tasksToAnalyze = tasksToAnalyze.filter(t => t.assignedResourceId === selectedResourceId);
        const res = resources.find(r => r.id === selectedResourceId);
        if (res) {
            resourcesToDisplay = [res];
            reportTitle = `Report for ${res.name}`;
        }
        viewMode = 'resource';
    } else if (selectedDepartmentId) {
        const dept = departments.find(d => d.id === selectedDepartmentId);
        if (dept) {
            resourcesToDisplay = getAllTeamMembersRecursive(dept.leaderId, resources);
            const resourceIdsInDept = new Set(resourcesToDisplay.map(r => r.id));
            tasksToAnalyze = tasksToAnalyze.filter(t => t.assignedResourceId && resourceIdsInDept.has(t.assignedResourceId!));
            reportTitle = `Report for ${dept.name} Department`;
        }
        viewMode = 'department';
    } else { 
        resourcesToDisplay = resources; 
        reportTitle = "Global Resources Report";
        viewMode = 'global';
    }

    const totalTasks = tasksToAnalyze.length;
    const statusCounts = tasksToAnalyze.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<TaskStatus, number>);

    const statusDistribution: TaskStatusDistribution[] = Object.values(TaskStatus).map(status => ({
        status,
        count: statusCounts[status] || 0,
        percentage: totalTasks > 0 ? parseFloat(((statusCounts[status] || 0) / totalTasks * 100).toFixed(1)) : 0,
        color: status === TaskStatus.DONE ? 'bg-green-500' : status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-500',
    }));
    
    let barChartData: BarChartDataItem[] = [];
    if (viewMode === 'department' && resourcesToDisplay.length > 0) {
        barChartData = resourcesToDisplay.map(res => ({
            id: res.id,
            label: res.name,
            value: tasksToAnalyze.filter(t => t.assignedResourceId === res.id).length,
        })).sort((a,b) => b.value - a.value);
    } else if (viewMode === 'global') {
         barChartData = departments.map(dept => {
            const deptMembers = getAllTeamMembersRecursive(dept.leaderId, resources);
            const deptMemberIds = new Set(deptMembers.map(m => m.id));
            return {
                id: dept.id,
                label: dept.name,
                value: tasksToAnalyze.filter(t => t.assignedResourceId && deptMemberIds.has(t.assignedResourceId!)).length,
            };
        }).sort((a,b) => b.value - a.value);
    }
    return { tasksToAnalyze, resourcesToDisplay, reportTitle, statusDistribution, barChartData, viewMode };
  }, [filteredTasksByDate, selectedDepartmentId, selectedResourceId, resources, departments]);

  // Data for Project Level Report
  const projectReportData = useMemo(() => {
    if (!selectedProjectId) return null;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return null;

    const projectTasks = filteredTasksByDate.filter(task => task.projectId === selectedProjectId);
    const totalProjectTasksInDateRange = projectTasks.length;
    const openTasksInDateRange = projectTasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
    
    const statusCounts = projectTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {} as Record<TaskStatus, number>);

    const statusDistribution: TaskStatusDistribution[] = Object.values(TaskStatus).map(status => ({
        status,
        count: statusCounts[status] || 0,
        percentage: totalProjectTasksInDateRange > 0 ? parseFloat(((statusCounts[status] || 0) / totalProjectTasksInDateRange * 100).toFixed(1)) : 0,
        color: status === TaskStatus.DONE ? 'bg-green-500' : status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-500',
    }));
    
    const contributingResources = new Set(projectTasks.map(t => t.assignedResourceId).filter(Boolean));
    const barChartDataProject: BarChartDataItem[] = Array.from(contributingResources).map(resId => {
        const resource = resources.find(r => r.id === resId);
        return {
            id: resId!,
            label: resource?.name || "Unassigned",
            value: projectTasks.filter(t => t.assignedResourceId === resId).length
        }
    }).sort((a,b) => b.value - a.value);


    return { project, tasks: projectTasks, statusDistribution, barChartData: barChartDataProject, totalTasksInDateRange: totalProjectTasksInDateRange, openTasksInDateRange };
  }, [selectedProjectId, filteredTasksByDate, projects, resources]);


  const getTeamLead = (resource: Resource): Resource | undefined => {
    if (!resource.parentId) return undefined;
    return resources.find(r => r.id === resource.parentId);
  };
  
  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-2.5 placeholder-slate-400";

  const handleExportToCSV = () => {
    let headers: string[];
    let rows: string[][];
    let fileNameSuffix = "";

    if (activeTab === 'project' && projectReportData) {
        headers = ["Task Title", "Assigned Resource", "Status", "Priority", "Due Date", "Hours Spent", "Time Tracked"];
        rows = projectReportData.tasks.map(task => {
            const assignedRes = resources.find(r => r.id === task.assignedResourceId);
            return [
                task.title,
                assignedRes?.name || 'N/A',
                task.status,
                task.priority,
                task.dueDate ? formatDisplayDate(task.dueDate) : 'N/A',
                String(task.hoursSpent || 0) + 'h',
                formatTimeForReport(task.accumulatedTime)
            ];
        });
        fileNameSuffix = `project_${projectReportData.project.customerName.replace(/\s/g, '_')}`;
    } else if (activeTab === 'team') {
        const { resourcesToDisplay, viewMode, tasksToAnalyze } = teamReportData;
        if ((viewMode === 'department' || viewMode === 'resource') && resourcesToDisplay.length === 0) {
            alert("No data to export for the current team selection.");
            return;
        }

        if (viewMode === 'resource' && resourcesToDisplay.length === 1) {
            headers = ["Task Title", "Project", "Status", "Priority", "Due Date", "Hours Spent", "Time Tracked"];
            rows = tasksToAnalyze.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return [
                    task.title,
                    project?.customerName || 'N/A',
                    task.status,
                    task.priority,
                    task.dueDate ? formatDisplayDate(task.dueDate) : 'N/A',
                    String(task.hoursSpent || 0) + 'h',
                    formatTimeForReport(task.accumulatedTime)
                ];
            });
             fileNameSuffix = `team_resource_${resourcesToDisplay[0].name.replace(/\s/g, '_')}`;
        } else { 
            headers = [
                "Team Member", "Role", "Reports To (Lead)", "Department",
                "Tasks Done", "Tasks In Progress", "Tasks ToDo", "Total Tasks Assigned", "Tasks Delayed",
                "Hours Spent (Logged)", "Time Tracked (Timer)"
            ];
            const targetResourcesForTable = (viewMode === 'department') ? resourcesToDisplay : resources; 

            rows = targetResourcesForTable.map(member => {
                const memberTasks = filteredTasksByDate.filter(t => t.assignedResourceId === member.id); 
                const tasksDone = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
                const tasksInProgress = memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
                const tasksTodo = memberTasks.filter(t => t.status === TaskStatus.TODO).length;
                const tasksDelayed = memberTasks.filter(t => 
                    t.dueDate && new Date(t.dueDate + "T23:59:59Z") < new Date() && t.status !== TaskStatus.DONE
                ).length;
                const totalHoursSpent = memberTasks.reduce((sum, t) => sum + (t.hoursSpent || 0), 0);
                const totalAccumulatedTime = memberTasks.reduce((sum, t) => sum + (t.accumulatedTime || 0), 0);
                const teamLead = getTeamLead(member);
                const department = departments.find(dep => getAllTeamMembersRecursive(dep.leaderId, resources).some(mem => mem.id === member.id));

                return [
                    member.name,
                    member.role,
                    teamLead ? teamLead.name : 'N/A',
                    department ? department.name : 'N/A',
                    tasksDone,
                    tasksInProgress,
                    tasksTodo,
                    memberTasks.length,
                    tasksDelayed,
                    totalHoursSpent > 0 ? `${totalHoursSpent}h` : '-',
                    formatTimeForReport(totalAccumulatedTime) !== '0h 0m' ? formatTimeForReport(totalAccumulatedTime) : '-'
                ].map(String);
            });
             fileNameSuffix = viewMode === 'department' ? `team_department_${departments.find(d=>d.id === selectedDepartmentId)?.name.replace(/\s/g, '_')}` : 'team_global';
        }
    } else {
        alert("No active report tab or data to export.");
        return;
    }

    let csvContent = headers.join(",") + "\n";
    rows.forEach(rowArray => {
        let row = rowArray.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",");
        csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `mindmatrix_report_${fileNameSuffix}_${startDate}_to_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };

  const renderSimpleBarChart = (data: BarChartDataItem[], title: string) => {
    if (!data || data.length === 0) return <p className="text-slate-500">No data for {title}.</p>;
    const maxValue = Math.max(...data.map(item => item.value), 0);
    return (
        <div>
            <h4 className="text-md font-semibold text-slate-200 mb-2">{title}</h4>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.id} className="flex items-center">
                        <div className="w-1/3 text-xs text-slate-400 truncate pr-2" title={item.label}>{item.label}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="h-4 bg-[#F29C2A] rounded-sm" style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}></div>
                            <span className="text-xs text-slate-300 ml-2">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void;}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
        ${isActive ? 'bg-slate-700 text-[#F29C2A]' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="space-y-6 bg-slate-800/70 p-4 sm:p-6 rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
        <div className="flex border-b border-slate-600">
            <TabButton label="Team Level Performance" isActive={activeTab === 'team'} onClick={() => setActiveTab('team')} />
            <TabButton label="Project Level Report" isActive={activeTab === 'project'} onClick={() => setActiveTab('project')} />
        </div>
        <div className="flex items-center space-x-3 mt-3 sm:mt-0">
            {activeTab === 'project' && (
                <button
                    onClick={onAddProject}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:shadow-blue-500/40 transition-all duration-200 ease-in-out flex items-center space-x-2 text-sm"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Project</span>
                </button>
            )}
            <button
              onClick={handleExportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:shadow-green-500/40 transition-all duration-200 ease-in-out flex items-center space-x-2 text-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
        </div>
      </div>
      
      {/* Common Filters: Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end pt-2">
         {activeTab === 'team' && (
            <>
             <div>
                <label htmlFor="departmentSelect" className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <select id="departmentSelect" value={selectedDepartmentId} onChange={(e) => {setSelectedDepartmentId(e.target.value); setSelectedResourceId('');}} className={inputClass}>
                    <option value="">All Departments</option>
                    {departments.map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                </select>
                </div>
                <div>
                <label htmlFor="resourceSelect" className="block text-sm font-medium text-slate-300 mb-1">Resource</label>
                <select id="resourceSelect" value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} className={inputClass} disabled={availableResourcesForFilter.length === 0 && !!selectedDepartmentId}>
                    <option value="">All Resources</option>
                    {availableResourcesForFilter.map(res => (<option key={res.githubId} value={res.githubId}>{res.name}</option>))}
                </select>
            </div>
            </>
         )}
         {activeTab === 'project' && (
            <div>
                <label htmlFor="projectSelectReport" className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                <select id="projectSelectReport" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className={inputClass}>
                    <option value="">Select a Project</option>
                    {projects.sort((a,b) => a.customerName.localeCompare(b.customerName)).map(proj => (<option key={proj.id} value={proj.id}>{proj.customerName}</option>))}
                </select>
            </div>
         )}
         <div className={activeTab === 'project' ? "md:col-start-2" : ""}>
            <label htmlFor="reportStartDate" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
            <input type="date" id="reportStartDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass}/>
            </div>
            <div>
            <label htmlFor="reportEndDate" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
            <input type="date" id="reportEndDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass}/>
         </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'team' && (
        <>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#F29C2A] border-b border-slate-700 pb-3 mb-4">{teamReportData.reportTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3">Task Status Overview</h3>
                    {teamReportData.statusDistribution.reduce((sum, s) => sum + s.count, 0) > 0 ? 
                    teamReportData.statusDistribution.map(s => (
                        <div key={s.status} className="flex justify-between items-center text-sm mb-1">
                            <span className="flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-2 ${s.color}`}></span>
                                {s.status}
                            </span>
                            <span className="text-slate-300">{s.count} ({s.percentage}%)</span>
                        </div>
                    )) : <p className="text-slate-500">No tasks match filters.</p>}
                </div>
                <div className="md:col-span-2 bg-slate-700/50 p-4 rounded-lg">
                    {teamReportData.viewMode === 'department' && renderSimpleBarChart(teamReportData.barChartData, 'Tasks per Member')}
                    {teamReportData.viewMode === 'global' && renderSimpleBarChart(teamReportData.barChartData, 'Tasks per Department')}
                    {teamReportData.viewMode === 'resource' && (
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-3">Resource Task Summary</h3>
                        <p className="text-sm text-slate-300">Total Tasks: {teamReportData.tasksToAnalyze.length}</p>
                    </div>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg shadow-md">
                {teamReportData.viewMode === 'resource' && teamReportData.resourcesToDisplay.length === 1 ? (
                    <table className="w-full text-sm text-left text-slate-300">
                        <caption className="caption-top text-lg font-semibold text-slate-100 p-2">Tasks for {teamReportData.resourcesToDisplay[0].name}</caption>
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Title</th>
                                <th scope="col" className="px-4 py-3">Project</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3">Priority</th>
                                <th scope="col" className="px-4 py-3">Due Date</th>
                                <th scope="col" className="px-4 py-3 text-right">Hours Logged</th>
                                <th scope="col" className="px-4 py-3 text-right">Time Tracked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamReportData.tasksToAnalyze.length > 0 ? teamReportData.tasksToAnalyze.map(task => {
                                const project = projects.find(p => p.id === task.projectId);
                                return (
                                <tr key={task.id} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/50">
                                    <td className="px-4 py-3 font-medium text-slate-200">{task.title}</td>
                                    <td className="px-4 py-3">{project?.customerName || 'N/A'}</td>
                                    <td className="px-4 py-3">{task.status}</td>
                                    <td className="px-4 py-3">{task.priority}</td>
                                    <td className="px-4 py-3">{task.dueDate ? formatDisplayDate(task.dueDate) : 'N/A'}</td>
                                    <td className="px-4 py-3 text-right">{task.hoursSpent || 0}h</td>
                                    <td className="px-4 py-3 text-right">{formatTimeForReport(task.accumulatedTime)}</td>
                                </tr>
                                );
                            }) : (
                                <tr><td colSpan={7} className="text-center py-4 text-slate-500">No tasks for this resource in the selected period.</td></tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm text-left text-slate-300">
                        <caption className="caption-top text-lg font-semibold text-slate-100 p-2">
                            {teamReportData.viewMode === 'department' ? `Member Summary for ${departments.find(d=>d.id === selectedDepartmentId)?.name}` : "All Resources Summary"}
                        </caption>
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Team Member</th>
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3">Reports To</th>
                                {teamReportData.viewMode === 'global' && <th scope="col" className="px-4 py-3">Department</th>}
                                <th scope="col" className="px-4 py-3 text-center">Done</th>
                                <th scope="col" className="px-4 py-3 text-center">In Progress</th>
                                <th scope="col" className="px-4 py-3 text-center">To Do</th>
                                <th scope="col" className="px-4 py-3 text-center">Total Assigned</th>
                                <th scope="col" className="px-4 py-3 text-center">Delayed</th>
                                <th scope="col" className="px-4 py-3 text-center">Logged Hours</th>
                                <th scope="col" className="px-4 py-3 text-center">Tracked Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(teamReportData.viewMode === 'department' ? teamReportData.resourcesToDisplay : resources).map(member => {
                                const memberTasks = filteredTasksByDate.filter(t => t.assignedResourceId === member.githubId);
                                const tasksDone = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
                                const tasksInProgress = memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
                                const tasksTodo = memberTasks.filter(t => t.status === TaskStatus.TODO).length;
                                const tasksDelayed = memberTasks.filter(t => t.dueDate && new Date(t.dueDate + "T23:59:59Z") < new Date() && t.status !== TaskStatus.DONE).length;
                                const totalHoursSpent = memberTasks.reduce((sum, t) => sum + (t.hoursSpent || 0), 0);
                                const totalAccumulatedTime = memberTasks.reduce((sum, t) => sum + (t.accumulatedTime || 0), 0);
                                const teamLead = getTeamLead(member);
                                const departmentAffiliation = teamReportData.viewMode === 'global' ? departments.find(dep => getAllTeamMembersRecursive(dep.leaderId, resources).some(mem => mem.id === member.id)) : undefined;

                                return (
                                <tr key={member.githubId} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/50">
                                    <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{member.name}</td>
                                    <td className="px-4 py-3">{member.role}</td>
                                    <td className="px-4 py-3">{teamLead ? teamLead.name : 'N/A'}</td>
                                    {teamReportData.viewMode === 'global' && <td className="px-4 py-3">{departmentAffiliation ? departmentAffiliation.name : 'N/A'}</td>}
                                    <td className="px-4 py-3 text-center">{tasksDone}</td> // closed issues
                                    <td className="px-4 py-3 text-center">{tasksInProgress}</td> // open issues 
                                    <td className="px-4 py-3 text-center">{tasksTodo}</td>//  open issue with on-hold or in-discussion
                                    <td className="px-4 py-3 text-center">{memberTasks.length}</td> // total issues open
                                    <td className={`px-4 py-3 text-center ${tasksDelayed > 0 ? 'text-red-400 font-semibold' : ''}`}>{tasksDelayed}</td>
                                    <td className="px-4 py-3 text-center">{totalHoursSpent > 0 ? `${totalHoursSpent}h` : '-'}</td>
                                    <td className="px-4 py-3 text-center">{formatTimeForReport(totalAccumulatedTime) !== '0h 0m' ? formatTimeForReport(totalAccumulatedTime) : '-'}</td>
                                </tr>
                                );
                            })}
                            {(teamReportData.viewMode === 'department' && teamReportData.resourcesToDisplay.length === 0) && <tr><td colSpan={10} className="text-center py-4 text-slate-500">No members in this department.</td></tr>}
                            {(teamReportData.viewMode === 'global' && resources.length === 0) && <tr><td colSpan={11} className="text-center py-4 text-slate-500">No resources found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </>
      )} // end of team report
      {activeTab === 'project' && (
        <>
            {!projectReportData && <p className="text-slate-400 text-center py-6">Please select a project to view its report.</p>}
            {projectReportData && (
                <>
                    <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold text-[#F29C2A]">Report for: {projectReportData.project.customerName}</h2>
                        <div className="flex space-x-2">
                             <button
                                onClick={() => onEditProject(projectReportData.project)}
                                className="p-1.5 text-slate-400 hover:text-[#F29C2A] transition-colors rounded-full hover:bg-slate-600/50"
                                aria-label={`Edit project ${projectReportData.project.customerName}`}
                            >
                                <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDeleteProject(projectReportData.project.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-600/50"
                                aria-label={`Delete project ${projectReportData.project.customerName}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-lg space-y-2">
                            <h3 className="text-lg font-semibold text-slate-100">Project Details</h3>
                            <p className="text-sm text-slate-300"><strong>Status:</strong> {projectReportData.project.overallStatus}</p>
                            <p className="text-sm text-slate-300"><strong>Completion:</strong> {projectReportData.project.percentageCompletion}</p>
                            <p className="text-sm text-slate-300"><strong>SOW Date:</strong> {formatDisplayDate(projectReportData.project.sowExecutionDate)}</p>
                            <p className="text-sm text-slate-300"><strong>Total Tasks (in range):</strong> {projectReportData.totalTasksInDateRange}</p>
                            <p className="text-sm text-slate-300"><strong>Open Tasks (in range):</strong> <span className={projectReportData.openTasksInDateRange > 0 ? "text-yellow-400 font-semibold" : ""}>{projectReportData.openTasksInDateRange}</span></p>
                        </div>
                         <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-100 mb-3">Task Status Overview</h3>
                            {projectReportData.statusDistribution.reduce((sum, s) => sum + s.count, 0) > 0 ? 
                            projectReportData.statusDistribution.map(s => (
                                <div key={s.status} className="flex justify-between items-center text-sm mb-1">
                                    <span className="flex items-center">
                                        <span className={`w-3 h-3 rounded-full mr-2 ${s.color}`}></span>
                                        {s.status}
                                    </span>
                                    <span className="text-slate-300">{s.count} ({s.percentage}%)</span>
                                </div>
                            )) : <p className="text-slate-500">No tasks for this project in the selected period.</p>}
                        </div>
                        <div className="md:col-span-1 bg-slate-700/50 p-4 rounded-lg">
                            {renderSimpleBarChart(projectReportData.barChartData, 'Tasks per Assigned Resource')}
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg shadow-md">
                        <table className="w-full text-sm text-left text-slate-300">
                            <caption className="caption-top text-lg font-semibold text-slate-100 p-2">Tasks for {projectReportData.project.customerName}</caption>
                            <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Title</th>
                                    <th scope="col" className="px-4 py-3">Assigned To</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Due Date</th>
                                    <th scope="col" className="px-4 py-3 text-right">Hours Logged</th>
                                    <th scope="col" className="px-4 py-3 text-right">Time Tracked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projectReportData.tasks.length > 0 ? projectReportData.tasks.map(task => {
                                    const assignedRes = resources.find(r => r.id === task.assignedResourceId);
                                    return (
                                    <tr key={task.id} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/50">
                                        <td className="px-4 py-3 font-medium text-slate-200">{task.title}</td>
                                        <td className="px-4 py-3">{assignedRes?.name || 'N/A'}</td>
                                        <td className="px-4 py-3">{task.status}</td>
                                        <td className="px-4 py-3">{task.dueDate ? formatDisplayDate(task.dueDate) : 'N/A'}</td>
                                        <td className="px-4 py-3 text-right">{task.hoursSpent || 0}h</td>
                                        <td className="px-4 py-3 text-right">{formatTimeForReport(task.accumulatedTime)}</td>
                                    </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={6} className="text-center py-4 text-slate-500">No tasks for this project in the selected period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
      )}
    </div>
  );
};