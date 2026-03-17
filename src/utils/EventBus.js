/**
 * WLU Event Bus
 * Central registry for all cross-plugin communication.
 * Keep this file identical in both the Free and Pro plugins!
 */

// 1. The Registry: Every event in the app MUST be listed here. No typos allowed!
export const WLU_EVENTS = {
    TAB_CHANGED: 'wlu:tab_changed',
    // You can add more later! e.g., STATUS_DELETED: 'wlu:status_deleted'
};

// 2. The Engine: Standardized methods for shouting and listening
export const WLUBus = {
    /**
     * Broadcast an event to the window
     * @param {string} eventName - MUST use a WLU_EVENTS constant
     * @param {object} payload - The data to pass along
     */
    shout: (eventName, payload = {}) => {
        const event = new CustomEvent(eventName, { detail: payload });
        window.dispatchEvent(event);
    },

    /**
     * Listen for an event
     * @param {string} eventName - MUST use a WLU_EVENTS constant
     * @param {function} callback - What to do when the event fires
     * @returns {function} - Call this to stop listening (cleanup)
     */
    listen: (eventName, callback) => {
        const handler = (e) => callback(e.detail);
        window.addEventListener(eventName, handler);

        // Return the cleanup function immediately
        return () => window.removeEventListener(eventName, handler);
    }
};