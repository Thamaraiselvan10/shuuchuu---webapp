# Shuuchuu (Focus-Bro) Comprehensive Feature Documentation

## 1. Introduction
**Shuuchuu** (formerly Focus-Bro) is an all-in-one, local-first desktop productivity application designed to serve as a complete digital workspace. Unlike traditional tools that force users to jump between different apps for tasks, timers, and notes, Shuuchuu integrates these essential productivity pillars into a single seamless experience. 

The core philosophy of Shuuchuu is to eliminate distractions and provide a tightly integrated ecosystem where users can plan their long-term goals, track their daily habits, execute tasks using deep-work techniques (Pomodoro), and reflect on their progress via journaling—all while keeping their data completely private and stored locally on their machine.

This document provides an in-depth, non-technical breakdown of every feature and module within the application, explaining what they do, why they exist, and how users interact with them. This is intended as a comprehensive feature reference for product managers, new team members, designers, and future developers.

---

## 2. Core Modules & Features in Detail

### 2.1 The Dashboard
**Purpose**: To serve as the command center for the user's day.
**Description**: The Dashboard is the first screen the user sees upon opening the application. It is designed to prevent overwhelm by summarizing only the most critical information needed for the current day. 

**Key Features**:
- **Daily Briefing Widget**: A personalized greeting that highlights the number of active tasks, upcoming alarms, and habits pending for the day.
- **"Today's Focus" View**: A curated list of tasks that the user has explicitly flagged as top priorities for the current day. This separates long-term backlog tasks from immediate actionable items.
- **Habit & Goal Summaries**: Quick visual indicators (like progress bars or streak counters) showing how the user is performing against their daily targets.
- **Quick Actions**: Shortcuts to instantly launch the focus timer, add a quick note, or log a diary entry without navigating to those specific pages.

**Use Case**: A user opens the app in the morning, looks at the dashboard to see what they decided to focus on today, and immediately clicks "Start Timer" next to their top priority task.

---

### 2.2 Task Management (Tasks & Subtasks)
**Purpose**: To capture, organize, and track actionable items.
**Description**: The Task module is a powerful to-do list that scales from simple grocery lists to complex multi-step projects.

**Key Features**:
- **Task Attributes**: Users can assign titles, detailed descriptions, categories, and priority levels (Low, Medium, High).
- **Time Estimations & Due Dates**: Users can set deadlines and estimate how many minutes a task will take, which integrates directly with the Pomodoro timer to help measure planned vs. actual time spent.
- **Subtasks & Breakdown**: Large tasks can be broken down into smaller, checkable subtasks. Completing subtasks fills a progress bar on the parent task.
- **"Today's Focus" Flagging**: Users can star or flag specific tasks to push them to the front page (Dashboard).
- **Recurring Tasks**: Support for daily, weekly, or custom recursive intervals (e.g., "Pay bills every 1st of the month").
- **Drag-and-Drop Organization**: Users can manually reorder tasks to visually prioritize their active list.

**Use Case**: A software developer creates a task called "Release Version 2.0", sets the priority to High, adds 5 subtasks (e.g., "Run tests", "Update docs"), estimates it will take 120 minutes, and flags it as Today's Focus.

---

### 2.3 Long-Term Goal Tracking
**Purpose**: To bridge the gap between abstract ambitions and daily tasks.
**Description**: While tasks are for immediate execution, the Goals module is designed for long-term project planning (e.g., "Learn Japanese", "Save $5000", "Finish Thesis").

**Key Features**:
- **Goal Definition**: Users define a high-level goal, assign a category, set a long-term deadline, and describe their motivation.
- **Phased Execution (Milestones)**: Goals can be split into sequential "Phases". Each phase acts as a milestone with its own specific deadline and status (Pending, In Progress, Completed).
- **Progress Visualization**: As users complete phases, the overall completion percentage of the parent goal increases, providing psychological momentum.
- **Status Tracking**: Goals can be marked as Active, On Hold, or Completed.

**Use Case**: A student's goal is to "Complete Final Year Project." They break this down into three phases: "Phase 1: Research (Due Oct)", "Phase 2: First Draft (Due Nov)", and "Phase 3: Final Submission (Due Dec)". 

---

### 2.4 Habit tracking
**Purpose**: To build consistency and maintain daily routines.
**Description**: The Habits module gamifies consistency by tracking consecutive days a user completes a specific action (e.g., "Drink 2L water", "Read 10 pages").

**Key Features**:
- **Habit Creation**: Users create a habit and assign it to a category (Health, Learning, Productivity).
- **Streak Tracking**: The app calculates the user's "current streak" (consecutive days completed) and their "max streak" (all-time record for that habit).
- **Historical Logs (Calendar UI)**: Users can view a visual representation (like a GitHub contribution graph or mini-calendar) displaying the specific days they successfully logged the habit.
- **One-Click Logging**: Habits can be checked off instantly from the Dashboard or the dedicated Habits page.

**Use Case**: A user wants to build a reading habit. They set up "Read 20 Mins" and click it every evening. Watching the streak counter reach 30 days motivates them not to break the chain.

---

### 2.5 Focus Timer & Mini Mode (Pomodoro)
**Purpose**: To facilitate deep work and prevent burnout.
**Description**: Instead of just listing tasks, Shuuchuu actively helps users do them. The Timer uses the Pomodoro technique (typically 25 minutes of focus, 5 minutes of rest).

**Key Features**:
- **Task Association**: Users can link a timer session to a specific task, automatically logging the time spent on that task.
- **Customizable Intervals**: Users can easily change the duration of focus phases, short breaks, and long breaks.
- **Session Types & Auto-transitions**: The timer intelligently switches between "Focus Mode" and "Break Mode", notifying the user when it's time to rest.
- **Mini-Mode (Floating Widget)**: A crucial feature where the timer can shrink into a small, floating window that stays on top of all other active applications (like browsers or IDEs). This keeps the countdown visible without taking up the whole screen.
- **Interruption Tracking**: Users can log if they were interrupted during a focus session, which helps analyze deep work quality.

**Use Case**: A graphic designer starts a 50-minute focus session linked to "Design Home Page". They shrink the app into Mini-Mode, which stays in the corner of their screen while they work in Photoshop.

---

### 2.6 Digital Diary (Journaling)
**Purpose**: To provide a private space for reflection, mental health, and emotional offloading.
**Description**: A full-featured journaling module that allows users to capture their daily thoughts, victories, and challenges.

**Key Features**:
- **Rich Text Formatting**: Users can format their text (bold, italics, lists, headers) to structure their entries.
- **Mood Tracking**: Users can select an emoji or mood indicator that represents how they felt that day. Over time, this data can be cross-referenced with productivity levels.
- **Media Attachments**: Support for attaching local images or files to an entry (e.g., a screenshot of a completed design, a photo of a receipt).
- **Historical View**: A beautiful timeline or grid view of past entries, sorted by date.

**Use Case**: After a stressful Friday, a user opens the diary, selects a "Tired" mood, and writes a detailed reflection on what went wrong and what they learned, attaching a screenshot of an error they fixed.

---

### 2.7 Notes Application
**Purpose**: To act as a secondary brain for unstructured data.
**Description**: While tasks are actionable, Notes are for reference. This module is a lightweight alternative to apps like Notion or Obsidian.

**Key Features**:
- **Categorization**: Notes can easily be sorted by subject or project.
- **Title & Content**: Simple structure for rapid capture of ideas, meeting minutes, code snippets, or book summaries.
- **Searchability**: Users can search through their notes to quickly recall stored information.

**Use Case**: During a team meeting, a user quickly opens the Notes tab to jot down feedback, save important links, and draft email responses.

---

### 2.8 Interactive Calendar
**Purpose**: To visualize time-bound commitments in a traditional monthly or weekly layout.
**Description**: The calendar synthesizes data from multiple modules into one temporal view.

**Key Features**:
- **Unified Data View**: Displays Tasks with due dates, Goal Phase deadlines, and Habit completion logs on specific dates.
- **Click-to-Edit**: Users can click on a specific day to immediately add a new task or event.
- **Drag-and-Drop Rescheduling**: If a user runs out of time, they can simply drag a task from Tuesday to Thursday to reschedule its due date.

**Use Case**: A user opens the calendar on Sunday evening to plan their upcoming week, moving tasks around to ensure no single day is overloaded with deadlines.

---

### 2.9 Alarms & Reminders
**Purpose**: To provide passive time-management and routine enforcement.
**Description**: A background alarm system that runs native OS notifications.

**Key Features**:
- **Custom Labels & Times**: E.g., "Wake Up", "Start Work", "Lunch Break".
- **Recurrence Support**: Alarms can be set to repeat on specific days of the week (e.g., Mon-Fri at 8:00 AM).
- **Background Execution**: Even if the main Shuuchuu window is closed or hidden, the background service ensures the alarm notification still fires and alerts the user.

**Use Case**: A user sets a recurring alarm for 10:00 PM labeled "Wind Down". Every night, regardless of what app they are using, Shuuchuu pops up a notification telling them to get ready for bed.

---

### 2.10 Wellness
**Purpose**: To ensure productivity does not come at the cost of mental or physical health.
**Description**: A dedicated space for mindfulness.

**Key Features**:
- **Breathing Exercises**: Guided visual animations to help users regulate their breathing and reduce anxiety.
- **Health Prompts**: Periodic reminders to drink water, fix posture, or rest the eyes (e.g., the 20-20-20 rule).

**Use Case**: Feeling overwhelmed, a user visits the Wellness tab, initiates a 2-minute box-breathing exercise following the visual cues on screen, and returns to their work feeling calm.

---

### 2.11 Settings, Profile & Data Privacy
**Purpose**: To allow deep customization and ensure the user owns their data.
**Description**: The configuration hub of Shuuchuu.

**Key Features**:
- **Profile Customization**: Users can set their display name, which personalizes the Dashboard greetings.
- **Theming & Aesthetics**: Support for Light Mode, Dark Mode, and bespoke color accents, allowing the app to fit visually with the user's OS or personal preference.
- **Timer Preferences**: Setting default lengths for Pomodoro focus bursts, short breaks, and long breaks.
- **100% Local Data (Privacy First)**: Shuuchuu does not require an internet connection or a cloud account. All tasks, diary entries, and goals are stored in a local SQLite database (`productivity.db`) strictly on the user's hard drive.
- **Data Export & Import**: Because data is local, the Settings module provides a one-click way to export the entire database as a JSON file, allowing users to safely back up their life or migrate to a new computer.

**Use Case**: A privacy-conscious user loves that their diary entries aren't stored on external servers. Every month, they go to Settings, click "Export Data", and save the JSON backup to their external hard drive.

---

## 3. The Core User Journey (A Day in the Life)

To see how these modules interlock, consider a typical user's day:

1. **8:00 AM (Alarms & Dashboard)**: The Shuuchuu alarm goes off, reminding the user to start the day. They open the app, look at the **Dashboard**, and see a motivational greeting.
2. **8:15 AM (Goals & Tasks)**: They check their long-term **Goals**, realize Phase 2 is due this week, and create specific actionable **Tasks** for the day to meet that deadline. They flag these as "Today's Focus".
3. **9:00 AM (Timer & Mini-Mode)**: The user initiates the **Pomodoro Timer**, links it to a high-priority task, and activates **Mini-Mode**. The timer floats neatly in the corner of their screen while they code or write.
4. **1:00 PM (Habits)**: During lunch, they drink a glass of water and immediately check off their "Hydration" **Habit**, increasing their streak to 15 days.
5. **3:00 PM (Wellness & Notes)**: Feeling stressed, they use the **Wellness** tab for a 2-minute breathing exercise, then jump into the **Notes** tab to jot down ideas for an upcoming meeting.
6. **9:00 PM (Diary & Calendar)**: The day concludes. The user opens the **Diary**, sets their mood to "Productive", and writes a reflection. They finally peek at the **Calendar** to ensure tomorrow is clear, then close the app.
