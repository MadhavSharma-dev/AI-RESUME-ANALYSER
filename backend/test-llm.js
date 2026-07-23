import 'dotenv/config';
import fs from 'fs';
import { parseFile } from './services/parser.js';
import { parseResume } from './services/gemini.js';
import { runEnsemble } from './services/ensemble.js';

async function test() {
  try {
    console.log("Step 1: Extracting raw text from PDF...");
    const filePath = './uploads/1783979009769-PrashantKumarPathak.pdf';
    const extractedText = await parseFile(filePath, 'application/pdf');
    console.log("Extracted raw text length:", extractedText.length);

    console.log("Step 2: Parsing structured sections with Gemini...");
    const parsedSections = await parseResume(extractedText);
    console.log("Parsed Name:", parsedSections.name);

    console.log("Step 3: Running ensemble analysis (Gemini + Groq + Mistral)...");
    const result = await runEnsemble(JSON.stringify(parsedSections), 'Software Engineer');
    console.log("Ensemble Status:");
    console.log("- Models Used:", result.modelsUsed);
    console.log("- Reconciled ATS Score:", result.reconciled.atsScore);
    console.log("- Reconciled Overall Score:", result.reconciled.overallScore);
    console.log("Test completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
