// hooks/useIssueData.ts
import { useCallback, useEffect, useState } from 'react';
import { useApi } from './useApi';
import { issueService } from '../services/issueService';
import { fetchService } from '@/services/resourceService';
import { employeeService } from '@/services/resourceService';
import { authService } from '@/services/resourceService';
import { AuthError } from '@/types';
import { IssueFilters, SortOptions, AssigneeStatsSortOptions, PaginationParams } from '@/api.types.ts';

export const useAssigneeStats = (
    filters: IssueFilters = {},
    sortOptions: AssigneeStatsSortOptions = {},
    pagination: PaginationParams = {}
) => {
    const apiCall = useCallback(
        (signal: AbortSignal) => issueService.getAssigneeStats(filters, sortOptions, pagination, signal),
        [filters, sortOptions, pagination]
    );
    return useApi(apiCall);
};

export const useIssues = (
    filters: IssueFilters = {},
    sortOptions: SortOptions = {},
    pagination: PaginationParams = {}
) => {
    const apiCall = useCallback(
        (signal: AbortSignal) => issueService.getIssues(filters, sortOptions, pagination, signal),
        [filters, sortOptions, pagination]
    );
    return useApi(apiCall);
};

export const useSummaryStats = (filters: IssueFilters = {}) => {
    const apiCall = useCallback(
        (signal: AbortSignal) => issueService.getSummaryStats(filters, signal),
        [filters]
    );
    return useApi(apiCall);
};

export const useModules = () => {
    const apiCall = useCallback(
        (signal: AbortSignal) => fetchService.getAllModules(signal),
        []
    );
    return useApi(apiCall);
};
interface SyncStatusState {
    success: boolean;
    message: string;
    timestamp: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * REFACTORED to correctly handle errors from the service layer.
 */
export function useSyncStatus() {
    const [status, setStatus] = useState<SyncStatusState>({
        success: false,
        message: 'Loading status...',
        timestamp: '',
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const controller = new AbortController();

        const fetchStatus = async () => {
            try {
                const result = await employeeService.getSyncStatus(controller.signal);
                setStatus({ ...result, isLoading: false, error: null });

            } catch (err: any) {
                // --- This is the new, crucial error handling block ---
                console.error("Error caught by useSyncStatus hook:", err);

                // Handle critical auth errors by logging the user out.
                if (err instanceof AuthError) {
                    authService.logout(); // Redirect to login
                    // No need to set state, as the page will redirect.
                    return; 
                }
                
                // For all other errors, update the state to show the specific message
                setStatus({
                    success: false,
                    message: err.message || 'An unknown error occurred.',
                    timestamp: '',
                    isLoading: false,
                    error: err.message || 'An unknown error occurred.',
                });
            }
        };

        fetchStatus();

        // Cleanup function to abort the request if the component unmounts
        return () => {
            controller.abort();
        };
    }, []); // Empty array ensures this runs once on mount

    // Return the status object, which includes the detailed error message
    return status;
}