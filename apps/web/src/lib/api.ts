import { edenTreaty } from "@elysiajs/eden";
import type { App } from "server";

const baseUrl = import.meta.env.VITE_SERVER_URL;

if (!baseUrl) {
  throw new Error("VITE_SERVER_URL is not set");
}

export const api = edenTreaty<App>(baseUrl, {
  $fetch: {
    credentials: "include",
  },
});
