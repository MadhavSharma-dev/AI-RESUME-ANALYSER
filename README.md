<div align="center">

<img src="https://img.shields.io/badge/AI%20Powered-Resume%20Analyser-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" alt="AI Resume Analyser" />

<h1>🧠 AI Resume Analyser</h1>

<p>Upload your resume. Get brutally honest, AI-powered feedback — instantly.</p>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![License](https://img.shields.io/badge/License-Internal-gray?style=flat-square)](./LICENSE)

<br />

![Demo Preview](https://placehold.co/860x420/0f172a/6366f1?text=AI+Resume+Analyser&font=raleway)

</div>

---

## ✨ What It Does

**AI Resume Analyser** is a full-stack MERN application that parses your PDF resume and sends it through a multi-model AI consensus pipeline. You get structured, actionable feedback scored across multiple dimensions — all within seconds.

---

## 🚀 Features

- 🔐 **JWT Authentication** — secure sign up, login, and protected routes
- 📂 **Drag-and-drop upload** — PDF only, max 5 MB, with magic-byte validation
- 🤖 **Multi-model AI consensus** — Gemini, Groq, and Mistral vote on your resume
- 📊 **Scored feedback** across tone, structure, ATS compatibility, and keywords
- 📈 **Analytics dashboard** — score trends, activity history, and ATS readiness gauge
- 🛡️ **Rate limiting + Helmet** — hardened API security out of the box
- 🌗 **Dark / Light mode** — theme preference persisted across sessions

---

## 🛠️ Tech Stack

### Frontend
| | Technology |
|---|---|
| UI | React 19, Framer Motion |
| Routing | React Router v7 |
| Build | Vite 8 |
| Linting | ESLint, oxlint, Prettier |

### Backend
| | Technology |
|---|---|
| Server | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| File Upload | Multer |
| AI Providers | Google Gemini, Groq, Mistral |
| Parsing | pdf-parse, mammoth |
| Logging | Pino + pino-pretty |
| Validation | Zod |
| Security | Helmet, express-rate-limit |

---

## 📁 Project Structure

```
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, upload, rate limit, validation
│   ├── models/          # Mongoose schemas (User, Resume, Activity)
│   ├── routes/          # Express routers
│   ├── services/        # AI providers + consensus logic
│   └── utils/           # Logger, magic bytes, sanitiser
│
└── frontend/
    └── src/
        ├── api/         # Axios client + per-resource modules
        ├── components/  # UI grouped by feature
        ├── context/     # Auth, Theme, UI contexts
        ├── hooks/       # Custom data-fetching hooks
        └── lib/         # Utilities, motion variants
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js ≥ 18 (LTS recommended)
- MongoDB instance (local or Atlas)
- API keys for at least one AI provider (Gemini / Groq / Mistral)

### 1. Clone the repo

```bash
git clone <repository-url>
cd ai-resume-analyser
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` · Backend runs at `http://localhost:5000`

---

## 🔑 Environment Variables

**`backend/.env`**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume-analyser
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧬 AI Feedback Pipeline

```
PDF Upload ──► Text Extraction (pdf-parse)
                      │
                      ▼
         ┌────────────────────────┐
         │  Parallel AI Analysis  │
         │  Gemini · Groq · Mistral│
         └────────────────────────┘
                      │
                      ▼
            Consensus Aggregation
                      │
                      ▼
         Structured JSON Feedback
    { score, ats, strengths, gaps, tone }
                      │
                      ▼
            Saved to MongoDB
```

---

## 📊 Feedback Schema

```json
{
  "overallScore": 0,
  "atsScore": 0,
  "strengths": [],
  "improvements": [],
  "keywordGaps": [],
  "toneAssessment": ""
}
```

---

## 🔒 Security Highlights

- Magic-byte file validation (not just extension checks)
- JWT stored in `httpOnly` cookies
- Input sanitisation via DOMPurify (frontend) and custom middleware (backend)
- Zod schema validation on all API inputs
- Helmet headers + per-route rate limiting

---

## 🗺️ Roadmap

- [ ] Resume version comparison
- [ ] Job description matching score
- [ ] Email report delivery
- [ ] Multi-language support

---

## ⚠️ Known Limitations

| Issue | Detail |
|---|---|
| AI rate limits | Free-tier providers may throttle heavy usage |
| PDF complexity | Heavily formatted PDFs may lose fidelity during parsing |
| JSON reliability | Occasional malformed AI responses (handled gracefully) |

---

## 📄 License

Internal / team project — not licensed for public distribution.

---

<div align="center">
  <sub>Built with ☕ and a healthy distrust of vague resumes.</sub>
</div>
