export interface ConnectionInfo {
  docName: string;
  userId: string;
  awarenessClientIds: Set<number>;
}

export interface CollaborationSocket {
  id: string;
  data?: {
    params?: { docName?: string };
    headers?: Record<string, string | undefined>;
  };
  sendBinary(data: Uint8Array | ArrayBuffer | Buffer): void;
  close(code?: number, reason?: string): void;
}
