import { db, eq } from "@publicdraft/db";
import { docs } from "@publicdraft/db/schema/docs";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { Doc } from "yjs";
import type { CollaborationSocket, ConnectionInfo } from "./types";

// Document storage
const docsMap = new Map<string, Doc>();
const awarenessMap = new Map<string, Awareness>();

// Connection tracking: docName -> (userId -> ws)
const docConnections = new Map<string, Map<string, CollaborationSocket>>();

// Reverse mapping: ws.id -> connection info
const wsToConnection = new Map<string, ConnectionInfo>();

const loadedRooms = new Set<string>();
const loadingPromises = new Map<string, Promise<void>>();
const cleanupTimeouts = new Map<string, NodeJS.Timeout>();
const dirtyDocs = new Map<string, boolean>();

export abstract class CollaborationService {
  static getOrCreateDoc(docName: string): Doc {
    let doc = docsMap.get(docName);
    if (!doc) {
      doc = new Doc();
      docsMap.set(docName, doc);
      awarenessMap.set(docName, new Awareness(doc));
    }
    return doc;
  }

  static async ensureLoaded(docName: string): Promise<void> {
    if (loadedRooms.has(docName)) return;
    const doc = docsMap.get(docName);
    if (!doc) return;
    await CollaborationService.loadDoc(docName, doc);
    loadedRooms.add(docName);
  }

  static getAwareness(docName: string): Awareness | undefined {
    return awarenessMap.get(docName);
  }

  static getDocConnections(
    docName: string,
  ): Map<string, CollaborationSocket> | undefined {
    return docConnections.get(docName);
  }

  static initDocConnections(docName: string): Map<string, CollaborationSocket> {
    let connections = docConnections.get(docName);
    if (!connections) {
      connections = new Map();
      docConnections.set(docName, connections);
    }
    return connections;
  }

  static getConnectionInfo(wsId: string): ConnectionInfo | undefined {
    return wsToConnection.get(wsId);
  }

  static setConnectionInfo(wsId: string, info: ConnectionInfo): void {
    wsToConnection.set(wsId, info);
  }

  static deleteConnectionInfo(wsId: string): void {
    wsToConnection.delete(wsId);
  }

  static markDirty(docName: string): void {
    dirtyDocs.set(docName, true);
  }

  static clearDirty(docName: string): void {
    dirtyDocs.delete(docName);
  }

  static isDirty(docName: string): boolean {
    return dirtyDocs.get(docName) || false;
  }

  static scheduleCleanup(docName: string): void {
    const timeout = setTimeout(() => {
      CollaborationService.cleanupDoc(docName);
    }, 30000); // 30 seconds
    cleanupTimeouts.set(docName, timeout);
  }

  static clearCleanupTimeout(docName: string): void {
    const timeout = cleanupTimeouts.get(docName);
    if (timeout) {
      clearTimeout(timeout);
      cleanupTimeouts.delete(docName);
    }
  }

  static async cleanupDoc(docName: string) {
    const connections = docConnections.get(docName);
    if (connections && connections.size === 0) {
      console.log(`Cleaning up doc ${docName}`);
      docsMap.delete(docName);
      awarenessMap.delete(docName);
      loadedRooms.delete(docName);
      dirtyDocs.delete(docName);
      cleanupTimeouts.delete(docName);
    }
  }

  static async loadDoc(docName: string, doc: Doc): Promise<void> {
    let existingPromise = loadingPromises.get(docName);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = CollaborationService.doLoadDoc(docName, doc);
    loadingPromises.set(docName, loadPromise);

    try {
      await loadPromise;
    } finally {
      loadingPromises.delete(docName);
    }
  }

  static async doLoadDoc(docName: string, doc: Doc): Promise<void> {
    try {
      const result = await db
        .select()
        .from(docs)
        .where(eq(docs.roomId, docName))
        .limit(1);
      const row = result[0];
      if (row?.data) {
        const binary = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
        Y.applyUpdate(doc, binary);
        console.log(`Loaded persisted state for room ${docName}`);
      } else {
        console.log(`No persisted state found for room ${docName}`);
      }
    } catch (error) {
      console.error(`Failed to load doc ${docName}:`, error);
    }
  }

  static async persistDoc(docName: string): Promise<void> {
    const doc = docsMap.get(docName);
    if (!doc || !CollaborationService.isDirty(docName)) return;

    try {
      const update = Y.encodeStateAsUpdate(doc);
      const data = btoa(String.fromCharCode(...Array.from(update)));
      const version = update.length;

      await db
        .update(docs)
        .set({
          data,
          version,
          updatedAt: new Date(),
        })
        .where(eq(docs.roomId, docName));
      CollaborationService.clearDirty(docName);
    } catch (error) {
      console.error(`Failed to persist doc ${docName}:`, error);
    }
  }

  static async persistAll(): Promise<void> {
    const persistPromises = Array.from(dirtyDocs.keys()).map((docName) =>
      CollaborationService.persistDoc(docName),
    );
    await Promise.allSettled(persistPromises);
  }

  static kickoffLoad(docName: string): void {
    CollaborationService.ensureLoaded(docName).catch((error) => {
      console.error(`Failed to kick off load for ${docName}:`, error);
    });
  }

  static initPersistence(): void {
    // Persist all dirty docs every 30 seconds
    setInterval(() => {
      CollaborationService.persistAll().catch((error) => {
        console.error("Failed to persist docs:", error);
      });
    }, 30000);

    // Persist on process exit
    process.on("SIGINT", async () => {
      console.log("SIGINT: Persisting all docs...");
      await CollaborationService.persistAll();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("SIGTERM: Persisting all docs...");
      await CollaborationService.persistAll();
      process.exit(0);
    });
  }
}
