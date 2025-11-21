import { Elysia } from "elysia";
import { DocsService } from "./service";
import { AuthService } from "../auth/service";
import { DocsModel } from "./model";

export const docs = new Elysia({ prefix: "/docs" })
  .get("/", async () => {
    const allDocs = await DocsService.getAll();
    return { success: true as const, data: allDocs };
  }, {
    response: {
      200: DocsModel.response,
      500: DocsModel.errorResponse,
    },
  })
  .get("/:roomId", async ({ params }) => {
    const doc = await DocsService.getById(params.roomId);
    return { success: true as const, data: doc };
  }, {
    params: DocsModel.params,
    response: {
      200: DocsModel.response,
      404: DocsModel.errorResponse,
      500: DocsModel.errorResponse,
    },
  })
  .post("/", async ({ body, request }) => {
    const session = await AuthService.requireAuth(request);
    const newDoc = await DocsService.create(body, session.user.id);
    return { success: true as const, data: newDoc[0] };
  }, {
    body: DocsModel.createBody,
    response: {
      200: DocsModel.response,
      401: DocsModel.errorResponse,
      500: DocsModel.errorResponse,
    },
  })
  .delete("/:roomId", async ({ params, request }) => {
    await AuthService.requireAuth(request);
    const deletedDoc = await DocsService.delete(params.roomId);
    return { success: true as const, data: deletedDoc };
  }, {
    params: DocsModel.params,
    response: {
      200: DocsModel.response,
      401: DocsModel.errorResponse,
      404: DocsModel.errorResponse,
      500: DocsModel.errorResponse,
    },
  });