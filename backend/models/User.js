import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User Schema — Stores candidate identity, hashed authentication credentials,
 * avatar storage URL, OAuth provider bindings, and hashed refresh tokens.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    password: {
      type: String,
      required: function() { return this.authProvider === 'local'; },
      minlength: 8,
      select: false  // Excluded from query results by default for defense-in-depth
    },
    avatarUrl: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local'
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    appleId: {
      type: String,
      sparse: true,
      unique: true
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false  // SHA-256 hashed refresh token; excluded from queries by default
    }
  },
  { timestamps: true }
);

/**
 * Compares plaintext candidate password with stored bcrypt hash.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Pre-save hook: Automatically hashes modified passwords using bcrypt (cost factor 12).
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
