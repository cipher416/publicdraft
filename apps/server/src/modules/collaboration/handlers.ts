import { createDecoder, readVarUint, readVarUint8Array } from "lib0/decoding";
import {
  createEncoder,
  length,
  toUint8Array,
  writeVarUint,
  writeVarUint8Array,
} from "lib0/encoding";
import { applyAwarenessUpdate } from "y-protocols/awareness";
import { readSyncMessage } from "y-protocols/sync";
import { MESSAGE_AWARENESS, MESSAGE_SYNC } from "./constants";
import { CollaborationService } from "./service";

export abstract class CollaborationHandlers {
  static broadcastUpdate(
    docName: string,
    message: Uint8Array,
    excludeUserId?: string,
  ): void {
    const connections = CollaborationService.getDocConnections(docName);
    if (!connections) return;

    console.log(
      `Broadcasting to ${connections.size} connections, excluding userId ${excludeUserId}`,
    );

    for (const [userId, ws] of connections) {
      if (userId !== excludeUserId) {
        ws.sendBinary(Buffer.from(message));
      }
    }
  }

  static handleMessage(
    docName: string,
    message: Uint8Array,
    ws: any,
    userId: string,
  ): void {
    try {
      const doc = CollaborationService.getOrCreateDoc(docName);
      const awareness = CollaborationService.getAwareness(docName);
      if (!awareness) return;

      const decoder = createDecoder(message);
      const messageType = readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const encoder = createEncoder();
          writeVarUint(encoder, MESSAGE_SYNC);
          const syncMessageType = readSyncMessage(decoder, encoder, doc, null);
          console.log(
            `Sync message type: ${syncMessageType}, encoder length: ${length(encoder)}`,
          );

          if (length(encoder) > 1) {
            console.log(`Sending sync response to userId ${userId}`);
            ws.sendBinary(Buffer.from(toUint8Array(encoder)));
          }

          if (syncMessageType === 2) {
            CollaborationService.markDirty(docName);
            CollaborationHandlers.broadcastUpdate(docName, message, userId);
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          const update = readVarUint8Array(decoder);

          // Extract client IDs from the awareness update and track them
          const updateDecoder = createDecoder(update);
          const len = readVarUint(updateDecoder);
          for (let i = 0; i < len; i++) {
            const clientId = readVarUint(updateDecoder);
            // Track this client ID for cleanup on disconnect
            const connection = CollaborationService.getConnectionInfo(ws.id);
            if (connection) {
              connection.awarenessClientIds.add(clientId);
            }
            // Skip the rest of the update data for this client
            readVarUint(updateDecoder); // clock
            readVarUint8Array(updateDecoder); // state
          }

          applyAwarenessUpdate(awareness, update, ws);

          // Broadcast awareness to other clients
          const awarenessEncoder = createEncoder();
          writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
          writeVarUint8Array(awarenessEncoder, update);
          CollaborationHandlers.broadcastUpdate(
            docName,
            toUint8Array(awarenessEncoder),
            userId,
          );
          break;
        }
      }
    } catch (error) {
      console.error(`Error handling message for ${docName}:`, error);
    }
  }
}
