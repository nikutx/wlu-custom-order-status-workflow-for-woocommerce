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
    verifyLicense: async (payload) => {
        const settings = getSettings();

        // If it's a simple string, format it as a 'verify' action for backward compatibility.
        // If it's an object, it means React sent us something like { action: 'install' }
        const bodyData = typeof payload === 'string'
            ? { license_key: payload, action: 'verify' }
            : payload;

        const res = await fetch(`${settings.restUrl}settings/license`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': settings.nonce
            },
            body: JSON.stringify(bodyData)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to perform license action');
        }

        return data;
    }
};