

/**
 * Custom error for authentication issues.
 * We've added a `data` property to carry the JSON body of the error response,
 * which may contain useful information like a specific login URL.
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
   * A generic, reusable API service function.
   * @param url The API endpoint to call.
   * @param options Standard fetch options.
   * @returns A promise that resolves to the strongly-typed data from the API.
   * @template T The expected data type of the successful API response.
*/

export const apiService = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Centralized logic
      signal: options?.signal,
    });
  
    if (!response.ok) {
      // Centralized error handling
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON responses
        throw new AuthError('User is not authenticated', errorData);
      }      
      throw new Error(`API request failed with status: ${response.status}`);
    }
    // For a 204 No Content response, we can't call .json(), so we return null.
    if (response.status === 204) {
        return null as T;
    }   
    // The caller defines what 'T' is, and the service parses the JSON into that type.
    return response.json() as Promise<T>;
};
