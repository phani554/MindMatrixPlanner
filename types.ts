
export type ResourceId = string;
export type TaskId = string;
export type ProjectId = string; // New type for Project ID

export interface Resource {
  id: ResourceId;
  name:string;
  username: string,
  role: string;
  reportsTo?: ResourceId | null; // For hierarchy
  birthDate?: string | null; 
  joiningDate?: string | null;
  email?: string | null;
  contactNumber?: string | null;
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TaskSource {
  CUSTOM_WORK = 'Custom Work',
  GLOBAL = 'Global',
  GIT_COMMIT = 'Git Commit',
  SUPPORT_TICKET = 'Support Ticket',
  MANUAL = 'Manual Task',
}

export enum TaskType {
  BUG = 'Bug',
  ENHANCEMENT = 'New Enhancement',
}

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: TaskSource;
  type: TaskType;
  projectId?: ProjectId; // Added projectId
  assignedResourceId?: ResourceId;
  teamLeadId?: ResourceId;
  dueDate?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  hoursSpent?: number; 
  externalLink?: string; 
  actualStartTime?: number; 
  isTimerRunning?: boolean; 
  accumulatedTime?: number; 
}

export interface Issue {
  githubId: Number;
  number: Number;
  title: String;
  state: String;
  createdAt: Date;
  updatedAt: Date;

}

export interface Project {
  id: ProjectId;
  customerName: string;
  overallStatus: string;
  percentageCompletion: string; // Can be "X.XX%" or "Custom Work" or "X%"
  sowExecutionDate?: string; // YYYY-MM-DD or TBD
}

// For new viewsa
export enum AppView {
  DASHBOARD = 'Dashboard',
  PLANNER = 'Planner',
  PERSONAL_KANBAN_PLANNER = 'Personal Kanban Planner', // Represents a state rather than a direct nav item
  CALENDAR = 'Calendar',
  REPORT = 'Report',
  TEAM_ROSTER = 'Team Roster',
  TIMESHEET = 'Timesheet',
  ISSUE = "Github Issues",
}

export interface Department {
  id: string;
  name: string;
  leaderId?: ResourceId; // Made leaderId optional
}

export interface TimesheetEntry {
  id: string;
  resourceId: ResourceId;
  date: string; // YYYY-MM-DD
  hoursLogged: number;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  description?: string;
  color?: string; // e.g., 'blue', 'green', 'red' or hex
}
    