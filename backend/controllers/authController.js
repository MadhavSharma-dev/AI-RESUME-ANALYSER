import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import logger from "../utils/logger.js";

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

    logger.info({ userId: user._id }, "User signed up");

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

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await setRefreshCookie(res, user, refreshToken);

    logger.info({ userId: user._id }, "User logged in");

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
