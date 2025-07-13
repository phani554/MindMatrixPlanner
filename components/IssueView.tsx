import React, { useState, useMemo, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAssigneeStats, useSummaryStats, useModules } from '../hooks/useIssueData';
import { IssueFilters, AssigneeStatsSortOptions, PaginationParams } from '@/api.types.ts';
import { Resource } from '../types';
import { buildGitHubSearchURL } from '@/utils/githubSearchURL';
import { UserSearchInput } from './UserSearchInput';
import { MultiSelectSearchInput } from './MultiSelectSearchInput';
// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Custom hook for debouncing ---
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// --- Component Props ---
interface IssueViewProps {
    resources: Resource[];
}

// --- Sort Field Type ---
type SortField = 'openIssues' | 'closedIssues' | 'totalIssues' | 'name';

// --- Main Component ---
export const IssueView: React.FC<IssueViewProps> = ({ resources }) => {
    // --- Filter State ---
    const [filters, setFilters] = useState<IssueFilters>({
        state: 'all',
        showIssues: true, // Default to showing only issues
        showPullRequests: false,
    });

    // --- Sort and Pagination State ---
    const [sortOptions, setSortOptions] = useState<AssigneeStatsSortOptions>({
        sortBy: 'totalIssues',
        order: 'desc'
    });

    const [pagination, setPagination] = useState<PaginationParams>({
        page: 1,
        limit: 20 // Reasonable page size
    });

    const [moduleInput, setModuleInput] = useState('');


    // --- Debounce filters to prevent constant API calls ---
    const debouncedFilters = useDebounce(filters, 500);

    // --- Data Fetching using debounced filters ---
    const { 
        data: statsResponse, 
        isLoading: statsLoading, 
        error: statsError 
    } = useAssigneeStats(debouncedFilters, sortOptions, pagination);

    const { 
        data: summaryResponse, 
        isLoading: summaryLoading, 
        error: summaryError 
    } = useSummaryStats(debouncedFilters);

    const { data: allModules, isLoading: modulesLoading } = useModules();

    // --- Memoized list of module suggestions based on user input ---
    const moduleSuggestions = useMemo(() => {
        if (!moduleInput || !allModules) return [];
        // Don't show suggestions that are already selected
        const selectedModules = new Set(filters.module || []);
        return allModules.filter(mod =>
            !selectedModules.has(mod) &&
            mod.toLowerCase().includes(moduleInput.toLowerCase())
        );
    }, [moduleInput, allModules, filters.module]);
    // --- Extract data from responses ---
    const statsData = statsResponse?.data || [];
    const summaryData = summaryResponse?.data;
    const paginationData = statsResponse?.pagination;

    // --- Show loading indicator when typing ---
    const isTyping = JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

    // --- Chart Click Handler ---
    const handleChartClick = (event: any, elements: any[]) => {
        if (elements.length > 0) {
            const clickedIndex = elements[0].index;
            const clickedLabel = chartData?.labels?.[clickedIndex];
            
            if (clickedLabel === 'Open Issues') {
                setFilters(prev => ({ ...prev, state: 'open' }));
            } else if (clickedLabel === 'Closed Issues') {
                setFilters(prev => ({ ...prev, state: 'closed' }));
            }
            
            // Reset to first page when state changes
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    };
    // --- ADDED START: Memoized lists for the new dropdowns ---
    // This logic creates the data needed to populate our new UI controls.
    const teamLeads = useMemo(() => {
        // Find all employees marked as a team lead (includes Module Owners).
        return resources
            .filter(r => r.isTeamLead)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [resources]);

    const modules = useMemo(() => {
        // Collect all unique module names from all resources.
        const allModules = new Set<string>();
        resources.forEach(r => {
            r.modules?.forEach(mod => allModules.add(mod));
        });
        return Array.from(allModules).sort();
    }, [resources]);
    // --- ADDED END ---
    // --- Chart Configuration ---
    const chartData = useMemo(() => {
        if (!summaryData) return null;

        return {
            labels: ['Open Issues', 'Closed Issues'],
            datasets: [{
                data: [summaryData.openIssues, summaryData.closedIssues],
                backgroundColor: [
                    filters.state === 'open' ? '#F59E0B' : '#F59E0B80',    // Highlight if selected
                    filters.state === 'closed' ? '#10B981' : '#10B98180'   // Highlight if selected
                ],
                borderColor: ['#D97706', '#059669'],
                borderWidth: filters.state === 'all' ? 2 : 3, // Thicker border when filtered
                hoverOffset: 6,
                radius: '80%',
                cutout: '65%',
            }]
        };
    }, [summaryData, filters.state]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleChartClick,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#E2E8F0', // ✅ Light gray text - much more visible
                    font: { size: 12 },
                    usePointStyle: true, // Makes legend markers circular
                    padding: 15, // More space between legend items
                    generateLabels: function(chart: any) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label: string, i: number) => {
                                const dataset = data.datasets[0];
                                const value = dataset.data[i];
                                const isSelected = 
                                    (label === 'Open Issues' && filters.state === 'open') ||
                                    (label === 'Closed Issues' && filters.state === 'closed');
                                
                                return {
                                    text: `${label}: ${value}${isSelected ? ' (filtered)' : ''}`,
                                    fillStyle: i === 0 ? '#F59E0B' : '#10B981', // ✅ Use original bright colors for legend
                                    strokeStyle: i === 0 ? '#D97706' : '#059669',
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i,
                                    fontColor: '#E2E8F0', // ✅ Explicit light text color
                                    fontStyle: isSelected ? 'bold' : 'normal'
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1E293B',
                titleColor: '#F1F5F9',
                bodyColor: '#E2E8F0',
                borderColor: '#475569',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const total = summaryData?.totalIssues || 0;
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    },
                    afterLabel: function(context: any) {
                        return 'Click to filter by this state';
                    }
                }
            }
        },
        onHover: (event: any, elements: any[]) => {
            event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
    };

    const selectedAssignee = useMemo(() => {
        return resources.find(r => r.githubId === filters.assignee_ids?.[0]);
    }, [filters.assignee_ids, resources]);

    const selectedCreator = useMemo(() => {
        return resources.find(r => r.username === filters.user);
    }, [filters.user, resources]);

    const selectedTeamLead = useMemo(() => resources.find(r => r.githubId === filters.teamLeadGithubId), [filters.teamLeadGithubId, resources]);

    // --- Sorting Handler ---
    const handleSort = (field: SortField) => {
        setSortOptions(prev => ({
            sortBy: field,
            order: prev.sortBy === field && prev.order === 'desc' ? 'asc' : 'desc'
        }));
        // Reset to first page when sorting changes
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // --- Pagination Handlers ---
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(e.target.value);
        setPagination({ page: 1, limit: newLimit });
    };

    // --- Sort Icon Component ---
    const SortIcon: React.FC<{ field: SortField, currentSort: AssigneeStatsSortOptions }> = ({ field, currentSort }) => {
        const isActive = currentSort.sortBy === field;
        const isDesc = currentSort.order === 'desc';
        
        return (
            <span className="ml-1 inline-flex flex-col">
                <svg 
                    className={`w-3 h-3 ${isActive && !isDesc ? 'text-blue-400' : 'text-slate-500'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <svg 
                    className={`w-3 h-3 -mt-1 ${isActive && isDesc ? 'text-blue-400' : 'text-slate-500'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </span>
        );
    };

    // --- UI Handlers ---
  

    const handleDateChange = (date: string, field: 'createdStartDate' | 'createdEndDate') => {
        setFilters(prev => ({ 
            ...prev, 
            [field]: date || undefined 
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleLabelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const labelsValue = e.target.value.trim();
        setFilters(prev => ({
            ...prev,
            labels: labelsValue ? labelsValue.split(',').map(label => label.trim()) : undefined
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({
            ...prev,
            state: e.target.value as 'open' | 'closed' | 'all'
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleModuleSelect = (moduleName: string) => {
        setFilters(prev => ({
            ...prev,
            module: [...(prev.module || []), moduleName]
        }));
        setModuleInput(''); 
        setPagination({ page: 1, limit: pagination.limit });
    };

    const handleModuleRemove = (moduleNameToRemove: string) => {
        setFilters(prev => ({
            ...prev,
            module: prev.module?.filter(mod => mod !== moduleNameToRemove)
        }));
        setPagination({ page: 1, limit: pagination.limit });
    };

    // --- NEW Handlers for Team Lead Search ---
    const handleTeamLeadSelect = (user: Resource) => {
        setFilters(prev => ({ ...prev, teamLeadGithubId: user.githubId }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleTeamLeadClear = () => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters.teamLeadGithubId;
            delete newFilters.includeIndirectReports;
            return newFilters;
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    // --- ADDED END ---
     // --- ADDED START: Handler for the new checkbox ---
    const handleIndirectReportsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setFilters(prev => ({
            ...prev,
            includeIndirectReports: isChecked
        }));
        // No need to reset pagination here as it's a sub-filter of the team lead.
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRole = e.target.value;
        setFilters(prev => {
            const newFilters = { ...prev };
            if (selectedRole) {
                newFilters.role = selectedRole as 'developer' | 'tester';
            } else {
                delete newFilters.role; // Clear filter if "All Roles" is selected
            }
            return newFilters;
        });
        setPagination({ page: 1, limit: pagination.limit });
    };

    const handleTypeToggle = (type: 'issues' | 'pullRequests') => {
        setFilters(prev => ({
            ...prev,
            [type === 'issues' ? 'showIssues' : 'showPullRequests']: !prev[type === 'issues' ? 'showIssues' : 'showPullRequests']
        }));
        setPagination({ page: 1, limit: pagination.limit });
    };
    // --- ADDED END ---

    // --- Helper function to calculate on-hold count ---
    const getOnHoldCount = (stat: any) => {
        const openStateGroup = stat.employee.countsByStateAndLabel?.find((s: any) => s.state === 'open');
        if (!openStateGroup) return 0;

        const onHoldLabel = openStateGroup.labels?.find((l: any) => 
            l && l.label && ['on hold', 'in discussion', 'blocked'].includes(l.label.toLowerCase())
        );
        return onHoldLabel?.count || 0;
    };

    // --- Generate pagination numbers ---
    const generatePaginationNumbers = () => {
        if (!paginationData) return [];
        
        const { currentPage, totalPages } = paginationData;
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    const handleAssigneeSelect = (user: Resource) => {
        setFilters(prev => ({
            ...prev,
            assignee_ids: [user.githubId] // Set the filter by ID
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const handleAssigneeClear = () => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters.assignee_ids; // Remove the filter
            return newFilters;
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const handleCreatedBySelect = (user: Resource) => {
        setFilters(prev => ({
            ...prev,
            user: user.username // Set the filter by username
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    
    const handleCreatedByClear = () => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters.user; // Remove the filter
            return newFilters;
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };
 

    // --- Styling classes ---
    const inputClass = "bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    const labelClass = "block text-sm font-medium text-slate-300 mb-1";

    // --- Loading and Error States ---
    const isLoading = statsLoading || summaryLoading;
    const hasError = statsError || summaryError;

    return (
        <div>
            {/* --- TYPING INDICATOR --- */}
            {isTyping && (
                <div className="mb-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm flex items-center">
                        <span className="animate-pulse mr-2">●</span>
                        Updating filters... (will search in 0.5 seconds)
                    </p>
                </div>
            )}

            {/* --- FILTER CONTROLS --- */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4 p-2">
                <UserSearchInput
                        label="Assignee"
                        placeholder="Search by name or username..."
                        allUsers={resources}
                        selectedUser={selectedAssignee}
                        onSelectUser={handleAssigneeSelect}
                        onClear={handleAssigneeClear}
                />
                {/* --- Module Filter updated to use MultiSelectSearchInput --- */}
                <MultiSelectSearchInput
                    label="Module(s)"
                    placeholder="Type to add module..."
                    allOptions={allModules || []}
                    selectedOptions={filters.module || []}
                    onSelect={handleModuleSelect}
                    onRemove={handleModuleRemove}
                    isLoading={modulesLoading}
                />
                
                {/* ... other filters like State, Role, Date, etc. ... */}
                {/* --- Team Lead Filter updated to use UserSearchInput --- */}
                <div>
                    <UserSearchInput
                        label="Team Lead"
                        placeholder="Search for a lead..."
                        allUsers={teamLeads}
                        selectedUser={selectedTeamLead}
                        onSelectUser={handleTeamLeadSelect}
                        onClear={handleTeamLeadClear}
                    />
                    {selectedTeamLead && (
                        <div className="mt-2 flex items-center">
                            <input
                                id="indirectReports"
                                type="checkbox"
                                checked={!!filters.includeIndirectReports}
                                onChange={handleIndirectReportsToggle}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                            />
                            <label htmlFor="indirectReports" className="ml-2 text-sm font-medium text-slate-300">
                                Include Indirect Reports
                            </label>
                        </div>
                    )}
                </div>

                {/* ---Labels Filter ---- */}
                <div>
                    <label htmlFor="stateFilter" className={labelClass}>State</label>
                    <select 
                        id="stateFilter" 
                        value={filters.state || 'all'} 
                        onChange={handleStateChange} 
                        className={inputClass}
                    >
                        <option value="all">All States</option>
                        <option value="open">Open Only</option>
                        <option value="closed">Closed Only</option>
                    </select>
                </div>
                {/* --- ADDED: Role Dropdown --- */}
                <div>
                    <label htmlFor="roleFilter" className={labelClass}>Role</label>
                    <select
                        id="roleFilter"
                        value={filters.role || ''}
                        onChange={handleRoleChange}
                        className={inputClass}
                    >
                        <option value="">All Roles</option>
                        <option value="developer">Developer</option>
                        <option value="tester">Tester</option>
                    </select>
                </div>

                {/* --- ADDED: Issue/PR Checkboxes --- */}
                <div className="md:col-span-1">
                    <label className={labelClass}>Item Type</label>
                    <div className="flex space-x-4 mt-2 p-2.5 bg-slate-600 border border-slate-500 rounded-lg">
                        <div className="flex items-center">
                            <input
                                id="showIssues"
                                type="checkbox"
                                checked={!!filters.showIssues}
                                onChange={() => handleTypeToggle('issues')}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                            />
                            <label htmlFor="showIssues" className="ml-2 text-sm font-medium text-slate-300">
                                Issues
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="showPullRequests"
                                type="checkbox"
                                checked={!!filters.showPullRequests}
                                onChange={() => handleTypeToggle('pullRequests')}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                            />
                            <label htmlFor="showPullRequests" className="ml-2 text-sm font-medium text-slate-300">
                                Pull Requests
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="labelsFilter" className={labelClass}>
                        Labels 
                        {isTyping && <span className="text-blue-400 text-xs ml-1">(typing...)</span>}
                    </label>
                    <input 
                        type="text" 
                        id="labelsFilter" 
                        placeholder="critical,bug,feature..."
                        value={filters.labels?.join(',') || ''} 
                        onChange={handleLabelsChange} 
                        className={inputClass}
                    />
                    <p className="text-xs text-slate-400 mt-1">Comma-separated labels</p>
                </div>
                {/* --- Start Date Filter ---- */}

                <div>
                    <label htmlFor="reportStartDate" className={labelClass}>Start Date</label>
                    <input 
                        type="date" 
                        id="reportStartDate" 
                        value={filters.createdStartDate || ''} 
                        onChange={(e) => handleDateChange(e.target.value, 'createdStartDate')} 
                        className={inputClass}
                    />
                </div>
                {/* ---End Date Filter ---- */}

                <div>
                    <label htmlFor="reportEndDate" className={labelClass}>End Date</label>
                    <input 
                        type="date" 
                        id="reportEndDate" 
                        value={filters.createdEndDate || ''} 
                        onChange={(e) => handleDateChange(e.target.value, 'createdEndDate')} 
                        className={inputClass}
                    />
                </div>
                {/* ---User Filter ---- */}

                <UserSearchInput
                    label="Created By"
                    placeholder="Search by name or username..."
                    allUsers={resources}
                    selectedUser={selectedCreator}
                    onSelectUser={handleCreatedBySelect}
                    onClear={handleCreatedByClear}
                />
            </div>

            {/* --- CLEAR FILTERS BUTTON --- */}
            <div className="flex justify-between items-center mb-4 p-2">
                {/* Chart State Indicator */}
                {filters.state !== 'all' && (
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-slate-300">Chart filtered by:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            filters.state === 'open' 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                            {filters.state === 'open' ? 'Open Issues' : 'Closed Issues'}
                        </span>
                        <button
                            onClick={() => {
                                setFilters(prev => ({ ...prev, state: 'all' }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                            title="Reset chart filter"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                
                {/* Clear All Filters Button */}
                {Object.keys(filters).length > 2 && (
                    <button
                        onClick={() => {
                            setFilters({
                                pull_request: false,
                                state: 'all'
                            });
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center space-x-2 hover:scale-105"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Clear All Filters</span>
                        <span className="bg-red-800 text-xs px-2 py-1 rounded-full">
                            {Object.keys(filters).length - 2}
                        </span>
                    </button>
                )}
                
                {/* Spacer when no filters */}
                {Object.keys(filters).length <= 2 && filters.state === 'all' && <div></div>}
            </div>

            {/* --- PAGINATION CONTROLS (TOP) --- */}
            {paginationData && paginationData.totalPages > 1 && (
                <div className="flex justify-between items-center mb-4 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-300 text-sm">Show:</span>
                        <select 
                            value={pagination.limit} 
                            onChange={handleLimitChange}
                            className="bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded px-2 py-1"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-slate-300 text-sm">per page</span>
                    </div>
                    
                    <div className="text-slate-300 text-sm">
                        Showing {((paginationData.currentPage - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(paginationData.currentPage * pagination.limit, paginationData.totalCount)} of{' '}
                        {paginationData.totalCount} results
                    </div>
                </div>
            )}

            {/* --- SUMMARY CHART SECTION --- */}
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h2 className="text-lg font-semibold text-slate-100 mb-2 text-center">
                    Issues Overview
                </h2>
                <p className="text-slate-400 text-sm text-center mb-4">
                    Click on chart sections to filter by Open or Closed issues
                </p>
                <div className="grid md:grid-cols-2 gap-6 items-center">
                    {/* Chart */}
                    <div className="h-64 relative">
                        {(summaryLoading || isTyping) && (
                            <div className="absolute inset-0 bg-slate-800/70 flex items-center justify-center z-10 rounded">
                                <p className="text-slate-300">Loading summary...</p>
                            </div>
                        )}
                        {summaryError && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-red-400">Error loading summary: {summaryError}</p>
                            </div>
                        )}
                        {chartData && (
                            <Doughnut data={chartData} options={chartOptions} />
                        )}
                    </div>
                    
                    {/* Stats Summary */}
                    <div className="space-y-3">
                        <div className="bg-slate-700/50 p-3 rounded-lg">
                            <p className="text-2xl font-bold text-slate-100">
                                {summaryData?.totalIssues || 0}
                            </p>
                            <p className="text-slate-300 text-sm">Total Issues</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-amber-500/20 p-3 rounded-lg border border-amber-500/30">
                                <p className="text-xl font-semibold text-amber-400">
                                    {summaryData?.openIssues || 0}
                                </p>
                                <p className="text-amber-200 text-sm">Open</p>
                            </div>
                            <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-500/30">
                                <p className="text-xl font-semibold text-emerald-400">
                                    {summaryData?.closedIssues || 0}
                                </p>
                                <p className="text-emerald-200 text-sm">Closed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* --- DATA TABLE --- */}
            <div className="overflow-x-auto relative">
                {(statsLoading || isTyping) && (
                    <div className="absolute inset-0 bg-slate-800/70 flex items-center justify-center z-10">
                        <p className="text-slate-300">
                            {isTyping ? 'Updating results...' : 'Loading stats...'}
                        </p>
                    </div>
                )}
                
                {hasError && (
                    <p className="text-center p-4 text-red-400">
                        Error: {statsError || summaryError}
                    </p>
                )}
                
                {statsData && (
                    <table className="w-full text-sm text-left text-slate-300">
                        <caption className="caption-top text-lg font-semibold text-slate-100 p-2">
                            Assignee Statistics: {paginationData?.totalCount || 0} Team Members
                        </caption>
                        <thead className="text-xs text-[#F29C2A] uppercase bg-slate-700">
                            <tr>
                                <th 
                                    scope="col" 
                                    className="px-4 py-3 cursor-pointer hover:bg-slate-600 select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Team Member
                                        <SortIcon field="name" currentSort={sortOptions} />
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-600 select-none"
                                    onClick={() => handleSort('closedIssues')}
                                >
                                    <div className="flex items-center justify-center">
                                        Done (Closed)
                                        <SortIcon field="closedIssues" currentSort={sortOptions} />
                                    </div>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-600 select-none"
                                    onClick={() => handleSort('openIssues')}
                                >
                                    <div className="flex items-center justify-center">
                                        In Progress (Open)
                                        <SortIcon field="openIssues" currentSort={sortOptions} />
                                    </div>
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">On Hold</th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-600 select-none"
                                    onClick={() => handleSort('totalIssues')}
                                >
                                    <div className="flex items-center justify-center">
                                        Total Assigned
                                        <SortIcon field="totalIssues" currentSort={sortOptions} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {statsData.length === 0 && !statsLoading && !isTyping && (
                                <tr>
                                    <td colSpan={5} className="text-center p-4">No data found.</td>
                                </tr>
                            )}
                            {statsData.map((stat: any) => {
                                const onHoldCount = getOnHoldCount(stat);
                                const baseLinkFilters: IssueFilters = {
                                    ...filters,
                                    assignees: [stat.employee.login] 
                                };

                                return (
                                    <tr 
                                        key={stat.employee.githubId} 
                                        className="bg-slate-700/50 border-b border-slate-600 hover:bg-slate-600/50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                                            {stat.employee.name}
                                        </td>
                                        {/* --- Clickable Link for CLOSED items --- */}
                                        <td className="px-4 py-3 text-center">
                                            <a
                                                // The utility is called with the base filters PLUS the specific state for this cell.
                                                href={buildGitHubSearchURL({ ...baseLinkFilters, state: 'closed' })}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-emerald-400 font-medium hover:underline"
                                                title={`View ${stat.closedIssues} closed items for ${stat.employee.name} on GitHub`}
                                            >
                                                {stat.closedIssues}
                                            </a>
                                        </td>

                                        {/* --- Clickable Link for OPEN items --- */}
                                        <td className="px-4 py-3 text-center">
                                            <a
                                                href={buildGitHubSearchURL({ ...baseLinkFilters, state: 'open' })}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-amber-400 font-medium hover:underline"
                                                title={`View ${stat.openIssues} open items for ${stat.employee.name} on GitHub`}
                                            >
                                                {stat.openIssues}
                                            </a>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                        {onHoldCount > 0 ? (
                                            <a
                                                href={buildGitHubSearchURL({
                                                    ...baseLinkFilters, // Correctly includes the `user` filter (username)
                                                    state: 'open',
                                                    labels: ['on hold', 'in discussion', 'blocked']
                                                })}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-red-400 font-medium hover:underline"
                                                title={`View ${onHoldCount} on-hold items for ${stat.employee.name}`}
                                            >
                                                {onHoldCount}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">0</span>
                                        )}
                                        </td>

                                        {/* --- Clickable Link for ALL items for this user --- */}
                                        <td className="px-4 py-3 text-center">
                                            <a
                                                // Here we set state to 'all', so the 'is:' filter for state is omitted.
                                                href={buildGitHubSearchURL({ ...baseLinkFilters, state: 'all' })}
                                                target="_blank" rel="noopener noreferrer"
                                                className="text-blue-400 font-semibold hover:underline"
                                                title={`View all assigned items for ${stat.employee.name} on GitHub`}
                                            >
                                                {stat.totalIssues}
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- PAGINATION CONTROLS (BOTTOM) --- */}
            {paginationData && paginationData.totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-2">
                    {/* Previous Button */}
                    <button
                        onClick={() => handlePageChange(paginationData.currentPage - 1)}
                        disabled={!paginationData.hasPrevPage || statsLoading}
                        className="px-3 py-1 bg-slate-600 text-slate-200 rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {/* Page Numbers */}
                    {generatePaginationNumbers().map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={statsLoading}
                            className={`px-3 py-1 rounded ${
                                pageNum === paginationData.currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                            } disabled:opacity-50`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    {/* Next Button */}
                    <button
                        onClick={() => handlePageChange(paginationData.currentPage + 1)}
                        disabled={!paginationData.hasNextPage || statsLoading}
                        className="px-3 py-1 bg-slate-600 text-slate-200 rounded hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* --- APPLIED FILTERS DISPLAY --- */}
            {Object.keys(filters).length > 2 && (
                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Applied Filters:</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.assignee_ids && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                Assignee: {resources.find(r => r.githubId === filters.assignee_ids?.[0])?.name}
                            </span>
                        )}
                        {filters.labels && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                Labels: {filters.labels.join(', ')}
                            </span>
                        )}
                        {filters.createdStartDate && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                From: {filters.createdStartDate}
                            </span>
                        )}
                        {filters.createdEndDate && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                To: {filters.createdEndDate}
                            </span>
                        )}
                        {/* --- ADDED START: Display logic for new active filters --- */}
                        {filters.module && (
                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                                Modules: {filters.module.join(', ')}
                            </span>
                        )}
                        {filters.teamLeadGithubId && (
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                                Team Lead: {teamLeads.find(l => l.githubId === filters.teamLeadGithubId)?.name || '...'}
                                {/* ADDED: Indicate if hierarchy is active */}
                                {filters.includeIndirectReports && ' (and hierarchy)'}
                            </span>
                        )}
                        {filters.role && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs capitalize">
                                Role: {filters.role}
                            </span>
                        )}
                        {/* --- ADDED END --- */}
                    </div>
                </div>
            )}
        </div>
    );
};