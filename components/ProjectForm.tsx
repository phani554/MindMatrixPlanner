import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id'> | Project) => void;
  initialData?: Project | null;
  onClose: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, initialData, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [overallStatus, setOverallStatus] = useState('');
  const [percentageCompletion, setPercentageCompletion] = useState('');
  const [sowExecutionDate, setSowExecutionDate] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setOverallStatus(initialData.overallStatus);
      setPercentageCompletion(initialData.percentageCompletion);
      setSowExecutionDate(initialData.sowExecutionDate || '');
    } else {
      setCustomerName('');
      setOverallStatus('');
      setPercentageCompletion('');
      setSowExecutionDate('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Customer Name is required.");
      return;
    }
    const projectData = {
      customerName,
      overallStatus,
      percentageCompletion,
      sowExecutionDate: sowExecutionDate.trim() === "" || sowExecutionDate.trim().toUpperCase() === "TBD" ? undefined : sowExecutionDate.trim(),
    };
    onSubmit(initialData ? { ...initialData, ...projectData } : projectData);
    onClose();
  };

  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="projectCustomerName" className={labelClass}>Customer Name</label>
        <input type="text" id="projectCustomerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="e.g., Acronis" required />
      </div>
      <div>
        <label htmlFor="projectOverallStatus" className={labelClass}>Overall Status</label>
        <input type="text" id="projectOverallStatus" value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)} className={inputClass} placeholder="e.g., On Track: Custom work" />
      </div>
      <div>
        <label htmlFor="projectPercentageCompletion" className={labelClass}>Percentage Completion</label>
        <input type="text" id="projectPercentageCompletion" value={percentageCompletion} onChange={(e) => setPercentageCompletion(e.target.value)} className={inputClass} placeholder="e.g., 70.00% or Custom Work" />
      </div>
      <div>
        <label htmlFor="projectSowExecutionDate" className={labelClass}>SOW Execution Date</label>
        <input type="date" id="projectSowExecutionDate" value={sowExecutionDate} onChange={(e) => setSowExecutionDate(e.target.value)} className={inputClass} />
        <p className="text-xs text-slate-500 mt-1">Leave blank or set to future if TBD.</p>
      </div>
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
          {initialData ? 'Save Changes' : 'Add Project'}
        </button>
      </div>
    </form>
  );
};
