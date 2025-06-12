
import React, { useState, useEffect } from 'react';
import { Resource } from '../types';

interface ResourceFormProps {
  onSubmit: (resource: Omit<Resource, 'id'> | Resource) => void;
  initialData?: Resource;
  allResources: Resource[]; 
  onClose: () => void;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({ onSubmit, initialData, allResources, onClose }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setParentId(initialData.parentId);
      setBirthDate(initialData.birthDate || '');
      setJoiningDate(initialData.joiningDate || '');
      setEmail(initialData.email || '');
      setContactNumber(initialData.contactNumber || '');
    } else {
      setName('');
      setRole('');
      setParentId(undefined);
      setBirthDate('');
      setJoiningDate('');
      setEmail('');
      setContactNumber('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      alert("Name and Role are required.");
      return;
    }
    if (initialData && initialData.id === parentId) {
      alert("A resource cannot report to itself.");
      return;
    }

    const resourceData = { 
      name, 
      role, 
      parentId: parentId === "" ? undefined : parentId,
      birthDate: birthDate.trim() === "" ? undefined : birthDate.trim(),
      joiningDate: joiningDate.trim() === "" ? undefined : joiningDate.trim(),
      email: email.trim() === "" ? undefined : email.trim(),
      contactNumber: contactNumber.trim() === "" ? undefined : contactNumber.trim(),
    };
    
    onSubmit(initialData ? { ...initialData, ...resourceData } : resourceData);
    onClose(); 
  };
  
  const inputClass = "bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-[#F29C2A] focus:border-[#F29C2A] block w-full p-3 placeholder-slate-400"; // Updated focus colors
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  const availableParents = allResources.filter(r => !initialData || r.id !== initialData.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resourceName" className={labelClass}>Name</label>
          <input type="text" id="resourceName" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g., Jane Doe" required />
        </div>
        <div>
          <label htmlFor="resourceRole" className={labelClass}>Role</label>
          <input type="text" id="resourceRole" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} placeholder="e.g., Frontend Developer" required/>
        </div>
      </div>
      
      <div>
        <label htmlFor="resourceParent" className={labelClass}>Reports To (Manager)</label>
        <select id="resourceParent" value={parentId || ''} onChange={(e) => setParentId(e.target.value || undefined)} className={inputClass}>
          <option value="">None (Top Level)</option>
          {availableParents.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resourceEmail" className={labelClass}>Email ID</label>
          <input type="email" id="resourceEmail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="e.g., jane.doe@example.com" />
        </div>
        <div>
          <label htmlFor="resourceContact" className={labelClass}>Contact Number</label>
          <input type="tel" id="resourceContact" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputClass} placeholder="e.g., 9876543210" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="resourceBirthDate" className={labelClass}>Birth Date</label>
          <input type="text" id="resourceBirthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} placeholder="e.g., 15 Feb or YYYY-MM-DD" />
           <p className="text-xs text-slate-500 mt-1">Use format like 'DD Mon' or 'YYYY-MM-DD'.</p>
        </div>
        <div>
          <label htmlFor="resourceJoiningDate" className={labelClass}>Joining Date</label>
          <input type="date" id="resourceJoiningDate" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputClass} />
        </div>
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
          className="px-4 py-2 text-sm font-medium text-white bg-[#F29C2A] hover:bg-[#EE4D1E] rounded-lg transition-colors shadow-md focus:ring-2 focus:ring-[#F29C2A] focus:ring-opacity-50" // Updated button colors
        >
          {initialData ? 'Save Changes' : 'Add Resource'}
        </button>
      </div>
    </form>
  );
};