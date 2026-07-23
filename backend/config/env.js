import dotenv from "dotenv";

dotenv.config(); // Automatically finds .env in the root

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
}

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = Number(process.env.PORT) || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const COOKIE_NAME = process.env.COOKIE_NAME || "arr_token";
export const CLIENT_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173, http://localhost:5174")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
export const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-medium-latest";
export const IS_PROD = process.env.NODE_ENV === "production";