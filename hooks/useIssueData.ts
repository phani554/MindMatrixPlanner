// hooks/useIssueData.ts
import { useCallback } from 'react';
import { useApi } from './useApi';
import { issueService } from '../services/issueService';
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