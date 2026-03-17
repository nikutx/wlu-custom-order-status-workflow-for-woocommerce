import { wpFetch } from "./wp.js";

export const StatusesAPI = {
    list: () => wpFetch("statuses", { method: "GET" }),

    create: (payload) =>
        wpFetch("statuses", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    update: (id, payload) =>
        wpFetch(`statuses/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),

    remove: (id) =>
        wpFetch(`statuses/${encodeURIComponent(id)}`, {
            method: "DELETE",
        }),
};
