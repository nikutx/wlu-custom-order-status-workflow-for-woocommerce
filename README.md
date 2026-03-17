# WLU Custom Order Status for WooCommerce

A modern, high-performance WordPress plugin built with React, Vite, and Material UI. This project utilizes a decoupled Micro-Frontend architecture to seamlessly integrate a Free "Host" plugin with a Pro "Guest" plugin inside the WordPress admin dashboard.

## 🏗 Architecture Overview

This project is split into two distinct parts that communicate without tight coupling:
* **The Free Plugin (Host):** Builds the main React shell, handles the primary routing (hash-based), manages core order statuses, and provides empty DOM slots for Pro features.
* **The Pro Plugin (Guest):** Injects itself into the Free plugin's empty DOM slots when the license is active.

### Cross-Plugin Communication (The Event Bus)
To prevent fatal errors or 404s when the Pro plugin is deactivated, the React apps never call each other directly.
* **State & Data:** Pro data (like rule counts and license status) is injected securely into the global window object via PHP (`window.WEBLEVELUP_STATUS`).
* **Events:** Cross-plugin interactions (like tab switching) are handled via a strict Pub/Sub Event Bus (`EventBus.js`). The Free plugin shouts, and the Pro plugin listens.

## 🚀 Tech Stack

* **Frontend:** React 18, Vite, Material UI (MUI v5)
* **Backend:** PHP 7.4+, WordPress REST API
* **Build Tools:** Archiver (Custom Node.js ZIP script)

## 💻 Development Workflow

Because this React app is injected directly into the WordPress admin, we use a custom Vite dev server setup.

### 1. Prerequisites
Ensure your local WordPress environment (e.g., LocalWP) is running and the plugin is activated.
Make sure your Vite dev server is configured to run on a specific port (e.g., `5175`).

### 2. Start the Dev Server
Run the following command in the plugin's root directory to start the Vite HMR (Hot Module Replacement) server:
```bash
npm install
npm run dev