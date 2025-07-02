import React, { useState, useMemo, useEffect } from 'react';
import { Resource, Issue, ResourceId } from '../types.ts';
import { DownloadIcon, UserIcon, TrashIcon } from './icons';

interface IssueViewProps {
    resources: Resource [];
    issues: Issue[];
}

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};
  
const formatDisplayDate = (dateString?: string): string => {
    if (!dateString || dateString.toUpperCase() === 'TBD') return 'TBD';
    try {
        const date = new Date(dateString.includes('T') ? dateString : dateString + "T00:00:00");
        if (isNaN(date.getTime())) return dateString; 
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateString; 
    }
};
  
  
const formatTimeForReport = (ms?: number) => {
    if (ms === undefined || ms === null) return '0h 0m';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

export const IssueView: React.FC<IssueViewProps> = ( {resources, issues}) => {
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const [startDate, setStartDate] = useState<string>(formatDateForInput(oneMonthAgo));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(today));

    const availableResourcesForFilter = useMemo(() => {
        // Just return the full list of resources, sorted by name.
        return resources.sort((a, b) => a.name.localeCompare(b.name));
    }, [resources]); // The only dependency is the main resources list.

    useEffect(() => {
        if (selectedResourceId && !availableResourcesForFilter.find(r => r.id === selectedResourceId)) {
          setSelectedResourceId('');
        }
    }, [availableResourcesForFilter, selectedResourceId]);

    
};