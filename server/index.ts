import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import { registerRoutes } from "./routes";

// -------------------- App --------------------
const app = express();

// -------------------- CORS --------------------
app.use(
  cors({
    origin: ["https://fosuwa-papabi-hotel.vercel.app"], // Vercel frontend
    credentials: true,
  })
);

// -------------------- Session --------------------
app.use(
  session({
    name: "fosuwa.sid",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,        // required on HTTPS (Render + Vercel)
      sameSite: "none",    // required for cross-site cookies
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// -------------------- Raw Body --------------------
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// -------------------- Logging --------------------
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// -------------------- Register Routes --------------------
(async () => {
  await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // -------------------- Start Server --------------------
  const port = parseInt(process.env.PORT || "5000", 10);
  const httpServer = createServer(app);

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`API server listening on port ${port}`);
    }
  );
})();
