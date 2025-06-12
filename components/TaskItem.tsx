
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Resource, TaskSource, TaskType, TaskId, Project, ProjectId } from '../types';
import { EditIcon, TrashIcon, UserIcon, LinkIcon, PlayIcon, PauseIcon } from './icons';

interface TaskItemProps {
  task: Task;
  resources: Resource[];
  teamLeads: Resource[];
  projects: Project[]; // Added projects prop
  onEdit: (task: Task) => void;
  onDelete: (taskId: TaskId) => void;
  onStatusChange: (taskId: TaskId, status: TaskStatus) => void;
  onTimerToggle: (taskId: TaskId, accumulatedTime?: number) => void; 
  onTimeLog: (taskId: TaskId, newAccumulatedTime: number) => void;
}

const priorityColorMap: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: 'border-red-500 bg-red-500/20 text-red-400',
  [TaskPriority.MEDIUM]: 'border-yellow-500 bg-yellow-500/20 text-yellow-400', 
  [TaskPriority.LOW]: 'border-green-500 bg-green-500/20 text-green-400',
};

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-slate-500 text-slate-100',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500 text-white', 
  [TaskStatus.DONE]: 'bg-emerald-500 text-white',
};

const SourceIcon: React.FC<{ source: TaskSource, className?: string }> = ({ source, className="w-4 h-4 mr-1.5" }) => {
  switch (source) {
    case TaskSource.CUSTOM_WORK: 
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-purple-400`}><path d="M3.75 4.5a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7ZM5.25 3h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5ZM12.25 4.5a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Z" /><path fillRule="evenodd" d="M1.5 6.25A2.75 2.75 0 0 1 4.25 3.5h7.5A2.75 2.75 0 0 1 14.5 6.25v3.5A2.75 2.75 0 0 1 11.75 12.5h-7.5A2.75 2.75 0 0 1 1.5 9.75v-3.5ZM4.25 5A1.25 1.25 0 0 0 3 6.25v3.5A1.25 1.25 0 0 0 4.25 11h7.5A1.25 1.25 0 0 0 13 9.75v-3.5A1.25 1.25 0 0 0 11.75 5h-7.5Z" clipRule="evenodd" /></svg>;
    case TaskSource.GLOBAL: 
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-cyan-400`}><path d="M8.502 1.037a.75.75 0 0 0-.997-.006A7.25 7.25 0 0 0 3.003 6.559c-.24.685-.359 1.39-.359 2.097 0 .707.119 1.412.36 2.097A7.25 7.25 0 0 0 7.505 15a.75.75 0 0 0 .997-.005 7.25 7.25 0 0 0 4.495-6.438c.24-.685.36-1.39.36-2.097s-.12-1.412-.36-2.097A7.25 7.25 0 0 0 8.502 1.037ZM8 13.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z" /><path d="M8.222 4.25A.75.75 0 0 0 7.25 5.163v.087A4.5 4.5 0 0 0 4.5 9.75H3.75a.75.75 0 0 0 0 1.5h.75A4.5 4.5 0 0 0 9 11.586v.064a.75.75 0 0 0 .972.723l.002-.001.004-.002.014-.007a4.406 4.406 0 0 0 .402-.168c.802-.438 1.363-1.24 1.585-2.23l.02-.09.003-.013.003-.013.001-.005a.75.75 0 0 0-1.44-.324l-.002.005-.003.01-.002.005-.012.051a3.001 3.001 0 0 1-2.756 1.676H6.087a3.001 3.001 0 0 1-1.04-4.89L5 6.75h5.25a.75.75 0 0 0 0-1.5H5.002l-.001-.002-.01-.006A2.98 2.98 0 0 1 5.25 4.5h2.25a.75.75 0 0 0 .722-.5Z" /></svg>;
    case TaskSource.GIT_COMMIT: 
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-lime-400`}><path fillRule="evenodd" d="M1.5 3.31v9.38a.75.75 0 0 0 1.5 0V8.372l2.005 2.005a.75.75 0 1 0 1.06-1.06L4.06 7.312l2.006-2.005a.75.75 0 0 0-1.061-1.06L3 6.252V3.31a.75.75 0 0 0-1.5 0Zm5.695 1.945L5.19 7.311l2.005 2.006a.75.75 0 1 0 1.061-1.06L6.25 6.251l2.006-2.005a.75.75 0 0 0-1.06-1.061Z" clipRule="evenodd" /><path d="M14.5 6.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm0 1.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z" /><path d="M14.5 15.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm0 1.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Z" /><path d="M8 7.311v1.377a2.75 2.75 0 1 0 1.5 0V7.31a2.75 2.75 0 1 0-1.5 0Z" /><path d="M9.5 8.688a4.251 4.251 0 1 0-3-1.377v1.377a4.25 4.25 0 0 0 3 0Z" /></svg>;
    case TaskSource.SUPPORT_TICKET: 
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-pink-400`}><path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 0 0 1 4.5v2.879a1.5 1.5 0 0 0 .44 1.06L7.604 14.6a1.5 1.5 0 0 0 2.121 0l4.837-4.837a1.5 1.5 0 0 0 0-2.122L8.396 1.44A1.5 1.5 0 0 0 7.379 1H4.5A1.5 1.5 0 0 0 3 2.5v.5Zm1-1a.5.5 0 0 1 .5-.5h2.879a.5.5 0 0 1 .353.146l6.164 6.164a.5.5 0 0 1 0 .708L8.559 13.89a.5.5 0 0 1-.707 0L1.688 7.727a.5.5 0 0 1-.146-.354V4.5a.5.5 0 0 1 .5-.5h.5Z" clipRule="evenodd" /><path d="M5 5.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /></svg>;
    case TaskSource.MANUAL: 
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-teal-400`}><path d="M11.354 1.646a.5.5 0 0 1 0 .708L3.707 10H3.5A1.5 1.5 0 0 0 2 11.5v1A1.5 1.5 0 0 0 3.5 14h1A1.5 1.5 0 0 0 6 12.5V12.293l7.646-7.647a.5.5 0 0 1 .708 0l.707.707a.5.5 0 0 1 0 .708L7.707 13H7.5a.5.5 0 0 1 0-1h.5V11.707l7.146-7.147a.5.5 0 0 0 0-.708l-.707-.707a.5.5 0 0 0-.708 0L6.293 10.707H6V11.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h.207L10.646.939a.5.5 0 0 1 .708 0l.707.707Z" /></svg>;
    default:
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-slate-500`}><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-2A5 5 0 1 0 8 3a5 5 0 0 0 0 10Z" clipRule="evenodd" /></svg>;
  }
};

const TypeIcon: React.FC<{ type: TaskType, className?: string }> = ({ type, className="w-4 h-4 mr-1.5" }) => {
  if (type === TaskType.BUG) { 
    return ( 
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-orange-400`}>
        <path fillRule="evenodd" d="M6.5 2a.5.5 0 0 0-.5.5V3h4V2.5a.5.5 0 0 0-1 0V3h-2V2.5a.5.5 0 0 0-.5-.5Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5v1.879a3.001 3.001 0 0 1 0 5.244V13.5A2.5 2.5 0 0 1 11.5 16h-7A2.5 2.5 0 0 1 2 13.5v-1.879a3.001 3.001 0 0 1 0-5.244V4.5Zm4.5 1a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3Zm-.75 2.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
      </svg>
    );
  } 
  return ( 
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`${className} text-yellow-300`}>
      <path d="M8.5 0a.5.5 0 0 0-1 0V2a.5.5 0 0 0 1 0V0ZM5.25 1.75a.5.5 0 0 0-.5-.5H4.5a.5.5 0 0 0 0 1h.25a.5.5 0 0 0 .5-.5ZM10.75 1.75a.5.5 0 0 0 .5-.5H11.5a.5.5 0 0 0 0 1h-.25a.5.5 0 0 0-.5-.5Z" />
      <path fillRule="evenodd" d="M6.01 3.01A3.502 3.502 0 0 1 8 2.5c1.93 0 3.5 1.57 3.5 3.5 0 .838-.294 1.606-.792 2.208a.5.5 0 0 0-.802.58l.001.002c.01.02.017.042.024.064l.36 1.14A1.5 1.5 0 0 1 9.5 11.5h-3A1.5 1.5 0 0 1 5.21 9.994l.36-1.14a2.451 2.451 0 0 1 .024-.064l.001-.002a.5.5 0 0 0-.802-.58A3.503 3.503 0 0 1 4.5 6c0-1.503.957-2.784 2.265-3.285a.5.5 0 0 1 .245-.705ZM6.5 12.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1ZM5 14.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-1Z" clipRule="evenodd" />
    </svg>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (ms?: number) => {
    if (ms === undefined || ms === null) return '0h 0m';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};


export const TaskItem: React.FC<TaskItemProps> = ({ task, resources, teamLeads, projects, onEdit, onDelete, onStatusChange, onTimerToggle, onTimeLog }) => {
  const assignedResource = resources.find(r => r.id === task.assignedResourceId);
  const teamLeadResource = teamLeads.find(r => r.id === task.teamLeadId);
  const project = projects.find(p => p.id === task.projectId); // Find project
  
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    let intervalId: number | undefined;
    if (task.isTimerRunning) {
      intervalId = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [task.isTimerRunning]);

  const displayTime = task.isTimerRunning && task.actualStartTime
    ? (task.accumulatedTime || 0) + (currentTime - task.actualStartTime)
    : (task.accumulatedTime || 0);


  const handleTimerClick = () => {
    onTimerToggle(task.id);
  };

  return (
    <div className={`bg-slate-700/80 p-4 rounded-lg shadow-lg hover:shadow-orange-500/20 transition-shadow duration-300 border-l-4 ${priorityColorMap[task.priority]} flex flex-col justify-between h-full`}> 
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-[#F29C2A] break-words w-[calc(100%-125px)] sm:w-[calc(100%-115px)]" title={task.title}>{task.title}</h3> 
          <select 
            value={task.status} 
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`text-xs px-2 py-1 rounded ${statusColorMap[task.status]} bg-opacity-80 border-none focus:ring-0 focus:outline-none cursor-pointer flex-shrink-0 ml-2`}
            style={{maxWidth: '120px'}}
            aria-label="Change task status"
          >
            {Object.values(TaskStatus).map(s => <option key={s} value={s} className="bg-slate-700 text-white">{s}</option>)}
          </select>
        </div>
        {project && ( // Display project name if available
            <p className="text-xs text-sky-400 mb-1.5" title={`Project: ${project.customerName}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mr-1 inline-block align-text-bottom"><path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 4H9.707l-.353-.354A1.5 1.5 0 0 0 8.293 3H3.5ZM3.5 4H8a.5.5 0 0 1 .354.146L8.707 4.5H12.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9A.5.5 0 0 1 3.5 4Z" /></svg>
                {project.customerName}
            </p>
        )}
        <p className="text-sm text-slate-400 mb-3 break-words">{task.description || 'No description.'}</p>
        
        <div className="text-xs text-slate-500 space-y-1.5 mb-3">
          {task.externalLink && (
            <div className="flex items-center" title={`External Link: ${task.externalLink}`}>
              <LinkIcon className="w-4 h-4 mr-1.5 text-indigo-400" /> 
              <a href={task.externalLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline truncate">
                {task.externalLink.length > 30 ? task.externalLink.substring(0, 27) + '...' : task.externalLink}
              </a>
            </div>
          )}
          <div className="flex items-center" title={`Source: ${task.source}`}>
            <SourceIcon source={task.source} />
            <span className="text-slate-400">{task.source}</span>
          </div>
           <div className="flex items-center" title={`Type: ${task.type}`}>
            <TypeIcon type={task.type} />
            <span className="text-slate-400">{task.type}</span>
          </div>
          {teamLeadResource && (
            <div className="flex items-center" title={`Team Lead: ${teamLeadResource.name}`}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5 text-[#F29C2A]"> 
                <path fillRule="evenodd" d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 9a5 5 0 0 0-5 5v1h10v-1a5 5 0 0 0-5-5Z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-400">Lead: {teamLeadResource.name}</span>
            </div>
          )}
          {assignedResource && (
            <div className="flex items-center" title={`Assigned To: ${assignedResource.name}`}>
              <UserIcon className="w-4 h-4 mr-1.5 text-[#F29C2A]" /> 
              <span className="text-slate-400">Assigned: {assignedResource.name}</span>
            </div>
          )}
           {task.startDate && (
            <div className="flex items-center" title={`Start Date: ${formatDate(task.startDate)}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5 text-green-400"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.03-9.97a.75.75 0 0 0-1.06-1.06L6.75 7.19l-.97-.97a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.06 0l3.75-3.75Z" clipRule="evenodd" /></svg>
              <span className="text-slate-400">Started: {formatDate(task.startDate)}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center" title={`Due Date: ${formatDate(task.dueDate)}`}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5 text-red-400">
                <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 .75.75V3h6.5V2.5a.75.75 0 0 1 1.5 0V3h.25A2.75 2.75 0 0 1 15.75 5.75v6.5A2.75 2.75 0 0 1 13 15H3A2.75 2.75 0 0 1 .25 12.25v-6.5A2.75 2.75 0 0 1 3 3h.25V2.5A.75.75 0 0 1 4 1.75ZM14.25 7h-2.5a.75.75 0 0 1 0-1.5h2.5a.75.75 0 0 1 0 1.5Zm0 3.5h-2.5a.75.75 0 0 1 0-1.5h2.5a.75.75 0 0 1 0 1.5ZM10 7H7.25a.75.75 0 0 1 0-1.5H10a.75.75 0 0 1 0 1.5Zm0 3.5H7.25a.75.75 0 0 1 0-1.5H10a.75.75 0 0 1 0 1.5ZM5.5 7h-1A.75.75 0 0 1 3.75 7V5.5a.75.75 0 0 1 1.5 0V7Zm-.75 3.5a.75.75 0 0 0 0-1.5h-1a.75.75 0 0 0 0 1.5h1Z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-400">Due: {formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.hoursSpent !== undefined && (
            <div className="flex items-center" title={`Manually Logged Hours: ${task.hoursSpent}h`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5 text-blue-400"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v3.5h-3a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 .75-.75v-4.25Z" clipRule="evenodd" /></svg> 
              <span className="text-slate-400">Logged: {task.hoursSpent}h</span>
            </div>
          )}
           <div className="flex items-center" title={`Tracked Time: ${formatTime(displayTime)}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-4 h-4 mr-1.5 ${task.isTimerRunning ? 'text-green-400 animate-pulse' : 'text-purple-400'}`}> 
                <path d="M8.5 2.75a.75.75 0 0 0-1.5 0V7h-.75a.75.75 0 0 0 0 1.5h4.52A6.512 6.512 0 0 1 8 14.5a6.5 6.5 0 1 1 5.728-9.653.75.75 0 0 0-.956 1.156A5.002 5.002 0 0 0 8 13a5 5 0 1 0-4.756-6.916A.75.75 0 0 0 2.5 6H7V2.75A.75.75 0 0 0 6.25 2h-2.5C2.79 2 2 2.79 2 3.75v2.517a.75.75 0 0 0 1.5 0V3.93L5.87 6.295A5.008 5.008 0 0 0 5.003 8.5c0 .085.002.17.006.254l.001.029h.002l.002.028.004.027.004.027.006.027.006.026.008.026.008.025.01.025.01.024.012.024.012.023.014.023.014.022.016.022L5.25 9A.75.75 0 0 0 4.5 9H2.75a.75.75 0 0 0 0 1.5h1.47A6.512 6.512 0 0 1 1.5 8c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5c0 .313-.024.622-.068.925a.75.75 0 0 0 1.478.288A8.001 8.001 0 0 0 16 8c0-4.42-3.58-8-8-8S0 3.58 0 8c0 2.683 1.32 5.065 3.379 6.51A.75.75 0 0 0 4.5 14h.75a.75.75 0 0 0 .75-.75V8.75a.75.75 0 0 0-.75-.75H4.452A6.502 6.502 0 0 1 8 1.5a6.502 6.502 0 0 1 5.548 3.202.75.75 0 0 0 1.004-1.114A7.984 7.984 0 0 0 8.5 0V2.75Z"/>
              </svg>
              <span className="text-slate-400">Tracked: {formatTime(displayTime)}</span>
            </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-600/50">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTimerClick}
            className={`p-1.5 rounded-full transition-colors text-sm flex items-center
                        ${task.isTimerRunning 
                            ? 'bg-red-500/30 hover:bg-red-500/50 text-red-300' 
                            : 'bg-green-500/30 hover:bg-green-500/50 text-green-300'}`} 
            aria-label={task.isTimerRunning ? `Pause timer for ${task.title}` : `Start timer for ${task.title}`}
          >
            {task.isTimerRunning ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            <span className="ml-1 text-xs">{task.isTimerRunning ? 'Pause' : 'Start'}</span>
          </button>
        </div>
        <div className="flex items-center space-x-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColorMap[task.priority].replace('border-','bg-').replace('/20','')} `}>
                {task.priority}
            </span>
            <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-[#F29C2A] transition-colors rounded-full hover:bg-slate-600/50" 
            aria-label={`Edit task: ${task.title}`}
            >
            <EditIcon className="w-4 h-4" />
            </button>
            <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-600/50" 
            aria-label={`Delete task: ${task.title}`}
            >
            <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};