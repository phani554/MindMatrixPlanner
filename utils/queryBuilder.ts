/**
 * Utility function to build query string from filters and options
 */
export const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        if (Array.isArray(value)) {
            // For arrays, join with commas (as your backend expects)
            if (value.length > 0) {
                searchParams.set(key, value.join(','));
            }
        } else {
            searchParams.set(key, value.toString());
        }
    });

    return searchParams.toString();
};


