import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the pre-built frontend from this same process so the
// app is a single deployable unit with no separate router in front of it.
// In development, run `npm run dev` from the repo root instead (Vite's dev
// server proxies /api requests here — see apps/web/vite.config.ts).
if (process.env.NODE_ENV === "production") {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(dirname, "../../web/dist");

  if (fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next();
      res.sendFile(path.join(webDist, "index.html"));
    });
  } else {
    logger.warn(
      { webDist },
      "Frontend build not found — run `npm run build --workspace @meditrack/web` before starting in production.",
    );
  }
}

export default app;
