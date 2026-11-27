import type { NextFunction, Request, Response } from "express";

const isProduction = process.env["NODE_ENV"] === "production";

/** Conservative response headers. None of these change what the app renders. */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  next();
}

/**
 * Health data must never be stored by browsers, proxies or CDNs, and API
 * responses should never be indexed by search engines.
 */
export function apiNoStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
}

type Bucket = { count: number; resetAt: number };

/**
 * Small in-memory fixed-window rate limiter (per IP). Good enough to slow down
 * password guessing and emergency-token scraping on a single server; if you
 * later run several instances, move this to Redis.
 */
export function rateLimit(opts: { windowMs: number; max: number; name: string; message?: string }) {
  const buckets = new Map<string, Bucket>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }, Math.max(opts.windowMs, 60_000));
  sweep.unref();

  return function limiter(req: Request, res: Response, next: NextFunction): void {
    const key = `${opts.name}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    if (bucket.count > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      res.status(429).json({ error: opts.message ?? "Too many attempts. Please wait a few minutes and try again." });
      return;
    }
    next();
  };
}
