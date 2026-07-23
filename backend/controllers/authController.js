import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import appleSigninAuth from "apple-signin-auth";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Token Generators ─────────────────────────────────────────────

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

/**
 * Hash a refresh token for safe DB storage — even if DB is leaked,
 * the raw tokens cannot be recovered.
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Set refresh token as httpOnly secure cookie and store hash in DB.
 */
const setRefreshCookie = async (res, user, refreshToken) => {
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/"
  });
};

// ─── Signup ────────────────────────────────────────────────────────

export const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, refreshToken);

    // logger.info({ userId: user._id }, "User signed up");

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken
    });
  } catch (error) {
    logger.error({ err: error.message }, "Signup failed");
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// ─── Login ─────────────────────────────────────────────────────────

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Explicitly select password for comparison
    const user = await User.findOne({ email }).select("+password +refreshTokenHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.authProvider !== 'local') {
      return res.status(401).json({ message: `Please log in using your ${user.authProvider} account` });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, refreshToken);

    // logger.info({ userId: user._id }, "User logged in");

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken
    });
  } catch (error) {
    logger.error({ err: error.message }, "Login failed");
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────

export const refreshAccessToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select("+refreshTokenHash");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Verify the token hash matches what's stored
    const tokenHash = hashToken(token);
    if (user.refreshTokenHash !== tokenHash) {
      // Potential token theft — clear all refresh tokens for this user
      logger.warn({ userId: user._id }, "Refresh token hash mismatch — possible token theft");
      user.refreshTokenHash = null;
      await user.save({ validateBeforeSave: false });
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Token invalid. Please log in again." });
    }

    // Rotate: issue new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, newRefreshToken);

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.warn({ err: error.message }, "Refresh token verification failed");
    res.clearCookie("refreshToken");
    return res.status(401).json({ message: "Token expired. Please log in again." });
  }
};

// ─── Logout ────────────────────────────────────────────────────────

export const logoutUser = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId).select("+refreshTokenHash");
      if (user) {
        user.refreshTokenHash = null;
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Token invalid/expired — just clear the cookie anyway
    }
  }

  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out successfully" });
};

// ─── Get Profile ───────────────────────────────────────────────────

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ─── OAuth Logins ──────────────────────────────────────────────────

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google'
      });
    } else if (!user.googleId) {
      // Link account
      user.googleId = googleId;
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      await user.save({ validateBeforeSave: false });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, refreshToken);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken
    });
  } catch (error) {
    logger.error({ err: error.message }, "Google Login failed");
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

export const appleLogin = async (req, res) => {
  const { identityToken, user: appleUserStr } = req.body;

  try {
    const appleIdTokenClaims = await appleSigninAuth.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID, // Your Apple App ID
      ignoreExpiration: true,
    });

    const { sub: appleId, email: appleEmail } = appleIdTokenClaims;
    let email = appleEmail;
    let name = "Apple User";

    // Apple only sends the user object on the FIRST login
    if (appleUserStr) {
      try {
        const appleUser = typeof appleUserStr === 'string' ? JSON.parse(appleUserStr) : appleUserStr;
        if (appleUser.name) {
          name = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim() || name;
        }
        if (appleUser.email) {
          email = appleUser.email;
        }
      } catch (e) {
        logger.warn("Failed to parse Apple user object");
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required but not provided by Apple" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        appleId,
        authProvider: 'apple'
      });
    } else if (!user.appleId) {
      user.appleId = appleId;
      if (user.authProvider === 'local') {
        user.authProvider = 'apple';
      }
      await user.save({ validateBeforeSave: false });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, refreshToken);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken
    });
  } catch (error) {
    logger.error({ err: error.message }, "Apple Login failed");
    return res.status(401).json({ message: "Apple authentication failed" });
  }
};
