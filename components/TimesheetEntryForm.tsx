
import React, { useState, useEffect } from 'react';
import { TimesheetEntry, Resource, ResourceId } from '../types';

interface TimesheetEntryFormProps {
  onSubmit: (entryData: Omit<TimesheetEntry, 'id'> | TimesheetEntry) => void;
  initialData?: TimesheetEntry | null;
  resources: Resource[];
  onClose: () => void;
  defaultDate?: string; // YYYY-MM-DD
  defaultResourceId?: ResourceId;
}

export const TimesheetEntryForm: React.FC<TimesheetEntryFormProps> = ({ onSubmit, initialData, resources, onClose, defaultDate, defaultResourceId }) => {
  const [resourceId, setResourceId] = useState<ResourceId>('');
  const [date, setDate] = useState<string>('');
  const [hoursLogged, setHoursLogged] = useState<string>(''); 
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setResourceId(initialData.resourceId);
      setDate(initialData.date);
      setHoursLogged(String(initialData.hoursLogged));
      setNotes(initialData.notes || '');
    } else {
      setResourceId(defaultResourceId || (resources.length > 0 ? '' : '')); // Default to passed ID or first resource, or empty
      setDate(defaultDate || new Date().toISOString().split('T')[0]); // Default to passed date or today
      setHoursLogged('');
      setNotes('');
    }
  }, [initialData, resources, defaultDate, defaultResourceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(hoursLogged);
    if (!resourceId || !date || isNaN(hours) || hours <= 0) {
      alert('Please select a resource, enter a valid date, and log positive hours.');
      return;
    }

    const entryData = {
      resourceId,
      date,
      hoursLogged: hours,
      notes: notes.trim() === '' ? undefined : notes.trim(),
    };

    onSubmit(initialData ? { ...initialData, ...entryData } : entryData);
    onClose();
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400"; 
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="timesheetResource" className={labelClass}>Resource</label>
        <select
          id="timesheetResource"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="" disabled>Select a resource</option>
          {resources.sort((a,b) => a.name.localeCompare(b.name)).map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="timesheetDate" className={labelClass}>Date</label>
          <input
            type="date"
            id="timesheetDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="timesheetHours" className={labelClass}>Hours Logged</label>
          <input
            type="number"
            id="timesheetHours"
            value={hoursLogged}
            onChange={(e) => setHoursLogged(e.target.value)}
            className={inputClass}
            placeholder="e.g., 8"
            min="0.1"
            step="0.1"
            required
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="timesheetNotes" className={labelClass}>Notes (Optional)</label>
        <textarea
          id="timesheetNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Brief description of work done"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
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
          {initialData ? 'Save Entry' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
};
