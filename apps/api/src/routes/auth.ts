import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@dosemate/db";
import {
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
} from "@dosemate/api-zod";
import bcrypt from "bcryptjs";
import { rateLimit } from "../middlewares/security";
import { randomBytes } from "crypto";

const router: IRouter = Router();

// bcrypt: a random salt per password + a deliberately slow work factor.
// This replaced a static-salt HMAC ("no external deps needed for demo") that
// hashed every user's password with the same salt and no key stretching —
// fine for a prototype, not for anything handling real credentials.
const BCRYPT_COST = 12;

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:${randomBytes(16).toString("hex")}`).toString("base64");
}

// In-memory session store. Sessions now expire (default 7 days, override with
// SESSION_TTL_HOURS) instead of living until the server restarts.
const SESSION_TTL_MS = (Number(process.env["SESSION_TTL_HOURS"]) || 24 * 7) * 60 * 60 * 1000;
const sessions = new Map<string, { userId: number; expiresAt: number }>();

function createSession(token: string, userId: number): void {
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
}

export function getUserIdFromToken(token: string): number | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

/** Ends every active session for a user (used when an account is deleted). */
export function destroyAllSessionsForUser(userId: number): void {
  for (const [token, s] of sessions) if (s.userId === userId) sessions.delete(token);
}

// Slow down password guessing / account spam / reset-email abuse (per IP).
const authLimiter = rateLimit({ name: "auth", windowMs: 15 * 60 * 1000, max: 20 });
const registerLimiter = rateLimit({ name: "register", windowMs: 60 * 60 * 1000, max: 15 });

router.post("/auth/register", registerLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "An account with this email already exists." });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
  }).returning();

  const token = generateToken(user.id);
  createSession(token, user.id);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = generateToken(user.id);
  createSession(token, user.id);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    destroySession(auth.slice(7));
  }
  res.json({ success: true, message: "Logged out." });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  const userId = getUserIdFromToken(auth.slice(7));
  if (!userId) {
    res.status(401).json({ error: "Session expired." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found." });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
});

router.post("/auth/forgot-password", authLimiter, async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // In demo mode: always succeed silently
  res.json({ success: true, message: "If that email exists, a reset link has been sent." });
});

export default router;
