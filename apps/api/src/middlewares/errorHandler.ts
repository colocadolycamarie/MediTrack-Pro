import type { NextFunction, Request, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Catches anything that reaches Express without a response already sent:
 * unmatched /api/* routes, and unhandled errors thrown or rejected inside
 * route handlers (Express 5 forwards async rejections here automatically).
 *
 * Without this, both cases fell through to Express's default handler, which
 * renders an HTML page — breaking every frontend caller expecting JSON, and
 * in the error case leaking a stack trace to the client outside dev mode.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `No route matches ${req.method} ${req.path}.` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  req.log?.error({ err }, "Unhandled error");

  res.status(500).json({
    error: "Something went wrong on our end. Please try again.",
    ...(isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
