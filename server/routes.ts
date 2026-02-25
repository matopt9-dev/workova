import type { Express } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/version", (_req, res) => {
    try {
      const appJsonPath = path.resolve(process.cwd(), "app.json");
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
      res.json({
        name: appJson.expo?.name || "Workova",
        version: appJson.expo?.version || "1.0.0",
      });
    } catch {
      res.json({ name: "Workova", version: "1.0.0" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
