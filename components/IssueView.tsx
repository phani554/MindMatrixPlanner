import React, { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { issueService, AssigneeStatsFilters, AssigneeStatsData } from '../services/issueService';
import { Resource } from '../types';

// --- Component Props ---
interface IssueViewProps {
    resources: Resource[]; // For the assignee filter dropdown
}

// --- Main Component ---
export const IssueView: React.FC<IssueViewProps> = ({ resources }) => {
    // Filters start empty. The view will be populated by user actions.
    const [filters, setFilters] = useState<AssigneeStatsFilters>({pull_request: 'false'});

    // --- Data Fetching via Custom Hook ---
    // This hook fetches all stats on initial load (when filters are empty)
    // and re-fetches whenever the user applies a filter.
    const getStatsApiCall = useCallback((signal: AbortSignal) => {
        return issueService.getAssigneeStats(filters, signal);
    }, [filters]);

    const { data: statsData, isLoading, error } = useApi<AssigneeStatsData[]>(getStatsApiCall);

    // --- UI Handlers ---
    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setFilters(prev => {
            const newFilters = { ...prev };
            if (selectedId) {
                newFilters.assignee_ids = [parseInt(selectedId, 10)];
            } else {
                delete newFilters.assignee_ids; // Remove filter for "All Resources"
            }
            return newFilters;
        });
    };

    const handleDateChange = (date: string, field: 'createdStartDate' | 'createdEndDate') => {
        setFilters(prev => ({ ...prev, [field]: date || undefined }));
    };

    // --- Render Logic ---
    const inputClass = "bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    const labelClass = "block text-sm font-medium text-slate-300 mb-1";

    return (
        <div>
            {/* --- FILTER CONTROLS --- */}
            <div className="grid md:grid-cols-3 gap-4 mb-4 p-2">
                <div>
                    <label htmlFor="resourceFilter" className={labelClass}>Assignee</label>
                    <select id="resourceFilter" value={filters.assignee_ids?.[0] || ''} onChange={handleAssigneeChange} className={inputClass}>
                        <option value="">All Resources</option>
                        {resources.map(r => <option key={r.githubId} value={r.githubId}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="reportStartDate" className={labelClass}>Start Date</label>
                    <input type="date" id="reportStartDate" value={filters.createdStartDate || ''} onChange={(e) => handleDateChange(e.target.value, 'createdStartDate')} className={inputClass}/>
                </div>
                <div>
                    <label htmlFor="reportEndDate" className={labelClass}>End Date</label>
                    <input type="date" id="reportEndDate" value={filters.createdEndDate || ''} onChange={(e) => handleDateChange(e.target.value, 'createdEndDate')} className={inputClass}/>
                </div>
            </div>

            {/* --- DATA TABLE --- */}
            <div className="overflow-x-auto">
                {isLoading && <p className="text-center p-4">Loading stats...</p>}
                {error && <p className="text-center p-4 text-red-400">Error: {error}</p>}
                {statsData && (
                    <table className="w-full text-sm text-left text-slate-300">
                        <caption className="caption-top text-lg font-semibold text-slate-100 p-2">Assignee Statistics: Total Records Count {statsData.count}</caption>
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th scope="col" className="px-4 py-3">Team Member</th>
                                <th scope="col" className="px-4 py-3 text-center">Done (Closed)</th>
                                <th scope="col" className="px-4 py-3 text-center">In Progress (Open)</th>
                                <th scope="col" className="px-4 py-3 text-center">On Hold</th>
                                <th scope="col" className="px-4 py-3 text-center">Total Assigned</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={5} className="text-center p-4">No data found.</td>
                                </tr>
                            )}
                            {statsData.data.map(stat => {
                                let onHoldCount = 0;
                                const openStateGroup = stat.employee.countsByStateAndLabel.find(s => s.state === 'open');
                                if (openStateGroup) {
                                    // --- FIX ---
                                    // Add a check for `l && l.label` to prevent the TypeError
                                    const onHoldLabel = openStateGroup.labels.find(l => 
                                        l && l.label && ['on-hold', 'in-discussion'].includes(l.label.toLowerCase())
                                    );
                                    if (onHoldLabel) onHoldCount = onHoldLabel.count;
                                }
                                

                                return (
                                    <tr key={stat.employee.githubId} className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/50">
                                        <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">{stat.employee.name}</td>
                                        <td className="px-4 py-3 text-center">{stat.closedIssues}</td>
                                        <td className="px-4 py-3 text-center">{stat.openIssues}</td>
                                        <td className="px-4 py-3 text-center">{onHoldCount}</td>
                                        <td className="px-4 py-3 text-center">{stat.totalIssues}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

