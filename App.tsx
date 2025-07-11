
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Resource, Task, TaskId, TaskStatus, ResourceId, TaskPriority, TaskSource, TaskType, AppView, Department, TimesheetEntry, Project, ProjectId, CalendarEvent } from './types';
import { Modal } from './components/Modal';
import { ResourceForm } from './components/ResourceForm';
import { TaskForm } from './components/TaskForm';
import { TaskItem } from './components/TaskItem';
import { PlusIcon, UserIcon, ClipboardListIcon, DashboardIcon, ReportIcon, MindMatrixLogo, TeamIcon, TimesheetIcon, CalendarIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronLeftIcon } from './components/icons'; // Added ChevronLeftIcon
import { ResourceTree } from './components/ResourceTree';
import { DashboardView } from './components/DashboardView';
import { ReportView } from './components/ReportView';
import { TeamRosterView } from './components/TeamRosterView';
import { TimesheetView } from './components/TimesheetView';
import { TimesheetEntryForm } from './components/TimesheetEntryForm';
import { CalendarView } from '@/components/CalendarView';
import { ProjectForm } from './components/ProjectForm';
import { DepartmentForm } from './components/DepartmentForm';
import { EventForm } from './components/EventForm';
import { KanbanView } from './components/KanbanView'; 
import { TeamTaskAllocationSummary } from './components/TeamTaskAllocationSummary';
import { AssignTaskModal } from './components/AssignTaskModal'; 
import { GoogleGenAI } from "@google/genai";
import { useApi } from './hooks/useApi';
import { fetchService } from './services/resourceService';
import { useSyncStatus } from './hooks/useIssueData';
import AuthButton from "./components/AuthButton";
import { IssueView } from './components/IssueView';
import { SyncButton } from './components/SyncButton';
import { formatLastSynced } from './utils/formatDate';

// Helper function to get all members of a department recursively (includes leader)
const getDepartmentMembersRecursive = (leaderId: ResourceId | undefined | null, allResources: Resource[]): Resource[] => {
  if (!leaderId) return [];
  const members: Resource[] = [];
  const queue: ResourceId[] = [];
  const leaderResource = allResources.find(r => r.id === leaderId);

  if (leaderResource) {
    members.push(leaderResource); // Include the leader
    queue.push(leaderResource.id);
  }
  
  const visited: Set<ResourceId> = new Set(leaderResource ? [leaderResource.id] : []);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId) {
      allResources
        .filter(r => r.parentId === currentId)
        .forEach(child => {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            members.push(child);
            queue.push(child.id);
          }
        });
    }
  }
  // Ensure uniqueness if a resource could be reached multiple ways (though parentId should prevent this)
  return members.filter((m, index, self) => index === self.findIndex(r => r.id === m.id));
};


// Gets a resource and all their direct/indirect reports
const getResourceHierarchy = (userId: ResourceId, allResources: Resource[]): Resource[] => {
    const team: Resource[] = [];
    const queue: ResourceId[] = [];
    const startUser = allResources.find(r => r.id === userId);

    if (startUser) {
        team.push(startUser); 
        queue.push(userId);
    }
    
    const visited: Set<ResourceId> = new Set([userId]);

    while(queue.length > 0) {
        const currentId = queue.shift();
        if (currentId) {
            allResources.filter(r => r.parentId === currentId).forEach(child => {
                if (!visited.has(child.id)) {
                    visited.add(child.id);
                    team.push(child);
                    queue.push(child.id);
                }
            });
        }
    }
    return team;
};


const parseSOWDate = (dateStr?: string): string | undefined => {
    if (!dateStr || dateStr.trim().toUpperCase() === 'TBD' || dateStr.trim().toUpperCase() === 'N/A') return undefined;
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) { return dateStr; }
};


const App: React.FC = () => {
  const syncStatus = useSyncStatus();

  const { data, isLoading, error } = useApi(fetchService.getResources);

  const [resources, setResources] = useState<Resource[]>([]);
  const isLoadingResource = isLoading;
  const errorResource = error;
  // const resources = data as Resource[] || [];
  // console.log("--- THIS IS THE REAL LOG ---", resources[0]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartmentsState] = useState<Department[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedPersonalPlannerUserId, setSelectedPersonalPlannerUserId] = useState<ResourceId | ''>('');
  const [isPersonalPlannerDropdownOpen, setIsPersonalPlannerDropdownOpen] = useState(false);
  const [personalPlannerSearchTerm, setPersonalPlannerSearchTerm] = useState('');


  const [aiSuggestedTask, setAiSuggestedTask] = useState<{ title: string; description: string } | null>(null);
  const [isSuggestingTask, setIsSuggestingTask] = useState(false);
  const [taskSuggestionError, setTaskSuggestionError] = useState<string | null>(null);

  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [assignTaskModalManager, setAssignTaskModalManager] = useState<Resource | null>(null);

  // For Dashboard Task Detail Modal
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [taskDetailModalTitle, setTaskDetailModalTitle] = useState('');
  const [tasksForDetailModal, setTasksForDetailModal] = useState<Task[]>([]);

  const openTaskDetailModal = (title: string, tasksToShow: Task[]) => {
    setTaskDetailModalTitle(title);
    setTasksForDetailModal(tasksToShow);
    setIsTaskDetailModalOpen(true);
  };
  const closeTaskDetailModal = () => setIsTaskDetailModalOpen(false);


  const parseJoiningDate = (dateStr?: string): string | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr; 
    
    let parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length === 3) {
        let [day, month, year] = parts.map(p => parseInt(p));
        if (year < 100) year += 2000; 
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >=1 && day <=31) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
    }
    if (parts.length === 3) {
      let [month, day, year] = parts.map(p => parseInt(p));
      if (year < 100) year += 2000;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >=1 && day <=31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return dateStr; 
  };

   const parseBirthDate = (dateStr?: string): string | undefined => {
      if (!dateStr || dateStr.trim() === '') return undefined;
      // If already in YYYY-MM-DD, convert to "DD Mon"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { 
        const d = new Date(dateStr + "T00:00:00"); // Ensure date is parsed in local timezone context
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short'}); // 'en-GB' gives DD Mon YYYY, then we just use part of it effectively
      }
      // Check for "DD Mon" or "DD MonthName"
      const dateParts = dateStr.match(/^(\d{1,2})\s*([a-zA-Z]{3,})/);
      if (dateParts) {
         // Ensure day is two digits, month is 3 chars capitalized
         const day = String(dateParts[1]).padStart(2,'0');
         const monthShort = dateParts[2].substring(0,3);
         const capitalizedMonth = monthShort.charAt(0).toUpperCase() + monthShort.slice(1).toLowerCase();
         return `${day} ${capitalizedMonth}`;
      }
      
      // Attempt to parse as a join date (more flexible) and then convert
       const parsedJoinDateAttempt = parseJoiningDate(dateStr); // This might return YYYY-MM-DD
       if(parsedJoinDateAttempt && /^\d{4}-\d{2}-\d{2}$/.test(parsedJoinDateAttempt)) {
         const d = new Date(parsedJoinDateAttempt + "T00:00:00");
         return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short'});
       }
      return dateStr; // Return original if no robust parsing possible
  };

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [defaultTimesheetDate, setDefaultTimesheetDate] = useState<string | undefined>(undefined);
  const [defaultTimesheetResource, setDefaultTimesheetResource] = useState<ResourceId | undefined>(undefined);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTimesheetEntry, setEditingTimesheetEntry] = useState<TimesheetEntry | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if(data) {
      setResources(data as Resource[]);
    }
  }, [data]);


  useEffect(() => {
    const initialProjectData: Project[] = [
        { id: 'proj_acronis', customerName: "Acronis 5A & 5B & 6", overallStatus: "On Track: Custom work", percentageCompletion: "Custom Work", sowExecutionDate: parseSOWDate("25 Mar 2024") },
        { id: 'proj_lenovo_hub2', customerName: "Lenovo Solution Hub phase 2", overallStatus: "On Track: Client Feedback implementation", percentageCompletion: "70.00%", sowExecutionDate: parseSOWDate("28 Feb 2025") },
        { id: 'proj_lenovo_comm', customerName: "Lenovo Communication centre", overallStatus: "On Track: Custom work", percentageCompletion: "Custom Work", sowExecutionDate: parseSOWDate("28 Feb 2025") },
        { id: 'proj_vena2', customerName: "Vena Phase 2", overallStatus: "On Track: Custom work", percentageCompletion: "Custom Work", sowExecutionDate: parseSOWDate("24 Oct 2025") },
        { id: 'proj_vasion2', customerName: "Vasion Phase 2", overallStatus: "On Track: OOB configuration", percentageCompletion: "40.00%", sowExecutionDate: parseSOWDate("26 Feb 2025") },
        { id: 'proj_verizon', customerName: "Verizon", overallStatus: "On Track: OOB configuration", percentageCompletion: "40.00%", sowExecutionDate: parseSOWDate("14 Jan 2025") },
        { id: 'proj_avalara', customerName: "Avalara (Dedicated Model)", overallStatus: "On Track: Custom work", percentageCompletion: "Custom Work", sowExecutionDate: parseSOWDate("1 Oct 2024") },
        { id: 'proj_phoenix', customerName: "Project Phoenix", overallStatus: "Planning", percentageCompletion: "10%", sowExecutionDate: parseSOWDate("TBD") },
        { id: 'proj_clientx', customerName: "ClientX Portal", overallStatus: "Discovery", percentageCompletion: "5%", sowExecutionDate: parseSOWDate("2025-01-15") },
        { id: 'proj_support', customerName: "Support & Maintenance", overallStatus: "Active", percentageCompletion: "N/A", sowExecutionDate: parseSOWDate("N/A") },
    ];
    setProjects(initialProjectData);

    const shaileshId = '686402f88b0464dbe04ac254';
    const sunilId = 'res_sunil_rao';
    const sageerId = 'res_sageer_shaikh';
    const philipId = 'res_philip_thomas';
    const varadrajId = 'res_varadraj_swami';
    const romaId = 'res_roma_soni';
   
    const initialDepartmentsData: Department[] = [
        { id: 'dept_dev', name: 'Development', leaderId: shaileshId },
        { id: 'dept_test', name: 'Global Testing', leaderId: sunilId },
        { id: 'dept_cust_pm_sc', name: 'Customization / PM / SC', leaderId: sageerId },
    ];
    setDepartmentsState(initialDepartmentsData);
        
    const june2025Tasks: Task[] = [
      { id: 'task_dev_planning_q3', projectId: 'proj_phoenix', title: 'Q3 2025 Development Roadmap Planning', description: 'Plan features and timeline for Q3 2025 for Project Phoenix.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, source: TaskSource.MANUAL, type: TaskType.ENHANCEMENT, assignedResourceId: shaileshId, teamLeadId: shaileshId, startDate: '2025-06-10', dueDate: '2025-06-20' },
      { id: 'task_asset_mgmt_enh', projectId: 'proj_lenovo_hub2', title: 'Asset View in Outlook (June 2025 Update)', description: 'Enhance asset viewing capabilities within MS Outlook for June 2025 release.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, source: TaskSource.CUSTOM_WORK, type: TaskType.ENHANCEMENT, assignedResourceId: philipId, teamLeadId: shaileshId, startDate: '2025-06-01', dueDate: '2025-06-15', accumulatedTime: 45 * 3600000 },
      { id: 'task_crm_sfdc_issue', projectId: 'proj_acronis', title: 'SFDC Integration Bug Fix (June 2025)', description: 'Investigate and fix reported bug in Salesforce integration for Acronis.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, source: TaskSource.SUPPORT_TICKET, type: TaskType.BUG, assignedResourceId: 'res_ashwani_crm', teamLeadId: 'res_furquan_ahmed', startDate: '2025-06-05', dueDate: '2025-06-25', accumulatedTime: 5 * 3600000},
      { id: 'task_test_strategy_q3', projectId: 'proj_support', title: 'Q3 2025 Global Test Strategy Document', description: 'Prepare the test strategy document for all projects in Q3 2025.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, source: TaskSource.MANUAL, type: TaskType.ENHANCEMENT, assignedResourceId: sunilId, teamLeadId: sunilId, startDate: '2025-06-12', dueDate: '2025-06-28', accumulatedTime: 15 * 3600000 },
    ];

    const july2025Tasks: Task[] = [
      { id: 'task_automation_framework_varadraj', projectId: 'proj_support', title: 'Enhance QA Automation Framework (July 2025)', description: 'Add new capabilities to the existing test automation framework for July 2025.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, source: TaskSource.GLOBAL, type: TaskType.ENHANCEMENT, assignedResourceId: varadrajId, teamLeadId: sunilId, startDate: '2025-07-01', dueDate: '2025-07-15', accumulatedTime: 50 * 3600000},
      { id: 'task_client_escalation_sageer', projectId: 'proj_verizon', title: 'Handle Verizon Client Escalation (July 2025)', description: 'Address and resolve client escalation from Verizon project.', status: TaskStatus.DONE, priority: TaskPriority.HIGH, source: TaskSource.SUPPORT_TICKET, type: TaskType.BUG, assignedResourceId: sageerId, teamLeadId: sageerId, startDate: '2025-07-03', dueDate: '2025-07-10', accumulatedTime: 8 * 3600000 },
      { id: 'task_custom_test_plan_roma', projectId: 'proj_clientx', title: 'ClientX Custom Test Plan Execution (July 2025)', description: 'Execute custom test plan for ClientX features.', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, source: TaskSource.CUSTOM_WORK, type: TaskType.ENHANCEMENT, assignedResourceId: romaId, teamLeadId: sageerId, startDate: '2025-07-08', dueDate: '2025-07-22', accumulatedTime: 30 * 3600000},
      { id: 'task_pm_milestone_aditya', projectId: 'proj_avalara', title: 'Avalara Project Milestone Tracking (July 2025)', description: 'Track and report on upcoming milestones for Avalara project.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, source: TaskSource.MANUAL, type: TaskType.ENHANCEMENT, assignedResourceId: 'res_aditya_soni_pm', teamLeadId: sageerId, startDate: '2025-07-05', dueDate: '2025-07-18'},
      { id: 'task_internal_training_philip', projectId: 'proj_support', title: 'Internal Training on New Automation Tool (July)', description: 'Conduct training for QA team.', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, source: TaskSource.MANUAL, type: TaskType.ENHANCEMENT, assignedResourceId: philipId, teamLeadId: shaileshId, startDate: '2025-07-10', dueDate: '2025-07-17'},
      { id: 'task_security_audit_varadraj', projectId: 'proj_phoenix', title: 'Security Audit for Phoenix App (July)', description: 'Perform comprehensive security audit.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, source: TaskSource.MANUAL, type: TaskType.ENHANCEMENT, assignedResourceId: varadrajId, teamLeadId: sunilId, startDate: '2025-07-15', dueDate: '2025-07-30', accumulatedTime: 12 * 3600000},
      { id: 'task_client_demo_roma', projectId: 'proj_clientx', title: 'Prepare ClientX Demo for Stakeholders (July)', description: 'Prepare and rehearse demo for new features.', status: TaskStatus.TODO, priority: TaskPriority.HIGH, source: TaskSource.CUSTOM_WORK, type: TaskType.ENHANCEMENT, assignedResourceId: romaId, teamLeadId: sageerId, startDate: '2025-07-20', dueDate: '2025-07-28'},
    ];
    
    setTasks([...june2025Tasks, ...july2025Tasks]);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() -1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() -2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];


    const initialTimesheetEntries: TimesheetEntry[] = [
      { id: 'ts_entry_1', resourceId: shaileshId, date: '2025-06-15', hoursLogged: 8, notes: 'Worked on feature X planning and design.' },
      { id: 'ts_entry_philip_1', resourceId: philipId, date: todayStr, hoursLogged: 7.5, notes: 'Core module refactoring for Lenovo Hub.' },
      { id: 'ts_entry_philip_2', resourceId: philipId, date: yesterdayStr, hoursLogged: 8, notes: 'Code review and bug fixes.' },
      { id: 'ts_entry_sunil_1', resourceId: sunilId, date: '2025-06-25', hoursLogged: 8, notes: 'Finalizing Q3 2025 Test Strategy.' },
      { id: 'ts_entry_roma_1', resourceId: romaId, date: todayStr, hoursLogged: 6, notes: 'Testing ClientX custom module.' },
      { id: 'ts_entry_roma_2', resourceId: romaId, date: yesterdayStr, hoursLogged: 7, notes: 'Documenting test cases for ClientX.' },
      { id: 'ts_entry_varadraj_1', resourceId: varadrajId, date: todayStr, hoursLogged: 8, notes: 'Working on QA Automation Framework enhancements.' },
      { id: 'ts_entry_varadraj_2', resourceId: varadrajId, date: yesterdayStr, hoursLogged: 7, notes: 'Regression testing for Support project.' },
      { id: 'ts_entry_varadraj_3', resourceId: varadrajId, date: twoDaysAgoStr, hoursLogged: 8, notes: 'Test planning for Phoenix security audit.' },
    ];
    setTimesheetEntries(initialTimesheetEntries);

    // Holiday Data
    const indiaGazettedHolidays2025 = [
        { name: "Republic Day", date: "2025-01-26" },
        { name: "Maha Shivaratri/Shivaratri", date: "2025-02-26" },
        { name: "Holi", date: "2025-03-14" },
        { name: "Ramzan Id (Eid al-Fitr)", date: "2025-03-31" }, // Tentative
        { name: "Mahavir Jayanti", date: "2025-04-10" },
        { name: "Good Friday", date: "2025-04-18" },
        { name: "Buddha Purnima/Vesak", date: "2025-05-12" },
        { name: "Bakrid (Eid al-Adha)", date: "2025-06-07" }, // Tentative, from list
        { name: "Muharram/Ashura", date: "2025-07-06" }, // Tentative
        { name: "Independence Day", date: "2025-08-15" },
        { name: "Janmashtami", date: "2025-08-16" },
        { name: "Milad un-Nabi/Id-e-Milad", date: "2025-09-05" }, // Tentative
        { name: "Mahatma Gandhi Jayanti", date: "2025-10-02" },
        { name: "Dussehra", date: "2025-10-02" },
        { name: "Diwali/Deepavali", date: "2025-10-20" },
        { name: "Guru Nanak Jayanti", date: "2025-11-05" },
        { name: "Christmas", date: "2025-12-25" },
    ];

    const usaHolidays2025 = [
        { name: "New Year's Day", date: "2025-01-01" },
        { name: "Martin Luther King Jr. Day", date: "2025-01-20" },
        { name: "Presidents' Day", date: "2025-02-17" }, // (Washington's Birthday)
        { name: "Memorial Day", date: "2025-05-26" },
        { name: "Juneteenth National Independence Day", date: "2025-06-19" },
        { name: "Independence Day", date: "2025-07-04" },
        { name: "Labor Day", date: "2025-09-01" },
        { name: "Columbus Day", date: "2025-10-13" },
        { name: "Veterans Day", date: "2025-11-11" },
        { name: "Thanksgiving Day", date: "2025-11-27" },
        { name: "Christmas Day", date: "2025-12-25" },
    ];
    
    const holidayEvents: CalendarEvent[] = [
      ...indiaGazettedHolidays2025.map((h, i) => ({
        id: `holiday_in_gazetted_${i}_${h.date.replace(/-/g, '')}`, 
        title: `(India) ${h.name}`,
        date: h.date,
        color: 'bg-amber-500', 
        description: "Public Holiday in India"
      })),
      ...usaHolidays2025.map((h, i) => ({
        id: `holiday_us_public_${i}_${h.date.replace(/-/g, '')}`, 
        title: `(USA) ${h.name}`,
        date: h.date,
        color: 'bg-sky-500', 
        description: "Public Holiday in USA"
      }))
    ];
    
    const initialCalendarEvents: CalendarEvent[] = [
        { id: 'event_qbr', title: "Quarterly Business Review (Q1 2025)", date: '2025-03-25', startTime: '10:00', endTime: '13:00', description: "All Heads and Managers to attend.", color: 'bg-blue-600' },
        { id: 'event_dev_sync', title: "Dev Team Sync (June 2025)", date: '2025-06-05', startTime: '14:00', endTime: '15:00', description: "Discuss Asset Management module progress.", color: 'bg-purple-500' },
        ...holidayEvents
    ];
    setCalendarEvents(initialCalendarEvents);

  }, []);



  if (isLoadingResource) {
    return <div>Loading resources...</div>;
  }

  if (errorResource) {
    return <div>Error: {errorResource}</div>;
  }

  const navigateTo = (view: AppView) => setCurrentView(view);

  const handleSelectUserForPlanner = (userId: ResourceId) => {
    setSelectedPersonalPlannerUserId(userId);
    setCurrentView(AppView.PLANNER);
    setIsPersonalPlannerDropdownOpen(false); 
    setPersonalPlannerSearchTerm(''); 
  };

  const handleAddOrEditResource = (resourceData:  Resource[]) => {
    if ('githubId' in resourceData) setResources(resources.map(r => r.githubId === resourceData.githubId ? { ...r, ...resourceData, birthDate: parseBirthDate(resourceData.birthDate), joiningDate: parseJoiningDate(resourceData.joiningDate) } : r));
    else { const newResource: Resource = { githubId: `res_${self.crypto.randomUUID().substring(0,8)}`, ...resourceData, birthDate: parseBirthDate(resourceData.birthDate), joiningDate: parseJoiningDate(resourceData.joiningDate), }; setResources([...resources, newResource]); }
    closeResourceModal();
  };
  const handleDeleteResource = (resourceId: ResourceId) => {
    if (window.confirm('Are you sure you want to delete this resource and all their direct reports? This cannot be undone.')) {
      const resourcesToDelete = new Set<ResourceId>(); const queue: ResourceId[] = [resourceId];
      while(queue.length > 0) { const currentId = queue.shift(); if (currentId) { resourcesToDelete.add(currentId); resources.filter(r => r.parentId === currentId).forEach(child => queue.push(child.githubId)); } }
      setResources(resources.filter(r => !resourcesToDelete.has(r.githubId)));
      setTasks(tasks.map(t => (resourcesToDelete.has(t.assignedResourceId || '') ? { ...t, assignedResourceId: undefined } : t)));
      setTasks(tasks.map(t => (resourcesToDelete.has(t.teamLeadId || '') ? { ...t, teamLeadId: undefined } : t)));
      setDepartmentsState(departments.map(d => (resourcesToDelete.has(d.leaderId || '') ? { ...d, leaderId: undefined } : d)));
      setTimesheetEntries(timesheetEntries.filter(te => !resourcesToDelete.has(te.resourceId)));
      if (selectedPersonalPlannerUserId && resourcesToDelete.has(selectedPersonalPlannerUserId)) {
        setSelectedPersonalPlannerUserId(''); 
      }
    }
  };
  const openResourceModal = (resource?: Resource) => { setEditingResource(resource || null); setIsResourceModalOpen(true); };
  const closeResourceModal = () => { setIsResourceModalOpen(false); setEditingResource(null); };

  const handleAddOrEditTask = (taskData: Omit<Task, 'id'> | Task) => {
    if ('id' in taskData) setTasks(tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
    else { const newTask: Task = { id: `task_${self.crypto.randomUUID().substring(0,8)}`, ...taskData }; setTasks([...tasks, newTask]); }
    closeTaskModal();
  };
  const handleDeleteTask = (taskId: TaskId) => { if (window.confirm('Are you sure you want to delete this task?')) setTasks(tasks.filter(t => t.id !== taskId)); };
  const openTaskModal = (task?: Task) => { setEditingTask(task || null); setIsTaskModalOpen(true); };
  const closeTaskModal = () => { setIsTaskModalOpen(false); setEditingTask(null); setAiSuggestedTask(null); };
  const handleTaskStatusChange = (taskId: TaskId, status: TaskStatus) => setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, status } : task));
  const handleTaskTimerToggle = (taskId: TaskId) => {
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
            if (task.isTimerRunning) { const elapsed = Date.now() - (task.actualStartTime || Date.now()); return { ...task, isTimerRunning: false, accumulatedTime: (task.accumulatedTime || 0) + elapsed, actualStartTime: undefined }; }
            else return { ...task, isTimerRunning: true, actualStartTime: Date.now() };
        } return task;
    }));
  };
  const handleTaskTimeLog = (taskId: TaskId, newAccumulatedTime: number) => setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, accumulatedTime: newAccumulatedTime, isTimerRunning: false, actualStartTime: undefined } : task ));

  const openAssignTaskModal = (manager: Resource) => {
    setAssignTaskModalManager(manager);
    setIsAssignTaskModalOpen(true);
  };
  const closeAssignTaskModal = () => {
    setIsAssignTaskModalOpen(false);
    setAssignTaskModalManager(null);
  };
  const handleReassignTaskInModal = (taskId: TaskId, newResourceId: ResourceId | undefined, newStatus?: TaskStatus) => {
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                assignedResourceId: newResourceId,
                status: newStatus !== undefined ? newStatus : task.status 
            };
        }
        return task;
    }));
  };


  const handleAddOrEditTimesheetEntry = (entryData: Omit<TimesheetEntry, 'id'> | TimesheetEntry) => {
    if ('id' in entryData) {
        setTimesheetEntries(timesheetEntries.map(te => te.id === entryData.id ? { ...te, ...entryData } : te));
    } else {
        const newEntry: TimesheetEntry = { id: `ts_${self.crypto.randomUUID().substring(0,8)}`, ...entryData };
        setTimesheetEntries([...timesheetEntries, newEntry]);
    }
    closeTimesheetModal();
  };
  const handleDeleteTimesheetEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this timesheet entry?')) {
        setTimesheetEntries(timesheetEntries.filter(te => te.id !== entryId));
    }
  };
  const openTimesheetModal = (entryOrDate?: TimesheetEntry | string, resourceId?: ResourceId) => {
    if (typeof entryOrDate === 'string') { // Date string for new entry
        setDefaultTimesheetDate(entryOrDate);
        setDefaultTimesheetResource(resourceId);
        setEditingTimesheetEntry(null);
    } else { // Existing entry object or undefined for new
        setDefaultTimesheetDate(undefined);
        setDefaultTimesheetResource(undefined);
        setEditingTimesheetEntry(entryOrDate || null);
    }
    setIsTimesheetModalOpen(true);
  };
  const closeTimesheetModal = () => { setIsTimesheetModalOpen(false); setEditingTimesheetEntry(null); setDefaultTimesheetDate(undefined); setDefaultTimesheetResource(undefined);};

  const handleAddOrEditProject = (projectData: Omit<Project, 'id'> | Project) => {
    if ('id' in projectData) {
        setProjects(projects.map(p => p.id === projectData.id ? { ...p, ...projectData, sowExecutionDate: parseSOWDate(projectData.sowExecutionDate) } : p));
    } else {
        const newProject: Project = { 
            id: `proj_${self.crypto.randomUUID().substring(0,8)}`, 
            ...projectData,
            sowExecutionDate: parseSOWDate(projectData.sowExecutionDate)
        };
        setProjects([...projects, newProject]);
    }
    closeProjectModal();
  };
  const handleDeleteProject = (projectId: ProjectId) => {
    if (window.confirm('Are you sure you want to delete this project? This will also remove associated tasks.')) {
        setProjects(projects.filter(p => p.id !== projectId));
        setTasks(tasks.filter(t => t.projectId !== projectId));
    }
  };
  const openProjectModal = (project?: Project) => { setEditingProject(project || null); setIsProjectModalOpen(true); };
  const closeProjectModal = () => { setIsProjectModalOpen(false); setEditingProject(null); };

  const handleAddOrEditDepartment = (departmentData: Omit<Department, 'id'> | Department) => {
    if ('id' in departmentData) {
        setDepartmentsState(departments.map(d => d.id === departmentData.id ? { ...d, ...departmentData } : d));
    } else {
        const newDepartment: Department = { id: `dept_${self.crypto.randomUUID().substring(0,8)}`, ...departmentData };
        setDepartmentsState([...departments, newDepartment]);
    }
    closeDepartmentModal();
  };
  const handleDeleteDepartment = (departmentId: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
        setDepartmentsState(departments.filter(d => d.id !== departmentId));
    }
  };
  const openDepartmentModal = (department?: Department) => { setEditingDepartment(department || null); setIsDepartmentModalOpen(true); };
  const closeDepartmentModal = () => { setIsDepartmentModalOpen(false); setEditingDepartment(null); };

  const handleAddOrEditEvent = (eventData: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    if ('id' in eventData) {
        setCalendarEvents(calendarEvents.map(ev => ev.id === eventData.id ? { ...ev, ...eventData } : ev));
    } else {
        const newEvent: CalendarEvent = { id: `evt_${self.crypto.randomUUID().substring(0,8)}`, ...eventData };
        setCalendarEvents([...calendarEvents, newEvent]);
    }
    closeEventModal();
  };
  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        setCalendarEvents(calendarEvents.filter(ev => ev.id !== eventId));
    }
  };
  const openNewEventModal = (date?: string) => {
    setDefaultEventDate(date);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };
  const openEditEventModal = (event: CalendarEvent) => {
    setDefaultEventDate(event.date);
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };
  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setDefaultEventDate(undefined);
  };

 const handleAiSuggestTask = async () => {
    setIsSuggestingTask(true);
    setTaskSuggestionError(null);
    setAiSuggestedTask(null);
    try {
        if (!process.env.API_KEY) {
            setTaskSuggestionError("AI suggestion unavailable: API Key not configured.");
            setIsSuggestingTask(false);
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const existingTaskTitles = tasks.slice(0, 3).map(t => t.title).join(", ");
        const prompt = `Suggest a new, relevant task for a software development team. Consider these existing tasks if any: "${existingTaskTitles}". The team works on various projects. Provide a concise title (max 10 words) and a 1-2 sentence description. Format as: Title: [Your Title]\nDescription: [Your Description]`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        
        const text = response.text;
        const titleMatch = text.match(/Title: (.*)/);
        const descriptionMatch = text.match(/Description: (.*)/);

        if (titleMatch && titleMatch[1] && descriptionMatch && descriptionMatch[1]) {
            setAiSuggestedTask({ title: titleMatch[1].trim(), description: descriptionMatch[1].trim() });
        } else {
            const lines = text.split('\n');
            const parsedTitle = lines.find(line => line.startsWith("Title:"))?.substring("Title:".length).trim();
            const parsedDesc = lines.find(line => line.startsWith("Description:"))?.substring("Description:".length).trim() || lines.slice(1).join(' ').trim();
            
            if (parsedTitle) {
                 setAiSuggestedTask({ title: parsedTitle, description: parsedDesc || "AI suggested description." });
            } else {
                 setAiSuggestedTask({ title: "AI Suggested Task", description: text || "Could not parse suggestion fully."});
                 console.warn("AI task suggestion parsing failed, using raw text.", text);
            }
        }
    } catch (error: any) {
        console.error("Failed to suggest task:", error);
        let errorMessage = "Could not suggest a task. Please try again later.";
        if (error.message?.includes("API_KEY")) {
            errorMessage = "AI suggestion unavailable: API Key not configured.";
        } else if (error.message?.includes("Quota") || error.message?.includes("rate limit")) {
            errorMessage = "AI suggestion temporarily unavailable (rate limit). Try again soon.";
        }
        setTaskSuggestionError(errorMessage);
    } finally {
        setIsSuggestingTask(false);
    }
  };

  const handleAddSuggestedTask = () => {
    if (aiSuggestedTask) {
      const newTaskData: Partial<Task> = { 
        title: aiSuggestedTask.title,
        description: aiSuggestedTask.description,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        source: TaskSource.MANUAL, 
        type: TaskType.ENHANCEMENT,
      };
      openTaskModal(newTaskData as Task); 
      setAiSuggestedTask(null);
    }
  };


const PlannerViewWrapper: React.FC = () => {
    if (!selectedPersonalPlannerUserId) {
        return (
            <div className="flex flex-col gap-6">
              <section className="bg-slate-800/60 p-6 rounded-xl shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-[#F29C2A]">Resources & Departments (Full Overview)</h2>
                   <div className="flex space-x-2">
                      <button onClick={() => openDepartmentModal()} className="text-xs px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors" aria-label="Add new department">+ Dept</button>
                      <button onClick={() => openResourceModal()} className="text-xs px-2 py-1 bg-[#F29C2A] hover:bg-[#EE4D1E] text-white rounded-md transition-colors" aria-label="Add new resource">+ Resource</button>
                  </div>
                </div>
                <ResourceTree 
                  resources={resources} 
                  tasks={tasks} 
                  departments={departments} 
                  onEdit={openResourceModal} 
                  onDelete={handleDeleteResource} 
                  onEditDepartment={openDepartmentModal} 
                  onDeleteDepartment={handleDeleteDepartment} 
                  onOpenAssignTaskModal={openAssignTaskModal}
                />
              </section>

              {departments.map(dept => {
                const departmentMembers = getDepartmentMembersRecursive(dept.leaderId, resources);
                if (departmentMembers.length === 0 && !dept.leaderId) return null;
                // Only render TeamTaskAllocationSummary if there are members or a leader defined for the department
                const leaderName = resources.find(r => r.id === dept.leaderId)?.name;
                const title = `${dept.name} Department ${leaderName ? `(Lead: ${leaderName})` : '(No Leader)'} - Task Allocation`;
                return (
                    <TeamTaskAllocationSummary
                        key={dept.id}
                        teamMembers={departmentMembers}
                        tasks={tasks}
                        title={title}
                        onSelectUser={handleSelectUserForPlanner}
                    />
                );
              })}
               {/* "Orphaned" resources tasks (no department, no direct reports) */}
                {resources.filter(r => !r.parentId && !departments.some(d => d.leaderId === r.id)).map(orphanResource => (
                     <TeamTaskAllocationSummary
                        key={`orphan_summary_${orphanResource.id}`}
                        teamMembers={[orphanResource]}
                        tasks={tasks}
                        title={`${orphanResource.name} - Task Allocation`}
                        onSelectUser={handleSelectUserForPlanner}
                    />
                ))}
            </div>
        );
    }
    const viewingUser = resources.find(r => r.githubId === selectedPersonalPlannerUserId);
    if (!viewingUser) return <p className="text-red-400">Error: Selected user for planner not found.</p>;
    
    const userTasks = tasks.filter(t => t.assignedResourceId === selectedPersonalPlannerUserId);

    return (
       <KanbanView 
            tasks={userTasks} 
            resources={resources} 
            projects={projects} 
            onEditTask={openTaskModal}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleTaskStatusChange}
            onTimerToggle={handleTaskTimerToggle}
            onTimeLog={handleTaskTimeLog}
            viewingUser={viewingUser}
        />
    );
};

const mainContentClass = "flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar-xs";
const handleSyncComplete = (success: boolean, issueCount: number, message: string) => {
  if (success) {
      console.log(`✅ ${message}`);
  } else {
      console.error(`❌ ${message}`);
  }
};

const handleSyncStart = (userLogin: string, timestamp: string) => {
  console.log(`🔄 Sync started by ${userLogin} at ${timestamp}`);
  // Example output: "🔄 Sync started by phani554 at 2025-07-07 13:30:17"
};



  return (
    <div className="min-h-screen flex flex-col text-slate-100">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-md shadow-lg p-4 sticky top-0 z-40">
            <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                   <MindMatrixLogo className="h-10 sm:h-12 text-[#F29C2A]" />
                </div>
                <div className="flex-1 flex justify-center">
                      <AuthButton compact />
                </div>

                <div className=" flex ">
                  <div className = "flex gap-5 mr-5 items-center">
                    {syncStatus.isLoading
                        ? 'Checking status...'
                        : syncStatus.success
                            ? `Last Synced ${formatLastSynced(syncStatus.timestamp)}`
                            : syncStatus.message // This will now correctly show the auth error
                    }                  
                    <SyncButton
                        showAdvancedOptions={true}
                        onSyncComplete={handleSyncComplete}
                        onSyncStart={handleSyncStart}
                    />
                  </div>
                </div>


                <div className="relative group">
                    <button 
                        onClick={() => setIsPersonalPlannerDropdownOpen(prev => !prev)}
                        className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md flex items-center transition-colors"
                    >
                        {selectedPersonalPlannerUserId && resources.find(r => r.id === selectedPersonalPlannerUserId) 
                            ? `Planner: ${resources.find(r => r.id === selectedPersonalPlannerUserId)?.name}` 
                            : 'Global Planner'}
                        <ChevronDownIcon className={`w-4 h-4 ml-2 transform transition-transform ${isPersonalPlannerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isPersonalPlannerDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-50 py-2 max-h-80 overflow-y-auto custom-scrollbar-xs">
                            <input 
                                type="text" 
                                placeholder="Search resource..." 
                                value={personalPlannerSearchTerm}
                                onChange={e => setPersonalPlannerSearchTerm(e.target.value)}
                                className="sticky top-0 bg-slate-700 text-slate-100 text-xs w-full px-3 py-2 border-b border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#F29C2A]"
                            />
                            <a href="#" onClick={(e) => { e.preventDefault(); handleSelectUserForPlanner(''); }} className={`block px-4 py-2 text-sm hover:bg-slate-700 ${!selectedPersonalPlannerUserId ? 'text-[#F29C2A]' : 'text-slate-300'}`}>
                                Global Planner
                            </a>
                            {resources
                                .filter(r => r.name.toLowerCase().includes(personalPlannerSearchTerm.toLowerCase()))
                                .sort((a,b) => a.name.localeCompare(b.name))
                                .map(resource => (
                                <a 
                                    key={resource.githubId} 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); handleSelectUserForPlanner(resource.githubId); }}
                                    className={`block px-4 py-2 text-sm hover:bg-slate-700 ${selectedPersonalPlannerUserId === resource.githubId ? 'text-[#F29C2A]' : 'text-slate-300'}`}
                                >
                                    {resource.name} <span className="text-xs text-slate-500">({resource.role})</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-20 hover:w-56 bg-slate-800/70 backdrop-blur-sm p-3 space-y-2 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar-xs group">
          {[
            { view: AppView.DASHBOARD, label: 'Dashboard', icon: DashboardIcon },
            { view: AppView.PLANNER, label: selectedPersonalPlannerUserId ? 'Personal Planner' : 'Team Planner', icon: ClipboardListIcon },
            { view: AppView.CALENDAR, label: 'Calendar', icon: CalendarIcon },
            { view: AppView.REPORT, label: 'Report', icon: ReportIcon },
            { view: AppView.TEAM_ROSTER, label: 'Team Roster', icon: TeamIcon },
            { view: AppView.TIMESHEET, label: 'Timesheet', icon: TimesheetIcon },
            { view: AppView.ISSUE, label: 'Github Issues', icon: ReportIcon },
          ].map(navItem => (
            <button 
              key={navItem.view} 
              onClick={() => navigateTo(navItem.view)} 
              className={`w-full flex items-center space-x-3 p-2.5 rounded-lg transition-colors text-sm font-medium
                          ${currentView === navItem.view ? 'bg-[#F29C2A] text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'}`}
              title={navItem.label}
              aria-current={currentView === navItem.view ? 'page' : undefined}
            >
              <navItem.icon className="w-5 h-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 truncate">{navItem.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className={mainContentClass}>
            {currentView === AppView.DASHBOARD && <DashboardView resources={resources} tasks={tasks} departments={departments} projects={projects} timesheetEntries={timesheetEntries} selectedPersonalPlannerUserId={selectedPersonalPlannerUserId} onOpenTaskDetailModal={openTaskDetailModal} onOpenTaskModal={openTaskModal} onOpenNewEventModal={openNewEventModal} onOpenTimesheetModal={openTimesheetModal} />}
            {currentView === AppView.PLANNER && <PlannerViewWrapper />}
            {currentView === AppView.CALENDAR && <CalendarView tasks={tasks} projects={projects} resources={resources} events={calendarEvents} onAddEvent={openNewEventModal} onEditEvent={openEditEventModal} onDeleteEvent={handleDeleteEvent}/>}
            {currentView === AppView.REPORT && <ReportView resources={resources} tasks={tasks} departments={departments} projects={projects} onAddProject={() => openProjectModal()} onEditProject={openProjectModal} onDeleteProject={handleDeleteProject}/>}
            {currentView === AppView.ISSUE && <IssueView resources={resources} />}
            {currentView === AppView.TEAM_ROSTER && <TeamRosterView resources={resources} departments={departments} onEditResource={openResourceModal} />}
            {currentView === AppView.TIMESHEET && <TimesheetView entries={timesheetEntries} resources={resources} departments={departments} onAddEntry={openTimesheetModal} onEditEntry={openTimesheetModal} onDeleteEntry={handleDeleteTimesheetEntry} selectedPersonalPlannerUserId={selectedPersonalPlannerUserId} />}
        </main>
      </div>

      {/* AI Task Suggestion Floating Section (Optional - Can be integrated better) */}
      {currentView !== AppView.PLANNER && ( // Don't show on planner view for now
        <div className="fixed bottom-4 right-4 bg-slate-800 p-4 rounded-lg shadow-xl z-30 max-w-sm w-full sm:w-auto border border-slate-700">
          <h4 className="text-sm font-semibold text-[#F29C2A] mb-2">✨ AI Task Suggestion</h4>
          {isSuggestingTask && <p className="text-xs text-slate-400 italic">Thinking of a new task...</p>}
          {!isSuggestingTask && taskSuggestionError && <p className="text-xs text-red-400">{taskSuggestionError}</p>}
          {!isSuggestingTask && aiSuggestedTask && (
            <div className="text-xs space-y-1 mb-2">
              <p className="text-slate-300"><strong>Title:</strong> {aiSuggestedTask.title}</p>
              <p className="text-slate-400"><strong>Desc:</strong> {aiSuggestedTask.description}</p>
            </div>
          )}
          <div className="flex space-x-2">
            <button 
              onClick={handleAiSuggestTask} 
              disabled={isSuggestingTask}
              className="flex-1 text-xs px-2 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors disabled:bg-slate-600"
            >
              {isSuggestingTask ? 'Suggesting...' : 'Suggest New Task'}
            </button>
            {aiSuggestedTask && (
              <button 
                onClick={handleAddSuggestedTask} 
                className="flex-1 text-xs px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Add This Task
              </button>
            )}
          </div>
        </div>
      )}


      {/* Modals */}
      {isResourceModalOpen && <Modal isOpen={isResourceModalOpen} onClose={closeResourceModal} title={editingResource ? 'Edit Resource' : 'Add Resource'}><ResourceForm onSubmit={handleAddOrEditResource} initialData={editingResource} allResources={resources} onClose={closeResourceModal} /></Modal>}
      {isTaskModalOpen && <Modal isOpen={isTaskModalOpen} onClose={closeTaskModal} title={editingTask?.id ? 'Edit Task' : 'Add Task'}><TaskForm onSubmit={handleAddOrEditTask} initialData={editingTask || aiSuggestedTask as Task} resources={resources} teamLeads={resources.filter(r => departments.some(d => d.leaderId === r.id) || (!r.parentId && resources.some(child => child.parentId === r.id)))} projects={projects} onClose={closeTaskModal} /></Modal>}
      {isTimesheetModalOpen && <Modal isOpen={isTimesheetModalOpen} onClose={closeTimesheetModal} title={editingTimesheetEntry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}><TimesheetEntryForm onSubmit={handleAddOrEditTimesheetEntry} initialData={editingTimesheetEntry} resources={resources} onClose={closeTimesheetModal} defaultDate={defaultTimesheetDate} defaultResourceId={defaultTimesheetResource} /></Modal>}
      {isProjectModalOpen && <Modal isOpen={isProjectModalOpen} onClose={closeProjectModal} title={editingProject ? 'Edit Project' : 'Add Project'}><ProjectForm onSubmit={handleAddOrEditProject} initialData={editingProject} onClose={closeProjectModal}/></Modal>}
      {isDepartmentModalOpen && <Modal isOpen={isDepartmentModalOpen} onClose={closeDepartmentModal} title={editingDepartment ? 'Edit Department' : 'Add Department'}><DepartmentForm onSubmit={handleAddOrEditDepartment} initialData={editingDepartment} resources={resources} onClose={closeDepartmentModal}/></Modal>}
      {isEventModalOpen && <Modal isOpen={isEventModalOpen} onClose={closeEventModal} title={editingEvent ? 'Edit Event' : 'Add Event'}><EventForm onSubmit={handleAddOrEditEvent} initialData={editingEvent} defaultDate={defaultEventDate} tasks={tasks} onClose={closeEventModal}/></Modal>}
      {isTaskDetailModalOpen && <Modal isOpen={isTaskDetailModalOpen} onClose={closeTaskDetailModal} title={taskDetailModalTitle}><div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1 custom-scrollbar-xs">{tasksForDetailModal.map(task => <TaskItem key={task.id} task={task} resources={resources} teamLeads={resources} projects={projects} onEdit={openTaskModal} onDelete={handleDeleteTask} onStatusChange={handleTaskStatusChange} onTimerToggle={handleTaskTimerToggle} onTimeLog={handleTaskTimeLog} />)}</div></Modal>}
      {isAssignTaskModalOpen && assignTaskModalManager && (
          <AssignTaskModal
            isOpen={isAssignTaskModalOpen}
            onClose={closeAssignTaskModal}
            manager={assignTaskModalManager}
            allResources={resources}
            allTasks={tasks}
            projects={projects}
            onReassignTask={handleReassignTaskInModal}
            getResourceHierarchy={getResourceHierarchy}
          />
        )}
    </div>
  );
};

export default App;
