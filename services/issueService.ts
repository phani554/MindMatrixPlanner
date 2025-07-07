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

const BACKEND_URL = "http://localhost:5100/issues";

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
            const url = `${BACKEND_URL}/stats${queryString ? `?${queryString}` : ''}`;

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
            const url = `${BACKEND_URL}${queryString ? `?${queryString}` : ''}`;

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
            const url = `${BACKEND_URL}/summary${queryString ? `?${queryString}` : ''}`;

            return await apiService<SummaryResponse>(url, { signal });
        } catch (error) {
            throw handleApiError(error, 'summary statistics');
        }
    }
};
