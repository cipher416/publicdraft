import { db } from "@publicdraft/db";
import { docs } from "@publicdraft/db/schema/docs";
import { eq } from "drizzle-orm";
import {
  createEncoder,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from "lib0/encoding";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { Doc } from "yjs";
import { MESSAGE_SYNC } from "./constants";
import type { ConnectionInfo } from "./types";

// Document storage
const docsMap = new Map<string, Doc>();
const awarenessMap = new Map<string, Awareness>();

// Connection tracking: docName -> (userId -> ws)
const docConnections = new Map<string, Map<string, any>>();

// Reverse mapping: ws.id -> connection info
const wsToConnection = new Map<string, ConnectionInfo>();

const loadedRooms = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();
const cleanupTimeouts = new Map<string, NodeJS.Timeout>();
const dirtyDocs = new Map<string, boolean>();

export function getOrCreateDoc(docName: string): Doc {
  let doc = docsMap.get(docName);
  if (!doc) {
    doc = new Doc();
    docsMap.set(docName, doc);
    awarenessMap.set(docName, new Awareness(doc));
  }
  return doc;
}

export async function ensureLoaded(docName: string): Promise<void> {
  if (loadedRooms.has(docName)) return;
  const doc = docsMap.get(docName);
  if (!doc) return;
  await loadDoc(docName, doc);
  loadedRooms.add(docName);
}

export function getAwareness(docName: string): Awareness | undefined {
  return awarenessMap.get(docName);
}

export function cleanupDoc(docName: string): void {
  const doc = docsMap.get(docName);
  if (doc) {
    doc.destroy();
    docsMap.delete(docName);
  }
  awarenessMap.delete(docName);
  loadedRooms.delete(docName);
  console.log(`Cleaned up document: ${docName}`);
}

export function getDocConnections(
  docName: string,
): Map<string, any> | undefined {
  return docConnections.get(docName);
}

export function initDocConnections(docName: string): Map<string, any> {
  if (!docConnections.has(docName)) {
    docConnections.set(docName, new Map());
  }
  return docConnections.get(docName)!;
}

export function deleteDocConnections(docName: string): void {
  docConnections.delete(docName);
}

export function getConnectionInfo(wsId: string): ConnectionInfo | undefined {
  return wsToConnection.get(wsId);
}

export function setConnectionInfo(wsId: string, info: ConnectionInfo): void {
  wsToConnection.set(wsId, info);
}

export function deleteConnectionInfo(wsId: string): void {
  wsToConnection.delete(wsId);
}

export function scheduleCleanup(docName: string): void {
  if (cleanupTimeouts.has(docName)) {
    clearTimeout(cleanupTimeouts.get(docName)!);
  }
  const timeout = setTimeout(async () => {
    const doc = docsMap.get(docName);
    if (doc && dirtyDocs.has(docName)) {
      await persistDoc(docName, doc);
    }
    deleteDocConnections(docName);
    cleanupDoc(docName);
    cleanupTimeouts.delete(docName);
    console.log(`Delayed cleanup executed for ${docName}`);
  }, 10000); // 10 seconds delay
  cleanupTimeouts.set(docName, timeout);
}

export function clearCleanupTimeout(docName: string): void {
  const timeout = cleanupTimeouts.get(docName);
  if (timeout) {
    clearTimeout(timeout);
    cleanupTimeouts.delete(docName);
  }
}

export function markDirty(docName: string): void {
  dirtyDocs.set(docName, true);
}

export function clearDirty(docName: string): void {
  dirtyDocs.delete(docName);
}

export function broadcastToConnections(
  docName: string,
  message: Uint8Array,
  excludeUserId?: string,
): void {
  const connections = docConnections.get(docName);
  if (!connections) return;

  for (const [userId, ws] of connections.entries()) {
    if (excludeUserId && userId === excludeUserId) continue;
    try {
      ws.sendBinary(Buffer.from(message));
    } catch (e) {
      console.error(`Failed to send to user ${userId}:`, e);
    }
  }
}

export function kickoffLoad(docName: string): void {
  if (loadedRooms.has(docName) || dirtyDocs.has(docName)) return;

  let promise = loadingPromises.get(docName);
  if (promise) return;

  const doc = docsMap.get(docName);
  if (!doc) return;

  promise = loadDoc(docName, doc)
    .then(() => {
      loadedRooms.add(docName);
      loadingPromises.delete(docName);
      const update = Y.encodeStateAsUpdate(doc);
      const encoder = createEncoder();
      writeVarUint(encoder, MESSAGE_SYNC);
      writeVarUint(encoder, 2); // update pack
      writeVarUint8Array(encoder, update);
      const message = toUint8Array(encoder);
      broadcastToConnections(docName, message);
      console.log(`Loaded and broadcast update for room ${docName}`);
    })
    .catch((e) => {
      console.error(`Load failed for ${docName}:`, e);
      loadingPromises.delete(docName);
    });

  loadingPromises.set(docName, promise);
}

// Persistence functions
async function loadDoc(roomId: string, doc: Doc): Promise<void> {
  const result = await db
    .select()
    .from(docs)
    .where(eq(docs.roomId, roomId))
    .limit(1);
  const row = result[0];
  if (row?.data) {
    const binary = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
    Y.applyUpdate(doc, binary);
    console.log(`Loaded persisted state for room ${roomId}`);
  }
}

export async function persistDoc(roomId: string, doc: Doc): Promise<void> {
  const update = Y.encodeStateAsUpdate(doc);
  const data = btoa(String.fromCharCode(...Array.from(update)));
  const version = update.length;
  await db
    .insert(docs)
    .values({
      roomId,
      data,
      version,
    })
    .onConflictDoUpdate({
      target: [docs.roomId],
      set: {
        data,
        version,
        updatedAt: new Date(),
      },
    });
  clearDirty(roomId);
}

export async function persistAll(): Promise<void> {
  const toPersist = Array.from(docsMap.entries()).filter(([roomId]) =>
    dirtyDocs.has(roomId),
  );
  await Promise.all(
    toPersist.map(([roomId, doc]) =>
      persistDoc(roomId, doc).catch((e) =>
        console.error(`Persist failed for ${roomId}:`, e),
      ),
    ),
  );
}

export function initPersistence(): void {
  setInterval(() => {
    persistAll().catch((e) => console.error("Periodic persist failed:", e));
  }, 5000);
  const shutdown = async (signal: string) => {
    console.log(`${signal}: Persisting all docs...`);
    await persistAll();
    console.log("All docs persisted.");
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
