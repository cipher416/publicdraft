import { t } from "elysia";

export namespace DocsModel {
  export const params = t.Object({
    roomId: t.String(),
  });

  export type params = typeof params.static;

  export const createBody = t.Object({
    roomId: t.String(),
    title: t.Optional(t.String()),
    data: t.String(),
  });

  export type createBody = typeof createBody.static;

  export const response = t.Object({
    success: t.Literal(true),
    data: t.Any(),
  });

  export type response = typeof response.static;

  export const errorResponse = t.Object({
    success: t.Literal(false),
    error: t.String(),
  });

  export type errorResponse = typeof errorResponse.static;
}