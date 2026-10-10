import express, { type Express } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachUser } from "./middlewares/auth";

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

app.use(cors({ origin: true, credentials: true }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(attachUser);

app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const clientDir = path.join(import.meta.dirname, "public");
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(
      { err, method: req.method, url: req.url },
      "Unhandled request error",
    );
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      error:
        err instanceof Error && err.message
          ? err.message
          : "Internal server error",
    });
  },
);

export default app;
