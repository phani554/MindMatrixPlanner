export class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
}
  /**
 * Handles API errors by logging the original error and converting it
 * into a user-friendly Error object with a clean message.
 * @param error - The error caught from the API call.
 * @param featureName - A name for the feature (e.g., "productivity tip") for context in logs.
 * @returns A new Error object with a user-friendly message.
 */
export const handleApiError = (error: any, featureName: string = "data"): Error => {
    // If the error is an AbortError, just re-throw it. The component will ignore it.
    if (error.name === 'AbortError') {
      throw error;
    }
  
    // Log the original, technical error for debugging.
    console.error(`Failed to fetch ${featureName}:`, error);
  
    // --- Start of Generic Error Formatting Logic ---
    let errorMessage = `Could not fetch ${featureName}. Please try again later.`;
  
    if (error.message) {
      if (error.message.includes("API_KEY")) {
        errorMessage = `Feature unavailable due to an API key issue. Tip: Break down large tasks!`;
      } else if (error.message.includes("Quota") || error.message.includes("rate limit")) {
        errorMessage = `Feature temporarily unavailable. Tip: Batch similar tasks together!`;
      } else if (error instanceof AuthError) {
        errorMessage = `You must be logged in to access ${featureName}.`;
    }
    }
    // --- End of Generic Error Formatting Logic ---
  
    // Return a new error with the clean message for the component to display.
    return new Error(errorMessage);
};