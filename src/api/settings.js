const getSettings = () => window.WEBLEVELUP_STATUS || {};

export const SettingsAPI = {
    get: async () => {
        const settings = getSettings();
        // Added a timestamp cache-buster to the URL
        const res = await fetch(`${settings.restUrl}settings?t=${Date.now()}`, {
            method: 'GET',
            headers: { 'X-WP-Nonce': settings.nonce }
        });
        if (!res.ok) throw new Error('Failed to load settings');
        return await res.json();
    },

    save: async (data) => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': settings.nonce
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to save settings');
        return await res.json();
    },

    // Updated to handle complex actions (install, activate, disconnect)
};