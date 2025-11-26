import { cors } from "@elysiajs/cors";
import { auth } from "@publicdraft/auth";
import "dotenv/config";
import { Elysia } from "elysia";
import { collaboration } from "./modules/collaboration";
import { CollaborationService } from "./modules/collaboration/service";
import { docs } from "./modules/docs";

if (!process.env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN environment variable is required");
}

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "User-Agent"],
      credentials: true,
    }),
  )
  .use(collaboration)
  .use(docs)
  .all("/api/auth/*", async ({ request, status }) => {
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .get("/ping", () => "/pong")

  .listen(3000, () => {
    CollaborationService.initPersistence();
    console.log("Server is running on http://localhost:3000");
  });

export type App = typeof app;
