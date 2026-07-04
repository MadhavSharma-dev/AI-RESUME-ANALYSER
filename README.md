# AI Resume Analyser

AI Resume Analyser is a full-stack web application that lets users upload a PDF resume and receive structured, AI-generated feedback. Uploaded resumes are converted into images and sent to a vision-capable LLM, which returns actionable feedback on tone, structure, skills, and ATS (Applicant Tracking System) compatibility.

## Features

- **Authentication** via Puter.js — sign in / sign out, protected routes
- **Drag-and-drop resume upload** (PDF only, max 5 MB) with a target job title/role input
- **PDF-to-image conversion** using PDF.js for AI analysis
- **AI-powered feedback** via Claude AI / GPT-4o Vision, including:
  - Overall score (0–100)
  - ATS compatibility score (0–100)
  - Strengths
  - Areas for improvement
  - Keyword gaps
  - Tone assessment
- **Resume dashboard** with resume cards, score badges, and quick access to feedback
- **Data wipe utility** to delete all stored resumes and feedback

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| Auth, Storage, AI | Puter.js SDK |
| PDF Processing | PDF.js (`pdfjs-dist`) |
| AI Model | Claude AI / GPT-4o Vision |
| Hosting | Puter Hosting |

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

```bash
git clone <repository-url>
cd ai-resume-analyser
npm install
```

### Environment Variables

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
/pages          # Route-level components
/components     # Reusable UI components
/lib            # Shared utilities and helpers
```

### Routes

| Route | Description |
|---|---|
| `/` | Homepage — resume list and upload CTA |
| `/upload` | Resume upload form |
| `/resume/:id` | Resume feedback page |

## Code Conventions

- Components live in `/components/<ComponentName>.jsx`
- Pages live in `/pages/<PageName>.jsx`
- Shared logic lives in `/lib/`
- Styling via Tailwind CSS only — no inline styles
- PropTypes or JSDoc comments on all components

## AI Feedback Pipeline

1. User uploads a PDF and specifies a target job role.
2. The PDF is converted into image(s) using PDF.js.
3. Image(s) and job role context are sent to the AI model via `puter.ai.chat()`.
4. The model returns structured JSON feedback:

```json
{
  "overall_score": 0,
  "ats_compatibility": 0,
  "strengths": [],
  "improvements": [],
  "keyword_gaps": [],
  "tone_assessment": ""
}
```

5. Feedback is validated and saved to the Puter key-value store, keyed by resume ID.

## Deployment

This project deploys via Puter Hosting.

1. Configure Puter deployment settings.
2. Run a production build and test it locally.
3. Deploy and verify all routes and the authentication flow work correctly in production.

## Out of Scope (v1.0)

- Multi-user / team accounts
- Resume comparison across multiple versions
- Email notifications or scheduling
- Payment / premium tier
- Native mobile app

## Known Risks

- **Puter API rate limits** — AI calls may be throttled on the free tier
- **PDF.js compatibility** — complex PDFs may not render correctly
- **Large file uploads** — slower on poor connections
- **AI JSON parsing** — the model may occasionally return malformed JSON

All AI calls are wrapped in error handling with user-visible notifications, and JSON responses are schema-validated before being saved.

## Resources

- [Puter.js Docs](https://docs.puter.com)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router v6](https://reactrouter.com/en/main)

## License

Internal / team project. Not licensed for public distribution.
