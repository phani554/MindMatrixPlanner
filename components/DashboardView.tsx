
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Resource, Task, TaskStatus, Department, ProjectId, Project, ResourceId, TaskPriority, TimesheetEntry } from '../types';
import { UserIcon, CakeIcon, PlusIcon } from './icons'; // Added PlusIcon
import { GoogleGenAI } from "@google/genai";

interface DashboardViewProps {
  resources: Resource[];
  tasks: Task[];
  departments: Department[];
  projects: Project[];
  timesheetEntries: TimesheetEntry[]; // Added for top performer calculation
  selectedPersonalPlannerUserId: ResourceId | '';
  onOpenTaskDetailModal: (title: string, tasks: Task[]) => void;
  onOpenTaskModal: () => void; // For Add Task button
  onOpenNewEventModal: (date?: string) => void; // For Add Event button
  onOpenTimesheetModal: (entryOrDate?: TimesheetEntry | string, resourceId?: ResourceId) => void; // For Add Time button
}

interface Quote {
  q: string;
  a: string;
  h?: string;
}

interface PerformerStats {
  resourceId: string;
  name: string;
  tasksDone: number; // Keep for display, though scoring is more complex
  hoursWorked: number; // Keep for display
  score: number; // For internal ranking
}

const parseBirthDateForFiltering = (dateStr?: string): { month: number; day: number; display: string } | null => {
    if (!dateStr) return null;
    const monthMap: { [key: string]: number } = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const dateObj = new Date(dateStr + "T00:00:00"); 
        if (!isNaN(dateObj.getTime())) { const day = dateObj.getDate(); const month = dateObj.getMonth(); const monthShortName = dateObj.toLocaleDateString('en-US', { month: 'short' }); return { month, day, display: `${day} ${monthShortName}` };}
    }
    let matchDdMon = dateStr.match(/^(\d{1,2})\s*([a-zA-Z]{3,})/i);
    if (matchDdMon) { const day = parseInt(matchDdMon[1]); const monthName = matchDdMon[2].toLowerCase().substring(0, 3); if (monthMap.hasOwnProperty(monthName) && day >= 1 && day <= 31) return { month: monthMap[monthName], day, display: `${day} ${matchDdMon[2].substring(0,3)}` }; }
    const dateObjFromName = new Date(dateStr + " 2000"); if (!isNaN(dateObjFromName.getTime()) && dateObjFromName.getFullYear() === 2000) { const day = dateObjFromName.getDate(); const month = dateObjFromName.getMonth(); const monthShortName = dateObjFromName.toLocaleDateString('en-US', { month: 'short' }); return { month, day, display: `${day} ${monthShortName}` };}
    console.warn("Could not parse birth date for filtering:", dateStr); return null;
};

const getResourceHierarchy = (userId: ResourceId, allResources: Resource[]): Resource[] => {
    const reports: Resource[] = []; const queue: ResourceId[] = [userId]; const visited: Set<ResourceId> = new Set();
    const startUser = allResources.find(r => r.id === userId);
    if (startUser) reports.push(startUser); 
    
    while(queue.length > 0) { 
        const currentId = queue.shift(); 
        if (currentId && !visited.has(currentId)) { 
            visited.add(currentId); 
            allResources.filter(r => r.parentId === currentId).forEach(child => { 
                if (!visited.has(child.id)) {
                    reports.push(child); 
                    queue.push(child.id); 
                }
            });
        }
    } 
    return reports.filter((value, index, self) => index === self.findIndex((t) => t.id === value.id)); 
};


const findUserDepartment = (userId: ResourceId, allResources: Resource[], allDepartments: Department[]): Department | undefined => {
    let currentUser = allResources.find(r => r.id === userId);
    while (currentUser) {
        const deptHeaded = allDepartments.find(d => d.leaderId === currentUser!.id);
        if (deptHeaded) return deptHeaded;
        if (!currentUser.parentId) break; 
        currentUser = allResources.find(r => r.id === currentUser!.parentId);
    }
    for (const dept of allDepartments) {
        if (dept.leaderId) {
            const members = getResourceHierarchy(dept.leaderId, allResources);
            if (members.some(m => m.id === userId)) return dept;
        }
    }
    return undefined;
};


export const DashboardView: React.FC<DashboardViewProps> = ({ 
    resources, tasks, departments, projects, timesheetEntries, selectedPersonalPlannerUserId, 
    onOpenTaskDetailModal, onOpenTaskModal, onOpenNewEventModal, onOpenTimesheetModal 
}) => {
  const [productivityTip, setProductivityTip] = useState<string>("Loading productivity tip...");
  const [isLoadingTip, setIsLoadingTip] = useState<boolean>(false);
  const [tipError, setTipError] = useState<Quote | null>(null);
  

  const fetchProductivityTip = useCallback(async (signal: AbortSignal) => { 
    setIsLoadingTip(true);
    setTipError(null);
    try {
        // if (!process.env.API_KEY) {
        //     setProductivityTip("Productivity tip: Plan your day each morning!"); 
        //     setTipError("AI features disabled (API_KEY not set).");
        //     return;
        // }
        // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // const prompt = "Suggest a short, actionable productivity tip for a software development team (1-2 sentences).";
        // const response = await ai.models.generateContent({
        //     model: 'gemini-2.5-flash-preview-04-17',
        //     contents: prompt,
        // });
        const response = await fetch("http://localhost:5100/zen/quote", {
          signal // Passing the Abort Signal
        });
        if (!response.ok) {
          // This will now catch errors from YOUR backend if it fails
          throw new Error(`Failed to fetch quote from server, status: ${response.status}`);
        }        
        
        const data: Quote = await response.json();
        setProductivityTip(data?? "Stay focused and take regular breaks!");
    } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Productivity tip fetch was aborted.');
          return; // Stop execution silently
        }
  
        console.error("Failed to fetch productivity tip:", error);
        let errorMessage = "Could not fetch a tip. Try prioritizing your most important task first!";
        if (error.message && error.message.includes("API_KEY")) {
            errorMessage = "AI tips unavailable (API Key). Tip: Break down large tasks!";
        } else if (error.message && (error.message.includes("Quota") || error.message.includes("rate limit"))){
            errorMessage = "AI tips temporarily unavailable. Tip: Batch similar tasks together!";
        }
        setProductivityTip(errorMessage); 
        setTipError("Failed to load AI tip."); 
    } finally {
        if (!signal.aborted) {
          setIsLoadingTip(false);
        }
    }
  }, []);

  // useEffect(() => {
  //   const fetchQuote = async () => {
  //     try {
  //       const response = await fetch("/api/zen/quote");
  //       if (!response.ok) throw new Error("Failed to fetch quote");
  //       const data: Quote = await response.json();
  //       setQuote(data || "Sample Quote");
        
  //     } catch (error) {
  //       console.error(error);
  //     }
  //     finally {
  //       setIsLoadingTip(false);
  //     }
  //   };
  //   fetchQuote();
  // }, []);

  useEffect(() => { // 5. The AbortController now lives inside the useEffect hook
    const controller = new AbortController();
  
    // Pass the controller's signal to our fetch function
    fetchProductivityTip(controller.signal);
  
    // 6. This is the cleanup function. React runs it when the component unmounts.
    return () => {
      console.log("Component unmounting, aborting tip fetch.");
      controller.abort();
    };
  }, [fetchProductivityTip]);

  const isPersonalView = !!selectedPersonalPlannerUserId;
  const viewingUser = useMemo(() => resources.find(r => r.id === selectedPersonalPlannerUserId), [selectedPersonalPlannerUserId, resources]);
  
  const viewingUserDepartment = useMemo(() => {
    if (!viewingUser) return undefined;
    return findUserDepartment(viewingUser.id, resources, departments);
  }, [viewingUser, resources, departments]);


  const relevantResourcesIds = useMemo(() => {
    if (!isPersonalView || !viewingUser) return new Set(resources.map(r => r.id)); 
    
    if (viewingUserDepartment) { 
        const deptMembers = viewingUserDepartment.leaderId ? getResourceHierarchy(viewingUserDepartment.leaderId, resources) : [];
        return new Set(deptMembers.map(r => r.id));
    }
    const directAndIndirectReports = getResourceHierarchy(viewingUser.id, resources);
    if (directAndIndirectReports.length > 1) return new Set(directAndIndirectReports.map(r => r.id)); 

    return new Set([viewingUser.id]); 
  }, [isPersonalView, viewingUser, viewingUserDepartment, resources]);

  const relevantTasks = useMemo(() => {
    return tasks.filter(task => relevantResourcesIds.has(task.assignedResourceId || ''));
  }, [tasks, relevantResourcesIds]);


  const toDoOverview = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (6 - today.getDay())); endOfWeek.setHours(23,59,59,999);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); endOfMonth.setHours(23,59,59,999);

    const inbox = relevantTasks.filter(t => t.status === TaskStatus.TODO && (!t.startDate && !t.dueDate));
    const dueToday = relevantTasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && new Date(t.dueDate+"T00:00:00").toDateString() === today.toDateString());
    const dueThisWeek = relevantTasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && new Date(t.dueDate+"T00:00:00") > today && new Date(t.dueDate+"T00:00:00") <= endOfWeek);
    const dueThisMonth = relevantTasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && new Date(t.dueDate+"T00:00:00") > endOfWeek && new Date(t.dueDate+"T00:00:00") <= endOfMonth);
    
    return { inbox, dueToday, dueThisWeek, dueThisMonth };
  }, [relevantTasks]);


  const taskStats = useMemo(() => {
    const total = relevantTasks.length;
    const open = relevantTasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
    const completed = relevantTasks.filter(t => t.status === TaskStatus.DONE).length;
    const totalHoursLogged = relevantTasks.reduce((sum, task) => sum + (task.hoursSpent || (task.accumulatedTime ? Math.round(task.accumulatedTime / 360000) / 10 : 0) || 0), 0); 
    
    const byStage = [
        { name: TaskStatus.TODO, value: relevantTasks.filter(t => t.status === TaskStatus.TODO).length, color: '#64748B', tasks: relevantTasks.filter(t => t.status === TaskStatus.TODO) }, 
        { name: TaskStatus.IN_PROGRESS, value: relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3B82F6', tasks: relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS) }, 
        { name: TaskStatus.DONE, value: completed, color: '#10B981', tasks: relevantTasks.filter(t => t.status === TaskStatus.DONE) }, 
    ];
    const byPriority = Object.values(TaskPriority).map(prio => ({ 
        name: prio,
        value: relevantTasks.filter(t => t.priority === prio).length,
        tasks: relevantTasks.filter(t => t.priority === prio),
    }));

    return { total, open, completed, totalHoursLogged: totalHoursLogged.toFixed(1), byStage, byPriority };
  }, [relevantTasks]);

  const topLists = useMemo(() => {
    const assigneesMap = new Map<ResourceId, { name: string, count: number }>();
    relevantTasks.forEach(task => {
        if (task.assignedResourceId) {
            const res = resources.find(r => r.id === task.assignedResourceId);
            if (res) {
                const current = assigneesMap.get(res.id) || { name: res.name, count: 0 };
                current.count++;
                assigneesMap.set(res.id, current);
            }
        }
    });
    const topAssignees = Array.from(assigneesMap.values()).sort((a,b) => b.count - a.count).slice(0, 5);

    const projectsMap = new Map<ProjectId, { name: string, count: number }>();
    relevantTasks.forEach(task => {
        if (task.projectId) {
            const proj = projects.find(p => p.id === task.projectId);
            if (proj) {
                const current = projectsMap.get(proj.id) || { name: proj.customerName, count: 0 };
                current.count++;
                projectsMap.set(proj.id, current);
            }
        }
    });
    const topProjects = Array.from(projectsMap.values()).sort((a,b) => b.count - a.count).slice(0, 5);
    const topCustomers = topProjects; 

    return { topAssignees, topProjects, topCustomers };
  }, [relevantTasks, resources, projects]);


  const birthdaysThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    let resourcesForBirthdayCheck = resources;

    if (isPersonalView && viewingUserDepartment) {
        const deptMembers = viewingUserDepartment.leaderId ? getResourceHierarchy(viewingUserDepartment.leaderId, resources) : [];
        resourcesForBirthdayCheck = deptMembers;
    }

    return resourcesForBirthdayCheck
        .map(resource => {
            const birthInfo = parseBirthDateForFiltering(resource.birthDate);
            return birthInfo ? { ...resource, birthMonth: birthInfo.month, displayDate: birthInfo.display } : null;
        })
        .filter(resource => resource && resource.birthMonth === currentMonth)
        .map(r => r!) 
        .sort((a,b) => {
            const dayA = parseInt(a.displayDate.split(' ')[0]);
            const dayB = parseInt(b.displayDate.split(' ')[0]);
            return dayA - dayB;
        });
  }, [resources, isPersonalView, viewingUserDepartment]);


 const topPerformersByDepartment = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0,0,0,0); // Start of the 30-day window

    let departmentsToConsider = departments;
    if (isPersonalView && viewingUserDepartment) {
      departmentsToConsider = [viewingUserDepartment];
    }

    return departmentsToConsider.map(dept => {
      const members = dept.leaderId ? getResourceHierarchy(dept.leaderId, resources) : [];
      let topPerformer: PerformerStats | null = null;

      if (members.length > 0) {
        const memberStats: PerformerStats[] = members.map(member => {
          // Tasks completed by this member
          const memberDoneTasks = tasks.filter(task => 
            task.assignedResourceId === member.id && 
            task.status === TaskStatus.DONE
          );

          let tasksCompletedScore = memberDoneTasks.length;
          let timelinessScore = 0;
          let trackedTimeScore = 0;
          
          memberDoneTasks.forEach(task => {
            // Timeliness: Task due date is not in the distant past (e.g. more than 7 days ago from today)
            // This is an approximation as we don't have exact completion dates.
            if (task.dueDate) {
              const dueDate = new Date(task.dueDate + "T00:00:00");
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              if (dueDate >= sevenDaysAgo) {
                timelinessScore += 1;
              }
            } else { // No due date, still give a small bonus for completion
              timelinessScore += 0.5;
            }
            // Tracked time for completed tasks
            if (task.accumulatedTime) {
              trackedTimeScore += (task.accumulatedTime / 3600000); // Convert ms to hours
            } else if (task.hoursSpent) { // Fallback to manually logged if no tracked time
              trackedTimeScore += task.hoursSpent;
            }
          });

          // Timesheet activity in the last 30 days
          const hasRecentTimesheetActivity = timesheetEntries.some(entry =>
            entry.resourceId === member.id &&
            new Date(entry.date + "T00:00:00") >= thirtyDaysAgo &&
            new Date(entry.date + "T00:00:00") <= today
          );
          const timesheetActivityScore = hasRecentTimesheetActivity ? 2 : 0;
          
          // Weighted score
          const totalScore = (tasksCompletedScore * 5) + (timelinessScore * 3) + (Math.floor(trackedTimeScore) * 1) + (timesheetActivityScore * 2);

          return { 
            resourceId: member.id, 
            name: member.name, 
            tasksDone: tasksCompletedScore, // For display
            hoursWorked: parseFloat(trackedTimeScore.toFixed(1)), // For display
            score: totalScore
          };
        });
        
        if (memberStats.length > 0) {
          topPerformer = memberStats.sort((a, b) => b.score - a.score)[0];
          // Ensure the top performer actually did something significant
          if (topPerformer && topPerformer.score === 0) {
            topPerformer = null;
          }
        }
      }
      return { departmentName: dept.name, performer: topPerformer };
    }).filter(d => d.performer !== null || (departmentsToConsider.length === 1 && d.departmentName === departmentsToConsider[0].name));
  }, [resources, tasks, departments, timesheetEntries, isPersonalView, viewingUserDepartment]);


  const StatCard: React.FC<{title: string, value: string | number, colorClass?: string, onClick?: () => void}> = ({title, value, colorClass="text-[#F29C2A]", onClick}) => (
    <button
        onClick={onClick}
        disabled={!onClick}
        className={`bg-slate-700/50 p-4 rounded-lg text-center shadow w-full transition-all duration-150 ease-in-out ${onClick ? 'hover:bg-slate-600/70 cursor-pointer active:scale-95' : 'cursor-default'}`}
        aria-label={onClick ? `View details for ${title}` : title}
    >
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-sm text-slate-400">{title}</p>
    </button>
  );

  const BarChartSimple: React.FC<{data: {name:string, value:number, color:string, tasks: Task[]}[], title: string, onBarClick?: (title: string, tasks: Task[]) => void}> = ({data, title, onBarClick}) => (
    <div className="bg-slate-700/50 p-4 rounded-lg shadow">
        {<h3 className="text-md font-semibold text-slate-200 mb-3">{title}</h3> /* Tasks by Stage */}
        <div className="space-y-2">
            {data.map(item => (
                <div key={item.name} className="flex items-center">
                    <span className="text-xs text-slate-400 w-1/3 truncate pr-2">{item.name}</span>
                    <button
                        onClick={() => onBarClick && item.value > 0 ? onBarClick(`${title}: ${item.name}`, item.tasks) : undefined}
                        disabled={!onBarClick || item.value === 0}
                        className={`w-2/3 bg-slate-600 rounded-full h-4 ${onBarClick && item.value > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
                        aria-label={onBarClick && item.value > 0 ? `View ${item.value} tasks for ${item.name}` : `${item.name}: ${item.value} tasks`}
                    >
                        <div style={{ width: `${taskStats.total > 0 ? (item.value / taskStats.total * 100) : 0}%`, backgroundColor: item.color }} className="h-4 rounded-full text-right">
                           <span className="text-xs text-white px-1 relative bottom-0.5">{item.value > 0 ? item.value : ''}</span>
                        </div>
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
  
  const ListCard: React.FC<{title: string, items: {name:string, count:number}[]}> = ({title, items}) => (
    <div className="bg-slate-700/50 p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold text-slate-200 mb-3">{title}</h3>
        {items.length > 0 ? (
            <ul className="space-y-1">
                {items.map(item => (
                    <li key={item.name} className="text-xs text-slate-300 flex justify-between">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="text-slate-400">{item.count} tasks</span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-xs text-slate-500">No data available.</p>}
    </div>
  );

  const ToDoSection: React.FC<{title: string, tasksToList: Task[], projects: Project[], onClick: () => void}> = ({title, tasksToList, projects, onClick}) => (
    <button onClick={onClick} disabled={tasksToList.length === 0} className={`w-full text-left p-3 rounded-lg bg-slate-700/50 shadow ${tasksToList.length > 0 ? 'hover:bg-slate-600/70 cursor-pointer' : 'cursor-default'}`}>
        <h4 className="text-sm font-semibold text-sky-300 mb-1">{title} ({tasksToList.length})</h4>
        {tasksToList.length > 0 ? (
            <ul className="space-y-1 text-xs max-h-32 overflow-y-auto custom-scrollbar-xs pr-1">
                {tasksToList.slice(0,5).map(t => ( // Show first 5
                    <li key={t.id} className="text-slate-400 p-1 bg-slate-600/50 rounded truncate" title={`${t.title} (${projects.find(p=>p.id === t.projectId)?.customerName || ''})`}>
                        {t.title}
                    </li>
                ))}
                {tasksToList.length > 5 && <li className="text-xs text-slate-500 italic">...and {tasksToList.length - 5} more</li>}
            </ul>
        ) : <p className="text-xs text-slate-500 italic">Nothing here.</p>}
    </button>
  );

  const actionButtonClass = "flex items-center space-x-2 bg-[#F29C2A] hover:bg-[#EE4D1E] text-white text-sm font-medium py-2 px-4 rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FAD02C] focus:ring-opacity-75";


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-[#F29C2A] -mb-2">
          {isPersonalView && viewingUser ? `Dashboard for ${viewingUser.name}${viewingUserDepartment ? ` (${viewingUserDepartment.name})` : ''}` : "Global Dashboard"}
      </h2>
      
      {/* Global Action Buttons */}
      <section className="bg-slate-800/60 p-4 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <button onClick={() => onOpenTimesheetModal(undefined, selectedPersonalPlannerUserId || undefined)} className={actionButtonClass} aria-label="Log Time">
                <PlusIcon className="w-4 h-4" />
                <span>Add Time</span>
            </button>
            <button onClick={onOpenTaskModal} className={actionButtonClass} aria-label="Add New Task">
                <PlusIcon className="w-4 h-4" />
                <span>Add Task</span>
            </button>
            <button onClick={() => onOpenNewEventModal()} className={actionButtonClass} aria-label="Add New Event">
                <PlusIcon className="w-4 h-4" />
                <span>Add Event</span>
            </button>
        </div>
      </section>


      <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
          <div className="flex items-start">
            <span className="text-2xl mr-3 mt-0.5">💡</span>
            <div>
                <h3 className="text-lg font-semibold text-sky-300 mb-1">Productivity Spark</h3>
                {isLoadingTip && <p className="text-slate-400 text-sm italic">Brewing a fresh tip...</p>}
                {!isLoadingTip && productivityTip && 
                <p className="text-slate-300 text-md">{productivityTip.q}</p>}
                {!isLoadingTip && productivityTip && 
                <blockquote>- {productivityTip.a}</blockquote>}
                
                {!isLoadingTip && tipError && <p className="text-sm text-red-400">{tipError}</p>}
            </div>
        </div>
      </section>
      
      <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-[#F29C2A] mb-3">
            {isPersonalView ? "My Task Overview" : "Upcoming & Inbox Tasks"}
            {isPersonalView && viewingUserDepartment && <span className="text-base text-slate-400"> (Department Focus: {viewingUserDepartment.name})</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ToDoSection title="Inbox / Backlog" tasksToList={toDoOverview.inbox} projects={projects} onClick={() => toDoOverview.inbox.length > 0 && onOpenTaskDetailModal('Inbox / Backlog Tasks', toDoOverview.inbox)} />
              <ToDoSection title="Due Today" tasksToList={toDoOverview.dueToday} projects={projects} onClick={() => toDoOverview.dueToday.length > 0 && onOpenTaskDetailModal('Tasks Due Today', toDoOverview.dueToday)} />
              <ToDoSection title="Due This Week" tasksToList={toDoOverview.dueThisWeek} projects={projects} onClick={() => toDoOverview.dueThisWeek.length > 0 && onOpenTaskDetailModal('Tasks Due This Week', toDoOverview.dueThisWeek)} />
              <ToDoSection title="Due This Month" tasksToList={toDoOverview.dueThisMonth} projects={projects} onClick={() => toDoOverview.dueThisMonth.length > 0 && onOpenTaskDetailModal('Tasks Due This Month', toDoOverview.dueThisMonth)} />
          </div>
      </section>

      <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-[#F29C2A] mb-4">Task Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard title="Total Tasks" value={taskStats.total} onClick={() => taskStats.total > 0 && onOpenTaskDetailModal('All Tasks', relevantTasks)} />
              <StatCard title="Open Tasks" value={taskStats.open} colorClass="text-yellow-400" onClick={() => taskStats.open > 0 && onOpenTaskDetailModal('Open Tasks', relevantTasks.filter(t=> t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS))} />
              <StatCard title="Completed Tasks" value={taskStats.completed} colorClass="text-green-400" onClick={() => taskStats.completed > 0 && onOpenTaskDetailModal('Completed Tasks', relevantTasks.filter(t=> t.status === TaskStatus.DONE))} />
              <StatCard title="Total Hours Logged" value={`${taskStats.totalHoursLogged}h`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <BarChartSimple data={taskStats.byStage} title="Tasks by Stage" onBarClick={(title, tasks) => onOpenTaskDetailModal(title, tasks)} />
             <div className="bg-slate-700/50 p-4 rounded-lg shadow">
                <h3 className="text-md font-semibold text-slate-200 mb-3">Tasks by Priority</h3>
                {taskStats.byPriority.map(p => (
                    <button
                        key={p.name}
                        onClick={() => p.value > 0 && onOpenTaskDetailModal(`Tasks with ${p.name} Priority`, p.tasks)}
                        disabled={p.value === 0}
                        className={`w-full text-xs text-slate-300 flex justify-between p-1 rounded ${p.value > 0 ? 'hover:bg-slate-600/50 cursor-pointer' : 'cursor-default opacity-60'}`}
                    >
                        <span>{p.name}</span><span>{p.value}</span>
                    </button>
                ))}
             </div>
          </div>
      </section>

       <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-[#F29C2A] mb-4">Top Lists</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ListCard title="Top Assignees" items={topLists.topAssignees} />
              <ListCard title="Top Projects" items={topLists.topProjects} />
              <ListCard title="Top Customers" items={topLists.topCustomers} />
          </div>
      </section>

      <>
        <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
          <div className="flex items-center mb-4"> 
            <CakeIcon className="w-7 h-7 text-pink-400 mr-3"/> 
            <h2 className="text-2xl font-semibold text-[#F29C2A]">
                Birthdays This Month {isPersonalView && viewingUserDepartment ? `(Dept: ${viewingUserDepartment.name})` : '(Global)'}
            </h2> 
          </div>
          {birthdaysThisMonth.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{birthdaysThisMonth.map(resource => ( <div key={resource.id} className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow"><UserIcon className="w-8 h-8 text-sky-400"/><div><p className="text-md font-medium text-slate-200">{resource.name}</p><p className="text-sm text-pink-300">{resource.displayDate}</p></div></div>))}</div> : <p className="text-slate-500 italic">No birthdays this month {isPersonalView && viewingUserDepartment ? `in the ${viewingUserDepartment.name} department` : ''}.</p>}
        </section>
        
        <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-[#F29C2A] mb-4">
                Top Performers (Last 30 Days)
                {isPersonalView && viewingUserDepartment && viewingUser && viewingUserDepartment.leaderId === viewingUser.id ? ` (Dept: ${viewingUserDepartment.name})` 
                : isPersonalView && viewingUserDepartment ? ` (Focus: ${viewingUserDepartment.name} Dept)`
                : ' (Global)'}
            </h2>
            {topPerformersByDepartment.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{topPerformersByDepartment.map(({ departmentName, performer }, index) => ( <div key={index} className="bg-slate-700/50 p-5 rounded-lg shadow-lg"><h3 className="text-xl font-medium text-[#F29C2A] mb-3 border-b border-slate-600 pb-2">{departmentName}</h3>{performer && performer.score > 0 ? <div className="space-y-2"><div className="flex items-center"><UserIcon className="w-6 h-6 text-sky-400 mr-3"/><p className="text-lg text-slate-200 font-semibold">{performer.name}</p></div><p className="text-sm text-slate-300"><strong className="font-medium text-slate-100">{performer.tasksDone}</strong> tasks completed</p><p className="text-sm text-slate-300"><strong className="font-medium text-slate-100">{performer.hoursWorked}</strong> hours effectively worked (tracked/logged on done tasks)</p></div> : <p className="text-slate-500 italic">No significant activity meeting top performer criteria in this department.</p>}</div>))}</div> : <p className="text-slate-500">Top performer data is being calculated or no activity for the selected scope.</p>}
        </section>
      </>
      
      {/* Illustrative Notification Settings Section. Actual email sending requires backend. */}
      <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-[#F29C2A] mb-4">Notification Settings</h2>
        <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-[#F29C2A] bg-slate-600 border-slate-500 rounded focus:ring-[#F29C2A] focus:ring-offset-slate-800" />
                <span className="text-slate-300 text-sm">Email me when a task is assigned to me.</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-[#F29C2A] bg-slate-600 border-slate-500 rounded focus:ring-[#F29C2A] focus:ring-offset-slate-800" defaultChecked/>
                <span className="text-slate-300 text-sm">Email me 24 hours before an event starts.</span>
            </label>
             <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-[#F29C2A] bg-slate-600 border-slate-500 rounded focus:ring-[#F29C2A] focus:ring-offset-slate-800" />
                <span className="text-slate-300 text-sm">Email me when a task I assigned is completed.</span>
            </label>
             <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-[#F29C2A] bg-slate-600 border-slate-500 rounded focus:ring-[#F29C2A] focus:ring-offset-slate-800" defaultChecked/>
                <span className="text-slate-300 text-sm">Email team lead when a task assigned to their team member is overdue.</span>
            </label>
        </div>
        <p className="text-xs text-slate-500 mt-4 italic">(Notification system is illustrative and not functional in this demo. Actual email notifications would be handled by a backend system.)</p>
      </section>

    </div>
  );
};
