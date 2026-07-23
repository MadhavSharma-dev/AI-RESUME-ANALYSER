# Frontend Architecture & Developer Notes

Welcome to the **Resume Roaster** frontend codebase. This document outlines the technology stack, project structure, routing architecture, UI patterns, and development guidelines.

---

## 🛠️ Technology Stack

- **Framework & Bundler**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) (lightning-fast HMR and minimal production bundle size).
- **Routing**: [React Router DOM v6](https://reactrouter.com/) (declarative routing, nested app shell layout, and protected route guards).
- **Animation & Motion**: [Framer Motion](https://www.framer.com/motion/) (micro-interactions, page entrance transitions, and 3D card flips).
- **HTTP Client**: [Axios](https://axios-http.com/) (configured in `src/api/client.js` with `withCredentials: true` for automatic httpOnly cookie transmission).
- **Data Visualization**: [Recharts](https://recharts.org/) (`ResponsiveContainer`, `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip` for ATS score trend tracking).
- **Design & Styling**: Pure Vanilla CSS with CSS Custom Properties (`index.css`), adhering to modern glassmorphism, HSL color tokens, and responsive flex/grid layouts.

---

## 📁 Directory & Component Structure

```
frontend/src/
├── api/                   # API interaction modules (Axios calls)
│   ├── auth.js            # Authentication, avatar upload, stats, profile updating
│   ├── client.js          # Base Axios instance with global error handlers
│   ├── dashboard.js       # Dashboard aggregate metrics & trend fetching
│   └── resumes.js         # Resume uploads, version fetching, PDF exports
├── components/
│   ├── analysis/          # Insights & global analytics components
│   │   ├── ChronologicalScoreTrend.jsx
│   │   ├── Insights.css
│   │   └── Insights.jsx
│   ├── auth/              # Authentication & User Account components
│   │   ├── Auth.css
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Settings.css
│   │   └── Settings.jsx
│   ├── common/            # Shared UI utilities
│   │   ├── HeaderUtils.css
│   │   └── HeaderUtils.jsx  # Global search & About shortcut bar
│   ├── dashboard/         # Core candidate dashboard components
│   │   ├── About.css
│   │   ├── About.jsx        # Origin story & 3D Maker flip cards
│   │   ├── Dashboard.css
│   │   ├── Dashboard.jsx    # Main Command Center
│   │   ├── DashboardModal.css
│   │   ├── DashboardModal.jsx
│   │   ├── History.jsx      # Chronological roast log
│   │   └── ScoreEvolutionChart.jsx
│   ├── landing/           # Public marketing landing page
│   │   └── Landing.jsx
│   ├── layout/            # Application Shell layout components
│   │   ├── Navbar.jsx       # Public top navigation header
│   │   ├── Sidebar.css
│   │   └── Sidebar.jsx      # Left icon navigation shell with tooltips
│   └── resume/            # Resume management & detailed review views
│       ├── ResumeDetail.css
│       ├── ResumeDetail.jsx # ATS score gauge, 7-metric breakdown, bullet rewrites
│       ├── Resumes.jsx      # Resume vault grid
│       └── UploadDropzone.jsx
├── context/               # Global state contexts
│   └── ThemeContext.jsx   # Theme state provider
├── lib/
│   └── motion.js          # Reusable Framer Motion animation variants
├── App.jsx                # Main application component & session restoration logic
├── main.jsx               # Entry point mounting React DOM
├── routes.jsx             # Public & Protected route definitions
└── index.css              # Global design system tokens & utility classes
```

---

## 🧭 Key Pages & Route Architecture

| Route | Page Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Landing.jsx` | Public | Hero showcase, key features, and CTA to get started. |
| `/signup` | `Register.jsx` | Public | Candidate registration with format & MX DNS validation. |
| `/login` | `Login.jsx` | Public | Account authentication with email/password. |
| `/dashboard` | `Dashboard.jsx` | Protected | **Command Center** — score evolution, upload trigger, and recent roasts. |
| `/resumes` | `Resumes.jsx` | Protected | **Resume Vault** — grid of all uploaded candidate PDFs & version history. |
| `/resumes/:id` | `ResumeDetail.jsx` | Protected | Detailed evaluation view — ATS score, 7-metric breakdown, rewrites, and PDF stream. |
| `/history` | `History.jsx` | Protected | **Past Roasts** — complete timeline log of all analyses. |
| `/analytics` | `Insights.jsx` | Protected | **Analytics Lab** — global score averages and category performance metrics. |
| `/settings` | `Settings.jsx` | Protected | **Profile & Settings** — avatar upload, email editing, real DB stats, and secure logout. |
| `/profile` | `Navigate -> /settings` | Protected | Alias redirecting to `/settings`. |
| `/about` | `About.jsx` | Public / Prot. | Mission story, 4 AI Readability guarantees, and 3D Maker cards. |

---

## 🎨 Core Implementation Patterns

### 1. 3D Maker Flip Cards (`About.jsx`)
- Built using pure CSS 3D transforms (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`).
- Clicking a maker card toggles local state (`flippedPrashant` / `flippedMadhav`), applying `.flipped` to trigger a `rotateY(180deg)` rotation.
- Back face displays styled contact buttons for **LinkedIn**, **Email** (`mailto:`), and **GitHub**.

### 2. Sidebar Hover Tooltips (`Sidebar.jsx` & `Sidebar.css`)
- Icons are wrapped in `.sidebar-tooltip-wrapper` with relative positioning.
- Tooltips are rendered as `.sidebar-tooltip` pills positioned `left: calc(100% + 14px)` with pseudo-element arrows (`::before`).
- On hover, tooltips fade in (`opacity: 1`) and slide horizontally into view.
- Every icon includes an `aria-label` attribute matching the tooltip text for accessibility.

### 3. Profile Picture File Upload (`Settings.jsx`)
- Avatar circle acts as a button triggering a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">`.
- Validates file type and size (`<= 5MB`) on client before generating an instant optimistic URL preview (`URL.createObjectURL(file)`).
- Sends `FormData` payload to `POST /api/auth/avatar`, updating the user context on success.

### 4. Secure Session & Logout Confirmation (`Settings.jsx`)
- Clicking the profile avatar in the sidebar navigates to `/settings` (never logs out).
- Logging out requires an explicit click on the **Log Out of Session** button inside Settings.
- Triggers a modal dialog (`showLogoutModal`) confirming intent. Upon confirmation, calls `POST /api/auth/logout` to clear server cookies before clearing client state and redirecting to `/login`.

---

## ⚠️ Known Limitations & Placeholder Configs

- **About Page Contact Placeholders**: The flip-card back-face URLs for Prashant Kumar and Madhav Sharma currently use placeholder values:
  - `PLACEHOLDER_PRASHANT_LINKEDIN_URL`
  - `PLACEHOLDER_PRASHANT_EMAIL`
  - `PLACEHOLDER_PRASHANT_GITHUB_URL`
  - `PLACEHOLDER_MADHAV_LINKEDIN_URL`
  - `PLACEHOLDER_MADHAV_EMAIL`
  - `PLACEHOLDER_MADHAV_GITHUB_URL`
  To update these, search for `PLACEHOLDER_` in `src/components/dashboard/About.jsx` and replace them with the production URLs.
