export async function wpFetch(path, init = {}) {
    const cfg = window.WEBLEVELUP_STATUS;
    const url = cfg.restUrl + path.replace(/^\//, "");

    const res = await fetch(url, {
        credentials: "same-origin",
        ...init,
        headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": cfg.nonce,
            ...(init.headers || {}),
        },
    });

    const text = await res.text();

    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        // WordPress often returns { code, message, data }
        const msg =
            (data && data.message) ||
            (data && data.code) ||
            `Request failed (${res.status})`;
        const err = new Error(msg);
        err.data = data;
        err.status = res.status;
        throw err;
    }

    return data;
}
