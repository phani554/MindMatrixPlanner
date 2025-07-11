/**
 * Custom error for authentication issues, exported from here as it's
 * tightly coupled with the service that creates and throws it.
 */
export class AuthError extends Error {
    public data: any;
  
    constructor(message: string, data: any = null) {
      super(message);
      this.name = 'AuthError';
      this.data = data;
    }
}

import { configs } from "@/config";
  
/**
 * A generic, reusable API service function that supports cancellation.
 * @param url The API endpoint to call.
 * @param options Standard fetch options, including an AbortSignal.
 * @returns A promise that resolves to the strongly-typed data from the API.
 */
export const apiService = async <T>(url: string, options?: RequestInit): Promise<T> => {
    // The native `fetch` function will use the signal from the options.
    const response = await fetch(url, {
      credentials: 'include', // Always send credentials for session-based auth.
      ...options,
    });
  
    if (!response.ok) {
      // 401 Unauthorized is a special case that throws a specific AuthError.
      if (response.status === 401) {
          let errorMessage = 'User is not authenticated'; // Default message
          let errorData = null;

          try {
              // Attempt to parse the JSON body of the error response
              errorData = await response.json();
              // If the parsed JSON has a 'message' property, use it as the error message.
              if (errorData && typeof errorData.message === 'string') {
                  errorMessage = errorData.message;
              }
          } catch (e) {
              // This catch block runs if the response body is not valid JSON.
              console.error("Could not parse 401 error response as JSON.", e);
              // Fallback to the standard HTTP status text.
              errorMessage = `Authentication Failed: ${response.statusText}`;
          }

          // Throw the custom AuthError with the detailed message.
          throw new AuthError(errorMessage, errorData);
      }

      // For all other errors, throw a generic error with context.
      // We can also try to get more details from the response body here.
      const errorText = await response.text(); // Use .text() for safety
      throw new Error(`API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
  }

  // Handle a "204 No Content" response, which cannot be parsed as JSON.
  if (response.status === 204) {
      return null as T;
  }

  // Parse the JSON into the caller-defined type.
  return response.json() as Promise<T>;
};
export interface SyncOptions {
  batchSize?: number;
  state?: 'all' | 'open' | 'closed';
  syncLimit?: number;
  fullSync?: boolean;
  since?: string;
  // plus triggeredBy, triggeredAt
  triggeredBy?: string;
  triggeredAt?: string;
}

export interface EmployeeStats { /* … */ }
export interface IssueStats    { /* … */ }
export interface SyncResponse {
  message:         string;
  expiration_date: string;
  employeeStats:   EmployeeStats;
  issueStats:      IssueStats;
}

export async function syncRun(options: SyncOptions, signal?: AbortSignal): Promise<SyncResponse> {
  try {
    // This now correctly uses the centralized fetcher, which will throw
    // a detailed AuthError on a 401, or a generic Error on other failures.
    const response = await apiService<SyncResponse | null>(`${configs.BACKEND_URL}/sync/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
      signal
    });

    // Handle the 204 No Content case, which apiService correctly returns as null
    if (response === null) {
      return {
        message:         'No new issues to sync',
        expiration_date: new Date().toISOString(),
        employeeStats:   { updated: 0, inserted: 0, deleted: 0, deletionsSkipped: 0 },
        issueStats:      { totalIssuesLog: 0, totalPr: 0, totalPrMerged: 0, totalIssueClosed: 0 }
      };
    }
    return response;
  } catch (error) {
    // The error from apiService is already well-formed.
    // We just re-throw it so the calling context (SyncProvider) can catch it.
    throw error;
  }
}