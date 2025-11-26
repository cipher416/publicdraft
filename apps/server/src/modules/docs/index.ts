import { Elysia } from "elysia";
import { AuthService } from "../auth/service";
import { DocsModel } from "./model";
import { DocsService } from "./service";

export const docs = new Elysia({ prefix: "/docs" })
  .get("/", async () => {
    const data = await DocsService.getAll();
    return { data };
  })
  .get(
    "/:roomId",
    async ({ params }) => {
      const doc = await DocsService.getById(params.roomId);
      return { success: true as const, data: doc };
    },
    {
      params: DocsModel.params,
    },
  )
  .post(
    "/",
    async ({ body, request }) => {
      const session = await AuthService.requireAuth(request);
      const newDoc = await DocsService.create(body, session.user.id);
      return { success: true as const, data: newDoc[0] };
    },
    {
      body: DocsModel.createBody,
    },
  )
  .delete(
    "/:roomId",
    async ({ params, request }) => {
      await AuthService.requireAuth(request);
      const deletedDoc = await DocsService.delete(params.roomId);
      return { success: true as const, data: deletedDoc };
    },
    {
      params: DocsModel.params,
    },
  );
