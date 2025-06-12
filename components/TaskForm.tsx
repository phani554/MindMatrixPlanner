
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, Resource, TaskSource, TaskType, Project, ProjectId } from '../types';
import { GoogleGenAI } from "@google/genai";

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id'> | Task) => void;
  initialData?: Task;
  resources: Resource[];
  teamLeads: Resource[];
  projects: Project[]; 
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialData, resources, teamLeads, projects, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [source, setSource] = useState<TaskSource>(TaskSource.MANUAL);
  const [type, setType] = useState<TaskType>(TaskType.ENHANCEMENT);
  const [projectId, setProjectId] = useState<ProjectId | undefined>(undefined); 
  const [assignedResourceId, setAssignedResourceId] = useState<string | undefined>(undefined);
  const [teamLeadId, setTeamLeadId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [hoursSpent, setHoursSpent] = useState<number | undefined>(undefined);
  const [externalLink, setExternalLink] = useState<string>(''); 
  const [accumulatedTime, setAccumulatedTime] = useState<number | undefined>(undefined);
  
  const [isSuggestingDescription, setIsSuggestingDescription] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);


  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setStatus(initialData.status);
      setPriority(initialData.priority);
      setSource(initialData.source);
      setType(initialData.type);
      setProjectId(initialData.projectId); 
      setAssignedResourceId(initialData.assignedResourceId);
      setTeamLeadId(initialData.teamLeadId);
      setDueDate(initialData.dueDate || '');
      setStartDate(initialData.startDate || '');
      setHoursSpent(initialData.hoursSpent || undefined);
      setExternalLink(initialData.externalLink || ''); 
      setAccumulatedTime(initialData.accumulatedTime || undefined);
    } else {
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setSource(TaskSource.MANUAL);
      setType(TaskType.ENHANCEMENT);
      setProjectId(undefined); 
      setAssignedResourceId(undefined);
      setTeamLeadId(undefined);
      setDueDate('');
      setStartDate('');
      setHoursSpent(undefined);
      setExternalLink(''); 
      setAccumulatedTime(undefined);
    }
  }, [initialData]);

  const handleSuggestDescription = async () => {
    if (!title.trim()) {
        setSuggestionError("Please enter a title first to suggest a description.");
        return;
    }
    setIsSuggestingDescription(true);
    setSuggestionError(null);
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set. AI features will be disabled.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Based on the task title "${title.trim()}", suggest a detailed and actionable task description. Be concise yet informative (around 2-4 sentences). Include potential sub-steps or considerations if appropriate for a typical task of this nature.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        setDescription(response.text);
    } catch (error: any) {
        console.error("Failed to suggest description:", error);
        let errorMessage = "Could not suggest a description at this time.";
        if (error.message.includes("API_KEY")) {
            errorMessage = "AI suggestion unavailable: API Key not configured.";
        } else if (error.message.includes("Quota")) {
            errorMessage = "AI suggestion temporarily unavailable. Please try again later.";
        }
        setSuggestionError(errorMessage);
    } finally {
        setIsSuggestingDescription(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
        alert("Title is required.");
        return;
    }
    if (!projectId) {
        alert("Project selection is required.");
        return;
    }
    const taskData = { 
      title, 
      description, 
      status, 
      priority, 
      source,
      type,
      projectId, 
      assignedResourceId: assignedResourceId === "" ? undefined : assignedResourceId, 
      teamLeadId: teamLeadId === "" ? undefined : teamLeadId,
      dueDate: dueDate === "" ? undefined : dueDate,
      startDate: startDate === "" ? undefined : startDate,
      hoursSpent: hoursSpent === undefined || isNaN(hoursSpent) ? undefined : Number(hoursSpent),
      externalLink: externalLink.trim() === "" ? undefined : externalLink.trim(), 
      actualStartTime: initialData?.actualStartTime,
      isTimerRunning: initialData?.isTimerRunning,
      accumulatedTime: accumulatedTime === undefined || isNaN(accumulatedTime) ? undefined : Number(accumulatedTime),
    };
    onSubmit(initialData ? { ...initialData, ...taskData } : taskData);
    onClose();
  };
  
  const handleIntegrationClick = () => {
    console.log(`Attempting to integrate with ${source}... External Link: ${externalLink}`);
    // Placeholder for actual integration logic
    alert(`Integration with ${source} would happen here (External Link: ${externalLink || 'Not provided'}). This is a placeholder.`);
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400"; 

  const showIntegrationButton = source === TaskSource.GIT_COMMIT || source === TaskSource.SUPPORT_TICKET;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
        <input type="text" id="taskTitle" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Task title" required />
      </div>
      <div>
        <label htmlFor="taskProject" className="block text-sm font-medium text-slate-300 mb-1">Project</label>
        <select 
            id="taskProject" 
            value={projectId || ''} 
            onChange={(e) => setProjectId(e.target.value || undefined)} 
            className={inputClass}
            required
        >
          <option value="" disabled>Select a project</option>
          {projects.sort((a,b) => a.customerName.localeCompare(b.customerName)).map(p => <option key={p.id} value={p.id}>{p.customerName}</option>)}
        </select>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
            <label htmlFor="taskDescription" className="block text-sm font-medium text-slate-300">Description</label>
            <button
                type="button"
                onClick={handleSuggestDescription}
                disabled={!title.trim() || isSuggestingDescription}
                className="text-xs px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                aria-label="Suggest task description using AI"
            >
                {isSuggestingDescription ? (
                    <svg className="animate-spin h-3 w-3 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                  '✨ Suggest'
                )}
            </button>
        </div>
        <textarea id="taskDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Detailed description of the task"></textarea>
        {suggestionError && <p className="text-xs text-red-400 mt-1">{suggestionError}</p>}
      </div>
      
      <div>
        <label htmlFor="taskExternalLink" className="block text-sm font-medium text-slate-300 mb-1">External Link (Git/Support URL)</label>
        <input 
            type="url" 
            id="taskExternalLink" 
            value={externalLink} 
            onChange={(e) => setExternalLink(e.target.value)} 
            className={inputClass} 
            placeholder="https://example.com/issue/123" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="taskSource" className="block text-sm font-medium text-slate-300 mb-1">Source</label>
          <select id="taskSource" value={source} onChange={(e) => setSource(e.target.value as TaskSource)} className={inputClass}>
            {Object.values(TaskSource).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {showIntegrationButton && (
            <div>
                <button
                    type="button"
                    onClick={handleIntegrationClick}
                    className="w-full px-3 py-3 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                    aria-label={`Integrate with ${source}`}
                >
                    Integrate with {source}
                </button>
            </div>
        )}
      </div>
      <div>
        <label htmlFor="taskType" className="block text-sm font-medium text-slate-300 mb-1">Type</label>
        <select id="taskType" value={type} onChange={(e) => setType(e.target.value as TaskType)} className={inputClass}>
            {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taskStatus" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
          <select id="taskStatus" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={inputClass}>
            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="taskPriority" className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
          <select id="taskPriority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={inputClass}>
            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taskAssignedTo" className="block text-sm font-medium text-slate-300 mb-1">Assign To Resource</label>
          <select id="taskAssignedTo" value={assignedResourceId || ''} onChange={(e) => setAssignedResourceId(e.target.value || undefined)} className={inputClass}>
            <option value="">Unassigned</option>
            {resources.sort((a,b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name} ({r.role})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="taskTeamLead" className="block text-sm font-medium text-slate-300 mb-1">Assign Team Lead</label>
          <select id="taskTeamLead" value={teamLeadId || ''} onChange={(e) => setTeamLeadId(e.target.value || undefined)} className={inputClass}>
            <option value="">Unassigned</option>
            {teamLeads.sort((a,b) => a.name.localeCompare(b.name)).map(tl => <option key={tl.id} value={tl.id}>{tl.name} ({tl.role})</option>)}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taskStartDate" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
          <input type="date" id="taskStartDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
          <input type="date" id="taskDueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="taskHoursSpent" className="block text-sm font-medium text-slate-300 mb-1">Manual Hours Spent</label>
            <input 
                type="number" 
                id="taskHoursSpent" 
                value={hoursSpent === undefined ? '' : hoursSpent} 
                onChange={(e) => setHoursSpent(e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                className={inputClass} 
                placeholder="e.g., 10.5" 
                min="0"
                step="0.5"
            />
        </div>
        <div>
            <label htmlFor="taskAccumulatedTime" className="block text-sm font-medium text-slate-300 mb-1">Tracked Time (minutes)</label>
            <input 
                type="number" 
                id="taskAccumulatedTime" 
                value={accumulatedTime === undefined ? '' : Math.round(accumulatedTime / 60000)} 
                onChange={(e) => setAccumulatedTime(e.target.value === '' ? undefined : parseFloat(e.target.value) * 60000)} 
                className={inputClass} 
                placeholder="e.g., 120 (for 2 hours)" 
                min="0"
                step="1"
            />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700 mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#F29C2A] hover:bg-[#EE4D1E] rounded-lg transition-colors shadow-md">{initialData ? 'Save Changes' : 'Add Task'}</button> 
      </div>
    </form>
  );
};
