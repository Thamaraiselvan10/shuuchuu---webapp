# Project Dependencies & Requirements

This document outlines all the major dependencies currently used in the application, categorizing them by their primary function within the architecture. This is a centralized reference of the tools that power the project (as defined in `package.json`).

## Core Production Dependencies (`dependencies`)

### 1. User Interface & Components
*   **`lucide-react`** (`^0.284.0`): The primary icon library. Used extensively across the Sidebar, Layouts, and components to provide clean, consistent scalable vector icons.
*   **`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`**: The drag-and-drop engine. This powers interactive components like the Task Kanban boards and the sortable Goal Phase cards.
*   **`react-router-dom`** (`^6.16.0`): The standard routing library for React. Handles all client-side navigation seamlessly between pages like Dashboard, Tasks, Goals, Habits, and Calendar.
*   **`recharts`** (`^2.8.0`): A composable charting library. Essential for rendering data visualizations and metrics on the Dashboard or within Habit trackers.
*   **`framer-motion`** (`^10.16.4`): A robust animation library for React, utilized to handle smooth transitions and complex motion in UI elements.

### 2. Data Management & Logistics
*   **`sql.js`** (`^1.13.0`): A standalone, complete SQLite database compiled to WebAssembly. This is the heart of the offline database, allowing the app to read, write, and execute SQL entirely locally without requiring a dedicated background server.
*   **`date-fns`** (`^2.30.0`): A lightweight, modern toolset for parsing, formatting, and manipulating dates. Highly utilized in the Calendar mapping, Habit streaks, and Task deadline tracking.
*   **`uuid`** (`^9.0.0`): A universally unique identifier generator. Essential for creating strong, unique primary keys when storing new tasks, habits, and user configuration states into the SQLite database.

### 3. Desktop Application Native Features
*   **`electron-progressbar`** (`^2.0.1`): A native UI plugin connected to Electron. Used to render progress bars directly to the Windows/OS taskbar or a dedicated native window frame when initializing or loading heavy data.

---

## Development & Build Environment (`devDependencies`)

### 1. Build Tools & Frameworks
*   **`vite`** (`^4.4.5`) & **`@vitejs/plugin-react`**: The ultra-fast frontend build tool and development server. Replaces tools like Webpack to give instant Hot Module Replacement (HMR) and optimized build bundling.
*   **`electron`** (`^29.0.0`): The core framework that wraps the React application into a Chromium/Node.js desktop environment.
*   **`electron-builder`** (`^24.6.4`): The packaging tool responsible for taking the compiled application and generating distributable installation files (like `.exe` setup wizards or portable apps).

### 2. Scripting & Orchestration
*   **`concurrently`** (`^8.2.1`) & **`wait-on`** (`^7.0.1`): These utilities orchestrate the local development environment. They allow `npm run electron:dev` to intelligently boot up the Vite local server, wait for it to be ready, and *then* launch the Electron shell mapped to the Vite port.

### 3. Code Quality
*   **`eslint`** and associated React plugins (`eslint-plugin-react`, `eslint-plugin-react-hooks`): The standard linter setup. Continuously enforces code quality, catches syntax errors, and validates proper usage of React hooks during development.

---

## How to Install (Manual Installation)

If you are setting up this project from scratch and prefer not to rely on the existing `package.json`, you can manually install all of these exact dependencies by running the following commands in your terminal:

**1. Install Production Dependencies:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns electron-progressbar framer-motion lucide-react react-router-dom recharts sql.js uuid
```

**2. Install Development Dependencies:**
```bash
npm install -D @types/react @types/react-dom @vitejs/plugin-react concurrently cross-env electron electron-builder eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh vite wait-on
```

*(Note: In an existing clone of this repository, you only need to run `npm install` once without any arguments to grab everything automatically!)*
