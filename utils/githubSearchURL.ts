import { IssueFilters } from "@/api.types";

/**
 * Builds a precise, repository-specific GitHub issue search URL.
 * It combines global UI filters with context-specific data (like an employee's username).
 *
 * @param filters An object containing all potential filter criteria from the UI and context.
 * @returns A fully encoded URL string ready for use in an `<a>` tag.
 */
export function buildGitHubSearchURL(filters: IssueFilters): string {
  // Use the direct issues URL for your repository for a clean and specific link.
  const baseURL = "https://github.com/MindMatrix/AMP/issues";
  const parts: string[] = [];

  // --- Search Term Construction ---

  // 1. STATE: Uses modern 'is:open' or 'is:closed' syntax.
  // This is context-specific, usually passed in from the clicked link.
  if (filters.state && filters.state !== "all") {
    parts.push(`is:${filters.state}`);
  }

  // 2. TYPE: Filters for Issues or Pull Requests based on the UI checkboxes.
  if (filters.showIssues && !filters.showPullRequests) {
    parts.push("is:issue");
  } else if (!filters.showIssues && filters.showPullRequests) {
    parts.push("is:pr");
  }
  // If both or neither are checked, no filter is added, showing all types.

  // 3. ASSIGNEE: The most critical part for linking from the stats table.
  // This correctly uses the employee's username (login).
  filters.assignees?.forEach(login => {
    parts.push(`assignee:${login}`);
  });
  
  // 4. LABELS: Adds filters for each selected label.
  // Using quotes `""` is essential for labels that contain spaces.
  filters.labels?.forEach(label => {
    parts.push(`label:"${label}"`);
  });
  
  // 5. DATE RANGE: Handles the 'Created Date' filter from the UI.
  // It correctly uses GitHub's range syntax (`YYYY-MM-DD..YYYY-MM-DD`).
  const startDate = filters.createdStartDate;
  const endDate = filters.createdEndDate;
  if (startDate && endDate) {
    parts.push(`created:${startDate}..${endDate}`);
  } else if (startDate) {
    parts.push(`created:>=${startDate}`);
  } else if (endDate) {
    parts.push(`created:<=${endDate}`);
  }

  // --- Final URL Assembly ---

  // Join all parts with a space and encode them to be URL-safe.
  const q = encodeURIComponent(parts.join(" "));

  return `${baseURL}?q=${q}`;
}