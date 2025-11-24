# AI Development Rules for Nexus Marketing CRM

This document outlines the rules and conventions for the AI assistant to follow when developing and modifying this application. Adhering to these guidelines ensures consistency, maintainability, and quality.

## Tech Stack Overview

The application is built with a modern, lightweight tech stack. Key technologies include:

*   **Framework:** React 19 with TypeScript for type-safe development.
*   **Build Tool:** Vite for fast development and optimized builds.
*   **Styling:** Tailwind CSS for all styling, loaded via CDN. All components are styled using utility classes.
*   **Component Architecture:** Custom-built, reusable components located in `src/components`. The style is inspired by shadcn/ui, focusing on composition and simplicity.
*   **Icons:** `lucide-react` is the exclusive icon library used throughout the application.
*   **Data Visualization:** `recharts` is used for creating charts and graphs in the Dashboard and Reports sections.
*   **State Management:** Primarily uses React Hooks (`useState`, `useEffect`) for local and shared state. Data persistence is handled via `localStorage`.
*   **Routing:** A simple, state-based routing system controlled within `App.tsx` manages view transitions without an external routing library.

## Library and Convention Rules

Follow these rules strictly to maintain codebase consistency.

### 1. Styling & UI
*   **Tailwind CSS is Mandatory:** All styling MUST be done using Tailwind CSS utility classes. Do not add custom CSS files, styled-components, or inline style objects.
*   **Component Structure:** Create new components as small, single-purpose files within `src/components`. Follow the existing file naming and structure conventions.
*   **Responsiveness:** All new components and layouts MUST be responsive and tested for mobile, tablet, and desktop views.

### 2. Icons
*   **Use `lucide-react` Only:** For any icon, you MUST import it from the `lucide-react` library. Do not use SVGs directly or install other icon libraries.

### 3. Charts and Data Visualization
*   **Use `recharts` for Charts:** All charts (bar, line, pie, etc.) MUST be implemented using the `recharts` library. Do not introduce other charting libraries like Chart.js or D3.

### 4. State Management
*   **React Hooks First:** Use `useState` and `useEffect` for managing component state.
*   **Prop Drilling is Acceptable (for now):** The application's global state is managed in `App.tsx` and passed down via props. Continue this pattern. Do not add a global state management library (like Redux or Zustand) unless the complexity grows significantly and the user requests it.
*   **Persistence:** Use `localStorage` for persisting key application state (tasks, users, settings) as demonstrated in `App.tsx`.

### 5. Navigation
*   **State-Based Routing:** The app uses a `currentView` state in `App.tsx` for navigation. Continue to use this system. Do not install or implement `react-router-dom`.

### 6. User Feedback
*   **Use Existing Notification System:** For toasts and notifications, use the `addNotification` helper function and `NotificationToast` component. This ensures a consistent user experience for feedback.

### 7. Code Quality
*   **TypeScript Everywhere:** Write all new components and logic in TypeScript, providing types for props, state, and function signatures.
*   **Simplicity is Key:** Avoid over-engineering. Write simple, elegant, and readable code. The goal is maintainability.