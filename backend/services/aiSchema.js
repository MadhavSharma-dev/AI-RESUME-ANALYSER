import { z } from "zod";

/**
 * Zod schema for the initial Parsing Step (Raw Text -> Structured Data)
 */
export const parsedSectionsSchema = z.object({
  name: z.string(),
  title: z.string(),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional()
  }),
  summary: z.string(),
  experience: z.array(z.object({
    role: z.string(),
    company: z.string(),
    dates: z.string(),
    description: z.string()
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    dates: z.string().optional()
  })),
  skills: z.array(z.string()),
  projects: z.array(z.object({
    name: z.string(),
    technologies: z.string(),
    description: z.string()
  })),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  interests: z.array(z.string())
});

/**
 * Zod schema for validating AI model Analysis responses.
 */
export const aiResponseSchema = z.object({
  overall_score: z.number().min(0).max(100),
  ats_compatibility: z.number().min(0).max(100),
  breakdown: z.object({
    keywords: z.number().min(0).max(100),
    format: z.number().min(0).max(100),
    impact: z.number().min(0).max(100),
    readability: z.number().min(0).max(100)
  }),
  extendedBreakdown: z.object({
    content: z.number().min(0).max(100),
    sections: z.number().min(0).max(100),
    atsEssentials: z.number().min(0).max(100),
    hrRedFlags: z.number().min(0).max(100),
    discrimination: z.number().min(0).max(100),
    seniority: z.number().min(0).max(100),
    tailoring: z.number().min(0).max(100)
  }),
  issues: z.array(
    z.object({
      severity: z.enum(["high", "medium", "low"]),
      title: z.string(),
      description: z.string(),
      fix: z.string()
    })
  ).max(15),
  strengths: z.array(z.string()).min(1).max(10),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string())
  }),
  verdict: z.string(),
  before_after_rewrites: z.array(
    z.object({
      before: z.string(),
      after: z.string()
    })
  ).max(10)
});

/**
 * Prompt for extracting structured sections from raw resume text
 */
export function buildParsingPrompt(resumeText) {
  return `You are a universal, multi-column resume data parser. Extract structured sections from the provided raw resume text regardless of layout (single-column, two-column, sidebar layout) or section ordering.

MULTI-COLUMN LAYOUT DISCOVERY RULES:
- The resume text may originate from a 2-column or sidebar layout (e.g. Left Column: Summary, Skills, Awards; Right Column: Education, Certificates, Projects).
- Read the text holistically top-to-bottom and left-to-right to reconstruct complete sections without mixing up left-column content and right-column content.
- Identify all section headings even if they appear in different visual columns (e.g., "Summary", "Skills", "Awards", "Education", "Certificates", "Projects").

MANDATORY SYNONYM & SECTION MAPPING RULES:
- Map "Work Experience", "Employment History", "Professional Experience", "Career History" -> "experience"
- Map "Projects", "Key Ventures", "Selected Work", "Technical Projects" -> "projects"
- Map "Skills", "Technical Skills", "Skills & Tools", "Tech Stack", "Core Competencies" -> "skills"
- Map "Education", "Academic Background", "Qualifications", "Degrees" -> "education"
- Map "Certifications", "Certificates", "Licenses & Certifications", "Courses" -> "certifications"
- Map "Awards", "Honors", "Achievements", "Recognition" -> "awards"

CONTACT & URL EXTRACTION:
- Extract full valid URL strings for "linkedin", "github", "portfolio", "leetcode" (e.g. "https://linkedin.com/in/username", "https://github.com/username"). Do NOT return plain text labels like "LinkedIn".

MISSING SECTIONS & ZERO-HALLUCINATION RULE:
- If a section (e.g. projects, certifications, awards) is missing from the resume, return an empty array [] or empty string "".
- NEVER invent, hallucinate, or make up fake companies, degrees, or links.

Return a JSON object matching this EXACT schema:
{
  "name": "Candidate Full Name",
  "title": "Current Job Title / Professional Headline",
  "contact": {
    "email": "email or empty string",
    "phone": "phone or empty string",
    "location": "city/state/country or empty string",
    "linkedin": "full LinkedIn URL or empty string",
    "github": "full GitHub URL or empty string",
    "portfolio": "full Portfolio/Website URL or empty string",
    "leetcode": "full Leetcode URL or empty string"
  },
  "summary": "Professional summary or objective",
  "experience": [
    { "role": "Role Title", "company": "Company Name", "dates": "Date Range", "description": "Bullet points & responsibilities" }
  ],
  "education": [
    { "degree": "Degree / Major", "institution": "University / School Name", "dates": "Graduation Date" }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "projects": [
    { "name": "Project Name", "technologies": "Technologies used", "description": "Project details" }
  ],
  "certifications": ["Certification 1"],
  "languages": ["Language 1"],
  "interests": ["Interest 1"],
  "awards": ["Award 1"]
}

<RESUME_DATA>
${resumeText}
</RESUME_DATA>

IMPORTANT: Return ONLY raw JSON. No markdown backticks, no comments, no wrapper text.`;
}

/**
 * Prompt for the Ensemble Analysis (Score, issues, keywords, etc.)
 */
export function buildAnalysisPrompt(parsedSectionsJsonString, targetRole) {
  return `You are the "Resume Roaster" AI: a witty, sarcastic, yet deeply constructive resume critic.

Your task: Analyze and roast the provided parsed resume sections against the target job role: "${targetRole}".

TONE INSTRUCTIONS:
- The "verdict" and issue "description" fields must be written in a witty, sarcastic, "roasting" tone — like a brutally honest tech lead or recruiter friend giving tough love.
- Keep it playful and sharp, never mean-spirited or discouraging.
- CRITICAL: The "fix" field and the "after" rewrite fields MUST be 100% actionable, professional, and genuinely helpful so the candidate can fix their resume immediately.

Return a structured JSON response matching this EXACT schema:
{
  "overall_score": <number 0-100>,
  "ats_compatibility": <number 0-100>,
  "breakdown": {
    "keywords": <number 0-100>,
    "format": <number 0-100>,
    "impact": <number 0-100>,
    "readability": <number 0-100>
  },
  "extendedBreakdown": {
    "content": <number 0-100>,
    "sections": <number 0-100>,
    "atsEssentials": <number 0-100>,
    "hrRedFlags": <number 0-100 (100 is best/no red flags)>,
    "discrimination": <number 0-100 (100 is best/no discrimination)>,
    "seniority": <number 0-100>,
    "tailoring": <number 0-100 (tailoring to ${targetRole})>
  },
  "issues": [
    {
      "severity": "high|medium|low",
      "title": "<short punchy issue title>",
      "description": "<witty, roast-style description of why this is a flaw>",
      "fix": "<actionable, serious fix suggestion>"
    }
  ],
  "strengths": ["<string>"],
  "keywords": {
    "matched": ["<string>"],
    "missing": ["<string>"]
  },
  "verdict": "<A cohesive, witty, roast-style paragraph summarizing the AI's tough-love assessment of the resume>",
  "before_after_rewrites": [
    { "before": "<weak bullet point from resume>", "after": "<improved quantified professional version>" }
  ]
}

<PARSED_RESUME_SECTIONS>
${parsedSectionsJsonString}
</PARSED_RESUME_SECTIONS>

IMPORTANT: Return ONLY raw JSON. No markdown backticks, no comments, no wrapper text.`;
}
