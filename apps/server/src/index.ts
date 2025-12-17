import { cors } from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { auth } from "@publicdraft/auth";
import "dotenv/config";
import { Elysia } from "elysia";
import { collaboration } from "./modules/collaboration";
import { CollaborationService } from "./modules/collaboration/service";
import { docs } from "./modules/docs";

if (!process.env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN environment variable is required");
}

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "User-Agent"],
      credentials: true,
    }),
  )
  .use(
    opentelemetry({
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: "https://api.axiom.co/v1/traces",
            headers: {
              Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
              "X-Axiom-Dataset": process.env.AXIOM_DATASET!,
            },
          }),
        ),
      ],
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

  .listen(port, () => {
    CollaborationService.initPersistence();
    console.log(`Server is running on http://localhost:${port}`);
  });

export type App = typeof app;
