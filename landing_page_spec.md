# Product Launch Landing Page Specification: Shuuchuu

## 1. Project Overview
**Product Name:** Shuuchuu (Focus)
**Product Type:** All-in-One Desktop Productivity Workspace
**Core Value Proposition:** A unified ecosystem that combines task management, goal tracking, habit building, and focused work sessions (Pomodoro) with wellness integration. It replaces disjointed tools with a single, aesthetically pleasing "Command Center" for your life.

## 2. Target Audience
*   **Students/Researchers:** Need to track assignments, manage study time, and maintain long-term academic goals.
*   **Freelancers/Remote Workers:** Need structure in their day, time tracking, and separation of work/life.
*   **Self-Improvers:** People obsessed with "quantified self," streaks, and visualizing progress.
*   **ADHD/Focus-Challenged Users:** Benefit from the "Mini Timer" mode and visual cues for progress.

## 3. Key Selling Points (USPs)
1.  **The "Mini Mode" Focus Timer:** unlike standard to-do lists, Shuuchuu features a floating, always-on-top timer window that keeps you anchored to your current task without cluttering your screen.
2.  **Visual Goal Mapping:** Break down massive multi-year goals into bite-sized phases and visualize them as a map/journey, not just a list.
3.  **Wellness Integration:** Productivity isn't just about output. The built-in wellness section and daily articles remind users to breathe and recharge.
4.  **Aesthetic First:** Beautiful dark mode, purple/gold themes, and polished animations (page tearing time, glassmorphism) make productivity feel premium, not a chore.

---

## 4. Landing Page Structure (Top to Bottom)

### Section 1: Hero Assessment
*   **Visual:** Large, high-quality centralized screenshot of the **Dashboard** in Dark Mode, showing the circular progress ring and greeting. Partially obscured behind it, floating on the right side, the **Mini Timer** to show the desktop integration.
*   **Headline:** "Master Your Flows. Conquer Your Goals."
*   **Subheadline:** "The all-in-one workspace that combines tasks, habits, and deep focus into a seamless flow. Stop juggling apps and start achieving."
*   **CTA Button (Primary):** "Download for Windows" (Detect OS icon)
*   **CTA Button (Secondary):** "Watch the Video"

### Section 2: The "Why" (Problem/Solution)
*   **Layout:** 3-Column Grid.
*   **Item 1:**
    *   *Icon:* 🧩 (Puzzle/Fragmented)
    *   *Title:* "Stop the App Switching"
    *   *Copy:* "Tasks in one app, habits in another, timer in a third... Shuuchuu brings them all together in perfect sync."
*   **Item 2:**
    *   *Icon:* 🧠 (Brain/Focus)
    *   *Title:* "Deep Focus Built-In"
    *   *Copy:* "Launch the Mini Mode timer. It stays with you, floating on top of your work, keeping you accountable every second."
*   **Item 3:**
    *   *Icon:* 📈 (Chart/Growth)
    *   *Title:* "Visualize Your Journey"
    *   *Copy:* "Turn abstract dreams into concrete phases. Track your progress visually with streaks, rings, and maps."

### Section 3: Feature Deep Dive (Zig-Zag Layout)

#### Feature A: The Command Center (Dashboard)
*   *Image:* Screenshot of Dashboard with "Good Morning, [Name]" and widgets.
*   *Copy:* "Your Day at a Glance. Customize your dashboard with the widgets that matter to you—Tasks, Habits, Calendar, or your Daily Focus Stats."

#### Feature B: Goal Mapping
*   *Image:* Screenshot of the **Goals Page** (Map View).
*   *Copy:* "Dream Big, Plan Small. Break down massive ambitions into manageable phases. Watch your progress bar fill up as you conquer milestones."

#### Feature C: Unbreakable Habits
*   *Image:* Screenshot of the **Habits Page** or the Habits Widget.
*   *Copy:* "Build Routines That Stick. Track daily habits with satisfying check-ins and streak counters. Consistency is key."

### Section 4: The "Zen" Factor (Wellness)
*   *Background:* Subtle purple gradient/pattern.
*   *Content:* Mention the **Diary**, **Quote of the Day**, and **Daily Articles**.
*   *Copy:* "Productivity with Peace of Mind. Integrated journaling and daily wellness articles ensure you don't burn out while you build up."

### Section 5: Technical & Privacy
*   *Points:*
    *   🔒 **Offline First:** Your data stays on your device.
    *   ⚡ **Lightning Fast:** Built with React & Electron for native performance.
    *   🎨 **Customizable:** Themes, layouts, and notification settings.

### Section 6: Footer / Final CTA
*   **Headline:** "Ready to get serious?"
*   **CTA:** [Download Now]
*   **Links:** Release Notes | GitHub (if open source) | Contact Support

---

## 5. Required Assets List
1.  **Hero Image:** Dashboard + Mini Timer Overlay (Composite).
2.  **Feature Screens:**
    *   Dashboard (Full View)
    *   Goals Map View
    *   Timer (Focus Mode)
    *   Habits List
3.  **Icons:** 3-4 abstract icons for the "Why" section.
4.  **Logo:** High-res Version of Shuuchuu Logo.

## 6. Copywriting Tone
*   **Keywords:** Focus, Flow, Journey, Aesthetic, Unified, Control.
*   **Voice:** Encouraging, Professional, Clean, Minimalist. Avoid overly "hustle culture" language; focus on *clarity* and *sustainability*.

---

## 7. Color Theme & Design System

Use the following design tokens to maintain visual consistency between the app and landing page.

### Dark Mode Palette (Default/Hero)
| Token                | Value                          | Usage                          |
|----------------------|--------------------------------|--------------------------------|
| `--bg-gradient`      | `#1e1e1e`                      | Main background                |
| `--text-color`       | `#e0e0e0`                      | Primary text                   |
| `--text-muted`       | `#9e9e9e`                      | Secondary/muted text           |
| `--primary-color`    | `#4988C4`                      | CTA buttons, links, accents    |
| `--secondary-color`  | `#569cd6`                      | Gradients, hover states        |
| `--card-bg`          | `#252526`                      | Card/panel backgrounds         |
| `--card-elevated`    | `#2d2d30`                      | Elevated surfaces, modals      |
| `--border-color`     | `rgba(255, 255, 255, 0.06)`    | Subtle borders                 |
| `--nav-hover-bg`     | `rgba(73, 136, 196, 0.1)`      | Hover states                   |

### Light Mode Palette (Optional Toggle)
| Token                | Value                          | Usage                          |
|----------------------|--------------------------------|--------------------------------|
| `--bg-gradient`      | `#f8f9fa`                      | Main background                |
| `--text-color`       | `#1a1a1a`                      | Primary text                   |
| `--text-muted`       | `#6b7280`                      | Secondary/muted text           |
| `--primary-color`    | `#4988C4`                      | CTA buttons, links, accents    |
| `--secondary-color`  | `#2563eb`                      | Gradients, hover states        |
| `--card-bg`          | `#ffffff`                      | Card/panel backgrounds         |
| `--card-elevated`    | `#f3f4f6`                      | Elevated surfaces              |
| `--border-color`     | `rgba(0, 0, 0, 0.06)`          | Subtle borders                 |

### Typography
| Font Variable        | Font Stack                                                       | Usage              |
|----------------------|------------------------------------------------------------------|--------------------|
| `--font-main`        | `'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif`    | Body text          |
| `--font-heading`     | `'Space Grotesk', 'Plus Jakarta Sans', sans-serif`               | Headings           |
| `--font-mono`        | `'JetBrains Mono', 'SF Mono', 'Monaco', monospace`               | Code snippets      |

> **Note:** Import Google Fonts: `Plus Jakarta Sans` (400, 500, 600) and `Space Grotesk` (600, 700).

### Design Tokens
| Token                | Value                                      | Usage                     |
|----------------------|--------------------------------------------|---------------------------|
| `--radius-sm`        | `8px`                                      | Small buttons, tags       |
| `--radius-md`        | `12px`                                     | Inputs, cards             |
| `--radius-lg`        | `16px`                                     | Large panels, modals      |
| `--radius-xl`        | `20px`                                     | Hero sections             |
| `--transition-fast`  | `0.15s ease`                               | Micro-interactions        |
| `--transition-smooth`| `0.3s cubic-bezier(0.4, 0, 0.2, 1)`        | Page transitions          |
| `--glass-shadow`     | `0 4px 24px rgba(0, 0, 0, 0.4)`            | Card shadows (dark mode)  |

### Glassmorphism Effect
```css
.glass-panel {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
    border-radius: 16px;
}
```

### Accent Color Palette (For CTAs & Highlights)
*   **Primary Blue:** `#4988C4` — Main CTA buttons, active states
*   **Secondary Blue:** `#569cd6` — Hover states, gradients
*   **Success Green:** `#2ecc71` — Completed states, positive feedback
*   **Warning Orange:** `#ffa502` — Medium priority, warnings
*   **Danger Red:** `#ff4d4d` — High priority, destructive actions
