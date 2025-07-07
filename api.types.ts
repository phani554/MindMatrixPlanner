export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface SortOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'closedAt' | 'title' | 'number' | 'state';
    order?: 'asc' | 'desc';
}

export interface AssigneeStatsSortOptions {
    sortBy?: 'openIssues' | 'closedIssues' | 'totalIssues' | 'name';
    order?: 'asc' | 'desc';
}

// === CONSISTENT FILTERS FOR ALL ENDPOINTS ===
export interface IssueFilters {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    assignee_ids?: number[];
    assignees?: string[];
    user?: string;
    createdById?: number;
    createdStartDate?: string;
    createdEndDate?: string;
    updatedStartDate?: string;
    updatedEndDate?: string;
    closedStartDate?: string;
    closedEndDate?: string;
    pull_request?: boolean;
    issueType?: string;
    [key: string]: any;
}

// === API RESPONSE TYPES (Define these in a separate types file) ===
// These are just for TypeScript - the service doesn't need to know the internal structure
export interface AssigneeStatsResponse {
    data: any[];
    pagination: any;
    filters: IssueFilters;
    sortOptions: AssigneeStatsSortOptions;
    timestamp: string;
}

export interface IssuesResponse {
    data: any[];
    pagination: any;
    metrics: any;
    filters: IssueFilters;
    sortOptions?: SortOptions;
    timestamp: string;
}

export interface SummaryResponse {
    data: any;
    filters: IssueFilters;
    timestamp: string;
}
