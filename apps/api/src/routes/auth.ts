import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@meditrack/db";
import {
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
} from "@meditrack/api-zod";
import bcrypt from "bcryptjs";
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

// In-memory session store for demo
const sessions = new Map<string, number>();

export function getUserIdFromToken(token: string): number | null {
  const userId = sessions.get(token);
  return userId ?? null;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

router.post("/auth/register", async (req, res): Promise<void> => {
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
  sessions.set(token, user.id);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
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
  sessions.set(token, user.id);

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
  const userId = sessions.get(auth.slice(7));
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

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // In demo mode: always succeed silently
  res.json({ success: true, message: "If that email exists, a reset link has been sent." });
});

export default router;
