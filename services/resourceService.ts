import { Resource, Quote, AuthError, User } from '../types'; // Assuming you have a types file
import { apiService } from '@/utils/apiService';
import { handleApiError } from '@/utils/apiError';
import { configs } from '@/config';

// --- CONFIGURATION ---
const BASE_URL = configs.BACKEND_URL;

// --- AUTH SERVICE (No AbortController needed) ---

/**
 * Checks authentication. On failure, it REDIRECTS the browser to the backend login page.
 */
const checkAuthentication = async (): Promise<User> => {
    try {
        const user = await apiService<User>(`${BASE_URL}/auth/me`);
        if (!user) {
            throw new AuthError("Authentication check returned no user data.");
        }
        return user;
    } catch (error) {
        // We don't use handleApiError because the side-effect is a redirect, not a UI message.
        console.error('Authentication check failed, redirecting to login.', error);
        window.location.href = `${BASE_URL}/auth/login`;
        return new Promise(() => {}); // Prevent further code execution after redirect.
    }
};

/**
 * Logs the user out and REDIRECTS the browser.
 */
const logout = async (): Promise<void> => {
    try {
        await apiService(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout API call failed, but redirecting anyway.', error);
    } finally {
        // Always redirect on logout, regardless of API call success.
        window.location.href = `${BASE_URL}/auth/login`;
    }
};

// --- DATA-FETCHING SERVICES (AbortController is used here) ---

/**
 * Fetches resources and can be cancelled.
 * @param signal An AbortSignal from an AbortController.
 */
const getResources = async (signal: AbortSignal): Promise<Resource[]> => {
    try {
        return await apiService<any[]>(`${BASE_URL}/data/raw`, { signal });
    } catch (error) {
        // Use handleApiError to prepare a user-facing error message.
        throw handleApiError(error, 'resources');
    }
};
const getAllModules = async function (signal?: AbortSignal): Promise<string[]> {
    try {
        const url = `${BASE_URL}/data/modules`;
        const response = await apiService<{ data: string[] }>(url, { signal });
        return response.data || [];
    } catch (error) {
        throw handleApiError(error, 'module list');
    }
}
/**
 * Fetches a full Quote object and can be cancelled.
 * @param signal An AbortSignal from an AbortController.
 * @returns A Promise that resolves to a Quote object.
 */
const getTip = async (signal: AbortSignal): Promise<Quote> => {
    try {
        // Correctly type the API call and return the entire object.
        const quote = await apiService<Quote>(`${BASE_URL}/zen/quote`, { signal });

        // Handle the case where the API might return a 204 No Content
        if (!quote) {
            return { q: "When in doubt, take a break.", a: "System" };
        }
        
        return quote;
    } catch (error) {
        throw handleApiError(error, 'productivity tip');
    }
}

// --- EXPORTS ---

export const fetchService = {
    getResources,
    getTip,
    getAllModules,
};

// Update the authService to include the new logout function
export const authService = {
    checkAuthentication,
    logout,
};