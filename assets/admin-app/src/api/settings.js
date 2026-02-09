const getSettings = () => window.WLU_OW || {};

export const SettingsAPI = {
    get: async () => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}settings`, {
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
    }
};