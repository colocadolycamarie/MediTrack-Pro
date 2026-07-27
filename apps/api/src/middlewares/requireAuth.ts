import type { NextFunction, Request, Response } from "express";
import { getUserIdFromToken } from "../routes/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Requires a valid `Authorization: Bearer <token>` header issued by
 * /auth/login or /auth/register. Attaches the resolved user id to
 * `req.userId` for downstream ownership checks.
 *
 * This does not exist elsewhere in the app: previously every route under
 * /patients, /medications, /devices, /adherence and the private half of
 * /dashboard was reachable by anyone with the base URL, regardless of
 * whether they had ever logged in.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Sign in and try again." });
    return;
  }

  const userId = getUserIdFromToken(auth.slice(7));
  if (!userId) {
    res.status(401).json({ error: "Your session has expired. Sign in again." });
    return;
  }

  req.userId = userId;
  next();
}
