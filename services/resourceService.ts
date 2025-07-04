import { Resource } from '../types'; // Assuming you have a types file
import { apiService } from '@/utils/apiService';
import { handleApiError } from '@/utils/apiError';

interface Quote {
    q: string;
    a: string;
};

export interface User {
    githubid: string; // The user specifically asked for this
    login: string;
    name: string;
}

export class AuthError extends Error {
    public data: any;
  
    constructor(message: string, data: any = null) {
      super(message);
      this.name = 'AuthError';
      this.data = data;
    }
}

// --- RESOURCE SERVICE ---

/**
 * Fetches a list of resources.
 * @param signal An AbortSignal to allow the request to be cancelled.
 */
const getResources = async (signal: AbortSignal): Promise<Resource[]> => {
    try {
        // Delegate the actual fetch and basic error checks to the utility
        return await apiService<Resource[]>('http://localhost:5100/data/raw', { signal });
    } catch (error) {
        // Delegate error formatting to the utility, providing context
        throw handleApiError(error, 'resources');
    }
};

// Export the service with its methods



// --- PRODUCTIVITY SERVICE ---

/**
 * Fetches a productivity tip.
 * @param signal An AbortSignal to allow the request to be cancelled.
 */
const getTip = async (signal: AbortSignal): Promise<string> => {
    try {
        // 1. Use the generic utility to get the data
        const data = await apiService<Quote>("http://localhost:5100/zen/quote", { signal });
        
        // 2. Apply service-specific logic: extract the quote text and provide a fallback
        return data?.q ?? "Stay focused and take regular breaks!";
    } catch (error) {
        // 3. Delegate error formatting to the utility
        throw handleApiError(error, 'productivity tip');
    }
};
// --- AUTH SERVICE ---

/**
 * Checks if the user is authenticated.
 * On failure, it redirects the browser to the login page.
 * @returns A promise that resolves to true if authenticated; otherwise, the page redirects.
 */
const checkAuthentication = async (): Promise<User> => {
    try {
      // We call a protected endpoint. We don't care about the response data,
      // only that the request succeeds with a 2xx status.
      const user = await apiService<User>('http://localhost:5100/api/auth-required');

      if (!user) {
        throw new Error("Authentication successful but no user data was returned.");
        }
       return user;
    } catch (error) {
      console.error('Authentication check failed, redirecting to login.', error);
  
      // This service's special logic: REDIRECT on error.
      let loginUrl = 'http://localhost:5100/auth/login'; // Fallback URL
  
      // If it's an AuthError and it contains a specific loginUrl, use it.
      if (error instanceof AuthError && error.data?.loginUrl) {
        loginUrl = error.data.loginUrl;
      }
  
      window.location.href = loginUrl;
  
      // Return a promise that never resolves, as the page is navigating away.
      return new Promise(() => {});
    }
};
  

export const fetchService = {
    getResources,
    getTip,

};
export const authService = {
    checkAuthentication,
};