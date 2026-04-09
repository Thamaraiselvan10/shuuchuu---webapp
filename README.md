# Shuuchuu (Concentration) 🎯

![Version](https://img.shields.io/badge/version-1.3.1-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Electron](https://img.shields.io/badge/Electron-29.0.0-orange.svg) ![React](https://img.shields.io/badge/React-18.2.0-blue.svg)

**Shuuchuu** is a powerful, all-in-one productivity desktop application designed to help you master your focus, organize your life, and achieve your goals. Built with modern web technologies and wrapped in Electron, it provides a seamless and responsive experience on your desktop.

## 🚀 Key Features

### ⏱️ Focus Mastery
- **Advanced Timer**: Customizable focus timer (Pomodoro style) to manage work/break intervals.
- **Mini Timer**: Unobtrusive floating timer to keep you on track without distraction.
- **Focus Rules**: Set strict rules to prevent distractions during focus sessions.

### 📝 Task & Project Management
- **Task Dashboard**: specific Kanban-style or list-based task management with drag-and-drop support.
- **Project Organization**: Group tasks into projects/categories for better organization.
- **Prioritization**: tagging and priority levels.

### 🎯 Goals & Habits
- **Goal Tracking**: Set long-term goals and break them down into actionable phases (`GoalDetails`, `PhaseModal`).
- **Habit Tracker**: Monitor daily habits and streaks (`Habits`, `Wellness`).
- **Visual Progress**: Visualize your journey with charts and statistics.

### 📅 Planning & Journaling
- **Calendar Integration**: Schedule tasks and view deadlines (`Calendar`).
- **Daily Diary**: Built-in journaling to reflect on your day and progress (`Diary`, `Notes`).
- **Daily Briefing**: Start your day with a clear overview of what lies ahead (`DailyBriefingModal`).

### ⚙️ Personalization & Utilities
- **Customizable UI**: Dark mode, themes, and personalized settings (`Settings`, `Profile`).
- **Alarms**: Integrated alarm system (`AlarmManager`, `Alarms`).
- **Offline Support**: Local database support with `sql.js` for data persistence.
- **Cloud Sync**: Firebase integration for real-time data synchronization.

---

## 🌟 How Shuuchuu Boosts Productivity

**Shuuchuu** isn't just a list of features; it's a cohesive system designed to transform how you work and live.

### 📈 Unparalleled Productivity
By combining **Goals**, **Tasks**, and **Habits** into a single ecosystem, Shuuchuu eliminates the friction of switching between multiple apps. The **Focus Rules** and **Mini Timer** ensure you stay in the "zone," minimizing distractions and maximizing output.

### ⏳ Mastery Over Time
Time is your most valuable asset. The integrated **Pomodoro-style Timer** helps you break work into manageable chunks, preventing burnout. coupled with the **Calendar** and **Daily Briefing**, you can visualize your entire day at a glance, ensuring no deadline is missed and every minute is accounted for.

### 🗂️ Strategic Task Management
Move beyond simple to-do lists. With **Project Grouping**, **Prioritization Tags**, and **Phase-based Goal Breaking**, Shuuchuu encourages you to think strategically. Large, overwhelming goals become small, actionable steps, making completion inevitable rather than just aspirational.

---

## 🛠️ Technical Architecture

### Tech Stack

- **Core**: [Electron](https://www.electronjs.org/) (Desktop Container)
- **Frontend Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: CSS Modules / Standard CSS
- **State Management & Logic**: React Hooks & Context API
- **Database**: 
  - **Local**: `sql.js` (SQLite)
  - **Cloud**: Firebase
- **Routing**: React Router DOM
- **Utilities**: 
  - `dnd-kit` for drag-and-drop interactions.
  - `recharts` for data visualization.
  - `lucide-react` for iconography.
  - `date-fns` for date manipulation.

### Project Structure

```bash
├── src/
│   ├── components/    # Reusable UI components (Modals, Cards, Buttons)
│   ├── pages/         # Main application views (Dashboard, Tasks, Timer)
│   ├── context/       # Global state management contexts
│   ├── services/      # API services and business logic (TaskService, AlarmService)
│   ├── data/          # Static data and configuring files
│   ├── hooks/         # Custom React hooks
│   └── layouts/       # Main app layouts
├── electron/          # Main process files for Electron
├── backend/           # Backend logic (if applicable)
├── dist/              # Production build output
└── public/            # Static assets
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: (v16 or higher recommended)
- **npm** or **yarn**

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/shuuchuu.git
    cd shuuchuu
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    -   Create a `.env` file in the root directory.
    -   Copy the contents of `.env.example` into `.env`.
    -   Fill in your Firebase configuration details:
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        ...
        ```

### Development

To run the application in development mode (hot-reload enabled):

```bash
# Run both Vite (Frontend) and Electron
npm run electron:dev
```

If you only want to run the web frontend:
```bash
npm run dev
```

### Building for Production

To create a distributable executable (EXE/DMG):

```bash
npm run electron:build
```
The output will be available in the `dist` folder.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
