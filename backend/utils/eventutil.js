// file: src/utils/eventutil.js

export const clients = [];

/**
 * Broadcasts a 'sync_completed' event to all connected SSE clients.
 * @param {object} payload - The data to send with the success event.
 */
export function broadcastSyncComplete(payload) {
    // The 'event:' line is crucial for the frontend to distinguish messages.
    const data = `event: sync_completed\ndata: ${JSON.stringify(payload)}\n\n`;
    console.log("Broadcasting sync_completed event");
    clients.forEach(res => res.write(data));
};

/**
 * (NEW) Broadcasts a 'sync_error' event to all connected SSE clients.
 * @param {object} payload - The error data (e.g., { message: '...' }).
 */
export function broadcastSyncError(payload) {
    const data = `event: sync_error\ndata: ${JSON.stringify(payload)}\n\n`;
    console.log("Broadcasting sync_error event");
    clients.forEach(res => res.write(data));
}