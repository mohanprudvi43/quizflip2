import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";

const REFRESH_COOKIE_NAME = "qf_refresh_token";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000
});

export const registerLearner = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = await User.create({ name, email, password, role: "learner" });
    const token = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, user.role);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const configuredAdminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "").toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "admin" && configuredAdminEmail && user.email.toLowerCase() !== configuredAdminEmail) {
      return res.status(403).json({ message: "Admin access is restricted" });
    }

    const token = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id, user.role);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const token = signAccessToken(user._id, user.role);
    const nextRefreshToken = signRefreshToken(user._id, user.role);
    res.cookie(REFRESH_COOKIE_NAME, nextRefreshToken, refreshCookieOptions());

    return res.json({ token });
  } catch (_error) {
    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
};

export const logout = async (_req, res, next) => {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    return res.json({ message: "Logged out" });
  } catch (error) {
    return next(error);
  }
};
