import { IssueFilters, AssigneeStatsSortOptions, SortOptions } from "@/api.types";
import { configs } from "@/config";
/**
 * Builds a precise, repository-specific GitHub issue search URL.
 * It combines global UI filters with context-specific data (like an employee's username).
 *
 * @param filters An object containing all potential filter criteria from the UI and context.
 * @returns A fully encoded URL string ready for use in an `<a>` tag.
 */
export function buildGitHubSearchURL(filters: IssueFilters,   sortOptions?: SortOptions | AssigneeStatsSortOptions
): string {
  // Use the direct issues URL for your repository for a clean and specific link.
  const baseURL = configs.GITHUB_URL; 
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
  if (filters.user) {
    parts.push(`author:${filters.user}`);
  }

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
      field = sortOptions.sortBy.replace("At", "");
    } else if (
      ["totalIssues", "openIssues", "closedIssues"].includes(sortOptions.sortBy)
    ) {
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
  // If no filters are applied, we still need a valid query string.
  if (!q) {
    // If no filters are applied, we can use a catch-all query.
    return `${baseURL}?q=`;
  }

  return `${baseURL}?q=${q}`;
}