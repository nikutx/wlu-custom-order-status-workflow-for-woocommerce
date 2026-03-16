import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const rootEl = document.getElementById("weblevelup-status-root");

if (!rootEl) {
    console.error("Missing #weblevelup-status-root element");
} else {
    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
