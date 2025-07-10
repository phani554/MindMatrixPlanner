import { 
    PaginationParams,
    SortOptions,
    AssigneeStatsSortOptions,
    IssueFilters,
    AssigneeStatsResponse,
    IssuesResponse,
    SummaryResponse,
} from "@/api.types";

import { buildQueryString } from "@/utils/queryBuilder";
import { apiService } from "@/utils/apiService";
import { handleApiError } from "@/utils/apiError";
import { configs } from "@/config";

const BACKEND_URL = configs.BACKEND_URL;

/**
 * Simple, focused service for issues API - leverages your existing infrastructure
 */
export const issueService = {
    /**
     * Fetches assignee statistics with pagination and sorting
     */
    async getAssigneeStats(
        filters: IssueFilters = {},
        sortOptions: AssigneeStatsSortOptions = {},
        pagination: PaginationParams = {},
        signal?: AbortSignal
    ): Promise<AssigneeStatsResponse> {
        try {
            const allParams = { ...filters, ...sortOptions, ...pagination };
            const queryString = buildQueryString(allParams);
            const url = `${BACKEND_URL}/issues/stats${queryString ? `?${queryString}` : ''}`;

            return await apiService<AssigneeStatsResponse>(url, { signal });
        } catch (error) {
            throw handleApiError(error, 'assignee statistics');
        }
    },

    /**
     * Fetches issues list with pagination and sorting
     */
    async getIssues(
        filters: IssueFilters = {},
        sortOptions: SortOptions = {},
        pagination: PaginationParams = {},
        signal?: AbortSignal
    ): Promise<IssuesResponse> {
        try {
            const allParams = { ...filters, ...sortOptions, ...pagination };
            const queryString = buildQueryString(allParams);
            const url = `${BACKEND_URL}/issues/${queryString ? `?${queryString}` : ''}`;

            return await apiService<IssuesResponse>(url, { signal });
        } catch (error) {
            throw handleApiError(error, 'issues');
        }
    },

    /**
     * Fetches summary statistics - now uses same IssueFilters for consistency
     */
    async getSummaryStats(
        filters: IssueFilters = {},
        signal?: AbortSignal
    ): Promise<SummaryResponse> {
        try {
            const queryString = buildQueryString(filters);
            const url = `${BACKEND_URL}/issues/summary${queryString ? `?${queryString}` : ''}`;

            return await apiService<SummaryResponse>(url, { signal });
        } catch (error) {
            throw handleApiError(error, 'summary statistics');
        }
    },
    
}
