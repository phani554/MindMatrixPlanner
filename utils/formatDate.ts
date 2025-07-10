export function formatLastSynced(dateString?: string): string {
    // 1. Handle the case where the date doesn't exist yet.
    if (!dateString) {
        return 'never';
    }

    const date = new Date(dateString);
    // Check if the date is valid. If the dateString was malformed, this will be true.
    if (isNaN(date.getTime())) {
        return 'invalid date';
    }

    const now = new Date();

    // 2. Determine if the sync date was sometime today.
    const isToday = date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate();

    // 3. Apply the correct formatting based on the requirement.
    if (isToday) {
        // --- If it's today, show only the time ---
        // Use `toLocaleTimeString`, which is designed for this exact purpose.
        return `today at ${date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    } else {
        // --- If it was another day, show both date and time ---
        // Use `toLocaleString` or combine `toLocaleDateString` and `toLocaleTimeString`.
        return `on ${date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })} at ${date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}`;
    }
}