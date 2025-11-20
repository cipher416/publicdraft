import { cors } from "@elysiajs/cors";
import { auth } from "@publicdraft/auth";
import "dotenv/config";
import { Elysia } from "elysia";
import {
  createEncoder,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from "lib0/encoding";
import {
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import { writeSyncStep1 } from "y-protocols/sync";
import { MESSAGE_AWARENESS, MESSAGE_SYNC } from "./collaboration/constants";
import { handleMessage } from "./collaboration/handlers";
import {
  clearCleanupTimeout,
  deleteConnectionInfo,
  getAwareness,
  getConnectionInfo,
  getDocConnections,
  getOrCreateDoc,
  initDocConnections,
  initPersistence,
  kickoffLoad,
  scheduleCleanup,
  setConnectionInfo,
} from "./collaboration/state";

if (!process.env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN environment variable is required");
}

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .all("/api/auth/*", async ({ request, status }) => {
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .get("/ping", () => "/pong")
  .ws("/collaboration/:docName", {
    async open(ws) {
      const docName = ws.data.params.docName;
      if (!docName) {
        ws.close();
        return;
      }

      const session = await auth.api.getSession({
        headers: new Headers(ws.data.headers as Record<string, string>),
      });

      if (!session) {
        ws.close(4001, "Unauthorized");
        return;
      }

      const userId = session.user.id;
      const connections = initDocConnections(docName);
      clearCleanupTimeout(docName);

      const existingWs = connections.get(userId);
      if (existingWs && existingWs.id !== ws.id) {
        console.log(`Closing old connection for user ${userId}`);
        existingWs.close();
      }

      connections.set(userId, ws);

      const doc = getOrCreateDoc(docName);
      kickoffLoad(docName);
      const awareness = getAwareness(docName);
      if (!awareness) {
        ws.close();
        return;
      }

      setConnectionInfo(ws.id, {
        docName,
        userId,
        awarenessClientIds: new Set(),
      });

      const syncEncoder = createEncoder();
      writeVarUint(syncEncoder, MESSAGE_SYNC);
      writeSyncStep1(syncEncoder, doc);
      ws.sendBinary(Buffer.from(toUint8Array(syncEncoder)));

      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        const awarenessEncoder = createEncoder();
        writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
        writeVarUint8Array(
          awarenessEncoder,
          encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())),
        );
        ws.sendBinary(Buffer.from(toUint8Array(awarenessEncoder)));
      }

      console.log(
        `User ${userId} connected to document: ${docName}, ws.id: ${ws.id}`,
      );
    },

    message(ws, message) {
      const connection = getConnectionInfo(ws.id);
      if (!connection) return;

      const { docName, userId } = connection;
      console.log(`Message for ${docName}, userId: ${userId}`);

      const data =
        message instanceof ArrayBuffer
          ? new Uint8Array(message)
          : new Uint8Array(message as Buffer);

      handleMessage(docName, data, ws, userId);
    },

    close(ws) {
      const connection = getConnectionInfo(ws.id);
      if (!connection) return;

      const { docName, userId, awarenessClientIds } = connection;
      const connections = getDocConnections(docName);

      if (connections) {
        // Only remove if this ws is still the active one for this user
        const currentWs = connections.get(userId);
        if (currentWs && currentWs.id === ws.id) {
          connections.delete(userId);

          // Clean up awareness states for all client IDs from this connection
          const awareness = getAwareness(docName);
          if (awareness && awarenessClientIds.size > 0) {
            removeAwarenessStates(
              awareness,
              Array.from(awarenessClientIds),
              "connection closed",
            );
          }

          console.log(
            `User ${userId} disconnected from ${docName}, remaining: ${connections.size}`,
          );

          if (connections.size === 0) {
            scheduleCleanup(docName);
          }
        }
      }

      deleteConnectionInfo(ws.id);
    },
  })
  .listen(3000, () => {
    initPersistence();
    console.log("Server is running on http://localhost:3000");
  });

export type App = typeof app;
