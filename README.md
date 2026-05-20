# 🏋️ FitPulse — Member Dashboard

> A premium, fully client-side gym membership dashboard built with pure **HTML, CSS, and JavaScript**.  
> No frameworks, no build tools, no backend — just open `index.html` in a browser and it works.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Features](#2-live-features)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [How to Run](#5-how-to-run)
6. [Page Flow & Navigation](#6-page-flow--navigation)
7. [File-by-File Explanation](#7-file-by-file-explanation)
   - [index.html](#indexhtml)
   - [css/styles.css](#cssstylescss)
   - [css/landing.css](#csslandingcss)
   - [css/login.css](#csslogincss)
   - [css/plan.css](#cssplancss)
   - [css/setting_style.css](#csssetting_stylecss)
   - [css/analytics.css](#cssanalyticscss)
   - [css/profile.css](#cssprofilecss)
   - [js/script.js](#jsscriptjs)
   - [js/profile.js](#jsprofilejs)
   - [js/setting_script.js](#jssetting_scriptjs)
   - [js/charts.js](#jschartsjs)
   - [js/app.js & data.js](#jsappjs--datajs)
8. [Session & Authentication](#8-session--authentication)
9. [Profile System](#9-profile-system)
10. [Theme System](#10-theme-system)
11. [localStorage Keys](#11-localstorage-keys)
12. [Known Limitations](#12-known-limitations)
13. [Author & Credits](#13-author--credits)

---

## 1. Project Overview

**FitPulse** is a premium gym membership dashboard designed for individual gym members. It simulates a real-world fitness app experience — complete with a login screen, a public landing page, and a feature-rich private dashboard.

The dashboard is a **Single Page Application (SPA)** — all three states (Login, Landing Page, Dashboard) live inside one `index.html` file and are shown/hidden via JavaScript without any page reloads.

---

## 2. Live Features

### 🔐 Login System
- Full-screen login overlay with animated background
- Email + password validation before entry
- 2-second loading spinner to simulate authentication
- **Session persistence** — once logged in, refreshing the page keeps you on the dashboard (uses `localStorage`)
- Skip button (`×`) to explore the landing page without logging in

### 🌍 Public Landing Page
- Dark-themed hero section with headline, stats, and CTA buttons
- **Explore / Activities** section (Strength, Cardio, Yoga cards)
- **Membership Tiers** (Elite, Pro, Home) pricing cards
- **Expert Trainers** section with real trainer photos
- **Image grid** with overlay text
- **Feature carousel** with auto-play, dot navigation, and arrow controls
- Full footer with links, QR code, social icons, and app store badges

### 📊 Dashboard (Post-Login)
- **Overview** — Welcome card, membership stats, recent activity, recent workouts, quick actions, weekly goal progress bars
- **Plans** — Four membership plan cards (Gold, Gold Premium, Elite, Elite Premium)
- **Analytics** — Animated ring charts for sessions, reward points, attendance, active days, and a weekly workout bar chart
- **Settings** — Tabbed panel with:
  - Appearance (Light / Dark / System theme toggle, persisted to localStorage)
  - Profile (name, email, phone, age display)
  - Notifications (toggle switches)
  - System (Logout button)

### 👤 Dynamic Profile System
- Auto-generates a profile from the login email (name, phone, membership ID, fitness goal)
- Profile data populates across the entire dashboard (navbar, dropdown, settings card, welcome greeting)
- **Edit Profile modal** — change name, phone, age, fitness goal, bio, avatar URL
- Profile changes are saved to `localStorage` and persist on refresh
- Profile completion percentage bar

### 🔔 Other UX Features
- Dynamic greeting (Good Morning / Afternoon / Evening) based on real clock
- Profile dropdown with avatar click
- Sidebar navigation with active state highlighting
- Mobile-responsive hamburger menu
- Auto-closing dropdowns when clicking outside

---

## 3. Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure |
| **CSS3 (Vanilla)** | All styling — variables, flexbox, grid, animations |
| **JavaScript (ES6+)** | All interactivity, DOM manipulation, localStorage |
| **Google Fonts — Inter** | Typography |
| **Font Awesome 6** | All icons |
| **ui-avatars.com** | Generated avatar images from names |
| **chart.js** (CDN) | Ring and bar charts in Analytics |

> No frameworks. No npm packages to install. No bundler needed.

---

## 4. Project Structure

```
member-dashboard-1/
│
├── index.html                  ← Single HTML file — entire app lives here
│
├── css/
│   ├── styles.css              ← Core dashboard variables, layout, components
│   ├── landing.css             ← Landing page / hero styles
│   ├── login.css               ← Login overlay styles
│   ├── plan.css                ← Membership plan cards
│   ├── setting_style.css       ← Settings panel tabs and content
│   ├── analytics.css           ← Analytics / charts view
│   └── profile.css             ← Edit Profile modal + toast notification
│
├── js/
│   ├── script.js               ← Main app logic (session, navigation, carousel)
│   ├── profile.js              ← Profile generation, editing, logout
│   ├── setting_script.js       ← Settings tabs + theme switching
│   ├── charts.js               ← Analytics ring/bar chart rendering
│   ├── app.js                  ← Analytics data orchestration
│   ├── data.js                 ← Static analytics data
│   └── tabs.js                 ← (Reserved, currently empty)
│
├── images/
│   ├── landing_bg.png          ← Landing page background
│   ├── gym_login_bg.png        ← Login overlay background
│   ├── class_hero.png          ← Landing hero section image
│   ├── trainer_indian_dashboard.png ← Dashboard welcome card trainer photo
│   ├── trainer_indian_1/2/3.png     ← Trainers section photos
│   ├── carousel_1–5.png        ← Feature carousel slides
│   ├── yoga_pose.png           ← Image grid (left)
│   └── workout_action.png      ← Image grid (right)
│
├── package.json                ← Project metadata (no dependencies)
└── README.md                   ← This file
```

---

## 5. How to Run

### Option A — Open directly (simplest)
```bash
# Just double-click index.html, or drag it into any browser
open index.html
```

### Option B — Local dev server (recommended, avoids CORS on images)
```bash
# If you have VS Code → install "Live Server" extension
# Right-click index.html → "Open with Live Server"

# OR using Node.js http-server
npx http-server . -p 5500
# Then open: http://localhost:5500
```

### Option C — Python simple server
```bash
python3 -m http.server 5500
# Then open: http://localhost:5500
```

> **No `npm install` needed.** There are no dependencies.

---

## 6. Page Flow & Navigation

```
Browser opens index.html
        │
        ▼
 Is there a saved session in localStorage?
        │
   YES ─┴─ NO
   │             │
   ▼             ▼
Dashboard     Login Overlay (fullscreen)
   │               │
   │        [Fill email + password]
   │               │
   │        [Sign In button] → 2s spinner → Dashboard
   │               │
   │        [× Skip button] → Landing Page
   │                              │
   │                         [Login button] → Login Overlay
   │
   ▼
Dashboard (SPA — tabs switch views without page reload)
  ├── Overview  (default)
  ├── Plans
  ├── Analytics
  └── Settings
        └── [Logout] → Clears session → Landing Page
```

---

## 7. File-by-File Explanation

### `index.html`
The entire application lives in this one file. It is structured in three major sections:

1. **`#login-overlay`** — The fullscreen login modal. Hidden after login or skip.
2. **`#landingContainer`** — The public marketing landing page. Shown when login is skipped.
3. **`#dashboardContainer`** — The private dashboard. Shown after successful login.

Within the dashboard, four `<main>` elements act as "views":
- `#dashboard-view` — Overview grid
- `#plans-view` — Membership plans
- `#settings-view` — Settings panel
- `#wip-view` — Analytics (rebranded from WIP)

At the bottom of `<body>`, scripts are loaded in order:
```html
<script src="./js/script.js"></script>      <!-- Must be first -->
<script src="./js/setting_script.js"></script>
<script src="./js/profile.js"></script>     <!-- Must be last (depends on above) -->
```

---

### `css/styles.css`
The core stylesheet. Contains:
- **CSS Custom Properties (variables)** at `:root` for light theme:
  ```css
  --bg-main, --bg-card, --text-main, --text-muted
  --accent-color, --accent-gradient
  --radius-*, --shadow-*
  ```
- **Dark theme** overrides on `.theme-dark` class (applied to `#dashboardContainer`)
- **Dashboard layout** — sidebar, main wrapper, top navbar, card grid
- **Component styles** — welcome card, stat cards, activity list, workout list, progress bars, quick action buttons

---

### `css/landing.css`
All styles for the public landing page:
- Dark glassmorphism navbar with `backdrop-filter: blur`
- Hero section with headline, stats, and trainer image
- Activities/Explore section — dark-themed glass cards with orange accent hover
- Membership tier cards
- Trainers grid
- Image overlay section
- Feature carousel
- Footer with links, app badges, QR code

---

### `css/login.css`
Styles for the full-screen login overlay:
- Split layout (tagline on left, form card on right)
- Gym background image with gradient overlay
- Glass-morphism card (`backdrop-filter: blur`)
- Animated login form fields and submit button
- Social login buttons (Google, Apple)
- Responsive adjustments for mobile

---

### `css/plan.css`
Styles for the **Plans** dashboard view:
- Four plan cards in a responsive grid
- Light and dark card variants
- Price display, feature list with icons
- Elite Premium highlighted card with badge

---

### `css/setting_style.css`
Styles for the **Settings** dashboard view:
- Tab navigation bar with icon + label buttons
- Tab content panels (Appearance, Profile, Notifications, System)
- Theme selector grid with radio-button cards
- Profile form fields
- Notification toggle list
- Logout button in System tab

---

### `css/analytics.css`
Styles for the **Analytics** view:
- Ring chart containers with CSS custom property `--ring-pct` for animated fill
- Top stat row with glowing icon rings
- Weekly workout bar chart
- Progress metrics cards

---

### `css/profile.css`
Styles for the **Edit Profile modal** and toast notification:
- Full-screen overlay with centered modal card
- Avatar preview circle
- Form fields in two-column grid
- Save / Cancel button row
- Toast notification (bottom-right, slides in/out)

---

### `js/script.js`
The **main controller** script. Runs on `DOMContentLoaded`. Responsibilities:

| Section | What it does |
|---|---|
| Session restore | Checks `localStorage` for `fitpulse-session`. If found, skips login and shows dashboard immediately. |
| Login form | Validates email + password, shows spinner for 2s, then saves session and shows dashboard. |
| Skip button | Shows landing page without logging in. |
| `persistSession()` | Writes `{ loggedInAt: Date.now() }` to `localStorage`. |
| `destroySession()` | Removes session key from `localStorage`. |
| Logout handlers | Calls `destroySession()` and switches to landing page. |
| Dynamic greeting | Updates `#greetingText` every minute based on hour. |
| Sidebar navigation | Switches between 4 views by toggling `display` styles. |
| Profile dropdown | Toggle open/close on avatar click, close on outside click. |
| Mobile menu | Hamburger toggles sidebar nav visibility on small screens. |
| Carousel | Prev/Next/Dot navigation, auto-play every 3s, reset on manual interaction. |

---

### `js/profile.js`
The **profile system** script. Runs on `DOMContentLoaded` (after `script.js`).

| Function | What it does |
|---|---|
| `generateProfile(email)` | Creates a fresh profile object from the login email — extracts name, generates random phone, age, membershipId, and fitness goal. |
| `saveProfile(profile)` | Saves profile object to `localStorage` as JSON. |
| `loadProfile()` | Reads and parses profile from `localStorage`. |
| `populateDashboard(profile)` | Updates every UI element that shows user data — avatar, name in greeting, dropdown, settings card, profile form. |
| `openEditModal(profile)` | Pre-fills the Edit Profile modal fields and shows it. |
| `saveModalChanges()` | Reads modal fields, updates profile object, saves to `localStorage`, re-populates dashboard. |
| `handleProfileLogout()` | Clears both session and profile from `localStorage`. |
| `calcCompletion(profile)` | Returns a 0–100 percentage based on how many profile fields are filled. |
| `showToast(message)` | Shows a temporary success toast notification. |

**Login intercept:** A `capture: true` event listener on the login form fires *before* `script.js`'s listener, so the profile is generated and saved before the session is marked active.

**MutationObserver:** Watches `#dashboardContainer`'s `style` attribute. When it becomes visible (display: flex), `populateDashboard()` is called automatically.

---

### `js/setting_script.js`
The **settings panel** script.

| Feature | Detail |
|---|---|
| Tab switching | Removes/adds `.active` class on `.tab-btn` and matching `.tab-content` by `data-tab` attribute. |
| Theme apply | Adds/removes `.theme-dark` on `#dashboardContainer`. |
| Theme persist | Saves selected theme string to `localStorage` key `fitpulse-theme`. |
| System theme | Listens to `window.matchMedia('(prefers-color-scheme: dark)')` and auto-applies when "System" is selected. |
| Save Profile btn | Shows a green "Saved!" feedback for 2.5 seconds on click. |

---

### `js/charts.js`
Renders the **Analytics** charts using Chart.js (loaded via CDN in HTML):
- **Ring charts** — animated conic-gradient rings for Sessions, Points, Attendance, Active Days
- **Bar chart** — weekly workout sessions by day (Mon–Sun)
- Counts up stat numbers with `requestAnimationFrame` for smooth animation
- Charts are initialized when the Analytics view becomes visible

---

### `js/app.js` & `data.js`
- `data.js` — Static data arrays for analytics (workout history, session counts, etc.)
- `app.js` — Orchestrates chart rendering by pulling from `data.js` and calling `charts.js`

---

## 8. Session & Authentication

This app uses **simulated authentication** — there is no real backend or password verification. The session flow works like this:

```
User fills email + password
        ↓
profile.js generates a profile from the email (capture phase)
        ↓
script.js validates fields (non-empty check only)
        ↓
2-second spinner to simulate server round-trip
        ↓
script.js calls persistSession() → saves { loggedInAt } to localStorage
        ↓
Dashboard is shown
        ↓
On next page load → isSessionActive() returns true → dashboard shown instantly
        ↓
On Logout → destroySession() + handleProfileLogout() → clears localStorage → shows landing
```

**localStorage keys used for session:**
- `fitpulse-session` — `{ email, loggedInAt }` — set by `profile.js`, read by `script.js`

---

## 9. Profile System

The profile is auto-generated on first login from the email address:

```
Email: saurya.bisen@gmail.com
         ↓
local part: saurya.bisen
         ↓
toTitleCase() → "Saurya Bisen"
         ↓
Profile object:
{
  fullName:     "Saurya Bisen",
  email:        "saurya.bisen@gmail.com",
  phone:        "+91 9812 3456 78",   ← randomly generated
  age:          24,                   ← randomly generated (18–35)
  membershipId: "FIT4521",            ← randomly generated
  goal:         "Build Muscle",       ← randomly picked
  bio:          "",
  avatarUrl:    "",                   ← empty = initials fallback via ui-avatars.com
  createdAt:    1716123456789
}
```

Profile is saved to `localStorage` key `fitpulse-profile` and re-used on refresh. The user can edit all fields except `email` and `membershipId` via the **Edit Profile** modal (accessible from the top-right avatar dropdown).

---

## 10. Theme System

The dashboard supports **three themes** selectable from Settings → Appearance:

| Theme | Effect |
|---|---|
| **Light** (default) | Removes `.theme-dark` from `#dashboardContainer` |
| **Dark** | Adds `.theme-dark` to `#dashboardContainer` |
| **System** | Reads `prefers-color-scheme` media query and auto-applies |

The selected theme is saved to `localStorage` key `fitpulse-theme` and restored on every page load.

> **Note:** The theme only affects the **dashboard** area. The login overlay and landing page always use their own dark styles.

---

## 11. localStorage Keys

| Key | Written by | Contains | Cleared on |
|---|---|---|---|
| `fitpulse-session` | `profile.js` + `script.js` | `{ email, loggedInAt }` | Logout |
| `fitpulse-profile` | `profile.js` | Full profile object | Logout |
| `fitpulse-theme` | `setting_script.js` | `"light"` / `"dark"` / `"system"` | Never (persists) |

---

## 12. Known Limitations

| Limitation | Reason |
|---|---|
| No real authentication | Pure frontend — credentials are not verified |
| No real backend/database | All data lives in `localStorage` and is device-specific |
| Dashboard data is static | Stats, activity, workouts are hardcoded HTML — not fetched from an API |
| No password reset / signup | Not in scope for this prototype |
| `localStorage` only | If the user clears browser storage, session is lost |

---

## 13. Author & Credits

| | |
|---|---|
| **Project** | FitPulse Member Dashboard |
| **Version** | 1.0.0 |
| **Author** | Sauryaman Bisen |
| **Team** | LeapX Pune |
| **License** | ISC |

**External Resources Used:**
- [Google Fonts — Inter](https://fonts.google.com/specimen/Inter)
- [Font Awesome 6](https://fontawesome.com/)
- [ui-avatars.com](https://ui-avatars.com/) — Avatar image generation
- [Chart.js](https://www.chartjs.org/) — Analytics charts
- [QR Server API](https://goqr.me/api/) — QR code generation

---

*Built with ❤️ using pure HTML, CSS & JavaScript — no frameworks required.*
