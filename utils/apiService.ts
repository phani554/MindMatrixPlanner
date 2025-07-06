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