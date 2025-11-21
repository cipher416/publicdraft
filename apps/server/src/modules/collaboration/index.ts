import { Elysia } from "elysia";
import { CollaborationHandlers } from "./handlers";
import { CollaborationService } from "./service";

export const collaboration = new Elysia({ name: "collaboration" })
  .decorate("collaboration", {
    handlers: CollaborationHandlers,
    service: CollaborationService,
  });