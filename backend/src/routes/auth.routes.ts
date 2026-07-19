import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || "default_access_secret";
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

// Helper to generate tokens
function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, getAccessSecret(), { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ userId, email }, getRefreshSecret(), { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

// 1. POST /register
router.post("/register", async (req, res): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 2. POST /login
router.post("/login", async (req, res): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 3. POST /refresh
router.post("/refresh", async (req, res): Promise<any> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret()) as { userId: string; email: string };
    
    // Check if user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email);

    return res.json(tokens);
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// 4. GET /me (Protected)
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("[GetMe Error]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
