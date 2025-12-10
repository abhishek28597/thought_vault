import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Backend configuration - uses env var for Docker, falls back to spawning locally
const BACKEND_URL = process.env.BACKEND_URL || "";
const BACKEND_PORT = 8000;
let backendProcess: ReturnType<typeof spawn> | null = null;

function startBackend() {
  console.log("Starting Python FastAPI backend...");
  backendProcess = spawn("python", ["run.py"], {
    cwd: "./backend",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT) }
  });

  backendProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on("data", (data: Buffer) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.on("close", (code: number | null) => {
    console.log(`Backend process exited with code ${code}`);
    // Restart after 2 seconds if it crashed
    setTimeout(() => {
      if (backendProcess) {
        startBackend();
      }
    }, 2000);
  });
}

// Only spawn backend locally if BACKEND_URL is not set (not in Docker)
if (!BACKEND_URL) {
  startBackend();
  
  // Wait for backend to be ready
  setTimeout(() => {
    console.log("Backend should be ready now");
  }, 3000);
}

// Proxy /api requests to Python backend
const backendTarget = BACKEND_URL || `http://127.0.0.1:${BACKEND_PORT}`;
console.log(`Proxying /api requests to: ${backendTarget}`);

app.use("/api", createProxyMiddleware({
  target: `${backendTarget}/api`,
  changeOrigin: true,
}));

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

// Cleanup on exit
process.on("SIGINT", () => {
  if (backendProcess && !BACKEND_URL) {
    backendProcess.kill();
  }
  process.exit();
});

process.on("SIGTERM", () => {
  if (backendProcess && !BACKEND_URL) {
    backendProcess.kill();
  }
  process.exit();
});
