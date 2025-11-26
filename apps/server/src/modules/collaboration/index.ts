import { auth } from "@publicdraft/auth";
import Elysia from "elysia";
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
import { MESSAGE_AWARENESS, MESSAGE_SYNC } from "./constants";
import { CollaborationHandlers } from "./handlers";
import { CollaborationService } from "./service";
import type { CollaborationSocket } from "./types";

export const collaboration = new Elysia({ name: "collaboration" }).ws(
  "/collaboration/:docName",
  {
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
      const connections = CollaborationService.initDocConnections(docName);

      const existingWs = connections.get(userId);
      if (existingWs && existingWs.id !== ws.id) {
        ws.close(4009, "Duplicate connection");
        return;
      }

      connections.set(userId, ws);

      const doc = CollaborationService.getOrCreateDoc(docName);
      const awareness = CollaborationService.getAwareness(docName);
      if (!awareness) {
        ws.close();
        return;
      }

      CollaborationService.setConnectionInfo(ws.id, {
        docName,
        userId,
        awarenessClientIds: new Set(),
      });

      CollaborationService.kickoffLoad(docName);

      const syncEncoder = createEncoder();
      writeVarUint(syncEncoder, MESSAGE_SYNC);
      writeSyncStep1(syncEncoder, doc);
      ws.sendBinary(Buffer.from(toUint8Array(syncEncoder)));

      const awarenessStates = awareness.getStates();
      if (awarenessStates.size > 0) {
        console.log(
          `Sending initial awareness for ${docName} to user ${userId}:`,
          Array.from(awarenessStates.keys()),
        );
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
      const connection = CollaborationService.getConnectionInfo(ws.id);
      if (!connection) return;

      const { docName, userId } = connection;
      console.log(`Message for ${docName}, userId: ${userId}`);

      const data =
        message instanceof ArrayBuffer
          ? new Uint8Array(message)
          : new Uint8Array(message as Buffer);

      CollaborationHandlers.handleMessage(docName, data, ws as CollaborationSocket, userId);
    },

    close(ws) {
      const connection = CollaborationService.getConnectionInfo(ws.id);
      if (!connection) return;

      const { docName, userId, awarenessClientIds } = connection;
      const connections = CollaborationService.getDocConnections(docName);

      if (connections) {
        const currentWs = connections.get(userId);
        if (currentWs && currentWs.id === ws.id) {
          connections.delete(userId);

          const awareness = CollaborationService.getAwareness(docName);
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
            CollaborationService.scheduleCleanup(docName);
          }
        }
      }

      CollaborationService.deleteConnectionInfo(ws.id);
    },
  },
);
