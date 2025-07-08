/**
 * Utility function to build query string from filters and options
 */
export const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        if (Array.isArray(value)) {
            // For arrays, join with commas (as your backend expects)
            if (value.length > 0) {
                searchParams.set(key, value.join(','));
            }
        } else {
            searchParams.set(key, value.toString());
        }
    });

    return searchParams.toString();
};

// in @/utils/githubSearch.ts
import { IssueFilters, SortOptions, AssigneeStatsSortOptions } from "@/api.types";

export function buildGitHubSearchURL(
  filters: IssueFilters,
  sortOptions?: SortOptions | AssigneeStatsSortOptions
): string {
  const parts: string[] = [];

  // state
  if (filters.state && filters.state !== "all") {
    parts.push(`state:${filters.state}`);
  }

  // type
  if (filters.pull_request !== undefined) {
    parts.push(filters.pull_request ? "type:pr" : "type:issue");
  }

  // author
  if (filters.user) parts.push(`author:${filters.user}`);

  // assignees
  filters.assignees?.forEach(login => {
    parts.push(`assignee:${login}`);
  });

  // labels
  filters.labels?.forEach(label => {
    parts.push(`label:"${label}"`);
  });

  // dates
  (["created", "updated", "closed"] as const).forEach(field => {
    const start = (filters as any)[`${field}StartDate`];
    const end = (filters as any)[`${field}EndDate`];
    if (start) parts.push(`${field}:>=${start}`);
    if (end) parts.push(`${field}:<=${end}`);
  });

  // sort
  if (sortOptions?.sortBy) {
    const valid = ["created", "updated", "comments"] as const;
    let field = "";
    if (["createdAt", "updatedAt", "closedAt"].includes(sortOptions.sortBy)) {
      field = sortOptions.sortBy.replace("At", "") as string;
    } else if (sortOptions.sortBy === "totalIssues" || sortOptions.sortBy === "openIssues" || sortOptions.sortBy === "closedIssues") {
      field = "comments";
    } else {
      field = "created"; // fallback
    }
    const order = sortOptions.order === "asc" ? "asc" : "desc";
    if (valid.includes(field as any)) {
      parts.push(`sort:${field}-${order}`);
    }
  }

  const q = encodeURIComponent(parts.join(" "));
  return `https://github.com/issues?q=${q}`;
}


