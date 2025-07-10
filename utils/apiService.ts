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
  
    // Centralized error handling for non-successful responses.
    if (!response.ok) {
      // 401 Unauthorized is a special case that throws a specific AuthError.
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON 401s.
        throw new AuthError('User is not authenticated', errorData);
      }      
      // For all other errors, throw a generic error with context.
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
  const res = await fetch(`${configs.BACKEND_URL}/sync/run`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
    signal
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('User is not authenticated');
    const text = await res.text();
    throw new Error(`Sync failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }
  if (res.status === 204) {
    // fallback shape
    return {
      message:         'No new issues to sync',
      expiration_date: new Date().toISOString(),
      employeeStats:   { updated: 0, inserted: 0, deleted: 0, deletionsSkipped: 0 },
      issueStats:      { totalIssuesLog: 0, totalPr: 0, totalPrMerged: 0, totalIssueClosed: 0 }
    };
  }
  return res.json();
}