import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

export async function requireSessionBeforeLoad() {
  const session = await authClient.getSession();

  if (!session.data) {
    redirect({
      to: "/auth/$authView",
      params: {
        authView: "sign-in",
      },
      throw: true,
    });
  }

  return { session };
}

export async function redirectIfAuthenticatedBeforeLoad({
  params,
}: {
  params: { authView: string };
}) {
  const publicAuthViews = new Set(["sign-in", "register"]);

  if (!publicAuthViews.has(params.authView)) {
    return {};
  }

  const session = await authClient.getSession();

  if (session.data) {
    redirect({
      to: "/",
      throw: true,
    });
  }

  return { session };
}
