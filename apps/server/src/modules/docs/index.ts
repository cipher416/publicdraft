import { Elysia } from "elysia";
import { AuthService } from "../auth/service";
import { DocsModel } from "./model";
import { DocsService } from "./service";

export const docs = new Elysia({ prefix: "/docs" })
  .get("/", async () => {
    return await DocsService.getAll();
  })
  .get(
    "/:docId",
    async ({ params }) => {
      return await DocsService.getById(params.docId);
    },
    {
      params: DocsModel.params,
    },
  )
  .post(
    "/",
    async ({ body, request }) => {
      const session = await AuthService.requireAuth(request);
      return await DocsService.create(body, session.user.id);
    },
    {
      body: DocsModel.createBody,
    },
  )
  .delete(
    "/:docId",
    async ({ params, request }) => {
      await AuthService.requireAuth(request);
      return await DocsService.delete(params.docId);
    },
    {
      params: DocsModel.params,
    },
  );
