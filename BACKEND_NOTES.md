# Backend Architecture & Developer Notes

Welcome to the **Resume Roaster** backend server codebase. This document details the technology stack, database schema, Multi-LLM ensemble pipeline, file storage strategy, authentication flow, and environment configuration.

---

## 🛠️ Technology Stack

- **Runtime & Framework**: [Node.js](https://nodejs.org/) (v18+) with [Express.js](https://expressjs.com/) (ES Modules syntax via `"type": "module"`).
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (schema validation, pre-save hooks, and compound indexing).
- **PDF Extraction**: `pdf-parse` (spatial top-to-bottom, left-to-right text stream extraction).
- **Multi-LLM Integration**:
  - `@google/genai` — Google Gemini 2.5 / 1.5 Pro & Flash
  - `@groq/sdk` — Groq Llama 3.1 70B & 8B
  - `@mistralai/mistralai` — Mistral Small / Medium
- **File Storage**: `@vercel/blob` (Vercel Blob CDN) with fallback to local static filesystem serving (`backend/uploads/`).
- **Security & Utilities**:
  - `bcryptjs` (password hashing with cost factor 12)
  - `jsonwebtoken` (JWT access & refresh tokens)
  - `express-rate-limit` (DDoS & credential-stuffing rate limiting)
  - `dns.promises` (native Node.js MX-record DNS lookup)

---

## 📁 Directory Structure

```
backend/
├── config/                # Server & database initialization
│   ├── db.js              # Mongoose MongoDB connection pooling & heartbeat
│   └── env.js             # Environment variable loading & validation
├── controllers/           # API Endpoint Controller Handlers
│   ├── analyticsController.js # Aggregate analytics & score trends
│   ├── authController.js      # Signup, login, logout, avatar upload, stats
│   ├── pdfExportController.js  # Server-side HTML-to-PDF export pipeline
│   └── resumeController.js   # Resume upload, versioning, parsing, and deletion
├── middleware/            # Express Middleware
│   ├── errorHandler.js    # Global uncaught error & HTTP error formatter
│   ├── imageUpload.js     # Multer image upload validator (JPEG/PNG/WebP <= 5MB)
│   └── rateLimiter.js     # Endpoint rate limiters (auth, upload, general)
├── models/                # Mongoose Models & Schemas
│   ├── Activity.js        # Audit trail of user actions
│   ├── Analysis.js        # Multi-LLM analysis outputs & metric breakdowns
│   ├── Resume.js          # Parent resume documents & embedded versions array
│   └── User.js            # User accounts, credentials, and refresh hashes
├── routes/                # Express Route Endpoints
│   ├── analyticsRoutes.js
│   ├── authRoutes.js
│   └── resumeRoutes.js
├── services/              # LLM Services & Core Business Logic
│   ├── aiSchema.js        # JSON Schema definitions for structured LLM outputs
│   ├── ensemble.js        # Multi-LLM Parallel Execution & Consensus Engine
│   ├── gemini.js          # Google Gemini API connector
│   ├── groq.js            # Groq Llama 3.1 API connector
│   └── mistral.js         # Mistral AI API connector
├── utils/                 # Utility Helper Modules
│   ├── avatarStorage.js   # Vercel Blob / local filesystem avatar manager
│   ├── emailValidator.js  # Regex & MX DNS email validator
│   └── logger.js          # Structured console logger
├── uploads/               # Local file fallback directory (git-ignored)
├── package.json
└── server.js              # Server entry point & Express app setup
```

---

## 🗄️ Database Schema & Data Models

### 1. User Model (`models/User.js`)
- **Fields**: `name`, `email` (indexed, unique), `password` (`select: false`), `avatarUrl`, `authProvider` (`local`/`google`/`apple`), `googleId`, `appleId`, `refreshTokenHash` (`select: false`).
- **Security Features**: Passwords are automatically hashed via bcrypt (cost factor 12) during pre-save hooks. Refresh tokens are stored as SHA-256 hashes (`refreshTokenHash`), preventing token misuse even if the DB is compromised.

### 2. Resume Model (`models/Resume.js`)
- **Fields**: `userId` (ref: `User`, indexed), `name`, `versions` (array of `versionSchema`).
- **Version Subdocument**: `versionNumber`, `storagePath` (Vercel Blob URL or local file path), `fileName`, `mimeType`, `targetRole`, `rawText` (`select: false`), `parsedSections` (Mixed JSON).

### 3. Analysis Model (`models/Analysis.js`)
- **Fields**: `resumeId` (ref: `Resume`, indexed), `versionNumber`, `targetRole`, `contentHash`, `atsScore`, `overallScore`, `breakdown` (4 metrics), `extendedBreakdown` (7 metrics), `issues` (array of title/desc/fix), `strengths`, `keywords` (`matched`/`missing`), `rewrites` (`before`/`after`), `verdict`, `modelsUsed`, `rawModelOutputs` (audit payload of Gemini/Groq/Mistral responses).
- **Index**: Compound index `{ resumeId: 1, versionNumber: 1 }` for fast version retrieval.

---

## 🤖 The 3-LLM Ensemble Scoring Pipeline (`services/ensemble.js`)

Why use 3 AI models instead of 1? Single LLMs are susceptible to prompt sensitivity and hallucinations. Our ensemble architecture queries 3 distinct models in parallel via `Promise.allSettled`:

1. **Google Gemini**: Structure extraction, document hierarchy verification, and section formatting score.
2. **Groq (Llama 3.1 70B/8B)**: Ultra-fast token matching against target role job requirements and impact measurement.
3. **Mistral AI**: Scans for HR red flags, passive language, and missing quantitative achievements.

### Consensus & Reconciliation Engine
- **Numerical Metrics**: Weighted mathematical average across returned model scores.
- **Feedback Deduplication**: Merges duplicate issues using semantic title matching.
- **Roaster Verdict**: Dynamically selects the most comprehensive summary verdict generated by the model suite.

---

## ☁️ File Storage Architecture

- **Vercel Blob Storage**: If `BLOB_READ_WRITE_TOKEN` is configured in `.env`, uploads (resumes & profile avatars) are streamed directly to Vercel's global CDN via `@vercel/blob` `put()`. The resulting public CDN URL is stored in MongoDB.
- **Local Storage Fallback**: If `BLOB_READ_WRITE_TOKEN` is absent, files are saved locally to `backend/uploads/` and served via static route `app.use("/uploads", express.static(...))`.
- **Cleanup**: Uploading a new profile picture automatically triggers `deleteAvatar()` (`del()` or `fs.unlink()`) to prevent orphaned files.

---

## 🔐 Security & Auth Flow

### 1. Email Format & MX-Record Verification (`utils/emailValidator.js`)
During signup or email update, the system verifies:
1. Standard regex pattern (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`).
2. Node.js `dns.promises.resolveMx(domain)` lookup. Non-existent domains (e.g. `user@gg.com`) are rejected before hitting the database.

### 2. Session & Logout Security (`authController.js`)
- **Access Tokens**: Short-lived JWTs (15-minute expiration).
- **Refresh Tokens**: Long-lived JWTs (7-day expiration) set as `httpOnly`, `sameSite: strict` cookies.
- **Server-Side Logout**: Calling `POST /api/auth/logout` sets `user.refreshTokenHash = null` in MongoDB and clears the refresh cookie. Any future request attempting to refresh the session will be rejected by the server.

---

## 🔑 Required Environment Variables (`.env`)

To run the backend, create a `.env` file in the `backend/` directory with the following keys:

```env
# Server Port
PORT=5001

# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resume-roaster?retryWrites=true&w=majority

# JWT Secrets
JWT_SECRET=your_jwt_access_token_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_token_secret_key_here

# LLM Provider API Keys
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Optional: Vercel Blob Storage Token (Fallback to local fs if omitted)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_here
```
