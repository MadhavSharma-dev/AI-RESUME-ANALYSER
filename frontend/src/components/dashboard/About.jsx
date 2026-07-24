import React, { useState } from "react";
import { Link } from "react-router-dom";
import HeaderUtils from "../common/HeaderUtils";
import prashantImg from "../../assets/makers/prashant.jpeg";
import madhavImg from "../../assets/makers/madhav.jpeg";
import "./About.css";

export default function About() {
  const [flippedPrashant, setFlippedPrashant] = useState(false);
  const [flippedMadhav, setFlippedMadhav] = useState(false);

  return (
    <div className="about-page-container">
      {/* Header */}
      <header className="about-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1.5rem" }}>
          <Link to="/dashboard" className="about-back-link">← Back to Dashboard</Link>
          <HeaderUtils />
        </div>
        <div className="about-badge">
          <span>Resume Roaster Intelligence</span>
        </div>
        <h1 className="about-title">Why Resume Roaster Exists</h1>
        <p className="about-subtitle">
          Because automated HR filters shouldn't be the reason your dream offer gets lost in the void.
        </p>
      </header>

      {/* Grid of Sections */}
      <div className="about-grid">
        {/* Mission Card */}
        <div className="about-card hero-card">
          <h2>What is Resume Roaster?</h2>
          <p>
            Most online resume analyzers will gladly give you an ATS score — then immediately hide the actionable feedback behind a paywall. We built Resume Roaster because freshers and undergrad candidates deserve real, specific advice on how to fix their resumes without running into a credit card prompt.
          </p>
          <p>
            Built by BU Fullstack students who got tired of paywalled feedback, Resume Roaster combines multi-model AI consensus with precise keyword targeting to ensure your resume survives both automated bots and human recruiters.
          </p>
        </div>

        {/* Multi-LLM Ensemble Card */}
        <div className="about-card">
          <h2>Multi-LLM Ensemble Intelligence</h2>
          <p>
            Instead of relying on a single AI model's bias, Resume Roaster queries three state-of-the-art LLMs in parallel:
          </p>
          <ul className="about-feature-list">
            <li><strong>Google Gemini</strong> — Structure extraction & semantic breakdown</li>
            <li><strong>Groq (Llama 3.1)</strong> — High-speed keyword matching & impact scoring</li>
            <li><strong>Mistral</strong> — Deep context analysis & HR red flag detection</li>
          </ul>
          <p className="about-note">
            Our consensus engine averages scores and deduplicates recommendations, giving you the most accurate review available anywhere.
          </p>
        </div>

        {/* Feature Breakdown Card */}
        <div className="about-card">
          <h2>Core Capabilities</h2>
          <div className="about-caps-grid">
            <div className="cap-item">
              <h4>ATS Readiness Gauge</h4>
              <p>Predicts how cleanly applicant tracking systems like Greenhouse and Lever parse your PDF.</p>
            </div>
            <div className="cap-item">
              <h4>7-Metric Extended Breakdown</h4>
              <p>Scores Content, Sections, ATS Essentials, HR Red Flags, Discrimination, Seniority, and Role Tailoring.</p>
            </div>
            <div className="cap-item">
              <h4>Target Role Tailoring</h4>
              <p>Analyzes your resume against any target role (e.g. "Senior AI Engineer") to highlight missing keywords.</p>
            </div>
            <div className="cap-item">
              <h4>Actionable AI Rewrites</h4>
              <p>Transforms generic action verbs into quantified, result-driven bullet points.</p>
            </div>
          </div>
        </div>

        {/* AI Readability Trust Card */}
        <div className="about-card">
          <h2>Why You Can Trust AI Resume Readability</h2>
          <p style={{ marginBottom: "1.25rem" }}>
            You can trust Resume Roaster's AI Readability because of 4 technical guarantees built directly into our analysis pipeline:
          </p>
          <div className="about-caps-grid">
            <div className="cap-item">
              <h4>1. Complete Parser Transparency</h4>
              <p>Before any AI or ATS evaluation happens, our backend uses spatial stream sorting (extracting text top-to-bottom and left-to-right). Open the <strong>"Parsed Sections"</strong> tab on any resume to verify the exact raw text stream corporate ATS bots like Greenhouse or Lever see.</p>
            </div>
            <div className="cap-item">
              <h4>2. Multi-LLM Ensemble Consensus</h4>
              <p>Single AI models can hallucinate or give inconsistent scores. We run 3 LLMs in parallel: <strong>Gemini</strong> (structure), <strong>Groq</strong> (keyword matching), and <strong>Mistral</strong> (red flags), combining their outputs via weighted consensus to eliminate single-model bias.</p>
            </div>
            <div className="cap-item">
              <h4>3. Deterministic & Reproducible Scoring</h4>
              <p>For any given resume PDF and target role, the quantitative breakdown remains stable and reproducible so you get reliable benchmark tracking across resume revisions (V1 → V2 → V3).</p>
            </div>
            <div className="cap-item">
              <h4>4. Actionable "Tough Love" Feedback</h4>
              <p>Instead of just giving a generic score, the system highlights exact lines lacking metrics, flags weak action verbs, and suggests concrete rewrites with metric placeholders (e.g. <em>"Increased retention by X% by shipping Y feature"</em>).</p>
            </div>
          </div>
        </div>

        {/* Meet the Makers Card (3D Flip Animation) */}
        <div className="about-card makers-card" style={{ gridColumn: "1 / -1" }}>
          <div className="makers-header">
            <h2>Meet the Makers</h2>
            <span className="makers-badge">Fullstack Developers</span>
          </div>
          <p className="makers-sub">
            The engineers and developers behind Resume Roaster. Click any card to connect!
          </p>

          <div className="makers-grid">
            {/* Prashant Kumar Card */}
            <div 
              className={`flip-card-container ${flippedPrashant ? "flipped" : ""}`}
              onClick={() => setFlippedPrashant(!flippedPrashant)}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <img src={prashantImg} alt="Prashant Kumar" className="maker-avatar" />
                  <div className="maker-info">
                    <h3>Prashant Kumar</h3>
                    <span className="maker-role">Fullstack Developer</span>
                    <p className="maker-bio">
                      Full Stack Developer specializing in MERN/PERN stacks, RESTful APIs, and JWT authentication. Brings prior experience building an AI-powered resume analysis platform straight into architecting Resume Roaster's fullstack and AI-integration backbone.
                    </p>
                    <div className="maker-tech-chips">
                      <span>JavaScript</span>
                      <span>TypeScript</span>
                      <span>React</span>
                      <span>Node.js</span>
                      <span>NPM</span>
                      <span>Nodemon</span>
                      <span>Express</span>
                      <span>MongoDB</span>
                      <span>JWT</span>
                      <span>REST APIs</span>
                      <span>Git</span>
                      <span>GitHub</span>
                      <span>C++</span>
                      <span>Algorithms</span>
                      <span>Data Structures</span>
                    </div>
                    <div className="flip-hint">Click card to connect ↺</div>
                  </div>
                </div>

                <div className="flip-card-back">
                  <h3>Connect with Prashant</h3>
                  <p className="flip-back-sub">Fullstack Developer</p>
                  <div className="maker-contact-actions" onClick={(e) => e.stopPropagation()}>
                    <a href="https://www.linkedin.com/in/prashant-kumar-pathak-701863313/" target="_blank" rel="noopener noreferrer" className="btn-contact-action linkedin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                      LinkedIn Profile ↗
                    </a>
                    <a href="mailto:prashant.kr6555@gmail.com" className="btn-contact-action email">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Send Email ↗
                    </a>
                    <a href="https://github.com/prashantkr5?tab=repositories" target="_blank" rel="noopener noreferrer" className="btn-contact-action github">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      GitHub Profile ↗
                    </a>
                  </div>
                  <button className="btn-flip-back" onClick={(e) => { e.stopPropagation(); setFlippedPrashant(false); }}>
                    ← Flip Back
                  </button>
                </div>
              </div>
            </div>

            {/* Madhav Sharma Card */}
            <div 
              className={`flip-card-container ${flippedMadhav ? "flipped" : ""}`}
              onClick={() => setFlippedMadhav(!flippedMadhav)}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <img src={madhavImg} alt="Madhav Sharma" className="maker-avatar" />
                  <div className="maker-info">
                    <h3>Madhav Sharma</h3>
                    <span className="maker-role">Fullstack Developer</span>
                    <p className="maker-bio">
                      Currently working on Web Development & AI Projects. Pursuing Bachelor of Technology (B.Tech) in Computer Science. Open to opportunities as a Frontend developer or backend developer.
                    </p>
                    <div className="maker-tech-chips">
                      <span>C++</span>
                      <span>HTML5</span>
                      <span>JavaScript</span>
                      <span>TypeScript</span>
                      <span>NPM</span>
                      <span>Node.js</span>
                      <span>Nodemon</span>
                      <span>React</span>
                      <span>React Router</span>
                      <span>Git</span>
                      <span>GitHub</span>
                      <span>Express.js</span>
                      <span>MongoDB</span>
                      <span>TailwindCSS</span>
                      <span>JWT</span>
                    </div>
                    <div className="flip-hint">Click card to connect ↺</div>
                  </div>
                </div>

                <div className="flip-card-back">
                  <h3>Connect with Madhav</h3>
                  <p className="flip-back-sub">Fullstack Developer</p>
                  <div className="maker-contact-actions" onClick={(e) => e.stopPropagation()}>
                    <a href="https://www.linkedin.com/in/madhav-sharma-88756a322?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="btn-contact-action linkedin">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                      LinkedIn Profile ↗
                    </a>
                    <a href="mailto:ms2971835@gmail.com" className="btn-contact-action email">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Send Email ↗
                    </a>
                    <a href="https://github.com/MadhavSharma-dev" target="_blank" rel="noopener noreferrer" className="btn-contact-action github">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                      GitHub Profile ↗
                    </a>
                  </div>
                  <button className="btn-flip-back" onClick={(e) => { e.stopPropagation(); setFlippedMadhav(false); }}>
                    ← Flip Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="about-footer">
        <p>Built with precision for ambitious candidates from BU grads. © 2026 Resume Roaster</p>
      </footer>
    </div>
  );
}
