import { db, eq } from "@publicdraft/db";
import { docs } from "@publicdraft/db/schema/docs";
import { status } from "elysia";
import type { DocsModel } from "./model";

export abstract class DocsService {
  static async getAll() {
    try {
      return await db.select().from(docs);
    } catch (error) {
      throw status(500, "Failed to fetch documents");
    }
  }

  static async getById(roomId: string) {
    try {
      const doc = await db
        .select()
        .from(docs)
        .where(eq(docs.roomId, roomId))
        .limit(1);

      if (doc.length === 0) {
        throw status(404, "Document not found");
      }

      return doc[0];
    } catch (error) {
      if (error instanceof Response) throw error;
      throw status(500, "Failed to fetch document");
    }
  }

  static async create(input: DocsModel.createBody, createdBy: string) {
    try {
      return await db
        .insert(docs)
        .values({
          roomId: input.roomId,
          title: input.title || "Untitled Document",
          data: input.data,
          createdBy,
        })
        .returning();
    } catch (error) {
      throw status(500, "Failed to create document");
    }
  }

  static async delete(roomId: string) {
    try {
      const deletedDoc = await db
        .delete(docs)
        .where(eq(docs.roomId, roomId))
        .returning();

      if (deletedDoc.length === 0) {
        throw status(404, "Document not found");
      }

      return deletedDoc[0];
    } catch (error) {
      if (error instanceof Response) throw error;
      throw status(500, "Failed to delete document");
    }
  }
}
