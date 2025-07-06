import { AuthError } from './apiService';

/**
 * Handles errors from apiService, creating a user-friendly message.
 * It specifically ignores AbortError to prevent cancelled requests from being shown as errors.
 * @param error The error caught from an apiService call.
 * @param featureName A name for the feature (e.g., "resources") for context in logs.
 * @returns A new Error object with a user-friendly message.
 */
export const handleApiError = (error: any, featureName: string = "data"): Error => {
    // This is the most important check: if the request was cancelled, do nothing.
    if (error.name === 'AbortError') {
      throw error;
    }
  
    // Log the original error for debugging.
    console.error(`Error fetching ${featureName}:`, error);
  
    // Create a user-friendly message based on the error type.
    let errorMessage = `Could not fetch ${featureName}. Please try again later.`;
  
    if (error instanceof AuthError) {
        errorMessage = `You must be logged in to access ${featureName}.`;
    } else if (error.message) {
      if (error.message.includes("API_KEY")) {
        errorMessage = `Feature unavailable due to an API key issue.`;
      } else if (error.message.includes("Quota") || error.message.includes("rate limit")) {
        errorMessage = `Feature temporarily unavailable due to high traffic.`;
      }
    }
  
    return new Error(errorMessage);
};