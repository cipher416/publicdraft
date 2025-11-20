import { Awareness } from "y-protocols/awareness";
import { Doc } from "yjs";
import type { ConnectionInfo } from "./types";

// Document storage
const docs = new Map<string, Doc>();
const awarenessMap = new Map<string, Awareness>();

// Connection tracking: docName -> (userId -> ws)
const docConnections = new Map<string, Map<string, any>>();

// Reverse mapping: ws.id -> connection info
const wsToConnection = new Map<string, ConnectionInfo>();

export function getOrCreateDoc(docName: string): Doc {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Doc();
    docs.set(docName, doc);
    awarenessMap.set(docName, new Awareness(doc));
  }
  return doc;
}

export function getAwareness(docName: string): Awareness | undefined {
  return awarenessMap.get(docName);
}

export function cleanupDoc(docName: string): void {
  const doc = docs.get(docName);
  if (doc) {
    doc.destroy();
    docs.delete(docName);
  }
  awarenessMap.delete(docName);
  console.log(`Cleaned up document: ${docName}`);
}

export function getDocConnections(docName: string): Map<string, any> | undefined {
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
