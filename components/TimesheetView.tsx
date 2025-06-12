
import React, { useState, useMemo, useEffect } from 'react';
import { TimesheetEntry, Resource, ResourceId, Department, Task } from '../types'; 
import { PlusIcon, EditIcon, TrashIcon } from './icons';

const getDepartmentMembersRecursive = (leaderId: ResourceId | undefined, allResources: Resource[]): Resource[] => { 
    if (!leaderId) return [];
    const members: Resource[] = [];
    const queue: ResourceId[] = [];
    const leader = allResources.find(r => r.id === leaderId);
    if (leader) {
        members.push(leader);
        queue.push(leader.id);
    }
    const visited: Set<ResourceId> = new Set(leader ? [leader.id] : []);

    while(queue.length > 0) {
        const currentId = queue.shift();
        if (currentId) {
            allResources.filter(r => r.parentId === currentId).forEach(child => {
                if(!visited.has(child.id)) {
                    visited.add(child.id);
                    members.push(child);
                    queue.push(child.id);
                }
            });
        }
    }
    return members.filter((item, index, self) => index === self.findIndex(t => t.id === item.id)) 
                    .sort((a,b) => a.name.localeCompare(b.name));
};

interface TimesheetViewProps {
  entries: TimesheetEntry[];
  resources: Resource[];
  departments: Department[];
  onAddEntry: (defaultDate?: string, defaultResource?: ResourceId) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  selectedPersonalPlannerUserId: ResourceId | '';
}

type TimesheetTab = 'log' | 'report' | 'personal_calendar';
type PersonalCalendarViewMode = 'month' | 'week';


interface PersonalTimesheetCalendarGridProps {
    selectedUser: Resource;
    entries: TimesheetEntry[];
    onAddEntryForDate: (date: string, resourceId: ResourceId) => void;
    initialViewMode?: PersonalCalendarViewMode;
}

const PersonalTimesheetCalendarGrid: React.FC<PersonalTimesheetCalendarGridProps> = ({
    selectedUser,
    entries,
    onAddEntryForDate,
    initialViewMode = 'month',
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<PersonalCalendarViewMode>(initialViewMode);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const grid: { day: number, dateStr: string, isCurrentMonth: boolean, loggedHours: number }[] = [];

        if (viewMode === 'month') {
            const numDays = daysInMonth(year, month);
            const firstDay = firstDayOfMonth(year, month); 
            const prevMonthYear = month === 0 ? year - 1 : year;
            const prevMonthActual = month === 0 ? 11 : month - 1;
            const prevMonthDaysCount = daysInMonth(prevMonthYear, prevMonthActual);
            for (let i = 0; i < firstDay; i++) {
                const day = prevMonthDaysCount - firstDay + 1 + i;
                const dateStr = `${prevMonthYear}-${String(prevMonthActual + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                grid.push({ day, dateStr, isCurrentMonth: false, loggedHours: 0 });
            }
            for (let day = 1; day <= numDays; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEntries = entries.filter(e => e.date === dateStr && e.resourceId === selectedUser.id);
                const loggedHours = dayEntries.reduce((sum, e) => sum + e.hoursLogged, 0);
                grid.push({ day, dateStr, isCurrentMonth: true, loggedHours });
            }
            const nextMonthYear = month === 11 ? year + 1 : year;
            const nextMonthActual = month === 11 ? 0 : month + 1;
            const cellsSoFar = grid.length;
            const remainingCells = (cellsSoFar <= 35) ? 35 - cellsSoFar : 42 - cellsSoFar;
            for (let i = 1; i <= remainingCells; i++) {
                const dateStr = `${nextMonthYear}-${String(nextMonthActual + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                grid.push({ day: i, dateStr, isCurrentMonth: false, loggedHours: 0 });
            }
        } else { // week view
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
            startOfWeek.setHours(0,0,0,0);
            for(let i=0; i<7; i++) {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                const dayEntries = entries.filter(e => e.date === dateStr && e.resourceId === selectedUser.id);
                const loggedHours = dayEntries.reduce((sum, e) => sum + e.hoursLogged, 0);
                grid.push({day: dayDate.getDate(), dateStr, isCurrentMonth: true, loggedHours }); // All days in week view are 'current'
            }
        }
        return grid;
    }, [currentDate, entries, selectedUser.id, viewMode]);
    
    const changeDateRange = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewMode === 'month') newDate.setMonth(prev.getMonth() + offset, 1);
            else newDate.setDate(prev.getDate() + (offset * 7));
            return newDate;
        });
    };
    
    const displayDateRangeString = useMemo(() => {
        if (viewMode === 'month') {
            return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const startFormatted = startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
            const endFormatted = endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${startFormatted} - ${endFormatted}`;
        }
    }, [currentDate, viewMode]);


    return (
        <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-3 space-y-2 sm:space-y-0">
                <div className='flex items-center space-x-1'>
                    <button onClick={() => changeDateRange(-1)} className="px-2 py-1 bg-slate-600 hover:bg-[#F29C2A] rounded text-xs">&lt;</button>
                    <h3 className="text-md font-semibold text-slate-100 text-center min-w-[200px]">
                        {displayDateRangeString}
                    </h3>
                    <button onClick={() => changeDateRange(1)} className="px-2 py-1 bg-slate-600 hover:bg-[#F29C2A] rounded text-xs">&gt;</button>
                </div>
                 <div className="flex rounded-md bg-slate-600 p-0.5">
                    <button onClick={() => setViewMode('month')} className={`px-2 py-1 text-xs rounded ${viewMode === 'month' ? 'bg-[#F29C2A] text-slate-900' : 'text-slate-300 hover:bg-slate-500'}`}>Month</button>
                    <button onClick={() => setViewMode('week')} className={`px-2 py-1 text-xs rounded ${viewMode === 'week' ? 'bg-[#F29C2A] text-slate-900' : 'text-slate-300 hover:bg-slate-500'}`}>Week</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-slate-400 py-1">{d}</div>)}
                {calendarGrid.map((cell, idx) => (
                    <div 
                        key={idx} 
                        className={`p-1.5 border border-slate-600 min-h-[70px] rounded ${cell.isCurrentMonth ? 'bg-slate-700 hover:bg-slate-600/70' : 'bg-slate-800/50 text-slate-500'} cursor-pointer flex flex-col justify-start items-center`}
                        onClick={() => cell.isCurrentMonth && onAddEntryForDate(cell.dateStr, selectedUser.id)}
                        title={cell.isCurrentMonth ? `Log hours for ${cell.dateStr}` : ""}
                        role="button"
                        tabIndex={cell.isCurrentMonth ? 0 : -1}
                        aria-label={cell.isCurrentMonth ? `Date ${cell.day}, Logged hours: ${cell.loggedHours}` : `Date ${cell.day} (not in current ${viewMode})`}
                    >
                        <div className={cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"}>{cell.day}</div>
                        {cell.isCurrentMonth && cell.loggedHours > 0 && (
                            <div className="mt-1 text-[10px] bg-green-500/80 text-white rounded px-1 py-0.5 w-full text-center">
                                {cell.loggedHours.toFixed(1)}h
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


export const TimesheetView: React.FC<TimesheetViewProps> = ({ entries, resources, departments, onAddEntry, onEditEntry, onDeleteEntry, selectedPersonalPlannerUserId }) => {
  const isPersonalView = !!selectedPersonalPlannerUserId;
  const viewingUser = useMemo(() => resources.find(r => r.id === selectedPersonalPlannerUserId), [selectedPersonalPlannerUserId, resources]);
  
  const [activeTab, setActiveTab] = useState<TimesheetTab>(isPersonalView && viewingUser ? 'personal_calendar' : 'log');
  
  useEffect(() => { 
    setActiveTab(isPersonalView && viewingUser ? 'personal_calendar' : 'log');
  }, [isPersonalView, viewingUser]);


  const [filterDepartmentId, setFilterDepartmentId] = useState<ResourceId | ''>('');
  const [filterResourceId, setFilterResourceId] = useState<ResourceId | ''>(isPersonalView ? selectedPersonalPlannerUserId : ''); 
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  useEffect(() => { 
    setFilterResourceId(isPersonalView && activeTab === 'log' ? selectedPersonalPlannerUserId : '');
  }, [selectedPersonalPlannerUserId, isPersonalView, activeTab]);


  const getResourceName = (resourceId: ResourceId) => resources.find(r => r.id === resourceId)?.name || 'Unknown';

  const resourcesForFilter = useMemo(() => {
    if (!filterDepartmentId) {
      return resources.sort((a,b) => a.name.localeCompare(b.name));
    }
    const dept = departments.find(d => d.id === filterDepartmentId);
    return getDepartmentMembersRecursive(dept?.leaderId, resources);
  }, [filterDepartmentId, resources, departments]);

  React.useEffect(() => {
    if (filterResourceId && !resourcesForFilter.find(r => r.id === filterResourceId)) {
      setFilterResourceId(''); 
    }
  }, [resourcesForFilter, filterResourceId]);

  const filteredEntries = useMemo(() => {
    let relevantEntries = entries;
    if (isPersonalView && viewingUser && activeTab === 'log') { 
        relevantEntries = entries.filter(e => e.resourceId === viewingUser.id);
    } else if (activeTab === 'log' || activeTab === 'report') { 
        let departmentMemberIds: Set<ResourceId> | null = null;
        if (filterDepartmentId) {
            const dept = departments.find(d => d.id === filterDepartmentId);
            if (dept) {
                 departmentMemberIds = new Set(getDepartmentMembersRecursive(dept.leaderId, resources).map(r => r.id));
            }
        }
        relevantEntries = entries.filter(entry => {
            let matches = true;
            if (departmentMemberIds && !departmentMemberIds.has(entry.resourceId)) matches = false;
            if (filterResourceId && entry.resourceId !== filterResourceId) matches = false;
            return matches;
        });
    }
    return relevantEntries.filter(entry => {
        let matches = true;
        const entryDate = new Date(entry.date + "T00:00:00"); 
        if (filterStartDate) { const startDate = new Date(filterStartDate + "T00:00:00"); if (entryDate < startDate) matches = false; }
        if (filterEndDate) { const endDate = new Date(filterEndDate + "T23:59:59"); if (entryDate > endDate) matches = false; } 
        return matches;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || getResourceName(a.resourceId).localeCompare(getResourceName(b.resourceId)));
  }, [entries, filterDepartmentId, filterResourceId, filterStartDate, filterEndDate, resources, departments, isPersonalView, viewingUser, activeTab]);

  const timesheetReportData = useMemo(() => {
    const report: { resourceId: ResourceId; resourceName: string; departmentName: string; totalHours: number }[] = [];
    const groupedByResource = filteredEntries.reduce((acc, entry) => {
      acc[entry.resourceId] = (acc[entry.resourceId] || 0) + entry.hoursLogged;
      return acc;
    }, {} as Record<ResourceId, number>);

    let resourcesToReportOn = resources;
    if (filterDepartmentId) {
        const dept = departments.find(d => d.id === filterDepartmentId);
        resourcesToReportOn = getDepartmentMembersRecursive(dept?.leaderId, resources);
    }
    if (filterResourceId) {
        resourcesToReportOn = resources.filter(r => r.id === filterResourceId);
    }

    resourcesToReportOn.forEach(resource => {
        const resDept = departments.find(dept => getDepartmentMembersRecursive(dept.leaderId, resources).some(member => member.id === resource.id));
        if ((groupedByResource[resource.id] || 0) > 0) { 
             report.push({
                resourceId: resource.id,
                resourceName: resource.name,
                departmentName: resDept?.name || 'N/A',
                totalHours: groupedByResource[resource.id] || 0,
            });
        }
    });
    return report.sort((a,b) => b.totalHours - a.totalHours || a.resourceName.localeCompare(b.resourceName));
  }, [filteredEntries, resources, departments, filterDepartmentId, filterResourceId]);

  const handleAddEntryForDatePersonal = (date: string, resourceId: ResourceId) => {
    onAddEntry(date, resourceId); 
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-2.5 placeholder-slate-400";
  const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void; disabled?: boolean}> = ({ label, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${disabled ? 'text-slate-600 bg-slate-800/50 cursor-not-allowed' : isActive ? 'bg-slate-700 text-[#F29C2A]' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
        {label}
    </button>
  );

  return (
    <div className="space-y-6 bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1 border-b border-slate-700">
        <div className="flex">
            {isPersonalView && viewingUser && (
                 <TabButton label={`${viewingUser.name}'s Calendar Log`} isActive={activeTab === 'personal_calendar'} onClick={() => setActiveTab('personal_calendar')} />
            )}
            <TabButton label="Entry Log" isActive={activeTab === 'log'} onClick={() => setActiveTab('log')} disabled={activeTab === 'personal_calendar' && isPersonalView && !!viewingUser}/>
            <TabButton label="Summary Report" isActive={activeTab === 'report'} onClick={() => setActiveTab('report')} disabled={activeTab === 'personal_calendar' && isPersonalView && !!viewingUser}/>
        </div>
        {(activeTab === 'log' || (activeTab === 'personal_calendar' && isPersonalView)) && (
            <button onClick={() => onAddEntry(undefined, viewingUser?.id)}
            className="bg-[#F29C2A] hover:bg-[#EE4D1E] text-white font-semibold py-2 px-3 rounded-lg shadow-md transition-all flex items-center space-x-2 text-sm mt-3 sm:mt-0 self-start sm:self-auto">
            <PlusIcon className="w-4 h-4" /> <span>Log Hours</span>
            </button>
        )}
      </div>
      
      <h2 className="text-xl font-semibold text-[#F29C2A] -mt-2 mb-4">
        {activeTab === 'log' ? `Daily Timesheet Entries ${isPersonalView && viewingUser ? `for ${viewingUser.name}` : ''}` 
        : activeTab === 'report' ? 'Timesheet Summary Report' 
        : `Timesheet Calendar for ${viewingUser?.name}`}
      </h2>

      {(activeTab === 'log' || activeTab === 'report') && !isPersonalView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
                <label htmlFor="filterDepartment" className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                <select id="filterDepartment" value={filterDepartmentId} onChange={(e) => { setFilterDepartmentId(e.target.value); setFilterResourceId('');}} className={inputClass}>
                    <option value="">All Departments</option>
                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filterResource" className="block text-sm font-medium text-slate-300 mb-1">Resource</label>
                <select id="filterResource" value={filterResourceId} onChange={(e) => setFilterResourceId(e.target.value)} className={inputClass} disabled={(!!filterDepartmentId && resourcesForFilter.length === 0)}>
                    <option value="">All Resources</option>
                    {resourcesForFilter.map(res => <option key={res.id} value={res.id}>{res.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filterStartDate" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                <input type="date" id="filterStartDate" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
                <label htmlFor="filterEndDate" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                <input type="date" id="filterEndDate" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={inputClass} />
            </div>
        </div>
      )}
      {/* Date filters for personal log view */}
      {activeTab === 'log' && isPersonalView && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label htmlFor="filterStartDatePersonal" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                <input type="date" id="filterStartDatePersonal" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
                <label htmlFor="filterEndDatePersonal" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                <input type="date" id="filterEndDatePersonal" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={inputClass} />
            </div>
        </div>
      )}


      {activeTab === 'personal_calendar' && viewingUser && (
        <PersonalTimesheetCalendarGrid 
            selectedUser={viewingUser} 
            entries={entries} 
            onAddEntryForDate={handleAddEntryForDatePersonal} 
        />
      )}

      {activeTab === 'log' && (
         <>
            {filteredEntries.length > 0 ? (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Date</th>
                                {!isPersonalView && <th scope="col" className="px-4 py-3">Resource</th>}
                                <th scope="col" className="px-4 py-3">Hours</th>
                                <th scope="col" className="px-4 py-3">Notes</th>
                                <th scope="col" className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {filteredEntries.map(entry => (
                            <tr key={entry.id} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/60">
                                <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date+"T00:00:00").toLocaleDateString()}</td>
                                {!isPersonalView && <td className="px-4 py-3 whitespace-nowrap">{getResourceName(entry.resourceId)}</td>}
                                <td className="px-4 py-3">{entry.hoursLogged.toFixed(1)}</td>
                                <td className="px-4 py-3 truncate max-w-xs" title={entry.notes}>{entry.notes || '-'}</td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                    <button onClick={() => onEditEntry(entry)} className="p-1.5 text-slate-400 hover:text-[#F29C2A]"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => onDeleteEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : ( <p className="text-slate-500 text-center py-8">No timesheet entries match filters.</p> )}
         </>
      )}
      {activeTab === 'report' && (
        <>
            {timesheetReportData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Resource</th>
                                <th scope="col" className="px-4 py-3">Department</th>
                                <th scope="col" className="px-4 py-3 text-right">Total Hours Logged</th>
                            </tr>
                        </thead>
                        <tbody>
                        {timesheetReportData.map(item => (
                            <tr key={item.resourceId} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/60">
                                <td className="px-4 py-3 font-medium text-slate-100 whitespace-nowrap">{item.resourceName}</td>
                                <td className="px-4 py-3">{item.departmentName}</td>
                                <td className="px-4 py-3 text-right font-semibold">{item.totalHours.toFixed(1)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : ( <p className="text-slate-500 text-center py-8">No timesheet data for report filters.</p> )}
        </>
      )}
    </div>
  );
};
