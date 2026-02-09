// assets/admin-app/src/api/rules.js

const getSettings = () => window.WLU_OW || {};

export const RulesAPI = {
    /**
     * Get all rules
     */
    list: async () => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}rules`, {
            method: 'GET',
            headers: { 'X-WP-Nonce': settings.nonce }
        });
        if (!res.ok) throw new Error('Failed to fetch rules');
        return await res.json();
    },

    /**
     * Create a new rule
     */
    create: async (payload) => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': settings.nonce
            },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to create rule');
        return json;
    },

    /**
     * Delete a rule
     */
    delete: async (id) => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}rules/${id}`, {
            method: 'DELETE',
            headers: { 'X-WP-Nonce': settings.nonce }
        });
        if (!res.ok) throw new Error('Failed to delete rule');
        return true;
    },

    /**
     * Update (Toggle Active)
     */
    update: async (id, payload) => {
        const settings = getSettings();
        const res = await fetch(`${settings.restUrl}rules/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': settings.nonce
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update rule');
        return await res.json();
    }
};