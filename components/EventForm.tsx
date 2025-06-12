
import React, { useState, useEffect } from 'react';
import { CalendarEvent, Task } from '../types'; // Added Task
import { GoogleGenAI } from "@google/genai";


interface EventFormProps {
  onSubmit: (event: Omit<CalendarEvent, 'id'> | CalendarEvent) => void;
  initialData?: CalendarEvent | null;
  defaultDate?: string; // YYYY-MM-DD
  tasks: Task[]; // Added tasks prop for AI context
  onClose: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit, initialData, defaultDate, tasks, onClose }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  // const [color, setColor] = useState<string>('blue'); // Future enhancement

  const [isSuggestingDetails, setIsSuggestingDetails] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);


  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setStartTime(initialData.startTime || '');
      setEndTime(initialData.endTime || '');
      setDescription(initialData.description || '');
      // setColor(initialData.color || 'blue');
    } else {
      setTitle('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setDescription('');
      // setColor('blue');
    }
  }, [initialData, defaultDate]);

  const handleSuggestDetails = async () => {
    setIsSuggestingDetails(true);
    setSuggestionError(null);
    try {
      if (!process.env.API_KEY) {
          throw new Error("API_KEY environment variable not set. AI features will be disabled.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const eventDateObj = new Date(date + "T00:00:00");
      const threeDaysBefore = new Date(eventDateObj);
      threeDaysBefore.setDate(eventDateObj.getDate() - 3);
      const threeDaysAfter = new Date(eventDateObj);
      threeDaysAfter.setDate(eventDateObj.getDate() + 3);

      const nearbyTasks = tasks.filter(task => {
          const taskDateStr = task.dueDate || task.startDate;
          if (!taskDateStr) return false;
          try {
              const taskDate = new Date(taskDateStr + "T00:00:00"); // Ensure consistent time for comparison
              return taskDate >= threeDaysBefore && taskDate <= threeDaysAfter;
          } catch { return false; }
      });

      let context = `Event date: ${new Date(date + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
      if (nearbyTasks.length > 0) {
          context += " Consider these nearby tasks (due/start date):\n";
          nearbyTasks.slice(0, 5).forEach(t => { // Limit context size, showing up to 5 tasks
              context += `- "${t.title}" (Project: ${t.projectId?.substring(0,10)}...). Description snippet: ${t.description?.substring(0, 50)}...\n`;
          });
      } else {
          context += " No specific tasks are immediately nearby.";
      }

      const prompt = `${context}\nSuggest a relevant professional event title and a brief description (1-2 sentences) for this date. If no specific tasks provide strong clues, suggest a general professional event like 'Review Project Milestones' or 'Client Follow-up Planning'. Format as: Title: [Your Title]\nDescription: [Your Description]`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
      });

      const text = response.text;
      const titleMatch = text.match(/Title: (.*)/);
      const descriptionMatch = text.match(/Description: (.*)/);

      if (titleMatch && titleMatch[1]) {
          setTitle(titleMatch[1].trim());
      }
      if (descriptionMatch && descriptionMatch[1]) {
          setDescription(descriptionMatch[1].trim());
      }
      if (!titleMatch && !descriptionMatch) {
          // Fallback if parsing fails, use the whole text or part of it
          const lines = text.split('\n');
          const parsedTitle = lines.find(line => line.startsWith("Title:"))?.substring("Title:".length).trim();
          const parsedDesc = lines.find(line => line.startsWith("Description:"))?.substring("Description:".length).trim() || lines.slice(1).join(' ').trim();

          if (parsedTitle) {
               setTitle(parsedTitle);
               setDescription(parsedDesc || "AI suggested description.");
          } else {
               setTitle("AI Suggested Event");
               setDescription(text || "Could not parse suggestion fully.");
               console.warn("AI event suggestion parsing failed, using raw text for description.", text);
          }
      }

    } catch (error: any) {
      console.error("Failed to suggest event details:", error);
      let errorMessage = "Could not suggest details. Please try manually.";
      if (error.message.includes("API_KEY")) {
          errorMessage = "AI suggestion unavailable: API Key not configured.";
      } else if (error.message.includes("Quota")) {
          errorMessage = "AI suggestion temporarily unavailable. Please try again later.";
      }
      setSuggestionError(errorMessage);
    } finally {
      setIsSuggestingDetails(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert("Event Title and Date are required.");
      return;
    }
    const eventData = {
      title,
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      description: description.trim() === '' ? undefined : description.trim(),
      // color, // Color selection can be added in future
    };
    onSubmit(initialData ? { ...initialData, ...eventData } : eventData);
    onClose();
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="flex justify-end">
        <button
            type="button"
            onClick={handleSuggestDetails}
            disabled={isSuggestingDetails || !date} // Also disable if no date is set
            className="text-xs px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
            aria-label="Suggest event details using AI"
        >
            {isSuggestingDetails ? (
                <svg className="animate-spin h-3 w-3 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
              '✨ Suggest Details'
            )}
        </button>
      </div>
      {suggestionError && <p className="text-xs text-red-400 mb-2 text-center">{suggestionError}</p>}

      <div>
        <label htmlFor="eventTitle" className={labelClass}>Event Title</label>
        <input type="text" id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g., Team Meeting" required />
      </div>
      <div>
        <label htmlFor="eventDate" className={labelClass}>Date</label>
        <input type="date" id="eventDate" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="eventStartTime" className={labelClass}>Start Time (Optional)</label>
          <input type="time" id="eventStartTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="eventEndTime" className={labelClass}>End Time (Optional)</label>
          <input type="time" id="eventEndTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="eventDescription" className={labelClass}>Description (Optional)</label>
        <textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Details about the event"></textarea>
      </div>
      {/* Color picker could be added here in future */}
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
          {initialData ? 'Save Event' : 'Add Event'}
        </button>
      </div>
    </form>
  );
};
